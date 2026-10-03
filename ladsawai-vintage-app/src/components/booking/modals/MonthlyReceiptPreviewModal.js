'use client';

import React, { useRef, useState } from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { cleanStallName, parseNumber, formatPrice } from '@/utils/numberHelper';
import { formatBookingMonth, monthNamesFull } from '@/utils/thaiDateHelper';
import { copyReceiptImage, shareOrCopyReceiptImage } from '@/utils/receiptImageHelper';
import { Printer, Copy, Check, Share2, X, Loader2 } from 'lucide-react';

export default function MonthlyReceiptPreviewModal() {
  const {
    showMonthlyReceiptPreviewModal,
    setShowMonthlyReceiptPreviewModal,
    monthlyReceiptPreviewData,
    stalls,
    activeMonthlyTransactions,
    handlePrintMonthlyReceiptDirect,
    showAlert
  } = useMonthlyBooking();
  const { adminUser } = useAuthAdmin();

  const receiptRef = useRef(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!showMonthlyReceiptPreviewModal || !monthlyReceiptPreviewData) return null;

  const item = monthlyReceiptPreviewData.item || monthlyReceiptPreviewData;
  if (!item) return null;

  const customCounts = monthlyReceiptPreviewData.customCounts || null;
  const now = new Date();
  const formattedTransaction = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

  let invoiceMonth = customCounts?.month || formatBookingMonth(item.booking_month);
  if (invoiceMonth === '-') {
    const thaiMonth = monthNamesFull[now.getMonth()];
    const thaiYear = now.getFullYear() + 543;
    invoiceMonth = `${thaiMonth} ${thaiYear}`;
  }

  // Parse stalls details
  let stallDetailsList = [];
  try {
    if (typeof item.stall_details === 'string') {
      stallDetailsList = JSON.parse(item.stall_details);
    } else if (Array.isArray(item.stall_details)) {
      stallDetailsList = item.stall_details;
    }
  } catch (e) {
    stallDetailsList = [];
  }

  const dayGroups = { 6: [], 0: [], 3: [] }; // Sat, Sun, Wed
  stallDetailsList.forEach(s => {
    (s.days || []).forEach(d => {
      if (dayGroups[d]) dayGroups[d].push(s);
    });
  });

  const elecRate = (parseNumber(item.elec_unit || 0) * 10);
  const cleanStall = (name) => (name || '').replace(/[\[\]]/g, '').trim();

  // Transactions list
  const txns = customCounts?.payments || (activeMonthlyTransactions?.length > 0 ? activeMonthlyTransactions : []);
  let payments = [];
  let totalPaid = 0;

  if (txns.length > 0) {
    payments = txns.map(p => {
      const amt = parseNumber(p.total_amount || p.amount);
      totalPaid += amt;
      let pDateStr = '';
      if (p.dateStr) {
        pDateStr = p.dateStr;
      } else if (p.date) {
        const d = new Date(p.date);
        pDateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : p.date;
      } else if (p.timestamp) {
        const d = new Date(p.timestamp);
        pDateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      } else {
        pDateStr = now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return {
        date: pDateStr,
        method: p.method || 'โอนจ่าย',
        amount: amt
      };
    });
  } else if (item.paid_amount > 0) {
    totalPaid = parseNumber(item.paid_amount);
    let pDateStr = '';
    const dateSource = item.start_date || item.timestamp || item.created_at;
    if (dateSource) {
      const d = new Date(dateSource);
      pDateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : dateSource;
    } else {
      pDateStr = now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    payments = [{
      date: pDateStr,
      method: item.payment_method || 'โอนจ่าย',
      amount: totalPaid
    }];
  }

  const grandTotal = parseNumber(item.total_price);
  const remaining = grandTotal - totalPaid;
  const txnNo = customCounts?.txnNo || item.receipt_no || `TXN-${item.id ? item.id.replace(/\D/g, '') : Date.now()}`;
  const filename = `monthly-receipt-${cleanStall(item.stalls)}-${item.booker_name || ''}.png`;

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
    if (typeof handlePrintMonthlyReceiptDirect === 'function') {
      handlePrintMonthlyReceiptDirect(item);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in my-auto">
        
        {/* Modal Header */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] px-3.5 py-2.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-[#8B4513]" />
            <span className="font-extrabold text-[#5D4037] text-xs">ใบเสร็จรับเงิน (รายเดือน)</span>
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
              onClick={() => setShowMonthlyReceiptPreviewModal(false)}
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
              <p className="text-[9px] text-gray-700 font-bold text-center">ใบเสร็จรับเงิน (รายเดือน)</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            <div className="space-y-0.5 text-[10px] text-gray-800 font-semibold">
              <p>เลขที่ใบเสร็จ: <span className="font-mono">{txnNo}</span></p>
              <p>วันที่ออกตั๋ว: {formattedTransaction}</p>
              <p className="text-black font-bold">รอบเดือน: {invoiceMonth}</p>
              <p>ผู้ทำรายการ: {adminUser?.name || 'Admin'}</p>
              <p className="text-black font-bold">ผู้เช่า: <span className="font-extrabold text-[#8B4513]">{item.booker_name || '-'}</span></p>
              <p>สินค้า: {item.product || 'ของชำทั่วไป'}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            <div className="text-center py-1 bg-amber-50/60 rounded border border-amber-200/50 my-1.5">
              <span className="text-[10px] text-gray-600 font-bold block">ล็อคที่เช่า</span>
              <span className="text-xl font-black tracking-wider text-black block">{cleanStall(item.stalls)}</span>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            {/* Days Breakdown */}
            <div className="space-y-1 text-[11px] font-bold">
              <div className="flex justify-between">
                <span>ค่าเช่าพื้นที่ (รายเดือน):</span>
                <span className="font-mono">{formatPrice(grandTotal)} บ.</span>
              </div>
              {elecRate > 0 && (
                <div className="flex justify-between text-amber-900 text-[10px]">
                  <span>ค่าไฟต่อรอบ ({item.elec_unit || 0} หน่วย):</span>
                  <span className="font-mono">{formatPrice(elecRate)} บ./วัน</span>
                </div>
              )}
              {item.storage_fee > 0 && (
                <div className="flex justify-between text-blue-900 text-[10px]">
                  <span>ค่าฝากของรายเดือน:</span>
                  <span className="font-mono">{formatPrice(item.storage_fee)} บ.</span>
                </div>
              )}
              <div className="border-t border-gray-300 my-1"></div>
              <div className="flex justify-between text-sm font-black text-black">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span className="font-mono text-base">{formatPrice(grandTotal)} บ.</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            {/* Payments History */}
            <div className="space-y-0.5 text-[10px] font-semibold text-gray-800">
              <p className="font-bold">ประวัติการชำระเงิน:</p>
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between text-gray-700 pl-2">
                  <span>- {p.date} ({p.method}):</span>
                  <span className="font-mono font-bold">{formatPrice(p.amount)} บ.</span>
                </div>
              ))}
              <div className="flex justify-between text-green-800 font-bold pl-2 pt-0.5">
                <span>ชำระแล้วรวม:</span>
                <span className="font-mono">{formatPrice(totalPaid)} บ.</span>
              </div>
              {remaining > 0 ? (
                <div className="flex justify-between text-red-700 font-black pl-2 pt-0.5">
                  <span>ยอดค้างชำระ:</span>
                  <span className="font-mono">{formatPrice(remaining)} บ.</span>
                </div>
              ) : (
                <div className="text-center py-0.5 mt-1 bg-green-50 text-green-700 font-black text-[10px] rounded border border-green-200">
                  ชำระครบถ้วนแล้ว
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
              onClick={() => setShowMonthlyReceiptPreviewModal(false)}
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
