import { supabase } from '@/lib/supabase';
import { getModalDateFormat } from '@/utils/thaiDateHelper';
import { parseNumber } from '@/utils/numberHelper';
import { calculateStallDayPrice } from './monthlyPricingService';

/**
 * Checks if any daily bookings in the range conflict with existing bookings in Supabase.
 */
export async function checkConflictingBookings(dailyBookings, allStallNames, excludeMasterId = null) {
  if (!dailyBookings || dailyBookings.length === 0) return { conflictMsg: null, conflictCount: 0 };

  const datesToCheck = Array.from(new Set(dailyBookings.map(b => b.date)));
  const cleanStallNamesToCheck = allStallNames.map(s => s.replace(/[\[\]]/g, '').trim());

  let query = supabase
    .from('bookings')
    .select('date, stall_name, booker_name, status, master_id')
    .in('date', datesToCheck)
    .neq('status', 'ลา');

  if (excludeMasterId) {
    query = query.neq('master_id', excludeMasterId);
  }

  const { data: conflicts, error } = await query;
  if (error) throw error;

  const actualConflicts = [];
  if (conflicts && conflicts.length > 0) {
    conflicts.forEach(c => {
      const dbStalls = (c.stall_name || '').split(',').map(s => s.replace(/[\[\]]/g, '').trim());
      dbStalls.forEach(dbStall => {
        if (cleanStallNamesToCheck.includes(dbStall)) {
          const isConflict = dailyBookings.some(db => {
            const reqStall = db.stall_name.replace(/[\[\]]/g, '').trim();
            return db.date === c.date && reqStall === dbStall;
          });

          if (isConflict) {
            const formattedDate = getModalDateFormat(c.date);
            actualConflicts.push(`- วันที่ ${formattedDate}: ล็อค ${dbStall} (จองโดย คุณ ${c.booker_name})`);
          }
        }
      });
    });
  }

  if (actualConflicts.length > 0) {
    return {
      conflictMsg: `ไม่สามารถบันทึกการจองรายเดือนได้ เนื่องจากแผงค้าไม่ว่างในวันต่อไปนี้:\n\n` +
                   actualConflicts.join('\n') +
                   `\n\nกรุณาเลือกแผงค้าอื่นหรือเปลี่ยนวัน/รอบการจอง`,
      conflictCount: actualConflicts.length
    };
  }
  return { conflictMsg: null, conflictCount: 0 };
}

/**
 * Creates a new monthly booking along with all its daily booking rows.
 */
export async function createMonthlyBooking({
  adminUser,
  bookerName,
  phone,
  startDate,
  days,
  stallsWed = [],
  stallsSat = [],
  stallsSun = [],
  stallsMaster = [],
  customerType = 'Standard',
  product = '',
  note = '',
  elecUnit = 0,
  storageFee = 0,
  customPrice = ''
}) {
  if (!adminUser) throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
  if (!bookerName?.trim()) throw new Error("โปรดกรอกชื่อผู้เช่า");

  const cleanPhone = (phone || '').replace(/\s|-/g, '').trim();
  if (!cleanPhone) throw new Error("โปรดระบุเบอร์โทรศัพท์ผู้เช่า");
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    throw new Error("กรุณากรอกเบอร์โทรศัพท์ประเทศไทย 10 หลักให้ถูกต้อง (เช่น 0812345678 หรือ 021234567)");
  }

  const hasWed = days.wed && stallsWed.length > 0;
  const hasSat = days.sat && stallsSat.length > 0;
  const hasSun = days.sun && stallsSun.length > 0;

  if (customerType !== 'Room' && !hasWed && !hasSat && !hasSun) {
    throw new Error("กรุณาเลือกวันลงขายและระบุแผงค้าอย่างน้อย 1 รายการ");
  }

  if ((customerType === 'VIP' || customerType === 'Room') && parseNumber(customPrice) <= 0) {
    throw new Error("กรุณาระบุยอดค่าใช้จ่ายที่ตกลงกันให้ถูกต้อง");
  }

  const startD = new Date(startDate);
  const year = startD.getFullYear();
  const monthVal = startD.getMonth();
  const lastDay = new Date(year, monthVal + 1, 0).getDate();

  const dateThai = new Date(year + 543, monthVal, 1);
  const bookingMonthStr = dateThai.toString();
  const newBookingId = `BK-${String(year).substr(-2)}${String(monthVal + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const allSelectedStallNames = Array.from(new Set([...stallsWed, ...stallsSat, ...stallsSun]));

  const stallDetails = allSelectedStallNames.map(stallName => {
    const dList = [];
    if (days.wed && stallsWed.includes(stallName)) dList.push(3);
    if (days.sat && stallsSat.includes(stallName)) dList.push(6);
    if (days.sun && stallsSun.includes(stallName)) dList.push(0);
    return { name: stallName, days: dList };
  });

  const dailyBookings = [];
  const timestamp = new Date().toISOString();
  const isFullPackage = days.wed && days.sat && days.sun;

  for (let d = startD.getDate(); d <= lastDay; d++) {
    const currentD = new Date(year, monthVal, d);
    const dayOfWeek = currentD.getDay();

    stallDetails.forEach(stallDetail => {
      const myDays = stallDetail.days || [];
      if (myDays.includes(dayOfWeek)) {
        const stallName = stallDetail.name;
        const sMaster = stallsMaster.find(s => s.name === stallName);
        const price = calculateStallDayPrice(sMaster, dayOfWeek, customerType, isFullPackage);

        const dateStr = `${year}-${String(monthVal + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const uniqueDailyId = `${newBookingId}-${dateStr}-${stallName.replace(/[\[\]]/g, '')}`;

        dailyBookings.push({
          id: uniqueDailyId,
          date: dateStr,
          stall_name: stallName,
          booker_name: bookerName,
          product: product,
          type: customerType === 'Regular' ? 'ประจำ' : 'รายเดือน',
          elec_unit: parseNumber(elecUnit || 0),
          elec_price: parseNumber(elecUnit || 0) * 10,
          stall_price: price,
          total_price: price + (parseNumber(elecUnit || 0) * 10),
          payment_method: 'Cash',
          status: 'ค้างชำระ',
          note: 'จองใหม่รายเดือน',
          storage_fee: parseNumber(storageFee || 0),
          master_id: newBookingId
        });
      }
    });
  }

  const { conflictMsg } = await checkConflictingBookings(dailyBookings, allSelectedStallNames);
  if (conflictMsg) throw new Error(conflictMsg);

  if (dailyBookings.length > 0) {
    const { error: dbError } = await supabase.from('bookings').insert(dailyBookings);
    if (dbError) throw dbError;
  }

  const rentTotal = dailyBookings.reduce((sum, b) => sum + b.stall_price, 0);
  const totalElecCharged = Array.from(new Set(dailyBookings.map(b => b.date))).length;
  const totalElecPrice = totalElecCharged * (parseNumber(elecUnit || 0) * 10);
  const storageFeeVal = parseNumber(storageFee || 0);

  let monthlyTotal = rentTotal + totalElecPrice + storageFeeVal;
  let monthlyStatus = 'ค้างชำระ';
  if (customerType === 'Regular') {
    monthlyTotal = 0;
    monthlyStatus = 'ชำระรายวัน';
  } else if (customerType === 'VIP' || customerType === 'Room') {
    monthlyTotal = parseNumber(customPrice);
    monthlyStatus = 'ค้างชำระ';
  }

  const stallsString = allSelectedStallNames.join(', ');
  const monthlyData = {
    id: newBookingId,
    timestamp: timestamp,
    start_date: startDate,
    booker_name: bookerName,
    stalls: stallsString,
    product: product,
    status: monthlyStatus,
    elec_unit: parseNumber(elecUnit || 0),
    total_price: monthlyTotal,
    paid_amount: 0,
    note: (note || '').trim() || `จองรายเดือนใหม่ [${customerType}]`,
    payment_method: 'Cash',
    selected_days: Object.keys(days).filter(d => days[d]).map(d => d === 'wed' ? 'Wed' : d === 'sat' ? 'Sat' : 'Sun').join(', '),
    booking_month: bookingMonthStr,
    phone: cleanPhone,
    stall_details: JSON.stringify(stallDetails),
    customer_type: customerType,
    storage_fee: storageFeeVal,
    renewal_status: ''
  };

  const { error: mbError } = await supabase.from('monthly_bookings').insert([monthlyData]);
  if (mbError) throw mbError;

  return { newBookingId, monthlyData };
}

/**
 * Saves edited monthly booking, replacing its daily bookings and updating master record.
 */
export async function updateMonthlyBooking({
  editingMonthlyId,
  bookerName,
  phone,
  startDate,
  days,
  stallsWed = [],
  stallsSat = [],
  stallsSun = [],
  stallsMaster = [],
  customerType = 'Standard',
  product = '',
  note = '',
  elecUnit = 0,
  storageFee = 0,
  customPrice = '',
  editStatus = 'ค้างชำระ',
  editPaidAmount = 0,
  editRenewalStatus = ''
}) {
  if (!editingMonthlyId) throw new Error("ไม่พบรหัสการจอง");
  if (!bookerName?.trim()) throw new Error("โปรดกรอกชื่อผู้เช่า");

  const cleanPhone = (phone || '').replace(/\s|-/g, '').trim();
  if (!cleanPhone) throw new Error("โปรดระบุเบอร์โทรศัพท์ผู้เช่า");
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) {
    throw new Error("กรุณากรอกเบอร์โทรศัพท์ประเทศไทย 10 หลักให้ถูกต้อง");
  }

  const hasWed = days.wed && stallsWed.length > 0;
  const hasSat = days.sat && stallsSat.length > 0;
  const hasSun = days.sun && stallsSun.length > 0;

  if (customerType !== 'Room' && !hasWed && !hasSat && !hasSun) {
    throw new Error("กรุณาเลือกวันลงขายและระบุแผงค้าอย่างน้อย 1 รายการ");
  }

  const startD = new Date(startDate);
  const year = startD.getFullYear();
  const monthVal = startD.getMonth();
  const lastDay = new Date(year, monthVal + 1, 0).getDate();

  const dateThai = new Date(year + 543, monthVal, 1);
  const bookingMonthStr = dateThai.toString();

  const allSelectedStallNames = Array.from(new Set([...stallsWed, ...stallsSat, ...stallsSun]));

  const stallDetails = allSelectedStallNames.map(stallName => {
    const dList = [];
    if (days.wed && stallsWed.includes(stallName)) dList.push(3);
    if (days.sat && stallsSat.includes(stallName)) dList.push(6);
    if (days.sun && stallsSun.includes(stallName)) dList.push(0);
    return { name: stallName, days: dList };
  });

  const dailyBookings = [];
  const isFullPackage = days.wed && days.sat && days.sun;

  for (let d = startD.getDate(); d <= lastDay; d++) {
    const currentD = new Date(year, monthVal, d);
    const dayOfWeek = currentD.getDay();

    stallDetails.forEach(stallDetail => {
      const myDays = stallDetail.days || [];
      if (myDays.includes(dayOfWeek)) {
        const stallName = stallDetail.name;
        const sMaster = stallsMaster.find(s => s.name === stallName);
        const price = calculateStallDayPrice(sMaster, dayOfWeek, customerType, isFullPackage);

        const dateStr = `${year}-${String(monthVal + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const uniqueDailyId = `${editingMonthlyId}-${dateStr}-${stallName.replace(/[\[\]]/g, '')}`;

        dailyBookings.push({
          id: uniqueDailyId,
          date: dateStr,
          stall_name: stallName,
          booker_name: bookerName,
          product: product,
          type: customerType === 'Regular' ? 'ประจำ' : 'รายเดือน',
          elec_unit: parseNumber(elecUnit || 0),
          elec_price: parseNumber(elecUnit || 0) * 10,
          stall_price: price,
          total_price: price + (parseNumber(elecUnit || 0) * 10),
          payment_method: 'Cash',
          status: editStatus,
          note: 'จองรายเดือน (แก้ไข)',
          master_id: editingMonthlyId
        });
      }
    });
  }

  const { conflictMsg } = await checkConflictingBookings(dailyBookings, allSelectedStallNames, editingMonthlyId);
  if (conflictMsg) throw new Error(conflictMsg);

  // Delete old bookings
  const { error: delError } = await supabase.from('bookings').delete().eq('master_id', editingMonthlyId);
  if (delError) throw delError;

  // Insert new bookings
  if (dailyBookings.length > 0) {
    const { error: insError } = await supabase.from('bookings').insert(dailyBookings);
    if (insError) throw insError;
  }

  const rentTotal = dailyBookings.reduce((sum, b) => sum + b.stall_price, 0);
  const totalElecCharged = Array.from(new Set(dailyBookings.map(b => b.date))).length;
  const totalElecPrice = totalElecCharged * (parseNumber(elecUnit || 0) * 10);
  const storageFeeVal = parseNumber(storageFee || 0);

  let monthlyTotal = rentTotal + totalElecPrice + storageFeeVal;
  let monthlyStatus = editStatus;
  if (customerType === 'Regular') {
    monthlyTotal = 0;
    monthlyStatus = 'ชำระรายวัน';
  } else if (customerType === 'VIP' || customerType === 'Room') {
    monthlyTotal = parseNumber(customPrice);
    const currentPaid = parseNumber(editPaidAmount || 0);
    monthlyStatus = currentPaid >= (monthlyTotal - 0.01) ? 'ชำระแล้ว' : 'ค้างชำระ';
  }

  const stallsString = allSelectedStallNames.join(', ');

  const updatePayload = {
    start_date: startDate,
    booker_name: bookerName,
    stalls: stallsString,
    product: product,
    status: monthlyStatus,
    elec_unit: parseNumber(elecUnit || 0),
    total_price: monthlyTotal,
    paid_amount: parseNumber(editPaidAmount),
    note: (note || '').trim(),
    selected_days: Object.keys(days).filter(d => days[d]).map(d => d === 'wed' ? 'Wed' : d === 'sat' ? 'Sat' : 'Sun').join(', '),
    booking_month: bookingMonthStr,
    phone: cleanPhone,
    stall_details: JSON.stringify(stallDetails),
    customer_type: customerType,
    storage_fee: storageFeeVal,
    renewal_status: editRenewalStatus
  };

  const { error: updateError } = await supabase.from('monthly_bookings').update(updatePayload).eq('id', editingMonthlyId);
  if (updateError) throw updateError;

  return updatePayload;
}

/**
 * Quick inline updates for monthly item (e.g. status, renewal_status, paid_amount, note).
 */
export async function updateMonthlyItemQuick(item) {
  if (!item?.id) throw new Error("ไม่พบรหัสสัญญา");
  const { error } = await supabase
    .from('monthly_bookings')
    .update({
      paid_amount: parseNumber(item.paid_amount || 0),
      status: item.status,
      renewal_status: item.renewal_status,
      note: item.note
    })
    .eq('id', item.id);
  if (error) throw error;
  return item;
}

/**
 * Deletes or cancels a monthly booking contract safely.
 */
export async function deleteMonthlyBooking(item, adminUser, showConfirm) {
  if (!adminUser) throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
  if (!item) throw new Error("ไม่พบข้อมูลสัญญา");

  const paidAmt = parseNumber(item.paid_amount || 0);

  if (paidAmt === 0) {
    const isConfirmed = await showConfirm({
      title: 'ยืนยันการลบข้อมูลการจองรายเดือน',
      message: `⚠️ ยืนยันการลบข้อมูลการจองรายเดือนของคุณ "${item.booker_name}" (ล็อค ${item.stalls}) หรือไม่?\nการลบนี้จะไม่สามารถย้อนกลับได้`,
      confirmText: 'ลบข้อมูลถาวร',
      cancelText: 'ยกเลิก',
      isDanger: true
    });
    if (!isConfirmed) return { success: false };

    const { error: bErr } = await supabase.from('bookings').delete().eq('master_id', item.id);
    if (bErr) throw bErr;

    const { error } = await supabase.from('monthly_bookings').delete().eq('id', item.id);
    if (error) throw error;

    return { success: true, mode: 'hard_delete' };
  } else {
    // Check payments age
    const { data: txns, error: txnsError } = await supabase
      .from('transactions')
      .select('timestamp, date')
      .eq('booking_ref', item.id);
    if (txnsError) throw txnsError;

    const nowTime = new Date().getTime();
    const hasOlderTxn = (txns || []).some(t => {
      const tTime = new Date(t.timestamp || t.date).getTime();
      return (nowTime - tTime) / (1000 * 60 * 60) > 24;
    });

    if (hasOlderTxn) {
      const isConfirmed = await showConfirm({
        title: 'ยืนยันการยกเลิกสัญญา (Soft Delete)',
        message: `⚠️ สัญญานี้มียอดชำระเงินเกิน 24 ชม. แล้ว ไม่สามารถลบข้อมูลแบบถาวรได้\n\nระบบจะทำการ 'ยกเลิกสัญญา' (Soft Delete) เพื่อคืนตำแหน่งแผงค้าและเก็บประวัติทางบัญชี\n\nยืนยันยกเลิกสัญญาหรือไม่?`,
        confirmText: 'ยืนยันยกเลิกสัญญา',
        cancelText: 'ย้อนกลับ',
        isDanger: true
      });
      if (!isConfirmed) return { success: false };

      const { error: bErr } = await supabase.from('bookings').delete().eq('master_id', item.id);
      if (bErr) throw bErr;

      const { error: mbError } = await supabase.from('monthly_bookings').update({ status: 'ยกเลิก' }).eq('id', item.id);
      if (mbError) throw mbError;

      return { success: true, mode: 'soft_delete' };
    } else {
      throw new Error("⚠️ สัญญานี้มียอดชำระเงินที่ยังสามารถยกเลิกได้ภายใน 24 ชม. กรุณาไปลบรายการชำระเงินออกให้ครบก่อน");
    }
  }
}

/**
 * Toggles non-renewal status on a monthly booking.
 */
export async function toggleMonthlyNonRenewal(item, adminUser) {
  if (!adminUser) throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
  if (!item?.id) throw new Error("ไม่พบข้อมูลสัญญา");

  const newStatus = item.renewal_status === 'ไม่ต่อสัญญา' ? '' : 'ไม่ต่อสัญญา';
  const { error } = await supabase
    .from('monthly_bookings')
    .update({ renewal_status: newStatus })
    .eq('id', item.id);
  if (error) throw error;

  return newStatus;
}
