'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Sun, Printer } from 'lucide-react';

export default function MonthlyPrintModal() {
  const {
    cleanStallName,    handlePrintMonthlyReceipt,    monthlyPrintItem,    monthlyPrintMonth,    monthlyPrintPayments,    monthlyPrintProduct,    monthlyPrintSatCount,    monthlyPrintSunCount,    monthlyPrintTxnNo,    monthlyPrintWedCount,    parseNumber,    setMonthlyPrintMonth,    setMonthlyPrintPayments,    setMonthlyPrintProduct,    setMonthlyPrintSatCount,    setMonthlyPrintSunCount,    setMonthlyPrintTxnNo,    setMonthlyPrintWedCount,    setShowMonthlyPrintModal,    showMonthlyPrintModal,    stalls
  } = useBooking();

  if (!showMonthlyPrintModal && !monthlyPrintItem) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-md border-2 border-[#8B4513] overflow-hidden animate-pop-in">
            <div className="bg-[#5D4037] text-white px-4 py-3 flex justify-between items-center border-b border-[#8B4513]">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><Printer className="w-5 h-5" /> ตั้งค่าการพิมพ์ตั๋วรายเดือน</h3>
              <button onClick={() => setShowMonthlyPrintModal(false)} className="text-amber-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
              <div className="bg-[#F5E6D3] border border-[#D7CCC8] rounded p-2.5">
                <div className="font-bold text-[#3E2723]">ผู้เช่า: {monthlyPrintItem.booker_name}</div>
                <div className="text-gray-600 mt-0.5">ล็อก: {cleanStallName(monthlyPrintItem.stalls)} | ค่าเช่า: {monthlyPrintItem.total_price}.-</div>
              </div>

              {/* Month */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">ประจำเดือน (แสดงบนตั๋ว)</label>
                <input 
                  type="text"
                  value={monthlyPrintMonth}
                  onChange={(e) => setMonthlyPrintMonth(e.target.value)}
                  className="p-2 border rounded text-xs"
                  placeholder="เช่น มิถุนายน 2569"
                />
              </div>

              {/* Product */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">สินค้า (แสดงบนตั๋ว)</label>
                <input 
                  type="text"
                  value={monthlyPrintProduct}
                  onChange={(e) => setMonthlyPrintProduct(e.target.value)}
                  className="p-2 border rounded text-xs"
                  placeholder="เช่น เสื้อผ้าวินเทจ"
                />
              </div>

              {/* Doc No */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">เลขที่เอกสาร / TXN No.</label>
                <input 
                  type="text"
                  value={monthlyPrintTxnNo}
                  onChange={(e) => setMonthlyPrintTxnNo(e.target.value)}
                  className="p-2 border rounded font-mono text-xs"
                />
              </div>

              {/* Days Count */}
              <div className="border-t pt-2.5">
                <span className="font-bold text-gray-800 block mb-1.5">จำนวนวันค้าขายในเดือน (คำนวณสูตร):</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold">วันเสาร์ (วัน)</label>
                    <input 
                      type="number"
                      value={monthlyPrintSatCount}
                      onChange={(e) => setMonthlyPrintSatCount(parseNumber(e.target.value))}
                      className="p-2 border rounded text-center text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold">วันอาทิตย์ (วัน)</label>
                    <input 
                      type="number"
                      value={monthlyPrintSunCount}
                      onChange={(e) => setMonthlyPrintSunCount(parseNumber(e.target.value))}
                      className="p-2 border rounded text-center text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold">วันพุธ (วัน)</label>
                    <input 
                      type="number"
                      value={monthlyPrintWedCount}
                      onChange={(e) => setMonthlyPrintWedCount(parseNumber(e.target.value))}
                      className="p-2 border rounded text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Payments History List */}
              <div className="border-t pt-2.5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-gray-800">ประวัติการชำระเงิน:</span>
                  <button 
                    type="button"
                    onClick={() => setMonthlyPrintPayments([...monthlyPrintPayments, { id: Date.now().toString(), dateStr: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }), method: 'โอนจ่าย', amount: 0 }])}
                    className="text-amber-700 hover:text-amber-800 font-bold text-[10px] border border-amber-200 px-1.5 py-0.5 rounded bg-amber-50 cursor-pointer"
                  >
                    + เพิ่มประวัติ
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  {monthlyPrintPayments.map((p, idx) => (
                    <div key={p.id || idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                      <input 
                        type="text"
                        value={p.dateStr}
                        onChange={(e) => {
                          const updated = [...monthlyPrintPayments];
                          updated[idx].dateStr = e.target.value;
                          setMonthlyPrintPayments(updated);
                        }}
                        placeholder="วันชำระ"
                        className="p-1 border rounded w-24 text-center bg-white text-xs"
                      />
                      <select 
                        value={p.method}
                        onChange={(e) => {
                          const updated = [...monthlyPrintPayments];
                          updated[idx].method = e.target.value;
                          setMonthlyPrintPayments(updated);
                        }}
                        className="p-1 border rounded bg-white text-xs"
                      >
                        <option value="โอนจ่าย">โอนจ่าย</option>
                        <option value="เงินสด">เงินสด</option>
                      </select>
                      <input 
                        type="number"
                        value={p.amount}
                        onChange={(e) => {
                          const updated = [...monthlyPrintPayments];
                          updated[idx].amount = parseNumber(e.target.value);
                          setMonthlyPrintPayments(updated);
                        }}
                        placeholder="จำนวนเงิน"
                        className="p-1 border rounded w-20 text-center bg-white font-bold text-xs"
                      />
                      <button 
                        type="button"
                        onClick={() => setMonthlyPrintPayments(monthlyPrintPayments.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-700 font-bold px-1"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                  {monthlyPrintPayments.length === 0 && (
                    <div className="text-center text-gray-400 py-2">ไม่มีประวัติการชำระเงินที่ระบุ</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setShowMonthlyPrintModal(false)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded text-xs"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={handlePrintMonthlyReceipt}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded text-xs flex items-center gap-1 shadow cursor-pointer animate-pulse-subtle"
              >
                <Printer className="w-4 h-4" /> สั่งพิมพ์ (80mm)
              </button>
            </div>
          </div>
        </div>
  );
}
