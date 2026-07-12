'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Search, RefreshCw, Loader2, X } from 'lucide-react';

export default function MoveLockModal() {
  const {
    fetchVacantStallsForDate,    getStallPriceForDate,    handleConfirmMoveLock,    loading,    loadingVacantStalls,    moveStallFilter,    moveTargetDate,    moveTargetStall,    parseNumber,    paymentList,    selectedBooking,    setMoveStallFilter,    setMoveTargetDate,    setMoveTargetStall,    setShowMoveLockModal,    showMoveLockModal,    vacantStallsOnTargetDate
  } = useBooking();

  if (!showMoveLockModal || !selectedBooking) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border-2 border-indigo-600 overflow-hidden animate-pop-in">
            <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <RefreshCw className="w-5 h-5" /> ย้ายล็อค ({selectedBooking.stall_name})
              </h3>
              <button 
                onClick={() => setShowMoveLockModal(false)} 
                className="text-indigo-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              {/* Date Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">วันที่ต้องการย้ายไป</label>
                <input
                  type="date"
                  value={moveTargetDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setMoveTargetDate(d);
                    setMoveTargetStall(null);
                    fetchVacantStallsForDate(d);
                  }}
                  className="p-2 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Target Stall Search/Dropdown */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-gray-700">เลือกล็อคปลายทางที่ว่าง</label>
                <input
                  type="text"
                  value={moveStallFilter}
                  onChange={(e) => setMoveStallFilter(e.target.value)}
                  placeholder="ค้นหาชื่อล็อค..."
                  className="p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                />
                
                <div className="mt-1 border border-gray-200 rounded-lg max-h-[160px] overflow-y-auto custom-scrollbar bg-white flex flex-col">
                  {loadingVacantStalls ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> กำลังโหลดล็อคว่าง...
                    </div>
                  ) : (() => {
                    const isSameDate = moveTargetDate === selectedBooking.date;
                    const filtered = vacantStallsOnTargetDate.filter(s => {
                      const matchesSearch = s.name.toLowerCase().includes(moveStallFilter.toLowerCase());
                      const isOriginalStall = isSameDate && selectedBooking.stall_name.split(',').map(name => name.trim()).includes(s.name);
                      return matchesSearch && !isOriginalStall;
                    });

                    if (filtered.length === 0) {
                      return <span className="text-xs text-gray-400 text-center py-4">ไม่พบล็อคว่างที่ตรงกัน</span>;
                    }

                    return filtered.map((s) => {
                      const price = getStallPriceForDate(s, moveTargetDate);
                      const isSelected = moveTargetStall?.name === s.name;
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setMoveTargetStall(s)}
                          className={`w-full text-left px-3 py-2 rounded text-xs font-mono font-bold flex justify-between items-center transition-colors border-b border-gray-100 last:border-b-0 ${
                            isSelected 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : 'hover:bg-indigo-50/40 text-gray-700'
                          }`}
                        >
                          <span>{s.name} <span className="text-[10px] text-gray-400">({s.type})</span></span>
                          <span className="text-indigo-800 font-mono font-black">{price} บ.</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Price Details Comparison Card */}
              {moveTargetStall && (() => {
                const currentPaid = paymentList
                  .filter(p => p.method && p.amount)
                  .reduce((sum, p) => sum + parseNumber(p.amount), 0);
                const newStallPrice = getStallPriceForDate(moveTargetStall, moveTargetDate);
                const difference = newStallPrice - currentPaid;

                return (
                  <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-3 flex flex-col gap-2 mt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold">ยอดชำระไปแล้ว:</span>
                      <span className="font-mono font-bold text-gray-800">{currentPaid} บ.</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold">ราคาล็อคใหม่ ({moveTargetStall.name}):</span>
                      <span className="font-mono font-bold text-gray-800">{newStallPrice} บ.</span>
                    </div>
                    <div className="border-t border-dashed border-indigo-200/50 pt-2 flex justify-between items-center font-bold">
                      {difference > 0 ? (
                        <>
                          <span className="text-red-700 text-xs">ต้องชำระเงินเพิ่ม:</span>
                          <span className="font-mono text-red-800 text-sm">+{difference} บ.</span>
                        </>
                      ) : (
                        <>
                          <span className="text-green-700 text-xs">ส่วนต่าง (ไม่คืนเงิน):</span>
                          <span className="font-mono text-green-800 text-xs">0 บ. (จ่ายครบแล้ว)</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={handleConfirmMoveLock}
                disabled={!moveTargetStall || loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs shadow-md transition-all mt-2 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                ยืนยันการย้ายล็อค
              </button>
            </div>
          </div>
        </div>
  );
}
