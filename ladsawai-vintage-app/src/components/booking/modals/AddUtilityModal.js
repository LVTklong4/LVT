'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Zap } from 'lucide-react';

export default function AddUtilityModal() {
  const {
    addUtilityMethod,    addUtilityPrice,    addUtilityUnit,    handleAddUtility,    parseNumber,    selectedBooking,    setAddUtilityMethod,    setAddUtilityPrice,    setAddUtilityUnit,    setShowAddUtilityModal,    showAddUtilityModal
  } = useBooking();

  if (!showAddUtilityModal && !selectedBooking) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border-2 border-yellow-600 overflow-hidden animate-pop-in">
            <div className="bg-yellow-600 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><Zap className="w-5 h-5" /> เพิ่มค่าใช้จ่ายสาธารณูปโภค (ค่าไฟ)</h3>
              <button onClick={() => setShowAddUtilityModal(false)} className="text-yellow-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">หน่วยไฟเพิ่มเติม</label>
                  <input
                    type="number"
                    value={addUtilityUnit}
                    onChange={(e) => {
                      const u = parseNumber(e.target.value);
                      setAddUtilityUnit(u);
                      setAddUtilityPrice(u * 10); // standard rate 10baht/unit
                    }}
                    className="p-2 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">ค่าไฟ (บาท)</label>
                  <input
                    type="number"
                    value={addUtilityPrice}
                    onChange={(e) => setAddUtilityPrice(parseNumber(e.target.value))}
                    className="p-2 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">วิธีการรับชำระ</label>
                <select
                  value={addUtilityMethod}
                  onChange={(e) => setAddUtilityMethod(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เงินสด">เงินสด</option>
                </select>
              </div>
              <button
                onClick={handleAddUtility}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold text-xs shadow transition-all mt-2"
              >
                บันทึกหน่วยไฟและออกใบเสร็จ
              </button>
            </div>
          </div>
        </div>
  );
}
