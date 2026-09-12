"use client";

import React, { useRef, useState, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import StallMapGrid from "@/components/booking/StallMapGrid";
import BookingDetailModal from "@/components/booking/modals/BookingDetailModal";
import { 
  Store, Calendar, Search, RefreshCw, ChevronLeft, ChevronRight,
  MessageCircle, Sparkles, MapPin, CheckCircle2
} from "lucide-react";

export default function KioskBookingLayout() {
  const {
    stalls,
    bookings,
    selectedDate,
    setSelectedDate,
    quickDates,
    dateOffset,
    setDateOffset,
    searchQuery,
    searchResults,
    handleSearch,
    selectSearchResult,
    fetchBookingsAndStorage,
    loading,
    // Booking modal props
    showBookingModal,
    setShowBookingModal,
    selectedStall,
    selectedBooking,
    getStallStatus,
    getBookingCustomerType,
    stallPrice,
    setStallPrice,
    elecUnit,
    setElecUnit,
    elecPrice,
    setElecPrice,
    bookerName,
    setBookerName,
    product,
    setProduct,
    note,
    setNote,
    paymentList,
    setPaymentList,
    selectedStallsList,
    setSelectedStallsList,
    calculateDefaultStallPrice,
    showAddStallSelect,
    setShowAddStallSelect,
    stallFilter,
    setStallFilter,
    addStallDropdownRef,
    handleSaveBooking,
    handleDeleteBooking,
    handlePrintReceipt,
    handleShowReceiptPreview,
    handleMarkAbsent,
    setShowMoveLockModal,
    setShowAddUtilityModal,
    setAddUtilityUnit,
    setAddUtilityPrice,
    setAddUtilityMethod
  } = useBooking();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchBookingsAndStorage({ silent: false });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] flex flex-col justify-between text-stone-800 font-sans selection:bg-amber-200">
      
      {/* 1. Header (Clean Customer Branding) */}
      <header className="sticky top-0 z-40 bg-[#5D4037] text-[#FFF8E7] shadow-lg border-b-2 border-[#8B4513]/40 px-3 py-2.5 md:px-6 md:py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="LVT Logo" 
              className="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-md transition-transform hover:scale-105" 
            />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm md:text-lg font-black tracking-tight text-amber-200 drop-shadow-xs">
                  ตลาดนัดลาดสวายวินเทจ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-500/20 text-green-300 border border-green-400/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  ผังสด Realtime
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-amber-100/80 font-medium">
                ผังตรวจสอบสถานะและจองล็อคตลาดออนไลน์
              </p>
            </div>
          </div>

          {/* Quick Actions for Customers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B4513]/80 hover:bg-[#8B4513] active:scale-95 text-amber-100 rounded-lg text-xs font-bold border border-amber-500/30 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูลผังล่าสุด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? "animate-spin text-amber-300" : ""}`} />
              <span className="hidden sm:inline">{isRefreshing ? "กำลังอัปเดต..." : "อัปเดตผัง"}</span>
            </button>

            <a
              href="https://line.me/R/oaMessage/@ladsawaivintage/?สวัสดีครับ สอบถามข้อมูลตลาดนัดลาดสวายวินเทจ"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] active:scale-95 text-white rounded-lg text-xs font-extrabold shadow-md transition-all hover:shadow-lg cursor-pointer"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" 
                alt="LINE" 
                className="w-4 h-4 filter invert" 
              />
              <span className="hidden md:inline">ติดต่อตลาด</span>
              <span className="md:hidden">LINE</span>
            </a>
          </div>

        </div>
      </header>

      {/* 2. Main Navigation Controls (Date Pills & Search Bar) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2.5 md:p-4 flex flex-col gap-3">
        
        {/* Date Selector & Search Box Container */}
        <div className="bg-white/85 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-md border border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Date Selector Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar justify-start md:justify-center">
            <button
              type="button"
              onClick={() => setDateOffset(prev => Math.max(0, prev - 3))}
              disabled={dateOffset === 0}
              className="p-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:bg-amber-100 disabled:opacity-30 cursor-pointer shrink-0"
              title="สัปดาห์ก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {quickDates.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex flex-col items-center gap-0.5 border ${
                    isSelected
                      ? "bg-[#8B4513] text-white border-[#5D4037] shadow-md scale-105"
                      : "bg-amber-50/60 text-stone-700 border-amber-200/70 hover:bg-amber-100/80"
                  }`}
                >
                  <span className="text-[11px] md:text-xs font-extrabold">{item.formattedLabel}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setDateOffset(prev => prev + 3)}
              className="p-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:bg-amber-100 cursor-pointer shrink-0"
              title="สัปดาห์ถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Stall & Product Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="ค้นหาแผงค้า เช่น 13/2, พื้น1..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white shadow-inner"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-amber-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                {searchResults.map((res) => (
                  <button
                    key={res.stall.name}
                    type="button"
                    onClick={() => selectSearchResult(res)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-black text-amber-900">แผง {res.stall.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{res.stall.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 3. Instructions & Visual Legend */}
        <div className="bg-amber-100/60 border border-amber-300/60 rounded-xl px-3 py-2 text-center text-xs text-amber-950 font-medium flex flex-wrap items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
          <span>คลิกที่ <strong>แผงสีเขียว (อาหาร)</strong> หรือ <strong>แผงสีฟ้า (เสื้อผ้า/ทั่วไป)</strong> เพื่อดูราคาและติดต่อจองผ่าน LINE</span>
        </div>

        {/* 4. Stall Map Grid Display */}
        <div className="w-full overflow-x-auto flex justify-center my-auto pb-4">
          <StallMapGrid />
        </div>

      </main>

      {/* 5. Footer (Simple info) */}
      <footer className="bg-[#5D4037] text-amber-100/70 text-center py-3 text-xs border-t border-[#8B4513]/40">
        <p className="font-bold">ตลาดนัดลาดสวายวินเทจ • เปิดทุกวันพุธ เสาร์ อาทิตย์</p>
        <p className="text-[10px] text-amber-200/50 mt-0.5">Line Official: @ladsawaivintage</p>
      </footer>

      {/* 6. Customer Booking Detail Modal */}
      <BookingDetailModal
        showBookingModal={showBookingModal}
        setShowBookingModal={setShowBookingModal}
        selectedStall={selectedStall}
        selectedBooking={selectedBooking}
        selectedDate={selectedDate}
        getStallStatus={getStallStatus}
        getBookingCustomerType={getBookingCustomerType}
        stallPrice={stallPrice}
        setStallPrice={setStallPrice}
        elecUnit={elecUnit}
        setElecUnit={setElecUnit}
        elecPrice={elecPrice}
        setElecPrice={setElecPrice}
        bookerName={bookerName}
        setBookerName={setBookerName}
        product={product}
        setProduct={setProduct}
        note={note}
        setNote={setNote}
        paymentList={paymentList}
        setPaymentList={setPaymentList}
        selectedStallsList={selectedStallsList}
        setSelectedStallsList={setSelectedStallsList}
        calculateDefaultStallPrice={calculateDefaultStallPrice}
        showAddStallSelect={showAddStallSelect}
        setShowAddStallSelect={setShowAddStallSelect}
        stallFilter={stallFilter}
        setStallFilter={setStallFilter}
        addStallDropdownRef={addStallDropdownRef}
        stalls={stalls}
        bookings={bookings}
        handleSaveBooking={handleSaveBooking}
        handleDeleteBooking={handleDeleteBooking}
        handlePrintReceipt={handlePrintReceipt}
        handleShowReceiptPreview={handleShowReceiptPreview}
        handleMarkAbsent={handleMarkAbsent}
        setShowMoveLockModal={setShowMoveLockModal}
        setShowAddUtilityModal={setShowAddUtilityModal}
        setAddUtilityUnit={setAddUtilityUnit}
        setAddUtilityPrice={setAddUtilityPrice}
        setAddUtilityMethod={setAddUtilityMethod}
      />

    </div>
  );
}
