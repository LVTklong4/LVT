'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Search, Settings, LayoutDashboard, CalendarDays, RotateCcw, RefreshCw, User, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, CheckCircle, AlertCircle, LogOut, X, CreditCard, FileText, Zap, Phone, Store, Info, Sun, Leaf, ShoppingBag, PlusCircle, Printer, Utensils, Shirt, Banknote, Check, Tag, CalendarX, Package, Archive } from 'lucide-react';

import LoginModal from './modals/LoginModal';
import StorageMgmtModal from './modals/StorageMgmtModal';
import MonthlyMgmtModal from './modals/MonthlyMgmtModal';
import FinanceMgmtModal from './modals/FinanceMgmtModal';
import SettingsMgmtModal from './modals/SettingsMgmtModal';
import AddUtilityModal from './modals/AddUtilityModal';
import MoveLockModal from './modals/MoveLockModal';
import SlipPreviewModal from './modals/SlipPreviewModal';
import StoragePrintModal from './modals/StoragePrintModal';
import MonthlyPrintModal from './modals/MonthlyPrintModal';
import NewMonthlyModal from './modals/NewMonthlyModal';
import { dayNamesShort, monthNamesFull, getModalDateFormat } from '@/utils/thaiDateHelper';

export default function StandardBookingLayout() {
  const {
    activeMonthlyBooking,    activeMonthlyTransactions,    addStallDropdownRef,    addStallDropdownRefSat,    addStallDropdownRefSun,    addStallDropdownRefWed,    addUtilityMethod,    addUtilityPrice,    addUtilityUnit,    adminForm,    adminList,    adminRolesList,    adminUser,    alertInfo,    showAlert,    bookerName,    bookings,    calculateDefaultStallPrice,    cleanStallName,    dateOffset,    elecPrice,    elecUnit,    expenseForm,    expenseList,    fetchBookingsAndStorage,    fetchMonthlyTransactions,    fetchVacantStallsForDate,    financeTab,    formatBookingMonth,    getBookingCustomerType,    getNewMonthlyPricing,    getOccupiedStallsInRound,    getStallPriceForDate,    getStallStatus,    handleAddExpense,    handleAddIncome,    handleAddUtility,    handleConfirmMoveLock,    handleCreateNewMonthlyBooking,    handleDeleteBooking,    handleDeleteMonthlyBooking,    handleGoogleLogin,    handleLogin,    handleLogout,    handleMarkAbsent,    handleMonthlyPaymentSubmit,    handleOpenBulkRenewModal,    handleOpenEditMonthlyModal,    handleOpenNewMonthlyModal,    handleOpenStoragePrintModal,    handlePrintMonthlyInvoice,    handlePrintMonthlyReceipt,    handlePrintMonthlyReceiptDirect,    handlePrintReceipt,    handlePrintStorageReceipt,    handleSaveAdminRole,    handleSaveBooking,    handleSaveEditedMonthlyBooking,    handleSaveStorage,    handleSearch,    handleSlipChange,    handleSortToggle,    handleStallClick,    handleToggleNonRenewal,    handleToggleStorageStatus,    handleUpdateMonthlyItem,    handleVacateMonthlyStallToday,    highlightedStall,    incomeForm,    incomeList,    isEditingMonthlyMode,    loading,    loadingFinance,    loadingMonthly,    loadingMonthlyTxns,    loadingSettings,    loadingStorage,    loadingVacantStalls,    monthlyList,    monthlyMonthFilter,    monthlyPaymentForm,    monthlyPrintItem,    monthlyPrintMonth,    monthlyPrintPayments,    monthlyPrintProduct,    monthlyPrintSatCount,    monthlyPrintSunCount,    monthlyPrintTxnNo,    monthlyPrintWedCount,    monthlySearchQuery,    moveStallFilter,    moveTargetDate,    moveTargetStall,    newMonthlyBookerName,    newMonthlyCustomerType,    newMonthlyDays,    newMonthlyElecUnit,    newMonthlyNote,    newMonthlyPhone,    newMonthlyProduct,    newMonthlyStallsSat,    newMonthlyStallsSun,    newMonthlyStallsWed,    newMonthlyStartDate,    newMonthlyStorageFee,    note,    parseNumber,    paymentList,    product,    quickDates,    receiptPreviewData,    renderSortArrow,    searchQuery,    searchResults,    selectSearchResult,    selectedAdminEmail,    selectedBooking,    selectedDate,    selectedMonthlyItem,    selectedMonthlyStallBooking,    selectedStall,    selectedStallsList,    setActiveMonthlyBooking,    setAddUtilityMethod,    setAddUtilityPrice,    setAddUtilityUnit,    setAdminForm,    setBookerName,    setDateOffset,    setElecPrice,    setElecUnit,    setExpenseForm,    setFinanceTab,    setIncomeForm,    setMonthlyMonthFilter,    setMonthlyPaymentForm,    setMonthlyPrintMonth,    setMonthlyPrintPayments,    setMonthlyPrintProduct,    setMonthlyPrintSatCount,    setMonthlyPrintSunCount,    setMonthlyPrintTxnNo,    setMonthlyPrintWedCount,    setMonthlySearchQuery,    setMoveStallFilter,    setMoveTargetDate,    setMoveTargetStall,    setNewMonthlyBookerName,    setNewMonthlyCustomerType,    setNewMonthlyDays,    setNewMonthlyElecUnit,    setNewMonthlyNote,    setNewMonthlyPhone,    setNewMonthlyProduct,    setNewMonthlyStallsSat,    setNewMonthlyStallsSun,    setNewMonthlyStallsWed,    setNewMonthlyStartDate,    setNewMonthlyStorageFee,    setNote,    setPaymentList,    setProduct,    setReceiptPreviewData,    setSelectedAdminEmail,    setSelectedDate,    setSelectedMonthlyItem,    setSelectedStallsList,    setShowAddStallSelect,    setShowAddStallSelectSat,    setShowAddStallSelectSun,    setShowAddStallSelectWed,    setShowAddUtilityModal,    setShowBookingModal,    setShowFinanceMgmtModal,    setShowLoginModal,    setShowMonthlyMgmtModal,    setShowMonthlyPaymentModal,    setShowMonthlyPrintModal,    setShowMonthlyStallMapModal,    setShowMoveLockModal,    setShowNewMonthlyModal,    setShowReceiptPreviewModal,    setShowSettingsMgmtModal,    setShowStorageMgmtModal,    setShowStoragePrintModal,    setSlipPreviewUrl,    setStallFilter,    setStallFilterSat,    setStallFilterSun,    setStallFilterWed,    setStallPrice,    setStorageForm,    setStoragePrintEndDate,    setStoragePrintFee,    setStoragePrintNote,    setStoragePrintOwner,    setStoragePrintPayment,    setStoragePrintStall,    setStoragePrintStartDate,    showAddStallSelect,    showAddStallSelectSat,    showAddStallSelectSun,    showAddStallSelectWed,    showAddUtilityModal,    showBookingModal,    showFinanceMgmtModal,    showLoginModal,    showMonthlyMgmtModal,    showMonthlyPaymentModal,    showMonthlyPrintModal,    showMonthlyStallMapModal,    showMoveLockModal,    showNewMonthlyModal,    showReceiptPreviewModal,    showSettingsMgmtModal,    showStorageMgmtModal,    showStoragePrintModal,    slipPreviewUrl,    sortThaiMonthsDescending,    stallFilter,    stallFilterSat,    stallFilterSun,    stallFilterWed,    stallPrice,    stalls,    storageFee,    storageForm,    storageList,    storageMap,    storagePrintEndDate,    storagePrintFee,    storagePrintItem,    storagePrintNote,    storagePrintOwner,    storagePrintPayment,    storagePrintStall,    storagePrintStartDate,    vacantStallsOnTargetDate
  } = useBooking();

  const [showGearDropdown, setShowGearDropdown] = React.useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);

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
    if (relatedBookings.length > 0) {
      setSelectedVacateStallIds(relatedBookings.map(b => b.id));
    } else {
      setSelectedVacateStallIds([]);
    }
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
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 animate-bounce-in ${
          alertInfo.isError 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {alertInfo.isError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
          <div>
            <h4 className="font-bold">{alertInfo.title}</h4>
            <p className="text-xs">{alertInfo.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[AntiqueWhite] border-b-3 border-[#8B4513] shadow-md py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          
          {/* Logo & title */}
          <div className="flex items-center gap-2">
            <img src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">ตลาดนัดลาดสวายวินเทจ</h1>
              <p className="text-[10px] text-gray-500 font-medium">ระบบบริหารจัดการจองล็อคออนไลน์ (Supabase Pro)</p>
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
                              showAlert("ระบบจองนอกผัง (Coming Soon)", "แจ้งเตือน");
                            }} 
                            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-amber-700 shrink-0" /> จองนอกผัง
                          </button>
                          <button 
                            onClick={() => {
                              setShowGearDropdown(false);
                              showAlert("ระบบผังคลองถม (Coming Soon)", "แจ้งเตือน");
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
                    src="https://img2.pic.in.th/pic/Profile-Alpha_0.png"
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-amber-800 hover:border-[#8B4513] transition-all object-cover shadow-md"
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
                        <button 
                          onClick={() => {
                            setShowProfileDropdown(false);
                            window.print();
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
                            showAlert("ระบบจัดเก็บข้อมูลเก่า (Coming Soon)", "แจ้งเตือน");
                          }} 
                          className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Archive className="w-4 h-4 text-amber-800 shrink-0" /> จัดเก็บข้อมูลเก่า
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-1 mb-24">
        
        {/* Colors Legend */}
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-1.5 mb-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] md:text-[10px] font-bold justify-center text-gray-700">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#DCEDC8] border border-[#AED581] rounded-sm"></span>อาหาร (ว่าง)</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#B3E5FC] border border-[#81D4FA] rounded-sm"></span>เสื้อผ้า (ว่าง)</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#FFE0B2] border border-[#FFB74D] rounded-sm"></span>ค้างชำระ</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#FFCDD2] border border-[#E57373] rounded-sm"></span>จองแล้ว</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#E1BEE7] border border-[#BA68C8] rounded-sm"></span>รายเดือน</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white border rounded flex items-center justify-center text-[8px] shadow-sm">📦</span>มีฝากของ</div>
          </div>
        </div>

        {/* The Grid Map Container */}
        <div className="relative bg-[#D7CCC8] border-4 border-[#5D4037] rounded-lg shadow-2xl p-4 overflow-x-auto min-h-[600px] custom-scrollbar">
          {loading && (
            <div className="absolute inset-0 z-30 bg-amber-50/80 flex items-center justify-center backdrop-blur-[1px] transition-all duration-300">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 text-amber-800 animate-spin" />
                <span className="text-xs font-bold text-amber-900">กำลังดาวน์โหลดข้อมูลผังตลาด...</span>
              </div>
            </div>
          )}

          {stalls.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-96 text-gray-500 font-bold">
              ไม่พบโครงสร้างล็อคในระบบ กรุณาตรวจสอบตาราง stalls
            </div>
          ) : (
            <div 
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${maxCol}, 40px)`,
                gridAutoRows: 'minmax(20px, auto)',
                gap: '3px'
              }}
            >
              {Array.from({ length: maxRow }).map((_, rIdx) => {
                const r = rIdx + 1;
                return Array.from({ length: maxCol }).map((_, cIdx) => {
                  const c = cIdx + 1;
                  const stall = stalls.find(s => s.row === r && s.col === c);
                  
                  if (!stall) {
                    const isInsideGrocery = r >= 1 && r <= 3 && c >= 13 && c <= 15;
                    const isInsideBathroom = r >= 1 && r <= 3 && c >= 16 && c <= 20;
                    const isInsideWater = r >= 23 && r <= 26 && c >= 2 && c <= 7;
                    const isInsideParking = r >= 1 && r <= 25 && c >= 21 && c <= 24;
                    
                    if (isInsideGrocery || isInsideBathroom || isInsideWater || isInsideParking) {
                      return null;
                    }
                    return <div key={`empty-${r}-${c}`} style={{ gridRow: r, gridColumn: c }} className="invisible" />;
                  }

                  const matchedBookings = bookings.filter(b => b.stall_name === stall.name || (b.stall_name && b.stall_name.split(',').map(s => s.trim()).includes(stall.name)));
                  const booking = matchedBookings.sort((a, b) => {
                    if (a.status === 'ลา' && b.status !== 'ลา') return 1;
                    if (a.status !== 'ลา' && b.status === 'ลา') return -1;
                    return 0;
                  })[0];
                  const storage = storageMap[stall.name];
                  
                  // Setup classes based on status
                  let statusClass = "bg-white";
                  let priceText = "";
                  let statusText = "";

                  const dateObj = new Date(selectedDate);
                  const day = dateObj.getDay();
                  let price = stall.price_wed;
                  if (day === 6) price = stall.price_sat;
                  if (day === 0) price = stall.price_sun;
                  priceText = `${price}.-`;

                  const isFood = stall.type.includes('อาหาร') || stall.name.startsWith('F');

                  if (stall.type === 'ทางเดิน') {
                    statusClass = "bg-walkway border-gray-600 opacity-60";
                  } else if (stall.type === 'อื่นๆ') {
                    statusClass = "bg-other-stall opacity-70";
                  } else if (stall.type === 'รายเดือน' || stall.type.includes('รายเดือน')) {
                    if (booking) {
                      if (booking.status === 'ลา') {
                        statusClass = isFood ? "bg-food-free text-green-900" : "bg-cloth-free text-blue-900";
                        statusText = priceText;
                      } else if (booking.type === 'รายเดือน') {
                        const custType = getBookingCustomerType(booking);
                        if (custType === 'Regular' && !isFood) {
                          statusClass = "bg-unpaid text-amber-900";
                          statusText = booking.product || "ประจำ";
                        } else {
                          statusClass = "bg-monthly-stall";
                          statusText = booking.product || "รายเดือน";
                        }
                      } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
                        statusClass = "bg-occupied text-red-900";
                        statusText = booking.product || "จองแล้ว";
                      } else if (booking.status === 'ค้างชำระ') {
                        statusClass = "bg-unpaid text-amber-900";
                        statusText = booking.product || "จองแล้ว";
                      } else {
                        statusClass = "bg-monthly-stall";
                        statusText = "รายเดือน";
                      }
                    } else {
                      statusClass = "bg-monthly-stall";
                      statusText = "รายเดือน";
                    }
                  } else {
                    if (booking) {
                      if (booking.status === 'ลา') {
                        statusClass = isFood ? "bg-food-free text-green-900" : "bg-cloth-free text-blue-900";
                        statusText = priceText;
                      } else if (booking.type === 'รายเดือน') {
                        const custType = getBookingCustomerType(booking);
                        if (custType === 'Regular' && !isFood) {
                          statusClass = "bg-unpaid text-amber-900";
                          statusText = booking.product || "ประจำ";
                        } else {
                          statusClass = "bg-monthly-stall";
                          statusText = booking.product || "รายเดือน";
                        }
                      } else if (booking.status === 'ชำrateแล้ว' || booking.status === 'ไม่ว่าง' || booking.status === 'ชำระแล้ว') {
                        statusClass = "bg-occupied text-red-900";
                        statusText = booking.product || "จองแล้ว";
                      } else {
                        statusClass = "bg-unpaid text-amber-900";
                        statusText = booking.product || "จองแล้ว";
                      }
                    } else {
                      statusClass = isFood ? "bg-food-free text-green-900" : "bg-cloth-free text-blue-900";
                      statusText = priceText;
                    }
                  }

                  const isClickable = stall.type !== 'ทางเดิน' && stall.type !== 'อื่นๆ';
                  const isHighlighted = highlightedStall === stall.name;
                  const displayName = stall.name.replace(/[\[\]]/g, '');

                  return (
                    <button
                      key={stall.name}
                      id={`stall-${stall.name}`}
                      style={{ gridRow: r, gridColumn: c }}
                      onClick={() => isClickable && handleStallClick(stall)}
                      disabled={!isClickable}
                      className={`stall-box relative p-0.5 rounded-sm border shadow-sm flex flex-col items-center justify-center transition-all ${statusClass} ${
                        isClickable ? 'clickable cursor-pointer' : 'non-clickable pointer-events-none'
                      } ${isHighlighted ? 'search-highlight' : ''}`}
                    >
                      <span className="text-[11px] font-black leading-none">{displayName}</span>
                      {statusText && (
                        <span 
                          className="text-[8px] font-extrabold leading-none mt-0.5 max-w-full truncate px-0.5 text-center block"
                          title={statusText}
                        >
                          {statusText}
                        </span>
                      )}
                      {statusText === 'ลา' && (
                        <span className="text-[8.5px] font-black text-red-600 leading-none mt-0.5">ลา</span>
                      )}
                      
                      {storage && (
                        <span 
                          className="absolute -top-1 -right-1 bg-white border border-gray-300 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px] shadow cursor-help z-10"
                          title={`ฝากของ: ${storage.owner_name}`}
                        >
                          📦
                        </span>
                      )}
                    </button>
                  );
                });
              })}

              {/* Custom Highlight Zones */}
              <div 
                style={{ 
                  gridRow: "1 / span 3", 
                  gridColumn: "13 / span 3",
                  border: "3px solid #EAB308",
                  backgroundColor: "#FEF9C3"
                }}
                className="rounded-md flex items-center justify-center text-amber-900 font-extrabold text-[12px] shadow-sm text-center p-1 border-2 pointer-events-none z-10"
              >
                ร้านขายของชำ
              </div>
              
              <div 
                style={{ 
                  gridRow: "1 / span 3", 
                  gridColumn: "16 / span 5",
                  border: "3px solid #2563EB",
                  backgroundColor: "#DBEAFE"
                }}
                className="rounded-md flex items-center justify-center text-blue-900 font-extrabold text-[12px] shadow-sm text-center p-1 border-2 pointer-events-none z-10"
              >
                ห้องน้ำ
              </div>
              
              <div 
                style={{ 
                  gridRow: "23 / span 4", 
                  gridColumn: "2 / span 6",
                  zIndex: 10
                }}
                className="relative w-full h-full min-h-[152px] pointer-events-none"
              >
                <svg 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none" 
                  className="absolute inset-0 w-full h-full overflow-visible"
                >
                  <path 
                    d="M 0.5,0.5 L 83.33,0.5 L 83.33,25 L 99.5,25 L 99.5,99.5 L 0.5,99.5 Z" 
                    fill="#FEE2E2" 
                    stroke="#DC2626" 
                    strokeWidth="3"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-red-900 font-extrabold text-sm pointer-events-none">
                  ร้านน้ำ
                </div>
              </div>

              {/* Khlong Thom Parking Zone (Green border) */}
              <div 
                style={{ 
                  gridRow: "1 / span 25", 
                  gridColumn: "21 / span 4",
                  border: "3px solid #84CC16",
                  backgroundColor: "#E5DDD9"
                }}
                className="rounded-md p-2.5 flex flex-col items-center justify-start gap-3 z-10 pointer-events-none"
              >
                {/* Title */}
                <div className="text-[#5D4037] font-extrabold text-[11px] border-b-2 border-lime-500 pb-1 w-full text-center tracking-wider bg-white/60 rounded py-1 px-1.5 shadow-sm">
                  ที่จอดรถคลองถม
                </div>

                {/* Parking Slots */}
                <div className="flex flex-col gap-2.5 w-full items-center py-0.5">
                  {[
                    'text-slate-600',  // Gray
                    'text-blue-700',   // Blue
                    'text-emerald-700',// Green
                    'text-red-700',    // Red
                    'text-amber-700',  // Bronze
                    'text-zinc-500'    // Silver
                  ].map((colorClass, i) => (
                    <div key={i} className="border-2 border-dashed border-[#8B4513]/20 rounded-lg p-2 flex items-center justify-center bg-white/70 shadow-sm w-full max-w-[110px] h-[64px] relative">
                      <div className="absolute top-0.5 left-1 text-[7px] font-bold text-gray-400">
                        P{i+1}
                      </div>
                      <svg className={`w-9 h-9 ${colorClass} drop-shadow-sm`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating Bottom Info bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#FAEBD7] border-t-3 border-[#8B4513] p-2.5 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-700 font-bold gap-2">
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
      {showBookingModal && selectedStall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-[#8B4513] overflow-hidden animate-pop-in">
            
            {/* Modal Header */}
            <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] text-[#4A3B32] px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Store className="w-5 h-5 text-[#8B4513]" />
                <h3 className="font-extrabold text-sm md:text-base">ข้อมูลล็อค {selectedStall.name}</h3>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-500 hover:text-[#8B4513]"><X className="w-5 h-5" /></button>
            </div>

            {/* Modal Body */}
            {!adminUser ? (
              // Customer / Guest Modal View
              <div className="p-6 flex flex-col gap-4 text-center">
                {/* Large centered stall identifier card */}
                <div className="bg-gradient-to-br from-[#FAEBD7] to-amber-50/40 p-6 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-200/20 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#8B4513]/5 rounded-full blur-xl pointer-events-none" />
                  
                  {/* Category Circle Icon */}
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border border-amber-100 flex-shrink-0">
                    {selectedStall.type === 'อาหาร' ? (
                      <Utensils className="w-8 h-8 text-[#8B4513]" />
                    ) : selectedStall.type === 'เสื้อผ้า' ? (
                      <Shirt className="w-8 h-8 text-[#8B4513]" />
                    ) : (
                      <Store className="w-8 h-8 text-[#8B4513]" />
                    )}
                  </div>
                  
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">หมายเลขล็อค</span>
                  <h2 className="text-4xl font-black text-[#4A3B32] mt-0.5 tracking-tight">{selectedStall.name}</h2>
                  
                  <span className="text-[10px] text-amber-900 font-extrabold bg-[#FAEBD7] border border-amber-250 px-3 py-1 rounded-full mt-3 shadow-xs">
                    โซน {selectedStall.type}
                  </span>
                </div>

                {/* Centered Date Badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700 font-extrabold bg-gray-50/80 p-3 rounded-xl border border-gray-200/50">
                  <CalendarDays className="w-4 h-4 text-amber-800" />
                  <span>วันที่ทำการค้า: {getModalDateFormat(selectedDate)}</span>
                </div>

                {/* Status Section */}
                {(() => {
                  const statusInfo = getStallStatus(selectedStall, selectedBooking);
                  return (
                    <>
                      {/* Centered Status Box */}
                      {statusInfo.isVacant ? (
                        <div className="flex flex-col items-center gap-2 p-5 bg-green-50/50 border-2 border-dashed border-green-200 rounded-2xl text-center">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-green-800 font-extrabold">สถานะ: ล็อคว่างพร้อมจอง</span>
                          <span className="text-2xl font-black text-green-700 mt-0.5">
                            {statusInfo.price} <span className="text-xs font-bold text-gray-500">บาท / วัน</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-5 bg-red-50/50 border-2 border-dashed border-red-200 rounded-2xl text-center">
                          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <span className="text-xs text-red-800 font-extrabold">สถานะ: ล็อคไม่ว่าง (จองแล้ว)</span>
                          
                          <div className="mt-1 border-t border-dashed border-red-200/60 pt-2 w-full text-center">
                            <span className="text-[9px] text-gray-500 font-extrabold uppercase block mb-0.5">ประเภทสินค้า</span>
                            <span className="text-sm font-extrabold text-gray-800 bg-white/70 px-4 py-1.5 rounded-lg border border-red-100 inline-block">
                              {statusInfo.product || 'ไม่มีข้อมูลสินค้า'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* If vacant, show LINE LIFF button */}
                      {statusInfo.isVacant && (
                        <div className="flex flex-col gap-2 mt-1">
                          <a 
                            href="https://liff.line.me/2008895416-3c35BsXZ"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3.5 bg-[#06C755] hover:bg-[#05b34c] active:scale-98 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-sm hover:shadow-lg"
                          >
                            <img 
                              src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" 
                              alt="LINE" 
                              className="w-5 h-5 filter invert" 
                            />
                            จองล็อคนี้ผ่าน LINE
                          </a>
                          <span className="text-[9px] text-gray-400 font-bold">* ระบบจะนำคุณไปยังห้องแชท LINE เพื่อลงทะเบียนและชำระเงิน</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              // Admin View (Form & Controls)
              (() => {
                const totalVal = parseNumber(stallPrice) + parseNumber(elecPrice) + parseNumber(storageFee);
                const transferTotal = paymentList
                  .filter(p => p.method === 'โอนเงิน')
                  .reduce((sum, p) => sum + parseNumber(p.amount), 0);
                const cashTotal = paymentList
                  .filter(p => p.method === 'เงินสด')
                  .reduce((sum, p) => sum + parseNumber(p.amount), 0);

                const totalPaid = paymentList
                  .filter(p => p.method && p.amount)
                  .reduce((sum, p) => sum + parseNumber(p.amount), 0);

                const isFullyPaid = totalPaid >= totalVal && totalVal > 0;
                const isAlreadyPaid = selectedBooking && (selectedBooking.status === 'ชำระแล้ว' || selectedBooking.status === 'ไม่ว่าง') && selectedBooking.type === 'รายวัน';
                const isPaidInDb = selectedBooking && (selectedBooking.status === 'ชำระแล้ว' || selectedBooking.status === 'ไม่ว่าง');

                const cashNeeded = totalVal - transferTotal;
                const changeVal = (cashTotal > cashNeeded && cashNeeded >= 0) ? (cashTotal - cashNeeded) : 0;

                return (
                  <>
                    <div className="p-4 flex flex-col gap-3.5 max-h-[80vh] overflow-y-auto custom-scrollbar text-xs bg-[#FAF6EE]">
                      
                      {/* 1. Date (Highly Visible - Vintage Ticket Style) & Status Banner */}
                      <div className="flex justify-between items-center bg-[#FFFDF9] border-2 border-dashed border-[#8B4513]/40 rounded-xl p-3 shadow-xs font-bold text-xs text-[#5D4037]">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-[#F5E6D3] flex items-center justify-center text-[#8B4513] flex-shrink-0">
                            <CalendarDays className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-extrabold block uppercase tracking-wider">วันที่ทำการค้า</span>
                            <span className="text-xs font-black text-[#5D4037]">{getModalDateFormat(selectedDate)}</span>
                          </div>
                        </div>
                        {/* Dynamic Status Badge */}
                        <div className="shrink-0">
                          {(() => {
                            if (!selectedBooking) {
                              const isFood = selectedStall && (selectedStall.type === 'อาหาร' || selectedStall.type === 'ของสด');
                              if (isFood) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 font-black text-[10px] shadow-xs font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse mr-0.5" /> ว่าง (อาหาร)
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-black text-[10px] shadow-xs font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse mr-0.5" /> ว่าง (เสื้อผ้า)
                                  </span>
                                );
                              }
                            } else if (selectedBooking.status === 'ชำระแล้ว' || selectedBooking.status === 'ไม่ว่าง') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-black text-[10px] shadow-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-0.5" /> ชำระแล้ว
                                </span>
                              );
                            } else if (selectedBooking.status === 'ค้างชำระ') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-black text-[10px] shadow-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" /> ค้างชำระ (ขาด {(totalVal - totalPaid).toFixed(2)} บ.)
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-black text-[10px] shadow-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-0.5" /> {selectedBooking.status}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>

                      {/* 2. Stall Selector (Multi-Stall support - Vintage Badges) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#5D4037] flex items-center justify-between">
                          <span>ล็อคที่จอง ({selectedStallsList.length} ล็อค)</span>
                          <span className="text-[10px] text-[#8B4513]/60 font-semibold">* คิดยอดรวมในบิลใบเดียว</span>
                        </label>
                        
                        <div className="flex flex-wrap gap-1.5 p-2 bg-[#FFFDF9] border border-[#8B4513]/25 rounded-lg min-h-[44px] items-center relative">
                          {selectedStallsList.map((st) => (
                            <span key={st.name} className="inline-flex items-center gap-1 bg-[#F5E6D3] border border-[#8B4513]/30 text-[#5D4037] font-mono font-extrabold text-xs px-2.5 py-1 rounded-md shadow-xs">
                              {cleanStallName(st.name)}
                              {selectedStallsList.length > 1 && !isAlreadyPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedStallsList.filter(item => item.name !== st.name);
                                    setSelectedStallsList(updated);
                                    setStallPrice(calculateDefaultStallPrice(updated));
                                  }}
                                  className="text-amber-700 hover:text-red-700 font-black ml-1 text-[10px] transition-colors"
                                  title="ลบออก"
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          ))}

                          {/* Dropdown to add more stalls */}
                          {!isAlreadyPaid && (
                            <div className="relative" ref={addStallDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setShowAddStallSelect(!showAddStallSelect)}
                                className="px-2.5 py-1 bg-[#8B4513] hover:bg-[#5D4037] text-white rounded text-[10px] font-bold shadow-sm transition-all flex items-center gap-0.5"
                              >
                                + เพิ่มล็อค
                              </button>
                              
                              {showAddStallSelect && (
                                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#8B4513]/25 rounded-lg shadow-xl z-50 p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                                  {/* Red search input inside dropdown */}
                                  <input
                                    type="text"
                                    value={stallFilter}
                                    onChange={(e) => setStallFilter(e.target.value)}
                                    placeholder="ค้นหาชื่อล็อค..."
                                    className="p-1.5 border border-red-500 rounded text-xs text-gray-800 bg-red-50/10 focus:outline-none focus:ring-1 focus:ring-red-500 font-bold mb-1"
                                    autoFocus
                                  />
                                  {(() => {
                                    const vacantStalls = stalls.filter(s => 
                                      s.type !== 'ทางเดิน' && 
                                      s.type !== 'อื่นๆ' && 
                                      !bookings.some(b => b.status !== 'ลา' && (b.stall_name === s.name || (b.stall_name && b.stall_name.split(',').map(name => name.trim()).includes(s.name)))) && 
                                      !selectedStallsList.some(item => item.name === s.name)
                                    );
                                    const filteredVacant = vacantStalls.filter(s => 
                                      s.name.toLowerCase().includes(stallFilter.toLowerCase())
                                    );
                                    
                                    const sortedVacant = [...filteredVacant].sort((a, b) => {
                                      const isFoodA = a.type === 'อาหาร';
                                      const isFoodB = b.type === 'อาหาร';
                                      if (isFoodA && !isFoodB) return -1;
                                      if (!isFoodA && isFoodB) return 1;
                                      
                                      const nameA = a.name.replace(/[\[\]]/g, '');
                                      const nameB = b.name.replace(/[\[\]]/g, '');
                                      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                                    });
                                    
                                    if (sortedVacant.length === 0) {
                                      return <span className="text-[10px] text-gray-400 text-center py-2">ไม่พบชื่อล็อคที่ตรงกัน</span>;
                                    }
                                    
                                    return sortedVacant.map((vSt) => (
                                      <button
                                        key={vSt.name}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...selectedStallsList, vSt];
                                          setSelectedStallsList(updated);
                                          setStallPrice(calculateDefaultStallPrice(updated));
                                          setShowAddStallSelect(false);
                                          setStallFilter('');
                                        }}
                                        className="w-full text-left px-2 py-1.5 hover:bg-amber-50 rounded text-xs font-mono font-bold text-gray-700 flex justify-between items-center transition-colors border-b border-gray-100 last:border-b-0"
                                      >
                                        <span>{cleanStallName(vSt.name)}</span>
                                        <span className="text-[9px] text-gray-400 font-medium">({vSt.type})</span>
                                      </button>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Booker Name and 4. Product Name side-by-side */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#5D4037] flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#8B4513] shrink-0" /> ชื่อผู้ค้า / เบอร์โทร *
                          </label>
                          <input 
                            type="text" 
                            value={bookerName}
                            onChange={(e) => setBookerName(e.target.value)}
                            placeholder="ชื่อและเบอร์ติดต่อ"
                            className="p-2 border border-[#8B4513]/30 rounded-lg text-xs text-gray-800 bg-[#FFFDF9] focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#5D4037] flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-[#8B4513] shrink-0" /> สินค้าที่ขาย *
                          </label>
                          <input 
                            type="text" 
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="เช่น เสื้อผ้าวินเทจ"
                            className="p-2 border border-[#8B4513]/30 rounded-lg text-xs text-gray-800 bg-[#FFFDF9] focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                          />
                        </div>
                      </div>

                      {/* 5. Electric Unit & Total Price side-by-side (More Prominent Banner) */}
                      <div className="grid grid-cols-2 gap-2 items-end">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#5D4037] flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-[#8B4513] shrink-0" /> ค่าไฟ (หน่วย)
                            </span>
                            {elecPrice > 0 && <span className="text-[10px] text-[#8B4513] font-bold">({elecPrice} บ.)</span>}
                          </label>
                          <input 
                            type="number" 
                            disabled={isAlreadyPaid}
                            value={elecUnit}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = parseNumber(e.target.value);
                              setElecUnit(val);
                              setElecPrice(val * 10); // 10 Baht per unit
                            }}
                            className={`p-2 border border-[#8B4513]/30 rounded-lg text-xs text-gray-800 bg-[#FFFDF9] text-center focus:outline-none focus:ring-1 focus:ring-[#8B4513] ${
                              isAlreadyPaid ? 'opacity-65 bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="0 หน่วย"
                          />
                        </div>
                        <div className="bg-[#FFFDF9] border-2 border-dashed border-[#8B4513] rounded-lg p-2.5 flex flex-col justify-center h-[42px] text-center shadow-xs">
                          <div className="flex justify-between items-center text-xs font-black text-[#5D4037] px-0.5 font-bold">
                            <span>รวมเงินทั้งสิ้น:</span>
                            <span className="text-sm md:text-base font-black text-red-800 font-mono">
                              {totalVal.toFixed(2)} บ.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Redesigned Payment Section */}
                      <div className="flex flex-col gap-2 bg-[#FFFDF9] border border-[#8B4513]/25 rounded-xl p-3 shadow-xs">
                        <label className="text-xs font-bold text-[#5D4037] flex items-center gap-1 border-b border-[#8B4513]/10 pb-1.5">
                          <Banknote className="w-3.5 h-3.5 text-[#8B4513] shrink-0" /> รับเงินชำระ (บาท)
                        </label>
                        
                        <div className="flex flex-col gap-2">
                          {paymentList.map((entry, index) => {
                            const isAmountEntered = entry.amount && parseNumber(entry.amount) > 0;
                            return (
                              <div key={index} className="flex items-center gap-2">
                                {/* Amount input */}
                                <div className="flex-1 relative">
                                  <input
                                    type="number"
                                    disabled={isAlreadyPaid || entry.isSaved}
                                    value={entry.amount}
                                    onChange={(e) => {
                                      const updated = [...paymentList];
                                      updated[index].amount = e.target.value;
                                      setPaymentList(updated);
                                    }}
                                    placeholder="กรอกยอดเงินชำระ"
                                    className={`w-full p-2 border border-[#8B4513]/30 rounded-lg text-xs text-right text-gray-800 bg-white font-mono font-extrabold focus:outline-none focus:ring-1 focus:ring-[#8B4513] ${
                                      (isAlreadyPaid || entry.isSaved) ? 'opacity-65 bg-gray-100 cursor-not-allowed' : ''
                                    }`}
                                  />
                                </div>

                                {/* Method buttons (always visible, disabled if no amount or already paid) */}
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={!isAmountEntered || isAlreadyPaid || entry.isSaved}
                                    onClick={() => {
                                      const updated = [...paymentList];
                                      updated[index].method = 'เงินสด';
                                      setPaymentList(updated);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                      (isAlreadyPaid || entry.isSaved)
                                        ? entry.method === 'เงินสด'
                                          ? 'bg-[#5D4037] text-white border-[#5D4037] opacity-80 pointer-events-none shadow-xs'
                                          : 'bg-gray-100/70 text-gray-400 border-gray-200 opacity-40 pointer-events-none'
                                        : !isAmountEntered
                                          ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-40 cursor-not-allowed pointer-events-none'
                                          : entry.method === 'เงินสด'
                                            ? 'bg-[#5D4037] text-white border-[#5D4037] shadow-xs'
                                            : 'bg-white text-gray-500 border-[#8B4513]/25 hover:bg-amber-50'
                                    }`}
                                  >
                                    เงินสด
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!isAmountEntered || isAlreadyPaid || entry.isSaved}
                                    onClick={() => {
                                      const updated = [...paymentList];
                                      updated[index].method = 'โอนเงิน';
                                      setPaymentList(updated);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                      (isAlreadyPaid || entry.isSaved)
                                        ? entry.method === 'โอนเงิน'
                                          ? 'bg-[#5D4037] text-white border-[#5D4037] opacity-80 pointer-events-none shadow-xs'
                                          : 'bg-gray-100/70 text-gray-400 border-gray-200 opacity-40 pointer-events-none'
                                        : !isAmountEntered
                                          ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-40 cursor-not-allowed pointer-events-none'
                                          : entry.method === 'โอนเงิน'
                                            ? 'bg-[#5D4037] text-white border-[#5D4037] shadow-xs'
                                            : 'bg-white text-gray-500 border-[#8B4513]/25 hover:bg-amber-50'
                                    }`}
                                  >
                                    โอนจ่าย
                                  </button>
                                </div>

                              {/* Delete Split button */}
                              {paymentList.length > 1 && !isAlreadyPaid && !entry.isSaved && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = paymentList.filter((_, idx) => idx !== index);
                                    setPaymentList(updated);
                                  }}
                                  className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors shrink-0"
                                  title="ลบช่องทางนี้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                        {/* Add split payment method button */}
                        {!isFullyPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentList([...paymentList, { method: '', amount: '' }]);
                            }}
                            className="w-full mt-1 py-1.5 bg-[#FAF6EE] hover:bg-[#F5E6D3] text-[#8B4513] rounded-lg text-xs font-bold border border-dashed border-[#8B4513]/40 transition-all flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> เพิ่มการชำระเงิน
                          </button>
                        )}

                        {/* Change Display */}
                        {changeVal > 0 && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 text-right">
                            <span className="inline-block bg-green-50 border border-green-200 text-green-700 font-mono font-extrabold text-[11px] px-3 py-1 rounded-lg">
                              เงินทอน: {changeVal.toFixed(2)} บาท
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 9. Note (Note input field) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#5D4037] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#8B4513]" /> โน้ตกรอกข้อความ
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="กรอกข้อความหมายเหตุเพิ่มเติม..."
                          rows="2"
                          className="p-2 border border-[#8B4513]/30 rounded-lg text-xs text-gray-800 bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                        />
                      </div>

                      {/* Extra Admin tools */}
                      {selectedBooking && selectedBooking.type === 'รายวัน' && isAlreadyPaid && (
                        <div className="mt-2.5 border-t border-[#8B4513]/10 pt-3.5 flex flex-col gap-2">
                          <span className="text-[10px] font-black text-[#8B4513]/60 uppercase tracking-widest block mb-0.5">เครื่องมือบริการลูกค้า:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* 1. เพิ่มไฟ */}
                            <button
                              type="button"
                              onClick={() => {
                                setAddUtilityUnit(1);
                                setAddUtilityPrice(10);
                                setAddUtilityMethod('');
                                setShowAddUtilityModal(true);
                              }}
                              className="px-3 py-2 bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-amber-600/10 cursor-pointer"
                            >
                              <Zap className="w-4 h-4 shrink-0" /> เพิ่มไฟ
                            </button>

                            {/* 2. แจ้งลา */}
                            <button
                              type="button"
                              onClick={handleMarkAbsent}
                              className="px-3 py-2 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-orange-600/10 cursor-pointer"
                            >
                              <X className="w-4 h-4 shrink-0" /> แจ้งลา
                            </button>

                            {/* 3. ย้ายล็อค */}
                            <button
                              type="button"
                              onClick={() => {
                                setMoveTargetDate(selectedDate);
                                setMoveTargetStall(null);
                                setMoveStallFilter('');
                                fetchVacantStallsForDate(selectedDate);
                                setShowMoveLockModal(true);
                              }}
                              className="px-3 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-indigo-600/10 cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4 shrink-0" /> ย้ายล็อค
                            </button>

                            {/* 4. ออกตั๋ว */}
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptPreviewData({ bookingObj: selectedBooking, stallObj: selectedStall });
                                setShowReceiptPreviewModal(true);
                              }}
                              className="px-3 py-2 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-blue-600/10 cursor-pointer"
                            >
                              <Printer className="w-4 h-4 shrink-0" /> ออกตั๋ว
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedBooking && selectedBooking.type !== 'รายวัน' && isPaidInDb && (
                        <div className="mt-1.5 border-t pt-3 flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">เครื่องมือบริการลูกค้า:</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAddUtilityUnit(1);
                                setAddUtilityPrice(10);
                                setAddUtilityMethod('');
                                setShowAddUtilityModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5" /> จดไฟหน่วยเพิ่ม
                            </button>
                            <button
                              type="button"
                              onClick={handleMarkAbsent}
                              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                            >
                              <X className="w-3.5 h-3.5" /> แจ้งลาหยุด (ลา)
                            </button>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Modal Footer Controls (Dynamic based on Paid status) */}
                    <div className="bg-gray-50 border-t px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                      {selectedBooking ? (
                        selectedBooking.type === 'รายวัน' ? (
                          // Daily Booking: Reorganized footer
                          <div className="flex justify-between items-center w-full">
                            {!isAlreadyPaid ? (
                              <button
                                type="button"
                                onClick={handleDeleteBooking}
                                className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow transition-colors duration-200 cursor-pointer"
                                title="ยกเลิกการจองล็อคนี้"
                              >
                                <Trash2 className="w-4.5 h-4.5" /> ยกเลิกการจอง
                              </button>
                            ) : (
                              <div />
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleSaveBooking(isFullyPaid ? 'ชำระแล้ว' : 'ค้างชำระ', isFullyPaid)}
                              className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow transition-colors duration-200 cursor-pointer"
                            >
                              <Check className="w-4.5 h-4.5" /> {isFullyPaid ? "บันทึก/พิมพ์ตั๋ว" : "บันทึก (ค้างจ่าย)"}
                            </button>
                          </div>
                        ) : (
                          // Monthly Booking: Original footer
                          <>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleDeleteBooking}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow"
                              >
                                <Trash2 className="w-4 h-4" /> ยกเลิกการจอง
                              </button>
                              {isFullyPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptPreviewData({ bookingObj: selectedBooking, stallObj: selectedStall });
                                    setShowReceiptPreviewModal(true);
                                  }}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow"
                                >
                                  <Printer className="w-4 h-4" /> ดู/พิมพ์ตั๋ว
                                </button>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {!isFullyPaid ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveBooking('ค้างชำระ')}
                                  className="px-3 py-2 bg-[#8B5A2B] hover:bg-[#6D4C41] text-white rounded-lg font-bold text-xs shadow"
                                >
                                  บันทึก (ค้างจ่าย)
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleMarkAbsent}
                                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow"
                                    title="แจ้งลาหยุดแต่ชำระเงินแล้ว เพื่อปล่อยล็อคว่างให้ผู้อื่น"
                                  >
                                    <X className="w-4 h-4" /> แจ้งลาหยุด (ลา)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveBooking('ชำระแล้ว', true)}
                                    className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow"
                                  >
                                    <Printer className="w-4 h-4" /> บันทึกและพิมพ์ตั๋ว
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )
                      ) : (
                        // New booking: Footer controls
                        <div className="flex justify-end w-full">
                          <button
                            type="button"
                            onClick={() => handleSaveBooking(isFullyPaid ? 'ชำระแล้ว' : 'ค้างชำระ', isFullyPaid)}
                            className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow transition-colors duration-200 cursor-pointer"
                          >
                            <Check className="w-4.5 h-4.5" /> {isFullyPaid ? "บันทึก/พิมพ์ตั๋ว" : "บันทึก (ค้างจ่าย)"}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()
            )}

          </div>
        </div>
      )}

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
                      src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" 
                      alt="LVT Logo" 
                      className="w-16 h-16 object-contain mb-1"
                    />
                    <h2 className="font-black text-sm text-center">ตลาดลาดสวายวินเทจ</h2>
                    <p className="text-[10px] text-gray-600 text-center font-bold">Ladsawai Vintage Market</p>
                    <p className="text-[9px] text-gray-500 text-center font-bold">เลขที่ 52/34 หมู่ 5</p>
                    <p className="text-[9px] text-gray-500 text-center font-bold">ต.ลาดสวาย อ.ลำลูกกา จ.ปทุมธานี 12150</p>
                    <p className="text-[9px] text-gray-500 text-center font-bold">บริการเช่าพื้นที่จองล็อค ตลาดนัดรายวัน-รายเดือน</p>
                    <p className="text-[9px] text-gray-500 text-center font-bold">โทร: 0-92-869-7774 , 0-92-869-7775</p>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <div className="space-y-1 text-[10px] font-bold text-gray-700">
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

                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <div className="space-y-1.5 py-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">วันที่ทำการค้า:</span>
                      <span className="font-black text-gray-900">{tradingDateFormatted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">ล็อกที่เช่า:</span>
                      <span className="font-black text-red-800">{formattedStallName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">ผู้ค้า:</span>
                      <span className="font-black text-gray-900">{bookingObj.booker_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">สินค้าที่ขาย:</span>
                      <span className="font-black text-gray-900">{bookingObj.product || '-'}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-dashed border-gray-400 text-gray-600 font-bold">
                        <th className="py-1">รายการ</th>
                        <th className="py-1 text-right">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-gray-700">
                      <tr>
                        <td className="py-1">ค่าล็อกสะสม</td>
                        <td className="py-1 text-right font-mono">{stallPriceVal.toFixed(2)} บ.</td>
                      </tr>
                      {elecPriceVal > 0 && (
                        <tr>
                          <td className="py-1">ค่าไฟ ({bookingObj.elec_unit || 0} หน่วย)</td>
                          <td className="py-1 text-right font-mono">{elecPriceVal.toFixed(2)} บ.</td>
                        </tr>
                      )}
                      {storageFeeVal > 0 && (
                        <tr>
                          <td className="py-1">ค่าฝากของ</td>
                          <td className="py-1 text-right font-mono">{storageFeeVal.toFixed(2)} บ.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-black text-black text-sm">
                      <span>รวมเงินทั้งสิ้น:</span>
                      <span className="font-mono">{totalAmountVal.toFixed(2)} บ.</span>
                    </div>
                    
                    <div className="pt-1.5 space-y-0.5 text-[10px] font-bold text-gray-600">
                      {paymentLines.map((p, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>ชำระด้วย [{p.method}]:</span>
                          <span className="font-mono">{p.amount.toFixed(2)} บ.</span>
                        </div>
                      ))}
                      {changeVal > 0 && (
                        <div className="flex justify-between text-red-700 font-bold">
                          <span>เงินทอน:</span>
                          <span className="font-mono">{changeVal.toFixed(2)} บ.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <div className="text-center text-[10px] text-gray-500 font-bold space-y-0.5 mt-2">
                    <p>Line Official: @ladsawaivintage</p>
                    <p className="text-black">ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
                    <p className="text-[8px] text-gray-400">Powered by PJMJK</p>
                  </div>

                </div>

              </div>

              <div className="bg-gray-50 border-t px-4 py-3 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(bookingObj, stallObj)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <Printer className="w-4 h-4" /> พิมพ์ตั๋ว (80mm)
                </button>
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
      

      {/* 🗓️ 2.3 Add Monthly Payment Modal */}
      {showMonthlyMgmtModal && showMonthlyPaymentModal && activeMonthlyBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden animate-pop-in flex flex-col p-6 gap-4">
            <h3 className="font-bold text-lg text-center text-gray-800 shrink-0">บันทึกการชำระเงิน</h3>
            
            <form onSubmit={handleMonthlyPaymentSubmit} className="flex flex-col gap-3.5 overflow-y-auto pr-1">
              {/* วันที่ชำระเงิน */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">วันที่ชำระเงิน</label>
                <input 
                  type="date"
                  value={monthlyPaymentForm.date}
                  onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm font-bold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* ยอดเต็ม & ค้างชำระ Card */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex flex-col gap-2.5">
                <div className="flex justify-between font-bold">
                  <span>ยอดเต็ม: {parseNumber(activeMonthlyBooking.total_price || 0).toLocaleString()}.-</span>
                  <span className="text-red-600">ค้างชำระ: {(parseNumber(activeMonthlyBooking.total_price || 0) - parseNumber(activeMonthlyBooking.paid_amount || 0)).toLocaleString()}.-</span>
                </div>
                
                <div className="border-t border-dashed border-blue-200/60 my-0.5"></div>
                
                {/* ตัวช่วยคำนวณ */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-center text-gray-500">ตัวช่วยคำนวณยอดชำระ</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[25, 50, 75, 100].map((pct) => {
                      const total = parseNumber(activeMonthlyBooking.total_price || 0);
                      const remaining = total - parseNumber(activeMonthlyBooking.paid_amount || 0);
                      const isClose = pct === 100;
                      const val = isClose ? (remaining > 0 ? remaining : 0) : (total * (pct / 100));
                      
                      const formAmt = parseNumber(monthlyPaymentForm.amount);
                      const isActive = isClose ? (formAmt === remaining) : (formAmt === val);

                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setMonthlyPaymentForm({
                              ...monthlyPaymentForm,
                              amount: String(Math.round(val * 100) / 100)
                            });
                          }}
                          className={`flex flex-col items-center justify-center py-1 border rounded-lg transition-all ${
                            isActive 
                              ? 'border-blue-600 bg-blue-100/50 text-blue-800 font-bold shadow-xs' 
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="text-[10px] font-bold">{isClose ? 'ปิดยอด' : `${pct}%`}</span>
                          <span className={`text-[9px] ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ยอดชำระ (บาท) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">ยอดชำระ (บาท)</label>
                <input 
                  type="number" 
                  step="any"
                  value={monthlyPaymentForm.amount} 
                  onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full py-3 border border-green-200 rounded-xl text-center text-2xl font-extrabold text-green-800 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-400"
                  required
                />
              </div>

              {/* ประเภทการบันทึก */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">ประเภทการบันทึก</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'เงินสด', label: 'เงินสด', icon: <Banknote className="w-4 h-4" />, activeClass: 'border-green-600 text-green-700 bg-green-50/50', inactiveClass: 'border-gray-200 text-gray-700 hover:bg-gray-50' },
                    { value: 'โอนจ่าย', label: 'โอนจ่าย', icon: <CreditCard className="w-4 h-4" />, activeClass: 'border-blue-600 text-blue-700 bg-blue-50/50', inactiveClass: 'border-gray-200 text-gray-700 hover:bg-gray-50' },
                    { value: 'ส่วนลด', label: 'ส่วนลด', icon: <Tag className="w-4 h-4" />, activeClass: 'border-amber-600 text-amber-700 bg-amber-50/50', inactiveClass: 'border-gray-200 text-gray-700 hover:bg-gray-50' }
                  ].map((m) => {
                    const isActive = monthlyPaymentForm.method === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMonthlyPaymentForm({ ...monthlyPaymentForm, method: m.value })}
                        className={`flex items-center justify-center gap-1.5 py-2 border rounded-lg transition-all text-xs font-bold cursor-pointer ${
                          isActive ? m.activeClass + ' border-2 shadow-xs' : m.inactiveClass
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {monthlyPaymentForm.method === 'โอนจ่าย' && (
                <div className="flex flex-col gap-1.5 p-3 bg-blue-50/30 rounded-xl border border-blue-100/60 text-left text-xs">
                  <label className="text-xs font-bold text-blue-900 flex justify-between">
                    <span>แนบภาพสลิปโอนเงิน (สแกนอัตโนมัติ)</span>
                    
                  </label>
                  <div className="relative border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white rounded-lg p-2 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleSlipChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    {slipPreviewUrl ? (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <img src={slipPreviewUrl} alt="Slip Preview" className="h-28 w-auto object-contain rounded-md shadow border border-gray-200" />
                        <span className="text-[10px] text-gray-500 font-semibold">อัปโหลดสลิปเรียบร้อย</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-3 text-blue-500/80">
                        <CreditCard className="w-6 h-6 animate-pulse" />
                        <span className="text-[10px] font-bold">คลิกเพื่ออัปโหลดไฟล์สลิป</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* โน้ต / หมายเหตุ */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">โน้ต / หมายเหตุ</label>
                <textarea 
                  value={monthlyPaymentForm.note} 
                  onChange={(e) => setMonthlyPaymentForm({ ...monthlyPaymentForm, note: e.target.value })}
                  placeholder="กรอกรายละเอียดเพิ่มเติม..."
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowMonthlyPaymentModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗓️ 2.2 Edit Monthly Item Modal */}
      {showMonthlyMgmtModal && selectedMonthlyItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-purple-800 overflow-hidden animate-pop-in">
            <div className="bg-purple-800 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">แก้ไขข้อมูลรายเดือน: {selectedMonthlyItem.booker_name}</h3>
              <button onClick={() => setSelectedMonthlyItem(null)} className="text-purple-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleUpdateMonthlyItem} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500 font-bold">ล็อกที่เช่า</span>
                <span className="text-xs font-bold text-gray-800 bg-white p-2.5 rounded border">{cleanStallName(selectedMonthlyItem.stalls)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold">ค่าเช่าทั้งหมด</span>
                  <span className="text-xs font-bold text-gray-800 bg-white p-2.5 rounded border text-center">{selectedMonthlyItem.total_price}.-</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">ยอดที่จ่ายแล้ว (บาท)</label>
                  <input 
                    type="number" 
                    value={selectedMonthlyItem.paid_amount || 0} 
                    onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, paid_amount: e.target.value })}
                    className="p-1.5 border border-purple-300 rounded text-xs bg-white text-center" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">สถานะชำระเงิน</label>
                <select 
                  value={selectedMonthlyItem.status} 
                  onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, status: e.target.value })}
                  className="p-1.5 border border-purple-300 rounded text-xs bg-white focus:outline-none"
                >
                  <option value="ชำระแล้ว">ชำระแล้ว (Paid)</option>
                  <option value="ค้างชำระ">ค้างชำระ (Unpaid)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">สถานะต่อสัญญา</label>
                <select 
                  value={selectedMonthlyItem.renewal_status || ''} 
                  onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, renewal_status: e.target.value })}
                  className="p-1.5 border border-purple-300 rounded text-xs bg-white focus:outline-none"
                >
                  <option value="ต่อสัญญาแล้ว">ต่อสัญญาแล้ว</option>
                  <option value="รอยืนยัน">รอยืนยัน</option>
                  <option value="ไม่ต่อสัญญา">ไม่ต่อสัญญา</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">หมายเหตุ</label>
                <textarea 
                  value={selectedMonthlyItem.note || ''} 
                  onChange={(e) => setSelectedMonthlyItem({ ...selectedMonthlyItem, note: e.target.value })}
                  rows="2"
                  className="p-1.5 border border-purple-300 rounded text-xs bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold transition-all shadow"
                >
                  อัปเดตข้อมูล
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedMonthlyItem(null)}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗓️ 2.1 Monthly Print Parameters Modal */}
      

      {/* 📦 1.1 Storage Print Parameters Modal */}
      

      {/* 💸 3. Finance Management Modal */}
      

      {/* ⚙️ 4. Settings Management Modal */}
      

      {/* 🔄 Move Lock Modal */}
      

    
      {/* Modal Components */}
      <LoginModal />
      <StorageMgmtModal />
      <MonthlyMgmtModal />
      <FinanceMgmtModal />
      <SettingsMgmtModal />
      <AddUtilityModal />
      <MoveLockModal />
      <SlipPreviewModal />
      <StoragePrintModal />
      <MonthlyPrintModal />
      <NewMonthlyModal />
    </div>
  );
}
