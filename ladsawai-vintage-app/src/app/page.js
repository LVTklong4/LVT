'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Settings, 
  LayoutDashboard, 
  Boxes, 
  CalendarDays, 
  RotateCcw, 
  RefreshCw, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  LogOut,
  X,
  CreditCard,
  FileText,
  Zap,
  Phone,
  Store,
  Info,
  Sun,
  Leaf,
  ShoppingBag,
  PlusCircle,
  DollarSign
} from 'lucide-react';

// Date and formatting helpers for Thai locale
const dayNamesShort = {
  0: 'อาทิตย์',
  1: 'จันทร์',
  2: 'อังคาร',
  3: 'พุธ',
  4: 'พฤหัสฯ',
  5: 'ศุกร์',
  6: 'เสาร์'
};

const monthNamesShort = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const monthNamesFull = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const getThaiShortYear = (date) => {
  const beYear = date.getFullYear() + 543;
  return String(beYear).slice(-2);
};

const getModalDateFormat = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = dayNamesShort[d.getDay()];
  const dateNum = d.getDate();
  const month = monthNamesFull[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ที่ ${dateNum} ${month} ${year}`;
};

export default function BookingPage() {
  // States
  const [stalls, setStalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [storageMap, setStorageMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateOffset, setDateOffset] = useState(0);
  const [quickDates, setQuickDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedStall, setHighlightedStall] = useState(null);
  
  // Authentication & Admin State
  const [adminUser, setAdminUser] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('');
  
  // Modal States
  const [selectedStall, setSelectedStall] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Forms States
  const [bookerName, setBookerName] = useState('');
  const [product, setProduct] = useState('');
  const [bookingType, setBookingType] = useState('รายวัน');
  const [paymentMethod, setPaymentMethod] = useState('เงินสด');
  const [stallPrice, setStallPrice] = useState(0);
  const [storageFee, setStorageFee] = useState(0);
  const [elecUnit, setElecUnit] = useState(0);
  const [elecPrice, setElecPrice] = useState(0);
  const [note, setNote] = useState('');
  
  // Extra Actions States
  const [showAddUtilityModal, setShowAddUtilityModal] = useState(false);
  const [addUtilityUnit, setAddUtilityUnit] = useState(1);
  const [addUtilityPrice, setAddUtilityPrice] = useState(20);
  const [addUtilityMethod, setAddUtilityMethod] = useState('โอนเงิน');
  
  // Storage Management Modal States
  const [showStorageMgmtModal, setShowStorageMgmtModal] = useState(false);
  const [storageList, setStorageList] = useState([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storageForm, setStorageForm] = useState({
    id: '',
    stall_name: '',
    owner_name: '',
    phone: '',
    start_date: '',
    end_date: '',
    status: 'Active',
    note: ''
  });

  // Monthly Management Modal States
  const [showMonthlyMgmtModal, setShowMonthlyMgmtModal] = useState(false);
  const [monthlyList, setMonthlyList] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [selectedMonthlyItem, setSelectedMonthlyItem] = useState(null);

  // Finance Modal States
  const [showFinanceMgmtModal, setShowFinanceMgmtModal] = useState(false);
  const [expenseList, setExpenseList] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeTab, setFinanceTab] = useState('income');
  const [incomeForm, setIncomeForm] = useState({
    date: '',
    category: 'ค่าปรับ',
    description: '',
    amount: '',
    method: 'โอนเงิน'
  });
  const [expenseForm, setExpenseForm] = useState({
    date: '',
    category: 'ค่าน้ำค่าไฟ',
    item: '',
    amount: '',
    method: 'โอนเงิน'
  });

  // Settings Modal States
  const [showSettingsMgmtModal, setShowSettingsMgmtModal] = useState(false);
  const [adminRolesList, setAdminRolesList] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    role: 'Staff',
    status: 'เปิด',
    employee_id: ''
  });
  
  // Alert/Toast State
  const [alertInfo, setAlertInfo] = useState(null);

  // Initialize
  useEffect(() => {
    // 1. Fetch authorized admin roles
    fetchAdminRoles();
    // 2. Setup dates
    initDates();
    // 3. Fetch Stallsผังตลาด
    fetchStalls();
    
    // 4. Check active session from Supabase Auth
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await verifyAndSetAdmin(session.user.email);
      } else {
        // Fallback to local storage for bypass session
        const savedSession = localStorage.getItem('lvt_admin_session');
        if (savedSession) {
          try {
            setAdminUser(JSON.parse(savedSession));
          } catch (e) {
            localStorage.removeItem('lvt_admin_session');
          }
        }
      }
    };

    checkUser();

    // 5. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await verifyAndSetAdmin(session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
        localStorage.removeItem('lvt_admin_session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const verifyAndSetAdmin = async (email) => {
    try {
      const { data: admin, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('email', email)
        .eq('status', 'เปิด')
        .maybeSingle();

      if (admin) {
        setAdminUser(admin);
        localStorage.setItem('lvt_admin_session', JSON.stringify(admin));
        showAlert(`ยินดีต้อนรับคุณ ${admin.name}`, "เข้าสู่ระบบสำเร็จ");
      } else {
        await supabase.auth.signOut();
        setAdminUser(null);
        localStorage.removeItem('lvt_admin_session');
        showAlert(`อีเมล ${email} ไม่มีสิทธิ์เข้าใช้งานระบบผู้ดูแล`, "เข้าสู่ระบบไม่สำเร็จ", true);
      }
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: " + e.message, "ข้อผิดพลาด", true);
    }
  };

  // Fetch bookings when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookingsAndStorage();
    }
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
    setAlertInfo({ message, title, isError });
    setTimeout(() => setAlertInfo(null), 4000);
  };

  const fetchAdminRoles = async () => {
    try {
      const { data, error } = await supabase.from('admin_roles').select('*');
      if (error) throw error;
      setAdminList(data || []);
    } catch (e) {
      console.error("Error fetching admin roles:", e);
    }
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

  const fetchBookingsAndStorage = async () => {
    setLoading(true);
    try {
      // 1. Fetch Bookings for date
      const { data: bookingsData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', selectedDate);
      if (bError) throw bError;
      setBookings(bookingsData || []);

      // 2. Fetch Active Storage
      const { data: storageData, error: sError } = await supabase
        .from('storage')
        .select('*')
        .eq('status', 'Active');
      if (sError) throw sError;

      // Map storage by stall name for fast lookup
      const stMap = {};
      storageData?.forEach(item => {
        if (item.stall_name) {
          stMap[item.stall_name] = item;
        }
      });
      setStorageMap(stMap);

    } catch (e) {
      console.error("Error fetching date data:", e);
      showAlert("ดึงข้อมูลจองและฝากของไม่สำเร็จ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-in Handler
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });
      if (error) throw error;
    } catch (e) {
      showAlert("เกิดข้อผิดพลาดในการเชื่อมต่อ Google: " + e.message, "ข้อผิดพลาด", true);
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

    if (stall.type === 'รายเดือน' || stall.type.includes('รายเดือน')) {
      if (booking) {
        if (booking.status === 'ลา') {
          return { isVacant: true, label: 'ว่าง (ปล่อยเช่ารายวัน)', price, product: '' };
        } else {
          return { isVacant: false, label: 'ไม่ว่าง', product: booking.product || 'ร้านค้าประจำ' };
        }
      } else {
        return { isVacant: false, label: 'ไม่ว่าง (ร้านค้าประจำ)', product: 'ร้านค้าประจำ' };
      }
    } else {
      // Daily stall
      if (booking) {
        if (booking.status === 'ลา') {
          return { isVacant: true, label: 'ว่าง', price, product: '' };
        } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
          return { isVacant: false, label: 'ไม่ว่าง', product: booking.product || 'จองแล้ว' };
        } else {
          // Unpaid
          return { isVacant: false, label: 'ไม่ว่าง (ค้างชำระ)', product: booking.product || 'ค้างชำระ' };
        }
      } else {
        return { isVacant: true, label: 'ว่าง', price, product: '' };
      }
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

  // Click Stall handler
  const handleStallClick = (stall) => {
    if (stall.type === 'ทางเดิน' || stall.type === 'อื่นๆ') return;
    
    const booking = bookings.find(b => b.stall_name === stall.name);
    setSelectedStall(stall);
    setSelectedBooking(booking || null);

    // Get price based on day of week
    const dateObj = new Date(selectedDate);
    const day = dateObj.getDay();
    let price = stall.price_wed;
    if (day === 6) price = stall.price_sat;
    if (day === 0) price = stall.price_sun;
    
    // Pre-populate fields
    if (booking) {
      setBookerName(booking.booker_name);
      setProduct(booking.product);
      setBookingType(booking.type);
      setPaymentMethod(booking.payment_method || 'เงินสด');
      setStallPrice(booking.stall_price);
      setStorageFee(booking.storage_fee || 0);
      setElecUnit(booking.elec_unit || 0);
      setElecPrice(booking.elec_price || 0);
      setNote(booking.note || '');
    } else {
      setBookerName('');
      setProduct('');
      setBookingType('รายวัน');
      setPaymentMethod('เงินสด');
      setStallPrice(price);
      setStorageFee(0);
      setElecUnit(0);
      setElecPrice(0);
      setNote('');
    }

    setShowBookingModal(true);
  };

  // Save Booking handler (Insert or Update)
  const handleSaveBooking = async (status = 'ค้างชำระ') => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!bookerName.trim()) {
      showAlert("โปรดกรอกชื่อผู้ค้า/เบอร์โทร", "แจ้งเตือน", true);
      return;
    }

    setLoading(true);
    try {
      const bookingId = selectedBooking?.id || `B-${Date.now()}`;
      const totalVal = parseNumber(stallPrice) + parseNumber(elecPrice) + parseNumber(storageFee);

      const bookingData = {
        id: bookingId,
        date: selectedDate,
        stall_name: selectedStall.name,
        booker_name: bookerName,
        product: product,
        type: bookingType,
        elec_unit: parseNumber(elecUnit),
        elec_price: parseNumber(elecPrice),
        stall_price: parseNumber(stallPrice),
        total_price: totalVal,
        payment_method: paymentMethod,
        status: status,
        note: note,
        storage_fee: parseNumber(storageFee)
      };

      // 1. Save Booking (Upsert)
      const { error: saveError } = await supabase
        .from('bookings')
        .upsert(bookingData);
      if (saveError) throw saveError;

      // 2. Record Transaction if Paid
      if (status === 'ชำระแล้ว') {
        const txnId = `TXN-${Date.now()}`;
        const txnData = {
          id: txnId,
          booking_ref: bookingId,
          date: selectedDate,
          category: bookingType === 'รายวัน' ? 'ค่าล็อครายวัน' : 'ค่าล็อครายเดือน',
          total_amount: totalVal,
          method: paymentMethod,
          note: `ชำระเงินล็อค ${selectedStall.name}`,
          officer: adminUser.name,
          timestamp: new Date().toISOString(),
          stall_amt: parseNumber(stallPrice),
          elec_amt: parseNumber(elecPrice),
          storage_amt: parseNumber(storageFee),
          bill_type: 'General'
        };

        const { error: txnError } = await supabase
          .from('transactions')
          .insert(txnData);
        if (txnError) throw txnError;
      }

      showAlert("บันทึกการจองสำเร็จ", "สำเร็จ");
      setShowBookingModal(false);
      fetchBookingsAndStorage();
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

    if (!confirm(`ยืนยันการลบการจองล็อค ${selectedStall.name} หรือไม่?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBooking.id);
      if (error) throw error;

      showAlert("ลบข้อมูลการจองเรียบร้อย", "สำเร็จ");
      setShowBookingModal(false);
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการลบ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Mark Absence (แจ้งลาหยุด)
  const handleMarkAbsent = async () => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!confirm(`ยืนยันการแจ้ง "ลาหยุด" สำหรับล็อค ${selectedStall.name} ในวันที่ ${getModalDateFormat(selectedDate)} หรือไม่?\n(ระบบจะปล่อยล็อคว่างให้ร้านค้าอื่นจองรายวันได้)`)) {
      return;
    }

    setLoading(true);
    try {
      const bookingId = selectedBooking?.id || `B-${Date.now()}`;
      
      const bookingData = {
        id: bookingId,
        date: selectedDate,
        stall_name: selectedStall.name,
        booker_name: selectedBooking?.booker_name || 'ร้านประจำลาหยุด',
        product: 'แจ้งลาหยุด',
        type: selectedStall.type === 'รายเดือน' ? 'รายเดือน' : 'รายวัน',
        elec_unit: 0,
        elec_price: 0,
        stall_price: 0,
        total_price: 0,
        payment_method: 'เงินสด',
        status: 'ลา',
        note: 'แจ้งลาหยุดโดยระบบแอดมิน',
        storage_fee: 0
      };

      const { error: saveError } = await supabase
        .from('bookings')
        .upsert(bookingData);
      if (saveError) throw saveError;

      showAlert("บันทึกการแจ้งลาหยุดสำเร็จ", "สำเร็จ");
      setShowBookingModal(false);
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึกการลา: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // Add electricity (Utility charge)
  const handleAddUtility = async () => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!selectedBooking) return;

    setLoading(true);
    try {
      const currentUnit = parseNumber(selectedBooking.elec_unit);
      const currentPrice = parseNumber(selectedBooking.elec_price);
      const currentTotal = parseNumber(selectedBooking.total_price);

      const newUnit = currentUnit + parseNumber(addUtilityUnit);
      const newPrice = currentPrice + parseNumber(addUtilityPrice);
      const newTotal = currentTotal + parseNumber(addUtilityPrice);

      // 1. Update Booking
      const { error: bError } = await supabase
        .from('bookings')
        .update({
          elec_unit: newUnit,
          elec_price: newPrice,
          total_price: newTotal,
          status: 'ค้างชำระ' // Set back to unpaid for collection
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

      showAlert("บันทึกค่าไฟเพิ่มเติมสำเร็จ", "สำเร็จ");
      setShowAddUtilityModal(false);
      setShowBookingModal(false);
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการเพิ่มค่าไฟ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoading(false);
    }
  };

  // --- STORAGE CRUD HANDLERS ---
  const fetchAllStorage = async () => {
    setLoadingStorage(true);
    try {
      const { data, error } = await supabase
        .from('storage')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setStorageList(data || []);
    } catch (e) {
      console.error(e);
      showAlert("ดึงข้อมูลฝากของไม่สำเร็จ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleSaveStorage = async (e) => {
    e.preventDefault();
    if (!storageForm.stall_name || !storageForm.owner_name) {
      showAlert("โปรดกรอกเลขล็อคและชื่อผู้ฝาก", "แจ้งเตือน", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const id = storageForm.id || `ST-${Date.now()}`;
      const payload = {
        id,
        stall_name: storageForm.stall_name.trim(),
        owner_name: storageForm.owner_name.trim(),
        phone: storageForm.phone.trim(),
        start_date: storageForm.start_date || null,
        end_date: storageForm.end_date || null,
        status: storageForm.status,
        note: storageForm.note,
        timestamp: new Date().toISOString()
      };
      const { error } = await supabase.from('storage').upsert(payload);
      if (error) throw error;
      
      showAlert("บันทึกข้อมูลฝากของสำเร็จ", "สำเร็จ");
      setStorageForm({ id: '', stall_name: '', owner_name: '', phone: '', start_date: '', end_date: '', status: 'Active', note: '' });
      fetchAllStorage();
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleToggleStorageStatus = async (item) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const { error } = await supabase
        .from('storage')
        .update({ status: newStatus })
        .eq('id', item.id);
      if (error) throw error;
      showAlert(`อัปเดตสถานะเป็น ${newStatus} สำเร็จ`, "สำเร็จ");
      fetchAllStorage();
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ", "ข้อผิดพลาด", true);
    }
  };

  // --- MONTHLY BOOKING CRUD HANDLERS ---
  const fetchAllMonthly = async () => {
    setLoadingMonthly(true);
    try {
      const { data, error } = await supabase
        .from('monthly_bookings')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setMonthlyList(data || []);
    } catch (e) {
      console.error(e);
      showAlert("ดึงข้อมูลรายเดือนไม่สำเร็จ", "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handleUpdateMonthlyItem = async (e) => {
    e.preventDefault();
    if (!selectedMonthlyItem) return;
    setLoadingMonthly(true);
    try {
      const { error } = await supabase
        .from('monthly_bookings')
        .update({
          paid_amount: parseNumber(selectedMonthlyItem.paid_amount),
          status: selectedMonthlyItem.status,
          renewal_status: selectedMonthlyItem.renewal_status,
          note: selectedMonthlyItem.note
        })
        .eq('id', selectedMonthlyItem.id);
      if (error) throw error;
      
      showAlert("อัปเดตข้อมูลผู้เช่ารายเดือนสำเร็จ", "สำเร็จ");
      setSelectedMonthlyItem(null);
      fetchAllMonthly();
      fetchBookingsAndStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการอัปเดต: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // --- FINANCE CRUD HANDLERS ---
  const fetchFinanceData = async () => {
    setLoadingFinance(true);
    try {
      const { data: inc, error: incErr } = await supabase.from('other_income').select('*').order('timestamp', { ascending: false });
      const { data: exp, error: expErr } = await supabase.from('expenses').select('*').order('timestamp', { ascending: false });
      if (incErr) throw incErr;
      if (expErr) throw expErr;
      setIncomeList(inc || []);
      setExpenseList(exp || []);
    } catch (e) {
      console.error(e);
      showAlert("ดึงข้อมูลการเงินไม่สำเร็จ", "ข้อผิดพลาด", true);
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || !incomeForm.description) {
      showAlert("กรุณากรอกข้อมูลจำนวนเงินและรายละเอียดให้ครบถ้วน", "แจ้งเตือน", true);
      return;
    }
    setLoadingFinance(true);
    try {
      const payload = {
        id: `INC-${Date.now()}`,
        date: incomeForm.date || new Date().toISOString().split('T')[0],
        category: incomeForm.category,
        description: incomeForm.description.trim(),
        amount: parseNumber(incomeForm.amount),
        method: incomeForm.method,
        officer: adminUser?.name || 'Admin',
        timestamp: new Date().toISOString()
      };
      const { error } = await supabase.from('other_income').insert([payload]);
      if (error) throw error;
      
      showAlert("บันทึกรายได้อื่น ๆ สำเร็จ", "สำเร็จ");
      setIncomeForm({ date: '', category: 'ค่าปรับ', description: '', amount: '', method: 'โอนเงิน' });
      fetchFinanceData();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.item) {
      showAlert("กรุณากรอกข้อมูลจำนวนเงินและรายการจ่ายให้ครบถ้วน", "แจ้งเตือน", true);
      return;
    }
    setLoadingFinance(true);
    try {
      const payload = {
        id: `EXP-${Date.now()}`,
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        category: expenseForm.category,
        item: expenseForm.item.trim(),
        amount: parseNumber(expenseForm.amount),
        method: expenseForm.method,
        officer: adminUser?.name || 'Admin',
        timestamp: new Date().toISOString()
      };
      const { error } = await supabase.from('expenses').insert([payload]);
      if (error) throw error;
      
      showAlert("บันทึกรายจ่ายสำเร็จ", "สำเร็จ");
      setExpenseForm({ date: '', category: 'ค่าน้ำค่าไฟ', item: '', amount: '', method: 'โอนเงิน' });
      fetchFinanceData();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingFinance(false);
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

  const handleSaveAdminRole = async (e) => {
    e.preventDefault();
    if (!adminForm.email || !adminForm.name) {
      showAlert("กรุณากรอกอีเมลและชื่อแอดมิน", "แจ้งเตือน", true);
      return;
    }
    setLoadingSettings(true);
    try {
      const payload = {
        email: adminForm.email.trim().toLowerCase(),
        name: adminForm.name.trim(),
        role: adminForm.role,
        status: adminForm.status,
        employee_id: adminForm.employee_id.trim() || null,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase.from('admin_roles').upsert(payload);
      if (error) throw error;
      
      showAlert("บันทึกสิทธิ์ผู้ดูแลระบบสำเร็จ", "สำเร็จ");
      setAdminForm({ email: '', name: '', role: 'Staff', status: 'เปิด', employee_id: '' });
      fetchAdminRolesData();
      fetchAdminRoles(); // refresh global admin roles list
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Trigger data load when modals open
  useEffect(() => {
    if (showStorageMgmtModal) fetchAllStorage();
  }, [showStorageMgmtModal]);

  useEffect(() => {
    if (showMonthlyMgmtModal) fetchAllMonthly();
  }, [showMonthlyMgmtModal]);

  useEffect(() => {
    if (showFinanceMgmtModal) fetchFinanceData();
  }, [showFinanceMgmtModal]);

  useEffect(() => {
    if (showSettingsMgmtModal) fetchAdminRolesData();
  }, [showSettingsMgmtModal]);

  // Helper utility parse
  const parseNumber = (val) => {
    const num = parseFloat(String(val));
    return isNaN(num) ? 0 : num;
  };

  // Dynamic grid column setup
  let maxCol = 20;
  let maxRow = 26;
  stalls.forEach(s => {
    if (s.row > maxRow) maxRow = s.row;
    if (s.col > maxCol) maxCol = s.col;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Toast Alert */}
      {alertInfo && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm transition-all duration-300 animate-bounce-in ${
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all duration-200 w-[145px] ${btnStyle}`}
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
                <div className="relative max-w-[180px] w-full">
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
                  <a href="/dashboard" className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="แดชบอร์ดสรุปผล">
                    <LayoutDashboard className="w-5 h-5" />
                  </a>

                  {/* Admin Management Dropdown */}
                  <div className="relative group">
                    <button className="px-2.5 py-1.5 text-amber-900 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-250 rounded-lg transition-all flex items-center gap-1 font-bold text-xs shadow-sm">
                      <Settings className="w-3.5 h-3.5 text-amber-800" />
                      <span>จัดการระบบ</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block hover:block bg-white border border-amber-200 rounded-lg shadow-xl py-1 w-44 z-[50] divide-y divide-amber-50 animate-pop-in">
                      <button 
                        onClick={() => setShowStorageMgmtModal(true)} 
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors"
                      >
                        <span>📦</span> จัดการฝากของ
                      </button>
                      <button 
                        onClick={() => setShowMonthlyMgmtModal(true)} 
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors"
                      >
                        <span>🗓️</span> จัดการรายเดือน
                      </button>
                      <button 
                        onClick={() => setShowFinanceMgmtModal(true)} 
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors"
                      >
                        <span>💸</span> รายรับ/รายจ่าย
                      </button>
                      <button 
                        onClick={() => setShowSettingsMgmtModal(true)} 
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 text-gray-700 font-bold flex items-center gap-2 transition-colors"
                      >
                        <span>⚙️</span> จัดการสิทธิ์แอดมิน
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => fetchBookingsAndStorage()}
                    className="p-1.5 text-green-700 hover:bg-green-50 rounded-lg transition-colors" 
                    title="ดึงข้อมูลใหม่"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Login control */}
            {adminUser ? (
              <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 pl-2 pr-1 py-0.5 rounded-full">
                <span className="text-xs font-bold text-amber-800">{adminUser.name}</span>
                <button 
                  onClick={handleLogout}
                  className="p-1 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-3 py-1.5 bg-amber-800 text-white rounded-full text-xs font-bold hover:bg-amber-900 transition-all flex items-center gap-1 shadow"
              >
                <User className="w-3.5 h-3.5" /> เข้าสู่ระบบ
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Main content grid area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 mb-24">
        
        {/* Colors Legend */}
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2 mb-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] md:text-xs font-semibold justify-center text-gray-700">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#DCEDC8] border border-[#AED581] rounded"></span>อาหาร (ว่าง)</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#B3E5FC] border border-[#81D4FA] rounded"></span>เสื้อผ้า (ว่าง)</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#FFE0B2] border border-[#FFB74D] rounded"></span>ค้างชำระ</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#FFCDD2] border border-[#E57373] rounded"></span>จองแล้ว</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#E1BEE7] border border-[#BA68C8] rounded"></span>รายเดือน</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-white border rounded flex items-center justify-center text-[10px] shadow-sm">📦</span>มีฝากของ</div>
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
                    const isInsideTopRight = r >= 1 && r <= 3 && c >= 12 && c <= 19;
                    const isInsideBottomLeft = r >= 22 && r <= 27 && c >= 2 && c <= 8;
                    
                    if (isInsideTopRight || isInsideBottomLeft) {
                      return (
                        <div 
                          key={`other-box-${r}-${c}`} 
                          style={{ gridRow: r, gridColumn: c }} 
                          className="bg-[#FFF9C4] border border-dashed border-[#FBC02D] rounded-sm w-full h-full min-h-[38px] opacity-80" 
                        />
                      );
                    }
                    return <div key={`empty-${r}-${c}`} style={{ gridRow: r, gridColumn: c }} className="invisible" />;
                  }

                  const booking = bookings.find(b => b.stall_name === stall.name);
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
                      } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
                        statusClass = "bg-occupied text-red-900";
                        statusText = booking.product || "จองแล้ว";
                      } else if (booking.status === 'ค้างชำระ') {
                        statusClass = "bg-unpaid text-amber-900";
                        statusText = "ค้างชำระ";
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
                      } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
                        statusClass = "bg-occupied text-red-900";
                        statusText = booking.product || "จองแล้ว";
                      } else {
                        statusClass = "bg-unpaid text-amber-900";
                        statusText = "ค้างชำระ";
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
                      <span className="text-[9px] font-extrabold leading-none">{displayName}</span>
                      {statusText === 'ลา' && (
                        <span className="text-[7px] font-bold text-red-600 leading-none mt-0.5">ลา</span>
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
                  gridColumn: "12 / span 4",
                  border: "3px solid #EAB308",
                  backgroundColor: "rgba(254, 249, 195, 0.15)"
                }}
                className="rounded-md flex items-center justify-center text-amber-900 font-extrabold text-[12px] shadow-sm text-center p-1 border-2 pointer-events-none z-10"
              >
                ร้านขายของชำ
              </div>
              
              <div 
                style={{ 
                  gridRow: "1 / span 3", 
                  gridColumn: "16 / span 4",
                  border: "3px solid #2563EB",
                  backgroundColor: "rgba(219, 234, 254, 0.15)"
                }}
                className="rounded-md flex items-center justify-center text-blue-900 font-extrabold text-[12px] shadow-sm text-center p-1 border-2 pointer-events-none z-10"
              >
                ห้องน้ำ
              </div>
              
              <div 
                style={{ 
                  gridRow: "22 / span 6", 
                  gridColumn: "2 / span 7",
                  border: "3px solid #DC2626",
                  backgroundColor: "rgba(254, 226, 226, 0.15)"
                }}
                className="rounded-md flex items-center justify-center text-red-900 font-extrabold text-sm shadow-sm text-center p-1 border-2 pointer-events-none z-10"
              >
                ร้านน้ำ
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
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border-2 border-amber-800 overflow-hidden animate-pop-in">
            <div className="bg-amber-800 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">เข้าสู่ระบบทีมงานผู้ดูแล</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-amber-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <img 
                  src="https://www.vectorlogo.zone/logos/google/google-icon.svg" 
                  alt="Google" 
                  className="w-4 h-4" 
                />
                เข้าสู่ระบบด้วยบัญชี Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold">หรือใช้ระบบทดสอบ (Bypass)</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">เลือกชื่อผู้ใช้ทดสอบ</label>
                <select
                  value={selectedAdminEmail}
                  onChange={(e) => setSelectedAdminEmail(e.target.value)}
                  className="p-2 border border-amber-300 rounded bg-amber-50/50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- โปรดเลือกผู้ใช้งาน --</option>
                  {adminList.map(a => (
                    <option key={a.email} value={a.email}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white rounded font-bold text-xs transition-all shadow"
              >
                เข้าสู่ระบบ (Bypass)
              </button>
            </div>
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
              <div className="p-5 flex flex-col gap-4">
                {/* Date */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold">วันที่</span>
                  <span className="text-sm font-extrabold text-gray-800 bg-amber-50/50 p-2.5 rounded border border-amber-200/60">
                    {getModalDateFormat(selectedDate)}
                  </span>
                </div>

                {/* Stall Name */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold">ชื่อล็อค</span>
                  <span className="text-base font-extrabold text-[#8B4513] bg-amber-50/50 p-2.5 rounded border border-amber-200/60">
                    {selectedStall.name} ({selectedStall.type})
                  </span>
                </div>

                {/* Status / Product */}
                {(() => {
                  const statusInfo = getStallStatus(selectedStall, selectedBooking);
                  return (
                    <>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 font-bold">สถานะ</span>
                        <div className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-between ${
                          statusInfo.isVacant 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <span>{statusInfo.isVacant ? 'สถานะว่าง' : 'ไม่ว่าง'}</span>
                          {statusInfo.isVacant && (
                            <span className="text-xs font-extrabold text-green-700 bg-green-100/60 px-2.5 py-1 rounded-full border border-green-200">
                              {statusInfo.price} บาท
                            </span>
                          )}
                        </div>
                      </div>

                      {/* If not vacant, show product name */}
                      {!statusInfo.isVacant && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500 font-bold">สินค้าที่ขาย</span>
                          <span className="text-sm font-extrabold text-gray-800 bg-amber-50/50 p-2.5 rounded border border-amber-200/60">
                            {statusInfo.product || 'ไม่มีข้อมูลสินค้า'}
                          </span>
                        </div>
                      )}

                      {/* If vacant, show LINE LIFF button */}
                      {statusInfo.isVacant && (
                        <a 
                          href="https://liff.line.me/2008895416-3c35BsXZ"
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" 
                            alt="LINE" 
                            className="w-5 h-5 filter invert" 
                          />
                          จองล็อคนี้ผ่าน LINE
                        </a>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              // Admin View (Form & Controls)
              <>
                <div className="p-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  
                  {/* Stall Details Tag */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded p-2 flex flex-wrap gap-y-1 gap-x-4 text-xs font-semibold text-gray-700">
                    <span>แถว: {selectedStall.row}</span>
                    <span>คอลัมน์: {selectedStall.col}</span>
                    <span>ประเภทล็อค: {selectedStall.type}</span>
                  </div>

                  {/* Form Input fields */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">ชื่อผู้ค้า / เบอร์โทรศัพท์ *</label>
                    <input 
                      type="text" 
                      value={bookerName}
                      onChange={(e) => setBookerName(e.target.value)}
                      placeholder="กรอกชื่อผู้ค้า และเบอร์ติดต่อ"
                      className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">สินค้าที่ขาย</label>
                    <input 
                      type="text" 
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="เช่น เสื้อผ้าวินเทจ, ส้มตำ"
                      className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">ประเภทการเช่า</label>
                      <select
                        value={bookingType}
                        onChange={(e) => setBookingType(e.target.value)}
                        className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 focus:outline-none"
                      >
                        <option value="รายวัน">รายวัน</option>
                        <option value="รายเดือน">รายเดือน</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">วิธีการชำระ</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 focus:outline-none"
                      >
                        <option value="เงินสด">เงินสด</option>
                        <option value="โอนเงิน">โอนเงิน</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">ค่าล็อค (บาท)</label>
                      <input 
                        type="number" 
                        value={stallPrice}
                        onChange={(e) => setStallPrice(e.target.value)}
                        className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">ค่าไฟ (บาท)</label>
                      <input 
                        type="number" 
                        value={elecPrice}
                        onChange={(e) => setElecPrice(e.target.value)}
                        className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">ค่าฝากของ (บาท)</label>
                      <input 
                        type="number" 
                        value={storageFee}
                        onChange={(e) => setStorageFee(e.target.value)}
                        className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 text-center"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">หมายเหตุเพิ่มเติม</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="ข้อมูลเพิ่มเติม เช่น ล็อคประจำ"
                      rows="2"
                      className="p-2 border border-amber-300 rounded text-xs text-gray-800 bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Total Calculation Display */}
                  <div className="bg-[#FAEBD7] border border-[#8B4513]/40 rounded p-3 flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-[#4A3B32]">ยอดรวมทั้งหมด:</span>
                    <span className="text-base font-extrabold text-red-800">
                      {parseNumber(stallPrice) + parseNumber(elecPrice) + parseNumber(storageFee)} บาท
                    </span>
                  </div>

                  {/* Extra tools inside booking modal */}
                  <div className="mt-2 border-t pt-3 flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-600">เครื่องมือผู้ดูแลระบบ:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking && (
                        <button
                          onClick={() => setShowAddUtilityModal(true)}
                          className="px-2.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow"
                        >
                          <Zap className="w-3.5 h-3.5" /> จดไฟหน่วยเพิ่ม
                        </button>
                      )}
                      
                      <button
                        onClick={handleMarkAbsent}
                        className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow"
                      >
                        <X className="w-3.5 h-3.5" /> แจ้งลาหยุด (ลา)
                      </button>
                    </div>
                  </div>

                </div>

                {/* Modal Footer Controls */}
                <div className="bg-gray-50 border-t px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                  {selectedBooking ? (
                    <button
                      onClick={handleDeleteBooking}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <Trash2 className="w-4 h-4" /> ยกเลิกการจอง
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveBooking('ค้างชำระ')}
                      className="px-3 py-2 bg-[#8B5A2B] hover:bg-[#6D4C41] text-white rounded font-bold text-xs shadow"
                    >
                      บันทึก (ค้างจ่าย)
                    </button>
                    <button
                      onClick={() => handleSaveBooking('ชำระแล้ว')}
                      className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded font-bold text-xs flex items-center gap-1 shadow"
                    >
                      <CreditCard className="w-4 h-4" /> บันทึกการจ่ายเงิน
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Electricity Register Modal */}
      {showAddUtilityModal && selectedBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border-2 border-yellow-600 overflow-hidden animate-pop-in">
            <div className="bg-yellow-600 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><Zap className="w-5 h-5" /> เพิ่มค่าใช้จ่ายสาธารณูปโภค (ค่าไฟ)</h3>
              <button onClick={() => setShowAddUtilityModal(false)} className="text-yellow-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">หน่วยไฟเพิ่มเติม</label>
                  <input
                    type="number"
                    value={addUtilityUnit}
                    onChange={(e) => {
                      const u = parseNumber(e.target.value);
                      setAddUtilityUnit(u);
                      setAddUtilityPrice(u * 20); // standard rate 20baht/unit
                    }}
                    className="p-2 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">ค่าไฟ (บาท)</label>
                  <input
                    type="number"
                    value={addUtilityPrice}
                    onChange={(e) => setAddUtilityPrice(parseNumber(e.target.value))}
                    className="p-2 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">วิธีการรับชำระ</label>
                <select
                  value={addUtilityMethod}
                  onChange={(e) => setAddUtilityMethod(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เงินสด">เงินสด</option>
                </select>
              </div>
              <button
                onClick={handleAddUtility}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-bold text-xs shadow transition-all mt-2"
              >
                บันทึกหน่วยไฟและออกใบเสร็จ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📦 1. Storage Management Modal */}
      {showStorageMgmtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-amber-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-amber-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">📦 จัดการฝากของ (Storage Management)</h3>
              <button onClick={() => setShowStorageMgmtModal(false)} className="text-amber-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Form panel */}
              <form onSubmit={handleSaveStorage} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-amber-50/40 p-4 border border-amber-200 rounded-lg">
                <h4 className="font-bold text-xs text-[#8B4513] border-b pb-1">เพิ่ม/แก้ไข รายการฝากของ</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">เลขล็อค *</label>
                  <input 
                    type="text" 
                    value={storageForm.stall_name} 
                    onChange={(e) => setStorageForm({ ...storageForm, stall_name: e.target.value })}
                    placeholder="เช่น A01, B04"
                    className="p-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">ชื่อผู้ฝาก *</label>
                  <input 
                    type="text" 
                    value={storageForm.owner_name} 
                    onChange={(e) => setStorageForm({ ...storageForm, owner_name: e.target.value })}
                    placeholder="ชื่อจริง/ชื่อร้าน"
                    className="p-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    value={storageForm.phone} 
                    onChange={(e) => setStorageForm({ ...storageForm, phone: e.target.value })}
                    placeholder="08xxxxxxxx"
                    className="p-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่เริ่มฝาก</label>
                    <input 
                      type="date" 
                      value={storageForm.start_date} 
                      onChange={(e) => setStorageForm({ ...storageForm, start_date: e.target.value })}
                      className="p-1 border border-amber-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่สิ้นสุด</label>
                    <input 
                      type="date" 
                      value={storageForm.end_date} 
                      onChange={(e) => setStorageForm({ ...storageForm, end_date: e.target.value })}
                      className="p-1 border border-amber-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">สถานะ</label>
                  <select 
                    value={storageForm.status} 
                    onChange={(e) => setStorageForm({ ...storageForm, status: e.target.value })}
                    className="p-1.5 border border-amber-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value="Active">กำลังฝาก (Active)</option>
                    <option value="Inactive">นำของออกแล้ว (Inactive)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">หมายเหตุ</label>
                  <textarea 
                    value={storageForm.note} 
                    onChange={(e) => setStorageForm({ ...storageForm, note: e.target.value })}
                    rows="2"
                    placeholder="รายละเอียดสิ่งของฝาก..."
                    className="p-1.5 border border-amber-300 rounded text-xs bg-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button 
                    type="submit" 
                    className="flex-1 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition-all shadow"
                  >
                    บันทึกข้อมูล
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStorageForm({ id: '', stall_name: '', owner_name: '', phone: '', start_date: '', end_date: '', status: 'Active', note: '' })}
                    className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-all"
                  >
                    ล้างค่า
                  </button>
                </div>
              </form>

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>รายการฝากของทั้งหมด ({storageList.length} รายการ)</span>
                  {loadingStorage && <Loader2 className="w-4 h-4 text-amber-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-amber-50 text-amber-900 border-b font-bold">
                      <tr>
                        <th className="p-2">ล็อค</th>
                        <th className="p-2">ผู้ฝาก / เบอร์</th>
                        <th className="p-2">วันที่เริ่ม-สิ้นสุด</th>
                        <th className="p-2">สถานะ</th>
                        <th className="p-2 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {storageList.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/30">
                          <td className="p-2 font-bold text-[#8B4513]">{item.stall_name}</td>
                          <td className="p-2">
                            <div className="font-semibold">{item.owner_name}</div>
                            <div className="text-[10px] text-gray-500">{item.phone || '-'}</div>
                          </td>
                          <td className="p-2 text-[10px]">
                            <div>เริ่ม: {item.start_date || '-'}</div>
                            <div>สิ้นสุด: {item.end_date || '-'}</div>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.status === 'Active' ? 'ฝากอยู่' : 'นำออกแล้ว'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button 
                                onClick={() => setStorageForm(item)}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100"
                              >
                                แก้ไข
                              </button>
                              <button 
                                onClick={() => handleToggleStorageStatus(item)}
                                className={`px-2 py-0.5 border rounded text-[10px] font-bold ${
                                  item.status === 'Active' 
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                }`}
                              >
                                {item.status === 'Active' ? 'เช็คออก' : 'เช็คอิน'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗓️ 2. Monthly Bookings Management Modal */}
      {showMonthlyMgmtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-purple-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-purple-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">🗓️ จัดการลูกค้ารายเดือน (Monthly Bookings)</h3>
              <button onClick={() => setShowMonthlyMgmtModal(false)} className="text-purple-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Editor panel if selected */}
              {selectedMonthlyItem ? (
                <form onSubmit={handleUpdateMonthlyItem} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-purple-50/40 p-4 border border-purple-200 rounded-lg">
                  <h4 className="font-bold text-xs text-purple-900 border-b pb-1">แก้ไขข้อมูล: {selectedMonthlyItem.booker_name}</h4>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold">ล็อกที่เช่า</span>
                    <span className="text-xs font-bold text-gray-800 bg-white p-2 rounded border">{selectedMonthlyItem.stalls}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-500 font-bold">ค่าเช่าทั้งหมด</span>
                      <span className="text-xs font-bold text-gray-800 bg-white p-2 rounded border text-center">{selectedMonthlyItem.total_price}.-</span>
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

                  <div className="flex gap-2 mt-1">
                    <button 
                      type="submit" 
                      className="flex-1 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold transition-all shadow"
                    >
                      อัปเดตข้อมูล
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedMonthlyItem(null)}
                      className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              ) : (
                <div className="w-full md:w-80 shrink-0 bg-purple-50/20 p-4 border border-purple-200/60 rounded-lg flex items-center justify-center text-center text-xs text-gray-500 font-bold">
                  คลิกปุ่ม "แก้ไข" ท้ายรายชื่อ เพื่อเริ่มปรับแก้ข้อมูลสมาชิกรายเดือน
                </div>
              )}

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>รายชื่อลูกค้ารายเดือน ({monthlyList.length} คน)</span>
                  {loadingMonthly && <Loader2 className="w-4 h-4 text-purple-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-50 text-purple-900 border-b font-bold">
                      <tr>
                        <th className="p-2">ลูกค้า / เบอร์</th>
                        <th className="p-2">ล็อค</th>
                        <th className="p-2 text-center">ค่าเช่า / ยอดจ่าย</th>
                        <th className="p-2">ชำระเงิน</th>
                        <th className="p-2">ต่อสัญญา</th>
                        <th className="p-2 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {monthlyList.map((item) => (
                        <tr key={item.id} className="hover:bg-purple-50/20">
                          <td className="p-2">
                            <div className="font-bold text-gray-800">{item.booker_name}</div>
                            <div className="text-[10px] text-gray-500">{item.phone || '-'}</div>
                          </td>
                          <td className="p-2 font-bold text-purple-800">{item.stalls}</td>
                          <td className="p-2 text-center font-semibold">
                            <div>{item.total_price}.-</div>
                            <div className="text-[10px] text-green-700">จ่าย: {item.paid_amount || 0}.-</div>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'ชำระแล้ว' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status || 'ค้างชำระ'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.renewal_status === 'ต่อสัญญาแล้ว' 
                                ? 'bg-purple-100 text-purple-800' 
                                : item.renewal_status === 'ไม่ต่อสัญญา'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.renewal_status || 'รอยืนยัน'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              onClick={() => setSelectedMonthlyItem(item)}
                              className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold hover:bg-purple-100"
                            >
                              แก้ไข
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💸 3. Finance Management Modal */}
      {showFinanceMgmtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-emerald-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">💸 บันทึกรายรับ/รายจ่ายตลาด (Other Income & Expenses)</h3>
              <button onClick={() => setShowFinanceMgmtModal(false)} className="text-emerald-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex border-b bg-emerald-50/40 shrink-0">
              <button 
                onClick={() => setFinanceTab('income')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
                  financeTab === 'income' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                📥 บันทึกรายได้อื่นๆ (Other Income)
              </button>
              <button 
                onClick={() => setFinanceTab('expense')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
                  financeTab === 'expense' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                📤 บันทึกรายจ่าย (Expenses)
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Form panel based on tab */}
              {financeTab === 'income' ? (
                <form onSubmit={handleAddIncome} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-emerald-50/20 p-4 border border-emerald-200 rounded-lg">
                  <h4 className="font-bold text-xs text-emerald-950 border-b pb-1">เพิ่มรายการรายได้อื่น ๆ</h4>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่ทำรายการ</label>
                    <input 
                      type="date" 
                      value={incomeForm.date} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                      className="p-1.5 border border-emerald-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">หมวดหมู่รายได้</label>
                    <select 
                      value={incomeForm.category} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                      className="p-1.5 border border-emerald-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="ค่าปรับ">ค่าปรับ</option>
                      <option value="ดอกเบี้ย">ดอกเบี้ย</option>
                      <option value="รายได้ฝากของ">รายได้ฝากของ</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">รายละเอียด *</label>
                    <input 
                      type="text" 
                      value={incomeForm.description} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                      placeholder="เช่น ค่าปรับขยะล็อค F1"
                      className="p-1.5 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">จำนวนเงิน (บาท) *</label>
                    <input 
                      type="number" 
                      value={incomeForm.amount} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="จำนวนเงินเป็นตัวเลข"
                      className="p-1.5 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white text-center" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วิธีการชำระ</label>
                    <select 
                      value={incomeForm.method} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, method: e.target.value })}
                      className="p-1.5 border border-emerald-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="โอนเงิน">โอนเงิน</option>
                      <option value="เงินสด">เงินสด</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-all shadow"
                  >
                    บันทึกรายรับ
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddExpense} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-red-50/30 p-4 border border-red-200 rounded-lg">
                  <h4 className="font-bold text-xs text-red-950 border-b pb-1">เพิ่มรายการรายจ่าย</h4>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่ทำรายการ</label>
                    <input 
                      type="date" 
                      value={expenseForm.date} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="p-1.5 border border-red-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">หมวดหมู่รายจ่าย</label>
                    <select 
                      value={expenseForm.category} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="p-1.5 border border-red-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="ค่าน้ำค่าไฟ">ค่าน้ำค่าไฟ</option>
                      <option value="ค่าจ้าง">ค่าจ้างพนักงาน</option>
                      <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
                      <option value="ค่าขยะ">ค่ากำจัดขยะ</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">รายการรายจ่าย *</label>
                    <input 
                      type="text" 
                      value={expenseForm.item} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                      placeholder="เช่น ซื้อหลอดไฟทางเดิน"
                      className="p-1.5 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 bg-white" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">จำนวนเงิน (บาท) *</label>
                    <input 
                      type="number" 
                      value={expenseForm.amount} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="จำนวนเงินจ่าย"
                      className="p-1.5 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 bg-white text-center" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วิธีการจ่ายเงิน</label>
                    <select 
                      value={expenseForm.method} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, method: e.target.value })}
                      className="p-1.5 border border-red-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="โอนเงิน">โอนเงิน</option>
                      <option value="เงินสด">เงินสด</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full mt-2 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition-all shadow"
                  >
                    บันทึกรายจ่าย
                  </button>
                </form>
              )}

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>รายการบันทึก {financeTab === 'income' ? 'รายรับอื่นๆ' : 'รายจ่าย'} ล่าสุด</span>
                  {loadingFinance && <Loader2 className="w-4 h-4 text-emerald-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className={`border-b font-bold ${financeTab === 'income' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                      <tr>
                        <th className="p-2">วันที่</th>
                        <th className="p-2">หมวดหมู่</th>
                        <th className="p-2">รายละเอียด/รายการ</th>
                        <th className="p-2 text-right">จำนวนเงิน</th>
                        <th className="p-2 text-center">วิธีจ่าย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {financeTab === 'income' ? (
                        incomeList.map((item) => (
                          <tr key={item.id} className="hover:bg-emerald-50/10">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2 font-bold text-emerald-800">{item.category}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-right font-extrabold text-emerald-800">+{item.amount.toLocaleString()}.-</td>
                            <td className="p-2 text-center text-[10px] font-semibold text-gray-500">{item.method}</td>
                          </tr>
                        ))
                      ) : (
                        expenseList.map((item) => (
                          <tr key={item.id} className="hover:bg-red-50/10">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2 font-bold text-red-800">{item.category}</td>
                            <td className="p-2">{item.item}</td>
                            <td className="p-2 text-right font-extrabold text-red-800">-{item.amount.toLocaleString()}.-</td>
                            <td className="p-2 text-center text-[10px] font-semibold text-gray-500">{item.method}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ 4. Settings Management Modal */}
      {showSettingsMgmtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-stone-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-stone-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">⚙️ จัดการสิทธิ์แอดมิน (Admin Roles Settings)</h3>
              <button onClick={() => setShowSettingsMgmtModal(false)} className="text-stone-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Form panel */}
              <form onSubmit={handleSaveAdminRole} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-stone-50 p-4 border border-stone-200 rounded-lg">
                <h4 className="font-bold text-xs text-stone-900 border-b pb-1">เพิ่ม/แก้ไข สิทธิ์แอดมิน</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">อีเมลล็อกอิน (Google Email) *</label>
                  <input 
                    type="email" 
                    value={adminForm.email} 
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="example@gmail.com"
                    className="p-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-500 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">ชื่อแอดมิน/ชื่อเล่น *</label>
                  <input 
                    type="text" 
                    value={adminForm.name} 
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="แอดมินกิ๊ก, แอดมินส้ม"
                    className="p-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-500 bg-white" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">บทบาท</label>
                    <select 
                      value={adminForm.role} 
                      onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                      className="p-1.5 border border-stone-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="Admin">แอดมินใหญ่ (Admin)</option>
                      <option value="Staff">พนักงาน (Staff)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">รหัสพนักงาน</label>
                    <input 
                      type="text" 
                      value={adminForm.employee_id} 
                      onChange={(e) => setAdminForm({ ...adminForm, employee_id: e.target.value })}
                      placeholder="EMP01"
                      className="p-1 border border-stone-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">สถานะเปิดใช้งาน</label>
                  <select 
                    value={adminForm.status} 
                    onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                    className="p-1.5 border border-stone-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value="เปิด">เปิดใช้งานปกติ (เปิด)</option>
                    <option value="ปิด">ระงับสิทธิ์ชั่วคราว (ปิด)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-2 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded text-xs font-bold transition-all shadow"
                >
                  บันทึกข้อมูลและสิทธิ์
                </button>
              </form>

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>ผู้มีสิทธิ์เข้าระบบทั้งหมด ({adminRolesList.length} บัญชี)</span>
                  {loadingSettings && <Loader2 className="w-4 h-4 text-stone-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-900 border-b font-bold">
                      <tr>
                        <th className="p-2">รหัสพนักงาน</th>
                        <th className="p-2">ชื่อผู้ใช้</th>
                        <th className="p-2">อีเมลล็อกอิน</th>
                        <th className="p-2">บทบาท</th>
                        <th className="p-2">สถานะ</th>
                        <th className="p-2 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {adminRolesList.map((item) => (
                        <tr key={item.email} className="hover:bg-stone-50/30">
                          <td className="p-2 font-mono font-bold text-gray-600">{item.employee_id || '-'}</td>
                          <td className="p-2 font-bold text-stone-900">{item.name}</td>
                          <td className="p-2 font-semibold text-gray-500">{item.email}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.role === 'Admin' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                              {item.role === 'Admin' ? 'ผู้ดูแลหลัก' : 'พนักงาน'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'เปิด' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status === 'เปิด' ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              onClick={() => setAdminForm(item)}
                              className="px-2 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-[10px] font-bold hover:bg-stone-200"
                            >
                              แก้ไข
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
