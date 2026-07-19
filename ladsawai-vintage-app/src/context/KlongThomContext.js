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
    ticketPrice: '0',
    carsCash: '',
    carsTransfer: '',
    ticketCash: '',
    ticketTransfer: '',
    elecCash: '',
    elecTransfer: '',
    note: ''
  });

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
    let stallAmt = 0;
    let elecAmt = 0;
    let totalCash = 0;
    let totalTransfer = 0;

    const ticketPriceVal = parseFloat(remitForm.ticketPrice) || 0;
    const elecCashVal = parseFloat(remitForm.elecCash) || 0;
    const elecTransferVal = parseFloat(remitForm.elecTransfer) || 0;
    elecAmt = elecCashVal + elecTransferVal;

    if (ticketType === 'main') {
      const carsCashVal = parseInt(remitForm.carsCash) || 0;
      const carsTransferVal = parseInt(remitForm.carsTransfer) || 0;
      
      if (carsCashVal === 0 && carsTransferVal === 0 && elecAmt === 0) {
        showAlert("กรุณาระบุจำนวนหรือยอดเงินนำส่งอย่างน้อย 1 รายการ", "แจ้งเตือน", true);
        return;
      }
      
      const ticketCashVal = carsCashVal * ticketPriceVal;
      const ticketTransferVal = carsTransferVal * ticketPriceVal;
      
      stallAmt = ticketCashVal + ticketTransferVal;
      totalCash = ticketCashVal + elecCashVal;
      totalTransfer = ticketTransferVal + elecTransferVal;
      finalAmount = totalCash + totalTransfer;
      
      customNote = `นำส่งเงินคลองถม (หลัก) [ตั๋ว สด: ${carsCashVal} คัน, โอน: ${carsTransferVal} คัน | ค่าไฟ สด: ${elecCashVal} บ., โอน: ${elecTransferVal} บ.]`;
      category = 'ค่าเช่าคลองถมหลัก';
    } else {
      const ticketCashVal = parseFloat(remitForm.ticketCash) || 0;
      const ticketTransferVal = parseFloat(remitForm.ticketTransfer) || 0;
      
      if (ticketCashVal === 0 && ticketTransferVal === 0 && elecAmt === 0) {
        showAlert("กรุณาระบุจำนวนหรือยอดเงินนำส่งอย่างน้อย 1 รายการ", "แจ้งเตือน", true);
        return;
      }
      
      stallAmt = ticketCashVal + ticketTransferVal;
      totalCash = ticketCashVal + elecCashVal;
      totalTransfer = ticketTransferVal + elecTransferVal;
      finalAmount = totalCash + totalTransfer;
      
      customNote = `นำส่งเงินคลองถมทั่วไป [ตั๋ว สด: ${ticketCashVal} บ., โอน: ${ticketTransferVal} บ. | ค่าไฟ สด: ${elecCashVal} บ., โอน: ${elecTransferVal} บ.]`;
      category = 'ค่าเช่าคลองถมทั่วไป';
    }

    // Build payment method string
    const methods = [];
    if (totalCash > 0) methods.push(`เงินสด:${totalCash}`);
    if (totalTransfer > 0) methods.push(`โอนเงิน:${totalTransfer}`);
    const paymentMethodStr = methods.join(' + ') || 'เงินสด:0';

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
          ? `${customNote} - ${remitForm.note.trim()}`
          : customNote,
        officer: adminUser?.name || 'lvt-admin',
        timestamp: new Date().toISOString(),
        stall_amt: stallAmt,
        elec_amt: elecAmt,
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
        ticketPrice: '0',
        carsCash: '',
        carsTransfer: '',
        ticketCash: '',
        ticketTransfer: '',
        elecCash: '',
        elecTransfer: '',
        note: ''
      });
      
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
