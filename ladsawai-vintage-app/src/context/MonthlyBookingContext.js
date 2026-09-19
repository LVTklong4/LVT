'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import {
  monthNamesFull,
  formatBookingMonth,
  sortThaiMonthsDescending,
  formatPhoneDisplay,
  getBookingMonthStr
} from '@/utils/thaiDateHelper';
import { cleanStallName, parseNumber } from '@/utils/numberHelper';
import {
  createMonthlyBooking,
  updateMonthlyBooking,
  updateMonthlyItemQuick,
  deleteMonthlyBooking,
  toggleMonthlyNonRenewal
} from '@/services/monthly/monthlyOperationsService';
import {
  renewSingleMonthlyBooking,
  renewBulkMonthlyBookings,
  computeNextMonthThai,
  getCustomerIdentityKey
} from '@/services/monthly/monthlyBulkRenewService';
import {
  submitMonthlyPayment,
  deleteMonthlyTransaction,
  fetchMonthlyTransactions as fetchTxnsService,
  scanSlipFile
} from '@/services/monthly/monthlyPaymentService';
import {
  generateMonthlyReceiptHTML,
  printReceiptInWindow,
  getDayOccurrences
} from '@/services/monthly/monthlyPrintService';
import { syncMonthlyAndFinanceFromSheets } from '@/services/monthly/monthlyArchiveService';
import { calculateMonthlySummary } from '@/services/monthly/monthlyPricingService';

const MonthlyBookingContext = createContext();

export function MonthlyBookingProvider({ children }) {
  const { adminUser } = useAuthAdmin();

  // Core Data
  const [monthlyList, setMonthlyList] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [stalls, setStalls] = useState([]);

  // Filters & Sorting
  const [monthlyMonthFilter, setMonthlyMonthFilter] = useState('ทั้งหมด');
  const [monthlySearchQuery, setMonthlySearchQuery] = useState('');
  const [monthlySortField, setMonthlySortField] = useState('stall_name');
  const [monthlySortOrder, setMonthlySortOrder] = useState('asc');
  const [showCancelled, setShowCancelled] = useState(false);

  // Modals Visibility
  const [showMonthlyMgmtModal, setShowMonthlyMgmtModal] = useState(false);
  const [showNewMonthlyModal, setShowNewMonthlyModal] = useState(false);
  const [showBulkRenewModal, setShowBulkRenewModal] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  const [showMonthlyPaymentModal, setShowMonthlyPaymentModal] = useState(false);
  const [showMonthlyPrintModal, setShowMonthlyPrintModal] = useState(false);
  const [showPreRenewalModal, setShowPreRenewalModal] = useState(false);

  // Active Selections
  const [selectedMonthlyItem, setSelectedMonthlyItem] = useState(null);
  const [activeMonthlyBooking, setActiveMonthlyBooking] = useState(null);
  const [activeMonthlyTransactions, setActiveMonthlyTransactions] = useState([]);
  const [loadingMonthlyTxns, setLoadingMonthlyTxns] = useState(false);
  const [invoicePreviewItem, setInvoicePreviewItem] = useState(null);
  const [syncingLegacy, setSyncingLegacy] = useState(false);

  // Alert & Confirm Dialog States
  const [alertInfo, setAlertInfo] = useState(null);
  const [confirmInfo, setConfirmInfo] = useState(null);
  const alertTimeoutRef = useRef(null);

  const showAlert = useCallback((message, title = 'แจ้งเตือน', isError = false) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlertInfo({ message, title, isError });
    const duration = isError ? 15000 : 4000;
    alertTimeoutRef.current = setTimeout(() => {
      setAlertInfo(null);
      alertTimeoutRef.current = null;
    }, duration);
  }, []);

  const showConfirm = useCallback(({ title = 'ยืนยันการทำรายการ', message, confirmText = 'ตกลง', cancelText = 'ยกเลิก', isDanger = false }) => {
    return new Promise((resolve) => {
      setConfirmInfo({
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => {
          setConfirmInfo(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmInfo(null);
          resolve(false);
        }
      });
    });
  }, []);

  // Form States: New / Edit Monthly Booking
  const [isEditingMonthlyMode, setIsEditingMonthlyMode] = useState(false);
  const [editingMonthlyId, setEditingMonthlyId] = useState(null);
  const [newMonthlyStartDate, setNewMonthlyStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMonthlyCustomerType, setNewMonthlyCustomerType] = useState('Standard');
  const [newMonthlyBookerName, setNewMonthlyBookerName] = useState('');
  const [newMonthlyProduct, setNewMonthlyProduct] = useState('');
  const [newMonthlyPhone, setNewMonthlyPhone] = useState('');
  const [newMonthlyNote, setNewMonthlyNote] = useState('');
  const [newMonthlyStorageFee, setNewMonthlyStorageFee] = useState('');
  const [newMonthlyElecUnit, setNewMonthlyElecUnit] = useState('');
  const [newMonthlyCustomPrice, setNewMonthlyCustomPrice] = useState('');
  const [newMonthlyDays, setNewMonthlyDays] = useState({ wed: true, sat: true, sun: true });
  const [newMonthlyStallsWed, setNewMonthlyStallsWed] = useState([]);
  const [newMonthlyStallsSat, setNewMonthlyStallsSat] = useState([]);
  const [newMonthlyStallsSun, setNewMonthlyStallsSun] = useState([]);
  const [editMonthlyPaidAmount, setEditMonthlyPaidAmount] = useState('0');
  const [editMonthlyStatus, setEditMonthlyStatus] = useState('ค้างชำระ');
  const [editMonthlyRenewalStatus, setEditMonthlyRenewalStatus] = useState('');

  // Dropdown Filter States for Stalls in NewMonthlyModal
  const [showAddStallSelectWed, setShowAddStallSelectWed] = useState(false);
  const [showAddStallSelectSat, setShowAddStallSelectSat] = useState(false);
  const [showAddStallSelectSun, setShowAddStallSelectSun] = useState(false);
  const [stallFilterWed, setStallFilterWed] = useState('');
  const [stallFilterSat, setStallFilterSat] = useState('');
  const [stallFilterSun, setStallFilterSun] = useState('');

  const addStallDropdownRefWed = useRef(null);
  const addStallDropdownRefSat = useRef(null);
  const addStallDropdownRefSun = useRef(null);

  // Payment Form & Slip
  const [monthlyPaymentForm, setMonthlyPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: '',
    note: '',
    slip_base64: null
  });
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
  const [fullScreenSlipUrl, setFullScreenSlipUrl] = useState(null);

  // Bulk Renew States
  const [bulkRenewFromMonth, setBulkRenewFromMonth] = useState('');
  const [bulkRenewToMonth, setBulkRenewToMonth] = useState('');
  const [bulkRenewCheckedIds, setBulkRenewCheckedIds] = useState([]);
  const [bulkRenewEditData, setBulkRenewEditData] = useState({});
  const [bulkRenewEditingItem, setBulkRenewEditingItem] = useState(null);

  // Print Parameter States
  const [monthlyPrintItem, setMonthlyPrintItem] = useState(null);
  const [monthlyPrintMonth, setMonthlyPrintMonth] = useState('');
  const [monthlyPrintProduct, setMonthlyPrintProduct] = useState('');
  const [monthlyPrintSatCount, setMonthlyPrintSatCount] = useState(4);
  const [monthlyPrintSunCount, setMonthlyPrintSunCount] = useState(4);
  const [monthlyPrintWedCount, setMonthlyPrintWedCount] = useState(0);
  const [monthlyPrintTxnNo, setMonthlyPrintTxnNo] = useState('');
  const [monthlyPrintPayments, setMonthlyPrintPayments] = useState([]);

  // Fetch Master Data
  const fetchMonthlyBookings = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const { data, error } = await supabase
        .from('monthly_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMonthlyList(data || []);
    } catch (e) {
      console.error('Error fetching monthly bookings:', e);
    } finally {
      setLoadingMonthly(false);
    }
  }, []);

  const fetchStalls = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('stalls').select('*').order('name');
      if (error) throw error;
      setStalls(data || []);
    } catch (e) {
      console.error('Error fetching stalls in MonthlyBookingContext:', e);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyBookings();
    fetchStalls();
  }, [fetchMonthlyBookings, fetchStalls]);

  // Realtime subscription for monthly_bookings
  useEffect(() => {
    const channel = supabase
      .channel('monthly_bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_bookings' }, () => {
        fetchMonthlyBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonthlyBookings]);

  // Filtered & Sorted monthly list
  const filteredMonthlyList = useMemo(() => {
    let list = monthlyList || [];

    if (!showCancelled) {
      list = list.filter(item => item.status !== 'ยกเลิก');
    } else {
      list = list.filter(item => item.status === 'ยกเลิก');
    }

    if (monthlyMonthFilter && monthlyMonthFilter !== 'ทั้งหมด') {
      list = list.filter(item => {
        if (!item.booking_month) return false;
        return formatBookingMonth(item.booking_month) === monthlyMonthFilter;
      });
    }

    if (monthlySearchQuery.trim()) {
      const q = monthlySearchQuery.toLowerCase().trim();
      list = list.filter(item =>
        (item.booker_name && item.booker_name.toLowerCase().includes(q)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.product && item.product.toLowerCase().includes(q)) ||
        (item.stalls && item.stalls.toLowerCase().includes(q)) ||
        (item.stall_name && item.stall_name.toLowerCase().includes(q)) ||
        (item.phone && item.phone.includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let valA = a[monthlySortField] || '';
      let valB = b[monthlySortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return monthlySortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return monthlySortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [monthlyList, monthlyMonthFilter, monthlySearchQuery, monthlySortField, monthlySortOrder, showCancelled]);

  const handleSortToggle = useCallback((field) => {
    if (monthlySortField === field) {
      setMonthlySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMonthlySortField(field);
      setMonthlySortOrder('asc');
    }
  }, [monthlySortField]);

  const renderSortArrow = useCallback((field) => {
    if (monthlySortField !== field) return '↕️';
    return monthlySortOrder === 'asc' ? '▲' : '▼';
  }, [monthlySortField, monthlySortOrder]);

  // Pricing calculator helper
  const getNewMonthlyPricing = useCallback(() => {
    return calculateMonthlySummary({
      startDate: newMonthlyStartDate,
      selectedDays: newMonthlyDays,
      stallsWed: newMonthlyStallsWed,
      stallsSat: newMonthlyStallsSat,
      stallsSun: newMonthlyStallsSun,
      stallsMaster: stalls,
      customerType: newMonthlyCustomerType,
      elecUnit: newMonthlyElecUnit,
      storageFee: newMonthlyStorageFee,
      customPrice: newMonthlyCustomPrice
    });
  }, [
    newMonthlyStartDate, newMonthlyDays, newMonthlyStallsWed, newMonthlyStallsSat,
    newMonthlyStallsSun, stalls, newMonthlyCustomerType, newMonthlyElecUnit,
    newMonthlyStorageFee, newMonthlyCustomPrice
  ]);

  const getOccupiedStallsInRound = useCallback((dayOfWeek) => {
    if (!newMonthlyStartDate) return [];
    const activeRoundMonthFormatted = formatBookingMonth(getBookingMonthStr(newMonthlyStartDate));
    const occupied = [];
    if (monthlyList && monthlyList.length > 0) {
      monthlyList.forEach(mb => {
        const mbMonthFormatted = formatBookingMonth(mb.booking_month);
        if (mbMonthFormatted === activeRoundMonthFormatted) {
          let parsedDetails = null;
          try {
            if (mb.stall_details) {
              parsedDetails = JSON.parse(mb.stall_details);
            }
          } catch (e) {}

          if (Array.isArray(parsedDetails) && parsedDetails.length > 0) {
            parsedDetails.forEach(item => {
              const days = item.days || [];
              if (days.includes(dayOfWeek)) {
                const cleanName = (item.name || '').replace(/[\[\]]/g, '').trim();
                if (cleanName) {
                  occupied.push(cleanName);
                  occupied.push(`[${cleanName}]`);
                }
              }
            });
          } else {
            const selDaysStr = String(mb.selected_days || '').toLowerCase();
            let dayActive = false;
            if (dayOfWeek === 3 && (selDaysStr.includes('wed') || selDaysStr.includes('พุธ'))) dayActive = true;
            if (dayOfWeek === 6 && (selDaysStr.includes('sat') || selDaysStr.includes('เสาร์'))) dayActive = true;
            if (dayOfWeek === 0 && (selDaysStr.includes('sun') || selDaysStr.includes('อาทิตย์'))) dayActive = true;

            if (dayActive && mb.stalls) {
              mb.stalls.split(',').forEach(s => {
                const cleanS = s.replace(/[\[\]]/g, '').trim();
                if (cleanS) {
                  occupied.push(cleanS);
                  occupied.push(`[${cleanS}]`);
                }
              });
            }
          }
        }
      });
    }
    return occupied;
  }, [newMonthlyStartDate, monthlyList]);

  // Fetch transactions for active contract
  const fetchMonthlyTransactions = useCallback(async (bookingId) => {
    if (!bookingId) return;
    setLoadingMonthlyTxns(true);
    try {
      const data = await fetchTxnsService(bookingId);
      setActiveMonthlyTransactions(data);
    } catch (err) {
      console.error(err);
      setActiveMonthlyTransactions([]);
    } finally {
      setLoadingMonthlyTxns(false);
    }
  }, []);

  // Modal Openers
  const handleOpenNewMonthlyModal = useCallback(() => {
    fetchMonthlyBookings();
    setIsEditingMonthlyMode(false);
    setEditingMonthlyId(null);
    setNewMonthlyStartDate(new Date().toISOString().split('T')[0]);
    setNewMonthlyDays({ wed: true, sat: true, sun: true });
    setNewMonthlyCustomerType('Standard');
    setNewMonthlyStallsWed([]);
    setNewMonthlyStallsSat([]);
    setNewMonthlyStallsSun([]);
    setNewMonthlyStorageFee('');
    setNewMonthlyElecUnit('');
    setNewMonthlyCustomPrice('');
    setNewMonthlyBookerName('');
    setNewMonthlyProduct('');
    setNewMonthlyPhone('');
    setNewMonthlyNote('');
    setShowAddStallSelectWed(false);
    setShowAddStallSelectSat(false);
    setShowAddStallSelectSun(false);
    setStallFilterWed('');
    setStallFilterSat('');
    setStallFilterSun('');
    setShowNewMonthlyModal(true);
  }, [fetchMonthlyBookings]);

  const handleOpenEditMonthlyModal = useCallback((item) => {
    if (!item) return;
    fetchMonthlyBookings();
    setIsEditingMonthlyMode(true);
    setEditingMonthlyId(item.id);
    setNewMonthlyStartDate(item.start_date);
    setNewMonthlyCustomerType(item.customer_type || 'Standard');
    setNewMonthlyBookerName(item.booker_name || '');
    setNewMonthlyProduct(item.product || '');
    setNewMonthlyPhone(formatPhoneDisplay(item.phone));
    setNewMonthlyNote(item.note || '');
    setNewMonthlyStorageFee(String(item.storage_fee || ''));
    setNewMonthlyElecUnit(String(item.elec_unit || ''));
    setNewMonthlyCustomPrice((item.customer_type === 'VIP' || item.customer_type === 'Room') ? String(item.total_price || '0') : '');

    const daysStr = String(item.selected_days || '').toLowerCase();
    setNewMonthlyDays({
      wed: daysStr.includes('wed') || daysStr.includes('พุธ'),
      sat: daysStr.includes('sat') || daysStr.includes('เสาร์'),
      sun: daysStr.includes('sun') || daysStr.includes('อาทิตย์')
    });

    let details = [];
    try {
      details = JSON.parse(item.stall_details || '[]');
    } catch (e) {}

    const wedStalls = [];
    const satStalls = [];
    const sunStalls = [];
    details.forEach(st => {
      const dList = st.days || [];
      if (dList.includes(3)) wedStalls.push(st.name);
      if (dList.includes(6)) satStalls.push(st.name);
      if (dList.includes(0)) sunStalls.push(st.name);
    });
    setNewMonthlyStallsWed(wedStalls);
    setNewMonthlyStallsSat(satStalls);
    setNewMonthlyStallsSun(sunStalls);

    setEditMonthlyPaidAmount(String(item.paid_amount || '0'));
    setEditMonthlyStatus(item.status || 'ค้างชำระ');
    setEditMonthlyRenewalStatus(item.renewal_status || '');

    setShowAddStallSelectWed(false);
    setShowAddStallSelectSat(false);
    setShowAddStallSelectSun(false);
    setStallFilterWed('');
    setStallFilterSat('');
    setStallFilterSun('');
    setShowNewMonthlyModal(true);
  }, [fetchMonthlyBookings]);

  const handleOpenBulkRenewModal = useCallback(() => {
    setShowBulkRenewModal(true);
    const monthsAvailable = sortThaiMonthsDescending(
      Array.from(new Set(monthlyList.map(item => formatBookingMonth(item.booking_month)).filter(m => m !== '-')))
    );
    const fromMonth = monthlyMonthFilter === 'ทั้งหมด' ? (monthsAvailable[0] || '') : monthlyMonthFilter;
    setBulkRenewFromMonth(fromMonth);
    setBulkRenewToMonth(computeNextMonthThai(fromMonth));
    setBulkRenewCheckedIds([]);
    setBulkRenewEditData({});
  }, [monthlyList, monthlyMonthFilter]);

  const handleOpenMonthlyPaymentModal = useCallback((booking) => {
    setActiveMonthlyBooking(booking);
    setMonthlyPaymentForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: '',
      note: '',
      slip_base64: null
    });
    setSlipPreviewUrl(null);
    setShowMonthlyPaymentModal(true);
    fetchMonthlyTransactions(booking.id);
  }, [fetchMonthlyTransactions]);

  // CRUD Operations Handlers
  const handleCreateNewMonthlyBooking = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoadingMonthly(true);
    try {
      const res = await createMonthlyBooking({
        adminUser,
        bookerName: newMonthlyBookerName,
        phone: newMonthlyPhone,
        startDate: newMonthlyStartDate,
        days: newMonthlyDays,
        stallsWed: newMonthlyStallsWed,
        stallsSat: newMonthlyStallsSat,
        stallsSun: newMonthlyStallsSun,
        stallsMaster: stalls,
        customerType: newMonthlyCustomerType,
        product: newMonthlyProduct,
        note: newMonthlyNote,
        elecUnit: newMonthlyElecUnit,
        storageFee: newMonthlyStorageFee,
        customPrice: newMonthlyCustomPrice
      });
      showAlert(`จองล็อครายเดือนสำเร็จ สำหรับคุณ "${newMonthlyBookerName}"`, "สำเร็จ");
      setShowNewMonthlyModal(false);
      fetchMonthlyBookings();
      return res;
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการบันทึกจองรายเดือน: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [
    adminUser, newMonthlyBookerName, newMonthlyPhone, newMonthlyStartDate, newMonthlyDays,
    newMonthlyStallsWed, newMonthlyStallsSat, newMonthlyStallsSun, stalls, newMonthlyCustomerType,
    newMonthlyProduct, newMonthlyNote, newMonthlyElecUnit, newMonthlyStorageFee,
    newMonthlyCustomPrice, showAlert, fetchMonthlyBookings
  ]);

  const handleSaveEditedMonthlyBooking = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      await updateMonthlyBooking({
        editingMonthlyId,
        bookerName: newMonthlyBookerName,
        phone: newMonthlyPhone,
        startDate: newMonthlyStartDate,
        days: newMonthlyDays,
        stallsWed: newMonthlyStallsWed,
        stallsSat: newMonthlyStallsSat,
        stallsSun: newMonthlyStallsSun,
        stallsMaster: stalls,
        customerType: newMonthlyCustomerType,
        product: newMonthlyProduct,
        note: newMonthlyNote,
        elecUnit: newMonthlyElecUnit,
        storageFee: newMonthlyStorageFee,
        customPrice: newMonthlyCustomPrice,
        editStatus: editMonthlyStatus,
        editPaidAmount: editMonthlyPaidAmount,
        editRenewalStatus: editMonthlyRenewalStatus
      });
      showAlert("แก้ไขการจองรายเดือนสำเร็จ", "สำเร็จ");
      setShowNewMonthlyModal(false);
      if (activeMonthlyBooking && activeMonthlyBooking.id === editingMonthlyId) {
        setActiveMonthlyBooking(null);
        setActiveMonthlyTransactions([]);
      }
      fetchMonthlyBookings();
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการบันทึกการแก้ไข: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [
    editingMonthlyId, newMonthlyBookerName, newMonthlyPhone, newMonthlyStartDate, newMonthlyDays,
    newMonthlyStallsWed, newMonthlyStallsSat, newMonthlyStallsSun, stalls, newMonthlyCustomerType,
    newMonthlyProduct, newMonthlyNote, newMonthlyElecUnit, newMonthlyStorageFee,
    newMonthlyCustomPrice, editMonthlyStatus, editMonthlyPaidAmount, editMonthlyRenewalStatus,
    activeMonthlyBooking, showAlert, fetchMonthlyBookings
  ]);

  const handleUpdateMonthlyItem = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!selectedMonthlyItem) return;
    setLoadingMonthly(true);
    try {
      await updateMonthlyItemQuick(selectedMonthlyItem);
      showAlert("อัปเดตข้อมูลผู้เช่ารายเดือนสำเร็จ", "สำเร็จ");
      if (activeMonthlyBooking && activeMonthlyBooking.id === selectedMonthlyItem.id) {
        setActiveMonthlyBooking({ ...activeMonthlyBooking, ...selectedMonthlyItem });
      }
      setSelectedMonthlyItem(null);
      fetchMonthlyBookings();
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการอัปเดต: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [selectedMonthlyItem, activeMonthlyBooking, showAlert, fetchMonthlyBookings]);

  const handleDeleteMonthlyBooking = useCallback(async (item) => {
    setLoadingMonthly(true);
    try {
      const res = await deleteMonthlyBooking(item, adminUser, showConfirm);
      if (res?.success) {
        showAlert(res.mode === 'soft_delete' ? "ยกเลิกสัญญาจองรายเดือนสำเร็จ (เก็บประวัติบัญชีเรียบร้อย)" : "ลบข้อมูลการจองรายเดือนสำเร็จ", "สำเร็จ");
        if (activeMonthlyBooking && activeMonthlyBooking.id === item.id) {
          setActiveMonthlyBooking(null);
          setActiveMonthlyTransactions([]);
        }
        fetchMonthlyBookings();
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [adminUser, showConfirm, activeMonthlyBooking, showAlert, fetchMonthlyBookings]);

  const handleToggleNonRenewal = useCallback(async (item) => {
    setLoadingMonthly(true);
    try {
      const newStatus = await toggleMonthlyNonRenewal(item, adminUser);
      showAlert(newStatus === 'ไม่ต่อสัญญา' ? "บันทึกแจ้งไม่ต่อสัญญาแล้ว" : "ยกเลิกการแจ้งไม่ต่อสัญญาแล้ว", "สำเร็จ");
      if (activeMonthlyBooking && activeMonthlyBooking.id === item.id) {
        setActiveMonthlyBooking({ ...activeMonthlyBooking, renewal_status: newStatus });
      }
      fetchMonthlyBookings();
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการบันทึกสถานะ: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [adminUser, activeMonthlyBooking, showAlert, fetchMonthlyBookings]);

  // Renewal Handlers
  const handleRenewMonthlyBooking = useCallback(async () => {
    if (!activeMonthlyBooking) return;
    const isConfirmed = await showConfirm({
      title: 'ยืนยันการต่อสัญญารายเดือน',
      message: `ยืนยันการต่อสัญญาสำหรับ "${activeMonthlyBooking.booker_name}" (ล็อค ${activeMonthlyBooking.stalls}) ไปยังรอบเดือนถัดไป หรือไม่?`,
      confirmText: 'ต่อสัญญา',
      cancelText: 'ยกเลิก'
    });
    if (!isConfirmed) return;

    setLoadingMonthly(true);
    try {
      const { nextMonthFormatted } = await renewSingleMonthlyBooking({
        activeMonthlyBooking,
        stallsMaster: stalls
      });
      showAlert(`ต่อสัญญาผู้เช่า "${activeMonthlyBooking.booker_name}" ไปยังรอบเดือน ${nextMonthFormatted} เรียบร้อยแล้ว`, "สำเร็จ");
      fetchMonthlyBookings();
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการต่อสัญญา: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [activeMonthlyBooking, showConfirm, stalls, showAlert, fetchMonthlyBookings]);

  const handleBulkRenewSubmit = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const { successCount, skippedCount } = await renewBulkMonthlyBookings({
        bulkRenewCheckedIds,
        monthlyList,
        bulkRenewEditData,
        stallsMaster: stalls
      });
      showAlert(`ต่อสัญญากลุ่มสำเร็จจำนวน ${successCount} ราย (ข้ามที่ซ้ำไป ${skippedCount} ราย)`, "สำเร็จ");
      setShowBulkRenewModal(false);
      setBulkRenewCheckedIds([]);
      setBulkRenewEditData({});
      fetchMonthlyBookings();
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการต่อสัญญากลุ่ม: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [bulkRenewCheckedIds, monthlyList, bulkRenewEditData, stalls, showAlert, fetchMonthlyBookings]);

  // Payment Handlers
  const handleMonthlyPaymentSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!activeMonthlyBooking) return;

    setLoadingMonthly(true);
    try {
      const { updatedBooking } = await submitMonthlyPayment({
        activeMonthlyBooking,
        paymentForm: monthlyPaymentForm,
        adminUser
      });
      showAlert("บันทึกการชำระเงินสำเร็จ", "สำเร็จ");
      setShowMonthlyPaymentModal(false);
      setMonthlyPaymentForm({ date: new Date().toISOString().split('T')[0], amount: '', method: '', note: '', slip_base64: null });
      setSlipPreviewUrl(null);
      setActiveMonthlyBooking(updatedBooking);
      fetchMonthlyBookings();
      fetchMonthlyTransactions(updatedBooking.id);
    } catch (err) {
      console.error(err);
      showAlert(err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [activeMonthlyBooking, monthlyPaymentForm, adminUser, showAlert, fetchMonthlyBookings, fetchMonthlyTransactions]);

  const handleDeleteMonthlyTransaction = useCallback(async (txn) => {
    setLoadingMonthly(true);
    try {
      const res = await deleteMonthlyTransaction({
        txn,
        activeMonthlyBooking,
        showConfirm
      });
      if (res?.success) {
        showAlert("ลบรายการชำระเงินสำเร็จ และปรับปรุงยอดคงเหลือเรียบร้อยแล้ว", "สำเร็จ");
        setActiveMonthlyBooking(res.updatedBooking);
        fetchMonthlyBookings();
        fetchMonthlyTransactions(res.updatedBooking.id);
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  }, [activeMonthlyBooking, showConfirm, showAlert, fetchMonthlyBookings, fetchMonthlyTransactions]);

  const handleSlipChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setSlipPreviewUrl(localUrl);

    const reader = new FileReader();
    reader.onload = () => {
      setMonthlyPaymentForm(prev => ({ ...prev, slip_base64: reader.result }));
    };
    reader.readAsDataURL(file);

    showAlert("กำลังสแกนรูปภาพสลิป...", "ข้อมูล");
    try {
      const { detectedAmount } = await scanSlipFile(file);
      if (detectedAmount) {
        setMonthlyPaymentForm(prev => ({ ...prev, amount: detectedAmount }));
        showAlert(`สแกนสำเร็จ: พบยอดเงิน ${parseFloat(detectedAmount).toLocaleString()} บาท`, "สำเร็จ");
      } else {
        showAlert("สแกนเรียบร้อย แต่ไม่พบยอดเงินที่ชัดเจน โปรดระบุยอดเงินด้วยตนเอง", "แจ้งเตือน");
      }
    } catch (err) {
      console.error(err);
      showAlert("การสแกนสลิปขัดข้อง โปรดระบุยอดเงินด้วยตนเอง", "แจ้งเตือน", true);
    }
  }, [showAlert]);

  // Print Handlers
  const handlePrintMonthlyReceiptDirect = useCallback((item) => {
    if (!item) return;
    const html = generateMonthlyReceiptHTML({
      item,
      stalls,
      adminUser,
      activeMonthlyTransactions
    });
    printReceiptInWindow(html);
  }, [stalls, adminUser, activeMonthlyTransactions]);

  const handlePrintMonthlyReceipt = useCallback(() => {
    if (!monthlyPrintItem) return;
    const html = generateMonthlyReceiptHTML({
      item: monthlyPrintItem,
      stalls,
      adminUser,
      customCounts: {
        satCount: monthlyPrintSatCount,
        sunCount: monthlyPrintSunCount,
        wedCount: monthlyPrintWedCount,
        month: monthlyPrintMonth,
        product: monthlyPrintProduct,
        txnNo: monthlyPrintTxnNo,
        payments: monthlyPrintPayments
      }
    });
    printReceiptInWindow(html);
    setShowMonthlyPrintModal(false);
  }, [
    monthlyPrintItem, stalls, adminUser, monthlyPrintSatCount, monthlyPrintSunCount,
    monthlyPrintWedCount, monthlyPrintMonth, monthlyPrintProduct, monthlyPrintTxnNo,
    monthlyPrintPayments
  ]);

  const handlePrintMonthlyInvoice = useCallback((item) => {
    if (!item) return;
    setInvoicePreviewItem(item);
  }, []);

  // Sync Legacy
  const handleSyncFromLegacySheets = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      const isConfirmed = await showConfirm({
        title: 'ยืนยันการดึงข้อมูลสัญญารายเดือน & บัญชีทั้งหมด',
        message: 'ระบบจะทำการดึงข้อมูลสัญญาและประวัติการชำระเงิน "ทั้งหมดทุกเดือน" จาก Google Sheet มาซิงค์เข้าสู่ระบบใหม่โดยอัตโนมัติ',
        confirmText: 'เริ่มดึงข้อมูล',
        cancelText: 'ยกเลิก'
      });
      if (!isConfirmed) return { success: false };
    }

    setSyncingLegacy(true);
    try {
      const res = await syncMonthlyAndFinanceFromSheets();
      await fetchMonthlyBookings();
      if (!isSilent) {
        showAlert(`ดึงข้อมูลสัญญารายเดือนและบัญชีสำเร็จเรียบร้อยแล้ว!\n• สัญญารายเดือนทั้งหมด: ${res.monthlyCount} รายการ\n• รายการธุรกรรมการเงินทั้งหมด: ${res.txnCount} รายการ`, "ซิงค์สำเร็จ");
      }
      return { success: true, ...res };
    } catch (e) {
      console.error(e);
      if (!isSilent) showAlert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + e.message, "ข้อผิดพลาด", true);
      return { success: false, error: e };
    } finally {
      setSyncingLegacy(false);
    }
  }, [showConfirm, showAlert, fetchMonthlyBookings]);

  return (
    <MonthlyBookingContext.Provider value={{
      // Core Data
      monthlyList,
      setMonthlyList,
      loadingMonthly,
      fetchMonthlyBookings,
      fetchAllMonthly: fetchMonthlyBookings,
      stalls,
      setStalls,

      // Filters & Sorting
      monthlyMonthFilter,
      setMonthlyMonthFilter,
      monthlySearchQuery,
      setMonthlySearchQuery,
      monthlySortField,
      setMonthlySortField,
      monthlySortOrder,
      setMonthlySortOrder,
      filteredMonthlyList,
      showCancelled,
      setShowCancelled,
      handleSortToggle,
      renderSortArrow,

      // Modals Visibility
      showMonthlyMgmtModal,
      setShowMonthlyMgmtModal,
      showNewMonthlyModal,
      setShowNewMonthlyModal,
      showBulkRenewModal,
      setShowBulkRenewModal,
      showInvoicePreviewModal,
      setShowInvoicePreviewModal,
      showMonthlyPaymentModal,
      setShowMonthlyPaymentModal,
      showMonthlyPrintModal,
      setShowMonthlyPrintModal,
      showPreRenewalModal,
      setShowPreRenewalModal,

      // Active Selections
      selectedMonthlyItem,
      setSelectedMonthlyItem,
      activeMonthlyBooking,
      setActiveMonthlyBooking,
      activeMonthlyTransactions,
      setActiveMonthlyTransactions,
      loadingMonthlyTxns,
      invoicePreviewItem,
      setInvoicePreviewItem,
      syncingLegacy,
      setSyncingLegacy,

      // Alert & Confirm Dialogs
      alertInfo,
      setAlertInfo,
      showAlert,
      confirmInfo,
      setConfirmInfo,
      showConfirm,

      // Forms & Pricing
      isEditingMonthlyMode,
      setIsEditingMonthlyMode,
      editingMonthlyId,
      setEditingMonthlyId,
      newMonthlyStartDate,
      setNewMonthlyStartDate,
      newMonthlyCustomerType,
      setNewMonthlyCustomerType,
      newMonthlyBookerName,
      setNewMonthlyBookerName,
      newMonthlyProduct,
      setNewMonthlyProduct,
      newMonthlyPhone,
      setNewMonthlyPhone,
      newMonthlyNote,
      setNewMonthlyNote,
      newMonthlyStorageFee,
      setNewMonthlyStorageFee,
      newMonthlyElecUnit,
      setNewMonthlyElecUnit,
      newMonthlyCustomPrice,
      setNewMonthlyCustomPrice,
      newMonthlyDays,
      setNewMonthlyDays,
      newMonthlyStallsWed,
      setNewMonthlyStallsWed,
      newMonthlyStallsSat,
      setNewMonthlyStallsSat,
      newMonthlyStallsSun,
      setNewMonthlyStallsSun,
      editMonthlyPaidAmount,
      setEditMonthlyPaidAmount,
      editMonthlyStatus,
      setEditMonthlyStatus,
      editMonthlyRenewalStatus,
      setEditMonthlyRenewalStatus,
      getNewMonthlyPricing,
      getOccupiedStallsInRound,

      // Stall Selector helper states
      addStallDropdownRefWed,
      addStallDropdownRefSat,
      addStallDropdownRefSun,
      showAddStallSelectWed,
      setShowAddStallSelectWed,
      showAddStallSelectSat,
      setShowAddStallSelectSat,
      showAddStallSelectSun,
      setShowAddStallSelectSun,
      stallFilterWed,
      setStallFilterWed,
      stallFilterSat,
      setStallFilterSat,
      stallFilterSun,
      setStallFilterSun,

      // Payment Form
      monthlyPaymentForm,
      setMonthlyPaymentForm,
      slipPreviewUrl,
      setSlipPreviewUrl,
      fullScreenSlipUrl,
      setFullScreenSlipUrl,

      // Bulk Renew
      bulkRenewFromMonth,
      setBulkRenewFromMonth,
      bulkRenewToMonth,
      setBulkRenewToMonth,
      bulkRenewCheckedIds,
      setBulkRenewCheckedIds,
      bulkRenewEditData,
      setBulkRenewEditData,
      bulkRenewEditingItem,
      setBulkRenewEditingItem,

      // Print States
      monthlyPrintItem,
      setMonthlyPrintItem,
      monthlyPrintMonth,
      setMonthlyPrintMonth,
      monthlyPrintProduct,
      setMonthlyPrintProduct,
      monthlyPrintSatCount,
      setMonthlyPrintSatCount,
      monthlyPrintSunCount,
      setMonthlyPrintSunCount,
      monthlyPrintWedCount,
      setMonthlyPrintWedCount,
      monthlyPrintTxnNo,
      setMonthlyPrintTxnNo,
      monthlyPrintPayments,
      setMonthlyPrintPayments,

      // Action Handlers
      handleOpenNewMonthlyModal,
      handleOpenEditMonthlyModal,
      handleOpenBulkRenewModal,
      handleOpenMonthlyPaymentModal,
      handleCreateNewMonthlyBooking,
      handleSaveEditedMonthlyBooking,
      handleUpdateMonthlyItem,
      handleDeleteMonthlyBooking,
      handleToggleNonRenewal,
      handleRenewMonthlyBooking,
      handleBulkRenewSubmit,
      handleMonthlyPaymentSubmit,
      handleDeleteMonthlyTransaction,
      handleSlipChange,
      handlePrintMonthlyReceiptDirect,
      handlePrintMonthlyReceipt,
      handlePrintMonthlyInvoice,
      handleSyncFromLegacySheets,
      fetchMonthlyTransactions,

      // Utility re-exports
      cleanStallName,
      formatBookingMonth,
      sortThaiMonthsDescending,
      computeNextMonthThai,
      getCustomerIdentityKey,
      getDayOccurrences,
      parseNumber,
      adminUser
    }}>
      {children}
    </MonthlyBookingContext.Provider>
  );
}

export function useMonthlyBooking() {
  const context = useContext(MonthlyBookingContext);
  if (!context) {
    throw new Error('useMonthlyBooking must be used within a MonthlyBookingProvider');
  }
  return context;
}
