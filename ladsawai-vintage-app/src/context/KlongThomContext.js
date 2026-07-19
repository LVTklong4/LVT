'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const KlongThomContext = createContext();

export function KlongThomProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return new Date().toISOString().split('T')[0];
    }
    return '';
  });
  const [ticketType, setTicketType] = useState('main'); // 'main' or 'general'
  const [activeTab, setActiveTab] = useState('print'); // 'print' or 'remit'
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('lvt_admin_session');
      if (session) {
        try {
          return JSON.parse(session);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });

  // Print Form States
  const [printForm, setPrintForm] = useState({
    price: '0',
    startNo: '1',
    endNo: ''
  });

  // Remit Form States
  const [remitForm, setRemitForm] = useState({
    cars: '',
    pricePerCar: '0',
    totalAmount: '',
    note: ''
  });
  const [paymentList, setPaymentList] = useState([{ method: 'เงินสด', amount: '' }]);

  // Remittance History
  const [remittanceHistory, setRemittanceHistory] = useState([]);

  // Toast / Alert States
  const [alertInfo, setAlertInfo] = useState(null);

  const showAlert = (message, title = "แจ้งเตือน", isError = false) => {
    setAlertInfo({ message, title, isError });
    setTimeout(() => {
      setAlertInfo(null);
    }, 4000);
  };

  const fetchRemittanceHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('date', selectedDate)
        .eq('bill_type', 'KlongThom')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setRemittanceHistory(data || []);
    } catch (e) {
      console.error(e);
      showAlert(e.message, "ดึงประวัติการส่งยอดเงินล้มเหลว", true);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch history when date changes
  useEffect(() => {
    if (selectedDate) {
      const timer = setTimeout(() => {
        fetchRemittanceHistory();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, fetchRemittanceHistory]);

  const handleSaveRemittance = async () => {
    let finalAmount = 0;
    let customNote = '';
    let category = '';

    if (ticketType === 'main') {
      const carsVal = parseInt(remitForm.cars) || 0;
      const priceVal = parseFloat(remitForm.pricePerCar) || 0;
      if (carsVal <= 0) {
        showAlert("กรุณาระบุจำนวนคันให้ถูกต้อง", "แจ้งเตือน", true);
        return;
      }
      finalAmount = carsVal * priceVal;
      customNote = `นำส่งเงินคลองถม (หลัก) จำนวน ${carsVal} คัน`;
      category = 'ค่าเช่าคลองถมหลัก';
    } else {
      finalAmount = parseFloat(remitForm.totalAmount) || 0;
      if (finalAmount <= 0) {
        showAlert("กรุณาระบุยอดรวมที่จัดเก็บได้", "แจ้งเตือน", true);
        return;
      }
      customNote = `นำส่งเงินคลองถมทั่วไป (ราคาไม่คงที่)`;
      category = 'ค่าเช่าคลองถมทั่วไป';
    }

    // Validate split payment
    let totalPaid = 0;
    const cleanPayments = paymentList.filter(p => p.method && p.amount);
    cleanPayments.forEach(p => {
      totalPaid += parseFloat(p.amount) || 0;
    });

    if (totalPaid !== finalAmount) {
      showAlert(`ยอดนำส่งเงิน (${totalPaid} บ.) ไม่ตรงกับยอดสุทธิที่คำนวณได้ (${finalAmount} บ.)`, "แจ้งเตือน", true);
      return;
    }

    const paymentMethodStr = cleanPayments
      .map(p => `${p.method}:${p.amount}`)
      .join(' + ') || 'เงินสด';

    setLoading(true);
    try {
      const txnId = `TXN-KT-REMIT-${Date.now()}`;
      const txnData = {
        id: txnId,
        booking_ref: `KT-REMIT-${Date.now()}`,
        date: selectedDate,
        category: category,
        total_amount: finalAmount,
        method: paymentMethodStr,
        note: remitForm.note.trim() 
          ? `${customNote} (${remitForm.note.trim()})`
          : customNote,
        officer: adminUser?.name || 'lvt-admin',
        timestamp: new Date().toISOString(),
        stall_amt: finalAmount,
        elec_amt: 0,
        storage_amt: 0,
        bill_type: 'KlongThom'
      };

      const { error } = await supabase
        .from('transactions')
        .insert(txnData);
      if (error) throw error;

      showAlert("บันทึกการนำส่งเงินคลองถมสำเร็จ", "สำเร็จ");
      
      // Reset Form
      setRemitForm({
        cars: '',
        pricePerCar: '0',
        totalAmount: '',
        note: ''
      });
      setPaymentList([{ method: 'เงินสด', amount: '' }]);
      
      fetchRemittanceHistory();
    } catch (e) {
      console.error(e);
      showAlert(e.message, "บันทึกข้อมูลล้มเหลว", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRemittance = async (txnId) => {
    if (!confirm("คุณต้องการลบรายการนำส่งเงินนี้ใช่หรือไม่? รายงานทางบัญชีจะถูกหักออกด้วย")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', txnId);
      if (error) throw error;

      showAlert("ลบรายการนำส่งเงินสำเร็จ", "สำเร็จ");
      fetchRemittanceHistory();
    } catch (e) {
      console.error(e);
      showAlert(e.message, "ลบข้อมูลล้มเหลว", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KlongThomContext.Provider value={{
      selectedDate,
      setSelectedDate,
      ticketType,
      setTicketType,
      activeTab,
      setActiveTab,
      loading,
      adminUser,
      printForm,
      setPrintForm,
      remitForm,
      setRemitForm,
      paymentList,
      setPaymentList,
      remittanceHistory,
      showAlert,
      alertInfo,
      setAlertInfo,
      handleSaveRemittance,
      handleDeleteRemittance,
      fetchRemittanceHistory
    }}>
      {children}
    </KlongThomContext.Provider>
  );
}

export function useKlongThom() {
  const context = useContext(KlongThomContext);
  if (!context) {
    throw new Error('useKlongThom must be used within a KlongThomProvider');
  }
  return context;
}
