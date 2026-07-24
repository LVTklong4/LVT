'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { X, Lock, CheckCircle2, AlertTriangle, RefreshCw, DollarSign, Calendar, FileText, Check, ShieldCheck, Wallet, Printer } from 'lucide-react';

export default function DailyClosingModal({ isOpen, onClose, defaultDate }) {
  const { fetchDailySummary, saveDailyClosing, loading } = useFinance();

  const [selectedDate, setSelectedDate] = useState(() => defaultDate || new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);

  // Form states for closing
  const [floatAmount, setFloatAmount] = useState('0');
  const [countedCash, setCountedCash] = useState('');
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load daily summary when date or modal state changes
  const loadData = useCallback(async (targetDate) => {
    const d = targetDate || selectedDate;
    if (!d) return;
    const res = await fetchDailySummary(d);
    if (res) {
      setSummary(res);
      if (res.existingClosing) {
        setFloatAmount(String(res.existingClosing.float_amount || '0'));
        setCountedCash(String(res.existingClosing.counted_cash || ''));
        setDiscrepancyNote(res.existingClosing.discrepancy_note || '');
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    }
  }, [selectedDate, fetchDailySummary]);

  useEffect(() => {
    if (isOpen) {
      const target = defaultDate || new Date().toISOString().split('T')[0];
      fetchDailySummary(target).then(res => {
        if (res) {
          setSummary(res);
          if (res.existingClosing) {
            setFloatAmount(String(res.existingClosing.float_amount || '0'));
            setCountedCash(String(res.existingClosing.counted_cash || ''));
            setDiscrepancyNote(res.existingClosing.discrepancy_note || '');
            setIsSaved(true);
          } else {
            setIsSaved(false);
          }
        }
      });
    }
  }, [isOpen, defaultDate, fetchDailySummary]);

  if (!isOpen) return null;

  // Calculations
  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const floatVal = parseNum(floatAmount);
  const cashIn = summary?.cashIn || 0;
  const cashOut = summary?.cashOut || 0;
  
  // Expected Cash = Opening Float + Cash In - Cash Out
  const expectedCashInDrawer = floatVal + cashIn - cashOut;

  // Counted Cash
  const countedCashVal = countedCash !== '' ? parseNum(countedCash) : null;

  // Shortage / Surplus = Counted Cash - Expected Cash
  const shortageSurplus = countedCashVal !== null ? countedCashVal - expectedCashInDrawer : 0;

  // Submission handler
  const handleSubmitClosing = async (e) => {
    e.preventDefault();
    if (countedCash === '') {
      alert('กรุณากรอกจำนวนเงินสดที่นับได้จริงปลายวัน');
      return;
    }

    const payload = {
      date: selectedDate,
      status: 'CLOSED',
      floatAmount: floatVal,
      countedCash: countedCashVal,
      cashShortageSurplus: shortageSurplus,
      discrepancyNote,
      summary,
      officer: 'Admin'
    };

    const res = await saveDailyClosing(payload);
    if (res.success) {
      setIsSaved(true);
      alert(`บันทึกปิดยอดประจำวันที่ ${selectedDate} เรียบร้อยแล้ว!`);
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกปิดยอด: ' + (res.error?.message || 'ข้อผิดพลาดระบบ'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border-2 border-emerald-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/50 rounded-lg">
              <Lock className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base leading-tight">
                สรุปและบันทึกปิดยอดประจำวัน (Daily Closing & Remittance)
              </h3>
              <p className="text-[10px] md:text-xs text-emerald-200 font-bold mt-0.5">
                กระทบยอดเงินสด เงินโอน คำนวณเงินทอน และตรวจสอบความถูกต้องทางการเงิน
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector & Status Header */}
        <div className="bg-amber-50/60 p-4 border-b border-amber-200/60 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="text-xs font-extrabold text-gray-700">เลือกวันที่ปิดยอด:</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-1.5 text-xs border border-amber-300 rounded-lg bg-white font-extrabold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            <button
              onClick={loadData}
              className="p-1.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors shadow cursor-pointer"
              title="คำนวณยอดใหม่"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="พิมพ์ใบนำส่งเงินประจำวัน"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบนำส่งเงิน</span>
            </button>

            {isSaved ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-300 text-green-800 rounded-full text-xs font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
                ปิดยอดเรียบร้อยแล้ว (CLOSED)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                ยังไม่ได้ลงบันทึกปิดยอด
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-6">
          
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 text-emerald-800 animate-spin" />
              <span className="text-xs font-bold text-emerald-900">กำลังคำนวณและกระทบยอดเงินสดประจำวัน...</span>
            </div>
          ) : summary ? (
            <>
              {/* Category Breakdown Table */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-800" /> 1. สรุปรายรับแยกตามหมวดหมู่ประจำวัน
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-emerald-800 text-white font-bold">
                      <tr>
                        <th className="p-2.5">หมวดหมู่รายรับ</th>
                        <th className="p-2.5 text-right">ยอดรวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white font-semibold text-gray-700">
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">🏷️ ค่าจองแผงรายวัน (Daily Stalls)</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-800">
                          {summary.dailyStallIncome.toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">📅 ค่างวดรายเดือนชำระในวัน (Monthly)</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-800">
                          {summary.monthlyIncome.toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">⛺ บัตรตั๋ว & ค่าไฟคลองถม (KlongThom)</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-800">
                          {summary.klongthomIncome.toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">📦 ค่าบริการฝากของ (Storage)</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-800">
                          {summary.storageIncome.toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">📥 รายรับอื่นๆ (Other Income)</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-800">
                          {summary.otherIncome.toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/50 font-black">
                        <td className="p-2.5 text-emerald-950">รวมรายรับทั้งหมด (Total Income)</td>
                        <td className="p-2.5 text-right text-emerald-950 font-black text-sm">
                          {summary.totalIncome.toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr className="bg-red-50/50 font-black text-red-950">
                        <td className="p-2.5">หัก: รายจ่ายประจำวัน (Total Expenses)</td>
                        <td className="p-2.5 text-right font-black text-sm">
                          -{summary.totalExpenses.toLocaleString()} ฿
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cash vs Transfer Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cash Summary */}
                <div className="bg-emerald-50/40 border-2 border-emerald-300/80 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-700" /> สรุปกระแสเงินสด (Cash Stream)
                  </span>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b pb-1.5">
                    <span>เงินสดรับรวม (Cash In):</span>
                    <span className="text-emerald-700">+{summary.cashIn.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b pb-1.5">
                    <span>เงินสดจ่ายรวม (Cash Out):</span>
                    <span className="text-red-600">-{summary.cashOut.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-emerald-950 pt-1">
                    <span>เงินสดสุทธิรับเข้า (Net Cash):</span>
                    <span className="text-sm font-black text-emerald-800">
                      {(summary.cashIn - summary.cashOut).toLocaleString()} ฿
                    </span>
                  </div>
                </div>

                {/* Transfer Summary */}
                <div className="bg-blue-50/40 border-2 border-blue-300/80 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-blue-700" /> สรุปเงินโอนธนาคาร (Bank Transfer)
                  </span>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b pb-1.5">
                    <span>เงินโอนรับรวม (Transfer In):</span>
                    <span className="text-blue-700">+{summary.transferIn.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b pb-1.5">
                    <span>เงินโอนจ่ายรวม (Transfer Out):</span>
                    <span className="text-red-600">-{summary.transferOut.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-blue-950 pt-1">
                    <span>เงินโอนสุทธิ (Net Transfer):</span>
                    <span className="text-sm font-black text-blue-800">
                      {(summary.transferIn - summary.transferOut).toLocaleString()} ฿
                    </span>
                  </div>
                </div>
              </div>

              {/* Float Money & Reconciliation Form */}
              <form onSubmit={handleSubmitClosing} className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-2 border-amber-300 rounded-xl p-5 flex flex-col gap-4">
                <h4 className="text-xs font-extrabold text-amber-950 border-b border-amber-200 pb-2 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-800" /> 2. การกระทบยอดเงินสดปลายวันและบันทึกเงินทอน
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Float Money */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-gray-700">
                      1. เงินทอนเริ่มต้น (Float Money)
                    </label>
                    <input 
                      type="number"
                      value={floatAmount}
                      onChange={(e) => setFloatAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="p-2 border border-amber-300 rounded-lg text-xs bg-white font-extrabold text-center text-gray-800 focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                    <span className="text-[9px] text-gray-400 font-semibold">ยอดเงินทอนที่มอบให้ประจำวัน</span>
                  </div>

                  {/* Expected Cash */}
                  <div className="flex flex-col gap-1 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-extrabold text-amber-900">
                      2. เงินสดที่ควรมีในลิ้นชัก
                    </span>
                    <strong className="text-base font-black text-amber-900 text-center my-auto">
                      {expectedCashInDrawer.toLocaleString()} ฿
                    </strong>
                    <span className="text-[9px] text-amber-700 text-center font-semibold">
                      (เงินทอน {floatVal.toLocaleString()} + สดรับ {cashIn.toLocaleString()} - สดจ่าย {cashOut.toLocaleString()})
                    </span>
                  </div>

                  {/* Counted Cash */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold text-emerald-950">
                      3. เงินสดที่นับได้จริง (Counted Cash) *
                    </label>
                    <input 
                      type="number"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="any"
                      required
                      className="p-2 border-2 border-emerald-600 rounded-lg text-xs bg-white font-black text-center text-emerald-900 focus:ring-2 focus:ring-emerald-500 shadow-xs text-sm"
                    />
                    <span className="text-[9px] text-gray-500 font-semibold">กรอกยอดเงินสดนับจริงปลายวัน</span>
                  </div>
                </div>

                {/* Discrepancy Status Card */}
                {countedCash !== '' && (
                  <div className={`p-3.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                    shortageSurplus === 0 
                      ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950'
                      : shortageSurplus < 0
                      ? 'bg-red-100/70 border-red-400 text-red-950'
                      : 'bg-blue-100/70 border-blue-400 text-blue-950'
                  }`}>
                    <div className="flex items-center gap-2">
                      {shortageSurplus === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      ) : shortageSurplus < 0 ? (
                        <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
                      ) : (
                        <Check className="w-5 h-5 text-blue-700 shrink-0" />
                      )}
                      <div>
                        <strong className="text-xs font-black block">
                          {shortageSurplus === 0 
                            ? 'ยอดเงินสดตรงกัน 100% (No Discrepancy)'
                            : shortageSurplus < 0
                            ? `⚠️ เงินสดขาดจำนวน (Shortage): ${Math.abs(shortageSurplus).toLocaleString()} บาท`
                            : `ℹ️ เงินสดเกินจำนวน (Surplus): +${shortageSurplus.toLocaleString()} บาท`
                          }
                        </strong>
                        <span className="text-[10px] font-semibold opacity-80">
                          {shortageSurplus === 0 ? 'ยอดเงินสดที่นับได้ตรงกับที่ระบบคำนวณพอดี' : 'รบกวนระบุสาเหตุเงินขาด/เกินในช่องหมายเหตุด้านล่าง'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-base md:text-lg font-black ${
                      shortageSurplus === 0 ? 'text-emerald-800' : shortageSurplus < 0 ? 'text-red-700' : 'text-blue-800'
                    }`}>
                      {shortageSurplus > 0 ? '+' : ''}{shortageSurplus.toLocaleString()} ฿
                    </span>
                  </div>
                )}

                {/* Discrepancy Note */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">หมายเหตุ / คำอธิบายการปิดยอด</label>
                  <textarea 
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    placeholder="เช่น ทอนเงินผิด 20 บาท หรือ โอนค่าบริการส่วนต่างเพิ่มเติม..."
                    rows={2}
                    className="p-2 border border-amber-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4 text-emerald-300" />}
                  <span>{isSaved ? 'อัปเดตบันทึกปิดยอดประจำวัน' : 'ยืนยันบันทึกปิดยอดประจำวัน (Submit Daily Closing)'}</span>
                </button>

              </form>
            </>
          ) : (
            <div className="py-12 text-center text-gray-400 font-bold text-xs">
              ไม่สามารถดึงข้อมูลสรุปการเงินของวันที่เลือกได้
            </div>
          )}

        </div>

      </div>

      {/* 🖨️ PRINTABLE REMITTANCE FORM A4 (Only visible during print) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 text-xs font-sans">
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
          <div>
            <h1 className="text-lg font-black uppercase tracking-wide">ตลาดนัดลาดสวายวินเทจ</h1>
            <h2 className="text-sm font-bold text-gray-800">ใบนำส่งเงินและสรุปการปิดยอดประจำวัน (Daily Remittance Form)</h2>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-sm">วันที่: {selectedDate}</p>
            <p className="text-[10px] text-gray-600">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
          </div>
        </div>

        {summary && (
          <div className="flex flex-col gap-4">
            {/* Revenue Summary Table */}
            <div>
              <h3 className="font-bold border-b pb-1 mb-2">1. สรุปรายรับแยกตามประเภท</h3>
              <table className="w-full text-left border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-300">
                    <th className="p-1.5 border-r border-gray-300">รายการ</th>
                    <th className="p-1.5 text-right">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 border-r border-gray-200">ค่าจองแผงรายวัน</td>
                    <td className="p-1.5 text-right font-bold">{summary.dailyStallIncome.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 border-r border-gray-200">ค่างวดรายเดือน (ชำระในวัน)</td>
                    <td className="p-1.5 text-right font-bold">{summary.monthlyIncome.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 border-r border-gray-200">บัตรตั๋ว & ค่าไฟคลองถม</td>
                    <td className="p-1.5 text-right font-bold">{summary.klongthomIncome.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 border-r border-gray-200">ค่าบริการฝากของ (Storage)</td>
                    <td className="p-1.5 text-right font-bold">{summary.storageIncome.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 border-r border-gray-200">รายรับอื่นๆ</td>
                    <td className="p-1.5 text-right font-bold">{summary.otherIncome.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-black font-black bg-gray-50">
                    <td className="p-1.5 border-r border-gray-300">รวมรายรับทั้งหมด</td>
                    <td className="p-1.5 text-right font-black">{summary.totalIncome.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-black font-bold text-red-700">
                    <td className="p-1.5 border-r border-gray-300">หัก: รายจ่ายประจำวัน</td>
                    <td className="p-1.5 text-right font-bold">-{summary.totalExpenses.toLocaleString()} ฿</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Remittance & Cash Count Table */}
            <div>
              <h3 className="font-bold border-b pb-1 mb-2">2. ตารางกระทบยอดเงินสดนำส่งจริง</h3>
              <table className="w-full text-left border-collapse border border-gray-300">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 font-bold border-r border-gray-300 bg-gray-50">เงินทอนเริ่มต้น (Float Money)</td>
                    <td className="p-1.5 text-right font-bold">{floatVal.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 font-bold border-r border-gray-300 bg-gray-50">เงินสดรับรวม (Cash In)</td>
                    <td className="p-1.5 text-right font-bold text-green-700">+{cashIn.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1.5 font-bold border-r border-gray-300 bg-gray-50">เงินสดจ่ายรวม (Cash Out)</td>
                    <td className="p-1.5 text-right font-bold text-red-700">-{cashOut.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-300 font-bold bg-gray-100">
                    <td className="p-1.5 border-r border-gray-300">เงินสดที่ควรมีในลิ้นชัก (Expected Cash)</td>
                    <td className="p-1.5 text-right font-black">{expectedCashInDrawer.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b-2 border-black font-black bg-emerald-50">
                    <td className="p-2 border-r border-gray-300 text-sm">ยอดเงินสดนับนำส่งจริง (Counted Cash Remitted)</td>
                    <td className="p-2 text-right font-black text-base">
                      {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300 font-bold">
                    <td className="p-1.5 border-r border-gray-300">ผลต่างเงินขาด / เงินเกิน (Shortage / Surplus)</td>
                    <td className="p-1.5 text-right font-bold">
                      {shortageSurplus > 0 ? '+' : ''}{shortageSurplus.toLocaleString()} ฿
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {discrepancyNote && (
              <div className="border border-gray-300 p-2 rounded">
                <span className="font-bold">หมายเหตุ: </span> {discrepancyNote}
              </div>
            )}

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-gray-300">
              <div className="flex flex-col items-center gap-12 text-center">
                <p className="font-bold">ลงชื่อเจ้าหน้าที่ผู้นำส่งเงิน</p>
                <div className="w-48 border-b border-black"></div>
                <p className="text-[10px]">( ................................................................ )</p>
                <p className="text-[10px] text-gray-500">วันที่ .......... / .......... / ................</p>
              </div>

              <div className="flex flex-col items-center gap-12 text-center">
                <p className="font-bold">ลงชื่อฝ่ายบัญชี / ผู้รับมอบเงินสด</p>
                <div className="w-48 border-b border-black"></div>
                <p className="text-[10px]">( ................................................................ )</p>
                <p className="text-[10px] text-gray-500">วันที่ .......... / .......... / ................</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
