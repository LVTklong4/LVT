import { supabase } from '@/lib/supabase';
import { parseNumber } from '@/utils/numberHelper';
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
  if (!activeMonthlyBooking) throw new Error("ไม่พบข้อมูลสัญญาที่กำลังเลือก");

  const amountVal = parseNumber(paymentForm.amount);
  if (amountVal <= 0) throw new Error("กรุณาระบุจำนวนเงินที่ถูกต้อง");

  const currentPaid = parseNumber(activeMonthlyBooking.paid_amount || 0);
  const newPaid = currentPaid + amountVal;
  const totalPrice = parseNumber(activeMonthlyBooking.total_price || 0);

  if (newPaid > totalPrice + 0.01) {
    const remaining = Math.max(0, totalPrice - currentPaid);
    throw new Error(`ยอดเงินชำระ (${amountVal.toLocaleString()} บาท) ร่วมกับยอดที่เคยชำระแล้ว (${currentPaid.toLocaleString()} บาท) เกินกว่ายอดรวมค่าเช่ารายเดือนทั้งหมด (${totalPrice.toLocaleString()} บาท)\n\nกรุณากรอกยอดชำระไม่เกินยอดคงเหลือค้างชำระ: ${remaining.toLocaleString()} บาท`);
  }

  if (!paymentForm.method) {
    throw new Error("กรุณาเลือกประเภทการบันทึก (เงินสด / โอนจ่าย / ส่วนลด)");
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

  const txnData = {
    id: txnId,
    booking_ref: activeMonthlyBooking.id,
    date: txnDate,
    category: isDiscount ? 'ส่วนลดรายเดือน' : 'ค่าล็อครายเดือน',
    total_amount: amountVal,
    method: paymentForm.method,
    note: (paymentForm.note || '').trim() || (isDiscount ? 'ส่วนลดรายเดือนเพิ่มเติม' : 'ชำระเงินรายเดือนเพิ่มเติม'),
    officer: adminUser?.name || 'System',
    timestamp: new Date().toISOString(),
    stall_amt: amountVal,
    elec_amt: 0,
    storage_amt: 0,
    bill_type: 'General',
    slip_url: finalSlipUrl
  };

  const { error: txnError } = await supabase.from('transactions').insert(txnData);
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
    .select('total_amount')
    .eq('booking_ref', activeMonthlyBooking.id);
  if (txError) throw txError;

  const newPaid = (remainingTxns || []).reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
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
