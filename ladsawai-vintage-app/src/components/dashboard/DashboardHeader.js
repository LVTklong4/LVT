'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Calendar, RefreshCw, BarChart2, DollarSign } from 'lucide-react';

export default function DashboardHeader() {
  const { selectedDate, setSelectedDate, calculateDashboard } = useDashboard();
  const pathname = usePathname();

  const isFinancePage = pathname === '/dashboard/finance';

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-2">
        <a href={isFinancePage ? '/dashboard' : '/'} className="p-2 hover:bg-amber-100 rounded-full text-amber-800 transition-colors" title={isFinancePage ? "ย้อนกลับหน้าแดชบอร์ดหลัก" : "ย้อนกลับหน้าจองแผงค้า"}>
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 leading-none">
            {isFinancePage ? 'ระบบรายงานการเงินและบัญชี' : 'แดชบอร์ดสรุปผลการจอง'}
          </h1>
          <p className="text-xs text-gray-500 font-bold mt-1">
            {isFinancePage 
              ? 'สรุปรายรับ-รายจ่าย ประเมินหนี้สินค้างชำระ และพยากรณ์รายเดือน' 
              : 'สรุปสถานะการครองล็อค สัดส่วนรายวัน/รายเดือนแยกโซนแผงค้า'
            }
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {/* Switch Dashboard Button */}
        {isFinancePage ? (
          <a
            href="/dashboard"
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden xs:inline">ดูสรุปยอดจองล็อค</span>
          </a>
        ) : (
          <a
            href="/dashboard/finance"
            className="px-3.5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden xs:inline">ดูระบบการเงิน/บัญชี</span>
          </a>
        )}

        <div className="border-l border-amber-300 h-6 mx-1 hidden sm:block"></div>

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
