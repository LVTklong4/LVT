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
  return (
    <div className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-amber-800" /> ฟิลเตอร์คัดกรองข้อมูล
        </span>
        <button 
          onClick={onResetFilters}
          className="text-[10px] font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
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
            className="p-1.5 border border-amber-200 rounded text-[10px] bg-white"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">วันที่สิ้นสุด</span>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 border border-amber-200 rounded text-[10px] bg-white"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">หมวดหมู่</span>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 border border-amber-200 rounded text-[10px] bg-white focus:outline-none"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            {(activeTab === 'income' ? incomeCategories : expenseCategories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-gray-500 font-bold">การจ่ายเงิน</span>
          <select 
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="p-1.5 border border-amber-200 rounded text-[10px] bg-white focus:outline-none"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="โอนเงิน">โอนเงิน</option>
            <option value="เงินสด">เงินสด</option>
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
