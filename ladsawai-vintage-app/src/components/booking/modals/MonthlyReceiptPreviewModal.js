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
  const elecRate = item.elec_unit !== undefined && item.elec_unit !== null
    ? parseNumber(item.elec_unit) * 10
    : 20;
  const storageFee = parseNumber(item.storage_fee || 0);

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
    const baseStall = parseNumber(item.stall_price) || (grandTotal - (elecRate * totalTradingDays) - storageFee);
    fallbackPricePerDay = Math.round(baseStall / totalTradingDays);
  }

  const formatPriceInt = (val) => {
    const n = parseNumber(val);
    return n.toLocaleString();
  };

  // Day breakdown rows (exactly matching thermal paper print with color accents)
  const dayBreakdownRows = [];
  if (satCount > 0 && (dayGroups[6].length > 0 || activeDays.includes(6))) {
    const sName = dayGroups[6].length > 0 ? dayGroups[6].map(x => cleanStall(x.name)).join(', ') : cleanStall(item.stalls);
    const dayPrice = dayGroups[6].reduce((sum, x) => sum + x.price, 0) || fallbackPricePerDay;
    const sTotal = dayPrice * satCount;
    dayBreakdownRows.push({
      type: 'sat',
      dayLabel: 'วันเสาร์',
      dayColor: 'text-purple-700',
      stallName: sName,
      calc: `${formatPriceInt(dayPrice)} x ${satCount} วัน`,
      total: sTotal
    });
  }

  if (sunCount > 0 && (dayGroups[0].length > 0 || activeDays.includes(0))) {
    const sName = dayGroups[0].length > 0 ? dayGroups[0].map(x => cleanStall(x.name)).join(', ') : cleanStall(item.stalls);
    const dayPrice = dayGroups[0].reduce((sum, x) => sum + x.price, 0) || fallbackPricePerDay;
    const sTotal = dayPrice * sunCount;
    dayBreakdownRows.push({
      type: 'sun',
      dayLabel: 'วันอาทิตย์',
      dayColor: 'text-rose-600',
      stallName: sName,
      calc: `${formatPriceInt(dayPrice)} x ${sunCount} วัน`,
      total: sTotal
    });
  }

  if (wedCount > 0 && (dayGroups[3].length > 0 || activeDays.includes(3))) {
    const sName = dayGroups[3].length > 0 ? dayGroups[3].map(x => cleanStall(x.name)).join(', ') : cleanStall(item.stalls);
    const dayPrice = dayGroups[3].reduce((sum, x) => sum + x.price, 0) || fallbackPricePerDay;
    const sTotal = dayPrice * wedCount;
    dayBreakdownRows.push({
      type: 'wed',
      dayLabel: 'วันพุธ',
      dayColor: 'text-emerald-700',
      stallName: sName,
      calc: `${formatPriceInt(dayPrice)} x ${wedCount} วัน`,
      total: sTotal
    });
  }

  if (elecRate > 0) {
    const allDays = totalTradingDays || 1;
    const totalElec = elecRate * allDays;
    dayBreakdownRows.push({
      type: 'elec',
      dayLabel: `ค่าไฟฟ้า (${item.elec_unit || 0} หน่วย)`,
      dayColor: 'text-amber-700',
      stallName: null,
      calc: `${formatPriceInt(elecRate)} x ${allDays} วัน`,
      total: totalElec
    });
  }

  if (storageFee > 0) {
    dayBreakdownRows.push({
      type: 'storage',
      dayLabel: `ค่าฝากของรายเดือน`,
      dayColor: 'text-blue-700',
      stallName: null,
      calc: null,
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

  const percentage = grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : 0;
  const remaining = grandTotal - totalPaid;
  const txnNo = customCounts?.txnNo || item.receipt_no || `TXN-${item.id ? item.id.replace(/\D/g, '') : Date.now()}`;
  const productName = customCounts?.product || item.product || 'ของชำทั่วไป';
  const empCode = adminUser?.email ? adminUser.email.replace(/[@.]/g, '') : (adminUser?.name || 'admin');
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
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-[380px] border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in my-auto">
        
        {/* Modal Header with all action buttons on the same row */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] px-3 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-[#5D4037] text-xs truncate">ตั๋ว/ใบเสร็จ (รายเดือน)</span>
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
              onClick={() => setShowMonthlyReceiptPreviewModal(false)}
              className="p-1 rounded text-gray-500 hover:bg-[#8B4513]/10 hover:text-black transition-colors cursor-pointer ml-0.5"
              title="ปิด"
            >
              <X className="w-4 h-4 text-[#8B4513]" />
            </button>
          </div>
        </div>

        {/* Modal Body: Receipt Paper Preview (Exact Paper Structure + Clear Color Accents) */}
        <div className="p-3.5 flex-1 overflow-y-auto bg-gray-100 flex flex-col items-center max-h-[85vh]">
          {/* Printable / Capturable Receipt Card */}
          <div 
            ref={receiptRef} 
            className="w-full max-w-[285px] bg-white p-4 rounded shadow-sm border border-gray-200 text-black font-sans leading-tight text-xs"
          >
            {/* 1. Header & Address */}
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

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 2. Document Title */}
            <div className="text-center font-black text-xs text-black mb-1.5">
              ตั๋ว/ใบเสร็จ (รายเดือน)
            </div>

            {/* 3. Metadata Table with colored highlights */}
            <table className="w-full text-[10px] text-gray-800 border-collapse">
              <tbody>
                <tr>
                  <td className="w-[36%] py-0.5 font-bold whitespace-nowrap text-gray-600">เลขที่ :</td>
                  <td className="text-right py-0.5 font-mono text-[9px] text-gray-700">{txnNo}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold whitespace-nowrap text-gray-600">วันที่ทำรายการ :</td>
                  <td className="text-right py-0.5 text-gray-800">{formattedTransaction}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold whitespace-nowrap text-gray-600">รหัสพนักงาน :</td>
                  <td className="text-right py-0.5 font-mono text-[9px] text-gray-700">{empCode}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold whitespace-nowrap text-gray-600">ประจำเดือน :</td>
                  <td className="text-right py-0.5 font-black text-xs text-black">{invoiceMonth}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold whitespace-nowrap text-gray-600">ผู้จอง :</td>
                  <td className="text-right py-0.5 font-black text-xs text-[#8B4513]">{item.booker_name || item.customer_name || '-'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-bold whitespace-nowrap text-gray-600">สินค้า :</td>
                  <td className="text-right py-0.5 font-bold text-xs text-gray-800">{productName}</td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 4. Day Breakdown Table with distinct Day & Stall Colors */}
            <table className="w-full text-[10.5px] border-collapse">
              <tbody>
                {dayBreakdownRows.map((d, idx) => (
                  <React.Fragment key={idx}>
                    <tr>
                      <td className="font-bold text-left py-0.5 text-gray-800">
                        <span className={`${d.dayColor} font-black`}>{d.dayLabel}</span>
                        {d.stallName && (
                          <span> ล็อค : <strong className="text-[#8B4513] font-black">{d.stallName}</strong></span>
                        )}
                      </td>
                      <td className="font-bold font-mono text-right py-0.5 text-gray-900">{formatPrice(d.total)}</td>
                    </tr>
                    {d.calc && (
                      <tr>
                        <td colSpan={2} className="text-[9.5px] text-gray-500 font-semibold pb-1.5 pl-0.5">
                          {d.calc}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 5. Payments History Table */}
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-dashed border-gray-400 font-bold text-gray-600">
                  <th className="text-left pb-1">วันชำระ</th>
                  <th className="text-center pb-1">ช่องทางชำระ</th>
                  <th className="text-right pb-1">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1 font-semibold text-gray-700">{p.date}</td>
                    <td className="py-1 text-center font-bold">
                      <span className={p.method === 'เงินสด' ? 'text-emerald-700' : 'text-blue-700'}>
                        {normalizePaymentMethodThai(p.method)}
                      </span>
                    </td>
                    <td className="py-1 text-right font-mono font-bold text-gray-900">{formatPrice(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 6. Summary Totals Table with intuitive financial colors */}
            <table className="w-full text-[11px] font-bold border-collapse">
              <tbody>
                <tr>
                  <td className="text-right font-extrabold pr-2 py-0.5 text-gray-800">รวมเป็นเงินทั้งสิ้น :</td>
                  <td className="text-right font-mono font-black text-xs py-0.5 text-blue-900">{formatPrice(grandTotal)}</td>
                </tr>
                <tr>
                  <td className="text-right font-bold pr-2 pt-1 border-t border-dashed border-gray-400 text-green-700">ชำระแล้วรวมทั้งสิ้น :</td>
                  <td className="text-right font-mono font-black text-xs pt-1 border-t border-dashed border-gray-400 text-green-700">{formatPrice(totalPaid)}</td>
                </tr>
                <tr>
                  <td className="text-right font-bold pr-2 py-0.5 text-blue-700">คิดเป็นเปอร์เซ็นต์ :</td>
                  <td className="text-right font-mono font-bold py-0.5 text-blue-700">{percentage}%</td>
                </tr>
                <tr className="border-t border-b border-dashed border-gray-400">
                  <td className={`text-right font-extrabold pr-2 py-1 ${remaining > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    ค้างชำระ/คงเหลือ :
                  </td>
                  <td className={`text-right font-mono font-black text-xs py-1 ${remaining > 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {formatPrice(remaining)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            {/* 7. Footer Notice */}
            <div className="text-center text-[10px] space-y-0.5 font-bold text-black mt-2">
              <div>สอบถามค่าล็อค ส่งสลิป ได้ที่</div>
              <div className="text-[11px] font-black mt-0.5">@ladsawaivintage</div>
              <div className="text-[8px] text-gray-400 font-normal mt-2.5">Power by PJMJK</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
