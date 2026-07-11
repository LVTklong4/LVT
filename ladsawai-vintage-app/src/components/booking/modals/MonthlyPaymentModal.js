'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { CreditCard, Banknote, Tag } from 'lucide-react';

export default function MonthlyPaymentModal() {
  const {
    activeMonthlyBooking,    handleMonthlyPaymentSubmit,    handleSlipChange,    monthlyPaymentForm,    note,    parseNumber,    setMonthlyPaymentForm,    setShowMonthlyPaymentModal,    setSlipPreviewUrl,    showMonthlyPaymentModal,    slipPreviewUrl
  } = useBooking();

  if (!showMonthlyPaymentModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden animate-pop-in flex flex-col p-6 gap-4">
              <h3 className="font-bold text-lg text-center text-gray-800 shrink-0">บันทึกการชำระเงิน</h3>
              
              <form onSubmit={handleMonthlyPaymentSubmit} className="flex flex-col gap-3.5 overflow-y-auto pr-1">
                {/* วันที่ชำระเงิน */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">วันที่ชำระเงิน</label>
                  <input 
                    type="date"
                    value={monthlyPaymentForm.date}
                    onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* ยอดเต็ม & ค้างชำระ Card */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex flex-col gap-2.5">
                  <div className="flex justify-between font-bold">
                    <span>ยอดเต็ม: {parseNumber(activeMonthlyBooking.total_price || 0).toLocaleString()}.-</span>
                    <span className="text-red-600">ค้างชำระ: {(parseNumber(activeMonthlyBooking.total_price || 0) - parseNumber(activeMonthlyBooking.paid_amount || 0)).toLocaleString()}.-</span>
                  </div>
                  
                  <div className="border-t border-dashed border-blue-200/60 my-0.5"></div>
                  
                  {/* ตัวช่วยคำนวณ */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-center text-gray-500">ตัวช่วยคำนวณยอดชำระ</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[25, 50, 75, 100].map((pct) => {
                        const total = parseNumber(activeMonthlyBooking.total_price || 0);
                        const remaining = total - parseNumber(activeMonthlyBooking.paid_amount || 0);
                        const isClose = pct === 100;
                        const val = isClose ? (remaining > 0 ? remaining : 0) : (total * (pct / 100));
                        
                        const formAmt = parseNumber(monthlyPaymentForm.amount);
                        const isActive = isClose ? (formAmt === remaining) : (formAmt === val);

                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setMonthlyPaymentForm({
                                ...monthlyPaymentForm,
                                amount: String(Math.round(val * 100) / 100)
                              });
                            }}
                            className={`flex flex-col items-center justify-center py-1 border rounded-lg transition-all ${
                              isActive 
                                ? 'border-blue-600 bg-blue-100/50 text-blue-800 font-bold shadow-xs' 
                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className="text-[10px] font-bold">{isClose ? 'ปิดยอด' : `${pct}%`}</span>
                            <span className={`text-[9px] ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ยอดชำระ (บาท) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">ยอดชำระ (บาท)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={monthlyPaymentForm.amount} 
                    onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full py-3 border border-green-200 rounded-xl text-center text-2xl font-extrabold text-green-800 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-400"
                    required
                  />
                </div>

                {/* ประเภทการบันทึก */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">ประเภทการบันทึก</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'เงินสด', label: 'เงินสด', icon: <Banknote className="w-4 h-4" />, activeClass: 'border-green-600 text-green-700 bg-green-50/50', inactiveClass: 'border-gray-200 text-gray-700 hover:bg-gray-50' },
                      { value: 'โอนจ่าย', label: 'โอนจ่าย', icon: <CreditCard className="w-4 h-4" />, activeClass: 'border-blue-600 text-blue-700 bg-blue-50/50', inactiveClass: 'border-gray-200 text-gray-700 hover:bg-gray-50' },
                      { value: 'ส่วนลด', label: 'ส่วนลด', icon: <Tag className="w-4 h-4" />, activeClass: 'border-amber-600 text-amber-700 bg-amber-50/50', inactiveClass: 'border-gray-200 text-gray-700 hover:bg-gray-50' }
                    ].map((m) => {
                      const isActive = monthlyPaymentForm.method === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMonthlyPaymentForm({ ...monthlyPaymentForm, method: m.value })}
                          className={`flex items-center justify-center gap-1.5 py-2 border rounded-lg transition-all text-xs font-bold cursor-pointer ${
                            isActive ? m.activeClass + ' border-2 shadow-xs' : m.inactiveClass
                          }`}
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {monthlyPaymentForm.method === 'โอนจ่าย' && (
                  <div className="flex flex-col gap-1.5 p-3 bg-blue-50/30 rounded-xl border border-blue-100/60 text-left text-xs">
                    <label className="text-xs font-bold text-blue-900 flex justify-between">
                      <span>แนบภาพสลิปโอนเงิน (สแกนอัตโนมัติ)</span>
                      {slipPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlipPreviewUrl(null);
                            setMonthlyPaymentForm(prev => ({ ...prev, slip_base64: null }));
                          }}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ลบรูป
                        </button>
                      )}
                    </label>
                    <div className="relative border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white rounded-lg p-2 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      {slipPreviewUrl ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <img src={slipPreviewUrl} alt="Slip Preview" className="h-28 w-auto object-contain rounded-md shadow border border-gray-200" />
                          <span className="text-[10px] text-gray-500 font-semibold">อัปโหลดสลิปเรียบร้อย</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 py-3 text-blue-500/80">
                          <CreditCard className="w-6 h-6 animate-pulse" />
                          <span className="text-[10px] font-bold">คลิกเพื่ออัปโหลดไฟล์สลิป</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* โน้ต / หมายเหตุ */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">โน้ต / หมายเหตุ</label>
                  <textarea 
                    value={monthlyPaymentForm.note} 
                    onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, note: e.target.value })}
                    placeholder="กรอกรายละเอียดเพิ่มเติม..."
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-3 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setShowMonthlyPaymentModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
}
