'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Info } from 'lucide-react';

export default function InvoicePreviewModal() {
  const {
    cleanStallName,    formatBookingMonth,    getDayOccurrences,    invoicePreviewItem,    parseNumber,    product,    setInvoicePreviewItem,    stalls
  } = useBooking();

  if (!invoicePreviewItem) return null;

  const handlePrintInvoice = () => {
    let details = [];
    try {
      details = JSON.parse(invoicePreviewItem.stall_details || '[]');
    } catch (e) {}

    const isFullPackage = invoicePreviewItem.selected_days?.toLowerCase().includes('wed') &&
                          invoicePreviewItem.selected_days?.toLowerCase().includes('sat') &&
                          invoicePreviewItem.selected_days?.toLowerCase().includes('sun');

    const elecRate = parseNumber(invoicePreviewItem.elec_unit || 0) * 10;
    const dayNames = { 3: 'วันพุธ', 6: 'วันเสาร์', 0: 'วันอาทิตย์' };

    const dayGroups = { 3: [], 6: [], 0: [] };

    details.forEach((stallDetail) => {
      const stallName = stallDetail.name;
      const sMaster = stalls.find(s => s.name === stallName);
      if (!sMaster) return;

      const stallDays = Array.isArray(stallDetail.days) ? stallDetail.days : [];
      [3, 6, 0].forEach((dNum) => {
        if (stallDays.includes(dNum)) {
          let price = sMaster.price_wed;
          if (dNum === 6) price = sMaster.price_sat;
          if (dNum === 0) price = sMaster.price_sun;

          if (invoicePreviewItem.customer_type === 'Standard' && isFullPackage && sMaster.price_month > 0) {
            const normalSum = parseNumber(sMaster.price_wed) + parseNumber(sMaster.price_sat) + parseNumber(sMaster.price_sun);
            const packageSum = 3 * parseNumber(sMaster.price_month);
            const weeklyDiscount = Math.max(0, normalSum - packageSum);
            const satDiscount = weeklyDiscount >= 100 ? 50 : weeklyDiscount;
            const sunDiscount = weeklyDiscount >= 100 ? (weeklyDiscount - 50) : 0;

            if (dNum === 3) price = sMaster.price_wed;
            else if (dNum === 6) price = sMaster.price_sat - satDiscount;
            else if (dNum === 0) price = sMaster.price_sun - sunDiscount;
          }
          if (invoicePreviewItem.customer_type === 'VIP') price = 0;

          dayGroups[dNum].push({
            name: stallName,
            price: price,
            elec: elecRate
          });
        }
      });
    });

    let itemsHtml = '';
    let totalNadsCount = 0;

    [3, 6, 0].forEach((dNum) => {
      const group = dayGroups[dNum];
      if (group.length > 0) {
        const count = getDayOccurrences(invoicePreviewItem.start_date, dNum, [dNum]);
        if (count > 0) {
          totalNadsCount += count;
          const totalStallPrice = group.reduce((sum, item) => sum + item.price, 0);
          const totalElecRate = group.reduce((sum, item) => sum + item.elec, 0);
          const subTotal = (totalStallPrice + totalElecRate) * count;
          const stallNamesStr = group.map(item => cleanStallName(item.name)).join(', ');

          itemsHtml += `
            <tr>
              <td class="bold">${dayNames[dNum]} ล็อค : ${stallNamesStr}</td>
              <td class="val">${subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} บ.</td>
            </tr>
            <tr class="calc-row">
              <td>(${totalStallPrice} x ${count}) + (${totalElecRate} x ${count})</td>
              <td></td>
            </tr>
          `;
        }
      }
    });

    if (parseNumber(invoicePreviewItem.storage_fee) > 0) {
      itemsHtml += `
        <tr>
          <td class="bold">📦 ค่าฝากของ</td>
          <td class="val">${parseNumber(invoicePreviewItem.storage_fee).toLocaleString(undefined, {minimumFractionDigits: 2})} บ.</td>
        </tr>
      `;
    }

    const grandTotal = parseNumber(invoicePreviewItem.total_price);
    const paidAmount = parseNumber(invoicePreviewItem.paid_amount || 0);
    const remaining = grandTotal - paidAmount;
    const now = new Date();
    const formattedTransaction = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

    const invoiceMonth = formatBookingMonth(invoicePreviewItem.booking_month);

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์ใบแจ้งหนี้');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>พิมพ์ใบแจ้งหนี้ (รายเดือน)</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              width: 72mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              background: #fff;
              color: #000;
              font-size: 11pt;
              line-height: 1.4;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .logo {
              width: 25mm;
              height: auto;
              margin: 0 auto 2mm auto;
              display: block;
            }
            .divider {
              border-top: 1.5px dashed #000;
              margin: 3mm 0;
            }
            .title {
              font-size: 13pt;
              font-weight: 800;
              margin: 2mm 0 1mm 0;
            }
            .subtitle {
              font-size: 10pt;
              font-weight: bold;
              color: #000;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .info-table td {
              padding: 1.2mm 0;
              vertical-align: top;
              font-size: 10.5pt;
            }
            .info-table td.label {
              width: 32%;
              white-space: nowrap;
            }
            .info-table td.val {
              text-align: right;
              font-weight: bold;
            }
            .price-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .price-table td {
              padding: 1.2mm 0;
              font-size: 10.5pt;
            }
            .price-table td.val {
              text-align: right;
              font-weight: bold;
            }
            .calc-row td {
              font-size: 9.5pt;
              color: #333;
              padding-top: 0 !important;
              padding-bottom: 2mm !important;
            }
            .total-row td {
              font-size: 11.5pt;
              font-weight: bold;
              padding-top: 2mm;
            }
            .total-row td.val {
              font-size: 12.5pt;
              font-weight: 800;
            }
            .bank-box {
              background: #f0fdf4;
              border: 1px dashed #166534;
              padding: 2.5mm;
              border-radius: 1.5mm;
              margin-top: 4mm;
              font-size: 10pt;
              line-height: 1.5;
            }
            .bank-title {
              font-size: 9.5pt;
              color: #166534;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .bank-detail {
              font-size: 11pt;
              font-weight: 800;
              color: #052e16;
            }
            .footer-msg {
              font-size: 9pt;
              text-align: center;
              margin-top: 6mm;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" class="logo" />
            <div class="title">ตลาดนัดลาดสวายวินเทจ</div>
            <div class="subtitle">ใบแจ้งยอดชำระเงิน (Invoice)</div>
          </div>
          
          <div class="divider"></div>
          
          <table class="info-table">
            <tr>
              <td class="label">ประจำเดือน:</td>
              <td class="val">${invoiceMonth}</td>
            </tr>
            <tr>
              <td class="label">ผู้เช่า/สินค้า:</td>
              <td class="val">${invoicePreviewItem.booker_name} / ${invoicePreviewItem.product || 'ทั่วไป'}</td>
            </tr>
            <tr>
              <td class="label">เบอร์โทรศัพท์:</td>
              <td class="val">${invoicePreviewItem.phone || '-'}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="price-table">
            <tr class="calc-row">
              <td class="bold">จำนวนทั้งหมด ${totalNadsCount} นัด</td>
              <td></td>
            </tr>
            ${itemsHtml}
          </table>
          
          <div class="divider"></div>
          
          <table class="price-table">
            <tr class="total-row">
              <td>ยอดรวมทั้งสิ้น:</td>
              <td class="val">${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} บ.</td>
            </tr>
            <tr>
              <td>ชำระแล้ว:</td>
              <td class="val" style="color: #15803d;">${paidAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} บ.</td>
            </tr>
            <tr class="total-row" style="border-top: 1px dashed #000;">
              <td>ยอดค้างชำระสุทธิ:</td>
              <td class="val" style="color: #b91c1c;">${remaining.toLocaleString(undefined, {minimumFractionDigits: 2})} บ.</td>
            </tr>
          </table>
          
          <div class="bank-box">
            <div class="bank-title">ช่องทางการชำระเงิน</div>
            <div class="bank-detail">ธนาคารกสิกรไทย (KBANK)</div>
            <div class="bank-detail">เลขบัญชี : 204-1-25235-1</div>
            <div class="bold" style="margin-top: 1mm; font-size: 9.5pt;">บจก.เดอะเบสพัฒนาและธุรกิจ</div>
          </div>
          
          <div class="footer-msg">
            พิมพ์เมื่อ: ${formattedTransaction}
          </div>
        </body>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        <\/script>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-sm border border-[#8B4513]/30 overflow-hidden flex flex-col animate-pop-in text-gray-800 font-sans text-xs">
              {/* Modal Actions Header */}
              <div className="bg-[#5D4037] text-white px-4 py-2 flex justify-between items-center shrink-0 border-b border-[#8B4513] text-xs">
                <span className="font-bold">พรีวิวใบแจ้งยอดชำระเงิน</span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    พิมพ์
                  </button>
                  <button 
                    onClick={() => setInvoicePreviewItem(null)} 
                    className="p-0.5 rounded-full hover:bg-white/10 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="lvt-invoice-print-area" className="p-6 bg-[#FFFDF9] text-left flex flex-col gap-4">
                {/* Header Info */}
                <div className="flex flex-col items-center text-center gap-1">
                  <img src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" className="h-14 w-14 object-contain" />
                  <h2 className="font-extrabold text-base text-gray-900 mt-1">ตลาดนัดลาดสวายวินเทจ</h2>
                  <div className="text-[10px] font-bold text-purple-700 bg-purple-50 px-3 py-0.5 rounded-full border border-purple-200">
                    ใบแจ้งยอดชำระเงิน (Invoice)
                  </div>
                </div>

                {/* Customer Box */}
                <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-3 text-xs flex flex-col gap-1.5 font-bold">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ประจำเดือน</span>
                    <span className="text-purple-700">{formatBookingMonth(invoicePreviewItem.booking_month)}</span>
                  </div>
                  <div className="flex flex-col border-t border-purple-100/50 pt-1.5 mt-0.5">
                    <span className="text-gray-500 mb-0.5">ผู้จอง/สินค้า</span>
                    <span className="text-gray-800">{invoicePreviewItem.booker_name} / {invoicePreviewItem.product || 'ทั่วไป'}</span>
                  </div>
                </div>

                {/* Billing Table */}
                <div className="flex flex-col text-xs">
                  <div className="flex justify-between border-b pb-1.5 text-gray-500 font-bold text-[10px]">
                    <span>รายการ (รายละเอียด)</span>
                    <span className="w-20 text-right">จำนวนเงิน</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {(() => {
                      let details = [];
                      try {
                        details = JSON.parse(invoicePreviewItem.stall_details || '[]');
                      } catch (e) {}

                      const isFullPackage = invoicePreviewItem.selected_days?.toLowerCase().includes('wed') &&
                                            invoicePreviewItem.selected_days?.toLowerCase().includes('sat') &&
                                            invoicePreviewItem.selected_days?.toLowerCase().includes('sun');

                      const elecRate = parseNumber(invoicePreviewItem.elec_unit || 0) * 10;
                      let itemsHtml = [];
                      let totalNadsCount = 0;
                      const dayNames = { 3: 'วันพุธ', 6: 'วันเสาร์', 0: 'วันอาทิตย์' };

                      // Group by day of week
                      const dayGroups = { 3: [], 6: [], 0: [] };

                      details.forEach((stallDetail) => {
                        const stallName = stallDetail.name;
                        const sMaster = stalls.find(s => s.name === stallName);
                        if (!sMaster) return;

                        const stallDays = Array.isArray(stallDetail.days) ? stallDetail.days : [];
                        [3, 6, 0].forEach((dNum) => {
                          if (stallDays.includes(dNum)) {
                            let price = sMaster.price_wed;
                            if (dNum === 6) price = sMaster.price_sat;
                            if (dNum === 0) price = sMaster.price_sun;

                            if (invoicePreviewItem.customer_type === 'Standard' && isFullPackage && sMaster.price_month > 0) {
                              const normalSum = parseNumber(sMaster.price_wed) + parseNumber(sMaster.price_sat) + parseNumber(sMaster.price_sun);
                              const packageSum = 3 * parseNumber(sMaster.price_month);
                              const weeklyDiscount = Math.max(0, normalSum - packageSum);
                              const satDiscount = weeklyDiscount >= 100 ? 50 : weeklyDiscount;
                              const sunDiscount = weeklyDiscount >= 100 ? (weeklyDiscount - 50) : 0;

                              if (dNum === 3) price = sMaster.price_wed;
                              else if (dNum === 6) price = sMaster.price_sat - satDiscount;
                              else if (dNum === 0) price = sMaster.price_sun - sunDiscount;
                            }
                            if (invoicePreviewItem.customer_type === 'VIP') price = 0;

                            dayGroups[dNum].push({
                              name: stallName,
                              price: price,
                              elec: elecRate
                            });
                          }
                        });
                      });

                      // Process each day group
                      [3, 6, 0].forEach((dNum) => {
                        const group = dayGroups[dNum];
                        if (group.length > 0) {
                          const count = getDayOccurrences(invoicePreviewItem.start_date, dNum, [dNum]);
                          if (count > 0) {
                            totalNadsCount += count;
                            const totalStallPrice = group.reduce((sum, item) => sum + item.price, 0);
                            const totalElecRate = group.reduce((sum, item) => sum + item.elec, 0);
                            const subTotal = (totalStallPrice + totalElecRate) * count;
                            const stallNamesStr = group.map(item => cleanStallName(item.name)).join(', ');

                            itemsHtml.push(
                              <div key={dNum} className="py-2 flex flex-col gap-0.5">
                                <span className="font-extrabold text-gray-800">
                                  {dayNames[dNum]} ล็อค : {stallNamesStr}
                                </span>
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                  <span>({totalStallPrice} x {count}) + ({totalElecRate} x {count})</span>
                                  <span className="font-extrabold text-gray-700 text-xs">{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                              </div>
                            );
                          }
                        }
                      });

                      // Storage fee row
                      if (parseNumber(invoicePreviewItem.storage_fee) > 0) {
                        itemsHtml.push(
                          <div key="storage" className="py-2 flex justify-between font-bold">
                            <span className="text-gray-800">📦 ค่าฝากของ</span>
                            <span className="text-gray-700">{parseNumber(invoicePreviewItem.storage_fee).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="text-[10px] text-gray-400 font-bold mt-1.5 mb-1">จำนวนทั้งหมด {totalNadsCount} นัด</div>
                          {itemsHtml}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="border-t border-dashed border-gray-300 pt-2 flex flex-col gap-1.5 font-bold text-xs mt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ยอดรวมทั้งสิ้น</span>
                    <span className="text-purple-700 text-sm font-extrabold">
                      {parseNumber(invoicePreviewItem.total_price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ชำระแล้ว</span>
                    <span className="text-green-700">
                      {parseNumber(invoicePreviewItem.paid_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-1.5 mt-0.5">
                    <span className="text-gray-500">ยอดค้างชำระสุทธิ</span>
                    <span className="text-red-600 text-sm font-extrabold">
                      {(parseNumber(invoicePreviewItem.total_price) - parseNumber(invoicePreviewItem.paid_amount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                {/* Bank Account Footer Info */}
                <div className="bg-[#E8F5E9] border border-green-200 rounded-lg p-3 flex flex-col gap-1 mt-2 text-xs font-bold text-green-800">
                  <span className="text-[10px] text-green-700 block mb-0.5 font-bold">ช่องทางการชำระเงิน</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shrink-0">K</div>
                    <span className="text-sm font-black text-green-950">204-1-25235-1</span>
                    <span className="text-[10px] font-bold text-green-600">ธนาคารกสิกรไทย</span>
                  </div>
                  <div className="text-[10px] text-green-905 border-t border-green-200/50 pt-1 mt-0.5 font-bold">
                    ชื่อบัญชี : บจก.เดอะเบสพัฒนาและธุรกิจ
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
