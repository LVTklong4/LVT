'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlyTableFooter({
  totalItems = 0,
  currentPage = 1,
  pageSize = 15,
  onPageChange,
  onPageSizeChange,
  stats = {}
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination buttons with smart range
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200 shrink-0 select-none">
      {/* 1. Pagination Controls - 3 Columns (Left, Center, Right) */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
        {/* Col 1: Range text (Left) */}
        <div className="flex items-center justify-start shrink-0 whitespace-nowrap">
          <span>
            แสดง <strong className="text-gray-900">{startItem}-{endItem}</strong> จาก <strong className="text-gray-900">{totalItems}</strong> ราย
          </span>
        </div>

        {/* Col 2: Navigation buttons (Center - Expanded) */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange?.(currentPage - 1)}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" /> ก่อนหน้า
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 shrink-0">...</span>;
                  }
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => onPageChange?.(p)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-[#8B4513] text-white shadow-xs'
                          : 'border border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange?.(currentPage + 1)}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                ถัดไป <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Col 3: Items per page selector (Right) */}
        <div className="flex items-center justify-end gap-1 shrink-0 whitespace-nowrap">
          <span className="text-[11px] text-gray-500">แสดง:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="p-1 border border-gray-300 rounded text-xs bg-white text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={9999}>ทั้งหมด</option>
          </select>
          <span className="text-[11px] text-gray-500">/ หน้า</span>
        </div>
      </div>

      {/* 2. Market Summary Stats Footer - Single Line Without Label Icons */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-gray-700 font-medium">
          ทั้งหมด <strong className="text-amber-900 font-bold">{stats.totalCust || 0}</strong> ราย
        </span>
        <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-orange-950 font-medium">
          🍲 อาหาร <strong className="text-orange-800 font-bold">{stats.foodCust || 0}</strong> ราย ({stats.foodStalls || 0} ล็อค)
        </span>
        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-950 font-medium">
          🛍️ ทั่วไป <strong className="text-blue-800 font-bold">{stats.genCust || 0}</strong> ราย ({stats.genStalls || 0} ล็อค)
        </span>
        <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 font-bold">
          พุธ: {stats.wedStalls || 0} ล็อค
        </span>
        <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-800 font-bold">
          เสาร์: {stats.satStalls || 0} ล็อค
        </span>
        <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-rose-800 font-bold">
          อาทิตย์: {stats.sunStalls || 0} ล็อค
        </span>
      </div>
    </div>
  );
}
