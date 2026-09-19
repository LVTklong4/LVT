'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { useStorage } from '@/context/StorageContext';
import { Search, Settings, LayoutDashboard, CalendarDays, RotateCcw, RefreshCw, User, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, CheckCircle, AlertCircle, LogOut, X, CreditCard, FileText, Zap, Phone, Store, Info, Sun, Leaf, ShoppingBag, PlusCircle, Printer, Utensils, Shirt, Banknote, Check, Tag, CalendarX, Package, Archive, Lock, HelpCircle } from 'lucide-react';

import LoginModal from './modals/LoginModal';
import StorageMgmtModal from './modals/StorageMgmtModal';
import MonthlyMgmtModal from './modals/MonthlyMgmtModal';
import SettingsMgmtModal from './modals/SettingsMgmtModal';
import AddUtilityModal from './modals/AddUtilityModal';
import MoveLockModal from './modals/MoveLockModal';
import SlipPreviewModal from './modals/SlipPreviewModal';
import StoragePrintModal from './modals/StoragePrintModal';
import OffGridBookingModal from './modals/OffGridBookingModal';
import KlongThomBookingLayout from './KlongThomBookingLayout';
import DailyClosingModal from '../dashboard/DailyClosingModal';
import BookingDetailModal from './modals/BookingDetailModal';
import StandbyWaitlistModal from './modals/StandbyWaitlistModal';
import ActivityLogsModal from './modals/ActivityLogsModal';
import { FinanceProvider } from '@/context/FinanceContext';
import { KlongThomProvider } from '@/context/KlongThomContext';
import StallMapGrid from './StallMapGrid';
import { dayNamesShort, monthNamesFull, getModalDateFormat } from '@/utils/thaiDateHelper';
import { formatPrice } from '@/utils/numberHelper';
import { printMarketLayoutA4 } from '@/utils/marketLayoutPrinter';

const TopDownCar = ({ color = "#1E88E5", className = "h-[45px] w-auto drop-shadow-sm" }) => (
  <svg viewBox="0 0 40 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="12" width="3" height="10" rx="1" fill="#263238" />
    <rect x="36" y="12" width="3" height="10" rx="1" fill="#263238" />
    <rect x="1" y="58" width="3" height="10" rx="1" fill="#263238" />
    <rect x="36" y="58" width="3" height="10" rx="1" fill="#263238" />
    <rect x="4" y="6" width="32" height="68" rx="8" fill="rgba(0,0,0,0.12)" />
    <rect x="4" y="4" width="32" height="68" rx="7" fill={color} />
    <rect x="0" y="20" width="4" height="4" rx="1" fill={color} />
    <rect x="36" y="20" width="4" height="4" rx="1" fill={color} />
    <path d="M 8,22 Q 20,18 32,22 L 30,30 Q 20,29 10,30 Z" fill="#111" opacity="0.8" />
    <path d="M 8,58 Q 20,60 32,58 L 30,64 Q 20,65 10,64 Z" fill="#111" opacity="0.8" />
    <rect x="8" y="28" width="24" height="30" rx="3" fill={color} style={{ filter: "brightness(1.15)" }} />
    <rect x="7" y="3" width="5" height="2" rx="1" fill="#FFEE58" />
    <rect x="28" y="3" width="5" height="2" rx="1" fill="#FFEE58" />
    <rect x="7" y="71" width="5" height="2" rx="1" fill="#EF5350" />
    <rect x="28" y="71" width="5" height="2" rx="1" fill="#EF5350" />
  </svg>
);

export default function StandardBookingLayout() {
  const {
    activeMonthlyBooking,    activeMonthlyTransactions,    addStallDropdownRef,    addStallDropdownRefSat,    addStallDropdownRefSun,    addStallDropdownRefWed,    addUtilityMethod,    addUtilityPrice,    addUtilityUnit,    adminForm,    adminList,    adminRolesList,    adminUser,    alertInfo,    setAlertInfo,    showAlert,    bookerName,    bookings,    calculateDefaultStallPrice,    cleanStallName,    dateOffset,    elecPrice,    elecUnit,    fetchBookingsAndStorage,    fetchMonthlyTransactions,    fetchVacantStallsForDate,    formatBookingMonth,    getBookingCustomerType,    getNewMonthlyPricing,    getOccupiedStallsInRound,    getStallPriceForDate,    getStallStatus,    handleAddUtility,    handleConfirmMoveLock,    handleCreateNewMonthlyBooking,    handleDeleteBooking,    handleDeleteMonthlyBooking,    handleGoogleLogin,    handleLogin,    handleLogout,    handleMarkAbsent,    handleMonthlyPaymentSubmit,    handleOpenBulkRenewModal,    handleOpenEditMonthlyModal,    handleOpenNewMonthlyModal,    handlePrintMonthlyInvoice,    handlePrintMonthlyReceipt,    handlePrintMonthlyReceiptDirect,    handlePrintReceipt,    handleShowReceiptPreview,    handleSaveAdminRole,    handleSaveBooking,    handleSaveEditedMonthlyBooking,    handleSearch,    handleSlipChange,    handleSortToggle,    handleStallClick,    handleToggleNonRenewal,    handleUpdateMonthlyItem,    handleVacateMonthlyStallToday,    highlightedStall,    isEditingMonthlyMode,    loading,    loadingMonthly,    loadingMonthlyTxns,    loadingSettings,    loadingVacantStalls,    monthlyList,    monthlyMonthFilter,    monthlyPaymentForm,    monthlyPrintItem,    monthlyPrintMonth,    monthlyPrintPayments,    monthlyPrintProduct,    monthlyPrintSatCount,    monthlyPrintSunCount,    monthlyPrintTxnNo,    monthlyPrintWedCount,    monthlySearchQuery,    moveStallFilter,    moveTargetDate,    moveTargetStall,    newMonthlyBookerName,    newMonthlyCustomerType,    newMonthlyDays,    newMonthlyElecUnit,    newMonthlyNote,    newMonthlyPhone,    newMonthlyProduct,    newMonthlyStallsSat,    newMonthlyStallsSun,    newMonthlyStallsWed,    newMonthlyStartDate,    newMonthlyStorageFee,    note,    parseNumber,    paymentList,    product,    quickDates,    receiptPreviewData,    renderSortArrow,    searchQuery,    searchResults,    selectSearchResult,    selectedAdminEmail,    selectedBooking,    selectedDate,    selectedMonthlyItem,    selectedMonthlyStallBooking,    selectedStall,    selectedStallsList,    setActiveMonthlyBooking,    setAddUtilityMethod,    setAddUtilityPrice,    setAddUtilityUnit,    setAdminForm,    setBookerName,    setDateOffset,    setElecPrice,    setElecUnit,    setMonthlyMonthFilter,    setMonthlyPaymentForm,    setMonthlyPrintMonth,    setMonthlyPrintPayments,    setMonthlyPrintProduct,    setMonthlyPrintSatCount,    setMonthlyPrintSunCount,    setMonthlyPrintTxnNo,    setMonthlyPrintWedCount,    setMonthlySearchQuery,    setMoveStallFilter,    setMoveTargetDate,    setMoveTargetStall,    setNewMonthlyBookerName,    setNewMonthlyCustomerType,    setNewMonthlyDays,    setNewMonthlyElecUnit,    setNewMonthlyNote,    setNewMonthlyPhone,    setNewMonthlyProduct,    setNewMonthlyStallsSat,    setNewMonthlyStallsSun,    setNewMonthlyStallsWed,    setNewMonthlyStartDate,    setNewMonthlyStorageFee,    setNote,    setPaymentList,    setProduct,    setReceiptPreviewData,    setSelectedAdminEmail,    setSelectedDate,    setSelectedMonthlyItem,    setSelectedStallsList,    setShowAddStallSelect,    setShowAddStallSelectSat,    setShowAddStallSelectSun,    setShowAddStallSelectWed,    setShowAddUtilityModal,    setShowBookingModal,    setShowLoginModal,    setShowMonthlyMgmtModal,    setShowMonthlyPaymentModal,    setShowMonthlyPrintModal,    setShowMonthlyStallMapModal,    setShowMoveLockModal,    setShowNewMonthlyModal,    setShowReceiptPreviewModal,    setShowSettingsMgmtModal,    setSlipPreviewUrl,    setFullScreenSlipUrl,    fullScreenSlipUrl,    setStallFilter,    setStallFilterSat,    setStallFilterSun,    setStallFilterWed,    setStallPrice,    showAddStallSelect,    showAddStallSelectSat,    showAddStallSelectSun,    showAddStallSelectWed,    showAddUtilityModal,    showBookingModal,    showLoginModal,    showMonthlyMgmtModal,    showMonthlyPaymentModal,    showMonthlyPrintModal,    showMonthlyStallMapModal,    showMoveLockModal,    showNewMonthlyModal,    showReceiptPreviewModal,    showSettingsMgmtModal,    slipPreviewUrl,    sortThaiMonthsDescending,    stallFilter,    stallFilterSat,    stallFilterSun,    stallFilterWed,    stallPrice,    stalls,    vacantStallsOnTargetDate,
    standbyList,
    showStandbyModal,
    setShowStandbyModal,
    showActivityLogsModal,
    setShowActivityLogsModal,
    handleAddStandbyQueue,
    handleUpdateStandbyStatus,
    handleDeleteStandbyQueue,
    confirmInfo
  } = useBooking();

  const {
    showStorageMgmtModal,
    setShowStorageMgmtModal,
    showStoragePrintModal,
    setShowStoragePrintModal
  } = useStorage();

  const [showGearDropdown, setShowGearDropdown] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);

  // Decoupled Off-Grid Booking Local States
  const [showOffGridBooking, setShowOffGridBooking] = React.useState(false);
  const [selectedOffGridBookingObj, setSelectedOffGridBookingObj] = React.useState(null);

  // Decoupled KlongThom Booking Local States
  const [showKlongThomModal, setShowKlongThomModal] = React.useState(false);

  // Daily Closing Modal State
  const [showDailyClosingModal, setShowDailyClosingModal] = React.useState(false);

  // States & memo for vacating multiple monthly stalls
  const [selectedVacateStallIds, setSelectedVacateStallIds] = React.useState([]);
  
  const relatedBookings = React.useMemo(() => {
    if (!selectedMonthlyStallBooking) return [];
    return bookings.filter(b => 
      b.master_id === selectedMonthlyStallBooking.master_id && 
      b.date === selectedMonthlyStallBooking.date &&
      b.status !== 'ลา'
    );
  }, [selectedMonthlyStallBooking, bookings]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (relatedBookings.length > 0) {
        setSelectedVacateStallIds(relatedBookings.map(b => b.id));
      } else {
        setSelectedVacateStallIds([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [relatedBookings]);

  // Dynamic grid column setup
  let maxCol = 24;
  let maxRow = 26;
  stalls.forEach(s => {
    if (s.row > maxRow) maxRow = s.row;
    if (s.col > maxCol) maxCol = s.col;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Toast Alert */}
      {alertInfo && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 animate-bounce-in max-w-md ${
          alertInfo.isError 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {alertInfo.isError ? <AlertCircle className="w-5 h-5 shrink-0 text-red-600" /> : <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />}
          <div className="flex-1">
            <h4 className="font-bold">{alertInfo.title}</h4>
            <p className="text-xs whitespace-pre-line font-medium">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)}
            className="p-0.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmInfo && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in text-[#4A3B32]">
            <div className={`px-5 py-4 flex items-center gap-2.5 border-b text-white ${confirmInfo.isDanger ? 'bg-red-700 border-red-800' : 'bg-[#5D4037] border-[#8B4513]'}`}>
              {confirmInfo.isDanger ? <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" /> : <HelpCircle className="w-5 h-5 text-amber-300 shrink-0" />}
              <h3 className="font-extrabold text-sm flex-1">{confirmInfo.title}</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-700 whitespace-pre-line leading-relaxed">
                {confirmInfo.message}
              </p>
              <div className="flex gap-2.5 mt-2 pt-2 border-t border-amber-900/10">
                <button
                  type="button"
                  onClick={confirmInfo.onCancel}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all cursor-pointer"
                >
                  {confirmInfo.cancelText || 'ยกเลิก'}
                </button>
                <button
                  type="button"
                  onClick={confirmInfo.onConfirm}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md hover:shadow-lg transition-all cursor-pointer ${
                    confirmInfo.isDanger
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[#8B4513] hover:bg-[#5D4037]'
                  }`}
                >
                  {confirmInfo.confirmText || 'ตกลง'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
                              setSelectedOffGridBookingObj(null);
                              setShowOffGridBooking(true);
                            }} 
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-amber-700 shrink-0" /> จองนอกผัง
                          </button>
                          <button 
                            onClick={() => {
                              setShowGearDropdown(false);
                              setShowKlongThomModal(true);
                            }} 
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Store className="w-4 h-4 text-red-600 shrink-0" /> คลองถม
                          </button>
                          <button 
                            onClick={() => {
                              setShowGearDropdown(false);
                              window.open('/?view=monthly', '_blank');
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
                            setShowDailyClosingModal(true);
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

      {/* Main content grid area */}
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 py-1 mb-24">
        
        {/* Stall Map Grid Component */}
        <StallMapGrid />

      </main>

      {/* Floating Bottom Info bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#FAEBD7] border-t-3 border-[#8B4513] p-2.5 z-30 shadow-lg">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-700 font-bold gap-2">
          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4 text-[#8B4513]" />
            <span>วันที่จอง: {selectedDate ? new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <span className="text-green-800">จองรายวันสำเร็จ: {bookings.filter(b => b.type === 'รายวัน' && b.status === 'ชำระแล้ว').length} ล็อค</span>
            <span className="text-purple-800">จองรายเดือน: {bookings.filter(b => b.type === 'รายเดือน').length} ล็อค</span>
            <span className="text-amber-800">ค้างชำระ: {bookings.filter(b => b.status === 'ค้างชำระ').length} ล็อค</span>
          </div>
          <div>
            <span>ผู้ใช้งาน: {adminUser ? `${adminUser.name} (${adminUser.role})` : 'ผู้เข้าชมทั่วไป'}</span>
          </div>
        </div>
      </footer>

      {/* login modal */}
      

      {/* 🗓️ 2.4 Monthly Stall Details & Vacate Modal (from Map) */}
      {showMonthlyStallMapModal && selectedStall && selectedMonthlyStallBooking && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-sm border border-[#8B4513]/10 overflow-hidden flex flex-col p-6 relative animate-pop-in">
            {/* Close button */}
            <button 
              onClick={() => setShowMonthlyStallMapModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Icon */}
            <div className="flex justify-center mt-2 mb-3">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200/60 shadow-inner">
                <Store className="w-7 h-7 text-amber-800" />
              </div>
            </div>

            {/* Title / Stall Name */}
            <div className="text-center flex flex-col items-center gap-1.5 mb-5">
              <h2 className="text-5xl font-black text-amber-950 tracking-tight">
                {cleanStallName(selectedStall.name)}
              </h2>
              <span className="bg-amber-100 text-[#8B4513] border border-[#8B4513]/20 text-[10px] font-black px-3.5 py-0.5 rounded-full tracking-wider uppercase">
                ลูกค้ารายเดือน
              </span>
            </div>

            {/* Customer & Product Card */}
            <div className="bg-[#FAEBD7]/30 border border-amber-900/10 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
              {adminUser && (
                <div>
                  <span className="text-[10px] font-extrabold text-amber-800/70 uppercase tracking-wider block mb-0.5">ผู้เช่า</span>
                  <span className="text-sm font-bold text-[#4A3B32]">{selectedMonthlyStallBooking.booker_name}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] font-extrabold text-amber-800/70 uppercase tracking-wider block mb-0.5">สินค้า</span>
                <span className="text-sm font-bold text-[#4A3B32]">{selectedMonthlyStallBooking.product || 'ไม่มีชื่อสินค้า'}</span>
              </div>
            </div>

            {/* Vacate Button & Multi-stall Selection */}
            {adminUser && (
              <>
                {relatedBookings.length > 1 && (
                  <div className="mt-4 border-2 border-[#8B4513]/15 bg-[#FAF0E6]/50 rounded-xl p-3.5 text-left shadow-inner">
                    <span className="text-[10px] font-black text-[#8B4513] uppercase tracking-wider block mb-2.5">
                      พบข้อมูล {relatedBookings.length} แผง เลือกแผงที่ต้องการลาหยุดในวันนี้:
                    </span>
                    <div className="flex flex-col gap-2">
                      {relatedBookings.map((b) => {
                        const isChecked = selectedVacateStallIds.includes(b.id);
                        return (
                          <label 
                            key={b.id} 
                            className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer select-none py-1 hover:text-amber-800 transition-colors"
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVacateStallIds([...selectedVacateStallIds, b.id]);
                                } else {
                                  setSelectedVacateStallIds(selectedVacateStallIds.filter(id => id !== b.id));
                                }
                              }}
                              className="w-4.5 h-4.5 rounded border-amber-300 text-amber-800 focus:ring-amber-600 focus:ring-offset-1 accent-amber-800 cursor-pointer"
                            />
                            <span className="font-bold text-gray-800">แผงค้า {cleanStallName(b.stall_name)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleVacateMonthlyStallToday(selectedVacateStallIds)}
                  disabled={selectedVacateStallIds.length === 0}
                  className={`w-full mt-6 py-3 text-white rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    selectedVacateStallIds.length === 0 
                      ? 'bg-gray-300 cursor-not-allowed shadow-none text-gray-500' 
                      : 'bg-[#E53935] hover:bg-[#D32F2F]'
                  }`}
                >
                  <CalendarX className="w-4 h-4" /> คืนล็อคเฉพาะวันนี้
                </button>

                {/* Footnote */}
                <p className="text-[9px] text-gray-400 text-center mt-3 font-semibold">
                  * กดปุ่มนี้เพื่อให้ล็อคว่างสำหรับขายรายวัน (สัญญาหลักไม่หาย)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Booking Details / Creation Modal */}
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

      {/* Standby Waitlist Modal */}
      <StandbyWaitlistModal 
        show={showStandbyModal}
        onClose={() => setShowStandbyModal(false)}
        selectedDate={selectedDate}
        standbyList={standbyList}
        handleAddStandbyQueue={handleAddStandbyQueue}
        handleUpdateStandbyStatus={handleUpdateStandbyStatus}
        handleDeleteStandbyQueue={handleDeleteStandbyQueue}
        adminUser={adminUser}
      />

      {/* Officer Activity Audit Logs Modal */}
      <ActivityLogsModal 
        show={showActivityLogsModal}
        onClose={() => setShowActivityLogsModal(false)}
      />

      {/* Receipt Preview Modal for Mobile Screenshots */}
      {showReceiptPreviewModal && receiptPreviewData && (() => {
        const { bookingObj, stallObj } = receiptPreviewData;
        if (!bookingObj || !stallObj) return null;

        const stallPriceVal = parseNumber(bookingObj.stall_price);
        const elecPriceVal = parseNumber(bookingObj.elec_price);
        const storageFeeVal = parseNumber(bookingObj.storage_fee || bookingObj.storage_fee_price);
        const totalAmountVal = stallPriceVal + elecPriceVal + storageFeeVal;

        const now = new Date();
        const formattedTransaction = now.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

        const tradingDateObj = new Date(bookingObj.date);
        const dayName = dayNamesShort[tradingDateObj.getDay()] || '';
        const tradingDateFormatted = `${dayName} ที่ ${tradingDateObj.getDate()} ${monthNamesFull[tradingDateObj.getMonth()]} ${tradingDateObj.getFullYear() + 543}`;

        const formattedStallName = bookingObj.stall_name 
          ? cleanStallName(bookingObj.stall_name) 
          : cleanStallName(stallObj.name);

        const rawPayments = bookingObj.payment_method || '';
        const paymentLines = [];
        if (rawPayments.includes('+') || rawPayments.includes(':')) {
          rawPayments.split('+').forEach(p => {
            const parts = p.trim().split(':');
            if (parts.length >= 2) {
              paymentLines.push({ method: parts[0].trim() === 'โอนเงิน' ? 'โอนจ่าย' : parts[0].trim(), amount: parseNumber(parts[1]) });
            } else {
              paymentLines.push({ method: p.trim(), amount: totalAmountVal });
            }
          });
        } else {
          paymentLines.push({ method: rawPayments === 'โอนเงิน' ? 'โอนจ่าย' : rawPayments || 'เงินสด', amount: totalAmountVal });
        }

        const totalPaidVal = paymentLines.reduce((sum, p) => sum + p.amount, 0);
        const changeVal = totalPaidVal > totalAmountVal ? (totalPaidVal - totalAmountVal) : 0;

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in">
              
              <div className="bg-[#F5E6D3] border-b border-[#8B4513]/30 px-4 py-2.5 flex justify-between items-center shrink-0">
                <span className="font-extrabold text-[#5D4037] text-xs md:text-sm flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-[#8B4513]" /> ตั๋วใบเสร็จ/แคปหน้าจอ
                </span>
                <button 
                  onClick={() => setShowReceiptPreviewModal(false)}
                  className="p-1 rounded-full text-gray-500 hover:bg-[#8B4513]/10 transition-colors"
                >
                  <X className="w-5 h-5 text-[#8B4513]" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto bg-white flex flex-col items-center">
                
                <div className="w-full text-center text-[10px] text-gray-400 font-bold mb-3 border-b border-dashed pb-1.5">
                  📸 แคปเจอร์หน้าจอนี้เพื่อส่งต่อให้ลูกค้าทาง Line
                </div>

                <div className="w-full max-w-[280px] text-black font-sans leading-relaxed text-xs">
                  
                  <div className="flex flex-col items-center mb-3">
                    <img 
                      src="/logo.png" 
                      alt="LVT Logo" 
                      className="w-20 h-20 object-contain mb-1 drop-shadow-sm" 
                    />
                    <h2 className="font-black text-sm text-center">ตลาดลาดสวายวินเทจ</h2>
                    <p className="text-[10px] text-black text-center font-black">Ladsawai Vintage Market</p>
                    <p className="text-[9px] text-black text-center font-black">เลขที่ 52/34 หมู่ 5</p>
                    <p className="text-[9px] text-black text-center font-black">ต.ลาดสวาย อ.ลำลูกกา จ.ปทุมธานี 12150</p>
                    <p className="text-[9px] text-black text-center font-black">บริการเช่าพื้นที่จองล็อค ตลาดนัดรายวัน-รายเดือน</p>
                    <p className="text-[9px] text-black text-center font-black">โทร: 0-92-869-7774 , 0-92-869-7775</p>
                  </div>

                  <div className="border-t border-dashed border-black my-2"></div>

                  <div className="space-y-1 text-[10px] font-black text-black">
                    <div className="flex justify-between">
                      <span>เลขที่เอกสาร:</span>
                      <span className="font-mono">{bookingObj.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ผู้ทำรายการ:</span>
                      <span>{adminUser?.employee_id || adminUser?.name || 'lvt-admin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>วันที่ทำรายการ:</span>
                      <span className="font-mono">{formattedTransaction}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black my-2"></div>

                  <div className="space-y-1.5 py-1 text-xs font-black text-black">
                    <div className="flex justify-between">
                      <span>วันที่ทำการค้า:</span>
                      <span>{tradingDateFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ล็อกที่เช่า:</span>
                      <span className="text-red-700">{formattedStallName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ผู้ค้า:</span>
                      <span>{bookingObj.booker_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>สินค้าที่ขาย:</span>
                      <span>{bookingObj.product || '-'}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black my-2"></div>

                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-dashed border-black text-black font-black">
                        <th className="py-1">รายการ</th>
                        <th className="py-1 text-right">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="font-black text-black">
                      <tr>
                        <td className="py-1">ค่าล็อกสะสม</td>
                        <td className="py-1 text-right font-mono">{formatPrice(stallPriceVal)} บ.</td>
                      </tr>
                      {elecPriceVal > 0 && (
                        <tr>
                          <td className="py-1">ค่าไฟ ({bookingObj.elec_unit || 0} หน่วย)</td>
                          <td className="py-1 text-right font-mono">{formatPrice(elecPriceVal)} บ.</td>
                        </tr>
                      )}
                      {storageFeeVal > 0 && (
                        <tr>
                          <td className="py-1">ค่าฝากของ</td>
                          <td className="py-1 text-right font-mono">{formatPrice(storageFeeVal)} บ.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="border-t border-dashed border-black my-2"></div>

                  <div className="space-y-1 text-xs font-black text-black">
                    <div className="flex justify-between font-black text-black text-sm">
                      <span>รวมเงินทั้งสิ้น:</span>
                      <span className="font-mono">{formatPrice(totalAmountVal)} บ.</span>
                    </div>
                    
                    <div className="pt-1.5 space-y-0.5 text-[10px] font-black text-black">
                      {paymentLines.map((p, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>ชำระด้วย [{p.method}]:</span>
                          <span className="font-mono">{formatPrice(p.amount)} บ.</span>
                        </div>
                      ))}
                      {changeVal > 0 && (
                        <div className="flex justify-between text-red-700 font-black">
                          <span>เงินทอน:</span>
                          <span className="font-mono">{formatPrice(changeVal)} บ.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black my-2"></div>

                  <div className="text-center text-[10px] text-black font-black space-y-0.5 mt-2">
                    <p>Line Official: @ladsawaivintage</p>
                    <p className="text-black font-black">ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
                    <p className="text-[8px] text-black font-black">Powered by PJMJK</p>
                  </div>

                </div>

              </div>

              <div className="bg-gray-50 border-t px-4 py-3 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReceiptPreviewModal(false)}
                  className="px-3.5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs shadow transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Electricity Register Modal */}
      

      {/* 📦 1. Storage Management Modal */}
      

      {/* 🗓️ 2. Monthly Bookings Management Modal */}
      

      {/* 🗓️ 2.2 New Monthly Booking Modal */}
      



      {/* 🗓️ 2.1 Monthly Print Parameters Modal */}
      

      {/* 📦 1.1 Storage Print Parameters Modal */}
      

      {/* 💸 3. Finance Management Modal */}
      

      {/* ⚙️ 4. Settings Management Modal */}
      

      {/* 🔄 Move Lock Modal */}
      

    
      {/* Modal Components */}
      <LoginModal />
      <StorageMgmtModal />
      <MonthlyMgmtModal />
      <SettingsMgmtModal />
      <AddUtilityModal />
      <MoveLockModal />
      <SlipPreviewModal />
      <StoragePrintModal />
      <OffGridBookingModal 
        isOpen={showOffGridBooking}
        onClose={() => {
          setShowOffGridBooking(false);
          setSelectedOffGridBookingObj(null);
        }}
        selectedBooking={selectedOffGridBookingObj}
        onSaveSuccess={() => {
          fetchBookingsAndStorage();
        }}
      />

      {/* 🚗 KlongThom Booking / Remittance Modal */}
      {showKlongThomModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <KlongThomProvider>
            <KlongThomBookingLayout onClose={() => setShowKlongThomModal(false)} />
          </KlongThomProvider>
        </div>
      )}

      {/* 🔒 Daily Closing Modal */}
      <FinanceProvider>
        <DailyClosingModal 
          isOpen={showDailyClosingModal}
          onClose={() => setShowDailyClosingModal(false)}
        />
      </FinanceProvider>
    </div>
  );
}
