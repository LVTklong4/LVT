'use client';

import React from 'react';
import { Filter, X, Search } from 'lucide-react';
import { incomeCategories, expenseCategories } from './FinanceTransactionForm';

export default function FinanceTransactionFilter({
  activeTab,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  categoryFilter,
  setCategoryFilter,
  methodFilter,
  setMethodFilter,
  searchQuery,
  setSearchQuery,
  onResetFilters
}) {
  const handleQuickDatePreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="p-3.5 bg-amber-50/30 border border-amber-200/70 rounded-xl flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-[#4A3B32] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-800" /> คัดกรอง:
          </span>
          {/* Quick Date Chips */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleQuickDatePreset('today')}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDatePreset('7days')}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer"
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => handleQuickDatePreset('thisMonth')}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer"
            >
              เดือนนี้
            </button>
            <button
              type="button"
              onClick={() => handleQuickDatePreset('all')}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer"
            >
              ทั้งหมด
            </button>
          </div>
        </div>

        <button 
          onClick={onResetFilters}
          className="text-[10px] font-bold text-amber-900 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <X className="w-3 h-3" /> ล้างตัวกรอง
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">วันที่เริ่มต้น</span>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1.5 border border-amber-200 rounded-lg text-[10px] bg-white font-bold"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">วันที่สิ้นสุด</span>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 border border-amber-200 rounded-lg text-[10px] bg-white font-bold"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">หมวดหมู่</span>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 border border-amber-200 rounded-lg text-[10px] bg-white focus:outline-none font-bold text-gray-700"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {activeTab === 'income' && incomeCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            {activeTab === 'expense' && expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            {activeTab === 'all' && (
              <>
                <optgroup label="-- หมวดหมู่รายรับ --">
                  {incomeCategories.map(cat => (
                    <option key={`inc-${cat}`} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                <optgroup label="-- หมวดหมู่รายจ่าย --">
                  {expenseCategories.map(cat => (
                    <option key={`exp-${cat}`} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">การจ่ายเงิน</span>
          <select 
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="p-1.5 border border-amber-200 rounded-lg text-[10px] bg-white focus:outline-none font-bold text-gray-700"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="โอนเงิน">📱 โอนเงิน</option>
            <option value="เงินสด">💵 เงินสด</option>
          </select>
        </div>
      </div>

      {/* Keyword Search */}
      <div className="relative">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหารายละเอียด หรือชื่อผู้บันทึก..."
          className="w-full pl-8 pr-3 py-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
        />
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
