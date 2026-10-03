'use client';

import React, { useRef, useState } from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { cleanStallName, parseNumber, formatPrice } from '@/utils/numberHelper';
import { formatBookingMonth, monthNamesFull } from '@/utils/thaiDateHelper';
import { copyReceiptImage, shareReceiptImage, normalizePaymentMethodThai } from '@/utils/receiptImageHelper';
import { calculateStallDayPrice } from '@/services/monthly/monthlyPricingService';
import { getDayOccurrences } from '@/services/monthly/monthlyPrintService';
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

  const cleanStall = (name) => (name || '').replace(/[\[\]]/g, '').trim();
  const rawStallNames = (item.stalls || '').replace(/[\[\]]/g, '').split(',').map(x => x.trim()).filter(Boolean);

  // Active days
  const activeDays = [];
  if (item.selected_days?.toLowerCase().includes('wed') || item.selected_days?.includes('พุธ') || (item.stalls_wed && item.stalls_wed.length > 0)) activeDays.push(3);
  if (item.selected_days?.toLowerCase().includes('sat') || item.selected_days?.includes('เสาร์') || (item.stalls_sat && item.stalls_sat.length > 0)) activeDays.push(6);
  if (item.selected_days?.toLowerCase().includes('sun') || item.selected_days?.includes('อาทิตย์') || (item.stalls_sun && item.stalls_sun.length > 0)) activeDays.push(0);

  if (activeDays.length === 0) {
    rawStallNames.forEach(name => {
      if (name.startsWith('ส') && !activeDays.includes(6)) activeDays.push(6);
      if (name.startsWith('อ') && !activeDays.includes(0)) activeDays.push(0);
      if (name.startsWith('พ') && !activeDays.includes(3)) activeDays.push(3);
    });
  }
  if (activeDays.length === 0) activeDays.push(6);

  const isFullPackage = activeDays.includes(3) && activeDays.includes(6) && activeDays.includes(0);

  // Day counts
  const satCount = customCounts?.satCount !== undefined ? customCounts.satCount : getDayOccurrences(item.start_date, 6, activeDays);
  const sunCount = customCounts?.sunCount !== undefined ? customCounts.sunCount : getDayOccurrences(item.start_date, 0, activeDays);
  const wedCount = customCounts?.wedCount !== undefined ? customCounts.wedCount : getDayOccurrences(item.start_date, 3, activeDays);

  const dayGroups = { 6: [], 0: [], 3: [] }; // Sat, Sun, Wed
  if (stallDetailsList && stallDetailsList.length > 0) {
    stallDetailsList.forEach(s => {
      const sMaster = stalls.find(m => m.name === s.name);
      (s.days || []).forEach(d => {
        if (dayGroups[d] !== undefined) {
          const p = s.price || (sMaster ? calculateStallDayPrice(sMaster, d, item.customer_type, isFullPackage) : 0);
          dayGroups[d].push({ name: s.name, price: p });
        }
      });
    });
  }

  if (dayGroups[6].length === 0 && dayGroups[0].length === 0 && dayGroups[3].length === 0) {
    rawStallNames.forEach(stallName => {
      const sMaster = stalls.find(m => m.name === stallName);
      const daysForStall = [];
      if (stallName.startsWith('ส') || (activeDays.includes(6) && !stallName.startsWith('อ') && !stallName.startsWith('พ'))) daysForStall.push(6);
      if (stallName.startsWith('อ') || (activeDays.includes(0) && !stallName.startsWith('ส') && !stallName.startsWith('พ'))) daysForStall.push(0);
      if (stallName.startsWith('พ') || (activeDays.includes(3) && !stallName.startsWith('ส') && !stallName.startsWith('อ'))) daysForStall.push(3);
      if (daysForStall.length === 0) daysForStall.push(6);

      daysForStall.forEach(d => {
        const p = sMaster ? calculateStallDayPrice(sMaster, d, item.customer_type, isFullPackage) : 0;
        dayGroups[d].push({ name: stallName, price: p });
      });
    });
  }

  const grandTotal = parseNumber(item.total_price);
  const elecUnit = parseNumber(item.elec_unit || 0);
  const elecPerDay = elecUnit * 10;
  const storageFee = parseNumber(item.storage_fee || 0);

  // Breakdown rows
  const breakdownRows = [];
  const totalTradingDays = (satCount > 0 && (dayGroups[6].length > 0 || activeDays.includes(6)) ? satCount : 0) +
                           (sunCount > 0 && (dayGroups[0].length > 0 || activeDays.includes(0)) ? sunCount : 0) +
                           (wedCount > 0 && (dayGroups[3].length > 0 || activeDays.includes(3)) ? wedCount : 0);

  let calculatedStallTotal = 0;
  [6, 0, 3].forEach(d => {
    const count = d === 6 ? satCount : d === 0 ? sunCount : wedCount;
    if (count > 0 && dayGroups[d].length > 0) {
      calculatedStallTotal += dayGroups[d].reduce((sum, s) => sum + s.price, 0) * count;
    }
  });

  let fallbackPricePerDay = 0;
  if (calculatedStallTotal === 0 && totalTradingDays > 0) {
    const baseStall = parseNumber(item.stall_price) || (grandTotal - (elecPerDay * totalTradingDays) - storageFee);
    fallbackPricePerDay = Math.round(baseStall / totalTradingDays);
  }

  if (satCount > 0 && (dayGroups[6].length > 0 || activeDays.includes(6))) {
    const sName = dayGroups[6].length > 0 ? dayGroups[6].map(s => cleanStall(s.name)).join(', ') : cleanStall(item.stalls);
    const dayPrice = dayGroups[6].reduce((sum, s) => sum + s.price, 0) || fallbackPricePerDay;
    breakdownRows.push({
      label: `วันเสาร์: ล็อค ${sName}`,
      calc: `${formatPrice(dayPrice)} x ${satCount}`,
      total: dayPrice * satCount
    });
  }

  if (sunCount > 0 && (dayGroups[0].length > 0 || activeDays.includes(0))) {
    const sName = dayGroups[0].length > 0 ? dayGroups[0].map(s => cleanStall(s.name)).join(', ') : cleanStall(item.stalls);
    const dayPrice = dayGroups[0].reduce((sum, s) => sum + s.price, 0) || fallbackPricePerDay;
    breakdownRows.push({
      label: `วันอาทิตย์: ล็อค ${sName}`,
      calc: `${formatPrice(dayPrice)} x ${sunCount}`,
      total: dayPrice * sunCount
    });
  }

  if (wedCount > 0 && (dayGroups[3].length > 0 || activeDays.includes(3))) {
    const sName = dayGroups[3].length > 0 ? dayGroups[3].map(s => cleanStall(s.name)).join(', ') : cleanStall(item.stalls);
    const dayPrice = dayGroups[3].reduce((sum, s) => sum + s.price, 0) || fallbackPricePerDay;
    breakdownRows.push({
      label: `วันพุธ: ล็อค ${sName}`,
      calc: `${formatPrice(dayPrice)} x ${wedCount}`,
      total: dayPrice * wedCount
    });
  }

  if (elecPerDay > 0) {
    const elecDays = totalTradingDays || 1;
    breakdownRows.push({
      label: `ค่าไฟฟ้า: (${elecUnit} หน่วย)`,
      calc: `${formatPrice(elecPerDay)} x ${elecDays}`,
      total: elecPerDay * elecDays
    });
  }

  if (storageFee > 0) {
    breakdownRows.push({
      label: `ค่าฝากของ:`,
      calc: `รายเดือน`,
      total: storageFee
    });
  }

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
        method: p.method || 'โอนเงิน',
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
      method: item.payment_method || 'โอนเงิน',
      amount: totalPaid
    }];
  }

  const remaining = grandTotal - totalPaid;
  const txnNo = customCounts?.txnNo || item.receipt_no || `TXN-${item.id ? item.id.replace(/\D/g, '') : Date.now()}`;
  const filename = `monthly-receipt-${cleanStall(item.stalls)}-${item.booker_name || ''}.png`;

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
            💡 กด <b>"คัดลอกรูป"</b> เพื่อส่งใน Line หรือ <b>"พิมพ์"</b> สำหรับลูกค้าเงินสด
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
              <p>ผู้ทำรายการ: {adminUser?.name || 'ตลาดนัดลาดสวายวินเทจ'}</p>
              <p className="text-black font-bold">ผู้เช่า: <span className="font-extrabold text-[#8B4513]">{item.booker_name || '-'}</span></p>
              <p>สินค้า: {item.product || 'ของชำทั่วไป'}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            {/* Rent Breakdown */}
            <div className="space-y-1 text-[10.5px]">
              <div className="text-[11px] font-black text-black mb-1">
                รายละเอียดการเช่า:
              </div>
              <div className="space-y-1">
                {breakdownRows.map((row, idx) => (
                  <div key={idx} className="flex justify-between items-baseline font-bold text-gray-800">
                    <div>
                      <span>{row.label}</span>
                      <span className="text-[9.5px] text-gray-500 font-normal ml-1">({row.calc})</span>
                    </div>
                    <span className="font-mono text-black font-extrabold">{formatPrice(row.total)} บ.</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-1.5"></div>
              
              <div className="flex justify-between text-xs font-black text-black">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span className="font-mono text-sm">{formatPrice(grandTotal)} บ.</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5"></div>

            {/* Payments History Table */}
            <div className="space-y-1 text-[10px]">
              <div className="text-[10.5px] font-black text-black mb-0.5">
                ประวัติการชำระเงิน:
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-500 font-bold text-[9px]">
                    <th className="py-0.5">วันที่ชำระ</th>
                    <th className="py-0.5 text-center">ช่องทางชำระ</th>
                    <th className="py-0.5 text-right">จำนวน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td className="py-1">{p.date}</td>
                      <td className="py-1 text-center font-bold text-gray-700">{normalizePaymentMethodThai(p.method)}</td>
                      <td className="py-1 text-right font-mono font-bold">{formatPrice(p.amount)} บ.</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between text-green-800 font-black pt-1 border-t border-gray-300 text-[10.5px]">
                <span>ชำระแล้วรวม:</span>
                <span className="font-mono">{formatPrice(totalPaid)} บ.</span>
              </div>

              {remaining > 0 ? (
                <div className="flex justify-between text-red-700 font-black text-[10.5px]">
                  <span>ยอดค้างชำระ:</span>
                  <span className="font-mono">{formatPrice(remaining)} บ.</span>
                </div>
              ) : (
                <div className="text-center py-1 mt-1 bg-green-50 text-green-700 font-black text-[10px] rounded border border-green-200">
                  ✓ ชำระครบถ้วนแล้ว
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

        {/* Modal Footer Actions - Single clean row */}
        <div className="bg-[#FAEBD7] border-t border-[#8B4513]/20 p-2.5 flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={copying}
            onClick={handleCopy}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
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
            className="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
          >
            {sharing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>แชร์รูป (ส่ง Line)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMonthlyReceiptPreviewModal(false)}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
