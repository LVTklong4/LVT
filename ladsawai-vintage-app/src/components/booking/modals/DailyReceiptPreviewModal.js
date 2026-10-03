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

  const tradingDayOfWeek = tradingDateObj.getDay();
  const dayColor = tradingDayOfWeek === 6 ? 'text-purple-700' : tradingDayOfWeek === 0 ? 'text-rose-600' : tradingDayOfWeek === 3 ? 'text-emerald-700' : 'text-gray-900';
  const empCode = adminUser ? (adminUser.name || 'Admin') : 'Admin';

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
            {/* 1. Header & Address matching receiptPrinter.js */}
            <div className="text-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-16 h-16 mx-auto mb-1 object-contain" 
              />
              <div className="font-extrabold text-[13px] text-gray-900 leading-tight">ตลาดลาดสวายวินเทจ</div>
              <div className="text-[8.5px] font-bold text-gray-500 leading-tight mt-0.5">Ladsawai Vintage Market</div>
              <div className="text-[8.5px] font-bold text-gray-500 leading-tight">เลขที่ 52/34 หมู่ 5</div>
              <div className="text-[8.5px] font-bold text-gray-500 leading-tight">ต.ลาดสวาย อ.ลำลูกกา จ.ปทุมธานี 12150</div>
              <div className="text-[8.5px] font-bold text-gray-500 leading-tight">บริการเช่าพื้นที่จองล็อค ตลาดนัดรายวัน-รายเดือน</div>
              <div className="text-[8.5px] font-bold text-gray-500 leading-tight">โทร: 0-92-869-7774 , 0-92-869-7775</div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 2. Metadata (flex-row: label left, val right) */}
            <div className="space-y-1 text-[9.5px] text-gray-600 font-bold">
              <div className="flex justify-between items-center">
                <span>เลขที่เอกสาร:</span>
                <span className="font-mono text-gray-900 font-bold">{bookingObj.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ผู้ทำรายการ:</span>
                <span className="text-gray-900 font-bold">{empCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>วันที่ทำรายการ:</span>
                <span className="font-mono text-gray-900 font-bold">{formattedTransaction}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 3. Trade Details matching receiptPrinter.js */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">วันที่ทำการค้า:</span>
                <span className={`font-black ${dayColor}`}>{tradingDateFormatted}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 font-bold shrink-0">ล็อกที่เช่า:</span>
                <span className="font-black text-rose-600 text-sm tracking-wide text-right">{formattedStallName}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 font-bold shrink-0">ผู้ค้า:</span>
                <span className="font-bold text-[#8B4513] text-right">{bookingObj.booker_name || '-'}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 font-bold shrink-0">สินค้าที่ขาย:</span>
                <span className="font-bold text-gray-800 text-right">{bookingObj.product || '-'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 4. Price Table matching receiptPrinter.js */}
            <table className="w-full text-left text-[10.5px] border-collapse font-bold">
              <thead>
                <tr className="border-b border-dashed border-gray-400 text-gray-600">
                  <th className="py-1">รายการ</th>
                  <th className="py-1 text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                <tr>
                  <td className="py-1">ค่าล็อกสะสม</td>
                  <td className="py-1 text-right font-mono font-bold text-gray-900">{formatPrice(stallPriceVal)} บ.</td>
                </tr>
                {elecPriceVal > 0 && (
                  <tr>
                    <td className="py-1 text-amber-700">ค่าไฟ ({bookingObj.elec_unit || 0} หน่วย)</td>
                    <td className="py-1 text-right font-mono font-bold text-amber-700">{formatPrice(elecPriceVal)} บ.</td>
                  </tr>
                )}
                {storageFeeVal > 0 && (
                  <tr>
                    <td className="py-1 text-blue-700">ค่าฝากของ</td>
                    <td className="py-1 text-right font-mono font-bold text-blue-700">{formatPrice(storageFeeVal)} บ.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 5. Total and Payments Breakdown matching receiptPrinter.js */}
            <div className="space-y-1">
              <div className="flex justify-between items-center font-black text-sm">
                <span className="text-gray-800">รวมเงินทั้งสิ้น:</span>
                <span className="font-mono text-blue-900 font-black">{formatPrice(totalAmountVal)} บ.</span>
              </div>

              <div className="pt-1.5 space-y-1 text-[10px] border-t border-dashed border-gray-300">
                {paymentLines.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold">
                      ชำระด้วย [<span className={p.method === 'เงินสด' ? 'text-emerald-700 font-bold' : 'text-blue-700 font-bold'}>{p.method}</span>]:
                    </span>
                    <span className="font-mono font-bold text-green-700">{formatPrice(p.amount)} บ.</span>
                  </div>
                ))}
                {changeVal > 0 && (
                  <div className="flex justify-between items-center text-blue-700 font-bold pt-0.5">
                    <span>เงินทอน:</span>
                    <span className="font-mono font-bold">{formatPrice(changeVal)} บ.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 6. Footer matching receiptPrinter.js */}
            <div className="text-center text-[9.5px] font-bold text-gray-700 space-y-1">
              <div>Line Official: @ladsawaivintage</div>
              <div className="text-[11px] font-black text-gray-900 mt-1">ขอบคุณที่ใช้บริการครับ/ค่ะ</div>
              <div className="text-[8px] text-gray-400 font-normal mt-2.5">Powered by PJMJK</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
