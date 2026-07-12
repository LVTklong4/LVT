'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Search, RefreshCw, Loader2, X, Calendar, MapPin, ArrowRight } from 'lucide-react';

export default function MoveLockModal() {
  const {
    stalls,
    fetchVacantStallsForDate,
    getStallPriceForDate,
    handleConfirmMoveLock,
    loading,
    loadingVacantStalls,
    moveStallFilter,
    moveTargetDate,
    moveTargetStall,
    parseNumber,
    paymentList,
    selectedBooking,
    setMoveStallFilter,
    setMoveTargetDate,
    setMoveTargetStall,
    setShowMoveLockModal,
    showMoveLockModal,
    vacantStallsOnTargetDate
  } = useBooking();

  // Local state for selecting which stall to move (for multi-stall bookings)
  const [sourceStallName, setSourceStallName] = React.useState('');

  React.useEffect(() => {
    if (selectedBooking) {
      const names = selectedBooking.stall_name.split(',').map(s => s.trim());
      if (names.length > 0) {
        setSourceStallName(names[0]);
        // Reset target stall selection when booking changes
        setMoveTargetStall(null);
        setMoveStallFilter('');
      }
    }
  }, [selectedBooking, setMoveTargetStall, setMoveStallFilter]);

  if (!showMoveLockModal || !selectedBooking) return null;

  // Split multi-stall names
  const sourceStalls = selectedBooking.stall_name.split(',').map(s => s.trim());
  const isMultiStall = sourceStalls.length > 1;

  // Calculate standard prices on the original date to find the ratio
  const sourceStallObj = stalls.find(s => s.name === sourceStallName);
  const originalSourcePrice = sourceStallObj 
    ? getStallPriceForDate(sourceStallObj, selectedBooking.date) 
    : 0;

  // Sum of standard prices for all stalls in this booking
  const totalStandard = sourceStalls.reduce((sum, name) => {
    const sObj = stalls.find(s => s.name === name);
    return sum + (sObj ? getStallPriceForDate(sObj, selectedBooking.date) : 0);
  }, 0);

  const ratio = originalSourcePrice / (totalStandard || 1);

  // Calculate current paid amount for the whole booking
  let currentPaid = 0;
  if (selectedBooking.payment_method) {
    const parts = selectedBooking.payment_method.split('+');
    parts.forEach(part => {
      if (part.includes(':')) {
        const [, amtStr] = part.split(':');
        currentPaid += parseNumber(amtStr);
      } else {
        currentPaid += parseNumber(part);
      }
    });
  }
  if (currentPaid === 0 && selectedBooking.status === 'ชำระแล้ว') {
    currentPaid = parseNumber(selectedBooking.total_price);
  }

  // Allocated share of paid amount for this specific source stall
  const allocatedSourcePaid = Math.round(currentPaid * ratio);
  const allocatedSourcePrice = Math.round(selectedBooking.stall_price * ratio);

  // Format dates for display
  const formatDateThai = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col relative animate-pop-in text-[#4A3B32]">
        
        {/* Header (Wood theme) */}
        <div className="bg-[#5D4037] text-amber-50 px-5 py-4 flex justify-between items-center shrink-0 border-b border-[#8B4513]/30">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin-slow" /> 
            ย้ายล็อคแผงค้า
          </h3>
          <button 
            onClick={() => setShowMoveLockModal(false)} 
            className="text-amber-200 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 flex flex-col gap-4">

          {/* 1. Multi-Stall Source Selector */}
          {isMultiStall && (
            <div className="flex flex-col gap-1.5 bg-[#FAF0E6] border border-[#8B4513]/10 p-3 rounded-xl">
              <span className="text-[10px] font-black text-[#8B4513] uppercase tracking-wider block">
                เลือกแผงต้นทางที่ต้องการย้าย:
              </span>
              <div className="flex flex-wrap gap-2.5 mt-1.5">
                {sourceStalls.map(name => {
                  const isSelected = sourceStallName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSourceStallName(name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#8B4513] text-white shadow-md' 
                          : 'bg-white border border-amber-200 hover:bg-amber-50 text-gray-700'
                      }`}
                    >
                      แผง {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Target Date Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#8B4513]" /> วันที่ต้องการย้ายไป
            </label>
            <input
              type="date"
              value={moveTargetDate}
              onChange={(e) => {
                const d = e.target.value;
                setMoveTargetDate(d);
                setMoveTargetStall(null);
                fetchVacantStallsForDate(d);
              }}
              className="p-2.5 border-2 border-amber-200 rounded-xl text-xs text-center font-bold focus:border-[#8B4513] focus:ring-0 bg-white"
            />
          </div>

          {/* 3. Target Stall Dropdown */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#8B4513]" /> เลือกล็อคปลายทางที่ว่าง
            </label>
            <div className="relative">
              <input
                type="text"
                value={moveStallFilter}
                onChange={(e) => setMoveStallFilter(e.target.value)}
                placeholder="ค้นหาชื่อล็อค..."
                className="pl-8 pr-3 py-2 w-full border-2 border-amber-200 rounded-xl text-xs focus:border-[#8B4513] focus:ring-0 bg-white font-bold"
              />
              <Search className="w-4 h-4 text-amber-700 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <div className="mt-1.5 border border-amber-200 rounded-xl max-h-[140px] overflow-y-auto bg-white flex flex-col shadow-inner">
              {loadingVacantStalls ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8B4513]" /> กำลังโหลดล็อคว่าง...
                </div>
              ) : (() => {
                const isSameDate = moveTargetDate === selectedBooking.date;
                const filtered = vacantStallsOnTargetDate.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(moveStallFilter.toLowerCase());
                  const isOriginalStall = isSameDate && selectedBooking.stall_name.split(',').map(name => name.trim()).includes(s.name);
                  return matchesSearch && !isOriginalStall;
                });

                if (filtered.length === 0) {
                  return <span className="text-xs text-gray-400 text-center py-6 font-bold">ไม่พบล็อคว่างในระบบ</span>;
                }

                return filtered.map((s) => {
                  const price = getStallPriceForDate(s, moveTargetDate);
                  const isSelected = moveTargetStall?.name === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setMoveTargetStall(s)}
                      className={`w-full text-left px-4 py-2 text-xs font-mono font-bold flex justify-between items-center transition-all border-b border-amber-50 last:border-b-0 cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-100 text-[#8B4513]' 
                          : 'hover:bg-amber-50/50 text-gray-700'
                      }`}
                    >
                      <span>{s.name} <span className="text-[9px] text-gray-400">({s.type})</span></span>
                      <span className="text-[#8B4513] font-black">{price} บ.</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* 4. Moving Details Summary Block */}
          <div className="bg-[#FAF0E6]/80 border-2 border-dashed border-[#8B4513]/20 rounded-xl p-3.5 flex flex-col gap-2 mt-1.5 text-xs">
            <span className="text-[10px] font-black text-[#8B4513] uppercase tracking-wider block mb-1">
              สรุปรายละเอียดการย้าย:
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-gray-600 font-bold">
              <div>วันที่เดิม: <span className="text-gray-900 font-extrabold">{formatDateThai(selectedBooking.date)}</span></div>
              <div>วันที่ใหม่: <span className="text-gray-900 font-extrabold">{formatDateThai(moveTargetDate)}</span></div>
              <div className="col-span-2 flex items-center gap-1.5 border-t border-[#8B4513]/10 pt-1.5 mt-0.5">
                <span>ย้ายแผง:</span>
                <span className="bg-amber-100 px-2 py-0.5 rounded-md text-[#8B4513] font-black">{sourceStallName}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                {moveTargetStall ? (
                  <span className="bg-green-100 px-2 py-0.5 rounded-md text-green-800 font-black">{moveTargetStall.name}</span>
                ) : (
                  <span className="text-red-500 font-black">ยังไม่ได้เลือก</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Price Details & Differences Comparison Card */}
          {moveTargetStall && (() => {
            const newStallPrice = getStallPriceForDate(moveTargetStall, moveTargetDate);
            const finalSourcePrice = Math.max(newStallPrice, allocatedSourcePaid);
            const difference = finalSourcePrice - allocatedSourcePaid;

            return (
              <div className="bg-[#FAEBD7]/30 border border-amber-900/10 rounded-xl p-3.5 flex flex-col gap-2 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">ยอดชำระแผงเดิม ({sourceStallName}):</span>
                  <span className="font-mono font-black text-gray-800">{allocatedSourcePaid} บ.</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">ราคาแผงใหม่ ({moveTargetStall.name}):</span>
                  <span className="font-mono font-black text-gray-800">{newStallPrice} บ.</span>
                </div>
                
                <div className="border-t border-dashed border-[#8B4513]/20 pt-2.5 flex justify-between items-center font-black">
                  {difference > 0 ? (
                    <>
                      <span className="text-red-700 text-xs">ต้องชำระส่วนต่างเพิ่ม:</span>
                      <span className="font-mono text-red-800 text-sm">+{difference} บ.</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-700 text-xs">ราคาแผงใหม่ถูกกว่า (ไม่คืนเงิน):</span>
                      <span className="font-mono text-green-800 text-xs">0 บ. (โอนสิทธิ์ชำระครบ)</span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 6. Action Button */}
          <button
            onClick={() => handleConfirmMoveLock(sourceStallName, moveTargetStall, moveTargetDate)}
            disabled={!moveTargetStall || loading}
            className={`w-full py-3 text-white rounded-xl font-black text-sm shadow-md transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer ${
              !moveTargetStall || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-[#8B4513] hover:bg-[#5D4037]'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            ยืนยันการย้ายล็อค
          </button>
        </div>
      </div>
    </div>
  );
}
