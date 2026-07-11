'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X } from 'lucide-react';

export default function EditMonthlyModal() {
  const {
    cleanStallName,    handleUpdateMonthlyItem,    note,    selectedMonthlyItem,    setSelectedMonthlyItem,    stalls
  } = useBooking();

  if (!selectedMonthlyItem) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-md border-2 border-[#8B4513] overflow-hidden animate-pop-in">
              <div className="bg-[#5D4037] text-white px-4 py-3 flex justify-between items-center border-b border-[#8B4513]">
                <h3 className="font-bold text-sm flex items-center gap-1.5">แก้ไขข้อมูลรายเดือน: {selectedMonthlyItem.booker_name}</h3>
                <button onClick={() => setSelectedMonthlyItem(null)} className="text-amber-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleUpdateMonthlyItem} className="p-5 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold">ล็อกที่เช่า</span>
                  <span className="text-xs font-bold text-gray-800 bg-white p-2.5 rounded border">{cleanStallName(selectedMonthlyItem.stalls)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold">ค่าเช่าทั้งหมด</span>
                    <span className="text-xs font-bold text-gray-800 bg-white p-2.5 rounded border text-center">{selectedMonthlyItem.total_price.toLocaleString()}.-</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">ยอดที่จ่ายแล้ว (บาท)</label>
                    <input 
                      type="number" 
                      value={selectedMonthlyItem.paid_amount || 0} 
                      onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, paid_amount: e.target.value })}
                      className="p-1.5 border border-[#8B4513]/40 rounded text-xs bg-white text-center font-bold" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">สถานะชำระเงิน</label>
                  <select 
                    value={selectedMonthlyItem.status} 
                    onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, status: e.target.value })}
                    className="p-1.5 border border-[#8B4513]/40 rounded text-xs bg-white focus:outline-none font-bold"
                  >
                    <option value="ชำระแล้ว">ชำระแล้ว (Paid)</option>
                    <option value="ค้างชำระ">ค้างชำระ (Unpaid)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">สถานะต่อสัญญา</label>
                  <select 
                    value={selectedMonthlyItem.renewal_status || ''} 
                    onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, renewal_status: e.target.value })}
                    className="p-1.5 border border-[#8B4513]/40 rounded text-xs bg-white focus:outline-none font-bold"
                  >
                    <option value="ต่อสัญญาแล้ว">ต่อสัญญาแล้ว</option>
                    <option value="รอยืนยัน">รอยืนยัน</option>
                    <option value="ไม่ต่อสัญญา">ไม่ต่อสัญญา</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">หมายเหตุ</label>
                  <textarea 
                    value={selectedMonthlyItem.note || ''} 
                    onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, note: e.target.value })}
                    rows="2"
                    className="p-1.5 border border-[#8B4513]/40 rounded text-xs bg-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    บันทึกข้อมูล
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedMonthlyItem(null)}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-all"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
}
