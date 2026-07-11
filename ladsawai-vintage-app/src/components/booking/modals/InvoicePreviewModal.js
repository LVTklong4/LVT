'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Info } from 'lucide-react';

export default function InvoicePreviewModal() {
  const {
    cleanStallName,    formatBookingMonth,    getDayOccurrences,    invoicePreviewItem,    parseNumber,    product,    setInvoicePreviewItem,    stalls
  } = useBooking();

  if (!invoicePreviewItem) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-sm border border-[#8B4513]/30 overflow-hidden flex flex-col animate-pop-in text-gray-800 font-sans text-xs">
              {/* Modal Actions Header */}
              <div className="bg-[#5D4037] text-white px-4 py-2 flex justify-between items-center shrink-0 border-b border-[#8B4513] text-xs">
                <span className="font-bold">พรีวิวใบแจ้งยอดชำระเงิน</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const printContents = document.getElementById('lvt-invoice-print-area').innerHTML;
                      const originalContents = document.body.innerHTML;
                      document.body.innerHTML = printContents;
                      window.print();
                      window.location.reload(); // Reload to restore React state
                    }}
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

                      const monthDStr = formatBookingMonth(invoicePreviewItem.booking_month).split(' ')[0] || '';
                      const elecRate = parseNumber(invoicePreviewItem.elec_unit || 0) * 10;

                      let itemsHtml = [];
                      let totalNadsCount = 0;

                      details.forEach((stallDetail) => {
                        const stallName = stallDetail.name;
                        const sMaster = stalls.find(s => s.name === stallName);
                        if (!sMaster) return;

                        // Count occurrences per day
                        const dayCounts = {
                          3: getDayOccurrences(invoicePreviewItem.start_date, 3, stallDetail.days),
                          6: getDayOccurrences(invoicePreviewItem.start_date, 6, stallDetail.days),
                          0: getDayOccurrences(invoicePreviewItem.start_date, 0, stallDetail.days)
                        };

                        const dayNames = { 3: 'วันพุธ', 6: 'วันเสาร์', 0: 'วันอาทิตย์' };

                        [3, 6, 0].forEach((dNum) => {
                          const count = dayCounts[dNum];
                          if (count > 0) {
                            totalNadsCount += count;
                            let price = sMaster.price_wed;
                            if (dNum === 6) price = sMaster.price_sat;
                            if (dNum === 0) price = sMaster.price_sun;

                            if (invoicePreviewItem.customer_type === 'Standard' && isFullPackage && sMaster.price_month > 0) {
                              price = sMaster.price_month;
                            }
                            if (invoicePreviewItem.customer_type === 'VIP') price = 0;

                            const subTotal = (price + elecRate) * count;

                            itemsHtml.push(
                              <div key={`${stallName}-${dNum}`} className="py-2 flex flex-col gap-0.5">
                                <span className="font-extrabold text-gray-800">
                                  {monthDStr} {dayNames[dNum]} ล็อค : {cleanStallName(stallName)}
                                </span>
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                  <span>({price} x {count}) + ({elecRate} x {count})</span>
                                  <span className="font-extrabold text-gray-700 text-xs">{subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                              </div>
                            );
                          }
                        });
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
