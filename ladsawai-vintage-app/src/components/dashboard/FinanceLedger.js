'use client';

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { DashboardContext } from '@/context/DashboardContext';
import { useBooking } from '@/context/BookingContext';
import { 
  Trash2, TrendingUp, TrendingDown, Loader2, RefreshCw, AlertCircle, 
  Lock, ListFilter, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight 
} from 'lucide-react';
import DailyClosingModal from './DailyClosingModal';
import FinanceTransactionForm from './FinanceTransactionForm';
import FinanceTransactionFilter from './FinanceTransactionFilter';

export default function FinanceLedger({ onOpenDailyClosing, defaultDate }) {
  const { 
    incomeList, 
    expenseList, 
    loading: loadingFinance, 
    fetchFinanceData, 
    deleteIncome, 
    deleteExpense,
    isDateClosed
  } = useFinance();

  const { showConfirm } = useBooking();
  const dashboardContext = useContext(DashboardContext);

  // Daily Closing Modal state
  const [showDailyClosingModal, setShowDailyClosingModal] = useState(false);

  // Local state for tabs: 'all', 'income', or 'expense'
  const [activeTab, setActiveTab] = useState('all');

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [methodFilter, setMethodFilter] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data on filter change
  const loadData = useCallback(() => {
    fetchFinanceData({
      startDate,
      endDate,
      category: categoryFilter,
      method: methodFilter,
      searchQuery
    });
  }, [fetchFinanceData, startDate, endDate, categoryFilter, methodFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle transaction creation success
  const handleTransactionSuccess = () => {
    loadData();
    dashboardContext?.calculateDashboard?.();
  };

  // Delete handlers
  const handleDeleteItem = async (id, itemType) => {
    const type = itemType || activeTab;
    const targetItem = (type === 'income' ? incomeList : expenseList).find(x => x.id === id);
    if (targetItem?.date && isDateClosed(targetItem.date)) {
      alert(`⚠️ วันที่ ${targetItem.date} ได้ทำการปิดยอดประจำวันเรียบร้อยแล้ว ข้อมูลถูกล็อคไม่สามารถลบรายการได้`);
      return;
    }

    const isConfirmed = await showConfirm({
      title: 'ยืนยันการลบรายการบัญชี',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การลบไม่สามารถย้อนกลับได้',
      confirmText: 'ลบรายการ',
      cancelText: 'ยกเลิก',
      isDanger: true
    });
    if (!isConfirmed) return;

    let res;
    if (type === 'income') {
      res = await deleteIncome(id);
    } else {
      res = await deleteExpense(id);
    }

    if (res.success) {
      loadData();
      dashboardContext?.calculateDashboard?.();
    } else {
      alert('ไม่สามารถลบรายการได้: ' + (res?.error?.message || 'ข้อผิดพลาด'));
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset all filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('ทั้งหมด');
    setMethodFilter('ทั้งหมด');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Calculations for display list
  const currentList = useMemo(() => {
    if (activeTab === 'income') {
      return incomeList.map(item => ({ ...item, entryType: 'income' }));
    }
    if (activeTab === 'expense') {
      return expenseList.map(item => ({ ...item, entryType: 'expense' }));
    }
    // Combined list for 'all'
    const combined = [
      ...incomeList.map(item => ({ ...item, entryType: 'income' })),
      ...expenseList.map(item => ({ ...item, entryType: 'expense' }))
    ];
    return combined.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const timeA = a.timestamp || '';
      const timeB = b.timestamp || '';
      return timeB.localeCompare(timeA);
    });
  }, [activeTab, incomeList, expenseList]);

  const totalInc = useMemo(() => incomeList.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0), [incomeList]);
  const totalExp = useMemo(() => expenseList.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0), [expenseList]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, currentList.length);
  const paginatedList = currentList.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white border-2 border-[#8B4513]/25 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-5">
      
      {/* Tab Switcher & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#8B4513]/10 pb-4">
        <div>
          <h2 className="text-base md:text-lg font-black text-[#4A3B32] flex items-center gap-2">
            สมุดบัญชีรายรับ-รายจ่าย (General Ledger)
          </h2>
          <p className="text-[10px] md:text-xs text-gray-500 font-bold">
            บันทึกรายรับเบ็ดเตล็ด รายจ่ายบริหาร และตรวจสอบบัญชีย้อนหลัง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={() => {
              if (typeof onOpenDailyClosing === 'function') {
                onOpenDailyClosing();
              } else {
                setShowDailyClosingModal(true);
              }
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-300" />
            <span>🔒 ปิดยอดประจำวัน</span>
          </button>

          <div className="flex bg-[#FDF5E6] p-1 rounded-xl border border-[#8B4513]/20 flex-1 md:flex-initial">
            <button
              onClick={() => { setActiveTab('all'); handleResetFilters(); }}
              className={`flex-1 md:flex-initial px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-amber-800 text-white shadow-xs' 
                  : 'text-amber-950 hover:bg-amber-100'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>ทั้งหมด ({incomeList.length + expenseList.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('income'); handleResetFilters(); }}
              className={`flex-1 md:flex-initial px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'income' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>รายรับ ({incomeList.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('expense'); handleResetFilters(); }}
              className={`flex-1 md:flex-initial px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'expense' 
                  ? 'bg-rose-700 text-white shadow-xs' 
                  : 'text-gray-600 hover:text-rose-700 hover:bg-rose-50'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>รายจ่าย ({expenseList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form and Filter section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transaction Input Form */}
        <FinanceTransactionForm
          activeTab={activeTab}
          defaultDate={defaultDate || startDate}
          onSuccess={handleTransactionSuccess}
        />

        {/* Filter bar and Ledger list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Filters Dashboard */}
          <FinanceTransactionFilter
            activeTab={activeTab}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            methodFilter={methodFilter}
            setMethodFilter={setMethodFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onResetFilters={handleResetFilters}
          />

          {/* Ledger Table */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <div className="text-xs font-bold text-gray-600 flex items-center gap-2 flex-wrap">
                <span>พบทั้งหมด <strong>{currentList.length}</strong> รายการ</span>
                <span className="text-gray-300">|</span>
                {activeTab === 'all' ? (
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-700">รับ: +{totalInc.toLocaleString()} ฿</span>
                    <span className="text-rose-700">จ่าย: -{totalExp.toLocaleString()} ฿</span>
                    <span className="font-extrabold text-blue-900">สุทธิ: {(totalInc - totalExp).toLocaleString()} ฿</span>
                  </span>
                ) : activeTab === 'income' ? (
                  <span>ยอดรับรวม: <strong className="text-emerald-700">+{totalInc.toLocaleString()} ฿</strong></span>
                ) : (
                  <span>ยอดจ่ายรวม: <strong className="text-rose-700">-{totalExp.toLocaleString()} ฿</strong></span>
                )}
              </div>
              <button 
                onClick={loadData}
                className="p-1.5 border border-amber-200 hover:bg-amber-50 rounded-lg text-amber-900 transition-colors cursor-pointer"
                title="รีเฟรชรายการ"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-amber-200/60 rounded-xl overflow-hidden shadow-xs flex-1 flex flex-col bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b font-black ${
                    activeTab === 'income' 
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
                      : activeTab === 'expense' 
                      ? 'bg-rose-50 text-rose-950 border-rose-200'
                      : 'bg-amber-50/70 text-amber-950 border-amber-200'
                  }`}>
                    <tr>
                      <th className="p-3">วันที่</th>
                      <th className="p-3">หมวดหมู่</th>
                      <th className="p-3">รายการ/คำอธิบาย</th>
                      <th className="p-3 text-right">จำนวนเงิน</th>
                      <th className="p-3 text-center">วิธีชำระ</th>
                      <th className="p-3">ผู้บันทึก</th>
                      <th className="p-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                    {loadingFinance ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-800 mb-2" />
                          <span>กำลังดึงข้อมูลบัญชี...</span>
                        </td>
                      </tr>
                    ) : currentList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400 font-bold">
                          <AlertCircle className="w-6 h-6 mx-auto text-amber-800/30 mb-2" />
                          <span>ไม่พบรายการที่ตรงกับฟิลเตอร์ตัวกรอง</span>
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((item) => {
                        const isInc = item.entryType === 'income';
                        const isSystemOrigin = Boolean(
                          item.booking_ref || 
                          item.bill_type === 'Bookings' || 
                          item.bill_type === 'Monthly' || 
                          item.category?.includes('รายเดือน') || 
                          item.category?.includes('รายวัน') || 
                          item.category?.includes('ส่วนลด') || 
                          item.category?.includes('ค่าไฟ') || 
                          item.category?.includes('ฝากของ') || 
                          item.category?.includes('คลองถม')
                        );
                        const isClosed = isDateClosed(item.date);
                        
                        let originLabel = '✍️ คีย์ผ่านสมุดบัญชี';
                        let originBg = 'bg-gray-100 text-gray-700 border-gray-200';
                        if (item.booking_ref?.startsWith('BK-') || item.category?.includes('รายเดือน') || item.bill_type === 'Monthly') {
                          originLabel = '📋 สัญญารายเดือน';
                          originBg = 'bg-purple-100 text-purple-800 border-purple-200';
                        } else if (item.category?.includes('คลองถม') || item.bill_type === 'klongthom') {
                          originLabel = '🎪 คลองถม';
                          originBg = 'bg-blue-100 text-blue-800 border-blue-200';
                        } else if (isSystemOrigin) {
                          originLabel = '🗓️ จองรายวัน';
                          originBg = 'bg-amber-100 text-amber-900 border-amber-200';
                        }

                        return (
                          <tr key={`${item.id}-${item.entryType}`} className="hover:bg-amber-50/20 transition-colors">
                            <td className="p-3 whitespace-nowrap text-gray-800 font-bold">{item.date}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isInc 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}>
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 max-w-[220px]">
                              <div className="flex flex-col gap-1">
                                <span className="font-extrabold text-gray-800 break-words">
                                  {item.description || item.item || '-'}
                                </span>
                                <span className={`inline-block w-fit text-[9px] px-1.5 py-0.2 rounded border font-semibold ${originBg}`}>
                                  {originLabel}
                                </span>
                              </div>
                            </td>
                            <td className={`p-3 text-right font-black whitespace-nowrap ${
                              isInc ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {isInc ? '+' : '-'}{item.amount.toLocaleString()}.-
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.method?.includes('สด') 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}>
                                {item.method?.includes('สด') ? '💵 เงินสด' : '📱 โอนเงิน'}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-gray-500 whitespace-nowrap font-medium">{item.officer}</td>
                            <td className="p-3 text-center">
                              {isSystemOrigin ? (
                                <span 
                                  className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-1 rounded cursor-help" 
                                  title="รายการนี้มาจากระบบจอง/สัญญาเช่า หากต้องการแก้ไขหรือยกเลิก กรุณาไปแก้ไขที่หน้าต้นทางของรายการนั้นๆ"
                                >
                                  <Lock className="w-2.5 h-2.5 text-gray-400" /> แก้ที่ต้นทาง
                                </span>
                              ) : isClosed ? (
                                <span 
                                  className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded cursor-help" 
                                  title="วันที่นี้ทำการปิดยอดบัญชีเรียบร้อยแล้ว ข้อมูลถูกล็อคถาวรไม่สามารถแก้ไขหรือลบได้"
                                >
                                  <Lock className="w-2.5 h-2.5 text-amber-800" /> ปิดยอดแล้ว
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id, item.entryType)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-all active:scale-95 cursor-pointer border border-transparent hover:border-rose-200"
                                  title="ลบรายการที่คีย์ผ่านสมุดบัญชีนี้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {currentList.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  {/* Left: Entries Info & Page Size Selector */}
                  <div className="flex items-center gap-2 text-gray-600 font-semibold text-[11px]">
                    <span>แสดง {startIndex + 1} - {endIndex} จากทั้งหมด {currentList.length} รายการ</span>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1">
                      <span>แถวต่อหน้า:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Page Navigation Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={safeCurrentPage === 1}
                      className="p-1 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="หน้าแรก"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                      className="p-1 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="หน้าก่อนหน้า"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-2 font-bold text-[11px] text-gray-700">
                      หน้า {safeCurrentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="หน้าถัดไป"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                      title="หน้าสุดท้าย"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Daily Closing Modal */}
      <DailyClosingModal
        isOpen={showDailyClosingModal}
        onClose={() => {
          setShowDailyClosingModal(false);
          loadData();
        }}
        defaultDate={defaultDate || startDate || new Date().toISOString().split('T')[0]}
      />

    </div>
  );
}
