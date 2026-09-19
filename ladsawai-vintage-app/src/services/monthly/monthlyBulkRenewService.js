import { supabase } from '@/lib/supabase';
import { parseNumber } from '@/utils/numberHelper';
import { monthNamesFull, formatBookingMonth } from '@/utils/thaiDateHelper';
import { calculateStallDayPrice } from './monthlyPricingService';

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

  // Safety check: Check if already exists in next month
  const activeKey = getCustomerIdentityKey(activeMonthlyBooking);
  const targetMonthFormatted = formatBookingMonth(nextBookingMonthStr);

  const { data: allMonthlyData, error: existError } = await supabase
    .from('monthly_bookings')
    .select('booking_month, stalls, booker_name, phone, product');
  if (existError) throw existError;

  const isAlreadyExists = (allMonthlyData || []).some(cand => {
    if (formatBookingMonth(cand.booking_month) !== targetMonthFormatted) return false;
    return getCustomerIdentityKey(cand) === activeKey && cand.stalls === activeMonthlyBooking.stalls;
  });

  if (isAlreadyExists) {
    throw new Error(`ผู้เช่า "${activeMonthlyBooking.booker_name}" (${activeMonthlyBooking.product || 'ไม่มีสินค้า'}, ล็อค ${activeMonthlyBooking.stalls}) ได้ต่อสัญญารอบเดือน ${nextMonthFormatted} ไว้แล้ว`);
  }

  // Generate daily rows
  const newBookingId = `BK-${String(nextYear).substr(-2)}${String(nextMonthVal + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const lastDay = new Date(nextYear, nextMonthVal + 1, 0).getDate();
  const dailyBookings = [];
  const details = JSON.parse(activeMonthlyBooking.stall_details || '[]');
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

  const { data: latestMonthlyList, error: existError } = await supabase
    .from('monthly_bookings')
    .select('id, booker_name, phone, product, stalls, booking_month');
  if (existError) throw existError;

  const dynamicMonthlyList = [...(latestMonthlyList || [])];

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

    const newBookingId = `BK-${String(nextYear).substr(-2)}${String(nextMonthVal + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const lastDay = new Date(nextYear, nextMonthVal + 1, 0).getDate();
    const dailyBookings = [];

    let details = [];
    try {
      details = JSON.parse(stallDetailsStr || '[]');
    } catch (e) {}

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

    if (dailyBookings.length > 0) {
      const { error: dbError } = await supabase.from('bookings').insert(dailyBookings);
      if (dbError) throw dbError;
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

    const { error: mbError } = await supabase.from('monthly_bookings').insert([monthlyData]);
    if (mbError) throw mbError;

    dynamicMonthlyList.push(monthlyData);
    successCount++;
  }

  return { successCount, skippedCount };
}
