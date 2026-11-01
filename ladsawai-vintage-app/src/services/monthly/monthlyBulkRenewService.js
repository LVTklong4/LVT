import { supabase } from '@/lib/supabase';
import { parseNumber } from '@/utils/numberHelper';
import { monthNamesFull, formatBookingMonth } from '@/utils/thaiDateHelper';
import { calculateStallDayPrice } from './monthlyPricingService';
import { checkConflictingBookings } from './monthlyOperationsService';

/**
 * Computes next Thai month string from given "Month Year" format (e.g. "กรกฎาคม 2569" -> "สิงหาคม 2569")
 */
export function computeNextMonthThai(monthYearStr) {
  if (!monthYearStr) return '';
  const parts = monthYearStr.split(' ');
  if (parts.length < 2) return '';
  const monthsMap = {
    'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
    'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
    'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
  };
  const mIdx = monthsMap[parts[0]];
  const yearCE = parseInt(parts[1]) - 543;
  if (mIdx === undefined || isNaN(yearCE)) return '';

  const nextDate = new Date(yearCE, mIdx + 1, 1);
  return `${monthNamesFull[nextDate.getMonth()]} ${nextDate.getFullYear() + 543}`;
}

/**
 * Generates an identity key for customer deduplication.
 */
export function getCustomerIdentityKey(item) {
  if (!item) return '';
  const name = (item.booker_name || item.customer_name || '').trim().toLowerCase();
  const phone = String(item.phone || '').replace(/[\s-]/g, '').trim();
  const product = (item.product || '').trim().toLowerCase();

  if (!name || name === 'ไม่ระบุชื่อ' || name === 'ร้านค้าประจำ' || name === '-') {
    return `UNIQUE_${item.id || Math.random()}`;
  }

  if (phone && phone !== '-' && phone !== '0' && phone.length >= 8) {
    return `${name}__PHONE__${phone}`;
  }

  if (product && product !== '-') {
    return `${name}__PROD__${product}`;
  }

  return `${name}__NAMEONLY`;
}

/**
 * Helper to build a Map of stallName -> Set of days of week (0=Sun, 3=Wed, 5=Fri, 6=Sat)
 * for a monthly contract, checking stall_details first, with fallback to stalls string.
 */
export function getStallDaysMapFromContract(contract) {
  const map = new Map();
  let details = [];
  try {
    const raw = contract?.stall_details || '[]';
    details = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {}

  if (Array.isArray(details) && details.length > 0) {
    details.forEach(item => {
      const cleanName = (item.name || '').replace(/[\[\]]/g, '').trim();
      if (!cleanName) return;
      const days = Array.isArray(item.days) ? item.days : [];
      if (!map.has(cleanName)) {
        map.set(cleanName, new Set(days));
      } else {
        days.forEach(d => map.get(cleanName).add(d));
      }
    });
  } else {
    const stallNames = (contract?.stalls || '').split(',').map(s => s.replace(/[\[\]]/g, '').trim()).filter(Boolean);
    const fallbackDays = [0, 3, 5, 6];
    stallNames.forEach(s => {
      map.set(s, new Set(fallbackDays));
    });
  }

  return map;
}

/**
 * Checks whether requestedStallDaysMap overlaps with existingContract on any stall on the SAME day of the week
 * in the same targetMonthFormatted.
 */
export function checkMonthlyContractDaysConflict(requestedStallDaysMap, existingContract, targetMonthFormatted) {
  if (formatBookingMonth(existingContract.booking_month) !== targetMonthFormatted) {
    return null;
  }

  const existingDaysMap = getStallDaysMapFromContract(existingContract);

  for (const [stallName, reqDaysSet] of requestedStallDaysMap.entries()) {
    if (existingDaysMap.has(stallName)) {
      const existDaysSet = existingDaysMap.get(stallName);
      const overlappingDays = [];

      reqDaysSet.forEach(dayNum => {
        if (existDaysSet.has(dayNum)) {
          overlappingDays.push(dayNum);
        }
      });

      if (overlappingDays.length > 0) {
        const thaiDays = overlappingDays.map(d => {
          if (d === 0) return 'วันอาทิตย์';
          if (d === 3) return 'วันพุธ';
          if (d === 5) return 'วันศุกร์';
          if (d === 6) return 'วันเสาร์';
          return `วัน ${d}`;
        }).join(', ');

        return {
          stallName,
          thaiDays,
          conflictingBooker: existingContract.booker_name || 'ผู้เช่าอื่น'
        };
      }
    }
  }

  return null;
}

/**
 * Renews a single monthly contract to the subsequent month.
 */
export async function renewSingleMonthlyBooking({ activeMonthlyBooking, stallsMaster = [] }) {
  if (!activeMonthlyBooking) throw new Error("ไม่พบข้อมูลสัญญาที่ต้องการต่อ");

  const currentStartDateStr = activeMonthlyBooking.start_date || '2026-07-01';
  const parts = currentStartDateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;

  const nextDate = new Date(year, month + 1, 1);
  const nextYear = nextDate.getFullYear();
  const nextMonthVal = nextDate.getMonth();
  const nextStartDateStr = `${nextYear}-${String(nextMonthVal + 1).padStart(2, '0')}-01`;

  const nextDateThai = new Date(year + 543, month + 1, 1);
  const nextBookingMonthStr = nextDateThai.toString();
  const nextMonthFormatted = formatBookingMonth(nextBookingMonthStr);

  // Safety check: Check if already exists in next month specifically
  const activeKey = getCustomerIdentityKey(activeMonthlyBooking);
  const targetMonthFormatted = formatBookingMonth(nextBookingMonthStr);
  const nextLastDay = new Date(nextYear, nextMonthVal + 1, 0).getDate();
  const nextEndDateStr = `${nextYear}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(nextLastDay).padStart(2, '0')}`;

  const { data: allMonthlyData, error: existError } = await supabase
    .from('monthly_bookings')
    .select('id, booking_month, stalls, stall_details, booker_name, phone, product')
    .gte('start_date', nextStartDateStr)
    .lte('start_date', nextEndDateStr);
  if (existError) throw existError;

  // Parse stall details early for pre-validation
  const details = JSON.parse(activeMonthlyBooking.stall_details || '[]');
  const requestedStalls = details.map(d => (d.name || '').replace(/[\[\]]/g, '').trim()).filter(Boolean);

  const isAlreadyExists = (allMonthlyData || []).some(cand => {
    if (formatBookingMonth(cand.booking_month) !== targetMonthFormatted) return false;
    return getCustomerIdentityKey(cand) === activeKey && cand.stalls === activeMonthlyBooking.stalls;
  });

  if (isAlreadyExists) {
    throw new Error(`ผู้เช่า "${activeMonthlyBooking.booker_name}" (${activeMonthlyBooking.product || 'ไม่มีสินค้า'}, ล็อค ${activeMonthlyBooking.stalls}) ได้ต่อสัญญารอบเดือน ${nextMonthFormatted} ไว้แล้ว`);
  }

  // 1. Strict Per-Stall & Per-Day Conflict Check in monthly_bookings (prevent taking the same stall on the same selling days)
  const requestedStallDaysMap = getStallDaysMapFromContract(activeMonthlyBooking);
  let conflictInfo = null;
  for (const cand of (allMonthlyData || [])) {
    if (cand.id === activeMonthlyBooking.id) continue;
    conflictInfo = checkMonthlyContractDaysConflict(requestedStallDaysMap, cand, targetMonthFormatted);
    if (conflictInfo) break;
  }

  if (conflictInfo) {
    throw new Error(`ไม่สามารถต่อสัญญาได้: ล็อค ${conflictInfo.stallName} (${conflictInfo.thaiDays}) ในรอบเดือน ${nextMonthFormatted} มีสัญญาของ คุณ ${conflictInfo.conflictingBooker} อยู่แล้ว`);
  }

  // Generate daily rows with high-entropy collision-free ID
  const newBookingId = `BK-${String(nextYear).substr(-2)}${String(nextMonthVal + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
  const lastDay = new Date(nextYear, nextMonthVal + 1, 0).getDate();
  const dailyBookings = [];
  const timestamp = new Date().toISOString();

  const allDays = new Set();
  details.forEach(st => {
    if (st.days) st.days.forEach(dayVal => allDays.add(dayVal));
  });
  const isFullPackage = allDays.has(0) && allDays.has(3) && allDays.has(6);
  const isRegular = activeMonthlyBooking.customer_type === 'Regular';
  const dailyType = isRegular ? 'ประจำ' : 'รายเดือน';

  for (let d = 1; d <= lastDay; d++) {
    const currentD = new Date(nextYear, nextMonthVal, d);
    const dayOfWeek = currentD.getDay();

    details.forEach(stallDetail => {
      const myDays = stallDetail.days || [];
      if (myDays.includes(dayOfWeek)) {
        const stallName = stallDetail.name;
        const sMaster = stallsMaster.find(s => s.name === stallName);
        let price = calculateStallDayPrice(sMaster, dayOfWeek, activeMonthlyBooking.customer_type, isFullPackage);
        if (isRegular) price = 0;

        const dateStr = `${nextYear}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const uniqueDailyId = `${newBookingId}-${dateStr}-${stallName.replace(/[\[\]]/g, '')}`;

        dailyBookings.push({
          id: uniqueDailyId,
          date: dateStr,
          stall_name: stallName,
          booker_name: activeMonthlyBooking.booker_name,
          customer_name: activeMonthlyBooking.booker_name,
          product: activeMonthlyBooking.product,
          type: dailyType,
          elec_unit: parseNumber(activeMonthlyBooking.elec_unit || 0),
          elec_price: parseNumber(activeMonthlyBooking.elec_unit || 0) * 10,
          stall_price: price,
          total_price: price + (parseNumber(activeMonthlyBooking.elec_unit || 0) * 10),
          payment_method: 'Cash',
          status: 'ค้างชำระ',
          note: isRegular ? 'ต่ออายุล็อคประจำ' : 'ต่ออายุอัตโนมัติ',
          storage_fee: parseNumber(activeMonthlyBooking.storage_fee || 0),
          master_id: newBookingId
        });
      }
    });
  }

  // 2. Strict Conflict Check in daily bookings table (prevent overlap with any existing booking)
  const { conflictMsg } = await checkConflictingBookings(dailyBookings, requestedStalls);
  if (conflictMsg) {
    throw new Error(`ไม่สามารถต่อสัญญาได้เนื่องจากแผงค้าไม่ว่างในรอบเดือน ${nextMonthFormatted}:\n\n${conflictMsg}`);
  }

  if (dailyBookings.length > 0) {
    const { error: dbError } = await supabase.from('bookings').insert(dailyBookings);
    if (dbError) throw dbError;
  }

  const rentTotal = dailyBookings.reduce((sum, b) => sum + b.stall_price, 0);
  const totalElecCharged = Array.from(new Set(dailyBookings.map(b => b.date))).length;
  const totalElecPrice = totalElecCharged * (parseNumber(activeMonthlyBooking.elec_unit || 0) * 10);
  const storageFeeVal = parseNumber(activeMonthlyBooking.storage_fee || 0);

  let monthlyTotal = rentTotal + totalElecPrice + storageFeeVal;
  let monthlyStatus = 'ค้างชำระ';
  if (activeMonthlyBooking.customer_type === 'Regular') {
    monthlyTotal = 0;
    monthlyStatus = 'ชำระรายวัน';
  } else if (activeMonthlyBooking.customer_type === 'VIP' || activeMonthlyBooking.customer_type === 'Room') {
    monthlyTotal = parseNumber(activeMonthlyBooking.total_price);
    monthlyStatus = 'ค้างชำระ';
  }

  const monthlyData = {
    id: newBookingId,
    timestamp: timestamp,
    start_date: nextStartDateStr,
    booker_name: activeMonthlyBooking.booker_name,
    customer_name: activeMonthlyBooking.booker_name,
    stalls: activeMonthlyBooking.stalls,
    product: activeMonthlyBooking.product,
    status: monthlyStatus,
    elec_unit: activeMonthlyBooking.elec_unit,
    total_price: monthlyTotal,
    paid_amount: 0,
    note: `ต่ออายุอัตโนมัติ [${activeMonthlyBooking.customer_type || 'Standard'}]`,
    payment_method: 'Cash',
    selected_days: activeMonthlyBooking.selected_days,
    booking_month: nextBookingMonthStr,
    phone: activeMonthlyBooking.phone,
    stall_details: activeMonthlyBooking.stall_details,
    customer_type: activeMonthlyBooking.customer_type || 'Standard',
    storage_fee: storageFeeVal,
    renewal_status: ''
  };

  const { error: mbError } = await supabase.from('monthly_bookings').insert([monthlyData]);
  if (mbError) throw mbError;

  return { newBookingId, nextMonthFormatted };
}

/**
 * Bulk renews selected monthly contracts into the next month.
 */
export async function renewBulkMonthlyBookings({
  bulkRenewCheckedIds = [],
  monthlyList = [],
  bulkRenewEditData = {},
  stallsMaster = []
}) {
  if (bulkRenewCheckedIds.length === 0) {
    throw new Error("กรุณาเลือกผู้เช่าที่ต้องการต่อสัญญาอย่างน้อย 1 ราย");
  }

  let successCount = 0;
  let skippedCount = 0;
  const conflictErrors = [];

  // 1. Determine target month window from first checked item
  const firstOldId = bulkRenewCheckedIds[0];
  const firstItem = monthlyList.find(b => b.id === firstOldId);
  const refParts = firstItem?.start_date ? firstItem.start_date.split('-') : ['2026', '10', '01'];
  const refYear = parseInt(refParts[0]);
  const refMonth = parseInt(refParts[1]) - 1;
  const refNextDate = new Date(refYear, refMonth + 1, 1);
  const targetYear = refNextDate.getFullYear();
  const targetMonthVal = refNextDate.getMonth();
  const targetStartDateStr = `${targetYear}-${String(targetMonthVal + 1).padStart(2, '0')}-01`;
  const targetLastDay = new Date(targetYear, targetMonthVal + 1, 0).getDate();
  const targetEndDateStr = `${targetYear}-${String(targetMonthVal + 1).padStart(2, '0')}-${String(targetLastDay).padStart(2, '0')}`;

  // 2. Fetch all existing bookings specifically for target month without 1000 limit issue
  const { data: targetMonthRecords, error: existError } = await supabase
    .from('monthly_bookings')
    .select('id, booker_name, phone, product, stalls, booking_month, start_date')
    .gte('start_date', targetStartDateStr)
    .lte('start_date', targetEndDateStr);
  if (existError) throw existError;

  const dynamicMonthlyList = [...(targetMonthRecords || [])];

  // 3. Fetch existing IDs to guarantee 100% collision-free new IDs
  const { data: allIds } = await supabase.from('monthly_bookings').select('id');
  const existingIdSet = new Set((allIds || []).map(r => r.id));

  const generateUniqueBookingId = (year, monthVal) => {
    const prefix = `BK-${String(year).substr(-2)}${String(monthVal + 1).padStart(2, '0')}`;
    let candidate = '';
    let attempts = 0;
    do {
      attempts++;
      const randPart = `${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
      candidate = `${prefix}-${randPart}`;
    } while (existingIdSet.has(candidate) && attempts < 100);
    existingIdSet.add(candidate);
    return candidate;
  };

  for (const oldId of bulkRenewCheckedIds) {
    const item = monthlyList.find(b => b.id === oldId);
    if (!item) continue;

    const parts = item.start_date ? item.start_date.split('-') : ['2026', '07', '01'];
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;

    const nextDate = new Date(year, month + 1, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonthVal = nextDate.getMonth();
    const nextStartDateStr = `${nextYear}-${String(nextMonthVal + 1).padStart(2, '0')}-01`;

    const nextDateThai = new Date(year + 543, month + 1, 1);
    const nextBookingMonthStr = nextDateThai.toString();
    const targetMonthFormatted = formatBookingMonth(nextBookingMonthStr);

    const itemKey = getCustomerIdentityKey(item);

    const isAlreadyExists = dynamicMonthlyList.some(mb => {
      if (formatBookingMonth(mb.booking_month) !== targetMonthFormatted) return false;
      return getCustomerIdentityKey(mb) === itemKey && mb.stalls === item.stalls;
    });

    if (isAlreadyExists) {
      skippedCount++;
      continue;
    }

    const customEdit = bulkRenewEditData[oldId] || {};
    const bookerName = customEdit.booker_name !== undefined ? customEdit.booker_name : item.booker_name;
    const customerType = customEdit.customer_type || item.customer_type || 'Standard';
    const product = customEdit.product !== undefined ? customEdit.product : item.product || '';
    const phone = customEdit.phone !== undefined ? customEdit.phone : item.phone || '';
    const note = customEdit.note !== undefined ? customEdit.note : item.note || '';
    const storageFeeVal = customEdit.storage_fee !== undefined ? parseNumber(customEdit.storage_fee) : parseNumber(item.storage_fee || 0);
    const elecUnitVal = customEdit.elec_unit !== undefined ? parseNumber(customEdit.elec_unit) : parseNumber(item.elec_unit || 0);

    let selectedDays = item.selected_days;
    let stallDetailsStr = item.stall_details;

    if (customEdit.selected_days) selectedDays = customEdit.selected_days;
    if (customEdit.stall_details) stallDetailsStr = customEdit.stall_details;

    const newBookingId = generateUniqueBookingId(nextYear, nextMonthVal);
    const lastDay = new Date(nextYear, nextMonthVal + 1, 0).getDate();
    const dailyBookings = [];

    let details = [];
    try {
      details = JSON.parse(stallDetailsStr || '[]');
    } catch (e) {}

    const requestedStalls = details.map(d => (d.name || '').replace(/[\[\]]/g, '').trim()).filter(Boolean);

    // 1. Strict Per-Stall & Per-Day Conflict Check in monthly contracts (including already renewed in this batch)
    const currentContractProxy = {
      stalls: item.stalls,
      stall_details: stallDetailsStr
    };
    const requestedStallDaysMap = getStallDaysMapFromContract(currentContractProxy);

    let conflictInfo = null;
    for (const mb of dynamicMonthlyList) {
      if (mb.id === item.id) continue;
      conflictInfo = checkMonthlyContractDaysConflict(requestedStallDaysMap, mb, targetMonthFormatted);
      if (conflictInfo) break;
    }

    if (conflictInfo) {
      skippedCount++;
      conflictErrors.push(`ล็อค ${conflictInfo.stallName} (${conflictInfo.thaiDays}) [คุณ ${bookerName}]: มีสัญญาของ คุณ ${conflictInfo.conflictingBooker} อยู่แล้วในรอบเดือน`);
      continue;
    }

    const allDays = new Set();
    details.forEach(st => {
      if (st.days) st.days.forEach(dayVal => allDays.add(dayVal));
    });
    const isFullPackage = allDays.has(0) && allDays.has(3) && allDays.has(6);

    for (let d = 1; d <= lastDay; d++) {
      const currentD = new Date(nextYear, nextMonthVal, d);
      const dayOfWeek = currentD.getDay();

      details.forEach(stallDetail => {
        const myDays = stallDetail.days || [];
        if (myDays.includes(dayOfWeek)) {
          const stallName = stallDetail.name;
          const sMaster = stallsMaster.find(s => s.name === stallName);
          let price = calculateStallDayPrice(sMaster, dayOfWeek, customerType, isFullPackage);
          const isRegular = customerType === 'Regular';
          const dailyType = isRegular ? 'ประจำ' : 'รายเดือน';
          if (customerType === 'VIP' || customerType === 'Room' || isRegular) price = 0;

          const dateStr = `${nextYear}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const uniqueDailyId = `${newBookingId}-${dateStr}-${stallName.replace(/[\[\]]/g, '')}`;

          dailyBookings.push({
            id: uniqueDailyId,
            date: dateStr,
            stall_name: stallName,
            booker_name: bookerName,
            customer_name: bookerName,
            product: product,
            type: dailyType,
            elec_unit: elecUnitVal,
            elec_price: elecUnitVal * 10,
            stall_price: price,
            total_price: price + (elecUnitVal * 10),
            payment_method: 'Cash',
            status: 'ค้างชำระ',
            note: isRegular ? 'ต่ออายุล็อคประจำ (กลุ่ม)' : 'ต่ออายุอัตโนมัติ (กลุ่ม)',
            storage_fee: storageFeeVal,
            master_id: newBookingId
          });
        }
      });
    }

    const rentTotal = dailyBookings.reduce((sum, b) => sum + b.stall_price, 0);
    const totalElecCharged = Array.from(new Set(dailyBookings.map(b => b.date))).length;
    const totalElecPrice = totalElecCharged * (elecUnitVal * 10);

    let monthlyTotal = rentTotal + totalElecPrice + storageFeeVal;
    let monthlyStatus = 'ค้างชำระ';
    if (customerType === 'Regular') {
      monthlyTotal = 0;
      monthlyStatus = 'ชำระรายวัน';
    } else if (customerType === 'VIP' || customerType === 'Room') {
      monthlyTotal = customEdit.total_price !== undefined ? parseNumber(customEdit.total_price) : parseNumber(item.total_price || 0);
      monthlyStatus = 'ค้างชำระ';
    }

    const stallsString = details.map(d => d.name).join(', ');

    const monthlyData = {
      id: newBookingId,
      timestamp: new Date().toISOString(),
      start_date: nextStartDateStr,
      booker_name: bookerName,
      customer_name: bookerName,
      stalls: stallsString,
      product: product,
      status: monthlyStatus,
      elec_unit: elecUnitVal,
      total_price: monthlyTotal,
      paid_amount: 0,
      note: note.trim() || `ต่ออายุอัตโนมัติแบบกลุ่ม [${customerType}]`,
      payment_method: 'Cash',
      selected_days: selectedDays,
      booking_month: nextBookingMonthStr,
      phone: String(phone || '').replace(/\s|-/g, ''),
      stall_details: stallDetailsStr,
      customer_type: customerType,
      storage_fee: storageFeeVal,
      renewal_status: ''
    };

    // 2. Strict Conflict Check in daily bookings table (prevent overlap with any existing booking)
    const { conflictMsg } = await checkConflictingBookings(dailyBookings, requestedStalls);
    if (conflictMsg) {
      skippedCount++;
      conflictErrors.push(`ล็อค ${item.stalls} (${bookerName}): มีการจองซ้อนในวันขาย`);
      continue;
    }

    try {
      if (dailyBookings.length > 0) {
        const { error: dbError } = await supabase.from('bookings').insert(dailyBookings);
        if (dbError) throw dbError;
      }

      const { error: mbError } = await supabase.from('monthly_bookings').insert([monthlyData]);
      if (mbError) {
        await supabase.from('bookings').delete().eq('master_id', newBookingId);
        throw mbError;
      }

      dynamicMonthlyList.push(monthlyData);
      successCount++;
    } catch (insertErr) {
      console.error(`Error inserting renewed booking ${newBookingId} for ${bookerName}:`, insertErr);
      await supabase.from('bookings').delete().eq('master_id', newBookingId);
      throw insertErr;
    }
  }

  return { successCount, skippedCount, conflictErrors };
}
