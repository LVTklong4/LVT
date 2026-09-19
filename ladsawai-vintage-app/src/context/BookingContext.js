'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { logOfficerActivity } from '@/utils/logger';
import {
  dayNamesShort,
  monthNamesShort,
  monthNamesFull,
  getThaiShortYear,
  getModalDateFormat,
  getBookingMonthStr,
  formatPhoneDisplay,
  formatBookingMonth
} from '@/utils/thaiDateHelper';
import { generateReceiptHTML } from '@/utils/receiptPrinter';
import { formatPrice, formatPriceInt, cleanStallName, parseNumber } from '@/utils/numberHelper';
import { checkStallsAvailability } from '@/services/booking/concurrencyService';
import {
  fetchStandbyList as getStandbyListService,
  createStandbyQueueItem,
  updateStandbyQueueStatus,
  deleteStandbyQueueItem
} from '@/services/booking/standbyService';
import {
  fetchVacantStalls as getVacantStallsService,
  executeMoveLock
} from '@/services/booking/moveLockService';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  // Use MonthlyBookingContext for monthly state and logic
  const monthlyBooking = useMonthlyBooking();
  const { monthlyList } = monthlyBooking;

  // Use AuthAdminContext for authentication state
  const {
    adminUser,
    setAdminUser,
    adminList,
    setAdminList,
    adminRolesList,
    setAdminRolesList,
    loadingSettings,
    setLoadingSettings,
    selectedAdminEmail,
    setSelectedAdminEmail,
    adminForm,
    setAdminForm,
    fetchAdminRoles,
    handleGoogleLogin,
    handleLogout: authLogout,
    handleSaveAdminRole,
    verifyAndSetAdmin
  } = useAuthAdmin();

  // States
  const [stalls, setStalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateOffset, setDateOffset] = useState(0);
  const [quickDates, setQuickDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedStall, setHighlightedStall] = useState(null);
  
  // Standby Waitlist & Activity Audit Log States
  const [standbyList, setStandbyList] = useState([]);
  const [showStandbyModal, setShowStandbyModal] = useState(false);
  const [showActivityLogsModal, setShowActivityLogsModal] = useState(false);
  
  // Authentication & Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Modal States
  const [selectedStall, setSelectedStall] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMonthlyStallMapModal, setShowMonthlyStallMapModal] = useState(false);
  const [selectedMonthlyStallBooking, setSelectedMonthlyStallBooking] = useState(null);
  
  // Forms States
  const [bookerName, setBookerName] = useState('');
  const [product, setProduct] = useState('');
  const [bookingType, setBookingType] = useState('รายวัน');
  const [paymentMethod, setPaymentMethod] = useState('เงินสด');
  const [stallPrice, setStallPrice] = useState(0);
    const [elecUnit, setElecUnit] = useState(0);
  const [elecPrice, setElecPrice] = useState(0);
  const [note, setNote] = useState('');
  
  // Extra Actions States
  const [showAddUtilityModal, setShowAddUtilityModal] = useState(false);
  const [addUtilityUnit, setAddUtilityUnit] = useState(1);
  const [addUtilityPrice, setAddUtilityPrice] = useState(20);
  const [addUtilityMethod, setAddUtilityMethod] = useState('');
  
  // Lock Transfer States
  const [showMoveLockModal, setShowMoveLockModal] = useState(false);
  const [moveTargetDate, setMoveTargetDate] = useState('');
  const [moveTargetStall, setMoveTargetStall] = useState(null);
  const [vacantStallsOnTargetDate, setVacantStallsOnTargetDate] = useState([]);
  const [loadingVacantStalls, setLoadingVacantStalls] = useState(false);
  const [moveStallFilter, setMoveStallFilter] = useState('');
  
  // Storage Management Modal States
        
  // Legacy Sync & Google Archive States
  const [syncingLegacy, setSyncingLegacy] = useState(false);
  const [archiveWebhookUrl, setArchiveWebhookUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lvt_archive_webhook_url') || '';
    }
    return '';
  });
  const [archivingMonth, setArchivingMonth] = useState(false);
  const [archiveSelectedMonth, setArchiveSelectedMonth] = useState('2026-07');

  // Multi-Stall Admin Booking States
  const [selectedStallsList, setSelectedStallsList] = useState([]);
  const [cashReceived, setCashReceived] = useState('');
  const [showAddStallSelect, setShowAddStallSelect] = useState(false);
  const [stallFilter, setStallFilter] = useState('');
  const [paymentList, setPaymentList] = useState([]);
  const addStallDropdownRef = useRef(null);
  const alertTimeoutRef = useRef(null);

  const getBookingCustomerType = (booking) => {
    if (!booking) return 'Standard';
    if (booking.master_id) {
      const mb = monthlyList.find(m => m.id === booking.master_id);
      if (mb) return mb.customer_type || 'Standard';
    }
    const bookingMonthFormatted = formatBookingMonth(getBookingMonthStr(booking.date));
    const mb = monthlyList.find(m => {
      const mbMonthFormatted = formatBookingMonth(m.booking_month);
      if (mbMonthFormatted !== bookingMonthFormatted) return false;
      if (!m.stalls) return false;
      const cleanStalls = m.stalls.split(',').map(s => s.replace(/[\[\]]/g, '').trim());
      const cleanBookingStall = (booking.stall_name || '').replace(/[\[\]]/g, '').trim();
      return cleanStalls.includes(cleanBookingStall);
    });
    if (mb) return mb.customer_type || 'Standard';
    return 'Standard';
  };

  // Settings Modal States
  const [showSettingsMgmtModal, setShowSettingsMgmtModal] = useState(false);
  
  // Alert/Toast & Confirm Modal States
  const [alertInfo, setAlertInfo] = useState(null);
  const [confirmInfo, setConfirmInfo] = useState(null);

  // Receipt On-screen Preview for mobile screenshots
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false);
  const [receiptPreviewData, setReceiptPreviewData] = useState(null);

  // Initialize
  useEffect(() => {
    // 1. Setup dates
    initDates();
    // 2. Fetch Stallsผังตลาด
    fetchStalls();

    // Check URL parameters to auto-open monthly management
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'monthly') {
        setIsMonthlyPageOnly(true);
        setShowMonthlyMgmtModal(true);
      }
    }
  }, []);

  // Fetch bookings when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookingsAndStorage();
    }
  }, [selectedDate]);

  // Supabase Realtime Subscription for active selectedDate and monthly_bookings
  useEffect(() => {
    if (!selectedDate) return;

    const channel = supabase
      .channel(`realtime-bookings-${selectedDate}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new && payload.new.date === selectedDate) {
              setBookings(prev => {
                const exists = prev.some(b => b.id === payload.new.id);
                if (exists) {
                  return prev.map(b => b.id === payload.new.id ? payload.new : b);
                }
                return [...prev, payload.new];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.date === selectedDate) {
              setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
            } else if (payload.old) {
              setBookings(prev => prev.filter(b => b.id !== payload.old.id));
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              setBookings(prev => prev.filter(b => b.id !== payload.old.id));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_bookings' },
        () => {
          fetchAllMonthly();
          fetchBookingsAndStorage({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  // Window Focus & Document Visibility Revalidation (Hybrid Realtime)
  useEffect(() => {
    let lastRevalidateTime = Date.now();

    const handleRevalidate = () => {
      const now = Date.now();
      if (now - lastRevalidateTime > 3000) {
        lastRevalidateTime = now;
        fetchBookingsAndStorage({ silent: true });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRevalidate();
      }
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDate]);

  const initDates = () => {
    const today = new Date();
    // Check cutoff (e.g. 19:00)
    if (today.getHours() >= 19) {
      today.setDate(today.getDate() + 1);
    }
    
    // Find next market days (Wed=3, Sat=6, Sun=0)
    const marketDays = [0, 3, 6];
    const dates = [];
    let d = new Date(today);
    let count = 0;
    let loopLimit = 0;
    
    while (count < 3 + dateOffset && loopLimit < 100) {
      loopLimit++;
      if (marketDays.includes(d.getDay())) {
        const offset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() - offset);
        const dateStr = localDate.toISOString().split('T')[0];
        
        const day = dayNamesShort[d.getDay()];
        const dateNum = d.getDate();
        const month = monthNamesShort[d.getMonth()];
        const year = getThaiShortYear(d);
        const formattedLabel = `${day} ${dateNum} ${month} ${year}`;
        
        dates.push({
          dateStr,
          dayOfWeek: d.getDay(),
          dayName: d.toLocaleDateString('th-TH', { weekday: 'long' }),
          fullDate: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
          formattedLabel
        });
        count++;
      }
      d.setDate(d.getDate() + 1);
    }
    
    // Filter to take only 3 dates starting from offset
    const activeDates = dates.slice(dateOffset, dateOffset + 3);
    setQuickDates(activeDates);
    
    // Set initial date if not set
    if (!selectedDate && activeDates.length > 0) {
      setSelectedDate(activeDates[0].dateStr);
    }
  };

  useEffect(() => {
    initDates();
  }, [dateOffset]);

  const showAlert = (message, title = 'แจ้งเตือน', isError = false) => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    setAlertInfo({ message, title, isError });
    const duration = isError ? 15000 : 4000;
    alertTimeoutRef.current = setTimeout(() => {
      setAlertInfo(null);
      alertTimeoutRef.current = null;
    }, duration);
  };

  const showConfirm = ({ title = 'ยืนยันการทำรายการ', message, confirmText = 'ตกลง', cancelText = 'ยกเลิก', isDanger = false }) => {
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
  };


  const fetchStalls = async () => {
    try {
      const { data, error } = await supabase.from('stalls').select('*');
      if (error) throw error;
      setStalls(data || []);
    } catch (e) {
      console.error("Error fetching stalls:", e);
      showAlert("ดึงข้อมูลผังตลาดไม่สำเร็จ: " + e.message, "ข้อผิดพลาด", true);
    }
  };

  const fetchBookingsAndStorage = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch Stalls structure & prices (skip if already loaded and in silent mode)
      if (!silent || stalls.length === 0) {
        await fetchStalls();
      }

      // 2. Fetch Bookings for selected date
      const { data: bookingsData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', selectedDate);
      if (bError) throw bError;
      setBookings(bookingsData || []);
    } catch (e) {
      console.error("Error fetching date data:", e);
      if (!silent) {
        showAlert("ดึงข้อมูลจองไม่สำเร็จ: " + e.message, "ข้อผิดพลาด", true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };


  // Bypass Login handler for Testing
  const handleLogin = () => {
    const admin = adminList.find(a => a.email === selectedAdminEmail);
    if (admin) {
      if (admin.status !== 'เปิด') {
        showAlert("บัญชีผู้ใช้นี้ถูกปิดการใช้งาน", "เข้าสู่ระบบไม่สำเร็จ", true);
        return;
      }
      setAdminUser(admin);
      localStorage.setItem('lvt_admin_session', JSON.stringify(admin));
      setShowLoginModal(false);
      showAlert(`ยินดีต้อนรับคุณ ${admin.name} (Bypass)`, "เข้าสู่ระบบสำเร็จ");
    } else {
      showAlert("โปรดระบุอีเมลผู้เข้าใช้งาน", "แจ้งเตือน", true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    localStorage.removeItem('lvt_admin_session');
    showAlert("ออกจากระบบเรียบร้อย", "สำเร็จ");
  };

  // Helper to get stall vacancy and detail text
  const getStallStatus = (stall, booking) => {
    if (stall.type === 'ทางเดิน' || stall.type === 'อื่นๆ') {
      return { isVacant: false, label: stall.type, product: '' };
    }
    
    const isFood = stall.type.includes('อาหาร') || stall.name.startsWith('F');
    const dateObj = new Date(selectedDate);
    const day = dateObj.getDay();
    let price = stall.price_wed;
    if (day === 6) price = stall.price_sat;
    if (day === 0) price = stall.price_sun;

    if (booking) {
      if (booking.status === 'ลา') {
        return { isVacant: true, label: 'ว่าง (ปล่อยเช่ารายวัน)', price, product: '' };
      } else if (booking.type === 'ประจำ' || booking.type === 'Regular') {
        return { isVacant: false, label: 'ไม่ว่าง (ประจำ)', product: booking.product || 'ประจำ' };
      } else if (booking.type === 'รายเดือน' || stall.type === 'รายเดือน' || stall.type.includes('รายเดือน')) {
        return { isVacant: false, label: 'ไม่ว่าง (รายเดือน)', product: booking.product || 'รายเดือน' };
      } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
        return { isVacant: false, label: 'ไม่ว่าง', product: booking.product || 'จองแล้ว' };
      } else {
        return { isVacant: false, label: 'ไม่ว่าง (ค้างชำระ)', product: booking.product || 'ค้างชำระ' };
      }
    } else if (stall.type === 'รายเดือน' || stall.type.includes('รายเดือน')) {
      return { isVacant: false, label: 'ไม่ว่าง (รายเดือน)', product: 'รายเดือน' };
    } else {
      return { isVacant: true, label: 'ว่าง', price, product: '' };
    }
  };

  // Search handler
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQ = q.toLowerCase();
    const results = [];

    // Search stalls
    stalls.forEach(s => {
      if (s.name.toLowerCase().includes(lowerQ)) {
        results.push({ type: 'stall', name: s.name, details: `ล็อคประเภท: ${s.type}` });
      }
    });

    // Search bookers in active bookings
    bookings.forEach(b => {
      if (b.booker_name.toLowerCase().includes(lowerQ) || (b.product && b.product.toLowerCase().includes(lowerQ))) {
        results.push({ type: 'booking', name: b.stall_name, details: `${b.booker_name} (${b.product || 'ไม่มีชื่อสินค้า'})` });
      }
    });

    setSearchResults(results.slice(0, 10));
  };

  const selectSearchResult = (item) => {
    setHighlightedStall(item.name);
    setSearchQuery('');
    setSearchResults([]);
    
    // Scroll to item
    const el = document.getElementById(`stall-${item.name}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove highlight after 5s
      setTimeout(() => setHighlightedStall(null), 5000);
    }
  };

  // Get price based on day of week for target stall on target date
  const getStallPriceForDate = (stall, dateStr = selectedDate) => {
    if (!stall) return 0;
    const effectiveDateStr = dateStr || selectedDate;

    let day = 0;
    if (typeof effectiveDateStr === 'string' && effectiveDateStr.includes('-')) {
      const parts = effectiveDateStr.split('-');
      if (parts.length === 3) {
        let yr = parseInt(parts[0], 10);
        if (yr > 2500) yr -= 543;
        const dateObj = new Date(yr, parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        day = dateObj.getDay();
      } else {
        day = new Date(effectiveDateStr).getDay();
      }
    } else if (effectiveDateStr) {
      day = new Date(effectiveDateStr).getDay();
    }

    let price = 0;
    if (day === 6) price = stall.price_sat || stall.price_wed || stall.price_sun || stall.price || 0;
    else if (day === 0) price = stall.price_sun || stall.price_sat || stall.price_wed || stall.price || 0;
    else price = stall.price_wed || stall.price_sat || stall.price_sun || stall.price || 0;

    if (!price || parseNumber(price) === 0) {
      price = stall.price_sat || stall.price_wed || stall.price_sun || stall.price || 0;
    }

    return parseNumber(price);
  };

  // Calculate stall prices for selectedStallsList based on trading day
  const calculateDefaultStallPrice = (stallsList, targetDate = selectedDate) => {
    if (!stallsList || !Array.isArray(stallsList) || stallsList.length === 0) return 0;
    return stallsList.reduce((sum, s) => {
      return sum + getStallPriceForDate(s, targetDate);
    }, 0);
  };

  // Standby Waitlist Handlers
  const fetchStandbyList = async () => {
    try {
      const data = await getStandbyListService(supabase);
      setStandbyList(data);
    } catch (e) {
      console.warn('Error fetching standby list:', e);
    }
  };

  const handleAddStandbyQueue = async (itemData) => {
    try {
      const newItem = await createStandbyQueueItem(supabase, itemData);
      setStandbyList(prev => [newItem, ...prev]);

      if (adminUser) {
        logOfficerActivity(
          adminUser.name,
          adminUser.role || 'Staff',
          'คิวสำรอง',
          `ลงทะเบียนคิวสำรองสำหรับคุณ ${itemData.booker_name} โซน ${itemData.preferred_zone}`
        );
      }
      showAlert("ลงทะเบียนคิวสำรองเรียบร้อย", "สำเร็จ");
    } catch (e) {
      console.warn('Error saving standby waitlist entry:', e);
      showAlert("เกิดข้อผิดพลาดในการลงทะเบียนคิวสำรอง", "ข้อผิดพลาด", true);
    }
  };

  const handleUpdateStandbyStatus = async (id, status) => {
    setStandbyList(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    try {
      await updateStandbyQueueStatus(supabase, id, status);
      showAlert(`อัปเดตสถานะคิวเป็น "${status}" เรียบร้อย`, "สำเร็จ");
    } catch (e) {
      console.warn('Error updating standby status:', e);
      showAlert("เกิดข้อผิดพลาดในการอัปเดตสถานะคิว", "ข้อผิดพลาด", true);
    }
  };

  const handleDeleteStandbyQueue = async (id) => {
    setStandbyList(prev => prev.filter(item => item.id !== id));
    try {
      await deleteStandbyQueueItem(supabase, id);
      showAlert("ลบคิวสำรองเรียบร้อย", "สำเร็จ");
    } catch (e) {
      console.warn('Error deleting standby queue:', e);
      showAlert("เกิดข้อผิดพลาดในการลบคิวสำรอง", "ข้อผิดพลาด", true);
    }
  };

  const handleVacateMonthlyStallToday = async (customIds) => {
    if (!selectedMonthlyStallBooking) return;
    const idsToVacate = Array.isArray(customIds) && customIds.length > 0 
      ? customIds 
      : [selectedMonthlyStallBooking.id];
      
    if (idsToVacate.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'ลา', note: 'ลูกค้ารายเดือนลา คืนล็อคขายรายวัน' })
        .in('id', idsToVacate);
      if (error) throw error;
      
      showAlert("คืนล็อคเฉพาะวันนี้สำเร็จ! แผงค้าจะเปลี่ยนเป็นสีว่างเพื่อให้จองรายวันได้แล้วครับ", "สำเร็จ");
      setShowMonthlyStallMapModal(false);
      fetchBookingsAndStorage();
    } catch (err) {
      console.error(err);
      showAlert("เกิดข้อผิดพลาดในการคืนล็อค: " + err.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Click Stall handler
  const handleStallClick = (stall) => {
    if (stall.type === 'ทางเดิน' || stall.type === 'อื่นๆ') return;
    const matchedBookings = bookings.filter(b => b.stall_name === stall.name || (b.stall_name && b.stall_name.split(',').map(s => s.trim()).includes(stall.name)));
    let booking = matchedBookings.sort((a, b) => {
      if (a.status === 'ลา' && b.status !== 'ลา') return 1;
      if (a.status !== 'ลา' && b.status === 'ลา') return -1;
      return 0;
    })[0];

    // If active monthly booking (not 'ลา'), open our new Monthly Stall Map Modal instead of daily form
    if (booking && booking.type === 'รายเดือน' && booking.status !== 'ลา') {
      setSelectedStall(stall);
      setSelectedMonthlyStallBooking(booking);
      setShowMonthlyStallMapModal(true);
      return;
    }

    // If booking status is 'ลา', we treat it as vacant for daily rental
    if (booking && booking.status === 'ลา') {
      booking = null;
    }

    setSelectedStall(stall);
    setSelectedBooking(booking || null);
    setCashReceived('');
    setShowAddStallSelect(false);

    // Get price based on day of week safely
    const price = getStallPriceForDate(stall, selectedDate);
    
    // Pre-populate fields
    if (booking) {
      setBookerName(booking.booker_name);
      setProduct(booking.product);
      setBookingType(booking.type);
      setPaymentMethod(booking.payment_method || 'เงินสด');
      setNote(booking.note || '');
      
      let groupBookings = [];
      if (booking.master_id) {
        groupBookings = bookings.filter(b => b.date === booking.date && b.master_id === booking.master_id && b.status !== 'ลา');
      } else if (booking.booker_name && booking.booker_name.trim() !== 'ไม่ระบุชื่อ' && booking.booker_name.trim() !== '') {
        const sameCustomer = bookings.filter(b => 
          b.date === booking.date && 
          b.booker_name && 
          b.booker_name.trim() === booking.booker_name.trim() &&
          b.status !== 'ลา' &&
          (!booking.product || !b.product || b.product.trim() === booking.product.trim())
        );
        if (sameCustomer.length > 1) {
          groupBookings = sameCustomer;
        }
      }

      if (groupBookings.length > 1) {
        // Group multiple stalls
        const allStallNames = groupBookings.map(b => b.stall_name);
        const names = allStallNames.flatMap(nameStr => (nameStr || '').split(',').map(s => s.replace(/[\[\]]/g, '').trim()));
        const matched = stalls.filter(s => names.includes(s.name.replace(/[\[\]]/g, '').trim()));
        const matchedStalls = matched.length > 0 ? matched : [stall];
        setSelectedStallsList(matchedStalls);

        const totalStallPrice = groupBookings.reduce((sum, b) => sum + parseNumber(b.stall_price), 0);
        const defaultPrice = calculateDefaultStallPrice(matchedStalls, selectedDate);
        setStallPrice(totalStallPrice > 0 ? totalStallPrice : defaultPrice);

        const totalElecUnit = groupBookings.reduce((sum, b) => sum + parseNumber(b.elec_unit || 0), 0);
        const totalElecPrice = groupBookings.reduce((sum, b) => sum + parseNumber(b.elec_price || 0), 0);
        setElecUnit(totalElecUnit);
        setElecPrice(totalElecPrice);

        // Group total payment amount
        const totalGroupPaid = groupBookings
          .filter(b => b.status === 'ชำระแล้ว' || b.status === 'ไม่ว่าง')
          .reduce((sum, b) => sum + parseNumber(b.total_price || 0), 0);

        const primaryMethod = groupBookings.find(b => b.payment_method)?.payment_method || booking.payment_method || 'เงินสด';
        const cleanMethod = primaryMethod.includes(':') ? primaryMethod.split(':')[0].trim() : primaryMethod;

        setPaymentList([{
          method: cleanMethod,
          amount: totalGroupPaid > 0 ? totalGroupPaid : '',
          isSaved: totalGroupPaid > 0
        }]);
      } else {
        let matched = [stall];
        if (booking.stall_name) {
          const names = booking.stall_name.split(',').map(s => s.replace(/[\[\]]/g, '').trim());
          const m = stalls.filter(s => names.includes(s.name.replace(/[\[\]]/g, '').trim()));
          if (m.length > 0) matched = m;
        }
        setSelectedStallsList(matched);

        const savedStallPrice = parseNumber(booking.stall_price);
        const defaultPrice = calculateDefaultStallPrice(matched, selectedDate);
        setStallPrice(savedStallPrice > 0 ? savedStallPrice : defaultPrice);
        setElecUnit(booking.elec_unit || 0);
        setElecPrice(booking.elec_price || 0);

        const isPaidStatus = booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง';
        if (booking.payment_method) {
          if (booking.payment_method.includes(':') || booking.payment_method.includes('+')) {
            const splits = booking.payment_method.split('+').map(item => {
              const parts = item.split(':');
              const method = parts[0]?.trim() || '';
              const amount = parts[1]?.trim() || '';
              const isSaved = !!(method && amount && parseNumber(amount) > 0);
              return { 
                method: isSaved ? method : '', 
                amount: amount,
                isSaved: isSaved
              };
            });
            setPaymentList(splits);
          } else {
            const method = booking.payment_method.trim();
            const isPaidBooking = booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง';
            const amount = isPaidBooking ? (booking.total_price || '') : '';
            const isSaved = !!(method && amount && parseNumber(amount) > 0);
            setPaymentList([{ 
              method: isSaved ? method : '', 
              amount: amount,
              isSaved: isSaved
            }]);
          }
        } else {
          setPaymentList([{ method: '', amount: '' }]);
        }
      }
    } else {
      setBookerName('');
      setProduct('');
      setBookingType('รายวัน');
      setPaymentMethod('เงินสด');
      const calculatedPrice = calculateDefaultStallPrice([stall], selectedDate);
      const finalInitialPrice = (parseNumber(price) > 0) ? parseNumber(price) : calculatedPrice;
      setStallPrice(finalInitialPrice);
      setElecUnit(0);
      setElecPrice(0);
      setNote('');
      setSelectedStallsList([stall]);
      setPaymentList([{ method: '', amount: '' }]);
    }

    setShowBookingModal(true);
  };

  // Save Booking handler (Insert or Update)
  const handleSaveBooking = async (statusArg = 'ค้างชำระ', autoPrintArg = false) => {
    let status = (typeof statusArg === 'string') ? statusArg : null;
    let autoPrint = (typeof autoPrintArg === 'boolean') ? autoPrintArg : false;

    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!bookerName.trim()) {
      showAlert("โปรดกรอกชื่อผู้ค้า/เบอร์โทร", "แจ้งเตือน", true);
      return;
    }
    if (!product.trim()) {
      showAlert("โปรดกรอกสินค้าที่ขาย", "แจ้งเตือน", true);
      return;
    }

    const calculatedStallPrice = calculateDefaultStallPrice(selectedStallsList, selectedDate);
    const finalStallPrice = parseNumber(stallPrice) > 0 ? parseNumber(stallPrice) : calculatedStallPrice;
    const totalVal = finalStallPrice + parseNumber(elecPrice);

    const totalPaid = paymentList
      .filter(p => p.amount)
      .reduce((sum, p) => sum + parseNumber(p.amount), 0);

    if (!status) {
      status = (totalPaid >= totalVal && totalVal > 0) ? 'ชำระแล้ว' : 'ค้างชำระ';
    }

    if (totalPaid > totalVal) {
      showAlert(`ยอดเงินที่ชำระ (${totalPaid} บาท) เกินกว่ายอดรวมทั้งสิ้น (${totalVal} บาท) กรุณาตรวจสอบจำนวนเงินอีกครั้ง`, "แจ้งเตือน", true);
      return;
    }

    const incomplete = paymentList.some(p => p.amount !== undefined && p.amount !== null && p.amount.toString().trim() !== '' && !p.method);
    if (incomplete) {
      showAlert("กรุณาเลือกวิธีการชำระเงิน (เงินสด/โอนจ่าย) สำหรับยอดเงินที่ระบุไว้", "แจ้งเตือน", true);
      return;
    }

    if (status === 'ค้างชำระ' && totalPaid < totalVal) {
      const remaining = totalVal - totalPaid;
      const isConfirmed = await showConfirm({
        title: 'แจ้งเตือนชำระเงินไม่ครบ',
        message: `ยอดเงินที่รับชำระ (${totalPaid} บ.) ยังไม่ครบตามยอดรวมทั้งสิ้น (${totalVal} บ.)\nจะมีส่วนต่างค้างจ่าย ${remaining} บ. ต้องการบันทึกรายการนี้เป็นยอดค้างชำระหรือไม่?`,
        confirmText: 'บันทึกค้างจ่าย',
        cancelText: 'ยกเลิก'
      });
      if (!isConfirmed) return;
    }

    setLoading(true);
    try {
      const bookingId = selectedBooking?.id || `B-${Date.now()}`;
      const calculatedStallPrice = calculateDefaultStallPrice(selectedStallsList, selectedDate);
      const finalStallPrice = parseNumber(stallPrice) > 0 ? parseNumber(stallPrice) : calculatedStallPrice;
      const totalVal = finalStallPrice + parseNumber(elecPrice);

      const finalPaymentMethod = paymentList
        .filter(p => p.method && p.amount)
        .map(p => `${p.method}:${p.amount}`)
        .join(' + ') || 'เงินสด';

      const stallNames = selectedStallsList.map(s => s.name).join(', ');
      const bookingData = {
        id: bookingId,
        date: selectedDate,
        stall_name: stallNames,
        booker_name: bookerName,
        product: product,
        type: bookingType,
        elec_unit: parseNumber(elecUnit),
        elec_price: parseNumber(elecPrice),
        stall_price: finalStallPrice,
        total_price: totalVal,
        payment_method: finalPaymentMethod,
        status: status,
        note: note,
        storage_fee: 0
      };

      // Preserve master_id if editing an existing booking that has one
      if (selectedBooking && selectedBooking.master_id) {
        bookingData.master_id = selectedBooking.master_id;
      }

      // Delete other related bookings if grouping customer bookings
      if (selectedBooking && selectedBooking.master_id) {
        const otherBookings = bookings.filter(b => b.date === selectedBooking.date && b.master_id === selectedBooking.master_id && b.id !== selectedBooking.id);
        const otherIds = otherBookings.map(b => b.id);
        if (otherIds.length > 0) {
          const { error: delErr } = await supabase
            .from('bookings')
            .delete()
            .in('id', otherIds);
          if (delErr) throw delErr;
        }
      }

      // Concurrency Check: verify requested stalls are not already booked by someone else
      const availCheck = await checkStallsAvailability({
        supabase,
        date: selectedDate,
        stalls: selectedStallsList,
        excludeBookingId: selectedBooking?.id,
        excludeMasterId: selectedBooking?.master_id
      });

      if (!availCheck.isAvailable) {
        setLoading(false);
        const conflictWho = availCheck.conflictBooking?.booker_name || 'ผู้อื่น';
        showAlert(
          `⚠️ ไม่สามารถบันทึกได้ เนื่องจากล็อค ${availCheck.conflictStall} ถูกจองไปแล้วโดย "${conflictWho}" กรุณาเลือกล็อคใหม่`,
          "เกิดข้อผิดพลาดในการจองซ้ำ",
          true
        );
        fetchBookingsAndStorage(selectedDate);
        return;
      }

      // 1. Save Booking (Upsert)
      const { error: saveError } = await supabase
        .from('bookings')
        .upsert(bookingData);
      if (saveError) throw saveError;

      // 2. Record Transaction if Paid (Append-only Incremental Ledger pattern)
      if (status === 'ชำระแล้ว') {
        // Query existing transactions for this booking_ref to calculate already paid amount
        const { data: existingTxns } = await supabase
          .from('transactions')
          .select('id, total_amount')
          .eq('booking_ref', bookingId);

        const alreadyPaid = (existingTxns || []).reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);

        if (totalVal > alreadyPaid) {
          const incrementalAmount = totalVal - alreadyPaid;
          const isFirstPayment = alreadyPaid === 0;
          const txnId = `TXN-${Date.now()}`;
          const txnData = {
            id: txnId,
            booking_ref: bookingId,
            date: selectedDate,
            category: isFirstPayment 
              ? ((bookingType === 'รายวัน' || bookingType === 'ประจำ') ? 'ค่าล็อครายวัน' : 'ค่าล็อครายเดือน')
              : 'ชำระเงินล็อคเพิ่มเติม',
            total_amount: incrementalAmount,
            method: finalPaymentMethod,
            note: isFirstPayment ? `ชำระเงินล็อค ${stallNames}` : `ชำระเพิ่มเติมล็อค ${stallNames} (ส่วนเพิ่ม ${incrementalAmount} บ.)`,
            officer: adminUser.name,
            timestamp: new Date().toISOString(),
            stall_amt: isFirstPayment ? parseNumber(stallPrice) : incrementalAmount,
            elec_amt: isFirstPayment ? parseNumber(elecPrice) : 0,
            storage_amt: 0,
            bill_type: 'General'
          };

          const { error: txnError } = await supabase
            .from('transactions')
            .insert(txnData);
          if (txnError) throw txnError;
        }
        // If totalVal <= alreadyPaid, no new transaction is needed (editing booker name, product, or stall move with equal/lower price)
      } else if (status === 'ค้างชำระ' && selectedBooking?.id) {
        // If status changed from paid to unpaid, remove previously recorded transaction
        await supabase
          .from('transactions')
          .delete()
          .eq('booking_ref', selectedBooking.id);
      }

      if (adminUser) {
        logOfficerActivity(
          adminUser.name,
          adminUser.role || 'Staff',
          'จองแผงค้า',
          `บันทึกการจองล็อค ${stallNames} ให้คุณ ${bookerName} (ยอด ${totalVal} บ. สถานะ: ${status})`
        );
      }

      showAlert("บันทึกการจองสำเร็จ", "สำเร็จ");
      setShowBookingModal(false);
      fetchBookingsAndStorage();
      if (autoPrint) {
        handlePrintReceipt(bookingData, selectedStall);
      }
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Delete Booking
  const handleDeleteBooking = async () => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!selectedBooking) return;

    const stallNames = selectedStallsList.map(s => s.name).join(', ');
    const isConfirmed = await showConfirm({
      title: 'ยืนยันการลบการจอง',
      message: `ยืนยันการลบการจองล็อค ${cleanStallName(stallNames)} หรือไม่?`,
      confirmText: 'ลบการจอง',
      cancelText: 'ยกเลิก',
      isDanger: true
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const idsToDelete = [selectedBooking.id];
      if (selectedBooking.master_id) {
        const otherBookings = bookings.filter(b => b.date === selectedBooking.date && b.master_id === selectedBooking.master_id && b.id !== selectedBooking.id);
        otherBookings.forEach(b => idsToDelete.push(b.id));
      }

      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', idsToDelete);
      if (error) throw error;

      // Delete corresponding transactions to avoid ghost income in ledger
      try {
        await supabase
          .from('transactions')
          .delete()
          .in('booking_ref', idsToDelete);
      } catch (txnDelErr) {
        console.warn('Notice: Could not delete transactions associated with bookings:', txnDelErr.message);
      }

      if (adminUser) {
        logOfficerActivity(
          adminUser.name,
          adminUser.role || 'Staff',
          'ยกเลิกจอง',
          `ยกเลิกการจองล็อค ${stallNames} วันที่ ${selectedDate}`
        );
      }

      showAlert("ลบข้อมูลการจองเรียบร้อย", "สำเร็จ");
      setShowBookingModal(false);
      setBookings(prev => prev.filter(b => !idsToDelete.includes(b.id)));
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการลบ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Mark Absence (แจ้งลาหยุดแบบกลุ่ม)
  const handleMarkAbsent = async () => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }

    const stallsToLeave = selectedStallsList && selectedStallsList.length > 0 ? selectedStallsList : (selectedStall ? [selectedStall] : []);
    if (stallsToLeave.length === 0) return;

    const displayStallNames = stallsToLeave.map(s => cleanStallName(s.name)).join(', ');
    const countText = stallsToLeave.length > 1 ? ` (${stallsToLeave.length} ล็อค)` : '';

    const isConfirmed = await showConfirm({
      title: 'ยืนยันการแจ้งลาหยุด',
      message: `ยืนยันการแจ้ง "ลาหยุด" สำหรับล็อค ${displayStallNames}${countText} ในวันที่ ${getModalDateFormat(selectedDate)} หรือไม่?\n(ระบบจะปล่อยล็อคว่างให้ร้านค้าอื่นจองรายวันได้)`,
      confirmText: 'ยืนยันแจ้งลา',
      cancelText: 'ยกเลิก'
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const bookerNameVal = selectedBooking?.booker_name || bookerName || 'ร้านประจำลาหยุด';
      const masterIdVal = selectedBooking?.master_id || selectedBooking?.id || `B-ABSENT-${Date.now()}`;
      const savedBookings = [];

      for (let i = 0; i < stallsToLeave.length; i++) {
        const st = stallsToLeave[i];
        const bookingId = (selectedBooking && stallsToLeave.length === 1) 
          ? selectedBooking.id 
          : `B-ABSENT-${Date.now()}-${i}-${cleanStallName(st.name)}`;

        const bookingData = {
          id: bookingId,
          date: selectedDate,
          stall_name: st.name,
          booker_name: bookerNameVal,
          product: 'แจ้งลาหยุด',
          type: st.type === 'รายเดือน' ? 'รายเดือน' : 'รายวัน',
          elec_unit: 0,
          elec_price: 0,
          stall_price: 0,
          total_price: 0,
          payment_method: 'เงินสด',
          status: 'ลา',
          note: 'แจ้งลาหยุดแบบกลุ่มโดยแอดมิน',
          storage_fee: 0,
          master_id: masterIdVal
        };

        const { error: saveError } = await supabase
          .from('bookings')
          .upsert(bookingData);
        if (saveError) throw saveError;
        savedBookings.push(bookingData);
      }

      if (adminUser) {
        logOfficerActivity(
          adminUser.name,
          adminUser.role || 'Staff',
          'แจ้งลา',
          `แจ้งลาหยุดกลุ่มล็อค ${displayStallNames} วันที่ ${selectedDate}`
        );
      }

      showAlert(`บันทึกการแจ้งลาหยุดสำเร็จ (${stallsToLeave.length} ล็อค)`, "สำเร็จ");
      setShowBookingModal(false);
      
      const savedIds = new Set(savedBookings.map(b => b.id));
      setBookings(prev => [...prev.filter(b => !savedIds.has(b.id)), ...savedBookings]);
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึกการลา: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vacant stalls for target date
  const fetchVacantStallsForDate = async (targetDateStr) => {
    if (!targetDateStr) return;
    setLoadingVacantStalls(true);
    try {
      const vacant = await getVacantStallsService({
        supabase,
        targetDateStr,
        selectedBooking,
        stalls
      });
      setVacantStallsOnTargetDate(vacant);
    } catch (e) {
      console.error("Error fetching vacant stalls for date:", e);
      showAlert("ดึงข้อมูลล็อคว่างไม่สำเร็จ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingVacantStalls(false);
    }
  };

  // Confirm Lock Transfer
  const handleConfirmMoveLock = async (sourceStallName, customTargetStall, customTargetDate) => {
    const targetStall = customTargetStall || moveTargetStall;
    const targetDate = customTargetDate || moveTargetDate;
    const srcStallName = sourceStallName || (selectedBooking ? selectedBooking.stall_name.split(',')[0].trim() : '');

    setLoading(true);
    try {
      const res = await executeMoveLock({
        supabase,
        sourceStallName: srcStallName,
        targetStall,
        targetDate,
        selectedBooking,
        stalls,
        adminUser,
        getStallPriceForDate
      });

      showAlert(`ย้ายล็อค ${res.srcStallName} สำเร็จไปยัง ${res.targetStallName} ในวันที่ ${getModalDateFormat(res.targetDate)}`, "สำเร็จ");
      setShowMoveLockModal(false);
      setShowBookingModal(false);
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert(e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Print thermal 80mm ticket
  // Show receipt preview for mobile screen capture
  const handleShowReceiptPreview = (bookingObj, stallObj) => {
    const calculatedStallPrice = calculateDefaultStallPrice(selectedStallsList, selectedDate);
    const finalStallPrice = parseNumber(stallPrice) > 0 ? parseNumber(stallPrice) : calculatedStallPrice;

    const targetBooking = bookingObj || {
      id: selectedBooking?.id || `B-${Date.now()}`,
      created_at: selectedBooking?.created_at || new Date().toISOString(),
      date: selectedDate,
      stall_name: selectedStallsList.map(s => s.name).join(', '),
      booker_name: bookerName || 'ไม่ระบุชื่อ',
      product: product || 'สินค้าทั่วไป',
      stall_price: finalStallPrice,
      elec_unit: parseNumber(elecUnit),
      elec_price: parseNumber(elecPrice),
      storage_fee: 0,
      payment_method: paymentList.filter(p => p.method && p.amount).map(p => `${p.method}:${p.amount}`).join(' + ') || 'เงินสด'
    };

    const targetStall = stallObj || (selectedStallsList.length > 0 ? selectedStallsList[0] : selectedStall);

    // Show on-screen modal preview
    setReceiptPreviewData({ bookingObj: targetBooking, stallObj: targetStall });
    setShowReceiptPreviewModal(true);
  };

  // Print thermal 80mm ticket directly
  const handlePrintReceipt = (bookingObj, stallObj) => {
    const calculatedStallPrice = calculateDefaultStallPrice(selectedStallsList, selectedDate);
    const finalStallPrice = parseNumber(stallPrice) > 0 ? parseNumber(stallPrice) : calculatedStallPrice;

    const targetBooking = bookingObj || {
      id: selectedBooking?.id || `B-${Date.now()}`,
      created_at: selectedBooking?.created_at || new Date().toISOString(),
      date: selectedDate,
      stall_name: selectedStallsList.map(s => s.name).join(', '),
      booker_name: bookerName || 'ไม่ระบุชื่อ',
      product: product || 'สินค้าทั่วไป',
      stall_price: finalStallPrice,
      elec_unit: parseNumber(elecUnit),
      elec_price: parseNumber(elecPrice),
      storage_fee: 0,
      payment_method: paymentList.filter(p => p.method && p.amount).map(p => `${p.method}:${p.amount}`).join(' + ') || 'เงินสด'
    };

    const targetStall = stallObj || (selectedStallsList.length > 0 ? selectedStallsList[0] : selectedStall);

    const htmlContent = generateReceiptHTML({
      bookingObj: targetBooking,
      stallObj: targetStall,
      adminUser
    });

    try {
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์ใบเสร็จ');
      }
    } catch (e) {
      console.error("Print window open error:", e);
      showAlert("ไม่สามารถพิมพ์ใบเสร็จได้: " + e.message, "ข้อผิดพลาด", true);
    }
  };




  // Add electricity (Utility charge)
  const handleAddUtility = async () => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!selectedBooking) return;

    if (!addUtilityMethod) {
      showAlert("กรุณาเลือกวิธีการรับชำระเงินก่อนบันทึก", "แจ้งเตือน", true);
      return;
    }

    setLoading(true);
    try {
      const currentUnit = parseNumber(selectedBooking.elec_unit);
      const currentPrice = parseNumber(selectedBooking.elec_price);
      const currentTotal = parseNumber(selectedBooking.total_price);

      const newUnit = currentUnit + parseNumber(addUtilityUnit);
      const newPrice = currentPrice + parseNumber(addUtilityPrice);
      const newTotal = currentTotal + parseNumber(addUtilityPrice);

      const isOriginallyPaid = selectedBooking.status === 'ชำระแล้ว' || selectedBooking.status === 'ไม่ว่าง';
      const newStatus = isOriginallyPaid ? 'ชำระแล้ว' : selectedBooking.status;

      const addedPayment = `${addUtilityMethod}:${addUtilityPrice}`;
      const newPaymentMethod = selectedBooking.payment_method 
        ? `${selectedBooking.payment_method} + ${addedPayment}` 
        : addedPayment;

      // 1. Update Booking
      const { error: bError } = await supabase
        .from('bookings')
        .update({
          elec_unit: newUnit,
          elec_price: newPrice,
          total_price: newTotal,
          payment_method: newPaymentMethod,
          status: newStatus
        })
        .eq('id', selectedBooking.id);
      if (bError) throw bError;

      // 2. Add Transaction
      const txnId = `TXN-${Date.now()}`;
      const txnData = {
        id: txnId,
        booking_ref: selectedBooking.id,
        date: selectedDate,
        category: 'ค่าไฟเพิ่ม',
        total_amount: parseNumber(addUtilityPrice),
        method: addUtilityMethod,
        note: `เพิ่มค่าไฟล็อค ${selectedStall.name} (${addUtilityUnit} หน่วย)`,
        officer: adminUser.name,
        timestamp: new Date().toISOString(),
        stall_amt: 0,
        elec_amt: parseNumber(addUtilityPrice),
        storage_amt: 0,
        bill_type: 'Utility'
      };

      const { error: txnError } = await supabase
        .from('transactions')
        .insert(txnData);
      if (txnError) throw txnError;

      // 3. Update local states so modal reflects changes instantly without closing
      setElecUnit(newUnit);
      setElecPrice(newPrice);
      setPaymentList(prevList => {
        const cleaned = prevList.filter(p => p.method && p.amount);
        return [...cleaned, { method: addUtilityMethod, amount: String(addUtilityPrice) }];
      });
      setSelectedBooking(prev => ({
        ...prev,
        elec_unit: newUnit,
        elec_price: newPrice,
        total_price: newTotal,
        payment_method: newPaymentMethod,
        status: newStatus
      }));

      showAlert("บันทึกค่าไฟเพิ่มเติมสำเร็จ", "สำเร็จ");
      setShowAddUtilityModal(false);
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการเพิ่มค่าไฟ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // --- STORAGE CRUD HANDLERS ---
  ;

  ;

  ;


  // 🔄 Helper function to fetch CSV from Google Sheet
  const fetchGoogleSheetCsv = async (sheetId, sheetName = null) => {
    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    if (sheetName) {
      url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ไม่สามารถเข้าถึง Google Sheet (${sheetName || 'Main'}) ได้`);
    return await res.text();
  };

  // 🔄 Helper function to parse CSV lines safely
  const parseCsvAdvancedSafely = (text) => {
    const p = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        p.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') p.push(row);
    return p;
  };

  const normalizePhoneValue = (phoneStr) => {
    if (!phoneStr) return '';
    let clean = String(phoneStr).trim().replace(/[^0-9]/g, '');
    if (clean.length === 9 && !clean.startsWith('0')) return '0' + clean;
    if (clean.length === 8 && !clean.startsWith('0')) return '0' + clean;
    return clean || phoneStr;
  };

  const normalizeDateIso = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return dateStr.trim();
  };

  const parseMonthToIso = (monthStr, startDateStr) => {
    const thaiMonthMap = {
      'มกราคม': '01', 'ม.ค.': '01',
      'กุมภาพันธ์': '02', 'ก.พ.': '02',
      'มีนาคม': '03', 'มี.ค.': '03',
      'เมษายน': '04', 'เม.ย.': '04',
      'พฤษภาคม': '05', 'พ.ค.': '05',
      'มิถุนายน': '06', 'มิ.ย.': '06',
      'กรกฎาคม': '07', 'ก.ค.': '07',
      'สิงหาคม': '08', 'ส.ค.': '08',
      'กันยายน': '09', 'ก.ย.': '09',
      'ตุลาคม': '10', 'ต.ค.': '10',
      'พฤศจิกายน': '11', 'พ.ย.': '11',
      'ธันวาคม': '12', 'ธ.ค.': '12'
    };

    const raw = String(monthStr || '').trim();

    for (const [thMonth, monthNum] of Object.entries(thaiMonthMap)) {
      if (raw.includes(thMonth)) {
        const yearMatch = raw.match(/\b(25\d{2}|20\d{2})\b/);
        let year = '2026';
        if (yearMatch) {
          const yNum = parseInt(yearMatch[1], 10);
          year = yNum > 2400 ? String(yNum - 543) : String(yNum);
        } else if (startDateStr) {
          const sMatch = startDateStr.match(/\b(25\d{2}|20\d{2})\b/);
          if (sMatch) {
            const yNum = parseInt(sMatch[1], 10);
            year = yNum > 2400 ? String(yNum - 543) : String(yNum);
          }
        }
        return `${year}-${monthNum}`;
      }
    }

    const isoMatch = raw.match(/(\d{4})-(\d{2})/);
    if (isoMatch) {
      const yNum = parseInt(isoMatch[1], 10);
      const year = yNum > 2400 ? String(yNum - 543) : String(yNum);
      return `${year}-${isoMatch[2]}`;
    }

    if (startDateStr) {
      const sParts = startDateStr.split('-');
      if (sParts.length >= 2) {
        let yNum = parseInt(sParts[0], 10);
        let year = yNum > 2400 ? String(yNum - 543) : String(yNum);
        let m = sParts[1].padStart(2, '0');
        return `${year}-${m}`;
      }
    }

    return '2026-08';
  };

  // 🔄 1. Smart Sync Monthly Contracts & Finance Transactions (delegated to MonthlyBookingContext)
  const handleSyncFromLegacySheets = async (isSilent = false) => {
    return await monthlyBooking.handleSyncFromLegacySheets(isSilent);
  };

  // 🔄 2. Smart Sync Daily Bookings for ALL DATES from Google Sheets
  const handleSyncDailyFromLegacy = async (isSilent = false) => {
    if (!isSilent) {
      const isConfirmed = await showConfirm({
        title: 'ยืนยันการดึงข้อมูลการจองรายวันทั้งหมด (All Dates)',
        message: 'ระบบจะทำการดึงข้อมูลการจองรายวัน "ทั้งหมดทุกวัน" จาก Google Sheet มาแปลงและบันทึกเข้าสู่ระบบใหม่ โดยจะปรับสถานะผังตลาดและยอดเงินให้ตรงกับหน้างานจริง',
        confirmText: 'เริ่มดึงข้อมูลทั้งหมด',
        cancelText: 'ยกเลิก'
      });
      if (!isConfirmed) return { success: false, dailyCount: 0, dateCount: 0 };
    }

    setSyncingLegacy(true);
    try {
      // 1. Fetch ALL valid active monthly contract IDs from Supabase (with pagination)
      let allMonthlyIds = [];
      let fromIdx = 0;
      const pageSize = 1000;
      let hasMoreMb = true;
      while (hasMoreMb) {
        const { data: pageData, error: mbFetchErr } = await supabase
          .from('monthly_bookings')
          .select('id')
          .range(fromIdx, fromIdx + pageSize - 1);
        if (mbFetchErr) throw mbFetchErr;
        if (pageData && pageData.length > 0) {
          allMonthlyIds.push(...pageData.map(r => String(r.id).trim()));
          fromIdx += pageSize;
          if (pageData.length < pageSize) hasMoreMb = false;
        } else {
          hasMoreMb = false;
        }
      }
      const validMonthlyIds = new Set(allMonthlyIds);

      const SHEET_ID_DAILY = '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I';
      const csvText = await fetchGoogleSheetCsv(SHEET_ID_DAILY, 'Bookings');
      const rows = parseCsvAdvancedSafely(csvText);

      const itemsMap = new Map();
      const distinctDates = new Set();
      let rowIdx = 0;
      let skippedOrphanCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawDate = row[1] || '';
        if (!rawDate) continue;

        const normalizedDate = normalizeDateIso(rawDate);
        if (!normalizedDate) continue;

        const rawStallName = row[2] || '';
        const stallName = rawStallName.replace(/[\[\]]/g, '').trim();
        const bookerName = row[3] || 'ไม่ระบุชื่อ';
        const product = row[4] || '';
        const type = (row[5] || 'รายวัน').trim();
        const elecUnit = parseFloat(row[6]) || 0;
        const elecPrice = parseFloat(row[7]) || 0;
        const stallPrice = parseFloat(row[8]) || 0;
        const totalPrice = parseFloat(row[9]) || 0;
        const paymentMethod = row[10] || 'Cash';
        const status = row[11] || 'ชำระแล้ว';
        const note = row[12] || '';
        const masterRefId = String(row[14] || '').trim();
        const storageFee = parseFloat(row[15]) || 0;

        let cleanType = type;
        if (!cleanType.includes('รายวัน') && !cleanType.includes('รายเดือน')) {
          cleanType = 'รายวัน';
        }

        const isMonthlyType = cleanType === 'รายเดือน' || cleanType.toLowerCase().includes('monthly');
        const masterContractId = masterRefId;

        // Strategy 1: Master ID Validation (Discard Orphaned Monthly Records)
        if (isMonthlyType) {
          // If the master contract doesn't exist in monthly_bookings, discard this orphan row
          if (masterContractId && !validMonthlyIds.has(masterContractId)) {
            skippedOrphanCount++;
            continue;
          }
        }

        distinctDates.add(normalizedDate);
        rowIdx++;

        const cleanStall = stallName.replace(/[\/\s]/g, '_');
        const cleanDate = normalizedDate.replace(/-/g, '');
        const uniqueId = `BK-${cleanDate}-${cleanStall || 'S'}`;

        // Deduplicate by Date + Stall to keep the most relevant entry
        itemsMap.set(`${normalizedDate}_${stallName}`, {
          id: uniqueId,
          date: normalizedDate,
          stall_name: stallName,
          stall_id: stallName,
          booker_name: bookerName,
          customer_name: bookerName,
          product: product,
          type: cleanType,
          elec_unit: elecUnit,
          elec_price: elecPrice,
          stall_price: stallPrice,
          total_price: totalPrice,
          price: totalPrice,
          payment_method: paymentMethod,
          status: status,
          note: note,
          master_id: masterContractId || null,
          storage_fee: storageFee
        });
      }

      const dailyItems = Array.from(itemsMap.values());
      if (dailyItems.length > 0) {
        // Upsert all daily items in chunks of 100
        for (let i = 0; i < dailyItems.length; i += 100) {
          const chunk = dailyItems.slice(i, i + 100);
          const { error: upsertErr } = await supabase.from('bookings').upsert(chunk);
          if (upsertErr) throw upsertErr;
        }
      }

      await fetchBookingsAndStorage();

      if (!isSilent) {
        showAlert(
          `ซิงค์ข้อมูลการจองรายวันทั้งหมดสำเร็จเรียบร้อยแล้ว!\n` +
          `• นำเข้าการจองที่ถูกต้อง: ${dailyItems.length} รายการ\n` +
          `• กรองรายการกำพร้า/ซ้ำซ้อนทิ้ง: ${skippedOrphanCount} รายการ\n` +
          `• ครอบคลุม: ${distinctDates.size} วัน`, 
          "ซิงค์สำเร็จ"
        );
      }
      return { 
        success: true, 
        dailyCount: dailyItems.length, 
        dateCount: distinctDates.size,
        skippedOrphanCount 
      };
    } catch (e) {
      console.error('Error syncing all daily legacy:', e);
      if (!isSilent) {
        showAlert("เกิดข้อผิดพลาดในการซิงค์ข้อมูลรายวันทั้งหมด: " + e.message, "ข้อผิดพลาด", true);
      }
      return { success: false, error: e };
    } finally {
      setSyncingLegacy(false);
    }
  };

  // 🚀 3. ONE-CLICK FULL SYNC: Import ALL Legacy Data (Daily + Monthly + Finance)
  const handleSyncAllFromLegacy = async () => {
    const isConfirmed = await showConfirm({
      title: '🚀 ยืนยันการดึงและแปลงข้อมูลระบบเก่าทั้งหมด',
      message: 'ระบบจะทำการดึงข้อมูล "ทั้งหมดทุกส่วน" จาก Google Sheets ได้แก่:\n1. ข้อมูลการจองรายวันทั้งหมดทุกวัน\n2. ข้อมูลสัญญารายเดือนทั้งหมด\n3. ประวัติธุรกรรมและการเงินทั้งหมด\n\nพร้อมแปลงโครงสร้างเข้าสู่ระบบใหม่อัตโนมัติในคลิกเดียว',
      confirmText: 'เริ่มดึงข้อมูลทั้งหมดทันที',
      cancelText: 'ยกเลิก'
    });
    if (!isConfirmed) return;

    setSyncingLegacy(true);
    try {
      // 1. Sync Monthly & Finance
      const monthlyRes = await handleSyncFromLegacySheets(true);
      if (!monthlyRes.success && monthlyRes.error) {
        throw new Error('การดึงสัญญารายเดือนล้มเหลว: ' + (monthlyRes.error.message || monthlyRes.error));
      }
      // 2. Sync All Daily Bookings
      const dailyRes = await handleSyncDailyFromLegacy(true);
      if (!dailyRes.success && dailyRes.error) {
        throw new Error('การดึงการจองรายวันล้มเหลว: ' + (dailyRes.error.message || dailyRes.error));
      }

      // Refresh all state
      await monthlyBooking.fetchAllMonthly();
      await fetchBookingsAndStorage();

      showAlert(
        `🎉 ดึงและแปลงข้อมูลระบบเก่าทั้งหมดสำเร็จเรียบร้อยแล้ว!\n\n` +
        `• 📅 การจองรายวันทั้งหมด: ${dailyRes.dailyCount || 0} แผง (${dailyRes.dateCount || 0} วัน)\n` +
        `• 🧹 กรองรายการกำพร้า/ซ้ำซ้อนทิ้ง: ${dailyRes.skippedOrphanCount || 0} รายการ\n` +
        `• 🏢 สัญญารายเดือนทั้งหมด: ${monthlyRes.monthlyCount || 0} สัญญา\n` +
        `• 💳 รายการธุรกรรมการเงิน: ${monthlyRes.txnCount || 0} ธุรกรรม`,
        "ดึงข้อมูลสำเร็จครบถ้วน"
      );
    } catch (e) {
      console.error('Error in full legacy sync:', e);
      showAlert("เกิดข้อผิดพลาดในการดึงข้อมูลทั้งหมด: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setSyncingLegacy(false);
    }
  };

  // 📦 4. GOOGLE DRIVE / SHEETS ARCHIVING ENGINE
  const handleArchiveMonthToGoogleSheets = async (targetMonth, purgeAfterArchive = false) => {
    if (!targetMonth) {
      showAlert("กรุณาเลือกรอบเดือนที่ต้องการจัดเก็บประวัติ", "แจ้งเตือน", true);
      return;
    }

    const webhookUrl = (archiveWebhookUrl || localStorage.getItem('lvt_archive_webhook_url') || '').trim();
    if (!webhookUrl) {
      showAlert(
        "ยังไม่ได้ตั้งค่า Google Apps Script Webhook URL\nกรุณานำ URL ที่ได้จากการ Deploy สคริปต์มาใส่ในช่องตั้งค่า Webhook URL ก่อนครับ",
        "ต้องระบุ Webhook URL",
        true
      );
      return;
    }

    const monthThai = formatBookingMonth(targetMonth);
    const isConfirmed = await showConfirm({
      title: `📦 ยืนยันการสำรองข้อมูลรอบเดือน ${monthThai}`,
      message: `ระบบจะทำการรวบรวมข้อมูลรอบเดือน ${monthThai} ได้แก่:\n1. การจองรายวันทั้งหมดในเดือนนี้\n2. สัญญารายเดือนทั้งหมด\n3. ประวัติธุรกรรมการเงินทั้งหมด\n\nและส่งไปสร้าง Google Sheet ใน Google Drive โฟลเดอร์ LVT Archive อัตโนมัติ${purgeAfterArchive ? '\n\n⚠️ เมื่อสำรองเสร็จ จะทำการลบข้อมูลการจองรายวันของเดือนนี้ออกจากฐานข้อมูลสดเพื่อประหยัดพื้นที่' : ''}`,
      confirmText: purgeAfterArchive ? 'ยืนยันและล้างข้อมูลสด' : 'เริ่มสำรองข้อมูล',
      cancelText: 'ยกเลิก',
      isDanger: purgeAfterArchive
    });
    if (!isConfirmed) return;

    setArchivingMonth(true);
    try {
      // 1. Fetch Daily Bookings for target month (with pagination)
      const [yearStr, monthNumStr] = targetMonth.split('-');
      const lastDayNum = new Date(parseInt(yearStr), parseInt(monthNumStr), 0).getDate();
      const startDateIso = `${targetMonth}-01`;
      const endDateIso = `${targetMonth}-${String(lastDayNum).padStart(2, '0')}`;

      let monthDailyBookings = [];
      let fromB = 0;
      let hasMoreB = true;
      while (hasMoreB) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .gte('date', startDateIso)
          .lte('date', endDateIso)
          .order('date', { ascending: true })
          .range(fromB, fromB + 999);
        if (error) throw error;
        if (data && data.length > 0) {
          monthDailyBookings.push(...data);
          fromB += 1000;
          if (data.length < 1000) hasMoreB = false;
        } else {
          hasMoreB = false;
        }
      }

      // 2. Fetch Monthly Bookings for target month
      const { data: monthMonthlyBookings, error: mmbErr } = await supabase
        .from('monthly_bookings')
        .select('*')
        .eq('booking_month', targetMonth);
      if (mmbErr) throw mmbErr;

      // 3. Fetch Transactions for target month
      const { data: monthTxns, error: mtxErr } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDateIso)
        .lte('date', endDateIso)
        .order('date', { ascending: true });
      if (mtxErr) throw mtxErr;

      if (monthDailyBookings.length === 0 && (!monthMonthlyBookings || monthMonthlyBookings.length === 0) && (!monthTxns || monthTxns.length === 0)) {
        showAlert(`ไม่พบข้อมูลในรอบเดือน ${monthThai} ที่จะทำการจัดเก็บ`, "ไม่พบข้อมูล", true);
        return;
      }

      // 4. Send Payload to Google Apps Script Webhook
      const payload = {
        folderId: '1kmBElcZAAX0UbQ61cI3fbgbJHHzi6eXu',
        monthStr: targetMonth,
        monthThai: monthThai,
        dailyBookings: monthDailyBookings,
        monthlyBookings: monthMonthlyBookings || [],
        transactions: monthTxns || []
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Google Apps Script ส่งข้อผิดพลาดกลับมา');
      }

      // 5. If purge is requested, clean up daily bookings from Supabase
      let purgedCount = 0;
      if (purgeAfterArchive) {
        const { error: delErr, count: delCount } = await supabase
          .from('bookings')
          .delete({ count: 'exact' })
          .gte('date', startDateIso)
          .lte('date', endDateIso);
        if (delErr) throw delErr;
        purgedCount = delCount || monthDailyBookings.length;
        await fetchBookingsAndStorage();
      }

      showAlert(
        `🎉 จัดเก็บประวัติรอบเดือน ${monthThai} เข้า Google Drive สำเร็จ!\n\n` +
        `• 📄 ชื่อไฟล์: ${result.fileName}\n` +
        `• 📅 การจองรายวัน: ${monthDailyBookings.length} รายการ\n` +
        `• 🏢 สัญญารายเดือน: ${(monthMonthlyBookings || []).length} สัญญา\n` +
        `• 💳 ธุรกรรมการเงิน: ${(monthTxns || []).length} ธุรกรรม\n` +
        (purgeAfterArchive ? `• 🧹 ล้างข้อมูลรายวันออกจากฐานข้อมูลสด: ${purgedCount} รายการ` : ''),
        "สำรองข้อมูลสำเร็จ"
      );

      // Open Google Sheet if URL returned
      if (result.fileUrl && typeof window !== 'undefined') {
        window.open(result.fileUrl, '_blank');
      }

      return { success: true, result };
    } catch (err) {
      console.error('Error archiving month to Google Sheets:', err);
      showAlert("เกิดข้อผิดพลาดในการจัดเก็บข้อมูลเข้า Google Drive: " + err.message, "ข้อผิดพลาด", true);
      return { success: false, error: err };
    } finally {
      setArchivingMonth(false);
    }
  };


  // --- SETTINGS / ADMIN ROLES CRUD HANDLERS ---
  const fetchAdminRolesData = async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase.from('admin_roles').select('*').order('email');
      if (error) throw error;
      setAdminRolesList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };


  // Trigger data load when settings modal opens
  useEffect(() => {
    if (showSettingsMgmtModal) fetchAdminRolesData();
  }, [showSettingsMgmtModal]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (addStallDropdownRef.current && !addStallDropdownRef.current.contains(event.target)) {
        setShowAddStallSelect(false);
        setStallFilter('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <BookingContext.Provider value={{
      ...monthlyBooking,

      // Stalls & Daily Bookings
      stalls,
      setStalls,
      fetchStalls,
      bookings,
      setBookings,
      fetchBookingsAndStorage,
      loading,
      setLoading,
      selectedDate,
      setSelectedDate,
      dateOffset,
      setDateOffset,
      quickDates,
      setQuickDates,
      initDates,
      searchQuery,
      setSearchQuery,
      searchResults,
      setSearchResults,
      highlightedStall,
      setHighlightedStall,
      handleSearch,
      selectSearchResult,
      getStallStatus,
      getStallPriceForDate,
      calculateDefaultStallPrice,
      handleStallClick,

      // Modal & Form States for Daily Booking
      selectedStall,
      setSelectedStall,
      selectedBooking,
      setSelectedBooking,
      showBookingModal,
      setShowBookingModal,
      bookerName,
      setBookerName,
      product,
      setProduct,
      bookingType,
      setBookingType,
      paymentMethod,
      setPaymentMethod,
      stallPrice,
      setStallPrice,
      elecUnit,
      setElecUnit,
      elecPrice,
      setElecPrice,
      note,
      setNote,
      paymentList,
      setPaymentList,
      cashReceived,
      setCashReceived,
      selectedStallsList,
      setSelectedStallsList,
      showAddStallSelect,
      setShowAddStallSelect,
      stallFilter,
      setStallFilter,
      addStallDropdownRef,
      handleSaveBooking,
      handleDeleteBooking,
      handleMarkAbsent,

      // Utility Additions
      showAddUtilityModal,
      setShowAddUtilityModal,
      addUtilityUnit,
      setAddUtilityUnit,
      addUtilityPrice,
      setAddUtilityPrice,
      addUtilityMethod,
      setAddUtilityMethod,
      handleAddUtility,

      // Move Lock (Transfer)
      showMoveLockModal,
      setShowMoveLockModal,
      moveTargetDate,
      setMoveTargetDate,
      moveTargetStall,
      setMoveTargetStall,
      vacantStallsOnTargetDate,
      setVacantStallsOnTargetDate,
      loadingVacantStalls,
      setLoadingVacantStalls,
      moveStallFilter,
      setMoveStallFilter,
      fetchVacantStallsForDate,
      handleConfirmMoveLock,

      // Standby Waitlist
      standbyList,
      setStandbyList,
      showStandbyModal,
      setShowStandbyModal,
      handleAddStandbyQueue,
      handleUpdateStandbyStatus,
      handleDeleteStandbyQueue,
      fetchStandbyList,

      // Audit & Activity Logs
      showActivityLogsModal,
      setShowActivityLogsModal,

      // Daily Stall Map Monthly Integration
      showMonthlyStallMapModal,
      setShowMonthlyStallMapModal,
      selectedMonthlyStallBooking,
      setSelectedMonthlyStallBooking,
      handleVacateMonthlyStallToday,

      // Receipt & Print
      showReceiptPreviewModal,
      setShowReceiptPreviewModal,
      receiptPreviewData,
      setReceiptPreviewData,
      handleShowReceiptPreview,
      handlePrintReceipt,

      // Auth & Admin
      adminUser,
      setAdminUser,
      adminList,
      setAdminList,
      adminRolesList,
      setAdminRolesList,
      loadingSettings,
      setLoadingSettings,
      selectedAdminEmail,
      setSelectedAdminEmail,
      adminForm,
      setAdminForm,
      fetchAdminRoles,
      handleGoogleLogin,
      handleLogin,
      handleLogout,
      handleSaveAdminRole,
      verifyAndSetAdmin,
      showLoginModal,
      setShowLoginModal,

      // Settings & Archive
      showSettingsMgmtModal,
      setShowSettingsMgmtModal,
      fetchAdminRolesData,
      syncingLegacy,
      archiveWebhookUrl,
      setArchiveWebhookUrl,
      archivingMonth,
      archiveSelectedMonth,
      setArchiveSelectedMonth,
      handleArchiveMonthToGoogleSheets,
      handleSyncDailyFromLegacy,
      handleSyncAllFromLegacy,
      handleSyncFromLegacySheets,

      // Alert & Confirm Dialogs
      alertInfo,
      setAlertInfo,
      showAlert,
      confirmInfo,
      setConfirmInfo,
      showConfirm,

      // Helpers
      getBookingCustomerType,
      cleanStallName,
      formatPrice,
      formatBookingMonth
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
