'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';

export default function DashboardFinanceKpis() {
  const { data } = useDashboard();
  const { summary, analytics } = data;
  const { forecast } = analytics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      
      {/* Income KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">รายรับวันนี้</p>
          <h3 className="text-lg md:text-xl font-extrabold text-green-700 mt-1">
            {summary.totalIncome.toLocaleString()} ฿
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            โอน: {summary.transferIn.toLocaleString()} ฿ | สด: {summary.cashIn.toLocaleString()} ฿
          </span>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Expense KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">รายจ่ายวันนี้</p>
          <h3 className="text-lg md:text-xl font-extrabold text-red-700 mt-1">
            {summary.totalExpense.toLocaleString()} ฿
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            โอน: {summary.transferOut.toLocaleString()} ฿ | สด: {summary.cashOut.toLocaleString()} ฿
          </span>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <TrendingDown className="w-6 h-6 text-red-600" />
        </div>
      </div>

      {/* Profit KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">กำไรสุทธิวันนี้</p>
          <h3 className={`text-lg md:text-xl font-extrabold mt-1 ${summary.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {summary.netProfit.toLocaleString()} ฿
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">รายรับหักรายจ่ายในวัน</span>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <DollarSign className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Forecast KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">ประมาณการรายรับรายเดือน</p>
          <h3 className="text-lg md:text-xl font-extrabold text-amber-800 mt-1">
            {forecast.toLocaleString()} ฿
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            คำนวณสะสมจากยอดวันนี้
          </span>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <Coins className="w-6 h-6 text-amber-700" />
        </div>
      </div>

    </div>
  );
}
