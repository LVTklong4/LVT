'use client';

import React from 'react';
import { ArrowLeft, Calendar, RefreshCw, BarChart2, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function FinanceHeader({
  selectedDate,
  setSelectedDate,
  isClosed,
  onOpenDailyClosing,
  onRefresh,
  loading
}) {
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white border-2 border-[#8B4513]/25 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Brand & Page Title */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="p-2.5 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-900 border border-amber-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="กลับสู่หน้าผังจองแผงค้า"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-2xl font-black text-[#4A3B32] leading-tight">
                บันทึกรายรับ-รายจ่าย และปิดยอด
              </h1>
              {isClosed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  <Lock className="w-3.5 h-3.5 text-amber-800" />
                  ปิดยอดแล้ว
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  เปิดรับยอดปกติ
                </span>
              )}
            </div>
            <p className="text-xs text-[#8B4513]/80 font-bold mt-0.5">
              สมุดบัญชีรายวัน บันทึกรายจ่ายบริหาร และตรวจสอบปิดยอดเงินสดตลาด
            </p>
          </div>
        </div>

        {/* Action Controls & Date Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* Quick Date Selector */}
          <div className="flex items-center gap-1.5 bg-[#FDF5E6] p-1 rounded-xl border border-amber-300/80 shadow-inner">
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                isToday
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-amber-900 hover:bg-amber-200/60'
              }`}
            >
              วันนี้
            </button>
            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-amber-200 text-xs font-bold text-gray-800">
              <Calendar className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold text-gray-800"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูลบัญชี"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-800' : ''}`} />
          </button>

          {/* Link to Analytics Dashboard */}
          <a
            href="/dashboard"
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="ไปยังแดชบอร์ดสรุปยอดและสถิติภาพรวม"
          >
            <BarChart2 className="w-4 h-4 text-blue-700" />
            <span className="hidden sm:inline">แดชบอร์ดสถิติ</span>
          </a>

          {/* Primary Action: Daily Closing */}
          <button
            type="button"
            onClick={onOpenDailyClosing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer ml-auto sm:ml-0"
          >
            <Lock className="w-4 h-4 text-emerald-300" />
            <span>🔒 ปิดยอดประจำวัน</span>
          </button>

        </div>

      </div>
    </div>
  );
}
