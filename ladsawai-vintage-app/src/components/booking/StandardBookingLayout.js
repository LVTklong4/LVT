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
import StandardBookingTopBar from './StandardBookingTopBar';
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

      {/* Header & Controls Toolbar */}
      <StandardBookingTopBar
        onOpenOffGrid={() => {
          setSelectedOffGridBookingObj(null);
          setShowOffGridBooking(true);
        }}
        onOpenKlongThom={() => setShowKlongThomModal(true)}
        onOpenDailyClosing={() => setShowDailyClosingModal(true)}
      />


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
