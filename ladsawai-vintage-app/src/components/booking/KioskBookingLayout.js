"use client";

import React, { useRef, useState, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";
import StallMapGrid from "@/components/booking/StallMapGrid";
import BookingDetailModal from "@/components/booking/modals/BookingDetailModal";
import { 
  CalendarDays, Search, RefreshCw, ChevronLeft, ChevronRight,
  Sparkles, Leaf, ShoppingBag, Sun, MessageCircle, Info
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
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-between text-stone-800 font-sans selection:bg-amber-200">
      
      {/* 1. Header (Unified Signature Vintage Aesthetic) */}
      <header className="sticky top-0 z-40 bg-[AntiqueWhite] border-b-3 border-[#8B4513] shadow-md py-2 px-3 md:px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="LVT Logo" 
                className="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-md transition-transform hover:scale-105" 
              />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <h1 className="text-base md:text-lg font-black tracking-tight text-[#4A3B32] leading-tight">
                    ตลาดนัดลาดสวายวินเทจ
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-800 border border-green-300 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    ผังสด Realtime
                  </span>
                </div>
                <p className="text-[10px] md:text-xs text-[#8B4513]/80 font-semibold">
                  ผังตรวจสอบสถานะและจองล็อคตลาดออนไลน์
                </p>
              </div>
            </div>

            {/* Mobile Actions: Refresh & LINE */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={loading || isRefreshing}
                className="p-2 bg-amber-50 hover:bg-amber-100 active:scale-95 text-[#8B4513] rounded-full border border-amber-300 transition-all cursor-pointer disabled:opacity-50"
                title="รีเฟรชผัง"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? "animate-spin text-amber-700" : ""}`} />
              </button>
              <a
                href="https://line.me/R/oaMessage/@ladsawaivintage/?สวัสดีครับ สอบถามข้อมูลตลาดนัดลาดสวายวินเทจ"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>LINE</span>
              </a>
            </div>
          </div>

          {/* Quick Date Selector (Wed / Sat / Sun Day-themed Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto py-0.5 no-scrollbar justify-center">
            <button 
              type="button"
              onClick={() => setDateOffset(prev => Math.max(0, prev - 1))}
              className="p-1.5 rounded-full hover:bg-amber-100 text-[#8B4513] transition-colors disabled:opacity-30 cursor-pointer shrink-0"
              disabled={dateOffset === 0}
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-1.5 sm:gap-2">
              {quickDates.map((d) => {
                const isActive = d.dateStr === selectedDate;
                let btnStyle = "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100";
                let Icon = CalendarDays;
                
                if (d.dayOfWeek === 3) { // Wednesday (Green)
                  btnStyle = isActive 
                    ? "bg-green-700 text-white border-green-800 shadow-md font-black scale-105" 
                    : "bg-green-50/90 text-green-800 border-green-300 hover:bg-green-100";
                  Icon = Leaf;
                } else if (d.dayOfWeek === 6) { // Saturday (Purple)
                  btnStyle = isActive 
                    ? "bg-purple-700 text-white border-purple-800 shadow-md font-black scale-105" 
                    : "bg-purple-50/90 text-purple-800 border-purple-300 hover:bg-purple-100";
                  Icon = ShoppingBag;
                } else if (d.dayOfWeek === 0) { // Sunday (Red)
                  btnStyle = isActive 
                    ? "bg-red-700 text-white border-red-800 shadow-md font-black scale-105" 
                    : "bg-red-50/90 text-red-800 border-red-300 hover:bg-red-100";
                  Icon = Sun;
                }

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center justify-center gap-1.5 transition-all duration-200 whitespace-nowrap cursor-pointer ${btnStyle}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{d.formattedLabel}</span>
                  </button>
                );
              })}
            </div>

            <button 
              type="button"
              onClick={() => setDateOffset(prev => prev + 1)}
              className="p-1.5 rounded-full hover:bg-amber-100 text-[#8B4513] transition-colors cursor-pointer shrink-0"
              title="วันถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar & Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Stall Search Input */}
            <div className="relative w-48 xl:w-56">
              <input 
                type="text" 
                placeholder="ค้นหาแผง เช่น 13/2..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-8 pr-3 py-1.5 w-full rounded-full border border-amber-300 bg-amber-50/60 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-gray-800 shadow-inner placeholder:text-gray-400"
              />
              <Search className="w-3.5 h-3.5 text-amber-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
              
              {/* Search dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border-2 border-[#8B4513] rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-amber-100 animate-fade-in">
                  {searchResults.map((res) => (
                    <button
                      key={res.stall.name}
                      type="button"
                      onClick={() => selectSearchResult(res)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="font-extrabold text-[#4A3B32]">แผง {res.stall.name}</span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">{res.stall.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-[#8B4513] rounded-full text-xs font-bold border border-amber-300 transition-all cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูลผังล่าสุด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? "animate-spin text-amber-700" : ""}`} />
              <span>{isRefreshing ? "อัปเดต..." : "รีเฟรช"}</span>
            </button>

            {/* LINE Official Contact Button */}
            <a
              href="https://line.me/R/oaMessage/@ladsawaivintage/?สวัสดีครับ สอบถามข้อมูลตลาดนัดลาดสวายวินเทจ"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] active:scale-95 text-white rounded-full text-xs font-black shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>ติดต่อจอง LINE</span>
            </a>
          </div>

        </div>

        {/* Mobile Search Bar (Appears under date selector on small screens) */}
        <div className="mt-2 lg:hidden relative w-full">
          <input 
            type="text" 
            placeholder="ค้นหาแผงค้า เช่น 13/2, พื้น1..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-8 pr-3 py-1.5 w-full rounded-full border border-amber-300 bg-amber-50/70 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-gray-800 shadow-inner placeholder:text-gray-400"
          />
          <Search className="w-3.5 h-3.5 text-amber-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
          
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white border-2 border-[#8B4513] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-amber-100 animate-fade-in">
              {searchResults.map((res) => (
                <button
                  key={res.stall.name}
                  type="button"
                  onClick={() => selectSearchResult(res)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-extrabold text-[#4A3B32]">แผง {res.stall.name}</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">{res.stall.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. Sub-header: Minimalist Legend & Guide Bar */}
      <div className="bg-[#FAEBD7] border-b border-[#8B4513]/30 px-3 py-1.5 text-xs text-[#5D4037]">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-[#4CAF50] border border-green-700 inline-block"></span>
              <span>อาหาร (ว่าง)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-[#00BCD4] border border-cyan-700 inline-block"></span>
              <span>เสื้อผ้า/ทั่วไป (ว่าง)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-[#FF9800] border border-orange-600 inline-block"></span>
              <span>ขาประจำ</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-[#E53935] border border-red-700 inline-block"></span>
              <span>จองแล้ว</span>
            </span>
          </div>

          {/* Quick Tip for Customers */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>แตะที่แผงเพื่อดูราคาและส่งข้อความจองผ่าน LINE ทันที</span>
          </div>

        </div>
      </div>

      {/* 3. Stall Map Grid (Centered Hero Content) */}
      <main className="flex-1 w-full overflow-x-auto p-2 sm:p-4 flex flex-col items-center justify-start my-auto">
        <div className="w-full flex justify-center pb-6">
          <StallMapGrid />
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="bg-[#5D4037] text-amber-100 text-center py-2.5 px-4 text-xs border-t-2 border-[#8B4513]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p className="font-bold">ตลาดนัดลาดสวายวินเทจ • เปิดทุกวันพุธ เสาร์ อาทิตย์</p>
          <p className="text-amber-200/80 font-medium">LINE Official: <strong className="text-amber-200">@ladsawaivintage</strong></p>
        </div>
      </footer>

      {/* 5. Customer Booking Detail Modal */}
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
