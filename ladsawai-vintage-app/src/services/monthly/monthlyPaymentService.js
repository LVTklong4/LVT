import { supabase } from '@/lib/supabase';
import { parseNumber, cleanStallName } from '@/utils/numberHelper';
import { getMonthSortValue, formatBookingMonth } from '@/utils/thaiDateHelper';
import { uploadSlipToStorage } from '@/services/storageService';

/**
 * Extracts recognized amount number from OCR text.
 */
export function extractAmountFromText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let matchedAmount = '';
  const amtRegex = /[0-9,]+\.[0-9]{2}/;

  for (const line of lines) {
    if (line.includes('จำนวนเงิน') || line.toLowerCase().includes('amount') || line.toLowerCase().includes('บาท') || line.includes('ยอดเงิน')) {
      const match = line.replace(/\s/g, '').match(amtRegex);
      if (match) {
        matchedAmount = match[0].replace(/,/g, '');
        break;
      }
    }
  }

  if (!matchedAmount) {
    const allMatches = text.match(/[0-9,]+\.[0-9]{2}/g);
    if (allMatches) {
      const parsedVals = allMatches.map(m => parseFloat(m.replace(/,/g, ''))).filter(v => v > 10);
      if (parsedVals.length > 0) {
        matchedAmount = String(Math.max(...parsedVals));
      }
    }
  }

  return matchedAmount;
}

/**
 * Fetches transactions linked to a specific monthly booking reference.
 */
export async function fetchMonthlyTransactions(bookingId) {
  if (!bookingId) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('booking_ref', bookingId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Records a monthly payment transaction and updates contract paid_amount/status.
 */
export async function submitMonthlyPayment({
  activeMonthlyBooking,
  paymentForm,
  adminUser
}) {
  if (!activeMonthlyBooking || !activeMonthlyBooking.id) {
    throw new Error("ไม่พบข้อมูลสัญญาที่กำลังเลือก กรุณาเลือกลูกค้ารายเดือนใหม่อีกครั้ง");
  }

  const isRoom = activeMonthlyBooking.customer_type === 'Room';
  const rentVal = isRoom && (paymentForm.rent_amt !== undefined && paymentForm.rent_amt !== '')
    ? parseNumber(paymentForm.rent_amt)
    : (isRoom ? 0 : parseNumber(paymentForm.amount));
  const elecVal = isRoom ? parseNumber(paymentForm.elec_amt || 0) : 0;
  const waterVal = isRoom ? parseNumber(paymentForm.water_amt || 0) : 0;

  const amountVal = isRoom ? (rentVal + elecVal + waterVal) : parseNumber(paymentForm.amount);
  if (amountVal <= 0) throw new Error("กรุณาระบุจำนวนเงินที่ถูกต้อง (อย่างน้อย 1 รายการ)");

  if (!paymentForm.method) {
    throw new Error("กรุณาเลือกประเภทการบันทึก (เงินสด / โอนจ่าย / ส่วนลด)");
  }

  // 1. Anti-duplicate protection: Check if an identical payment transaction was recorded within the last 15 seconds
  const fifteenSecAgo = new Date(Date.now() - 15000).toISOString();
  const { data: recentTxns } = await supabase
    .from('transactions')
    .select('id, total_amount, method, timestamp, booking_ref')
    .eq('booking_ref', activeMonthlyBooking.id)
    .eq('total_amount', amountVal)
    .eq('method', paymentForm.method)
    .gte('timestamp', fifteenSecAgo);

  if (recentTxns && recentTxns.length > 0) {
    console.warn("⚠️ ตรวจพบการกดบันทึกชำระเงินซ้ำภายใน 15 วินาที - ป้องกันรายการซ้ำซ้อนสำเร็จ", recentTxns[0]);
    return {
      txnData: recentTxns[0],
      updatedBooking: activeMonthlyBooking
    };
  }

  // 2. Fetch fresh contract data from database to prevent stale in-memory race conditions
  const { data: freshBooking } = await supabase
    .from('monthly_bookings')
    .select('id, paid_amount, total_price, status, customer_type')
    .eq('id', activeMonthlyBooking.id)
    .single();

  const currentPaid = freshBooking ? parseNumber(freshBooking.paid_amount || 0) : parseNumber(activeMonthlyBooking.paid_amount || 0);
  const totalPrice = freshBooking ? parseNumber(freshBooking.total_price || 0) : parseNumber(activeMonthlyBooking.total_price || 0);
  
  // For Room, only rentVal contributes to paid_amount of the room contract
  const rentContrib = isRoom ? rentVal : amountVal;
  const newPaid = currentPaid + rentContrib;

  if (totalPrice > 0 && newPaid > totalPrice + 0.01) {
    const remaining = Math.max(0, totalPrice - currentPaid);
    throw new Error(`ยอดค่าเช่าห้อง (${rentContrib.toLocaleString()} บาท) ร่วมกับยอดที่เคยชำระแล้ว (${currentPaid.toLocaleString()} บาท) เกินกว่ายอดค่าเช่าห้องทั้งหมด (${totalPrice.toLocaleString()} บาท)\n\nกรุณากรอกยอดค่าเช่าไม่เกินยอดคงเหลือ: ${remaining.toLocaleString()} บาท`);
  }

  const isDiscount = paymentForm.method === 'ส่วนลด';
  const txnDate = paymentForm.date || new Date().toISOString().split('T')[0];

  const txnId = `TXN-${Date.now()}`;

  // Upload slip to Supabase Storage if method is transfer
  let finalSlipUrl = null;
  if (paymentForm.method === 'โอนจ่าย') {
    const slipSource = paymentForm.slip_file || paymentForm.slip_base64;
    if (slipSource) {
      const uploadRes = await uploadSlipToStorage(supabase, slipSource, {
        folder: 'monthly',
        bookingId: activeMonthlyBooking.id,
        txnId,
        fileName: paymentForm.slip_file?.name || 'slip.jpg'
      });
      if (uploadRes.success && uploadRes.publicUrl) {
        finalSlipUrl = uploadRes.publicUrl;
      } else {
        // Graceful fallback to base64 if storage upload fails or bucket is not ready
        finalSlipUrl = paymentForm.slip_base64 || null;
      }
    }
  }

  // Build descriptive category and note for Room
  let categoryName = isDiscount ? 'ส่วนลดรายเดือน' : 'ค่าล็อครายเดือน';
  if (isRoom) {
    if (isDiscount) {
      categoryName = 'ส่วนลดห้องเช่า';
    } else if (rentVal > 0 && (elecVal > 0 || waterVal > 0)) {
      categoryName = 'ค่าเช่าห้อง+สาธารณูปโภค';
    } else if (rentVal > 0) {
      categoryName = 'ค่าเช่าห้องพัก';
    } else {
      categoryName = 'ค่าน้ำค่าไฟห้องเช่า';
    }
  }

  // Build itemized note
  const autoNoteParts = [];
  if (isRoom) {
    if (rentVal > 0) autoNoteParts.push(`ค่าเช่า ${rentVal.toLocaleString()} บ.`);
    if (elecVal > 0) autoNoteParts.push(`ค่าไฟ ${elecVal.toLocaleString()} บ.`);
    if (waterVal > 0) autoNoteParts.push(`ค่าน้ำ ${waterVal.toLocaleString()} บ.`);
  }
  const breakdownDesc = autoNoteParts.join(' | ');
  const userNote = (paymentForm.note || '').trim();
  const finalNote = userNote
    ? (breakdownDesc ? `${userNote} (${breakdownDesc})` : userNote)
    : (breakdownDesc || (isDiscount ? (isRoom ? 'ส่วนลดห้องเช่า' : 'ส่วนลดรายเดือนเพิ่มเติม') : (isRoom ? 'ชำระเงินห้องเช่า' : 'ชำระเงินรายเดือนเพิ่มเติม')));

  const txnData = {
    id: txnId,
    booking_ref: activeMonthlyBooking.id,
    date: txnDate,
    category: categoryName,
    total_amount: amountVal,
    method: paymentForm.method,
    note: finalNote,
    officer: adminUser?.name || 'System',
    timestamp: new Date().toISOString(),
    stall_amt: isRoom ? rentVal : amountVal,
    elec_amt: elecVal,
    storage_amt: 0,
    bill_type: 'General',
    slip_url: finalSlipUrl
  };

  let txnPayload = { ...txnData };
  if (isRoom && waterVal > 0) {
    txnPayload.water_amt = waterVal;
  }
  let { error: txnError } = await supabase.from('transactions').insert(txnPayload);
  if (txnError && txnError.message?.includes('water_amt')) {
    // If water_amt column does not exist in schema yet, fallback gracefully
    delete txnPayload.water_amt;
    const retry = await supabase.from('transactions').insert(txnPayload);
    txnError = retry.error;
  }
  if (txnError) throw txnError;

  const newStatus = newPaid >= (totalPrice - 0.01) ? 'ชำระแล้ว' : 'ค้างชำระ';
  const { error: mbError } = await supabase
    .from('monthly_bookings')
    .update({
      paid_amount: newPaid,
      status: newStatus
    })
    .eq('id', activeMonthlyBooking.id);
  if (mbError) throw mbError;

  return {
    txnData,
    updatedBooking: {
      ...activeMonthlyBooking,
      paid_amount: newPaid,
      status: newStatus
    }
  };
}

/**
 * Deletes a monthly payment transaction and recalculates the contract balance.
 */
export async function deleteMonthlyTransaction({
  txn,
  activeMonthlyBooking,
  showConfirm
}) {
  if (!txn?.id) throw new Error("ไม่พบรายการธุรกรรม");
  if (!activeMonthlyBooking?.id) throw new Error("ไม่พบข้อมูลสัญญา");

  const txTime = new Date(txn.timestamp || txn.date).getTime();
  const nowTime = new Date().getTime();
  const diffHours = (nowTime - txTime) / (1000 * 60 * 60);

  if (diffHours > 24) {
    throw new Error("⚠️ ไม่สามารถลบรายการชำระเงินที่ทำรายการเกิน 24 ชั่วโมงแล้วได้ เพื่อความถูกต้องทางบัญชี");
  }

  const msg = `⚠️ ยืนยันการยกเลิก/ลบรายการชำระเงินนี้ใช่หรือไม่?\n\n` +
    `รายการ: ${txn.category || 'ค่าเช่า'}\n` +
    `จำนวนเงิน: ${txn.total_amount?.toLocaleString() || 0} บาท\n` +
    `วิธีการชำระ: ${txn.method || '-'}\n\n` +
    `* ระบบจะหักลดยอดชำระสะสมของสัญญาหลักลงโดยอัตโนมัติ`;

  const isConfirmed = await showConfirm({
    title: 'ยืนยันยกเลิกรายการชำระเงิน',
    message: msg,
    confirmText: 'ยกเลิกรายการ',
    cancelText: 'ย้อนกลับ',
    isDanger: true
  });
  if (!isConfirmed) return { success: false };

  const { error: delError } = await supabase.from('transactions').delete().eq('id', txn.id);
  if (delError) throw delError;

  // Recalculate remaining paid amount
  const { data: remainingTxns, error: txError } = await supabase
    .from('transactions')
    .select('total_amount, stall_amt')
    .eq('booking_ref', activeMonthlyBooking.id);
  if (txError) throw txError;

  const isRoom = activeMonthlyBooking.customer_type === 'Room';
  const newPaid = (remainingTxns || []).reduce((sum, t) => {
    if (isRoom) {
      const rentPortion = (t.stall_amt !== undefined && t.stall_amt !== null) ? parseFloat(t.stall_amt) : parseFloat(t.total_amount);
      return sum + (isNaN(rentPortion) ? 0 : rentPortion);
    }
    return sum + (parseFloat(t.total_amount) || 0);
  }, 0);
  const totalPrice = parseNumber(activeMonthlyBooking.total_price || 0);
  const newStatus = newPaid >= (totalPrice - 0.01) ? 'ชำระแล้ว' : 'ค้างชำระ';

  const { error: mbError } = await supabase
    .from('monthly_bookings')
    .update({
      paid_amount: newPaid,
      total_paid: newPaid,
      status: newStatus
    })
    .eq('id', activeMonthlyBooking.id);
  if (mbError) throw mbError;

  return {
    success: true,
    updatedBooking: {
      ...activeMonthlyBooking,
      paid_amount: newPaid,
      total_paid: newPaid,
      status: newStatus
    }
  };
}

/**
 * Runs client-side OCR on a payment slip file and extracts the amount.
 */
export async function scanSlipFile(file) {
  if (!file) throw new Error("ไม่พบไฟล์รูปภาพ");
  const Tesseract = (await import('tesseract.js')).default;
  const result = await Tesseract.recognize(file, 'tha+eng');
  const text = result?.data?.text || '';
  const detectedAmount = extractAmountFromText(text);
  return { text, detectedAmount };
}

/**
 * Finds all earlier monthly contracts for the same merchant that are still unpaid (have remaining balance).
 * Used to warn staff before accepting payment for a future month when past debts remain.
 */
export function findEarlierUnpaidContracts(targetBooking, monthlyList) {
  if (!targetBooking || !monthlyList || !Array.isArray(monthlyList)) return [];

  const targetMonthVal = getMonthSortValue(targetBooking.booking_month || targetBooking.start_date);
  if (!targetMonthVal) return [];

  const targetBooker = (targetBooking.booker_name || '').trim().toLowerCase();
  const targetPhone = String(targetBooking.phone || '').replace(/[\s-]/g, '').trim();
  const targetCleanStalls = cleanStallName(targetBooking.stalls);

  return monthlyList.filter(item => {
    // Must not be the same contract
    if (item.id === targetBooking.id) return false;
    // Exclude cancelled contracts
    if (item.status === 'ยกเลิก') return false;

    // Check if it is from an EARLIER month
    const itemMonthVal = getMonthSortValue(item.booking_month || item.start_date);
    if (!itemMonthVal || itemMonthVal >= targetMonthVal) return false;

    // Check remaining balance
    const total = parseNumber(item.total_price || 0);
    const paid = parseNumber(item.paid_amount || 0);
    const remaining = Math.max(0, total - paid);
    if (remaining <= 0) return false;

    // Check customer identity:
    const itemCleanStalls = cleanStallName(item.stalls);
    const itemBooker = (item.booker_name || '').trim().toLowerCase();
    const itemPhone = String(item.phone || '').replace(/[\s-]/g, '').trim();

    const isSameStall = itemCleanStalls && targetCleanStalls && itemCleanStalls === targetCleanStalls;
    const isSameName = itemBooker && targetBooker && itemBooker === targetBooker;
    const isSamePhone = itemPhone && targetPhone && itemPhone.length >= 8 && targetPhone.length >= 8 && itemPhone === targetPhone;
    const isGenericName = !targetBooker || targetBooker === 'ไม่ระบุชื่อ' || targetBooker === '-' || targetBooker === 'ร้านค้าประจำ';
    const isSameNameValid = !isGenericName && itemBooker && targetBooker && itemBooker === targetBooker;

    return (isSameName && isSameStall) ||
           (isSameName && isSamePhone) ||
           (isSamePhone && isSameStall) ||
           (isSameNameValid && !targetPhone && !itemPhone);
  }).map(item => ({
    ...item,
    remaining: Math.max(0, parseNumber(item.total_price || 0) - parseNumber(item.paid_amount || 0))
  }));
}
