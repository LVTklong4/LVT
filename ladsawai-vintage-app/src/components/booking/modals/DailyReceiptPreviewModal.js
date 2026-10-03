'use client';

import React, { useRef, useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { cleanStallName, parseNumber, formatPrice } from '@/utils/numberHelper';
import { dayNamesShort, monthNamesFull } from '@/utils/thaiDateHelper';
import { copyReceiptImage, shareReceiptImage, normalizePaymentMethodThai } from '@/utils/receiptImageHelper';
import { Printer, Copy, Check, Share2, X, Loader2 } from 'lucide-react';

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
        paymentLines.push({ method: normalizePaymentMethodThai(parts[0].trim()), amount: parseNumber(parts[1]) });
      } else {
        paymentLines.push({ method: normalizePaymentMethodThai(p.trim()), amount: totalAmountVal });
      }
    });
  } else {
    paymentLines.push({ method: normalizePaymentMethodThai(rawPayments || 'เงินสด'), amount: totalAmountVal });
  }

  const totalPaidVal = paymentLines.reduce((sum, p) => sum + p.amount, 0);
  const changeVal = totalPaidVal > totalAmountVal ? (totalPaidVal - totalAmountVal) : 0;
  const filename = `receipt-${formattedStallName}-${bookingObj.date || Date.now()}.png`;

  const handleCopy = async () => {
    if (!receiptRef.current) return;
    setCopying(true);
    try {
      const res = await copyReceiptImage(receiptRef.current);
      setCopied(true);
      if (typeof showAlert === 'function') {
        showAlert(res.message, "สำเร็จ");
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      if (typeof showAlert === 'function') {
        showAlert(err.message, "แจ้งเตือน", true);
      }
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      const res = await shareReceiptImage(receiptRef.current, filename);
      if (typeof showAlert === 'function' && res.type !== 'cancelled') {
        showAlert(res.message, "สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      if (typeof showAlert === 'function') {
        showAlert(err.message, "ข้อผิดพลาด", true);
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
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-[380px] border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in my-auto">
        
        {/* Modal Header with all action buttons on the same row */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] px-3 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-[#5D4037] text-xs truncate">ตั๋ว/ใบเสร็จ (รายวัน)</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Copy Button */}
            <button
              type="button"
              disabled={copying}
              onClick={handleCopy}
              className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title="คัดลอกรูปภาพส่งใน Line"
            >
              {copying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              disabled={sharing}
              onClick={handleShare}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              title="แชร์รูปภาพ"
            >
              {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>แชร์</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2 py-1 bg-[#8B4513] hover:bg-[#5D4037] text-white rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="สั่งพิมพ์ใบเสร็จเครื่องพิมพ์ความร้อน"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์</span>
            </button>

            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowReceiptPreviewModal(false)}
              className="p-1 rounded text-gray-500 hover:bg-[#8B4513]/10 hover:text-black transition-colors cursor-pointer ml-0.5"
              title="ปิด"
            >
              <X className="w-4 h-4 text-[#8B4513]" />
            </button>
          </div>
        </div>

        {/* Modal Body: Receipt Paper Preview */}
        <div className="p-3.5 flex-1 overflow-y-auto bg-gray-100 flex flex-col items-center max-h-[85vh]">
          {/* Printable / Capturable Receipt Card */}
          <div 
            ref={receiptRef} 
            className="w-full max-w-[285px] bg-white p-4 rounded shadow-sm border border-gray-200 text-black font-sans leading-tight text-xs"
          >
            {/* Header & Address */}
            <div className="text-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-16 h-16 mx-auto mb-1 object-contain" 
              />
              <div className="font-extrabold text-[13px] text-black">ตลาดนัดลาดสวายวินเทจ</div>
              <div className="text-[9.5px] font-bold text-black mt-0.5 leading-tight">เลขที่ 52/34 หมู่ 5 ต.ลาดสวาย อ.ลำลูกกา จ.ปทุมธานี 12150</div>
              <div className="text-[9.5px] font-bold text-black leading-tight">โทร: 0-92-869-7774 , 0-92-869-7775</div>
            </div>

            <div className="border-t-2 border-dashed border-black my-2"></div>

            <div className="text-center font-black text-xs text-black mb-1.5">
              ตั๋ว/ใบเสร็จ (รายวัน)
            </div>

            <div className="space-y-0.5 text-[10px] text-black font-semibold">
              <p>เลขที่เอกสาร: <span className="font-mono">{bookingObj.id}</span></p>
              <p>วันที่ทำรายการ: {formattedTransaction}</p>
              <p>ผู้ทำรายการ: {adminUser?.name || 'Staff'}</p>
              <p>วันที่ทำการค้า: <span className="font-bold text-black">{tradingDateFormatted}</span></p>
              <p>ผู้ค้า: <span className="font-bold text-black">{bookingObj.booker_name || '-'}</span></p>
              {bookingObj.product && <p>สินค้าที่ขาย: {bookingObj.product}</p>}
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            <div className="text-center py-1.5 bg-amber-50/40 rounded border border-amber-200/80 my-1.5">
              <span className="text-[10px] text-gray-500 font-bold block">ล็อคที่เช่า</span>
              <span className="text-xl font-black tracking-wider text-[#8B4513] block">{formattedStallName}</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            <table className="w-full text-left text-[11px] border-collapse font-bold">
              <thead>
                <tr className="border-b border-dashed border-gray-400 text-gray-600">
                  <th className="py-1">รายการ</th>
                  <th className="py-1 text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                <tr>
                  <td className="py-1">1. ค่าเช่าล็อค</td>
                  <td className="py-1 text-right font-mono font-bold text-gray-900">{formatPrice(stallPriceVal)}</td>
                </tr>
                {elecPriceVal > 0 && (
                  <tr>
                    <td className="py-1">2. ค่าไฟ ({bookingObj.elec_unit || 0} หน่วย)</td>
                    <td className="py-1 text-right font-mono font-bold text-gray-900">{formatPrice(elecPriceVal)}</td>
                  </tr>
                )}
                {storageFeeVal > 0 && (
                  <tr>
                    <td className="py-1">3. ค่าฝากของ</td>
                    <td className="py-1 text-right font-mono font-bold text-gray-900">{formatPrice(storageFeeVal)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            <div className="space-y-1 font-bold">
              <div className="flex justify-between font-black text-sm">
                <span className="text-gray-800">ยอดรวมทั้งสิ้น:</span>
                <span className="font-mono text-base text-blue-900">{formatPrice(totalAmountVal)}</span>
              </div>
              
              <div className="pt-1 space-y-0.5 text-[10px] font-semibold border-t border-dashed border-gray-400">
                {paymentLines.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700">ชำระด้วย [<span className={p.method === 'เงินสด' ? 'text-emerald-700 font-bold' : 'text-blue-700 font-bold'}>{p.method}</span>]:</span>
                    <span className="font-mono font-bold text-green-700">{formatPrice(p.amount)}</span>
                  </div>
                ))}
                {changeVal > 0 && (
                  <div className="flex justify-between text-blue-700 font-bold pt-0.5">
                    <span>เงินทอน:</span>
                    <span className="font-mono">{formatPrice(changeVal)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            <div className="text-center text-[10px] text-black font-bold space-y-0.5">
              <p>สอบถามค่าล็อค ส่งสลิป ได้ที่</p>
              <p className="font-black text-[11px]">@ladsawaivintage</p>
              <p className="text-[8px] text-gray-400 font-normal mt-2">Power by PJMJK</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
