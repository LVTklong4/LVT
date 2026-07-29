'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { monthNamesFull, getBookingMonthStr, formatBookingMonth } from '@/utils/thaiDateHelper';

const MonthlyBookingContext = createContext();

export function MonthlyBookingProvider({ children }) {
  // Monthly States
  const [monthlyList, setMonthlyList] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyMonthFilter, setMonthlyMonthFilter] = useState('ทั้งหมด');
  const [monthlySearchQuery, setMonthlySearchQuery] = useState('');
  const [monthlySortField, setMonthlySortField] = useState('stall_name');
  const [monthlySortOrder, setMonthlySortOrder] = useState('asc');

  // Modal Visibility States
  const [showMonthlyMgmtModal, setShowMonthlyMgmtModal] = useState(false);
  const [showNewMonthlyModal, setShowNewMonthlyModal] = useState(false);
  const [showBulkRenewModal, setShowBulkRenewModal] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);
  const [showMonthlyPaymentModal, setShowMonthlyPaymentModal] = useState(false);
  const [showMonthlyPrintModal, setShowMonthlyPrintModal] = useState(false);
  const [showPreRenewalModal, setShowPreRenewalModal] = useState(false);
  const [selectedMonthlyItem, setSelectedMonthlyItem] = useState(null);

  useEffect(() => {
    let isMounted = true;
    supabase
      .from('monthly_bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (isMounted && !error) {
          setMonthlyList(data || []);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Filtered & sorted monthly list
  const filteredMonthlyList = useMemo(() => {
    let list = monthlyList || [];

    if (monthlyMonthFilter && monthlyMonthFilter !== 'ทั้งหมด') {
      list = list.filter(item => {
        if (!item.booking_month) return false;
        const formattedItemMonth = formatBookingMonth(item.booking_month);
        return formattedItemMonth === monthlyMonthFilter;
      });
    }

    if (monthlySearchQuery.trim()) {
      const q = monthlySearchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.booker_name && item.booker_name.toLowerCase().includes(q)) ||
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
  }, [monthlyList, monthlyMonthFilter, monthlySearchQuery, monthlySortField, monthlySortOrder]);

  return (
    <MonthlyBookingContext.Provider value={{
      monthlyList,
      setMonthlyList,
      loadingMonthly,
      fetchMonthlyBookings,
      monthlyMonthFilter,
      setMonthlyMonthFilter,
      monthlySearchQuery,
      setMonthlySearchQuery,
      monthlySortField,
      setMonthlySortField,
      monthlySortOrder,
      setMonthlySortOrder,
      filteredMonthlyList,
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
      selectedMonthlyItem,
      setSelectedMonthlyItem
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
