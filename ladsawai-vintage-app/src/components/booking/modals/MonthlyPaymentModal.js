'use client';

import React, { useMemo } from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { CreditCard, Banknote, Tag, Loader2, X, AlertTriangle } from 'lucide-react';
import { findEarlierUnpaidContracts } from '@/services/monthly/monthlyPaymentService';
import { formatBookingMonth } from '@/utils/thaiDateHelper';
import { cleanStallName } from '@/utils/numberHelper';

export default function MonthlyPaymentModal() {
  const {
    activeMonthlyBooking,
    handleMonthlyPaymentSubmit,
    handleSlipChange,
    monthlyPaymentForm,
    note,
    parseNumber,
    setMonthlyPaymentForm,
    setShowMonthlyPaymentModal,
    setSlipPreviewUrl,
    setFullScreenSlipUrl,
    showMonthlyPaymentModal,
    slipPreviewUrl,
    loadingMonthly,
    monthlyList
  } = useMonthlyBooking();

  const earlierDebts = useMemo(() => {
    return findEarlierUnpaidContracts(activeMonthlyBooking, monthlyList);
  }, [activeMonthlyBooking, monthlyList]);

  if (!showMonthlyPaymentModal || !activeMonthlyBooking) return null;

  const isRoom = activeMonthlyBooking?.customer_type === 'Room';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden animate-pop-in flex flex-col p-6 gap-3.5 relative">
        
        {/* Full overlay loading & click blocker during payment submission */}
        {loadingMonthly && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-4 select-none">
            <div className="p-3 bg-green-50 border border-green-200 rounded-full shadow-sm">
              <Loader2 className="w-8 h-8 text-green-700 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-gray-800">กำลังบันทึกข้อมูลการชำระเงิน...</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">ระบบกำลังประมวลผลธุรกรรม กรุณารอสักครู่</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center shrink-0 border-b pb-2.5">
          <div>
            <h3 className="font-bold text-base text-gray-800">บันทึกการชำระเงิน</h3>
            {activeMonthlyBooking?.booker_name && (
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                ผู้เช่า: <span className="text-[#8B4513] font-bold">{activeMonthlyBooking.booker_name}</span>
                {activeMonthlyBooking.stalls && <span> | ล็อค: <span className="text-[#8B4513] font-bold">{cleanStallName(activeMonthlyBooking.stalls) || '-'}</span></span>}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={loadingMonthly}
            onClick={() => {
              if (!loadingMonthly) setShowMonthlyPaymentModal(false);
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (loadingMonthly) return;
            handleMonthlyPaymentSubmit(e);
          }} 
          className="flex flex-col gap-3.5 overflow-y-auto pr-1"
        >
          {earlierDebts.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>แจ้งเตือน: พบยอดค้างชำระเดือนก่อนหน้า</span>
              </div>
              <div className="flex flex-col gap-1 pl-5 text-[11px] text-amber-800">
                {earlierDebts.map(d => {
                  const rem = d.remaining !== undefined ? d.remaining : Math.max(0, parseNumber(d.total_price || 0) - parseNumber(d.paid_amount || 0));
                  return (
                    <div key={d.id} className="flex justify-between items-center bg-amber-100/60 px-2 py-1 rounded-md">
                      <span>รอบ {formatBookingMonth(d.booking_month)} (ล็อค {cleanStallName(d.stalls) || '-'})</span>
                      <span className="font-extrabold text-red-600">ค้าง {rem.toLocaleString()} บ.</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* วันที่ชำระเงิน */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">วันที่ชำระเงิน</label>
            <input 
              type="date"
              disabled={loadingMonthly}
              value={monthlyPaymentForm.date}
              onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              required
            />
          </div>

          {/* ยอดเต็ม & ค้างชำระ Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex flex-col gap-2.5">
            <div className="flex justify-between font-bold">
              <span>{isRoom ? 'ค่าเช่าห้องหลัก' : 'ยอดเต็ม'}: {parseNumber(activeMonthlyBooking.total_price || 0).toLocaleString()}.-</span>
              <span className="text-red-600">ค้างชำระ: {(parseNumber(activeMonthlyBooking.total_price || 0) - parseNumber(activeMonthlyBooking.paid_amount || 0)).toLocaleString()}.-</span>
            </div>
            
            <div className="border-t border-dashed border-blue-200/60 my-0.5"></div>
            
            {/* ตัวช่วยคำนวณ */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-center text-gray-500">
                {isRoom ? 'ตัวช่วยคำนวณค่าเช่าห้อง' : 'ตัวช่วยคำนวณยอดชำระ'}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 75, 100].map((pct) => {
                  const total = parseNumber(activeMonthlyBooking.total_price || 0);
                  const paid = parseNumber(activeMonthlyBooking.paid_amount || 0);
                  const remaining = Math.max(0, total - paid);
                  const isClose = pct === 100;
                  const rawVal = isClose ? remaining : (total * (pct / 100));
                  const val = isNaN(rawVal) ? 0 : Math.max(0, rawVal);
                  
                  const targetAmt = isRoom ? parseNumber(monthlyPaymentForm?.rent_amt) : parseNumber(monthlyPaymentForm?.amount);
                  const isActive = isClose ? (targetAmt === remaining && remaining > 0) : (targetAmt === val && val > 0);

                  return (
                    <button
                      key={pct}
                      type="button"
                      disabled={loadingMonthly}
                      onClick={() => {
                        const safeVal = Math.round(val * 100) / 100;
                        if (isRoom) {
                          setMonthlyPaymentForm(prev => {
                            const newRent = String(safeVal);
                            const totalSum = safeVal + parseNumber(prev.elec_amt) + parseNumber(prev.water_amt);
                            return {
                              ...prev,
                              rent_amt: newRent,
                              amount: String(Math.round(totalSum * 100) / 100)
                            };
                          });
                        } else {
                          setMonthlyPaymentForm(prev => ({
                            ...prev,
                            amount: String(safeVal)
                          }));
                        }
                      }}
                      className={`flex flex-col items-center justify-center py-1 border rounded-lg transition-all ${
                        isActive 
                          ? 'border-blue-600 bg-blue-100/50 text-blue-800 font-bold shadow-xs' 
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      } disabled:opacity-50 disabled:pointer-events-none`}
                    >
                      <span className="text-[10px] font-bold">{isClose ? 'ปิดยอด' : `${pct}%`}</span>
                      <span className={`text-[9px] ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                        {(isNaN(val) ? 0 : val).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ฟอร์มกรอกจำนวนเงิน (แยก UI ห้องเช่า vs แผงค้ารายเดือน) */}
          {isRoom ? (
            <div className="flex flex-col gap-2.5 bg-blue-50/40 p-3 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-1.5">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <span>🏠</span> แจกแจงยอดชำระห้องเช่า
                </span>
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/60 px-1.5 py-0.5 rounded">
                  ระบุยอดเงิน (บาท)
                </span>
              </div>

              {/* 1. ค่าเช่าห้อง */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                  <span>🏠 ค่าเช่าห้อง (บาท)</span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    ค้างชำระ: {Math.max(0, parseNumber(activeMonthlyBooking.total_price || 0) - parseNumber(activeMonthlyBooking.paid_amount || 0)).toLocaleString()}.-
                  </span>
                </div>
                <input 
                  type="number" 
                  step="any"
                  disabled={loadingMonthly}
                  value={monthlyPaymentForm.rent_amt ?? ''} 
                  onChange={(e) => {
                    const rentInput = e.target.value;
                    const r = parseNumber(rentInput);
                    const el = parseNumber(monthlyPaymentForm.elec_amt);
                    const wt = parseNumber(monthlyPaymentForm.water_amt);
                    const totalSum = r + el + wt;
                    setMonthlyPaymentForm(prev => ({
                      ...prev,
                      rent_amt: rentInput,
                      amount: String(Math.round(totalSum * 100) / 100)
                    }));
                  }}
                  placeholder="0.00"
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-right text-base font-bold text-blue-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {/* 2. ค่าไฟ & ค่าน้ำ 2 คอลัมน์ */}
              <div className="grid grid-cols-2 gap-2">
                {/* ค่าไฟ */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <span>⚡ ค่าไฟฟ้า (บาท)</span>
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    disabled={loadingMonthly}
                    value={monthlyPaymentForm.elec_amt ?? ''} 
                    onChange={(e) => {
                      const elecInput = e.target.value;
                      const r = parseNumber(monthlyPaymentForm.rent_amt);
                      const el = parseNumber(elecInput);
                      const wt = parseNumber(monthlyPaymentForm.water_amt);
                      const totalSum = r + el + wt;
                      setMonthlyPaymentForm(prev => ({
                        ...prev,
                        elec_amt: elecInput,
                        amount: String(Math.round(totalSum * 100) / 100)
                      }));
                    }}
                    placeholder="0.00"
                    className="w-full py-2 px-2.5 border border-amber-200 rounded-lg text-right text-sm font-bold text-amber-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  />
                </div>

                {/* ค่าน้ำ */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-cyan-900 flex items-center gap-1">
                    <span>💧 ค่าน้ำประปา (บาท)</span>
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    disabled={loadingMonthly}
                    value={monthlyPaymentForm.water_amt ?? ''} 
                    onChange={(e) => {
                      const waterInput = e.target.value;
                      const r = parseNumber(monthlyPaymentForm.rent_amt);
                      const el = parseNumber(monthlyPaymentForm.elec_amt);
                      const wt = parseNumber(waterInput);
                      const totalSum = r + el + wt;
                      setMonthlyPaymentForm(prev => ({
                        ...prev,
                        water_amt: waterInput,
                        amount: String(Math.round(totalSum * 100) / 100)
                      }));
                    }}
                    placeholder="0.00"
                    className="w-full py-2 px-2.5 border border-cyan-200 rounded-lg text-right text-sm font-bold text-cyan-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* สรุปยอดรวมที่ต้องรับเงินจริง */}
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between mt-0.5 shadow-2xs">
                <span className="text-xs font-bold text-emerald-900">💵 ยอดรวมชำระทั้งสิ้น:</span>
                <span className="text-xl font-black text-emerald-800">
                  {(parseNumber(monthlyPaymentForm.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.-
                </span>
              </div>
            </div>
          ) : (
            /* ยอดชำระ (บาท) สำหรับแผงค้ารายเดือนทั่วไป */
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">ยอดชำระ (บาท)</label>
              <input 
                type="number" 
                step="any"
                disabled={loadingMonthly}
                value={monthlyPaymentForm.amount} 
                onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, amount: e.target.value })}
                placeholder="0.00"
                className="w-full py-3 border border-green-200 rounded-xl text-center text-2xl font-extrabold text-green-800 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-400 disabled:opacity-50"
                required
              />
            </div>
          )}

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
                    disabled={loadingMonthly}
                    onClick={() => {
                      if (m.value !== 'โอนจ่าย') {
                        setSlipPreviewUrl(null);
                        setMonthlyPaymentForm({ ...monthlyPaymentForm, method: m.value, slip_base64: null });
                      } else {
                        setMonthlyPaymentForm({ ...monthlyPaymentForm, method: m.value });
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 border rounded-lg transition-all text-xs font-bold cursor-pointer ${
                      isActive ? m.activeClass + ' border-2 shadow-xs' : m.inactiveClass
                    } disabled:opacity-50 disabled:pointer-events-none`}
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={loadingMonthly}
                      onClick={() => setFullScreenSlipUrl(slipPreviewUrl)}
                      className="text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50"
                    >
                      ดูรูปใหญ่
                    </button>
                    <button
                      type="button"
                      disabled={loadingMonthly}
                      onClick={() => {
                        setSlipPreviewUrl(null);
                        setMonthlyPaymentForm(prev => ({ ...prev, slip_base64: null }));
                      }}
                      className="text-red-500 hover:text-red-700 font-bold disabled:opacity-50"
                    >
                      ลบรูป
                    </button>
                  </div>
                )}
              </label>
              <div className="relative border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white rounded-lg p-2 transition-colors">
                <input 
                  type="file" 
                  accept="image/*"
                  disabled={loadingMonthly}
                  onChange={handleSlipChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 disabled:pointer-events-none"
                />
                {slipPreviewUrl ? (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <img 
                      src={slipPreviewUrl} 
                      alt="Slip Preview" 
                      className="h-28 w-auto object-contain rounded-md shadow border border-gray-200 relative z-20 cursor-pointer hover:opacity-80 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullScreenSlipUrl(slipPreviewUrl);
                      }}
                    />
                    <span className="text-[10px] text-gray-500 font-semibold">อัปโหลดสลิปเรียบร้อย (คลิกเพื่อดูรูปใหญ่)</span>
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
              disabled={loadingMonthly}
              value={monthlyPaymentForm.note} 
              onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, note: e.target.value })}
              placeholder="กรอกรายละเอียดเพิ่มเติม..."
              rows="2"
              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-3 shrink-0">
            <button 
              type="button" 
              disabled={loadingMonthly}
              onClick={() => setShowMonthlyPaymentModal(false)}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={loadingMonthly}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingMonthly ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                'บันทึก'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
