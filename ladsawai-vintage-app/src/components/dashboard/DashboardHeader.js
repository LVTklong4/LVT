'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react';

export default function DashboardHeader() {
  const { selectedDate, setSelectedDate, calculateDashboard } = useDashboard();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-2">
        <a href="/" className="p-2 hover:bg-amber-100 rounded-full text-amber-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 leading-none">แดชบอร์ดบริหารตลาดนัด</h1>
          <p className="text-xs text-gray-500 font-bold mt-1">สรุปข้อมูลการจอง รายรับ-รายจ่าย และประมาณการหนี้สิน</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Calendar className="w-4 h-4 text-amber-800 hidden sm:block" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 text-xs border border-amber-300 rounded-lg bg-white font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
        />
        <button 
          onClick={calculateDashboard}
          className="p-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors shadow cursor-pointer"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
