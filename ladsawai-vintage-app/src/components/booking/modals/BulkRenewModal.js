'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Loader2, X, Phone, Check } from 'lucide-react';

export default function BulkRenewModal() {
  const {
    bulkRenewCheckedIds,    bulkRenewEditData,    bulkRenewFromMonth,    cleanStallName,    computeNextMonthThai,    formatBookingMonth,    handleBulkRenewSubmit,    loadingMonthly,    monthlyList,    note,    parseNumber,    product,    setBulkRenewCheckedIds,    setBulkRenewEditData,    setBulkRenewEditingItem,    setBulkRenewFromMonth,    setShowBulkRenewModal,    showBulkRenewModal,    sortThaiMonthsDescending,    stalls
  } = useBooking();

  if (!showBulkRenewModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-5xl border-2 border-purple-800 overflow-hidden flex flex-col max-h-[90vh] animate-pop-in text-left text-xs font-sans text-gray-800">
              {/* Header */}
              <div className="bg-purple-900 text-white px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-purple-950">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5 text-white">🔄 จัดการต่อสัญญาลูกค้ารายเดือนแบบกลุ่ม</h3>
                  <p className="text-[10px] text-purple-200 font-bold mt-0.5">คัดลอกและอัปเดตข้อมูลสัญญาสำหรับรอบเดือนถัดไป</p>
                </div>
                <button 
                  onClick={() => setShowBulkRenewModal(false)} 
                  className="p-1 rounded-full bg-red-600/80 hover:bg-red-700 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Month Selectors bar */}
              <div className="bg-purple-50/50 px-5 py-3 border-b border-purple-100 flex items-center gap-4 shrink-0 font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <span>จากรอบเดือน:</span>
                  <select
                    value={bulkRenewFromMonth}
                    onChange={(e) => {
                      setBulkRenewFromMonth(e.target.value);
                      setBulkRenewCheckedIds([]);
                      setBulkRenewEditData({});
                    }}
                    className="p-1.5 border border-purple-200 rounded bg-white text-purple-900 cursor-pointer font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {sortThaiMonthsDescending(Array.from(new Set(monthlyList.map(item => formatBookingMonth(item.booking_month)).filter(m => m !== '-')))).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span>➡️ ไปยังรอบเดือนปลายทาง:</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 font-extrabold">
                    {computeNextMonthThai(bulkRenewFromMonth) || '(ระบุเดือนต้นทาง)'}
                  </span>
                </div>
              </div>

              {/* Main Table Area */}
              <div className="flex-1 overflow-auto p-4 min-h-[300px]">
                {(() => {
                  const targetMonth = computeNextMonthThai(bulkRenewFromMonth);
                  const sourceBookings = monthlyList.filter(item =>
                    formatBookingMonth(item.booking_month) === bulkRenewFromMonth &&
                    item.renewal_status !== 'ไม่ต่อสัญญา'
                  );

                  if (sourceBookings.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-bold gap-2">
                        <span>ไม่พบลูกค้ารายเดือนในรอบเดือน {bulkRenewFromMonth}</span>
                        <span className="text-[10px] text-gray-400 font-normal">(หรือผู้เช่าทั้งหมดได้รับการตั้งค่าสถานะไม่ต่อสัญญา)</span>
                      </div>
                    );
                  }

                  const isAlreadyRenewed = (item) => {
                    return monthlyList.some(mb => mb.booker_name === item.booker_name && formatBookingMonth(mb.booking_month) === targetMonth);
                  };

                  const nonRenewedBookings = sourceBookings.filter(item => !isAlreadyRenewed(item));
                  const allChecked = nonRenewedBookings.length > 0 && bulkRenewCheckedIds.length === nonRenewedBookings.length;

                  return (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-purple-100/60 border-b border-purple-200 text-purple-955 font-bold">
                          <th className="p-2 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              disabled={nonRenewedBookings.length === 0}
                              onChange={() => {
                                if (allChecked) {
                                  setBulkRenewCheckedIds([]);
                                } else {
                                  setBulkRenewCheckedIds(nonRenewedBookings.map(b => b.id));
                                }
                              }}
                              className="w-4 h-4 cursor-pointer rounded"
                            />
                          </th>
                          <th className="p-2">ประเภท</th>
                          <th className="p-2">ชื่อลูกค้า</th>
                          <th className="p-2">ล็อคต้นทาง</th>
                          <th className="p-2">วันลงขาย</th>
                          <th className="p-2 text-center">จำนวนไฟ</th>
                          <th className="p-2 text-center">ค่าฝากของ</th>
                          <th className="p-2 text-center">ยอดเช่ารวม</th>
                          <th className="p-2 text-center">สถานะ/จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {sourceBookings.map(item => {
                          const renewed = isAlreadyRenewed(item);
                          const isChecked = bulkRenewCheckedIds.includes(item.id);
                          const customEdit = bulkRenewEditData[item.id] || {};
                          
                          // Resolve display properties with custom edits
                          const dispBookerName = customEdit.booker_name !== undefined ? customEdit.booker_name : item.booker_name;
                          const dispType = customEdit.customer_type || item.customer_type || 'Standard';
                          const dispProduct = customEdit.product !== undefined ? customEdit.product : item.product || '';
                          const dispPhone = customEdit.phone !== undefined ? customEdit.phone : item.phone || '';
                          const dispStorage = customEdit.storage_fee !== undefined ? parseNumber(customEdit.storage_fee) : parseNumber(item.storage_fee || 0);
                          const dispElec = customEdit.elec_unit !== undefined ? parseNumber(customEdit.elec_unit) : parseNumber(item.elec_unit || 0);
                          const dispDays = customEdit.selected_days || item.selected_days;
                          
                          let dispStalls = item.stalls;
                          if (customEdit.stall_details) {
                            try {
                              const sDet = JSON.parse(customEdit.stall_details);
                              dispStalls = sDet.map(x => x.name).join(', ');
                            } catch(e){}
                          }

                          // Compute simulated price if edited
                          let dispPrice = item.total_price;
                          if (customEdit.stall_details || customEdit.elec_unit !== undefined || customEdit.storage_fee !== undefined || customEdit.selected_days) {
                            try {
                              const sDet = JSON.parse(customEdit.stall_details || item.stall_details || '[]');
                              const startD = new Date(item.start_date);
                              const year = startD.getFullYear();
                              const monthVal = startD.getMonth();
                              const lastDay = new Date(year, monthVal + 1, 0).getDate();
                              let totalRent = 0;
                              let datesSet = new Set();
                              const isFullPkg = dispDays.toLowerCase().includes('wed') && dispDays.toLowerCase().includes('sat') && dispDays.toLowerCase().includes('sun');
                              
                              for (let d = 1; d <= lastDay; d++) {
                                const curD = new Date(year, monthVal, d);
                                const dayOfWeek = curD.getDay();
                                sDet.forEach(st => {
                                  const myDays = st.days || [];
                                  if (myDays.includes(dayOfWeek)) {
                                    datesSet.add(`${year}-${monthVal+1}-${d}`);
                                    const sMaster = stalls.find(s => s.name === st.name);
                                    let price = sMaster ? sMaster.price_wed : 0;
                                    if (dayOfWeek === 6 && sMaster) price = sMaster.price_sat;
                                    if (dayOfWeek === 0 && sMaster) price = sMaster.price_sun;
                                    if (dispType === 'Standard' && isFullPkg && sMaster && sMaster.price_month > 0) {
                                      price = sMaster.price_month;
                                    }
                                    if (dispType === 'VIP') price = 0;
                                    totalRent += price;
                                  }
                                });
                              }
                              const totalElecCharged = datesSet.size;
                              const totalElecPrice = totalElecCharged * (dispElec * 10);
                              dispPrice = totalRent + totalElecPrice + dispStorage;
                              if (dispType === 'Regular' || dispType === 'VIP') dispPrice = 0;
                            } catch(e){}
                          }

                          let statusText = "ยังไม่ต่อ";
                          let statusColor = "bg-gray-100 text-gray-600";
                          if (renewed) {
                            statusText = "ต่อแล้ว";
                            statusColor = "bg-green-100 text-green-800";
                          } else if (bulkRenewEditData[item.id]) {
                            statusText = "พร้อม (แก้ไขแล้ว)";
                            statusColor = "bg-blue-100 text-blue-800";
                          }

                          return (
                            <tr key={item.id} className="hover:bg-purple-50/20 font-medium border-b border-gray-100">
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={renewed}
                                  onChange={() => {
                                    if (isChecked) {
                                      setBulkRenewCheckedIds(bulkRenewCheckedIds.filter(id => id !== item.id));
                                    } else {
                                      setBulkRenewCheckedIds([...bulkRenewCheckedIds, item.id]);
                                    }
                                  }}
                                  className="w-4 h-4 cursor-pointer rounded"
                                />
                              </td>
                              <td className="p-2">
                                {(() => {
                                  if (dispType === 'Regular') {
                                    return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">ประจำ</span>;
                                  } else if (dispType === 'VIP') {
                                    return <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">VIP</span>;
                                  } else {
                                    return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">รายเดือน</span>;
                                  }
                                })()}
                              </td>
                              <td className="p-2">
                                <div className="font-bold text-gray-800">{dispBookerName}</div>
                                <div className="text-[10px] text-gray-500">{dispPhone || '-'} | สินค้า: {dispProduct || '-'}</div>
                              </td>
                              <td className="p-2 font-bold text-purple-950 font-mono">{cleanStallName(dispStalls)}</td>
                              <td className="p-2 text-[10px]">{dispDays}</td>
                              <td className="p-2 text-center font-mono font-bold">{dispElec} หน่วย</td>
                              <td className="p-2 text-center font-mono font-semibold">{dispStorage.toLocaleString()}.-</td>
                              <td className="p-2 text-center font-mono font-bold text-purple-900">{dispPrice.toLocaleString()}.-</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor}`}>{statusText}</span>
                                  {!renewed && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        let editStailsJSON = item.stall_details;
                                        setBulkRenewEditingItem({
                                          id: item.id,
                                          booker_name: item.booker_name,
                                          customer_type: dispType,
                                          product: dispProduct,
                                          phone: dispPhone,
                                          note: customEdit.note || item.note || '',
                                          storage_fee: String(dispStorage),
                                          elec_unit: String(dispElec),
                                          selected_days: dispDays,
                                          stall_details: dispStalls,
                                          raw_stall_details: JSON.parse(editStailsJSON || '[]')
                                        });
                                      }}
                                      className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      แก้ไขก่อนต่อ
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-purple-50 px-4 py-3 shrink-0 border-t border-purple-100 flex justify-between items-center">
                <span className="text-[10px] text-purple-800 font-bold">เลือกทำรายการต่อสัญญา {bulkRenewCheckedIds.length} รายการ</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkRenewSubmit}
                    disabled={loadingMonthly || bulkRenewCheckedIds.length === 0}
                    className={`px-4 py-2 rounded text-xs font-bold shadow transition-all flex items-center gap-1 cursor-pointer ${
                      bulkRenewCheckedIds.length > 0
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingMonthly ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    ยืนยันต่อสัญญาแผงเช่ากลุ่ม
                  </button>
                  <button
                    onClick={() => setShowBulkRenewModal(false)}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          </div>
  );
}
