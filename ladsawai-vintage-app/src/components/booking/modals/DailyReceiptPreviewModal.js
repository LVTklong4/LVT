'use client';

import React, { useRef, useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { cleanStallName, parseNumber, formatPrice } from '@/utils/numberHelper';
import { dayNamesShort, monthNamesFull } from '@/utils/thaiDateHelper';
import { copyReceiptImage, downloadReceiptImage, shareOrCopyReceiptImage } from '@/utils/receiptImageHelper';
import { Printer, Copy, Check, Download, Share2, X, Loader2 } from 'lucide-react';

export default function DailyReceiptPreviewModal() {
  const {
    showReceiptPreviewModal,
    setShowReceiptPreviewModal,
    receiptPreviewData,
    handlePrintReceipt,
    showAlert
  } = useBooking();
  const { adminUser } = useAuthAdmin();

  const receiptRef = useRef(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!showReceiptPreviewModal || !receiptPreviewData) return null;

  const { bookingObj, stallObj } = receiptPreviewData;
  if (!bookingObj) return null;

  const stallPriceVal = parseNumber(bookingObj.stall_price);
  const elecPriceVal = parseNumber(bookingObj.elec_price);
  const storageFeeVal = parseNumber(bookingObj.storage_fee || bookingObj.storage_fee_price);
  const totalAmountVal = stallPriceVal + elecPriceVal + storageFeeVal;

  const txnDate = bookingObj.created_at ? new Date(bookingObj.created_at) : new Date();
  const formattedTransaction = `${txnDate.getDate()}/${txnDate.getMonth() + 1}/${txnDate.getFullYear() + 543} ${String(txnDate.getHours()).padStart(2, '0')}:${String(txnDate.getMinutes()).padStart(2, '0')}`;

  const tradingDateObj = new Date(bookingObj.date);
  const dayName = dayNamesShort[tradingDateObj.getDay()] || '';
  const tradingDateFormatted = `${dayName} ที่ ${tradingDateObj.getDate()} ${monthNamesFull[tradingDateObj.getMonth()]} ${tradingDateObj.getFullYear() + 543}`;

  const formattedStallName = bookingObj.stall_name 
    ? cleanStallName(bookingObj.stall_name) 
    : (stallObj ? cleanStallName(stallObj.name) : '-');

  const rawPayments = bookingObj.payment_method || '';
  const paymentLines = [];
  if (rawPayments.includes('+') || rawPayments.includes(':')) {
    rawPayments.split('+').forEach(p => {
      const parts = p.trim().split(':');
      if (parts.length >= 2) {
        paymentLines.push({ method: parts[0].trim() === 'โอนเงิน' ? 'โอนจ่าย' : parts[0].trim(), amount: parseNumber(parts[1]) });
      } else {
        paymentLines.push({ method: p.trim(), amount: totalAmountVal });
      }
    });
  } else {
    paymentLines.push({ method: rawPayments === 'โอนเงิน' ? 'โอนจ่าย' : rawPayments || 'เงินสด', amount: totalAmountVal });
  }

  const totalPaidVal = paymentLines.reduce((sum, p) => sum + p.amount, 0);
  const changeVal = totalPaidVal > totalAmountVal ? (totalPaidVal - totalAmountVal) : 0;
  const filename = `receipt-${formattedStallName}-${bookingObj.date || Date.now()}.png`;

  const handleCopy = async () => {
    if (!receiptRef.current) return;
    setCopying(true);
    try {
      const res = await copyReceiptImage(receiptRef.current, filename);
      setCopied(true);
      if (typeof showAlert === 'function') {
        showAlert(res.message, "สำเร็จ");
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      if (typeof showAlert === 'function') {
        showAlert("ไม่สามารถคัดลอกรูปภาพได้: " + err.message, "แจ้งเตือน", true);
      }
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      const res = await shareOrCopyReceiptImage(receiptRef.current, filename);
      if (typeof showAlert === 'function' && res.type !== 'cancelled') {
        showAlert(res.message, "สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      if (typeof showAlert === 'function') {
        showAlert("เกิดข้อผิดพลาด: " + err.message, "ข้อผิดพลาด", true);
      }
    } finally {
      setSharing(false);
    }
  };

  const handlePrint = () => {
    if (typeof handlePrintReceipt === 'function') {
      handlePrintReceipt(bookingObj, stallObj);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in my-auto">
        
        {/* Modal Header */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] px-3.5 py-2.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-[#8B4513]" />
            <span className="font-extrabold text-[#5D4037] text-xs">ตั๋วใบเสร็จรับเงิน (รายวัน)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 bg-[#8B4513] hover:bg-[#5D4037] text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="สั่งพิมพ์ใบเสร็จเครื่องพิมพ์ความร้อน"
            >
              <Printer className="w-3 h-3" /> พิมพ์
            </button>
            <button 
              type="button"
              onClick={() => setShowReceiptPreviewModal(false)}
              className="p-1 rounded-full text-gray-500 hover:bg-[#8B4513]/10 transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-4 h-4 text-[#8B4513]" />
            </button>
          </div>
        </div>

        {/* Modal Body: Receipt Paper Preview */}
        <div className="p-3.5 flex-1 overflow-y-auto bg-gray-100 flex flex-col items-center">
          <div className="w-full text-center text-[10px] text-gray-500 font-semibold mb-2">
            💡 เลือกกด <b>"คัดลอกรูป"</b> เพื่อส่งใน Line หรือ <b>"พิมพ์"</b> สำหรับลูกค้าเงินสด
          </div>

          {/* Printable / Capturable Receipt Card */}
          <div 
            ref={receiptRef} 
            className="w-full max-w-[280px] bg-white p-4 rounded-lg shadow-md border border-gray-200 text-black font-sans leading-relaxed text-xs"
          >
            <div className="flex flex-col items-center mb-2.5">
              <img 
                src="/logo.png" 
                alt="LVT Logo" 
                className="w-16 h-16 object-contain mb-1 drop-shadow-xs" 
              />
              <h2 className="font-black text-sm tracking-wide text-black text-center">ตลาดลาดสวายวินเทจ</h2>
              <p className="text-[9px] text-gray-700 font-bold text-center">ใบเสร็จรับเงิน / ใบนำเข้าพื้นที่</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            <div className="space-y-0.5 text-[10px] text-gray-800 font-semibold">
              <p>วันที่ทำรายการ: {formattedTransaction}</p>
              <p className="text-black font-bold">วันที่ค้าขาย: {tradingDateFormatted}</p>
              <p>ผู้ทำรายการ: {adminUser?.name || 'Admin'}</p>
              <p className="text-black font-bold">ชื่อผู้จอง: <span className="font-extrabold text-[#8B4513]">{bookingObj.booker_name || '-'}</span></p>
              <p>สินค้า: {bookingObj.product || 'สินค้าทั่วไป'}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            <div className="text-center py-1 bg-amber-50/60 rounded border border-amber-200/50 my-1.5">
              <span className="text-[10px] text-gray-600 font-bold block">ล็อคที่ได้รับ</span>
              <span className="text-xl font-black tracking-wider text-black block">{formattedStallName}</span>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            <div className="space-y-1 text-[11px] font-bold">
              <div className="flex justify-between">
                <span>ค่าเช่าพื้นที่:</span>
                <span className="font-mono">{formatPrice(stallPriceVal)} บ.</span>
              </div>
              {elecPriceVal > 0 && (
                <div className="flex justify-between text-amber-900">
                  <span>ค่าไฟ ({bookingObj.elec_unit || 1} จุด):</span>
                  <span className="font-mono">{formatPrice(elecPriceVal)} บ.</span>
                </div>
              )}
              {storageFeeVal > 0 && (
                <div className="flex justify-between text-blue-900">
                  <span>ค่าฝากของ:</span>
                  <span className="font-mono">{formatPrice(storageFeeVal)} บ.</span>
                </div>
              )}
              <div className="border-t border-gray-300 my-1"></div>
              <div className="flex justify-between text-sm font-black text-black">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span className="font-mono text-base">{formatPrice(totalAmountVal)} บ.</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            <div className="space-y-0.5 text-[10px] font-semibold text-gray-800">
              <p className="font-bold">การชำระเงิน:</p>
              {paymentLines.map((p, i) => (
                <div key={i} className="flex justify-between text-gray-700 pl-2">
                  <span>- {p.method}:</span>
                  <span className="font-mono">{formatPrice(p.amount)} บ.</span>
                </div>
              ))}
              {changeVal > 0 && (
                <div className="flex justify-between text-red-700 font-black pl-2 pt-0.5">
                  <span>เงินทอน:</span>
                  <span className="font-mono">{formatPrice(changeVal)} บ.</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            <div className="text-center text-[9px] text-gray-700 font-bold space-y-0.5">
              <p>Line Official: @ladsawaivintage</p>
              <p className="text-black font-extrabold">ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
              <p className="text-[7.5px] text-gray-400 font-normal">Powered by PJMJK</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#FAEBD7] border-t border-[#8B4513]/20 p-2.5 flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={copying}
              onClick={handleCopy}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {copying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกรูป (ส่ง Line)'}</span>
            </button>

            <button
              type="button"
              disabled={sharing}
              onClick={handleShare}
              className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              {sharing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>แชร์ / บันทึกรูป</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-1.5 bg-[#8B4513] hover:bg-[#5D4037] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์ใบเสร็จ
            </button>
            <button
              type="button"
              onClick={() => setShowReceiptPreviewModal(false)}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
