'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  dayNamesShort,
  monthNamesFull,
  getModalDateFormat
} from '@/utils/thaiDateHelper';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  // Authentication & Admin context from local storage / session
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }

    // Listen to storage changes to sync login status
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('adminUser');
      setAdminUser(updatedUser ? JSON.parse(updatedUser) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // UI state
  const [showStorageMgmtModal, setShowStorageMgmtModal] = useState(false);
  const [showStoragePrintModal, setShowStoragePrintModal] = useState(false);
  const [isStorageCheckout, setIsStorageCheckout] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Storage Data state
  const [storageList, setStorageList] = useState([]);
  const [storageMap, setStorageMap] = useState({});

  // Receipt Printing State
  const [storagePrintItem, setStoragePrintItem] = useState(null);
  const [storagePrintStartDate, setStoragePrintStartDate] = useState('');
  const [storagePrintEndDate, setStoragePrintEndDate] = useState('');
  const [storagePrintOwner, setStoragePrintOwner] = useState('');
  const [storagePrintStall, setStoragePrintStall] = useState('');
  const [storagePrintNote, setStoragePrintNote] = useState('');
  const [storagePrintFee, setStoragePrintFee] = useState(0);
  const [storagePrintPayment, setStoragePrintPayment] = useState('à¹à¸à¸´à¸à¸ªà¸');

  // Form states for the check-in modal
  const [storageForm, setStorageForm] = useState({
    id: '',
    stall_name: '',
    owner_name: '',
    phone: '',
    start_date: new Date().toISOString().split('T')[0],
    weeks: 1,
    payImmediately: true,
    paymentMethod: 'à¹à¸à¸´à¸à¸ªà¸',
    note: '',
    status: 'Active'
  });

  const parseNumber = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const formatPrice = (val) => {
    const num = parseNumber(val);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchAllStorage = async () => {
    setLoadingStorage(true);
    try {
      const { data, error } = await supabase
        .from('storage')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setStorageList(data || []);

      // Build active storage map by stall name
      const activeMap = {};
      data?.forEach(item => {
        if (item.status === 'Active' && item.stall_name) {
          activeMap[item.stall_name] = item;
        }
      });
      setStorageMap(activeMap);
    } catch (e) {
      console.error("Error fetching storage:", e);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    fetchAllStorage();
  }, []);

  // Show alerts helper (matching layout style)
  const showAlert = (message, title = "à¹à¸à¹à¸à¹à¸à¸·à¸­à¸", isError = false) => {
    if (typeof window !== 'undefined') {
      alert(`${title}
${message}`);
    }
  };

  // 1. Save new storage deposit (à¹à¸à¹à¸à¸à¸²à¸à¸à¸­à¸)
  const handleSaveStorage = async (payloadData) => {
    if (!adminUser) {
      showAlert("à¸à¸£à¸¸à¸à¸²à¹à¸à¹à¸²à¸ªà¸¹à¹à¸£à¸°à¸à¸à¸à¹à¸­à¸à¸à¸³à¸£à¸²à¸¢à¸à¸²à¸£", "à¹à¸à¹à¸à¹à¸à¸·à¸­à¸", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const id = payloadData.id || `ST-${Date.now()}`;
      const weeks = parseNumber(payloadData.weeks || 1);
      
      // Calculate end date based on weeks (weeks * 7 days)
      const start = new Date(payloadData.start_date);
      const end = new Date(start);
      end.setDate(start.getDate() + (weeks * 7));
      const calculatedEndDate = end.toISOString().split('T')[0];
      const fee = weeks * 160; // 160 Baht per week

      const payload = {
        id,
        stall_name: payloadData.stall_name.trim(),
        owner_name: payloadData.owner_name.trim(),
        phone: payloadData.phone.trim(),
        start_date: payloadData.start_date,
        end_date: calculatedEndDate,
        status: payloadData.status || 'Active',
        note: payloadData.note || '',
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase.from('storage').upsert(payload);
      if (error) throw error;

      // If user chose to pay upfront
      if (payloadData.payImmediately) {
        const txnId = `TXN-${Date.now()}`;
        const txnData = {
          id: txnId,
          booking_ref: id,
          date: payloadData.start_date,
          category: 'à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸',
          total_amount: fee,
          method: payloadData.paymentMethod || 'à¹à¸à¸´à¸à¸ªà¸',
          note: `à¸à¸³à¸£à¸°à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸à¸ªà¸°à¸ªà¸¡ à¸¥à¹à¸­à¸ ${payload.stall_name} (${weeks} à¸ªà¸±à¸à¸à¸²à¸«à¹)`,
          officer: adminUser.name,
          timestamp: new Date().toISOString(),
          stall_amt: 0,
          elec_amt: 0,
          storage_amt: fee,
          bill_type: 'Storage'
        };

        const { error: txnError } = await supabase.from('transactions').insert(txnData);
        if (txnError) throw txnError;

        // Auto print receipt
        setStoragePrintItem(payload);
        setStoragePrintStartDate(payload.start_date);
        setStoragePrintEndDate(payload.end_date);
        setStoragePrintOwner(payload.owner_name);
        setStoragePrintStall(payload.stall_name);
        setStoragePrintNote(payload.note);
        setStoragePrintFee(fee);
        setStoragePrintPayment(payloadData.paymentMethod || 'à¹à¸à¸´à¸à¸ªà¸');
        setShowStoragePrintModal(true);
      }

      showAlert("à¸à¸±à¸à¸à¸¶à¸à¸à¹à¸­à¸¡à¸¹à¸¥à¸à¸²à¸à¸à¸­à¸à¸ªà¸³à¹à¸£à¹à¸", "à¸ªà¸³à¹à¸£à¹à¸");
      fetchAllStorage();
    } catch (e) {
      console.error(e);
      showAlert("à¹à¸à¸´à¸à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸à¹à¸à¸à¸²à¸£à¸à¸±à¸à¸à¸¶à¸: " + e.message, "à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // 2. Extend / Renew Storage (à¸à¹à¸­à¸­à¸²à¸¢à¸¸)
  const handleRenewStorage = async ({ item, weeksCount, paymentMethod }) => {
    if (!adminUser) {
      showAlert("à¸à¸£à¸¸à¸à¸²à¹à¸à¹à¸²à¸ªà¸¹à¹à¸£à¸°à¸à¸à¸à¹à¸­à¸à¸à¸³à¸£à¸²à¸¢à¸à¸²à¸£", "à¹à¸à¹à¸à¹à¸à¸·à¸­à¸", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const weeks = parseNumber(weeksCount);
      const fee = weeks * 160;

      // New start date is the old end date
      const oldEndDate = item.end_date || new Date().toISOString().split('T')[0];
      const start = new Date(oldEndDate);
      const end = new Date(start);
      end.setDate(start.getDate() + (weeks * 7));
      const calculatedEndDate = end.toISOString().split('T')[0];

      // Update storage record
      const { error: updateErr } = await supabase
        .from('storage')
        .update({
          end_date: calculatedEndDate,
          timestamp: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateErr) throw updateErr;

      // Log transaction
      const txnId = `TXN-${Date.now()}`;
      const txnData = {
        id: txnId,
        booking_ref: item.id,
        date: oldEndDate,
        category: 'à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸',
        total_amount: fee,
        method: paymentMethod || 'à¹à¸à¸´à¸à¸ªà¸',
        note: `à¸à¸³à¸£à¸°à¸à¹à¸²à¸à¹à¸­à¸­à¸²à¸¢à¸¸à¸à¸²à¸à¸à¸­à¸ à¸¥à¹à¸­à¸ ${item.stall_name} (+${weeks} à¸ªà¸±à¸à¸à¸²à¸«à¹)`,
        officer: adminUser.name,
        timestamp: new Date().toISOString(),
        stall_amt: 0,
        elec_amt: 0,
        storage_amt: fee,
        bill_type: 'Storage'
      };

      const { error: txnError } = await supabase.from('transactions').insert(txnData);
      if (txnError) throw txnError;

      // Print ticket
      setStoragePrintItem(item);
      setStoragePrintStartDate(oldEndDate);
      setStoragePrintEndDate(calculatedEndDate);
      setStoragePrintOwner(item.owner_name);
      setStoragePrintStall(item.stall_name);
      setStoragePrintNote(item.note || '-');
      setStoragePrintFee(fee);
      setStoragePrintPayment(paymentMethod || 'à¹à¸à¸´à¸à¸ªà¸');
      setShowStoragePrintModal(true);

      showAlert("à¸à¹à¸­à¸­à¸²à¸¢à¸¸à¸à¸²à¸£à¸à¸²à¸à¸à¸­à¸à¸ªà¸³à¹à¸£à¹à¸", "à¸ªà¸³à¹à¸£à¹à¸");
      fetchAllStorage();
    } catch (e) {
      console.error(e);
      showAlert("à¹à¸à¸´à¸à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸à¹à¸à¸à¸²à¸£à¸à¹à¸­à¸­à¸²à¸¢à¸¸: " + e.message, "à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // 3. Checkout Storage (à¹à¸à¹à¸à¸­à¸­à¸)
  const handleCheckoutStorage = async ({ id, endDate, fee, paymentMethod, note }) => {
    if (!adminUser) {
      showAlert("à¸à¸£à¸¸à¸à¸²à¹à¸à¹à¸²à¸ªà¸¹à¹à¸£à¸°à¸à¸à¸à¹à¸­à¸à¸à¸³à¸£à¸²à¸¢à¸à¸²à¸£", "à¹à¸à¹à¸à¹à¸à¸·à¸­à¸", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const { error: storageError } = await supabase
        .from('storage')
        .update({
          status: 'Completed',
          end_date: endDate || new Date().toISOString().split('T')[0],
          note: note || ''
        })
        .eq('id', id);

      if (storageError) throw storageError;

      // If fee > 0, log final payment transaction
      const feeNum = parseNumber(fee);
      if (feeNum > 0) {
        const txnId = `TXN-${Date.now()}`;
        const stallName = storagePrintItem?.stall_name || '';
        const txnData = {
          id: txnId,
          booking_ref: id,
          date: endDate || new Date().toISOString().split('T')[0],
          category: 'à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸',
          total_amount: feeNum,
          method: paymentMethod || 'à¹à¸à¸´à¸à¸ªà¸',
          note: `à¸à¸³à¸£à¸°à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸à¸ªà¸°à¸ªà¸¡à¸à¸­à¸à¹à¸à¹à¸à¸­à¸­à¸ à¸¥à¹à¸­à¸ ${stallName}`,
          officer: adminUser.name,
          timestamp: new Date().toISOString(),
          stall_amt: 0,
          elec_amt: 0,
          storage_amt: feeNum,
          bill_type: 'Storage'
        };

        const { error: txnError } = await supabase.from('transactions').insert(txnData);
        if (txnError) throw txnError;
      }

      showAlert("à¸à¸±à¸à¸à¸¶à¸à¸à¸²à¸£à¸à¸³à¸£à¸°à¹à¸à¸´à¸à¹à¸¥à¸°à¸ªà¸´à¹à¸à¸ªà¸¸à¸à¸à¸²à¸£à¸à¸²à¸à¹à¸£à¸µà¸¢à¸à¸£à¹à¸­à¸¢", "à¸ªà¸³à¹à¸£à¹à¸");
      setShowStoragePrintModal(false);
      fetchAllStorage();
    } catch (e) {
      console.error("Storage checkout error:", e);
      showAlert("à¹à¸à¸´à¸à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸à¹à¸à¸à¸²à¸£à¹à¸à¹à¸à¹à¸­à¸²à¸à¹: " + e.message, "à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // 4. Checkin Revert / Toggle status with 24h Lock Policy
  const handleToggleStorageStatus = async (item) => {
    if (!adminUser) {
      showAlert("à¸à¸£à¸¸à¸à¸²à¹à¸à¹à¸²à¸ªà¸¹à¹à¸£à¸°à¸à¸à¸à¹à¸­à¸à¸à¸³à¸£à¸²à¸¢à¸à¸²à¸£", "à¹à¸à¹à¸à¹à¸à¸·à¸­à¸", true);
      return;
    }

    if (item.status !== 'Active') {
      setLoadingStorage(true);
      try {
        const { data: txns, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('booking_ref', item.id)
          .eq('category', 'à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸')
          .order('timestamp', { ascending: false });

        if (txError) throw txError;

        const latestTx = txns?.[0];
        if (latestTx) {
          const txTime = new Date(latestTx.timestamp);
          const now = new Date();
          const hoursDiff = (now - txTime) / (1000 * 60 * 60);

          if (hoursDiff > 24) {
            showAlert(
              `à¸à¸­à¸­à¸ à¸±à¸¢! à¸£à¸²à¸¢à¸à¸²à¸£à¸à¸³à¸£à¸°à¹à¸à¸´à¸à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸à¸à¸µà¹à¸à¸³à¸£à¸²à¸¢à¸à¸²à¸£à¹à¸à¸´à¸ 24 à¸à¸±à¹à¸§à¹à¸¡à¸à¹à¸¥à¹à¸§ (${hoursDiff.toFixed(1)} à¸à¸¡.)
` +
              `à¹à¸à¸·à¹à¸­à¸à¸§à¸²à¸¡à¸à¸¥à¸­à¸à¸ à¸±à¸¢à¸à¸²à¸à¸à¸±à¸à¸à¸µ à¹à¸¡à¹à¸ªà¸²à¸¡à¸²à¸£à¸à¸¢à¸à¹à¸¥à¸´à¸à¹à¸à¹à¸à¸­à¸­à¸à¸«à¸£à¸·à¸­à¸à¸·à¸à¹à¸à¸´à¸à¹à¸à¹`,
              "à¸£à¸°à¸à¸±à¸à¸à¸²à¸£à¸à¸³à¹à¸à¸´à¸à¸à¸²à¸£",
              true
            );
            return;
          }

          // Delete checkout transaction if within 24h
          const { error: delErr } = await supabase
            .from('transactions')
            .delete()
            .eq('id', latestTx.id);

          if (delErr) throw delErr;
        }

        // Update storage status back to Active
        const { error: updErr } = await supabase
          .from('storage')
          .update({
            status: 'Active',
            end_date: null
          })
          .eq('id', item.id);

        if (updErr) throw updErr;

        showAlert("à¸¢à¸à¹à¸¥à¸´à¸à¸à¸²à¸£à¹à¸à¹à¸à¹à¸­à¸²à¸à¹à¹à¸¥à¸°à¸à¸·à¸à¸ªà¸à¸²à¸à¸°à¸à¸¥à¹à¸­à¸à¸à¸²à¸à¸à¸­à¸à¹à¸à¹à¸à¸à¸à¸à¸´à¹à¸£à¸µà¸¢à¸à¸£à¹à¸­à¸¢", "à¸ªà¸³à¹à¸£à¹à¸");
        fetchAllStorage();
      } catch (e) {
        console.error(e);
        showAlert("à¹à¸à¸´à¸à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸à¹à¸à¸à¸²à¸£à¸à¸¶à¸à¸ªà¸à¸²à¸à¸°à¸à¸·à¸: " + e.message, "à¸à¹à¸­à¸à¸´à¸à¸à¸¥à¸²à¸", true);
      } finally {
        setLoadingStorage(false);
      }
    }
  };

  // 5. Print Ticket window
  const handlePrintStorageReceipt = () => {
    if (!storagePrintItem) return;

    const now = new Date();
    const formattedTransaction = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

    const empCode = adminUser?.employee_id || adminUser?.name || 'lvt-admin';

    const formatDateWithDay = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const dayName = dayNamesShort[d.getDay()] || '';
      return `${dayName} ${d.getDate()} ${monthNamesFull[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    const startFormatted = formatDateWithDay(storagePrintStartDate);
    const endFormatted = formatDateWithDay(storagePrintEndDate);
    const feeVal = parseNumber(storagePrintFee);
    const paymentText = storagePrintPayment === 'à¹à¸­à¸à¹à¸à¸´à¸' ? 'à¹à¸­à¸à¸à¹à¸²à¸¢' : 'à¹à¸à¸´à¸à¸ªà¸';

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert('à¸à¸£à¸¸à¸à¸²à¸­à¸à¸¸à¸à¸²à¸à¹à¸«à¹à¸à¹à¸­à¸à¸­à¸±à¸à¸à¸³à¸à¸²à¸à¹à¸à¸·à¹à¸­à¸ªà¸±à¹à¸à¸à¸´à¸¡à¸à¹à¸à¸±à¹à¸§');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>à¸à¸´à¸¡à¸à¹à¸à¸±à¹à¸§à¸à¸²à¸à¸à¸­à¸</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              width: 72mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              background: #fff;
              color: #000;
              font-size: 11pt;
              line-height: 1.4;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .logo {
              width: 32mm;
              height: auto;
              margin: 0 auto 2mm auto;
              display: block;
            }
            .divider {
              border-top: 1.5px dashed #000;
              margin: 3mm 0;
            }
            .title {
              font-size: 13pt;
              font-weight: 800;
              margin: 2mm 0 1mm 0;
            }
            .subtitle {
              font-size: 9.5pt;
              font-weight: bold;
              color: #000;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .info-table td {
              padding: 1.2mm 0;
              vertical-align: top;
              font-size: 10.5pt;
            }
            .info-table td.label {
              width: 40%;
              white-space: nowrap;
            }
            .info-table td.val {
              text-align: right;
              font-weight: bold;
            }
            .total-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .total-table td {
              padding: 1.5mm 0;
            }
            .total-table td.label {
              text-align: right;
              font-size: 11pt;
              font-weight: bold;
              padding-right: 2mm;
            }
            .total-table td.val {
              text-align: right;
              font-size: 13pt;
              font-weight: 800;
            }
            .terms {
              font-size: 8.5pt;
              line-height: 1.35;
              text-align: left;
              margin: 3mm 0;
            }
            .terms-title {
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .terms ol {
              margin: 0;
              padding-left: 4.5mm;
            }
            .terms li {
              margin-bottom: 1mm;
            }
            .footer {
              margin-top: 4mm;
              font-size: 9.5pt;
              text-align: center;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <img class="logo" src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" />
            <div class="title">à¸à¸¥à¸²à¸à¸à¸±à¸à¸¥à¸²à¸à¸ªà¸§à¸²à¸¢à¸§à¸´à¸à¹à¸à¸</div>
            <div class="subtitle">à¹à¸¥à¸à¸à¸µà¹ 52/34 à¸«à¸¡à¸¹à¹ 5</div>
            <div class="subtitle">à¸.à¸¥à¸²à¸à¸ªà¸§à¸²à¸¢ à¸­.à¸¥à¸³à¸¥à¸¹à¸à¸à¸² à¸.à¸à¸à¸¸à¸¡à¸à¸²à¸à¸µ 12150</div>
            <div class="subtitle">à¹à¸à¸£: 0-92-869-7774 , 0-92-869-7775</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center bold" style="font-size: 12pt; margin-bottom: 2mm;">à¸à¸±à¹à¸§/à¹à¸à¹à¸ªà¸£à¹à¸ (à¸à¸²à¸à¸à¸­à¸)</div>
          
          <table class="info-table">
            <tr>
              <td class="label">à¸§à¸±à¸à¸à¸µà¹à¸à¸³à¸£à¸²à¸¢à¸à¸²à¸£ :</td>
              <td style="text-align: right;">${formattedTransaction}</td>
            </tr>
            <tr>
              <td class="label">à¸£à¸«à¸±à¸ªà¸à¸à¸±à¸à¸à¸²à¸ :</td>
              <td style="text-align: right; font-family: monospace; font-size: 9pt;">${empCode}</td>
            </tr>
            <tr>
              <td class="label">à¸§à¸±à¸à¸à¸µà¹à¹à¸£à¸´à¹à¸¡ :</td>
              <td style="text-align: right;" class="bold">${startFormatted}</td>
            </tr>
            <tr>
              <td class="label">à¸§à¸±à¸à¸à¸µà¹à¸ªà¸´à¹à¸à¸ªà¸¸à¸ :</td>
              <td style="text-align: right;" class="bold">${endFormatted}</td>
            </tr>
            <tr>
              <td class="label">à¸à¸·à¹à¸­à¸à¸¹à¹à¸à¸²à¸ :</td>
              <td style="text-align: right;" class="bold">${storagePrintOwner}</td>
            </tr>
            <tr>
              <td class="label">à¸§à¸²à¸à¸à¸­à¸à¹à¸§à¹à¸¥à¹à¸­à¸ :</td>
              <td style="text-align: right;" class="bold">[${storagePrintStall}]</td>
            </tr>
            <tr>
              <td class="label">à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸ :</td>
              <td style="text-align: right;" class="bold">${formatPrice(feeVal)}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="info-table">
            <tr>
              <td class="label" style="width: 30%;">à¸£à¸²à¸¢à¸à¸²à¸£à¸à¸µà¹à¸à¸²à¸ :</td>
              <td style="text-align: left;" class="bold">${storagePrintNote || '-'}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="total-table">
            <tr>
              <td class="label">à¸£à¸§à¸¡à¹à¸à¹à¸à¹à¸à¸´à¸à¸à¸±à¹à¸à¸ªà¸´à¹à¸ :</td>
              <td class="val">${formatPrice(feeVal)}</td>
            </tr>
            <tr>
              <td class="label">à¸à¸²à¸£à¸à¸³à¸£à¸°à¹à¸à¸´à¸ [${paymentText}] :</td>
              <td class="val">${formatPrice(feeVal)}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="terms">
            <div class="terms-title">à¸£à¸²à¸¢à¸¥à¸°à¹à¸­à¸µà¸¢à¸à¹à¸¥à¸°à¹à¸à¸·à¹à¸­à¸à¹à¸à¸à¸²à¸£à¸à¸²à¸à¸à¸­à¸à¸¡à¸µà¸à¸±à¸à¸à¹à¸­à¹à¸à¸à¸µà¹</div>
            <ol>
              <li>à¸à¸²à¸£à¸à¸²à¸à¸à¸­à¸à¹à¸à¸à¸µà¹à¸à¸µà¹à¸«à¸¡à¸²à¸¢à¸à¸¶à¸ à¸à¸²à¸£à¹à¸à¹à¸²à¸à¸·à¹à¸à¸à¸µà¹à¸§à¸²à¸à¸à¸­à¸à¹à¸à¹à¸²à¸à¸±à¹à¸</li>
              <li>à¸à¸²à¸à¸à¸¥à¸²à¸à¸¯ à¹à¸¡à¹à¸£à¸±à¸à¸à¸´à¸à¸à¸­à¸à¸à¸§à¸²à¸¡à¹à¸ªà¸µà¸¢à¸«à¸²à¸¢ à¸ªà¸¹à¸à¸«à¸²à¸¢à¸à¸µà¹à¹à¸à¸´à¸à¸à¸¶à¹à¸à¸à¸¸à¸à¸à¸£à¸à¸µ</li>
              <li>à¹à¸à¸§à¸±à¸à¸à¸µà¹à¸¡à¸µà¸à¸±à¸ à¸«à¸²à¸à¸¥à¸¹à¸à¸à¹à¸²à¹à¸¡à¹à¸¡à¸²à¸à¸³à¸à¸²à¸£à¸à¹à¸² à¸à¸²à¸à¸à¸¥à¸²à¸à¸¡à¸µà¸ªà¸´à¸à¸à¸´à¹à¹à¸à¸à¸²à¸£à¸¢à¹à¸²à¸¢à¸à¸­à¸à¹à¸à¹à¸§à¹à¸à¸µà¹à¸­à¸·à¹à¸à¸à¸¸à¸à¸à¸£à¸à¸µ à¹à¸¥à¸°à¸«à¸²à¸à¸à¸­à¸à¸à¸µà¹à¸à¸²à¸à¸¡à¸µà¸à¸à¸²à¸à¹à¸«à¸à¹ à¹à¸¡à¹à¸ªà¸²à¸¡à¸²à¸£à¸à¹à¸à¸¥à¸·à¹à¸­à¸à¸¢à¹à¸²à¸¢à¹à¸à¹à¸ªà¸°à¸à¸§à¸ à¸à¸²à¸à¸à¸¥à¸²à¸à¸¯ à¸à¸´à¸à¸à¹à¸²à¸¥à¹à¸­à¸à¹à¸à¸à¸±à¸à¸à¸±à¹à¸</li>
              <li>à¹à¸¡à¸·à¹à¸­à¸ªà¸´à¹à¸à¸ªà¸¸à¸à¸£à¸°à¸¢à¸°à¹à¸§à¸¥à¸²à¸à¸²à¸à¸à¸­à¸ à¹à¸¥à¸°à¹à¸¡à¹à¹à¸à¹à¸à¸³à¸à¸²à¸£à¸à¹à¸­à¸£à¸°à¸¢à¸°à¹à¸§à¸¥à¸²à¸à¸²à¸à¸à¸­à¸ à¸«à¸²à¸à¸¥à¸¹à¸à¸à¹à¸²à¹à¸¡à¹à¸¡à¸²à¸£à¸±à¸à¸«à¸£à¸·à¸­à¸¡à¸²à¸£à¸±à¸à¹à¸à¸ à¸²à¸¢à¸«à¸¥à¸±à¸ à¸à¸²à¸à¸à¸¥à¸²à¸à¸¯ à¸à¸´à¸à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸à¸¢à¹à¸­à¸à¸«à¸¥à¸±à¸</li>
              <li>à¸à¸²à¸£à¸à¸³à¸£à¸°à¸à¹à¸²à¸à¸²à¸à¸à¸­à¸ à¸à¸·à¸­à¸§à¹à¸²à¸¥à¸¹à¸à¸à¹à¸²à¹à¸à¹à¸£à¸±à¸à¸à¸£à¸²à¸à¸£à¸²à¸¢à¸¥à¸°à¹à¸­à¸µà¸¢à¸à¹à¸¥à¸°à¹à¸à¸·à¹à¸­à¸à¹à¸à¸à¸²à¸£à¸à¸²à¸à¸à¸­à¸à¸à¸±à¸à¸à¸¥à¹à¸²à¸§à¹à¸¥à¹à¸§ à¹à¸¥à¸°à¸à¸°à¸à¸à¸´à¸à¸±à¸à¸´à¸à¸²à¸¡à¸­à¸¢à¹à¸²à¸à¹à¸à¸£à¹à¸à¸à¸£à¸±à¸</li>
            </ol>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="bold">à¸ªà¸­à¸à¸à¸²à¸¡à¸à¹à¸­à¸¡à¸¹à¸¥à¸à¸²à¸£à¸à¸²à¸à¸à¸­à¸à¹à¸à¹à¸à¸µà¹</div>
            <div class="bold" style="margin-top: 1mm; font-size: 10.5pt;">@ladsawaivintage</div>
            <div style="font-size: 8pt; color: #555; margin-top: 3mm;">Power by PJMJK</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setShowStoragePrintModal(false);
  };

  return (
    <StorageContext.Provider value={{
      showStorageMgmtModal,
      setShowStorageMgmtModal,
      showStoragePrintModal,
      setShowStoragePrintModal,
      isStorageCheckout,
      setIsStorageCheckout,
      loadingStorage,
      setLoadingStorage,
      storageList,
      storageMap,
      storageForm,
      setStorageForm,
      storagePrintItem,
      setStoragePrintItem,
      storagePrintStartDate,
      setStoragePrintStartDate,
      storagePrintEndDate,
      setStoragePrintEndDate,
      storagePrintOwner,
      setStoragePrintOwner,
      storagePrintStall,
      setStoragePrintStall,
      storagePrintNote,
      setStoragePrintNote,
      storagePrintFee,
      setStoragePrintFee,
      storagePrintPayment,
      setStoragePrintPayment,
      fetchAllStorage,
      handleSaveStorage,
      handleRenewStorage,
      handleCheckoutStorage,
      handleToggleStorageStatus,
      handlePrintStorageReceipt,
      parseNumber,
      formatPrice
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}