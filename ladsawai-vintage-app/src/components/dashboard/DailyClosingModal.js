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

  // Denominations state
  const [denominations, setDenominations] = useState({
    b1000: '',
    b500: '',
    b100: '',
    b50: '',
    b20: '',
    coins: ''
  });

  const handleDenomChange = (field, val) => {
    const next = { ...denominations, [field]: val };
    setDenominations(next);

    const sum = 
      (parseNum(next.b1000) * 1000) +
      (parseNum(next.b500) * 500) +
      (parseNum(next.b100) * 100) +
      (parseNum(next.b50) * 50) +
      (parseNum(next.b20) * 20) +
      parseNum(next.coins);

    setCountedCash(sum > 0 || val !== '' ? String(sum) : '');
  };

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
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white/10 rounded-lg p-1 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm md:text-base leading-tight">
                สรุปและบันทึกปิดยอดประจำวัน (Daily Closing & Remittance)
              </h3>
              <p className="text-[10px] md:text-xs text-emerald-200 font-bold mt-0.5">
                กระทบยอดเงินสด เงินโอน คำนวณเงินทอน และออกใบนำส่งเงินประจำวัน
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
                        <th className="p-2.5 text-right bg-emerald-900/40">💵 เงินสด</th>
                        <th className="p-2.5 text-right bg-blue-900/40">💳 โอนเงิน</th>
                        <th className="p-2.5 text-right bg-emerald-950/60 font-black">ยอดรวมสุทธิ (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white font-semibold text-gray-700">
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">🏷️ ค่าจองแผงรายวัน (Daily Stalls)</td>
                        <td className="p-2.5 text-right text-emerald-700">
                          {(summary.breakdown?.dailyStall?.cash ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-blue-700">
                          {(summary.breakdown?.dailyStall?.transfer ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-900">
                          {(summary.breakdown?.dailyStall?.total ?? summary.dailyStallIncome ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">📅 ค่างวดรายเดือนชำระในวัน (Monthly)</td>
                        <td className="p-2.5 text-right text-emerald-700">
                          {(summary.breakdown?.monthly?.cash ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-blue-700">
                          {(summary.breakdown?.monthly?.transfer ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-900">
                          {(summary.breakdown?.monthly?.total ?? summary.monthlyIncome ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">⛺ บัตรตั๋ว & ค่าไฟคลองถม (KlongThom)</td>
                        <td className="p-2.5 text-right text-emerald-700">
                          {(summary.breakdown?.klongthom?.cash ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-blue-700">
                          {(summary.breakdown?.klongthom?.transfer ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-900">
                          {(summary.breakdown?.klongthom?.total ?? summary.klongthomIncome ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">📦 ค่าบริการฝากของ (Storage)</td>
                        <td className="p-2.5 text-right text-emerald-700">
                          {(summary.breakdown?.storage?.cash ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-blue-700">
                          {(summary.breakdown?.storage?.transfer ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-900">
                          {(summary.breakdown?.storage?.total ?? summary.storageIncome ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 flex items-center gap-1.5">📥 รายรับอื่นๆ (Other Income)</td>
                        <td className="p-2.5 text-right text-emerald-700">
                          {(summary.breakdown?.otherIncome?.cash ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-blue-700">
                          {(summary.breakdown?.otherIncome?.transfer ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-900">
                          {(summary.breakdown?.otherIncome?.total ?? summary.otherIncome ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/70 font-black">
                        <td className="p-2.5 text-emerald-950">รวมรายรับทั้งหมด (Total Income)</td>
                        <td className="p-2.5 text-right text-emerald-800 font-extrabold">
                          {(summary.breakdown?.totalIncome?.cash ?? summary.cashIn ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-blue-800 font-extrabold">
                          {(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-emerald-950 font-black text-sm">
                          {(summary.breakdown?.totalIncome?.total ?? summary.totalIncome ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                      <tr className="bg-red-50/60 font-black text-red-950">
                        <td className="p-2.5">หัก: รายจ่ายประจำวัน (Total Expenses)</td>
                        <td className="p-2.5 text-right text-red-700 font-bold">
                          -{(summary.breakdown?.expenses?.cash ?? summary.cashOut ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-red-700 font-bold">
                          -{(summary.breakdown?.expenses?.transfer ?? summary.transferOut ?? 0).toLocaleString()} ฿
                        </td>
                        <td className="p-2.5 text-right text-red-950 font-black text-sm">
                          -{(summary.breakdown?.expenses?.total ?? summary.totalExpenses ?? 0).toLocaleString()} ฿
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Expense Itemization (if any) */}
              {summary.expenseItems && summary.expenseItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-extrabold text-red-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      📤 รายการรายจ่ายประจำวัน ({summary.expenseItems.length} รายการ)
                    </span>
                    <span className="text-xs font-black text-red-700">
                      รวม -{summary.totalExpenses.toLocaleString()} ฿
                    </span>
                  </h4>
                  <div className="border border-red-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-red-800 text-white font-bold">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">รายการ / คำอธิบาย</th>
                          <th className="p-2">หมวดหมู่</th>
                          <th className="p-2 text-center">ช่องทาง</th>
                          <th className="p-2 text-right">จำนวนเงิน (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100 bg-white font-medium text-gray-700">
                        {summary.expenseItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-red-50/30">
                            <td className="p-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                            <td className="p-2 font-bold text-gray-800">{item.description}</td>
                            <td className="p-2 text-gray-500">{item.category}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.method === 'เงินสด' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.method}
                              </span>
                            </td>
                            <td className="p-2 text-right font-black text-red-700">
                              -{item.amount.toLocaleString()} ฿
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                  <Lock className="w-4 h-4 text-amber-800" /> 2. การกระทบยอดเงินสดปลายวันและตรวจนับธนบัตร
                </h4>

                {/* Denomination Counter Card */}
                <div className="bg-white/90 p-3.5 border border-amber-300 rounded-xl flex flex-col gap-2 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200 pb-1.5 gap-1">
                    <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                      💵 ตารางตรวจนับธนบัตรและเหรียญ (Cash Denomination Sheet)
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      กรอกจำนวนฉบับ ระบบคำนวณเงินสดนับได้ให้อัตโนมัติ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                    {[
                      { key: 'b1000', label: '1,000 ฿', mult: 1000 },
                      { key: 'b500', label: '500 ฿', mult: 500 },
                      { key: 'b100', label: '100 ฿', mult: 100 },
                      { key: 'b50', label: '50 ฿', mult: 50 },
                      { key: 'b20', label: '20 ฿', mult: 20 },
                      { key: 'coins', label: 'เหรียญรวม', mult: 1, isCoin: true }
                    ].map((d) => (
                      <div key={d.key} className="flex flex-col gap-1 bg-amber-50/50 p-2 rounded-lg border border-amber-200/70">
                        <div className="flex justify-between items-center text-[10px] font-bold text-amber-900">
                          <span>{d.label}</span>
                          <span className="text-[9px] text-gray-400">{d.isCoin ? 'บาท' : 'ใบ'}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={denominations[d.key]}
                          onChange={(e) => handleDenomChange(d.key, e.target.value)}
                          placeholder="0"
                          className="p-1.5 border border-amber-300 rounded text-center text-xs bg-white font-bold text-gray-800 focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-[9px] text-right text-amber-800 font-semibold truncate">
                          {((parseNum(denominations[d.key]) * d.mult) || 0).toLocaleString()} ฿
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

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
                    <span className="text-[9px] text-gray-500 font-semibold">ยอดรวมจากตารางนับ หรือ พิมพ์แก้ไขตรงนี้</span>
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
      <div className="hidden print:block fixed inset-0 bg-white text-black p-6 text-[11px] font-sans">
        {/* Header with Title & Metadata */}
        <div className="flex justify-between items-start border-b-2 border-black pb-2.5 mb-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain shrink-0" />
            <div>
              <h1 className="text-base font-black uppercase tracking-wide leading-tight">ตลาดนัดลาดสวายวินเทจ</h1>
              <h2 className="text-xs font-bold text-gray-800 leading-tight mt-0.5">
                ใบนำส่งเงินและสรุปการปิดยอดประจำวัน (Daily Cash Settlement & Remittance Form)
              </h2>
              <p className="text-[10px] text-gray-600 mt-0.5">
                ระบบควบคุมการเงินและการตรวจนับเงินสดประจำวัน (Dual Control Remittance)
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] leading-tight">
            <p><span className="font-bold">วันที่ปิดยอด:</span> <span className="font-black text-xs">{selectedDate}</span></p>
            <p><span className="font-bold">เลขที่เอกสาร:</span> CLS-{selectedDate ? selectedDate.split('-').join('') : ''}</p>
            <p><span className="font-bold">ผู้บันทึก:</span> {summary?.existingClosing?.closed_by || 'Admin'}</p>
            <p className="text-gray-500 text-[9px] mt-0.5">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
          </div>
        </div>

        {summary && (
          <div className="flex flex-col gap-3">
            {/* Operational Statistics Strip */}
            <div className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 flex justify-between items-center text-[10px]">
              <div>
                <span className="font-bold text-gray-700">สถิติแผงค้า: </span>
                <span>แผงทั้งหมด <strong>275</strong> แผง</span>
                <span className="mx-1.5 text-gray-400">|</span>
                <span>จอง/เปิดใช้งาน <strong>{summary.occupancy?.booked || 0}</strong> แผง</span>
                <span className="mx-1.5 text-gray-400">|</span>
                <span>แผงว่าง <strong>{summary.occupancy?.available ?? (275 - (summary.occupancy?.booked || 0))}</strong> แผง</span>
              </div>
              <div>
                <span className="font-bold text-gray-700">เงินโอนเข้าบัญชี: </span>
                <span><strong>{summary.transferTxnCount || 0}</strong> รายการ (รวม <strong>{(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿</strong>)</span>
              </div>
            </div>

            {/* 1. Revenue Summary Table */}
            <div>
              <h3 className="font-bold text-xs border-b border-gray-400 pb-0.5 mb-1 flex items-center gap-1">
                1. สรุปรายรับแยกตามประเภท (Daily Revenues)
              </h3>
              <table className="w-full text-left border-collapse border border-gray-300 text-[10px]">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-300">
                    <th className="p-1 border-r border-gray-300">หมวดหมู่รายการ</th>
                    <th className="p-1 text-right border-r border-gray-300 w-28">เงินสด (บาท)</th>
                    <th className="p-1 text-right border-r border-gray-300 w-28">โอนเงิน (บาท)</th>
                    <th className="p-1 text-right w-32">ยอดรวมสุทธิ (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">1. ค่าจองแผงรายวัน (Daily Stalls)</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.dailyStall?.cash ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.dailyStall?.transfer ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-bold">{(summary.breakdown?.dailyStall?.total ?? summary.dailyStallIncome ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">2. ค่างวดรายเดือน (ชำระในวัน)</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.monthly?.cash ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.monthly?.transfer ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-bold">{(summary.breakdown?.monthly?.total ?? summary.monthlyIncome ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">3. บัตรตั๋ว & ค่าไฟคลองถม</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.klongthom?.cash ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.klongthom?.transfer ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-bold">{(summary.breakdown?.klongthom?.total ?? summary.klongthomIncome ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">4. ค่าบริการฝากของ (Storage)</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.storage?.cash ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.storage?.transfer ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-bold">{(summary.breakdown?.storage?.total ?? summary.storageIncome ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">5. รายรับอื่นๆ (Other Income)</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.otherIncome?.cash ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.otherIncome?.transfer ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-bold">{(summary.breakdown?.otherIncome?.total ?? summary.otherIncome ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-black font-black bg-gray-50">
                    <td className="p-1 border-r border-gray-300">รวมรายรับทั้งหมด (Gross Revenue)</td>
                    <td className="p-1 text-right border-r border-gray-300 font-bold text-green-700">{(summary.breakdown?.totalIncome?.cash ?? summary.cashIn ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-300 font-bold text-blue-700">{(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-black text-xs">{(summary.breakdown?.totalIncome?.total ?? summary.totalIncome ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-black font-bold text-red-700">
                    <td className="p-1 border-r border-gray-300">หัก: รายจ่ายประจำวัน (Total Expenses)</td>
                    <td className="p-1 text-right border-r border-gray-300 font-bold">-{(summary.breakdown?.expenses?.cash ?? summary.cashOut ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right border-r border-gray-300 font-bold">-{(summary.breakdown?.expenses?.transfer ?? summary.transferOut ?? 0).toLocaleString()} ฿</td>
                    <td className="p-1 text-right font-bold">-{(summary.breakdown?.expenses?.total ?? summary.totalExpenses ?? 0).toLocaleString()} ฿</td>
                  </tr>
                  <tr className="bg-gray-100 font-black">
                    <td className="p-1 border-r border-gray-300 text-gray-800">รายรับสุทธิประจำวัน (Net Daily Inflow)</td>
                    <td className="p-1 text-right border-r border-gray-300 font-black text-green-800">
                      {(summary.cashIn - summary.cashOut).toLocaleString()} ฿
                    </td>
                    <td className="p-1 text-right border-r border-gray-300 font-black text-blue-800">
                      {(summary.transferIn - summary.transferOut).toLocaleString()} ฿
                    </td>
                    <td className="p-1 text-right font-black text-xs text-gray-900">
                      {((summary.cashIn - summary.cashOut) + (summary.transferIn - summary.transferOut)).toLocaleString()} ฿
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. Cash Reconciliation & Denominations (2 Columns) */}
            <div>
              <h3 className="font-bold text-xs border-b border-gray-400 pb-0.5 mb-1">
                2. การกระทบยอดเงินสดและการตรวจนับ (Cash Reconciliation & Denomination Count)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                
                {/* Left Column: Reconciliation */}
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 font-bold border-r border-gray-300 bg-gray-50">เงินทอนเริ่มต้น (Opening Float)</td>
                      <td className="p-1 text-right font-bold">{floatVal.toLocaleString()} ฿</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 font-bold border-r border-gray-300 bg-gray-50">เงินสดรับรวม (Cash In)</td>
                      <td className="p-1 text-right font-bold text-green-700">+{cashIn.toLocaleString()} ฿</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1 font-bold border-r border-gray-300 bg-gray-50">เงินสดจ่ายรวม (Cash Out)</td>
                      <td className="p-1 text-right font-bold text-red-700">-{cashOut.toLocaleString()} ฿</td>
                    </tr>
                    <tr className="border-b border-gray-300 font-bold bg-gray-100">
                      <td className="p-1 border-r border-gray-300">เงินสดที่ควรมีในลิ้นชัก (Expected Cash)</td>
                      <td className="p-1 text-right font-black">{expectedCashInDrawer.toLocaleString()} ฿</td>
                    </tr>
                    <tr className="border-b border-black font-black bg-gray-50">
                      <td className="p-1 border-r border-gray-300">ยอดเงินสดนับนำส่งจริง (Counted Cash Remitted)</td>
                      <td className="p-1 text-right font-black text-xs">
                        {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="p-1 border-r border-gray-300">ผลต่างเงินขาด / เงินเกิน (Shortage / Surplus)</td>
                      <td className={`p-1 text-right font-black ${
                        shortageSurplus === 0 ? 'text-green-700' : shortageSurplus < 0 ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {shortageSurplus > 0 ? '+' : ''}{shortageSurplus.toLocaleString()} ฿
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Right Column: Denominations */}
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 font-bold border-b border-gray-300 text-center">
                      <th className="p-1 border-r border-gray-300 text-left">ชนิดธนบัตร / เหรียญ</th>
                      <th className="p-1 border-r border-gray-300 w-16">จำนวน</th>
                      <th className="p-1 text-right w-24">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'ธนบัตร 1,000 บาท', count: denominations.b1000, mult: 1000 },
                      { label: 'ธนบัตร 500 บาท', count: denominations.b500, mult: 500 },
                      { label: 'ธนบัตร 100 บาท', count: denominations.b100, mult: 100 },
                      { label: 'ธนบัตร 50 บาท', count: denominations.b50, mult: 50 },
                      { label: 'ธนบัตร 20 บาท', count: denominations.b20, mult: 20 },
                      { label: 'เหรียญกษาปณ์รวม', count: '-', amt: parseNum(denominations.coins) }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="p-0.5 px-1 border-r border-gray-200">{row.label}</td>
                        <td className="p-0.5 px-1 text-center border-r border-gray-200 text-gray-700">
                          {row.count !== '-' ? (row.count || '-') : '-'}
                        </td>
                        <td className="p-0.5 px-1 text-right font-semibold">
                          {(row.amt !== undefined ? row.amt : (parseNum(row.count) * row.mult) || 0).toLocaleString()} ฿
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-black border-t border-black">
                      <td colSpan={2} className="p-1 border-r border-gray-300 text-right">รวมเงินสดตรวจนับได้จริง</td>
                      <td className="p-1 text-right font-black text-xs text-green-800">
                        {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>

            {/* 3. Expense Itemization Table */}
            <div>
              <h3 className="font-bold text-xs border-b border-gray-400 pb-0.5 mb-1 flex justify-between items-center">
                <span>3. รายการแจกแจงรายจ่ายประจำวัน (Daily Expense Itemization)</span>
                <span className="text-[10px] font-bold text-gray-600">
                  {summary.expenseItems?.length ? `${summary.expenseItems.length} รายการ` : 'ไม่มีรายการ'}
                </span>
              </h3>
              {summary.expenseItems && summary.expenseItems.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 font-bold border-b border-gray-300">
                      <th className="p-1 border-r border-gray-300 w-8 text-center">#</th>
                      <th className="p-1 border-r border-gray-300">รายการ / คำอธิบายรายจ่าย</th>
                      <th className="p-1 border-r border-gray-300 w-28">หมวดหมู่</th>
                      <th className="p-1 border-r border-gray-300 w-20 text-center">ช่องทางจ่าย</th>
                      <th className="p-1 text-right w-24">จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.expenseItems.map((exp, idx) => (
                      <tr key={exp.id || idx} className="border-b border-gray-200">
                        <td className="p-1 border-r border-gray-200 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-1 border-r border-gray-200 font-medium">{exp.description}</td>
                        <td className="p-1 border-r border-gray-200 text-gray-600">{exp.category}</td>
                        <td className="p-1 border-r border-gray-200 text-center font-bold">
                          {exp.method}
                        </td>
                        <td className="p-1 text-right font-bold text-red-700">-{exp.amount.toLocaleString()} ฿</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-black border-t border-black">
                      <td colSpan={4} className="p-1 border-r border-gray-300 text-right">รวมรายจ่ายทั้งสิ้น (Total Expenses)</td>
                      <td className="p-1 text-right font-black text-red-700">-{summary.totalExpenses.toLocaleString()} ฿</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="p-1 text-center text-gray-500 border border-gray-200 rounded text-[10px] italic">
                  — ไม่มีรายการรายจ่ายในวันที่เลือก —
                </div>
              )}
            </div>

            {/* Discrepancy Note */}
            {discrepancyNote && (
              <div className="border border-gray-300 p-1.5 rounded bg-gray-50 text-[10px]">
                <strong className="font-bold text-gray-800">หมายเหตุ / เหตุผลเงินขาด-เกิน: </strong>
                <span>{discrepancyNote}</span>
              </div>
            )}

            {/* 4. Signature Area (3 Columns - Dual Control Chain) */}
            <div className="pt-3 mt-1 border-t-2 border-gray-400">
              <p className="text-[10px] font-bold text-gray-600 text-center mb-3">
                การลงนามรับรองความถูกต้อง (Sign-off & Dual Control Chain)
              </p>
              <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
                
                {/* 1. Cashier */}
                <div className="flex flex-col items-center gap-7">
                  <div>
                    <p className="font-bold text-gray-900">1. เจ้าหน้าที่ผู้นำส่งเงิน</p>
                    <p className="text-[9px] text-gray-500">(ผู้จัดทำ / Cashier)</p>
                  </div>
                  <div className="w-36 border-b border-black"></div>
                  <div>
                    <p className="text-[9px]">( ................................................................ )</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">วันที่ .......... / .......... / ................</p>
                  </div>
                </div>

                {/* 2. Accountant / Receiver */}
                <div className="flex flex-col items-center gap-7">
                  <div>
                    <p className="font-bold text-gray-900">2. ฝ่ายการเงิน / บัญชี</p>
                    <p className="text-[9px] text-gray-500">(ผู้ตรวจนับรับเงินสด / Receiver)</p>
                  </div>
                  <div className="w-36 border-b border-black"></div>
                  <div>
                    <p className="text-[9px]">( ................................................................ )</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">วันที่ .......... / .......... / ................</p>
                  </div>
                </div>

                {/* 3. Market Manager / Owner */}
                <div className="flex flex-col items-center gap-7">
                  <div>
                    <p className="font-bold text-gray-900">3. ผู้ตรวจสอบ / ผู้จัดการตลาด</p>
                    <p className="text-[9px] text-gray-500">(ผู้อนุมัติ / Approved by)</p>
                  </div>
                  <div className="w-36 border-b border-black"></div>
                  <div>
                    <p className="text-[9px]">( ................................................................ )</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">วันที่ .......... / .......... / ................</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
