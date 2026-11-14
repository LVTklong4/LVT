'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { cleanStallName } from '@/utils/numberHelper';
import { Search, RefreshCw, Loader2, X, Calendar, MapPin, ArrowRight, Check } from 'lucide-react';

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
    selectedDate,
    setMoveStallFilter,
    setMoveTargetDate,
    setMoveTargetStall,
    setShowMoveLockModal,
    showMoveLockModal,
    vacantStallsOnTargetDate
  } = useBooking();

  // Local state for selecting which stall to move (for multi-stall bookings)
  const [sourceStallName, setSourceStallName] = React.useState('');
  // Mode: 'all' (move all stalls together in 1 bill) or 'single' (split 1 stall)
  const [moveMode, setMoveMode] = React.useState('all');
  // Selected target stalls when moving all stalls together
  const [selectedTargetStalls, setSelectedTargetStalls] = React.useState([]);

  React.useEffect(() => {
    if (selectedBooking) {
      const names = selectedBooking.stall_name.split(',').map(s => s.trim());
      if (names.length > 0) {
        setSourceStallName(names[0]);
      }
    }
  }, [selectedBooking]);

  React.useEffect(() => {
    if (showMoveLockModal) {
      setMoveStallFilter('');
      setMoveTargetStall(null);
      setSelectedTargetStalls([]);
      setMoveMode('all');
      const targetD = moveTargetDate || selectedBooking?.date || selectedDate;
      if (!moveTargetDate && targetD) {
        setMoveTargetDate(targetD);
      }
      if (targetD) {
        fetchVacantStallsForDate(targetD);
      }
    }
  }, [showMoveLockModal, selectedBooking]);

  if (!showMoveLockModal || !selectedBooking) return null;

  // Split multi-stall names
  const sourceStalls = selectedBooking.stall_name.split(',').map(s => s.trim());
  const isMultiStall = sourceStalls.length > 1;
  const isMovingAll = isMultiStall && moveMode === 'all';

  // Calculate standard prices on the original date to find the ratio
  const sourceStallObj = stalls.find(s => s.name === sourceStallName);
  const originalSourcePrice = sourceStallObj 
    ? getStallPriceForDate(sourceStallObj, selectedBooking.date) 
    : 0;

  // Sum of standard prices for all stalls in this booking
  const totalStandard = sourceStalls.reduce((sum, name) => {
    const sObj = stalls.find(s => s.name === name);
    return sum + (sObj ? getStallPriceForDate(sObj, selectedBooking.date) : 0);
  }, 0) || parseNumber(selectedBooking.stall_price);

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

  // Allocated share of paid amount for single source stall
  const allocatedSourcePaid = Math.round(currentPaid * ratio);
  const allocatedSourcePrice = Math.round(selectedBooking.stall_price * ratio);

  // For Move All: Sum of prices of selected target stalls
  const targetAllStallPrice = selectedTargetStalls.reduce((sum, s) => {
    return sum + (getStallPriceForDate ? getStallPriceForDate(s, moveTargetDate) : parseNumber(s.price_wed || 0));
  }, 0);

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border-2 border-[#8B4513] overflow-hidden flex flex-col relative animate-pop-in text-[#4A3B32] max-h-[92vh]">
        
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
        
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto">

          {/* Mode Switch for Multi-Stall Bookings */}
          {isMultiStall && (
            <div className="flex bg-[#FAF0E6] p-1 rounded-xl border border-[#8B4513]/15">
              <button
                type="button"
                onClick={() => {
                  setMoveMode('all');
                  setSelectedTargetStalls([]);
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  moveMode === 'all'
                    ? 'bg-[#8B4513] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📦 ย้ายพร้อมกัน ({sourceStalls.length} แผง)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoveMode('single');
                  setMoveTargetStall(null);
                }}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  moveMode === 'single'
                    ? 'bg-[#8B4513] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✂️ ย้ายเฉพาะบางแผง
              </button>
            </div>
          )}

          {/* 1. Source Stalls Display / Selector */}
          {isMovingAll ? (
            <div className="bg-[#FAF0E6] border border-[#8B4513]/15 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">แผงต้นทางที่จะย้าย:</span>
              <span className="font-black text-[#8B4513] bg-amber-100/90 px-2.5 py-0.5 rounded-lg border border-amber-300">
                {sourceStalls.map(s => cleanStallName(s)).join(', ')} ({sourceStalls.length} แผง)
              </span>
            </div>
          ) : isMultiStall ? (
            <div className="flex flex-col gap-1.5 bg-[#FAF0E6] border border-[#8B4513]/10 p-3 rounded-xl">
              <span className="text-[10px] font-black text-[#8B4513] uppercase tracking-wider block">
                เลือกแผงต้นทางที่ต้องการย้าย:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
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
                      แผง {cleanStallName(name)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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
                setSelectedTargetStalls([]);
                setMoveStallFilter('');
                fetchVacantStallsForDate(d);
              }}
              className="p-2.5 border-2 border-amber-200 rounded-xl text-xs text-center font-bold focus:border-[#8B4513] focus:ring-0 bg-white"
            />
          </div>

          {/* 3. Target Stall Picker */}
          <div className="flex flex-col gap-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8B4513]" /> 
                {isMovingAll 
                  ? `เลือกล็อคปลายทางที่ว่าง (${selectedTargetStalls.length}/${sourceStalls.length} แผง)` 
                  : 'เลือกล็อคปลายทางที่ว่าง'}
              </label>
              {isMovingAll && (
                <span className={`text-[11px] font-black ${selectedTargetStalls.length === sourceStalls.length ? 'text-green-700' : 'text-amber-700'}`}>
                  {selectedTargetStalls.length === sourceStalls.length ? '✓ เลือกครบแล้ว' : `เลือกอีก ${sourceStalls.length - selectedTargetStalls.length} แผง`}
                </span>
              )}
            </div>

            {/* Selected Chips for Multi-Move */}
            {isMovingAll && selectedTargetStalls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/70 border border-amber-200 rounded-xl">
                {selectedTargetStalls.map(st => (
                  <span
                    key={st.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-900 rounded-lg text-xs font-black border border-green-300 shadow-xs"
                  >
                    <span>{cleanStallName(st.name)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTargetStalls(prev => prev.filter(item => item.name !== st.name));
                      }}
                      className="text-red-500 hover:text-red-700 font-bold text-sm leading-none cursor-pointer ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

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
            
            <div className="mt-1 border border-amber-200 rounded-xl max-h-[140px] overflow-y-auto bg-white flex flex-col shadow-inner">
              {loadingVacantStalls ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8B4513]" /> กำลังโหลดล็อคว่าง...
                </div>
              ) : (() => {
                const isSameDate = moveTargetDate === selectedBooking.date;
                const originalNamesSet = new Set(
                  selectedBooking.stall_name.split(',').map(name => cleanStallName(name))
                );

                const filtered = vacantStallsOnTargetDate.filter(s => {
                  const sClean = cleanStallName(s.name);
                  const matchesSearch = sClean.toLowerCase().includes(moveStallFilter.toLowerCase()) || 
                                        s.name.toLowerCase().includes(moveStallFilter.toLowerCase());
                  const isOriginalStall = isSameDate && originalNamesSet.has(sClean);
                  return matchesSearch && !isOriginalStall;
                });

                if (filtered.length === 0) {
                  return <span className="text-xs text-gray-400 text-center py-6 font-bold">ไม่พบล็อคว่างในระบบ</span>;
                }

                return filtered.map((s) => {
                  const price = getStallPriceForDate(s, moveTargetDate);
                  const isSelected = isMovingAll
                    ? selectedTargetStalls.some(st => st.name === s.name)
                    : moveTargetStall?.name === s.name;

                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        if (isMovingAll) {
                          if (isSelected) {
                            setSelectedTargetStalls(prev => prev.filter(st => st.name !== s.name));
                          } else {
                            if (selectedTargetStalls.length < sourceStalls.length) {
                              setSelectedTargetStalls(prev => [...prev, s]);
                            } else {
                              // Replace the last item if limit is reached
                              setSelectedTargetStalls(prev => [...prev.slice(0, sourceStalls.length - 1), s]);
                            }
                          }
                        } else {
                          setMoveTargetStall(s);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-mono font-bold flex justify-between items-center transition-all border-b border-amber-50 last:border-b-0 cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-100 text-[#8B4513] font-black' 
                          : 'hover:bg-amber-50/50 text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5 text-green-700 stroke-[3]" />}
                        <span>{cleanStallName(s.name)} <span className="text-[9px] text-gray-400">({s.type})</span></span>
                      </span>
                      <span className="text-[#8B4513] font-black">{price} บ.</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* 4. Moving Details Summary Block */}
          <div className="bg-[#FAF0E6]/80 border-2 border-dashed border-[#8B4513]/20 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
            <span className="text-[10px] font-black text-[#8B4513] uppercase tracking-wider block mb-0.5">
              สรุปรายละเอียดการย้าย:
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-gray-600 font-bold">
              <div>วันที่เดิม: <span className="text-gray-900 font-extrabold">{formatDateThai(selectedBooking.date)}</span></div>
              <div>วันที่ใหม่: <span className="text-gray-900 font-extrabold">{formatDateThai(moveTargetDate)}</span></div>
              <div className="col-span-2 flex items-center flex-wrap gap-1.5 border-t border-[#8B4513]/10 pt-1.5 mt-0.5">
                <span>ย้ายแผง:</span>
                <span className="bg-amber-100 px-2 py-0.5 rounded-md text-[#8B4513] font-black">
                  {isMovingAll ? sourceStalls.map(cleanStallName).join(', ') : cleanStallName(sourceStallName)}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                {isMovingAll ? (
                  selectedTargetStalls.length > 0 ? (
                    <span className="bg-green-100 px-2 py-0.5 rounded-md text-green-800 font-black">
                      {selectedTargetStalls.map(s => cleanStallName(s.name)).join(', ')}
                      {selectedTargetStalls.length < sourceStalls.length && ` (ขาดอีก ${sourceStalls.length - selectedTargetStalls.length})`}
                    </span>
                  ) : (
                    <span className="text-red-500 font-black">ยังไม่ได้เลือก</span>
                  )
                ) : (
                  moveTargetStall ? (
                    <span className="bg-green-100 px-2 py-0.5 rounded-md text-green-800 font-black">{cleanStallName(moveTargetStall.name)}</span>
                  ) : (
                    <span className="text-red-500 font-black">ยังไม่ได้เลือก</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 5. Price Details & Differences Comparison Card */}
          {((isMovingAll && selectedTargetStalls.length === sourceStalls.length) || (!isMovingAll && moveTargetStall)) && (() => {
            const origPrice = isMovingAll
              ? totalStandard
              : (originalSourcePrice || getStallPriceForDate(sourceStallObj || { name: sourceStallName }, selectedBooking.date));
            const newStallPrice = isMovingAll
              ? targetAllStallPrice
              : getStallPriceForDate(moveTargetStall, moveTargetDate);
            const difference = newStallPrice - origPrice;

            return (
              <div className="bg-[#FAEBD7]/30 border border-amber-900/10 rounded-xl p-3 flex flex-col gap-1.5 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">
                    {isMovingAll ? `ราคาแผงเดิม (${sourceStalls.map(cleanStallName).join(', ')}):` : `ราคาแผงเดิม (${cleanStallName(sourceStallName)}):`}
                  </span>
                  <span className="font-mono font-black text-gray-800">{origPrice} บ.</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">
                    {isMovingAll ? `ราคาแผงใหม่ (${selectedTargetStalls.map(s => cleanStallName(s.name)).join(', ')}):` : `ราคาแผงใหม่ (${cleanStallName(moveTargetStall.name)}):`}
                  </span>
                  <span className="font-mono font-black text-gray-800">{newStallPrice} บ.</span>
                </div>
                
                <div className="border-t border-dashed border-[#8B4513]/20 pt-2 flex justify-between items-center font-black">
                  {difference > 0 ? (
                    <>
                      <span className="text-red-700 text-xs">ส่วนต่างราคาแผงต้องชำระเพิ่ม:</span>
                      <span className="font-mono text-red-800 text-sm">+{difference} บ.</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-700 text-xs">ราคาแผงใหม่เท่ากันหรือถูกกว่า (ไม่คืนเงิน):</span>
                      <span className="font-mono text-green-800 text-xs">0 บ. (ชำระครบแล้ว)</span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 6. Action Button */}
          {isMovingAll ? (
            <button
              onClick={() => handleConfirmMoveLock({
                moveAll: true,
                sourceStalls,
                targetStalls: selectedTargetStalls,
                targetDate: moveTargetDate
              })}
              disabled={selectedTargetStalls.length !== sourceStalls.length || loading}
              className={`w-full py-3 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all mt-1 flex items-center justify-center gap-2 cursor-pointer ${
                selectedTargetStalls.length !== sourceStalls.length || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#8B4513] hover:bg-[#5D4037]'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              ยืนยันย้าย {sourceStalls.length} แผงพร้อมกัน (บิลเดียวกัน)
            </button>
          ) : (
            <button
              onClick={() => handleConfirmMoveLock(sourceStallName, moveTargetStall, moveTargetDate, { moveAll: false })}
              disabled={!moveTargetStall || loading}
              className={`w-full py-3 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all mt-1 flex items-center justify-center gap-2 cursor-pointer ${
                !moveTargetStall || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-[#8B4513] hover:bg-[#5D4037]'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              ยืนยันการย้ายล็อค{isMultiStall ? ' (แยกบิล)' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
