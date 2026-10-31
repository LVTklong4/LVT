'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinanceSummaryCards({
  incomeList = [],
  expenseList = [],
  selectedDate = ''
}) {
  const summary = useMemo(() => {
    let incTotal = 0;
    let incCash = 0;
    let incTransfer = 0;

    incomeList.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      incTotal += amt;
      incCash += (parseFloat(item.cashAmount) || 0);
      incTransfer += (parseFloat(item.transferAmount) || 0);
    });

    let expTotal = 0;
    let expCash = 0;
    let expTransfer = 0;

    expenseList.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      expTotal += amt;
      expCash += (parseFloat(item.cashAmount) || 0);
      expTransfer += (parseFloat(item.transferAmount) || 0);
    });

    const netTotal = incTotal - expTotal;
    const netCash = incCash - expCash;

    return {
      incTotal,
      incCash,
      incTransfer,
      expTotal,
      expCash,
      expTransfer,
      netTotal,
      netCash
    };
  }, [incomeList, expenseList]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      
      {/* 1. Total Income Card */}
      <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] md:text-xs font-bold text-emerald-950 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            รายรับรวม
          </span>
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div className="my-2">
          <div className="text-lg md:text-2xl font-black text-emerald-800 leading-tight">
            +{summary.incTotal.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ฿
          </div>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">
            พบ {incomeList.length} รายการรับ
          </p>
        </div>
        <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold text-gray-600">
          <span className="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded">
            💵 สด {summary.incCash.toLocaleString()}
          </span>
          <span className="text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
            📱 โอน {summary.incTransfer.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Total Expense Card */}
      <div className="bg-white border-2 border-rose-300/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] md:text-xs font-bold text-rose-950 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            รายจ่ายรวม
          </span>
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
            <TrendingDown className="w-4 h-4" />
          </span>
        </div>
        <div className="my-2">
          <div className="text-lg md:text-2xl font-black text-rose-800 leading-tight">
            -{summary.expTotal.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ฿
          </div>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">
            พบ {expenseList.length} รายการจ่าย
          </p>
        </div>
        <div className="pt-2 border-t border-rose-100 flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold text-gray-600">
          <span className="text-rose-900 bg-rose-50 px-1.5 py-0.5 rounded">
            💵 สด {summary.expCash.toLocaleString()}
          </span>
          <span className="text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
            📱 โอน {summary.expTransfer.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3. Cash in Hand (เงินสดในมือ/ในเก๊ะ) */}
      <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] md:text-xs font-bold text-amber-950 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            เงินสดในมือสุทธิ
          </span>
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
            <Wallet className="w-4 h-4" />
          </span>
        </div>
        <div className="my-2">
          <div className={`text-lg md:text-2xl font-black leading-tight ${summary.netCash >= 0 ? 'text-amber-900' : 'text-red-700'}`}>
            {summary.netCash.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ฿
          </div>
          <p className="text-[10px] text-amber-800/80 font-bold mt-0.5">
            (เงินสดรับ {summary.incCash.toLocaleString()} - เงินสดจ่าย {summary.expCash.toLocaleString()})
          </p>
        </div>
        <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[10px] font-semibold text-[#8B4513]/70">
          <span>ยอดเงินสดสำหรับนับปิดเก๊ะ</span>
        </div>
      </div>

      {/* 4. Net Profit / Cashflow Total */}
      <div className="bg-white border-2 border-blue-300/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] md:text-xs font-bold text-blue-950 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            ยอดคงเหลือสุทธิ
          </span>
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="my-2">
          <div className={`text-lg md:text-2xl font-black leading-tight ${summary.netTotal >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
            {summary.netTotal >= 0 ? '+' : ''}{summary.netTotal.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ฿
          </div>
          <p className="text-[10px] text-blue-800/80 font-bold mt-0.5">
            {summary.netTotal >= 0 ? 'กำไรหมุนเวียนสุทธิ' : 'รายจ่ายเกินรายรับ'}
          </p>
        </div>
        <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] font-semibold text-gray-500">
          <span>(รวมทุกช่องทาง สด + โอน)</span>
        </div>
      </div>

    </div>
  );
}
