'use client';

import React from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { Search, CalendarDays, RotateCcw, Loader2, Plus, Trash2, X, FileText, Info, PlusCircle, Printer, Banknote, CalendarX, AlertCircle, CheckCircle } from 'lucide-react';
import { monthNamesFull } from '@/utils/thaiDateHelper';
import NewMonthlyModal from './NewMonthlyModal';
import EditMonthlyModal from './EditMonthlyModal';
import MonthlyPaymentModal from './MonthlyPaymentModal';
import BulkRenewModal from './BulkRenewModal';
import PreRenewalEditSubModal from './PreRenewalEditSubModal';
import InvoicePreviewModal from './InvoicePreviewModal';
import MonthlyPrintModal from './MonthlyPrintModal';
import SlipPreviewModal from './SlipPreviewModal';
import MonthlyReceiptPreviewModal from './MonthlyReceiptPreviewModal';
import MonthlyTableFooter from './MonthlyTableFooter';
import { calculateMonthlySummaryStats } from '@/services/monthly/monthlyStatsService';

export default function MonthlyMgmtModal() {
  const {
    activeMonthlyBooking,    activeMonthlyTransactions,    cleanStallName,    fetchMonthlyTransactions,    filteredMonthlyList,    formatBookingMonth,    handleDeleteMonthlyBooking,    handleOpenBulkRenewModal,    handleOpenEditMonthlyModal,    handleOpenNewMonthlyModal,    handlePrintMonthlyInvoice,    handlePrintMonthlyReceiptDirect,    handleShowMonthlyReceiptPreview,    handleOpenMonthlyPaymentModal,    handleDeleteMonthlyTransaction,    handleSortToggle,    handleToggleNonRenewal,    loadingMonthly,    loadingMonthlyTxns,    monthlyList,    monthlyMonthFilter,    monthlySearchQuery,    note,    parseNumber,    renderSortArrow,    setActiveMonthlyBooking,    setMonthlyMonthFilter,    setMonthlyPaymentForm,    setMonthlySearchQuery,    setShowMonthlyMgmtModal,    setShowMonthlyPaymentModal,    setSlipPreviewUrl,    setFullScreenSlipUrl,    showMonthlyMgmtModal,    sortThaiMonthsDescending,    stalls,
    alertInfo,    setAlertInfo,    confirmInfo
  } = useMonthlyBooking();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [monthlyMonthFilter, monthlySearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMonthlyList.length / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summaryStats = React.useMemo(() => {
    return calculateMonthlySummaryStats(filteredMonthlyList, stalls);
  }, [filteredMonthlyList, stalls]);

  const paginatedList = React.useMemo(() => {
    if (pageSize >= 9999) return filteredMonthlyList;
    const start = (currentPage - 1) * pageSize;
    return filteredMonthlyList.slice(start, start + pageSize);
  }, [filteredMonthlyList, currentPage, pageSize]);

  if (!showMonthlyMgmtModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-7xl border-2 border-[#8B4513] overflow-hidden animate-pop-in flex flex-col h-[90vh] max-h-[90vh]">
            <div className="bg-[#5D4037] text-white px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-[#8B4513]">
              <h3 className="font-bold text-sm flex items-center gap-1.5">🗓️ จัดการลูกค้ารายเดือน (Monthly Bookings)</h3>
              <button onClick={() => setShowMonthlyMgmtModal(false)} className="text-amber-200 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Top Toolbar Action Bar */}
            <div className="bg-gray-50 px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewMonthlyModal}
                  className="px-3 py-1.5 bg-[#8B5A2B] hover:bg-[#6D4C41] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  จองล็อครายเดือน
                </button>
                <button
                  type="button"
                  onClick={handleOpenBulkRenewModal}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  ต่อสัญญา
                </button>
              </div>

              {/* ค้นหาและตัวกรองรายเดือน */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* ช่องค้นหา */}
                <div className="relative">
                  <input
                    type="text"
                    value={monthlySearchQuery}
                    onChange={(e) => setMonthlySearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ, เบอร์โทร, แผงค้า..."
                    className="w-48 pl-7 pr-7 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  {monthlySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMonthlySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-extrabold text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-amber-700" />
                    ตัวกรองรายเดือน:
                  </span>
                  <select
                    value={monthlyMonthFilter}
                    onChange={(e) => setMonthlyMonthFilter(e.target.value)}
                    className="p-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
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
                  {loadingMonthly && <Loader2 className="w-4 h-4 text-amber-800 animate-spin" />}
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-5 flex flex-col md:flex-row gap-5 flex-1 min-h-0 overflow-hidden">
              {/* Left Side: List panel */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
                <div className="overflow-y-auto overflow-x-auto border border-gray-200 rounded-lg flex-1 min-h-0 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5E6D3] text-[#3E2723] border-b font-bold sticky top-0 z-10">
                      <tr>
                        <th 
                          onClick={() => handleSortToggle('booking_month')}
                          className="p-2 cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors whitespace-nowrap"
                        >
                          <div className="inline-flex items-center gap-1">
                            <span>เดือน</span>
                            <span className="text-[10px] text-amber-900/70">{renderSortArrow('booking_month')}</span>
                          </div>
                        </th>
                        <th className="p-2 select-none whitespace-nowrap">ลูกค้า</th>
                        <th className="p-2 select-none whitespace-nowrap">ล็อค</th>
                        <th 
                          onClick={() => handleSortToggle('total_price')}
                          className="p-2 text-center cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors whitespace-nowrap"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>ค่าล็อค</span>
                            <span className="text-[10px] text-amber-900/70">{renderSortArrow('total_price')}</span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortToggle('paid_amount')}
                          className="p-2 text-center cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors whitespace-nowrap"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>ชำระแล้ว</span>
                            <span className="text-[10px] text-amber-900/70">{renderSortArrow('paid_amount')}</span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortToggle('remaining')}
                          className="p-2 text-center cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors whitespace-nowrap"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>คงเหลือ</span>
                            <span className="text-[10px] text-amber-900/70">{renderSortArrow('remaining')}</span>
                          </div>
                        </th>
                        <th className="p-2 text-center select-none whitespace-nowrap">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {paginatedList.map((item) => {
                        const unpaidBalance = parseNumber(item.total_price) - parseNumber(item.paid_amount || 0);
                        return (
                          <tr 
                            key={item.id} 
                            onClick={() => {
                              setActiveMonthlyBooking(item);
                              fetchMonthlyTransactions(item.id);
                            }}
                            className={`hover:bg-[#F5E6D3]/20 cursor-pointer transition-colors ${
                              activeMonthlyBooking?.id === item.id ? 'bg-[#F5E6D3]/60 hover:bg-[#F5E6D3]/80' : ''
                            }`}
                          >
                            <td className="p-2 font-semibold text-gray-700">
                              {formatBookingMonth(item.booking_month)}
                            </td>
                            <td className="p-2">
                              <div className="font-bold text-gray-800">{item.booker_name || item.customer_name}</div>
                              <div className="text-[10px] text-amber-900/90 font-bold">{item.product || '-'}</div>
                            </td>
                            <td className="p-2 font-bold text-[#8B4513]">{cleanStallName(item.stalls)}</td>
                            <td className="p-2 text-center font-semibold text-gray-800">
                              {parseNumber(item.total_price).toLocaleString()}.-
                            </td>
                            <td className="p-2 text-center font-semibold text-green-700">
                              {parseNumber(item.paid_amount || 0).toLocaleString()}.-
                            </td>
                            <td className={`p-2 text-center font-bold ${unpaidBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                              {parseNumber(unpaidBalance).toLocaleString()}.-
                            </td>
                            <td className="p-2 text-left pl-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1 justify-start">
                                <button
                                  onClick={() => handleToggleNonRenewal(item)}
                                  className={`p-1.5 rounded border transition-all cursor-pointer ${
                                    item.renewal_status === 'ไม่ต่อสัญญา'
                                      ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-sm'
                                      : 'bg-red-50/40 text-red-500 border-red-200 hover:bg-red-100/60'
                                  }`}
                                  title={item.renewal_status === 'ไม่ต่อสัญญา' ? "คลิกเพื่อยกเลิกแจ้งไม่ต่อสัญญา" : "คลิกเพื่อแจ้งไม่ต่อสัญญา"}
                                >
                                  <CalendarX className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleOpenEditMonthlyModal(item)}
                                  className="px-2 py-1 bg-[#F5E6D3] text-[#8B4513] border border-[#D7CCC8] rounded text-[10px] font-bold hover:bg-[#EFEBE9] cursor-pointer"
                                >
                                  แก้ไข
                                </button>
                                <button 
                                  onClick={() => handleDeleteMonthlyBooking(item)}
                                  className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <MonthlyTableFooter
                  totalItems={filteredMonthlyList.length}
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

              {/* Right Side: Selected Booking History & Details */}
              <div className="w-full md:w-[400px] shrink-0 border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col min-h-0 h-full overflow-hidden">
                {activeMonthlyBooking ? (
                  <div className="flex flex-col gap-3 h-full overflow-hidden min-h-0">
                    <div className="border-b pb-2 shrink-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-xs text-[#3E2723] flex items-center gap-1.5 mt-1"><Banknote className="w-4 h-4" /> ประวัติการชำระเงิน</h4>
                        <div className="flex flex-col gap-1 items-end">
                          <button
                            type="button"
                            onClick={() => handleOpenMonthlyPaymentModal(activeMonthlyBooking)}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer w-28 justify-center"
                          >
                            <Plus className="w-3 h-3" /> ชำระเงิน
                          </button>
                          {parseNumber(activeMonthlyBooking?.paid_amount || 0) > 0 || activeMonthlyTransactions.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleShowMonthlyReceiptPreview(activeMonthlyBooking)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer w-28 justify-center"
                            >
                              <Printer className="w-3 h-3" /> พิมพ์ใบเสร็จ
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePrintMonthlyInvoice(activeMonthlyBooking)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer w-28 justify-center"
                              title="พิมพ์ใบแจ้งหนี้/เรียกเก็บเงินสำหรับผู้ที่ยังไม่ได้ชำระ"
                            >
                              <FileText className="w-3 h-3" /> ใบแจ้งหนี้
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1 font-bold">
                        ผู้เช่า: <span className="text-[#8B4513]">{activeMonthlyBooking.booker_name}</span> | ล็อค: <span className="text-[#8B4513]">{cleanStallName(activeMonthlyBooking.stalls)}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        ยอดเช่า: <span className="font-semibold text-gray-700">{parseNumber(activeMonthlyBooking?.total_price).toLocaleString()}.-</span> | ชำระแล้ว: <span className="font-semibold text-green-700">{parseNumber(activeMonthlyBooking?.paid_amount || 0).toLocaleString()}.-</span> | คงเหลือ: <span className="font-semibold text-red-600">{(parseNumber(activeMonthlyBooking?.total_price) - parseNumber(activeMonthlyBooking?.paid_amount || 0)).toLocaleString()}.-</span>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 pr-1 min-h-0">
                      {loadingMonthlyTxns ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 text-amber-800 animate-spin" />
                        </div>
                      ) : activeMonthlyTransactions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {activeMonthlyTransactions.map((txn, idx) => (
                            <div key={txn.id || idx} className="bg-gray-50 border border-gray-200 rounded p-2.5 text-xs flex flex-col gap-1 shadow-sm">
                              <div className="flex justify-between items-center font-bold text-gray-800">
                                <span>{txn.category || 'ค่าเช่า'}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-green-700 text-sm">{txn.total_amount?.toLocaleString() || 0}.-</span>
                                  {(() => {
                                    const txTime = new Date(txn.timestamp || txn.date).getTime();
                                    const diffHours = (new Date().getTime() - txTime) / (1000 * 60 * 60);
                                    return diffHours <= 24 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMonthlyTransaction(txn)}
                                        className="text-red-500 hover:text-red-750 transition-colors p-0.5 cursor-pointer"
                                        title="ยกเลิก/ลบรายการชำระเงิน"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="flex justify-between text-[10px] text-gray-500">
                                <span>วันที่: {new Date(txn.timestamp || txn.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="bg-[#F5E6D3] text-[#8B4513] px-1.5 py-0.5 rounded font-bold">{txn.method || 'โอนจ่าย'}</span>
                              </div>
                              {txn.note && (
                                <div className="text-[10px] text-gray-500 italic bg-white p-1 rounded border border-gray-100 mt-0.5">
                                  โน้ต: {txn.note}
                                </div>
                              )}
                              {(() => {
                                const isCashOrDiscount = txn.method === 'เงินสด' || txn.method === 'Cash' || txn.method === 'ส่วนลด';
                                const hasValidSlip = !isCashOrDiscount && txn.slip_url && typeof txn.slip_url === 'string' && (
                                  txn.slip_url.startsWith('http://') || 
                                  txn.slip_url.startsWith('https://') || 
                                  txn.slip_url.startsWith('data:image/') || 
                                  txn.slip_url.startsWith('blob:')
                                );

                                if (!hasValidSlip) return null;

                                return (
                                  <div className="mt-1.5 flex items-center justify-between bg-blue-50/50 p-1.5 rounded border border-blue-100/50 text-[10px]">
                                    <span className="text-blue-900 font-bold flex items-center gap-1">📎 มีหลักฐานการโอนเงิน (สลิป)</span>
                                    <button
                                      type="button"
                                      onClick={() => setFullScreenSlipUrl(txn.slip_url)}
                                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer transition-all active:scale-95 text-[9px]"
                                    >
                                      ดูรูปภาพสลิป
                                    </button>
                                  </div>
                                );
                              })()}
                              <div className="text-[9px] text-gray-400 text-right mt-0.5">ผู้ทำรายการ: {txn.officer || '-'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-12 flex flex-col items-center justify-center gap-1.5">
                          <FileText className="w-8 h-8 text-gray-300" />
                          <span>ไม่มีประวัติธุรกรรมการชำระเงิน</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full text-gray-400 my-auto py-12">
                    <Info className="w-8 h-8 text-amber-300 animate-bounce mb-2" />
                    <span className="text-xs font-bold text-[#8B4513]">คลิกลิสต์รายชื่อลูกค้ารายเดือนด้านซ้าย เพื่อดูประวัติธุรกรรมการเงิน</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Sub-Modals */}
          <NewMonthlyModal />
          <EditMonthlyModal />
          <MonthlyPaymentModal />
          <BulkRenewModal />
          <PreRenewalEditSubModal />
          <InvoicePreviewModal />
          <MonthlyPrintModal />
          <SlipPreviewModal />
          <MonthlyReceiptPreviewModal />

          {/* Toast Alert for Monthly Actions */}
          {alertInfo && (
            <div className={`fixed top-4 right-4 z-[99999] flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 animate-bounce-in max-w-md ${
              alertInfo.isError 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              {alertInfo.isError ? <AlertCircle className="w-5 h-5 shrink-0 text-red-600" /> : <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />}
              <span className="font-bold whitespace-pre-line flex-1">{alertInfo.message}</span>
              <button 
                onClick={() => setAlertInfo(null)}
                className="p-0.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Confirm Dialog for Monthly Actions */}
          {confirmInfo && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in text-[#4A3B32]">
                <div className="bg-[#FAEBD7] border-b border-[#8B4513]/20 px-4 py-3 font-bold text-sm text-[#4A3B32]">
                  {confirmInfo.title}
                </div>
                <div className="p-5 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {confirmInfo.message}
                </div>
                <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => confirmInfo.onCancel ? confirmInfo.onCancel() : setConfirmInfo(null)}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {confirmInfo.cancelText || 'ยกเลิก'}
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmInfo.onConfirm && confirmInfo.onConfirm()}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                      confirmInfo.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#8B4513] hover:bg-[#6D3410]'
                    }`}
                  >
                    {confirmInfo.confirmText || 'ตกลง'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
  );
}
