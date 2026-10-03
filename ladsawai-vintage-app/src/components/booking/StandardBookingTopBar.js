'use client';

import React, { useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useStorage } from '@/context/StorageContext';
import { printMarketLayoutA4 } from '@/utils/marketLayoutPrinter';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Leaf,
  ShoppingBag,
  Sun,
  Search,
  Settings,
  FileText,
  Store,
  Package,
  Info,
  LayoutDashboard,
  Banknote,
  Lock,
  Printer,
  RefreshCw,
  LogOut,
  User
} from 'lucide-react';

export default function StandardBookingTopBar({
  onOpenOffGrid,
  onOpenKlongThom,
  onOpenDailyClosing
}) {
  const {
    adminUser,
    selectedDate,
    setSelectedDate,
    quickDates,
    dateOffset,
    setDateOffset,
    searchQuery,
    handleSearch,
    searchResults,
    selectSearchResult,
    fetchBookingsAndStorage,
    stalls,
    bookings,
    showAlert,
    setShowLoginModal,
    setShowMonthlyMgmtModal,
    setShowStandbyModal,
    setShowActivityLogsModal,
    setShowSettingsMgmtModal,
    handleLogout
  } = useBooking();

  const { setShowStorageMgmtModal } = useStorage();

  const [showGearDropdown, setShowGearDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[AntiqueWhite] border-b-3 border-[#8B4513] shadow-md py-2 px-4">
      <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        
        {/* Logo & title */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-11 w-11 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">ตลาดนัดลาดสวายวินเทจ</h1>
            <p className="text-[10px] text-gray-500 font-medium">Ladsawai Vintage Market System (LVMS)</p>
          </div>
        </div>

        {/* Quick Date Selector */}
        <div className="flex items-center gap-2 my-1 overflow-x-auto w-full md:w-auto py-1 no-scrollbar justify-center">
          <button 
            onClick={() => setDateOffset(prev => Math.max(0, prev - 1))}
            className="p-1.5 rounded-full hover:bg-amber-100 text-[#8B4513] transition-colors disabled:opacity-40"
            disabled={dateOffset === 0}
            title="สัปดาห์ก่อนหน้า"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
            {quickDates.map((d) => {
              const isActive = d.dateStr === selectedDate;
              let btnStyle = "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100";
              let Icon = CalendarDays;
              
              if (d.dayOfWeek === 3) { // Wednesday (Green)
                btnStyle = isActive 
                  ? "bg-green-700 text-white border-green-800 shadow-md font-bold scale-105" 
                  : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100";
                Icon = Leaf;
              } else if (d.dayOfWeek === 6) { // Saturday (Purple)
                btnStyle = isActive 
                  ? "bg-purple-700 text-white border-purple-800 shadow-md font-bold scale-105" 
                  : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100";
                Icon = ShoppingBag;
              } else if (d.dayOfWeek === 0) { // Sunday (Red)
                btnStyle = isActive 
                  ? "bg-red-700 text-white border-red-800 shadow-md font-bold scale-105" 
                  : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100";
                Icon = Sun;
              }

              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`px-2 py-1.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 transition-all duration-200 whitespace-nowrap w-[130px] ${btnStyle}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{d.formattedLabel}</span>
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setDateOffset(prev => prev + 1)}
            className="p-1.5 rounded-full hover:bg-amber-100 text-[#8B4513] transition-colors"
            title="สัปดาห์ถัดไป"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions & Authentication */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {adminUser && (
            <>
              {/* Search inputs */}
              <div className="relative max-w-[140px] md:max-w-[150px] w-full">
                <input 
                  type="text" 
                  placeholder="ค้นหาล็อค/ลูกค้า..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-8 pr-3 py-1.5 w-full rounded-full border border-amber-300 bg-amber-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-gray-800 shadow-inner"
                />
                <Search className="w-4 h-4 text-amber-700 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                
                {/* Search dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-[50] max-h-60 overflow-y-auto divide-y">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex flex-col transition-colors text-gray-700 font-medium"
                      >
                        <span className="font-bold text-[#8B4513]">{item.name}</span>
                        <span className="text-[10px] text-gray-500">{item.details}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-1.5 items-center">
                
                {/* Admin Management Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowGearDropdown(!showGearDropdown)}
                    className="p-1.5 text-[#8B4513] hover:bg-amber-100 rounded-lg transition-colors cursor-pointer" 
                    title="จัดการระบบ"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  {showGearDropdown && (
                    <>
                      {/* Backdrop to close click outside */}
                      <div className="fixed inset-0 z-45 bg-transparent" onClick={() => setShowGearDropdown(false)} />
                      
                      <div className="absolute right-0 top-full mt-1 bg-white border border-amber-200 rounded-lg shadow-xl py-1 w-44 z-50 divide-y divide-amber-50 animate-pop-in">
                        <button 
                          onClick={() => {
                            setShowGearDropdown(false);
                            onOpenOffGrid?.();
                          }} 
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-amber-700 shrink-0" /> จองนอกผัง
                        </button>
                        <button 
                          onClick={() => {
                            setShowGearDropdown(false);
                            onOpenKlongThom?.();
                          }} 
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-red-600 shrink-0" /> คลองถม
                        </button>
                        <button 
                          onClick={() => {
                            setShowGearDropdown(false);
                            setShowMonthlyMgmtModal(true);
                          }} 
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <CalendarDays className="w-4 h-4 text-blue-700 shrink-0" /> จัดการรายเดือน
                        </button>
                        <button 
                          onClick={() => {
                            setShowGearDropdown(false);
                            setShowStorageMgmtModal(true);
                          }} 
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-amber-800 shrink-0" /> จัดการฝากของ
                        </button>
                        <button 
                          onClick={() => {
                            setShowGearDropdown(false);
                            setShowStandbyModal(true);
                          }} 
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-purple-700 shrink-0" /> คิวสำรองผู้ค้า
                        </button>
                        <button 
                          onClick={() => {
                            setShowGearDropdown(false);
                            setShowActivityLogsModal(true);
                          }} 
                          className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Info className="w-4 h-4 text-emerald-700 shrink-0" /> ประวัติทีมงาน (Audit Logs)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Login / Profile control */}
          {adminUser ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)} 
                className="flex items-center justify-center focus:outline-none cursor-pointer"
                title={`ผู้ใช้งาน: ${adminUser?.name || 'Admin'}`}
              >
                <img 
                  src={adminUser?.picture || "/logo.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-amber-800 hover:border-[#8B4513] transition-all object-cover shadow-md bg-white"
                />
              </button>

              {showProfileDropdown && (
                <>
                  {/* Backdrop to close click outside */}
                  <div className="fixed inset-0 z-45 bg-transparent" onClick={() => setShowProfileDropdown(false)} />
                  
                  <div className="absolute right-0 top-full mt-2 bg-[#FFFDF9] border-2 border-[#8B4513] rounded-xl shadow-2xl w-60 z-50 divide-y divide-amber-100/50 overflow-hidden animate-pop-in text-[#4A3B32]">
                    {/* Header info */}
                    <div className="p-4 flex flex-col items-center gap-1.5 bg-[#FAEBD7] border-b border-[#8B4513]/20">
                      <h3 className="font-extrabold text-xs text-gray-800 text-center leading-tight">ตลาดนัดลาดสวายวินเทจ</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-800 text-[9px] font-black tracking-wider uppercase">
                        {adminUser?.role === 'SuperAdmin' ? 'SUPER ADMIN' : (adminUser?.role || 'ADMIN').toUpperCase()}
                      </span>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">ผู้ใช้: {adminUser?.name || 'Admin'}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1 text-xs">
                      <a 
                        href="/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2.5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-600 shrink-0" /> สรุปยอด (Dashboard)
                      </a>
                      <a 
                        href="/dashboard/finance" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2.5 transition-colors"
                      >
                        <Banknote className="w-4 h-4 text-emerald-600 shrink-0" /> บันทึกรายรับ-รายจ่าย
                      </a>
                      <a 
                        href="/kiosk" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-amber-900 font-bold flex items-center gap-2.5 transition-colors border-t border-amber-100/60"
                      >
                        <Store className="w-4 h-4 text-amber-700 shrink-0" /> 🖥️ จอแสดงผลลูกค้า (Kiosk)
                      </a>
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          onOpenDailyClosing?.();
                        }} 
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-950 font-bold flex items-center gap-2.5 transition-colors cursor-pointer border-t border-amber-100/60"
                      >
                        <Lock className="w-4 h-4 text-emerald-700 shrink-0" /> 🔒 ปิดยอดประจำวัน
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          printMarketLayoutA4({ selectedDate, stalls, bookings, adminUser, showAlert });
                        }} 
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-gray-500 shrink-0" /> พิมพ์ผังตลาด (A4)
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          fetchBookingsAndStorage();
                        }} 
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" /> อัปเดตผังล่าสุด
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowSettingsMgmtModal(true);
                        }} 
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-amber-600 shrink-0" /> ตั้งค่าระบบ
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileDropdown(false);
                          handleLogout();
                        }} 
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-600 shrink-0" /> ออกจากระบบ
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="px-3 py-1.5 bg-amber-800 text-white rounded-full text-xs font-bold hover:bg-amber-900 transition-all flex items-center gap-1 shadow cursor-pointer"
            >
              <User className="w-3.5 h-3.5" /> เข้าสู่ระบบ
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
