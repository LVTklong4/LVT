'use client';

import React from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { Info } from 'lucide-react';

export default function MonthlyStallSelection() {
  const {
    addStallDropdownRefSat,
    addStallDropdownRefSun,
    addStallDropdownRefWed,
    cleanStallName,
    getOccupiedStallsInRound,
    isEditingMonthlyMode,
    newMonthlyCustomerType,
    newMonthlyDays,
    newMonthlyStallsSat,
    newMonthlyStallsSun,
    newMonthlyStallsWed,
    setNewMonthlyStallsSat,
    setNewMonthlyStallsSun,
    setNewMonthlyStallsWed,
    setShowAddStallSelectSat,
    setShowAddStallSelectSun,
    setShowAddStallSelectWed,
    setStallFilterSat,
    setStallFilterSun,
    setStallFilterWed,
    showAddStallSelectSat,
    showAddStallSelectSun,
    showAddStallSelectWed,
    stallFilterSat,
    stallFilterSun,
    stallFilterWed,
    stalls
  } = useMonthlyBooking();

  return (
    <div className="bg-[#FFF] p-3 rounded-lg border border-gray-200 flex flex-col gap-2.5">
      <div className="font-bold text-gray-700 border-b pb-1.5 flex justify-between items-center">
        <span>รายการล็อค :</span>
        {newMonthlyCustomerType !== 'Room' && (
          <span className="text-[10px] text-gray-400 font-bold">ระบุเลขแผงตามวันที่ลงขาย</span>
        )}
      </div>

      {newMonthlyCustomerType === 'Room' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-950 rounded-lg p-2.5 text-[11px] font-bold flex items-start gap-1.5 mb-1.5 animate-fade-in">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>ห้องเช่าจะไม่ได้คิดเงินจากราคากลางค่าล็อค แต่คิดเป็นราคาที่ตกลงกันไว้</span>
        </div>
      )}

      {newMonthlyCustomerType === 'VIP' && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-lg p-2.5 text-[11px] font-bold flex items-start gap-1.5 mb-1.5 animate-fade-in">
          <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <span>ล็อควีไอพีจะไม่ได้คิดเงินจากราคากลางค่าล็อค แต่คิดเป็นราคาที่ตกลงกันไว้</span>
        </div>
      )}

      {newMonthlyCustomerType !== 'Room' && newMonthlyDays.wed && (
        <div className="flex flex-wrap gap-2 items-center bg-green-50/40 p-2 rounded border border-green-100">
          <span className="w-12 font-bold text-green-700 shrink-0">วันพุธ</span>
          <div className="flex-1 flex flex-wrap gap-1.5 items-center">
            {newMonthlyStallsWed.map((stName) => (
              <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-xs">
                {cleanStallName(stName)}
                <button
                  type="button"
                  disabled={isEditingMonthlyMode || newMonthlyCustomerType === 'Room'}
                  onClick={() => setNewMonthlyStallsWed(newMonthlyStallsWed.filter(s => s !== stName))}
                  className={`font-black ml-1 text-[10px] transition-colors ${
                    isEditingMonthlyMode || newMonthlyCustomerType === 'Room' ? 'text-gray-400 cursor-not-allowed' : 'text-amber-700 hover:text-red-700 cursor-pointer'
                  }`}
                  title={isEditingMonthlyMode || newMonthlyCustomerType === 'Room' ? "" : "ลบออก"}
                >
                  ✕
                </button>
              </span>
            ))}
            
            <div className="relative" ref={addStallDropdownRefWed}>
              <button
                type="button"
                disabled={isEditingMonthlyMode || newMonthlyCustomerType === 'Room'}
                onClick={() => {
                  setShowAddStallSelectWed(!showAddStallSelectWed);
                  setShowAddStallSelectSat(false);
                  setShowAddStallSelectSun(false);
                  setStallFilterWed('');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition-all flex items-center ${
                  isEditingMonthlyMode || newMonthlyCustomerType === 'Room'
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
                    const filtered = (stalls || []).filter(s => 
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

      {newMonthlyCustomerType !== 'Room' && newMonthlyDays.sat && (
        <div className="flex flex-wrap gap-2 items-center bg-purple-50/40 p-2 rounded border border-purple-100">
          <span className="w-12 font-bold text-purple-700 shrink-0">วันเสาร์</span>
          <div className="flex-1 flex flex-wrap gap-1.5 items-center">
            {newMonthlyStallsSat.map((stName) => (
              <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-xs">
                {cleanStallName(stName)}
                <button
                  type="button"
                  disabled={isEditingMonthlyMode || newMonthlyCustomerType === 'Room'}
                  onClick={() => setNewMonthlyStallsSat(newMonthlyStallsSat.filter(s => s !== stName))}
                  className={`font-black ml-1 text-[10px] transition-colors ${
                    isEditingMonthlyMode || newMonthlyCustomerType === 'Room' ? 'text-gray-400 cursor-not-allowed' : 'text-amber-700 hover:text-red-700 cursor-pointer'
                  }`}
                  title={isEditingMonthlyMode || newMonthlyCustomerType === 'Room' ? "" : "ลบออก"}
                >
                  ✕
                </button>
              </span>
            ))}
            
            <div className="relative" ref={addStallDropdownRefSat}>
              <button
                type="button"
                disabled={isEditingMonthlyMode || newMonthlyCustomerType === 'Room'}
                onClick={() => {
                  setShowAddStallSelectSat(!showAddStallSelectSat);
                  setShowAddStallSelectWed(false);
                  setShowAddStallSelectSun(false);
                  setStallFilterSat('');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition-all flex items-center ${
                  isEditingMonthlyMode || newMonthlyCustomerType === 'Room'
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
                    const filtered = (stalls || []).filter(s => 
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

      {newMonthlyCustomerType !== 'Room' && newMonthlyDays.sun && (
        <div className="flex flex-wrap gap-2 items-center bg-red-50/40 p-2 rounded border border-red-100">
          <span className="w-12 font-bold text-red-700 shrink-0">วันอาทิตย์</span>
          <div className="flex-1 flex flex-wrap gap-1.5 items-center">
            {newMonthlyStallsSun.map((stName) => (
              <span key={stName} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2 py-0.5 rounded-md shadow-xs">
                {cleanStallName(stName)}
                <button
                  type="button"
                  disabled={isEditingMonthlyMode || newMonthlyCustomerType === 'Room'}
                  onClick={() => setNewMonthlyStallsSun(newMonthlyStallsSun.filter(s => s !== stName))}
                  className={`font-black ml-1 text-[10px] transition-colors ${
                    isEditingMonthlyMode || newMonthlyCustomerType === 'Room' ? 'text-gray-400 cursor-not-allowed' : 'text-amber-700 hover:text-red-700 cursor-pointer'
                  }`}
                  title={isEditingMonthlyMode || newMonthlyCustomerType === 'Room' ? "" : "ลบออก"}
                >
                  ✕
                </button>
              </span>
            ))}
            
            <div className="relative" ref={addStallDropdownRefSun}>
              <button
                type="button"
                disabled={isEditingMonthlyMode || newMonthlyCustomerType === 'Room'}
                onClick={() => {
                  setShowAddStallSelectSun(!showAddStallSelectSun);
                  setShowAddStallSelectWed(false);
                  setShowAddStallSelectSat(false);
                  setStallFilterSun('');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition-all flex items-center ${
                  isEditingMonthlyMode || newMonthlyCustomerType === 'Room'
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
                    const filtered = (stalls || []).filter(s => 
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
  );
}
