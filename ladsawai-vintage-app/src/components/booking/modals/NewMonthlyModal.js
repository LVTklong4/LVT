'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Loader2, X, Phone, Info, Sun, Check } from 'lucide-react';
import { monthNamesFull } from '@/utils/thaiDateHelper';

export default function NewMonthlyModal() {
  const {
    addStallDropdownRefSat,    addStallDropdownRefSun,    addStallDropdownRefWed,    cleanStallName,    getNewMonthlyPricing,    getOccupiedStallsInRound,    handleCreateNewMonthlyBooking,    handleSaveEditedMonthlyBooking,    isEditingMonthlyMode,    loadingMonthly,    newMonthlyBookerName,    newMonthlyCustomerType,    newMonthlyDays,    newMonthlyElecUnit,    newMonthlyNote,    newMonthlyPhone,    newMonthlyProduct,    newMonthlyStallsSat,    newMonthlyStallsSun,    newMonthlyStallsWed,    newMonthlyStartDate,    newMonthlyStorageFee,    parseNumber,    setNewMonthlyBookerName,    setNewMonthlyCustomerType,    setNewMonthlyDays,    setNewMonthlyElecUnit,    setNewMonthlyNote,    setNewMonthlyPhone,    setNewMonthlyProduct,    setNewMonthlyStallsSat,    setNewMonthlyStallsSun,    setNewMonthlyStallsWed,    setNewMonthlyStartDate,    setNewMonthlyStorageFee,    setShowAddStallSelectSat,    setShowAddStallSelectSun,    setShowAddStallSelectWed,    setShowNewMonthlyModal,    setStallFilterSat,    setStallFilterSun,    setStallFilterWed,    showAddStallSelectSat,    showAddStallSelectSun,    showAddStallSelectWed,    showNewMonthlyModal,    stallFilterSat,    stallFilterSun,    stallFilterWed,    stalls
  } = useBooking();

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
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 flex justify-between">
                    <span>วันที่เริ่ม</span>
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
              </div>

              {/* Customer Type Selection */}
              <div className="flex justify-between items-center bg-[#F5E6D3]/20 p-2.5 rounded-lg border border-dashed border-[#D7CCC8]">
                <span className="font-bold text-gray-700">ประเภทลูกค้า:</span>

                <div className="flex gap-2.5">
                  {[
                    { label: 'รายเดือน', val: 'Standard' },
                    { label: 'ประจำ', val: 'Regular' },
                    { label: 'VIP', val: 'VIP' }
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
              <div className="bg-[#FFF] p-3 rounded-lg border border-gray-200 flex flex-col gap-2.5">
                <div className="font-bold text-gray-700 border-b pb-1.5 flex justify-between items-center">
                  <span>รายการล็อค :</span>
                  <span className="text-[10px] text-gray-400 font-bold">ระบุเลขแผงตามวันที่ลงขาย</span>
                </div>

                {newMonthlyDays.wed && (
                  <div className="flex flex-wrap gap-2 items-center bg-green-50/40 p-2 rounded border border-green-100">
                    <span className="w-12 font-bold text-green-700 shrink-0">วันพุธ</span>
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                      {newMonthlyStallsWed.map((stName) => (
                        <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-xs">
                          {cleanStallName(stName)}
                          <button
                            type="button"
                            disabled={isEditingMonthlyMode}
                            onClick={() => setNewMonthlyStallsWed(newMonthlyStallsWed.filter(s => s !== stName))}
                            className={`font-black ml-1 text-[10px] transition-colors ${
                              isEditingMonthlyMode ? 'text-gray-400 cursor-not-allowed' : 'text-amber-700 hover:text-red-700 cursor-pointer'
                            }`}
                            title={isEditingMonthlyMode ? "" : "ลบออก"}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      
                      <div className="relative" ref={addStallDropdownRefWed}>
                        <button
                          type="button"
                          disabled={isEditingMonthlyMode}
                          onClick={() => {
                            setShowAddStallSelectWed(!showAddStallSelectWed);
                            setShowAddStallSelectSat(false);
                            setShowAddStallSelectSun(false);
                            setStallFilterWed('');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition-all flex items-center ${
                            isEditingMonthlyMode 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#8B4513] hover:bg-[#5D4037] text-white cursor-pointer'
                          }`}
                        >
                          + เพิ่มล็อค
                        </button>
                        
                        {showAddStallSelectWed && (
                          <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#8B4513]/25 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                            <input
                              type="text"
                              value={stallFilterWed}
                              onChange={(e) => setStallFilterWed(e.target.value)}
                              placeholder="ค้นหาชื่อล็อค..."
                              className="p-1.5 border border-red-500 rounded text-xs text-gray-800 bg-red-50/10 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold mb-1"
                              autoFocus
                            />
                            {(() => {
                              const occupiedStalls = getOccupiedStallsInRound(3);
                              const filtered = stalls.filter(s => 
                                s.type !== 'ทางเดิน' && 
                                s.type !== 'อื่นๆ' && 
                                !newMonthlyStallsWed.includes(s.name) && 
                                !occupiedStalls.includes(s.name) &&
                                s.name.toLowerCase().includes(stallFilterWed.toLowerCase())
                              );
                              
                              if (filtered.length === 0) {
                                  return <span className="text-[10px] text-gray-400 text-center py-2">ไม่พบชื่อล็อค</span>;
                              }
                              
                              return filtered.map((vSt) => (
                                <button
                                  key={vSt.name}
                                  type="button"
                                  onClick={() => {
                                    setNewMonthlyStallsWed([...newMonthlyStallsWed, vSt.name]);
                                    setShowAddStallSelectWed(false);
                                  }}
                                  className="text-left w-full px-2 py-1.5 text-xs hover:bg-amber-50 rounded text-gray-700 font-bold border-b border-gray-100 last:border-b-0 cursor-pointer"
                                >
                                  {cleanStallName(vSt.name)}{vSt.zone ? ` (${vSt.zone})` : ''}
                                </button>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {newMonthlyDays.sat && (
                  <div className="flex flex-wrap gap-2 items-center bg-purple-50/40 p-2 rounded border border-purple-100">
                    <span className="w-12 font-bold text-purple-700 shrink-0">วันเสาร์</span>
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                      {newMonthlyStallsSat.map((stName) => (
                        <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-xs">
                          {cleanStallName(stName)}
                          <button
                            type="button"
                            disabled={isEditingMonthlyMode}
                            onClick={() => setNewMonthlyStallsSat(newMonthlyStallsSat.filter(s => s !== stName))}
                            className={`font-black ml-1 text-[10px] transition-colors ${
                              isEditingMonthlyMode ? 'text-gray-400 cursor-not-allowed' : 'text-amber-700 hover:text-red-700 cursor-pointer'
                            }`}
                            title={isEditingMonthlyMode ? "" : "ลบออก"}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      
                      <div className="relative" ref={addStallDropdownRefSat}>
                        <button
                          type="button"
                          disabled={isEditingMonthlyMode}
                          onClick={() => {
                            setShowAddStallSelectSat(!showAddStallSelectSat);
                            setShowAddStallSelectWed(false);
                            setShowAddStallSelectSun(false);
                            setStallFilterSat('');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition-all flex items-center ${
                            isEditingMonthlyMode 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#8B4513] hover:bg-[#5D4037] text-white cursor-pointer'
                          }`}
                        >
                          + เพิ่มล็อค
                        </button>
                        
                        {showAddStallSelectSat && (
                          <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#8B4513]/25 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                            <input
                              type="text"
                              value={stallFilterSat}
                              onChange={(e) => setStallFilterSat(e.target.value)}
                              placeholder="ค้นหาชื่อล็อค..."
                              className="p-1.5 border border-red-500 rounded text-xs text-gray-800 bg-red-50/10 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold mb-1"
                              autoFocus
                            />
                            {(() => {
                              const occupiedStalls = getOccupiedStallsInRound(6);
                              const filtered = stalls.filter(s => 
                                s.type !== 'ทางเดิน' && 
                                s.type !== 'อื่นๆ' && 
                                !newMonthlyStallsSat.includes(s.name) && 
                                !occupiedStalls.includes(s.name) &&
                                s.name.toLowerCase().includes(stallFilterSat.toLowerCase())
                              );
                              
                              if (filtered.length === 0) {
                                  return <span className="text-[10px] text-gray-400 text-center py-2">ไม่พบชื่อล็อค</span>;
                              }
                              
                              return filtered.map((vSt) => (
                                <button
                                  key={vSt.name}
                                  type="button"
                                  onClick={() => {
                                    setNewMonthlyStallsSat([...newMonthlyStallsSat, vSt.name]);
                                    setShowAddStallSelectSat(false);
                                  }}
                                  className="text-left w-full px-2 py-1.5 text-xs hover:bg-amber-50 rounded text-gray-700 font-bold border-b border-gray-100 last:border-b-0 cursor-pointer"
                                >
                                  {cleanStallName(vSt.name)}{vSt.zone ? ` (${vSt.zone})` : ''}
                                </button>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {newMonthlyDays.sun && (
                  <div className="flex flex-wrap gap-2 items-center bg-red-50/40 p-2 rounded border border-red-100">
                    <span className="w-12 font-bold text-red-700 shrink-0">วันอาทิตย์</span>
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                      {newMonthlyStallsSun.map((stName) => (
                        <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-xs">
                          {cleanStallName(stName)}
                          <button
                            type="button"
                            disabled={isEditingMonthlyMode}
                            onClick={() => setNewMonthlyStallsSun(newMonthlyStallsSun.filter(s => s !== stName))}
                            className={`font-black ml-1 text-[10px] transition-colors ${
                              isEditingMonthlyMode ? 'text-gray-400 cursor-not-allowed' : 'text-amber-700 hover:text-red-700 cursor-pointer'
                            }`}
                            title={isEditingMonthlyMode ? "" : "ลบออก"}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      
                      <div className="relative" ref={addStallDropdownRefSun}>
                        <button
                          type="button"
                          disabled={isEditingMonthlyMode}
                          onClick={() => {
                            setShowAddStallSelectSun(!showAddStallSelectSun);
                            setShowAddStallSelectWed(false);
                            setShowAddStallSelectSat(false);
                            setStallFilterSun('');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition-all flex items-center ${
                            isEditingMonthlyMode 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#8B4513] hover:bg-[#5D4037] text-white cursor-pointer'
                          }`}
                        >
                          + เพิ่มล็อค
                        </button>
                        
                        {showAddStallSelectSun && (
                          <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#8B4513]/25 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                            <input
                              type="text"
                              value={stallFilterSun}
                              onChange={(e) => setStallFilterSun(e.target.value)}
                              placeholder="ค้นหาชื่อล็อค..."
                              className="p-1.5 border border-red-500 rounded text-xs text-gray-800 bg-red-50/10 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold mb-1"
                              autoFocus
                            />
                            {(() => {
                              const occupiedStalls = getOccupiedStallsInRound(0);
                              const filtered = stalls.filter(s => 
                                s.type !== 'ทางเดิน' && 
                                s.type !== 'อื่นๆ' && 
                                !newMonthlyStallsSun.includes(s.name) && 
                                !occupiedStalls.includes(s.name) &&
                                s.name.toLowerCase().includes(stallFilterSun.toLowerCase())
                              );
                              
                              if (filtered.length === 0) {
                                  return <span className="text-[10px] text-gray-400 text-center py-2">ไม่พบชื่อล็อค</span>;
                              }
                              
                              return filtered.map((vSt) => (
                                <button
                                  key={vSt.name}
                                  type="button"
                                  onClick={() => {
                                    setNewMonthlyStallsSun([...newMonthlyStallsSun, vSt.name]);
                                    setShowAddStallSelectSun(false);
                                  }}
                                  className="text-left w-full px-2 py-1.5 text-xs hover:bg-amber-50 rounded text-gray-700 font-bold border-b border-gray-100 last:border-b-0 cursor-pointer"
                                >
                                  {cleanStallName(vSt.name)}{vSt.zone ? ` (${vSt.zone})` : ''}
                                </button>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                </>
              )}

              {/* Extra fees row */}
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

              {/* Pricing breakdown summary */}
              {newMonthlyCustomerType === 'Regular' ? (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 flex items-start gap-2 shadow-xs">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] font-bold leading-normal">
                    <h5 className="font-extrabold text-amber-800 text-xs mb-0.5">ชำระเงินในรูปแบบรายวัน</h5>
                    <p>สัญญาลูกค้าประจำนี้จะทำการล็อกผังไว้ทั้งเดือนโดยขึ้นสถานะ "ค้างชำระ (ประจำ)" และจะชำระเงินเป็นรายวันทีละล็อคเมื่อเริ่มขายจริงในแต่ละวัน โดยอ้างอิงราคาตามปกติของแต่ละล็อค</p>
                  </div>
                </div>
              ) : (() => {
                const pricing = getNewMonthlyPricing();
                const totalNads = (newMonthlyDays.wed && newMonthlyStallsWed.length > 0 ? pricing.wedCount : 0) +
                                  (newMonthlyDays.sat && newMonthlyStallsSat.length > 0 ? pricing.satCount : 0) +
                                  (newMonthlyDays.sun && newMonthlyStallsSun.length > 0 ? pricing.sunCount : 0);
                return (
                  <div className="bg-[#FFFDF9] border border-[#8B4513]/30 rounded-lg p-3 flex flex-col gap-2 shadow-xs">
                    <div className="font-bold text-gray-800 border-b border-dashed pb-1 mb-1">สรุปรายละเอียดราคา</div>
                    <div className="space-y-1 text-gray-600 font-bold">
                      {newMonthlyDays.wed && newMonthlyStallsWed.length > 0 && (
                        <div className="flex justify-between">
                          <span>วันพุธ: {pricing.wedCount} วัน x {pricing.wedStallsPrice.toLocaleString()}.-</span>
                          <span className="font-bold">{pricing.wedTotal.toLocaleString()}.-</span>
                        </div>
                      )}
                      {newMonthlyDays.sat && newMonthlyStallsSat.length > 0 && (
                        <div className="flex justify-between">
                          <span>วันเสาร์: {pricing.satCount} วัน x {pricing.satStallsPrice.toLocaleString()}.-</span>
                          <span className="font-bold">{pricing.satTotal.toLocaleString()}.-</span>
                        </div>
                      )}
                      {newMonthlyDays.sun && newMonthlyStallsSun.length > 0 && (
                        <div className="flex justify-between">
                          <span>วันอาทิตย์: {pricing.sunCount} วัน x {pricing.sunStallsPrice.toLocaleString()}.-</span>
                          <span className="font-bold">{pricing.sunTotal.toLocaleString()}.-</span>
                        </div>
                      )}
                      {parseNumber(newMonthlyElecUnit) > 0 && pricing.totalElecCharged > 0 && (
                        <div className="flex justify-between text-yellow-800">
                          <span>ค่าไฟ: {pricing.totalElecCharged} วัน x ({parseNumber(newMonthlyElecUnit)} หน่วย x 10บ.)</span>
                          <span className="font-bold">{pricing.totalElecPrice.toLocaleString()}.-</span>
                        </div>
                      )}
                      {parseNumber(newMonthlyStorageFee) > 0 && (
                        <div className="flex justify-between text-amber-900">
                          <span>ค่าฝากของ:</span>
                          <span className="font-bold">{pricing.storageFeeVal.toLocaleString()}.-</span>
                        </div>
                      )}
                      {totalNads > 0 && (
                        <div className="flex justify-between border-t border-dashed border-gray-200 pt-1 mt-1 text-slate-700 text-xs text-left">
                          <span>จำนวนวันลงขายรวม:</span>
                          <span className="font-extrabold">{totalNads} นัด (ครั้ง)</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-dashed border-[#8B4513]/30 pt-2 mt-1 flex justify-between items-center">
                      <span className="font-bold text-sm text-[#3E2723]">ยอดรวมที่ต้องชำระทั้งสิ้น</span>
                      <span className="font-black text-lg text-amber-800">{pricing.grandTotal.toLocaleString()} บาท</span>
                    </div>
                  </div>
                );
              })()}

              {/* Booker Info Fields */}
              <div className="bg-[#F5E6D3]/15 p-3 rounded-lg border border-[#D7CCC8]/60 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">ชื่อผู้จอง</label>
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
                  <label className="font-bold text-gray-700">เบอร์โทรศัพท์</label>
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
