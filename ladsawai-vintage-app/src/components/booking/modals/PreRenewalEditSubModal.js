'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Info, Sun } from 'lucide-react';

export default function PreRenewalEditSubModal() {
  const {
    bulkRenewEditData,    bulkRenewEditingItem,    bulkRenewFromMonth,    cleanStallName,    computeNextMonthThai,    formatBookingMonth,    monthlyList,    note,    product,    setBulkRenewEditData,    setBulkRenewEditingItem,    stalls
  } = useBooking();

  if (!bulkRenewEditingItem) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-md border-2 border-purple-850 overflow-hidden flex flex-col max-h-[85vh] animate-pop-in text-left text-xs font-sans text-gray-800">
              <div className="bg-purple-950 text-white px-4 py-3 flex justify-between items-center border-b border-purple-850">
                <h3 className="font-bold text-sm">แก้ไขข้อมูลล่วงหน้า: {bulkRenewEditingItem.booker_name}</h3>
                <button onClick={() => setBulkRenewEditingItem(null)} className="text-purple-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-4 overflow-y-auto flex flex-col gap-3.5">
                {/* Customer Type */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">ประเภทลูกค้า</label>
                  <select
                    value={bulkRenewEditingItem.customer_type}
                    onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, customer_type: e.target.value })}
                    className="p-2 border border-gray-300 rounded bg-white font-bold cursor-pointer"
                  >
                    <option value="Standard">Standard (รายเดือนทั่วไป)</option>
                    <option value="Regular">Regular (ประจำ)</option>
                    <option value="VIP">VIP (ลูกค้าพิเศษ)</option>
                  </select>
                </div>

                {/* Selected Days */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">วันลงขายในเดือนเป้าหมาย</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { key: 'Wed', num: 3, label: 'พุธ' },
                      { key: 'Sat', num: 6, label: 'เสาร์' },
                      { key: 'Sun', num: 0, label: 'อาทิตย์' }
                    ].map(dayOpt => {
                      const daysArr = bulkRenewEditingItem.selected_days.split(',').map(s => s.trim().toLowerCase());
                      const checked = daysArr.includes(dayOpt.key.toLowerCase());
                      return (
                        <label 
                          key={dayOpt.key}
                          className={`flex-1 py-1.5 text-center rounded border font-bold text-xs cursor-pointer transition-all ${
                            checked
                              ? 'bg-purple-700 text-white border-purple-850 shadow-sm'
                              : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              let newArr = [...daysArr];
                              if (checked) {
                                newArr = newArr.filter(x => x !== dayOpt.key.toLowerCase());
                              } else {
                                newArr.push(dayOpt.key.toLowerCase());
                              }
                              const ordered = [];
                              if (newArr.includes('wed')) ordered.push('Wed');
                              if (newArr.includes('sat')) ordered.push('Sat');
                              if (newArr.includes('sun')) ordered.push('Sun');
                              const selStr = ordered.join(', ');
                              
                              const rawStalls = bulkRenewEditingItem.raw_stall_details.map(st => {
                                const newDays = [];
                                if (ordered.includes('Wed')) newDays.push(3);
                                if (ordered.includes('Sat')) newDays.push(6);
                                if (ordered.includes('Sun')) newDays.push(0);
                                return { ...st, days: newDays };
                              });

                              setBulkRenewEditingItem({
                                ...bulkRenewEditingItem,
                                selected_days: selStr,
                                raw_stall_details: rawStalls
                              });
                            }}
                            className="hidden"
                          />
                          {dayOpt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Stalls per Day details */}
                <div className="flex flex-col gap-2 p-3 bg-purple-50/40 rounded-lg border border-purple-100 text-left">
                  <span className="font-bold text-purple-950 block mb-0.5">ระบุแผงค้าของแต่ละวัน</span>
                  {['Wed', 'Sat', 'Sun'].map(dayName => {
                    const dayNum = dayName === 'Wed' ? 3 : dayName === 'Sat' ? 6 : 0;
                    const daysArr = bulkRenewEditingItem.selected_days.split(',').map(s => s.trim().toLowerCase());
                    const isActive = daysArr.includes(dayName.toLowerCase());
                    if (!isActive) return null;

                    const dayStalls = bulkRenewEditingItem.raw_stall_details.map(st => st.name);

                    return (
                      <div key={dayName} className="flex flex-wrap gap-2 items-center bg-white p-2 rounded border border-purple-100">
                        <span className="w-12 font-bold text-purple-700 shrink-0">วัน{dayName === 'Wed' ? 'พุธ' : dayName === 'Sat' ? 'เสาร์' : 'อาทิตย์'}</span>
                        <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                          {dayStalls.map((stName) => (
                            <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                              {cleanStallName(stName)}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedStalls = bulkRenewEditingItem.raw_stall_details.filter(x => x.name !== stName);
                                  setBulkRenewEditingItem({
                                    ...bulkRenewEditingItem,
                                    raw_stall_details: updatedStalls
                                  });
                                }}
                                className="text-amber-700 hover:text-red-700 font-black ml-1 text-[10px] transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          
                          <div className="relative">
                            <select
                              value=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val && !dayStalls.includes(val)) {
                                  const newDays = [];
                                  const ordered = bulkRenewEditingItem.selected_days.split(',').map(s => s.trim().toLowerCase());
                                  if (ordered.includes('wed')) newDays.push(3);
                                  if (ordered.includes('sat')) newDays.push(6);
                                  if (ordered.includes('sun')) newDays.push(0);
                                  
                                  const updatedStalls = [...bulkRenewEditingItem.raw_stall_details, { name: val, days: newDays }];
                                  setBulkRenewEditingItem({
                                    ...bulkRenewEditingItem,
                                    raw_stall_details: updatedStalls
                                  });
                                }
                              }}
                              className="px-1 py-0.5 bg-purple-900 hover:bg-purple-950 text-white rounded text-[10px] font-bold shadow-sm transition-all cursor-pointer border-none outline-none"
                            >
                              <option value="">+ เพิ่มล็อค</option>
                              {(() => {
                                const targetMonthStr = computeNextMonthThai(bulkRenewFromMonth);
                                const occupied = [];
                                monthlyList.forEach(mb => {
                                  if (formatBookingMonth(mb.booking_month) === targetMonthStr) {
                                    let det = [];
                                    try {
                                      det = JSON.parse(mb.stall_details || '[]');
                                    } catch(e){}
                                    det.forEach(st => {
                                      if (st.days && st.days.includes(dayNum)) occupied.push(st.name);
                                    });
                                  }
                                });

                                return stalls
                                  .filter(s => s.type !== 'ทางเดิน' && s.type !== 'อื่นๆ' && !dayStalls.includes(s.name) && !occupied.includes(s.name))
                                  .map(s => (
                                    <option key={s.name} value={s.name}>{cleanStallName(s.name)}</option>
                                  ));
                              })()}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra Fees */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">📦 ค่าฝากของ</label>
                    <input
                      type="number"
                      value={bulkRenewEditingItem.storage_fee}
                      onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, storage_fee: e.target.value })}
                      className="p-2 border border-gray-300 rounded bg-white font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">⚡ ค่าไฟ (เหมา)</label>
                    <input
                      type="number"
                      value={bulkRenewEditingItem.elec_unit}
                      onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, elec_unit: e.target.value })}
                      className="p-2 border border-gray-300 rounded bg-white font-bold"
                    />
                  </div>
                </div>

                {/* Info and Notes */}
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-700">สินค้า</label>
                      <input
                        type="text"
                        value={bulkRenewEditingItem.product}
                        onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, product: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-700">เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        value={bulkRenewEditingItem.phone}
                        onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, phone: e.target.value })}
                        className="p-2 border border-gray-300 rounded bg-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <label className="font-bold text-gray-700">หมายเหตุ</label>
                    <textarea
                      value={bulkRenewEditingItem.note}
                      onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, note: e.target.value })}
                      className="p-2 border border-gray-300 rounded bg-white h-12 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Edit submodal Footer */}
              <div className="bg-purple-50 px-4 py-3 shrink-0 border-t border-purple-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setBulkRenewEditData({
                      ...bulkRenewEditData,
                      [bulkRenewEditingItem.id]: {
                        customer_type: bulkRenewEditingItem.customer_type,
                        product: bulkRenewEditingItem.product,
                        phone: bulkRenewEditingItem.phone,
                        note: bulkRenewEditingItem.note,
                        storage_fee: bulkRenewEditingItem.storage_fee,
                        elec_unit: bulkRenewEditingItem.elec_unit,
                        selected_days: bulkRenewEditingItem.selected_days,
                        stall_details: JSON.stringify(bulkRenewEditingItem.raw_stall_details)
                      }
                    });
                    setBulkRenewEditingItem(null);
                  }}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold cursor-pointer"
                >
                  บันทึกแก้ไข
                </button>
                <button
                  onClick={() => setBulkRenewEditingItem(null)}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
  );
}
