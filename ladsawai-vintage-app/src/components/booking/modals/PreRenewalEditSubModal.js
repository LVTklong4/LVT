'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Info, Sun } from 'lucide-react';

export default function PreRenewalEditSubModal() {
  const {
    bulkRenewEditData,    bulkRenewEditingItem,    bulkRenewFromMonth,    cleanStallName,    computeNextMonthThai,    formatBookingMonth,    monthlyList,    note,    product,    setBulkRenewEditData,    setBulkRenewEditingItem,    stalls
  } = useBooking();

  const [openDropdownDay, setOpenDropdownDay] = useState(null);
  const [stallSearchQuery, setStallSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownDay(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
                  <div className="flex flex-wrap gap-2.5 mt-1 bg-purple-50/30 p-2 rounded-lg border border-purple-100">
                    {[
                      { label: 'รายเดือน', val: 'Standard' },
                      { label: 'ประจำ', val: 'Regular' },
                      { label: 'VIP', val: 'VIP' },
                      { label: 'ห้องเช่า', val: 'Room' }
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-1.5 cursor-pointer font-bold text-gray-700 select-none text-[11px]">
                        <input 
                          type="radio"
                          name="editCustomerType"
                          value={opt.val}
                          checked={bulkRenewEditingItem.customer_type === opt.val}
                          onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, customer_type: e.target.value })}
                          className="text-purple-700 focus:ring-purple-500 w-3.5 h-3.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Info Box for Room / VIP */}
                {bulkRenewEditingItem.customer_type === 'Room' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-950 rounded-lg p-2.5 text-[11px] font-bold flex items-start gap-1.5 mb-1 animate-fade-in">
                    <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>ห้องเช่าจะไม่ได้คิดเงินจากราคากลางค่าล็อค แต่คิดเป็นราคาที่ตกลงกันไว้</span>
                  </div>
                )}

                {bulkRenewEditingItem.customer_type === 'VIP' && (
                  <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-lg p-2.5 text-[11px] font-bold flex items-start gap-1.5 mb-1 animate-fade-in">
                    <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <span>ล็อควีไอพีจะไม่ได้คิดเงินจากราคากลางค่าล็อค แต่คิดเป็นราคาที่ตกลงกันไว้</span>
                  </div>
                )}

                {/* Stalls name display for Room (since we hide daily stall selection) */}
                {bulkRenewEditingItem.customer_type === 'Room' && (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-gray-700">แผงค้า/ห้องเช่า</span>
                    <span className="p-2 border border-gray-300 rounded bg-gray-50 font-bold font-mono text-purple-950">
                      {cleanStallName(bulkRenewEditingItem.stall_details)}
                    </span>
                  </div>
                )}

                {/* Selected Days */}
                {bulkRenewEditingItem.customer_type !== 'Room' && (
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
                                
                                const orderedNums = [];
                                if (ordered.includes('Wed')) orderedNums.push(3);
                                if (ordered.includes('Sat')) orderedNums.push(6);
                                if (ordered.includes('Sun')) orderedNums.push(0);

                                const rawStalls = bulkRenewEditingItem.raw_stall_details.map(st => {
                                  return {
                                    ...st,
                                    days: st.days.filter(d => orderedNums.includes(d))
                                  };
                                }).filter(st => st.days && st.days.length > 0);

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
                )}

                {/* Stalls per Day details */}
                {bulkRenewEditingItem.customer_type !== 'Room' && (
                  <div ref={dropdownRef} className="flex flex-col gap-2 p-3 bg-purple-50/40 rounded-lg border border-purple-100 text-left">
                    <span className="font-bold text-purple-950 block mb-0.5">ระบุแผงค้าของแต่ละวัน</span>
                    {['Wed', 'Sat', 'Sun'].map(dayName => {
                      const dayNum = dayName === 'Wed' ? 3 : dayName === 'Sat' ? 6 : 0;
                      const daysArr = bulkRenewEditingItem.selected_days.split(',').map(s => s.trim().toLowerCase());
                      const isActive = daysArr.includes(dayName.toLowerCase());
                      if (!isActive) return null;

                      const dayStalls = bulkRenewEditingItem.raw_stall_details
                        .filter(st => st.days && st.days.includes(dayNum))
                        .map(st => st.name);

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
                                    const updatedStalls = bulkRenewEditingItem.raw_stall_details.map(st => {
                                      if (st.name === stName) {
                                        return {
                                          ...st,
                                          days: st.days.filter(d => d !== dayNum)
                                        };
                                      }
                                      return st;
                                    }).filter(st => st.days && st.days.length > 0);
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
                              <button
                                type="button"
                                onClick={() => {
                                  if (openDropdownDay === dayName) {
                                    setOpenDropdownDay(null);
                                  } else {
                                    setOpenDropdownDay(dayName);
                                    setStallSearchQuery('');
                                  }
                                }}
                                className="px-2 py-0.5 bg-purple-900 hover:bg-purple-950 text-white rounded text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                              >
                                + เพิ่มล็อค
                              </button>

                              {openDropdownDay === dayName && (
                                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-purple-200 rounded-lg shadow-xl z-[90] p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                                  <input
                                    type="text"
                                    value={stallSearchQuery}
                                    onChange={(e) => setStallSearchQuery(e.target.value)}
                                    placeholder="ค้นหาชื่อล็อค..."
                                    className="p-1.5 border border-purple-300 rounded text-[10px] text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold mb-1 w-full"
                                    autoFocus
                                  />
                                  <div className="flex flex-col divide-y divide-gray-100 overflow-y-auto max-h-[140px]">
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

                                      // Filter and naturally sort
                                      const filtered = stalls
                                        .filter(s => 
                                          s.type !== 'ทางเดิน' && 
                                          s.type !== 'อื่นๆ' && 
                                          !dayStalls.includes(s.name) && 
                                          !occupied.includes(s.name) &&
                                          s.name.toLowerCase().includes(stallSearchQuery.toLowerCase())
                                        )
                                        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                                      if (filtered.length === 0) {
                                        return <span className="text-[10px] text-gray-400 text-center py-2">ไม่พบชื่อล็อค</span>;
                                      }

                                      return filtered.map((s) => (
                                        <button
                                          key={s.name}
                                          type="button"
                                          onClick={() => {
                                            let updatedStalls = [...bulkRenewEditingItem.raw_stall_details];
                                            const existingIndex = updatedStalls.findIndex(x => x.name === s.name);
                                            if (existingIndex > -1) {
                                              const existingSt = updatedStalls[existingIndex];
                                              if (!existingSt.days.includes(dayNum)) {
                                                updatedStalls[existingIndex] = {
                                                  ...existingSt,
                                                  days: [...existingSt.days, dayNum]
                                                };
                                              }
                                            } else {
                                              updatedStalls.push({ name: s.name, days: [dayNum] });
                                            }
                                            
                                            setBulkRenewEditingItem({
                                              ...bulkRenewEditingItem,
                                              raw_stall_details: updatedStalls
                                            });
                                            setOpenDropdownDay(null);
                                          }}
                                          className="text-left w-full px-2 py-1.5 text-[10px] hover:bg-purple-50 rounded text-gray-700 font-bold border-b border-gray-100 last:border-b-0 cursor-pointer"
                                        >
                                          {cleanStallName(s.name)}{s.zone ? ` (${s.zone})` : ''}
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Extra Fees / Agreed Price */}
                {(bulkRenewEditingItem.customer_type === 'Room' || bulkRenewEditingItem.customer_type === 'VIP') ? (
                  <div className={`p-3 rounded-lg border ${
                    bulkRenewEditingItem.customer_type === 'Room'
                      ? 'bg-blue-50/40 border-blue-200 text-blue-955'
                      : 'bg-purple-50/40 border-purple-200 text-purple-955'
                  }`}>
                    <label className="font-bold block mb-1">💰 ยอดค่าเช่ารวมที่ตกลงกัน (ยอดที่ต้องชำระ)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={bulkRenewEditingItem.total_price || ''}
                        onChange={(e) => setBulkRenewEditingItem({ ...bulkRenewEditingItem, total_price: e.target.value })}
                        className={`p-2.5 pr-10 border rounded bg-white text-right font-bold w-full focus:outline-none text-xs font-mono ${
                          bulkRenewEditingItem.customer_type === 'Room'
                            ? 'border-blue-300 focus:ring-1 focus:ring-blue-500 text-blue-950'
                            : 'border-purple-300 focus:ring-1 focus:ring-purple-500 text-purple-955'
                        }`}
                        placeholder="ระบุยอดราคาที่ตกลงกันไว้ (บาท)..."
                        required
                      />
                      <span className={`absolute right-3 text-xs font-bold ${
                        bulkRenewEditingItem.customer_type === 'Room' ? 'text-blue-400' : 'text-purple-400'
                      }`}>บาท</span>
                    </div>
                  </div>
                ) : (
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
                )}

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
                        total_price: bulkRenewEditingItem.total_price,
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
