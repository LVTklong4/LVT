/**
 * Move Lock Service
 * Pure logic and database operations for transferring stalls between dates or locations.
 */

import { parseNumber } from '@/utils/numberHelper';
import { checkStallsAvailability, cleanStallName } from '@/services/booking/concurrencyService';

/**
 * Fetches vacant stalls for a specified target date, accounting for currently booked stalls.
 */
export async function fetchVacantStalls({
  supabase,
  targetDateStr,
  selectedBooking = null,
  stalls = []
}) {
  if (!supabase || !targetDateStr) return [];

  const { data: bookingsData, error } = await supabase
    .from('bookings')
    .select('stall_name, status, id, master_id')
    .eq('date', targetDateStr);

  if (error) throw error;

  const currentMasterId = selectedBooking?.master_id;
  const currentBookingId = selectedBooking?.id;

  const bookedStallsSet = new Set();
  bookingsData?.forEach(b => {
    const isSelf = (currentBookingId && b.id === currentBookingId) || 
                   (currentMasterId && b.master_id === currentMasterId);
    if (b.status !== 'ลา' && !isSelf && b.stall_name) {
      b.stall_name.split(',').map(s => s.trim()).forEach(name => {
        if (name) {
          const clean = cleanStallName(name);
          bookedStallsSet.add(name);
          bookedStallsSet.add(clean);
          bookedStallsSet.add(`[${clean}]`);
        }
      });
    }
  });

  return stalls.filter(s => 
    s.type !== 'ทางเดิน' && 
    s.type !== 'อื่นๆ' && 
    !bookedStallsSet.has(s.name) &&
    !bookedStallsSet.has(cleanStallName(s.name))
  );
}

/**
 * Executes stall move/transfer with live concurrency verification and financial reallocation.
 */
export async function executeMoveLock({
  supabase,
  sourceStallName,
  sourceStalls,
  targetStall,
  targetStalls,
  moveAll = false,
  targetDate,
  selectedBooking,
  stalls,
  adminUser,
  getStallPriceForDate
}) {
  if (!adminUser) throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
  if (!selectedBooking) throw new Error("ไม่พบข้อมูลการจองที่ต้องการย้าย");
  if (!targetDate) throw new Error("ข้อมูลไม่ครบถ้วนสำหรับการย้ายล็อค (ไม่พบวันที่ปลายทาง)");

  const allStalls = selectedBooking.stall_name.split(',').map(s => s.trim());
  const isMultiStall = allStalls.length > 1;
  const shouldMoveAll = isMultiStall && (moveAll || (targetStalls && targetStalls.length > 1));

  // ==========================================
  // CASE 1: Move All Stalls Together (Consolidated in 1 Bill)
  // ==========================================
  if (shouldMoveAll) {
    const resolvedSourceStalls = (sourceStalls && sourceStalls.length > 0) ? sourceStalls : allStalls;
    const resolvedTargetStalls = (targetStalls && targetStalls.length > 0) ? targetStalls : (targetStall ? [targetStall] : []);

    if (resolvedTargetStalls.length !== resolvedSourceStalls.length) {
      throw new Error(`กรุณาเลือกล็อคปลายทางให้ครบ ${resolvedSourceStalls.length} ล็อค (เลือกแล้ว ${resolvedTargetStalls.length} ล็อค)`);
    }

    // 1. Concurrency Check: verify all target stalls are available on target date
    const availCheck = await checkStallsAvailability({
      supabase,
      date: targetDate,
      stalls: resolvedTargetStalls.map(s => s.name),
      excludeBookingId: selectedBooking.id,
      excludeMasterId: selectedBooking.master_id
    });

    if (!availCheck.isAvailable) {
      const conflictWho = availCheck.conflictBooking?.booker_name || 'ผู้อื่น';
      throw new Error(`⚠️ ไม่สามารถย้ายได้ เนื่องจากล็อค ${availCheck.conflictStall} ในวันที่เลือก ถูกจองไปแล้วโดย "${conflictWho}"`);
    }

    // 2. Calculate current paid amount for the whole booking
    let currentPaid = 0;
    if (selectedBooking.payment_method) {
      const parts = selectedBooking.payment_method.split('+');
      parts.forEach(part => {
        if (part.includes(':')) {
          const [, amtStr] = part.split(':');
          currentPaid += parseNumber(amtStr);
        } else {
          currentPaid += parseNumber(part);
        }
      });
    }
    if (currentPaid === 0 && selectedBooking.status === 'ชำระแล้ว') {
      currentPaid = parseNumber(selectedBooking.total_price);
    }

    const wasOriginalPaid = selectedBooking.status === 'ชำระแล้ว';

    // 3. Price calculations
    const origTotalStandard = resolvedSourceStalls.reduce((sum, name) => {
      const sObj = stalls.find(s => s.name === name);
      return sum + ((getStallPriceForDate && sObj ? getStallPriceForDate(sObj, selectedBooking.date) : 0) || 0);
    }, 0) || parseNumber(selectedBooking.stall_price);

    const newTotalStallPrice = resolvedTargetStalls.reduce((sum, s) => {
      return sum + ((getStallPriceForDate ? getStallPriceForDate(s, targetDate) : parseNumber(s.price_wed || 0)) || 0);
    }, 0);

    const stallPriceDiff = newTotalStallPrice - origTotalStandard;
    const elecPrice = parseNumber(selectedBooking.elec_price || 0);
    const storageFee = parseNumber(selectedBooking.storage_fee || 0);

    let finalTotal = 0;
    let newStatus = 'ชำระแล้ว';

    if (stallPriceDiff <= 0) {
      // Cheaper or same price
      finalTotal = wasOriginalPaid ? currentPaid : (newTotalStallPrice + elecPrice + storageFee);
      newStatus = wasOriginalPaid ? 'ชำระแล้ว' : (currentPaid >= finalTotal ? 'ชำระแล้ว' : 'ค้างชำระ');
    } else {
      // More expensive: difference added
      const extraToPay = stallPriceDiff;
      finalTotal = currentPaid + extraToPay;
      newStatus = (wasOriginalPaid && extraToPay <= 0) || (!wasOriginalPaid && currentPaid >= finalTotal) ? 'ชำระแล้ว' : 'ค้างชำระ';
    }

    // Note for audit
    const originalDate = selectedBooking.date;
    const dateObj = new Date(originalDate);
    const dateFormatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
    const moveNote = `[ย้ายจาก ${resolvedSourceStalls.join(', ')} วันที่ ${dateFormatted}] ${selectedBooking.note || ''}`;

    // Update existing booking in-place: keeps same ID, stays in 1 bill!
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        date: targetDate,
        stall_name: resolvedTargetStalls.map(s => cleanStallName(s.name)).join(', '),
        stall_price: newTotalStallPrice,
        total_price: finalTotal,
        status: newStatus,
        note: moveNote
      })
      .eq('id', selectedBooking.id);

    if (updateError) throw updateError;

    return {
      success: true,
      srcStallName: resolvedSourceStalls.join(', '),
      targetStallName: resolvedTargetStalls.map(s => cleanStallName(s.name)).join(', '),
      targetDate
    };
  }

  // ==========================================
  // CASE 2: Single Stall Move (or Partial Split Move)
  // ==========================================
  const srcStallName = sourceStallName || (selectedBooking.stall_name ? selectedBooking.stall_name.split(',')[0].trim() : '');
  const targetStallObj = targetStall || (targetStalls && targetStalls[0]);
  if (!srcStallName) throw new Error("ไม่พบข้อมูลล็อคต้นทาง");
  if (!targetStallObj) throw new Error("กรุณาเลือกล็อคปลายทาง");

  // 1. Concurrency Check: ensure target stall is still free on target date!
  const availCheck = await checkStallsAvailability({
    supabase,
    date: targetDate,
    stalls: targetStallObj.name,
    excludeBookingId: selectedBooking.id,
    excludeMasterId: selectedBooking.master_id
  });

  if (!availCheck.isAvailable) {
    const conflictWho = availCheck.conflictBooking?.booker_name || 'ผู้อื่น';
    throw new Error(`⚠️ ไม่สามารถย้ายได้ เนื่องจากล็อค ${targetStallObj.name} ในวันที่เลือก ถูกจองไปแล้วโดย "${conflictWho}"`);
  }

  // 2. Calculate current paid amount for the whole booking
  let currentPaid = 0;
  if (selectedBooking.payment_method) {
    const parts = selectedBooking.payment_method.split('+');
    parts.forEach(part => {
      if (part.includes(':')) {
        const [, amtStr] = part.split(':');
        currentPaid += parseNumber(amtStr);
      } else {
        currentPaid += parseNumber(part);
      }
    });
  }

  if (currentPaid === 0 && selectedBooking.status === 'ชำระแล้ว') {
    currentPaid = parseNumber(selectedBooking.total_price);
  }

  const wasOriginalPaid = selectedBooking.status === 'ชำระแล้ว';

  // 3. Calculate standard prices of stalls to determine allocation ratio
  const standardSourcePrice = (getStallPriceForDate && getStallPriceForDate(stalls.find(s => s.name === srcStallName) || { name: srcStallName }, selectedBooking.date)) || 
    Math.round(parseNumber(selectedBooking.stall_price) / allStalls.length);

  let totalStandard = standardSourcePrice;
  if (isMultiStall) {
    totalStandard = allStalls.reduce((sum, name) => {
      const sObj = stalls.find(s => s.name === name);
      return sum + ((getStallPriceForDate && sObj ? getStallPriceForDate(sObj, selectedBooking.date) : 0) || 0);
    }, 0);
  }

  const ratio = standardSourcePrice / (totalStandard || 1);

  // Allocated source values
  const allocatedSourcePrice = Math.round(selectedBooking.stall_price * ratio);
  const allocatedSourcePaid = Math.round(currentPaid * ratio);
  const allocatedSourceElecUnit = parseNumber((selectedBooking.elec_unit || 0) * ratio);
  const allocatedSourceElecPrice = Math.round(parseNumber(selectedBooking.elec_price || 0) * ratio);
  const allocatedSourceStorageFee = Math.round(parseNumber(selectedBooking.storage_fee || 0) * ratio);

  // Target price calculation
  const newTargetPrice = (getStallPriceForDate && getStallPriceForDate(targetStallObj, targetDate)) || parseNumber(targetStallObj.price_wed || 0);
  const stallPriceDiff = newTargetPrice - standardSourcePrice;

  let finalSourcePrice = newTargetPrice;
  let finalSourceTotal = 0;
  let newStatusSource = 'ชำระแล้ว';

  if (stallPriceDiff <= 0) {
    // Cheaper or equal lock
    finalSourcePrice = newTargetPrice;
    finalSourceTotal = wasOriginalPaid ? allocatedSourcePaid : (newTargetPrice + allocatedSourceElecPrice + allocatedSourceStorageFee);
    newStatusSource = wasOriginalPaid ? 'ชำระแล้ว' : (currentPaid >= finalSourceTotal ? 'ชำระแล้ว' : 'ค้างชำระ');
  } else {
    // More expensive lock: difference added
    const extraToPay = stallPriceDiff;
    finalSourcePrice = newTargetPrice;
    finalSourceTotal = allocatedSourcePaid + extraToPay;
    newStatusSource = (wasOriginalPaid && extraToPay <= 0) || (!wasOriginalPaid && currentPaid >= finalSourceTotal) ? 'ชำระแล้ว' : 'ค้างชำระ';
  }

  // Note for audit
  const originalDate = selectedBooking.date;
  const dateObj = new Date(originalDate);
  const dateFormatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
  const moveNote = `[ย้ายจาก ${srcStallName} วันที่ ${dateFormatted}] ${selectedBooking.note || ''}`;

  if (!isMultiStall) {
    // Single Stall: Update in place
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        date: targetDate,
        stall_name: targetStallObj.name,
        stall_price: finalSourcePrice,
        total_price: finalSourceTotal,
        status: newStatusSource,
        note: moveNote
      })
      .eq('id', selectedBooking.id);

    if (updateError) throw updateError;
  } else {
    // Multi Stall: Split partial stall, but link with master_id
    const masterId = selectedBooking.master_id || selectedBooking.id;
    const remainingStalls = allStalls.filter(name => name !== srcStallName);
    const allocatedRemainingPrice = selectedBooking.stall_price - allocatedSourcePrice;
    const allocatedRemainingPaid = currentPaid - allocatedSourcePaid;
    const allocatedRemainingElecUnit = parseNumber((selectedBooking.elec_unit || 0) - allocatedSourceElecUnit);
    const allocatedRemainingElecPrice = Math.round(parseNumber(selectedBooking.elec_price || 0) - allocatedSourceElecPrice);
    const allocatedRemainingStorageFee = Math.round(parseNumber(selectedBooking.storage_fee || 0) - allocatedSourceStorageFee);
    const finalRemainingTotal = allocatedRemainingPrice + allocatedRemainingElecPrice + allocatedRemainingStorageFee;
    const isPaidRemaining = allocatedRemainingPaid >= finalRemainingTotal && finalRemainingTotal > 0;
    const newStatusRemaining = isPaidRemaining ? 'ชำระแล้ว' : 'ค้างชำระ';

    const splitPaymentMethod = (paymentMethodStr, splitRatio) => {
      if (!paymentMethodStr) return 'เงินสด';
      return paymentMethodStr.split('+').map(part => {
        const trimPart = part.trim();
        if (trimPart.includes(':')) {
          const [method, amtStr] = trimPart.split(':');
          const amt = parseNumber(amtStr);
          return `${method}:${Math.round(amt * splitRatio)}`;
        }
        return trimPart;
      }).join(' + ');
    };

    const paymentMethodSource = splitPaymentMethod(selectedBooking.payment_method, ratio);
    const paymentMethodRemaining = splitPaymentMethod(selectedBooking.payment_method, 1 - ratio);

    // Update remaining stalls
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stall_name: remainingStalls.join(', '),
        stall_price: allocatedRemainingPrice,
        elec_unit: allocatedRemainingElecUnit,
        elec_price: allocatedRemainingElecPrice,
        storage_fee: allocatedRemainingStorageFee,
        total_price: finalRemainingTotal,
        payment_method: paymentMethodRemaining,
        status: newStatusRemaining,
        master_id: masterId
      })
      .eq('id', selectedBooking.id);

    if (updateError) throw updateError;

    // Insert new booking for moved stall (linked by master_id)
    const newBookingId = `B-move-${Date.now()}`;
    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        id: newBookingId,
        date: targetDate,
        stall_name: targetStallObj.name,
        booker_name: selectedBooking.booker_name,
        product: selectedBooking.product,
        type: selectedBooking.type,
        elec_unit: allocatedSourceElecUnit,
        elec_price: allocatedSourceElecPrice,
        stall_price: finalSourcePrice,
        total_price: finalSourceTotal,
        payment_method: paymentMethodSource,
        status: newStatusSource,
        note: moveNote,
        storage_fee: allocatedSourceStorageFee,
        master_id: masterId
      });

    if (insertError) throw insertError;
  }

  return {
    success: true,
    srcStallName,
    targetStallName: targetStallObj.name,
    targetDate
  };
}
