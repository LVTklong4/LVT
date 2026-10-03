'use client';

import React from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { Loader2, X, Check } from 'lucide-react';
import { monthNamesFull } from '@/utils/thaiDateHelper';
import MonthlyStallSelection from './MonthlyStallSelection';
import MonthlyPricingSummary from './MonthlyPricingSummary';

export default function NewMonthlyModal() {
  const {
    handleCreateNewMonthlyBooking,
    handleSaveEditedMonthlyBooking,
    isEditingMonthlyMode,
    loadingMonthly,
    newMonthlyBookerName,
    newMonthlyCustomerType,
    newMonthlyDays,
    newMonthlyElecUnit,
    newMonthlyNote,
    newMonthlyPhone,
    newMonthlyProduct,
    newMonthlyStartDate,
    newMonthlyStorageFee,
    newMonthlyCustomPrice,
    setNewMonthlyBookerName,
    setNewMonthlyCustomerType,
    setNewMonthlyDays,
    setNewMonthlyElecUnit,
    setNewMonthlyNote,
    setNewMonthlyPhone,
    setNewMonthlyProduct,
    setNewMonthlyStartDate,
    setNewMonthlyStorageFee,
    setNewMonthlyCustomPrice,
    setShowNewMonthlyModal,
    showNewMonthlyModal
  } = useMonthlyBooking();

  if (!showNewMonthlyModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-lg border-2 border-[#8B4513] overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
            {/* Header */}
            <div className="bg-[#5D4037] text-white px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#8B4513]">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  {isEditingMonthlyMode ? "🗓️ จัดการข้อมูลรายเดือน (แก้ไขการจอง)" : "🗓️ จัดการข้อมูลรายเดือน (จองล็อคใหม่)"}
                </h3>
                <p className="text-[10px] text-amber-200 font-bold mt-0.5">
                  เริ่ม: {(() => {
                    if (!newMonthlyStartDate) return '-';
                    const d = new Date(newMonthlyStartDate);
                    const day = d.getDate();
                    const month = monthNamesFull[d.getMonth()];
                    const year = d.getFullYear() + 543;
                    return `${day} ${month} ${year}`;
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-[#3E2723] px-2.5 py-1 rounded-full font-bold text-amber-100 flex items-center gap-1 border border-amber-900/30">
                  👤 ตลาดนัดลาดสวายวินเทจ
                </span>
                <button 
                  onClick={() => setShowNewMonthlyModal(false)} 
                  className="p-1 rounded-full bg-red-600/80 hover:bg-red-700 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (isEditingMonthlyMode) {
                  handleSaveEditedMonthlyBooking();
                } else {
                  handleCreateNewMonthlyBooking(e);
                }
              }} 
              className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 text-xs"
            >
              
              {!isEditingMonthlyMode && (
                <>
                  {/* Date & Days Row */}
              <div className="grid grid-cols-2 gap-3 bg-[#F5E6D3]/40 p-3 rounded-lg border border-[#D7CCC8]">
                {/* Start Date */}
                <div className={`flex flex-col gap-1 ${newMonthlyCustomerType === 'Room' ? 'col-span-2' : ''}`}>
                  <label className="font-bold text-gray-700 flex justify-between">
                    <span>วันที่เริ่ม <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-[#8B4513]">
                      {(() => {
                        if (!newMonthlyStartDate) return '';
                        const d = new Date(newMonthlyStartDate);
                        const month = monthNamesFull[d.getMonth()];
                        const year = d.getFullYear() + 543;
                        return `รอบ: ${month} ${year}`;
                      })()}
                    </span>
                  </label>
                  <input 
                    type="date"
                    value={newMonthlyStartDate}
                    onChange={(e) => setNewMonthlyStartDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded bg-white font-bold"
                  />
                </div>

                {/* Trading Days */}
                {newMonthlyCustomerType !== 'Room' && (
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">วันลงขาย</label>
                    <div className="flex gap-2 mt-1">
                      {['wed', 'sat', 'sun'].map(day => {
                        const label = day === 'wed' ? 'พ' : day === 'sat' ? 'ส' : 'อา';
                        const checked = newMonthlyDays[day];
                        return (
                          <label 
                            key={day} 
                            className={`flex-1 py-1.5 text-center rounded border font-bold text-xs cursor-pointer select-none transition-all ${
                              checked 
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm' 
                                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={checked}
                              onChange={() => setNewMonthlyDays({ ...newMonthlyDays, [day]: !checked })}
                              className="hidden"
                            />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Type Selection */}
              <div className="flex justify-between items-center bg-[#F5E6D3]/20 p-2.5 rounded-lg border border-dashed border-[#D7CCC8]">
                <span className="font-bold text-gray-700">ประเภทลูกค้า:</span>

                <div className="flex gap-2.5">
                  {[
                    { label: 'รายเดือน', val: 'Standard' },
                    { label: 'ประจำ', val: 'Regular' },
                    { label: 'VIP', val: 'VIP' },
                    { label: 'ห้องเช่า', val: 'Room' }
                  ].map(opt => (
                    <label key={opt.val} className="flex items-center gap-1 cursor-pointer font-bold text-gray-700">
                      <input 
                        type="radio"
                        name="newMonthlyCustomerType"
                        checked={newMonthlyCustomerType === opt.val}
                        onChange={() => setNewMonthlyCustomerType(opt.val)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stalls selection rows */}
              <MonthlyStallSelection />
                </>
              )}

              {/* Extra fees row */}
              {newMonthlyCustomerType === 'Room' ? (
                <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-200">
                  <label className="font-bold text-blue-950 block mb-1">💰 ยอดค่าใช้จ่ายรวมที่ตกลงกัน (ยอดที่ต้องชำระ) <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <input 
                      type="number"
                      value={newMonthlyCustomPrice}
                      onChange={(e) => setNewMonthlyCustomPrice(e.target.value)}
                      className="p-2.5 pr-10 border border-blue-300 rounded bg-white text-right font-bold w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-950 text-xs font-mono"
                      placeholder="ระบุราคาค่าห้องเช่าที่ตกลงกันไว้ (บาท)..."
                      required
                    />
                    <span className="absolute right-3 text-xs font-bold text-blue-400">บาท</span>
                  </div>
                </div>
              ) : newMonthlyCustomerType === 'VIP' ? (
                <div className="bg-purple-50/40 p-3 rounded-lg border border-purple-200 animate-fade-in">
                  <label className="font-bold text-purple-950 block mb-1">💰 ยอดค่าเช่ารวม VIP ที่ตกลงกัน (ยอดที่ต้องชำระ) <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <input 
                      type="number"
                      value={newMonthlyCustomPrice}
                      onChange={(e) => setNewMonthlyCustomPrice(e.target.value)}
                      className="p-2.5 pr-10 border border-purple-300 rounded bg-white text-right font-bold w-full focus:outline-none focus:ring-1 focus:ring-purple-500 text-purple-955 text-xs font-mono"
                      placeholder="ระบุราคา VIP ที่ตกลงกันไว้ (บาท)..."
                      required
                    />
                    <span className="absolute right-3 text-xs font-bold text-purple-400">บาท</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Storage Fee */}
                  <div className="bg-[#FDFBF7] p-2.5 rounded-lg border border-gray-200">
                    <label className="font-bold text-amber-900 block mb-1">📦 ค่าฝากของ</label>
                    <div className="relative flex items-center">
                      <input 
                        type="number"
                        value={newMonthlyStorageFee}
                        onChange={(e) => setNewMonthlyStorageFee(e.target.value)}
                        className="p-2 pr-6 border border-gray-300 rounded bg-white text-right font-bold w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="0"
                      />
                      <span className="absolute right-2 text-[10px] font-bold text-gray-400">บ.</span>
                    </div>
                  </div>

                  {/* Elec Unit */}
                  <div className="bg-[#FDFBF7] p-2.5 rounded-lg border border-gray-200">
                    <label className="font-bold text-yellow-850 block mb-1">⚡ ค่าไฟ (เหมา)</label>
                    <div className="relative flex items-center">
                      <input 
                        type="number"
                        value={newMonthlyElecUnit}
                        onChange={(e) => setNewMonthlyElecUnit(e.target.value)}
                        className="p-2 pr-12 border border-gray-300 rounded bg-white text-right font-bold w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="0"
                      />
                      <span className="absolute right-2 text-[10px] font-bold text-gray-400">หน่วย</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing breakdown summary */}
              <MonthlyPricingSummary />

              {/* Booker Info Fields */}
              <div className="bg-[#F5E6D3]/15 p-3 rounded-lg border border-[#D7CCC8]/60 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">ชื่อผู้จอง <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      placeholder="ระบุชื่อ-สกุล"
                      value={newMonthlyBookerName}
                      onChange={(e) => setNewMonthlyBookerName(e.target.value)}
                      className="p-2 border border-gray-300 rounded bg-white font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">สินค้า</label>
                    <input 
                      type="text"
                      placeholder="ระบุสินค้า"
                      value={newMonthlyProduct}
                      onChange={(e) => setNewMonthlyProduct(e.target.value)}
                      className="p-2 border border-gray-300 rounded bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    placeholder="08x-xxxxxxx"
                    value={newMonthlyPhone}
                    onChange={(e) => setNewMonthlyPhone(e.target.value)}
                    className="p-2 border border-gray-300 rounded bg-white font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">โน้ตเพิ่มเติม</label>
                  <textarea 
                    value={newMonthlyNote}
                    onChange={(e) => setNewMonthlyNote(e.target.value)}
                    className="p-2 border border-gray-300 rounded bg-white h-14 resize-none"
                    placeholder="..."
                  />
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loadingMonthly}
                className="w-full py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-bold text-sm shadow transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                {loadingMonthly ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4.5 h-4.5" />
                    <span>{isEditingMonthlyMode ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
  );
}
