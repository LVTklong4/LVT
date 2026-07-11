'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Search, Settings, CalendarDays, RotateCcw, User, Loader2, Plus, Trash2, CheckCircle, AlertCircle, X, CreditCard, FileText, Phone, Info, Sun, PlusCircle, Printer, Banknote, Check, Tag, CalendarX } from 'lucide-react';

import NewMonthlyModal from './modals/NewMonthlyModal';
import EditMonthlyModal from './modals/EditMonthlyModal';
import MonthlyPaymentModal from './modals/MonthlyPaymentModal';
import SlipPreviewModal from './modals/SlipPreviewModal';
import BulkRenewModal from './modals/BulkRenewModal';
import PreRenewalEditSubModal from './modals/PreRenewalEditSubModal';
import InvoicePreviewModal from './modals/InvoicePreviewModal';
import MonthlyPrintModal from './modals/MonthlyPrintModal';

export default function MonthlyManagerLayout() {
  const {
    activeMonthlyBooking,    activeMonthlyTransactions,    addStallDropdownRefSat,    addStallDropdownRefSun,    addStallDropdownRefWed,    adminUser,    alertInfo,    bulkRenewCheckedIds,    bulkRenewEditData,    bulkRenewEditingItem,    bulkRenewFromMonth,    cleanStallName,    computeNextMonthThai,    fetchMonthlyTransactions,    formatBookingMonth,    getDayOccurrences,    getNewMonthlyPricing,    getOccupiedStallsInRound,    handleBulkRenewSubmit,    handleCreateNewMonthlyBooking,    handleDeleteMonthlyBooking,    handleMonthlyPaymentSubmit,    handleOpenBulkRenewModal,    handleOpenEditMonthlyModal,    handleOpenNewMonthlyModal,    handlePrintMonthlyInvoice,    handlePrintMonthlyReceipt,    handlePrintMonthlyReceiptDirect,    handleSaveEditedMonthlyBooking,    handleSlipChange,    handleSortToggle,    handleToggleNonRenewal,    handleUpdateMonthlyItem,    invoicePreviewItem,    isEditingMonthlyMode,    loadingMonthly,    loadingMonthlyTxns,    monthlyList,    monthlyMonthFilter,    monthlyPaymentForm,    monthlyPrintItem,    monthlyPrintMonth,    monthlyPrintProduct,    monthlyPrintSatCount,    monthlyPrintSunCount,    monthlyPrintWedCount,    monthlySearchQuery,    newMonthlyBookerName,    newMonthlyCustomerType,    newMonthlyDays,    newMonthlyElecUnit,    newMonthlyNote,    newMonthlyPhone,    newMonthlyProduct,    newMonthlyStallsSat,    newMonthlyStallsSun,    newMonthlyStallsWed,    newMonthlyStartDate,    newMonthlyStorageFee,    note,    parseNumber,    product,    renderSortArrow,    satTotal,    selectedMonthlyItem,    setActiveMonthlyBooking,    setBulkRenewCheckedIds,    setBulkRenewEditData,    setBulkRenewEditingItem,    setBulkRenewFromMonth,    setInvoicePreviewItem,    setMonthlyMonthFilter,    setMonthlyPaymentForm,    setMonthlyPrintMonth,    setMonthlyPrintProduct,    setMonthlyPrintSatCount,    setMonthlyPrintSunCount,    setMonthlyPrintWedCount,    setMonthlySearchQuery,    setNewMonthlyBookerName,    setNewMonthlyCustomerType,    setNewMonthlyDays,    setNewMonthlyElecUnit,    setNewMonthlyNote,    setNewMonthlyPhone,    setNewMonthlyProduct,    setNewMonthlyStallsSat,    setNewMonthlyStallsSun,    setNewMonthlyStallsWed,    setNewMonthlyStartDate,    setNewMonthlyStorageFee,    setSelectedMonthlyItem,    setShowAddStallSelectSat,    setShowAddStallSelectSun,    setShowAddStallSelectWed,    setShowBulkRenewModal,    setShowMonthlyPaymentModal,    setShowMonthlyPrintModal,    setShowNewMonthlyModal,    setSlipPreviewUrl,    setStallFilterSat,    setStallFilterSun,    setStallFilterWed,    showAddStallSelectSat,    showAddStallSelectSun,    showAddStallSelectWed,    showBulkRenewModal,    showMonthlyPaymentModal,    showMonthlyPrintModal,    showNewMonthlyModal,    slipPreviewUrl,    sortThaiMonthsDescending,    stallFilterSat,    stallFilterSun,    stallFilterWed,    stalls,    sunTotal,    wedTotal
  } = useBooking();

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
        {/* Header bar */}
        <div className="bg-[#5D4037] text-white px-5 py-3 flex justify-between items-center shrink-0 shadow-md border-b-2 border-[#8B4513]">
          <h3 className="font-bold text-sm flex items-center gap-1.5">🗓️ จัดการลูกค้ารายเดือน (Monthly Bookings Manager)</h3>
          <span className="text-xs bg-[#3E2723] px-3 py-1 rounded-full font-bold text-amber-100 border border-amber-900/30">แอดมิน: {adminUser?.name || 'System'}</span>
        </div>

        {/* Top Toolbar Action Bar */}
        <div className="bg-white px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
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
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
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
            </div>
          </div>
        </div>

        {/* Content columns */}
        <div className="p-5 flex flex-col md:flex-row gap-5 flex-1 overflow-hidden">
          {/* Left Side: List panel */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center shrink-0">
              <span>รายชื่อลูกค้ารายเดือน ({filteredMonthlyList.length} คน)</span>
              {loadingMonthly && <Loader2 className="w-4 h-4 text-amber-800 animate-spin" />}
            </h4>
            
            <div className="overflow-auto border border-gray-200 rounded-lg flex-1 min-h-[300px] bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5E6D3] text-[#3E2723] border-b font-bold sticky top-0 z-10">
                  <tr>
                    <th 
                      onClick={() => handleSortToggle('booking_month')}
                      className="p-2 cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors"
                    >
                      เดือน {renderSortArrow('booking_month')}
                    </th>
                    <th className="p-2 select-none">ลูกค้า</th>
                    <th className="p-2 select-none">ล็อค</th>
                    <th 
                      onClick={() => handleSortToggle('total_price')}
                      className="p-2 text-center cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors"
                    >
                      ค่าล็อค {renderSortArrow('total_price')}
                    </th>
                    <th 
                      onClick={() => handleSortToggle('paid_amount')}
                      className="p-2 text-center cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors"
                    >
                      ชำระแล้ว {renderSortArrow('paid_amount')}
                    </th>
                    <th 
                      onClick={() => handleSortToggle('remaining')}
                      className="p-2 text-center cursor-pointer hover:bg-[#EFEBE9]/50 select-none transition-colors"
                    >
                      คงเหลือ {renderSortArrow('remaining')}
                    </th>
                    <th className="p-2 text-center select-none">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {filteredMonthlyList.map((item) => {
                    const unpaidBalance = item.total_price - (item.paid_amount || 0);
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
                          <div className="font-bold text-gray-800">{item.booker_name}</div>
                          <div className="text-[10px] text-gray-500">{item.phone || '-'}</div>
                        </td>
                        <td className="p-2 font-bold text-[#8B4513]">{cleanStallName(item.stalls)}</td>
                        <td className="p-2 text-center font-semibold text-gray-800">
                          {item.total_price.toLocaleString()}.-
                        </td>
                        <td className="p-2 text-center font-semibold text-green-700">
                          {(item.paid_amount || 0).toLocaleString()}.-
                        </td>
                        <td className={`p-2 text-center font-bold ${unpaidBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                          {unpaidBalance.toLocaleString()}.-
                        </td>
                        <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-center">
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
                              onClick={() => handlePrintMonthlyInvoice(item)}
                              className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" /> แจ้งหนี้
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
          </div>

          {/* Right Side: Selected Booking History & Details */}
          <div className="w-full md:w-[400px] shrink-0 border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col min-h-[300px] md:min-h-0 h-full overflow-hidden">
            {activeMonthlyBooking ? (
              <div className="flex flex-col gap-3 h-full overflow-hidden">
                <div className="border-b pb-2 shrink-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-xs text-[#3E2723] flex items-center gap-1.5 mt-1"><Banknote className="w-4 h-4" /> ประวัติการชำระเงิน</h4>
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMonthlyPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', method: '', note: '' });
                          setShowMonthlyPaymentModal(true);
                        }}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer w-24 justify-center"
                      >
                        <Plus className="w-3 h-3" /> ชำระเงิน
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintMonthlyReceiptDirect(activeMonthlyBooking)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer w-24 justify-center"
                      >
                        <Printer className="w-3 h-3" /> พิมพ์ใบเสร็จ
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1 font-bold">
                    ผู้เช่า: <span className="text-[#8B4513]">{activeMonthlyBooking.booker_name}</span> | ล็อค: <span className="text-[#8B4513]">{cleanStallName(activeMonthlyBooking.stalls)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    ยอดเช่า: <span className="font-semibold text-gray-700">{activeMonthlyBooking.total_price.toLocaleString()}.-</span> | ชำระแล้ว: <span className="font-semibold text-green-700">{(activeMonthlyBooking.paid_amount || 0).toLocaleString()}.-</span> | คงเหลือ: <span className="font-semibold text-red-600">{(activeMonthlyBooking.total_price - (activeMonthlyBooking.paid_amount || 0)).toLocaleString()}.-</span>
                  </div>
                </div>

                <div className="overflow-auto flex-1 pr-1">
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
                            <span className="text-green-700 text-sm font-extrabold">{txn.total_amount?.toLocaleString() || 0}.-</span>
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
                          {txn.slip_url && (
                            <div className="mt-1.5 flex items-center justify-between bg-blue-50/50 p-1.5 rounded border border-blue-100/50 text-[10px]">
                              <span className="text-blue-900 font-bold flex items-center gap-1">📎 มีหลักฐานการโอนเงิน (สลิป)</span>
                              <button
                                type="button"
                                onClick={() => setSlipPreviewUrl(txn.slip_url)}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer transition-all active:scale-95 text-[9px]"
                              >
                                ดูรูปภาพสลิป
                              </button>
                            </div>
                          )}
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

        {/* 🗓️ 2.2 Edit Monthly Item Modal */}
        

        {/* 🗓️ 2.3 Add Monthly Payment Modal */}
        

        {/* 📋 2.4 Monthly Print Settings Modal */}
        

        {/* 🗓️ 2.2 New Monthly Booking Modal */}
        

        {/* 🧾 3. Invoice Preview Modal */}
        

        {/* 🔄 4. Bulk Renewal Manager Modal */}
        

        {/* 📝 4.1 Pre-renewal Edit Sub-modal */}
        

        {/* 🖼️ 5. Slip Image Preview Overlay Modal */}
        

        {/* Toast Alert */}
        {alertInfo && (
          <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 animate-bounce-in ${
            alertInfo.isError 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {alertInfo.isError ? <AlertCircle className="w-5 h-5 shrink-0 text-red-600" /> : <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />}
            <span className="font-bold">{alertInfo.message}</span>
          </div>
        )}
      
      {/* Modal Components */}
      <NewMonthlyModal />
      <EditMonthlyModal />
      <MonthlyPaymentModal />
      <SlipPreviewModal />
      <BulkRenewModal />
      <PreRenewalEditSubModal />
      <InvoicePreviewModal />
      <MonthlyPrintModal />
    </div>
  );
}
