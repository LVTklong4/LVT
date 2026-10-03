'use client';

import React, { useState, useMemo } from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { cleanStallName, parseNumber, formatPrice } from '@/utils/numberHelper';
import { monthNamesFull, formatBookingMonth, sortThaiMonthsDescending, formatPhoneDisplay } from '@/utils/thaiDateHelper';
import { calculateMonthlySummaryStats } from '@/services/monthly/monthlyStatsService';
import MonthlyTableFooter from '../modals/MonthlyTableFooter';
import {
  Search, CalendarDays, PlusCircle, RotateCcw, Filter, User, Phone,
  Banknote, FileText, CheckCircle, AlertCircle, ChevronRight, X,
  Trash2, Edit, CalendarX, Plus, Printer, Loader2, Store
} from 'lucide-react';

export default function MonthlyManagerMobile({ onClose }) {
  const {
    adminUser
  } = useAuthAdmin();

  const {
    filteredMonthlyList,
    loadingMonthly,
    monthlyList,
    monthlyMonthFilter,
    setMonthlyMonthFilter,
    monthlySearchQuery,
    setMonthlySearchQuery,
    handleOpenNewMonthlyModal,
    handleOpenBulkRenewModal,
    handleOpenEditMonthlyModal,
    handleDeleteMonthlyBooking,
    handleToggleNonRenewal,
    handleOpenMonthlyPaymentModal,
    handleShowMonthlyReceiptPreview,
    handlePrintMonthlyInvoice,
    fetchMonthlyTransactions,
    activeMonthlyTransactions,
    loadingMonthlyTxns,
    stalls
  } = useMonthlyBooking();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedMobileItem, setSelectedMobileItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด'); // 'ทั้งหมด' | 'ค้างชำระ' | 'ชำระแล้ว'

  // Filter by payment status if selected
  const displayList = useMemo(() => {
    let list = filteredMonthlyList || [];
    if (statusFilter === 'ค้างชำระ') {
      list = list.filter(item => {
        const unpaid = parseNumber(item.total_price) - parseNumber(item.paid_amount || 0);
        return unpaid > 0;
      });
    } else if (statusFilter === 'ชำระแล้ว') {
      list = list.filter(item => {
        const unpaid = parseNumber(item.total_price) - parseNumber(item.paid_amount || 0);
        return unpaid <= 0;
      });
    }
    return list;
  }, [filteredMonthlyList, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(displayList.length / pageSize));
  const paginatedList = useMemo(() => {
    if (pageSize >= 9999) return displayList;
    const start = (currentPage - 1) * pageSize;
    return displayList.slice(start, start + pageSize);
  }, [displayList, currentPage, pageSize]);

  const summaryStats = useMemo(() => {
    return calculateMonthlySummaryStats(filteredMonthlyList, stalls);
  }, [filteredMonthlyList, stalls]);

  // Open item drawer
  const handleSelectCard = (item) => {
    setSelectedMobileItem(item);
    if (typeof fetchMonthlyTransactions === 'function') {
      fetchMonthlyTransactions(item.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF6EE] text-gray-800 font-sans select-none overflow-hidden">
      
      {/* 1. Mobile Top App Bar */}
      <div className="bg-[#5D4037] text-white px-3.5 py-2.5 flex justify-between items-center shrink-0 border-b-2 border-[#8B4513] shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="w-5 h-5 text-amber-300 shrink-0" />
          <div className="truncate">
            <h3 className="font-extrabold text-xs tracking-tight truncate">จัดการลูกค้ารายเดือน</h3>
            <span className="text-[10px] text-amber-200/80 font-bold block truncate">ตลาดนัดลาดสวายวินเทจ</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenNewMonthlyModal}
            className="px-2.5 py-1.5 bg-[#8B5A2B] hover:bg-[#6D4C41] active:scale-95 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs border border-amber-400/20 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> จองล็อค
          </button>
          <button
            type="button"
            onClick={handleOpenBulkRenewModal}
            className="px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow-xs border border-purple-400/20 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> ต่อสัญญา
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-amber-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Mobile Search & Filter Toolbar */}
      <div className="bg-white px-3 py-2 border-b border-amber-200/60 flex flex-col gap-2 shrink-0 shadow-2xs">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={monthlySearchQuery}
              onChange={(e) => {
                setMonthlySearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาชื่อ, เบอร์โทร, แผงค้า..."
              className="w-full pl-8 pr-7 py-1.5 border border-amber-300/80 rounded-xl text-xs bg-amber-50/20 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
            />
            <Search className="w-3.5 h-3.5 text-amber-800/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {monthlySearchQuery && (
              <button
                type="button"
                onClick={() => setMonthlySearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-black text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-1 bg-amber-50/50 border border-amber-200 rounded-xl px-2 py-1.5 shrink-0">
            <CalendarDays className="w-3.5 h-3.5 text-[#8B4513] shrink-0" />
            <select
              value={monthlyMonthFilter}
              onChange={(e) => {
                setMonthlyMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent text-[#5D4037] font-bold focus:outline-none cursor-pointer p-0"
            >
              <option value="ทั้งหมด">ทุกล็อต/เดือน</option>
              {(() => {
                const now = new Date();
                const currentMonthYear = `${monthNamesFull[now.getMonth()]} ${now.getFullYear() + 543}`;
                const monthSet = new Set(monthlyList.map(item => formatBookingMonth(item.booking_month)).filter(m => m !== '-'));
                monthSet.add(currentMonthYear);
                return sortThaiMonthsDescending(Array.from(monthSet)).map(month => (
                  <option key={month} value={month}>{month}</option>
                ));
              })()}
            </select>
          </div>
        </div>

        {/* Quick status tabs: ทั้งหมด | ค้างชำระ | ชำระแล้ว */}
        <div className="flex items-center gap-1.5 text-xs font-bold pt-0.5">
          <button
            type="button"
            onClick={() => { setStatusFilter('ทั้งหมด'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full transition-all text-[11px] ${
              statusFilter === 'ทั้งหมด'
                ? 'bg-[#8B4513] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({filteredMonthlyList.length})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('ค้างชำระ'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full transition-all text-[11px] flex items-center gap-1 ${
              statusFilter === 'ค้างชำระ'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            ค้างชำระ
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('ชำระแล้ว'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full transition-all text-[11px] ${
              statusFilter === 'ชำระแล้ว'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            ชำระแล้ว
          </button>
        </div>
      </div>

      {/* 3. Card List Container (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 space-y-2.5 custom-scrollbar">
        {loadingMonthly ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-2 bg-white rounded-2xl border border-amber-200/60 shadow-xs">
            <Loader2 className="w-7 h-7 text-amber-800 animate-spin" />
            <span className="text-xs font-bold">กำลังโหลดข้อมูลลูกค้ารายเดือน...</span>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-2 bg-white rounded-2xl border border-amber-200/60 shadow-xs text-center">
            <AlertCircle className="w-8 h-8 text-amber-800/40" />
            <span className="text-xs font-bold text-gray-700">ไม่พบข้อมูลลูกค้ารายเดือนในเงื่อนไขนี้</span>
            <span className="text-[11px] text-gray-400">ลองเปลี่ยนตัวกรองเดือน หรือล้างคำค้นหาดูครับ</span>
          </div>
        ) : (
          paginatedList.map((item) => {
            const unpaidBalance = parseNumber(item.total_price) - parseNumber(item.paid_amount || 0);
            const isFullyPaid = unpaidBalance <= 0;
            const isNonRenew = item.renewal_status === 'ไม่ต่อสัญญา';

            const displayStalls = (() => {
              const rawStall = item.stalls || item.stall_name;
              if (rawStall) return cleanStallName(rawStall);
              if (item.stall_details) {
                try {
                  const parsed = typeof item.stall_details === 'string' ? JSON.parse(item.stall_details) : item.stall_details;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const names = parsed.map(s => cleanStallName(s.name || s.stall_name)).filter(Boolean);
                    if (names.length > 0) return names.join(', ');
                  }
                } catch (e) {}
              }
              return '-';
            })();

            const customerName = item.booker_name || item.customer_name || 'ไม่ระบุชื่อ';
            const isRegular = item.customer_type === 'Regular';

            return (
              <div
                key={item.id}
                onClick={() => handleSelectCard(item)}
                className={`bg-white rounded-2xl border transition-all shadow-xs p-3.5 flex flex-col gap-2.5 active:scale-[0.99] cursor-pointer ${
                  selectedMobileItem?.id === item.id 
                    ? 'border-[#8B4513] ring-2 ring-[#8B4513]/20 bg-[#FAF6EE]/50'
                    : 'border-amber-900/10 hover:border-amber-300'
                }`}
              >
                {/* Card Header: Stalls Badge & Payment Status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-2xs tracking-wide">
                      ล็อค {displayStalls}
                    </span>
                    {isRegular && (
                      <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                        ประจำ
                      </span>
                    )}
                    {isNonRenew && (
                      <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CalendarX className="w-3 h-3" /> ไม่ต่อสัญญา
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${
                    isFullyPaid 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isFullyPaid ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    {isFullyPaid ? 'ชำระครบแล้ว' : `ค้าง ${formatPrice(unpaidBalance)} บ.`}
                  </span>
                </div>

                {/* Card Body: Customer Info */}
                <div className="flex justify-between items-end border-b border-dashed border-gray-100 pb-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900 tracking-tight flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      {customerName}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold mt-0.5">
                      <span className="text-amber-900">{item.product || 'สินค้าทั่วไป'}</span>
                      <span>•</span>
                      <span className="text-gray-400 font-mono">{formatBookingMonth(item.booking_month)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>

                {/* Card Financial Summary Row */}
                <div className="grid grid-cols-3 gap-1.5 text-center bg-[#FAF6EE]/80 rounded-xl p-2 border border-amber-200/40">
                  <div>
                    <span className="text-[9.5px] text-gray-400 font-bold block">ค่าล็อค</span>
                    <span className="text-xs font-black text-gray-800 font-mono">{formatPrice(item.total_price)}</span>
                  </div>
                  <div className="border-x border-amber-200/60">
                    <span className="text-[9.5px] text-gray-400 font-bold block">ชำระแล้ว</span>
                    <span className="text-xs font-black text-emerald-700 font-mono">{formatPrice(item.paid_amount || 0)}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-gray-400 font-bold block">คงเหลือ</span>
                    <span className={`text-xs font-black font-mono ${unpaidBalance > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-700'}`}>
                      {formatPrice(unpaidBalance)}
                    </span>
                  </div>
                </div>

                {/* Card Quick Action Bar */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleNonRenewal(item)}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        isNonRenew
                          ? 'bg-red-600 text-white border-red-700'
                          : 'bg-white text-gray-400 border-gray-200 hover:text-red-600'
                      }`}
                      title={isNonRenew ? "ยกเลิกไม่ต่อสัญญา" : "แจ้งไม่ต่อสัญญา"}
                    >
                      <CalendarX className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditMonthlyModal(item)}
                      className="px-2 py-1 bg-white text-gray-700 border border-gray-200 rounded-lg text-[10.5px] font-bold hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3 text-amber-700" /> แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMonthlyBooking(item)}
                      className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    {unpaidBalance > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenMonthlyPaymentModal(item)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" /> ชำระเงิน
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleShowMonthlyReceiptPreview(item)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> ใบเสร็จ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer Pagination & Stats */}
      <div className="bg-white border-t border-amber-200/80 px-3 py-2 shrink-0">
        <MonthlyTableFooter
          totalItems={displayList.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          stats={summaryStats}
        />
      </div>

      {/* 5. Mobile Detail Slide-up Bottom Drawer */}
      {selectedMobileItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in">
          <div 
            className="fixed inset-0 -z-10" 
            onClick={() => setSelectedMobileItem(null)} 
          />

          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t-2 border-[#8B4513] animate-slide-up overflow-hidden">
            
            {/* Drawer Header with Handle */}
            <div className="p-3 bg-[#5D4037] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-[#8B4513] text-amber-200 font-mono text-xs font-black px-2 py-0.5 rounded border border-amber-400/30">
                  {selectedMobileItem.stalls || selectedMobileItem.stall_name || '-'}
                </span>
                <h3 className="font-extrabold text-sm truncate">
                  {selectedMobileItem.booker_name || selectedMobileItem.customer_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMobileItem(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs custom-scrollbar">
              
              {/* Customer Contact & Meta Card */}
              <div className="bg-[#FAF6EE] p-3 rounded-xl border border-amber-200/60 space-y-1.5">
                <div className="flex justify-between items-center text-gray-700">
                  <span className="text-gray-500 font-bold">ประเภท:</span>
                  <span className="font-extrabold text-gray-900">{selectedMobileItem.customer_type || 'Standard'}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span className="text-gray-500 font-bold">สินค้า:</span>
                  <span className="font-extrabold text-[#8B4513]">{selectedMobileItem.product || '-'}</span>
                </div>
                {selectedMobileItem.phone && (
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="text-gray-500 font-bold">เบอร์โทรศัพท์:</span>
                    <a 
                      href={`tel:${selectedMobileItem.phone}`}
                      className="font-extrabold text-blue-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                    >
                      <Phone className="w-3 h-3" /> {formatPhoneDisplay(selectedMobileItem.phone)}
                    </a>
                  </div>
                )}
                {selectedMobileItem.note && (
                  <div className="pt-1 border-t border-amber-200/40 text-[11px] text-gray-600">
                    <span className="font-bold text-gray-500">หมายเหตุ: </span>
                    {selectedMobileItem.note}
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="bg-white border rounded-xl p-3 shadow-2xs space-y-2">
                <h5 className="font-extrabold text-gray-800 text-xs flex items-center gap-1">
                  <Banknote className="w-4 h-4 text-emerald-700" /> สรุปยอดเงิน
                </h5>
                <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2 rounded-lg">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">ยอดเต็ม</span>
                    <strong className="text-gray-900 font-mono text-xs">{formatPrice(selectedMobileItem.total_price)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">จ่ายแล้ว</span>
                    <strong className="text-emerald-700 font-mono text-xs">{formatPrice(selectedMobileItem.paid_amount || 0)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">คงค้าง</span>
                    <strong className={`font-mono text-xs ${parseNumber(selectedMobileItem.total_price) - parseNumber(selectedMobileItem.paid_amount || 0) > 0 ? 'text-red-600 font-black' : 'text-emerald-700'}`}>
                      {formatPrice(parseNumber(selectedMobileItem.total_price) - parseNumber(selectedMobileItem.paid_amount || 0))}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-extrabold text-gray-800 text-xs flex items-center gap-1">
                    <FileText className="w-4 h-4 text-[#8B4513]" /> ประวัติการชำระเงิน
                  </h5>
                  {selectedMobileItem.customer_type !== 'Regular' && (
                    <button
                      type="button"
                      onClick={() => handlePrintMonthlyInvoice(selectedMobileItem)}
                      className="text-[10.5px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> ใบแจ้งหนี้
                    </button>
                  )}
                </div>

                {loadingMonthlyTxns ? (
                  <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-700" /> กำลังโหลดประวัติ...
                  </div>
                ) : activeMonthlyTransactions && activeMonthlyTransactions.length > 0 ? (
                  <div className="divide-y border rounded-xl overflow-hidden bg-white shadow-2xs">
                    {activeMonthlyTransactions.map((txn, idx) => (
                      <div key={txn.id || idx} className="p-2.5 flex justify-between items-center text-[11px]">
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-1">
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded text-[10px]">
                              {txn.method || 'เงินสด'}
                            </span>
                            <span className="font-mono text-gray-500">{txn.date}</span>
                          </div>
                          {txn.note && <div className="text-[10px] text-gray-400 mt-0.5">{txn.note}</div>}
                        </div>
                        <strong className="text-emerald-700 font-mono text-xs">
                          +{formatPrice(txn.total_amount || txn.amount)} บ.
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-gray-400 border border-dashed rounded-xl bg-gray-50/50 text-[11px]">
                    ยังไม่มีประวัติการชำระเงิน
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Drawer Actions Bar */}
            <div className="p-3 bg-gray-50 border-t flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedMobileItem(null);
                  handleOpenMonthlyPaymentModal(selectedMobileItem);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Banknote className="w-4 h-4" /> บันทึกชำระเงิน
              </button>

              <button
                type="button"
                onClick={() => handleShowMonthlyReceiptPreview(selectedMobileItem)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> ใบเสร็จ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
