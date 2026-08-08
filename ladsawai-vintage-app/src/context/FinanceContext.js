'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [dailyClosingData, setDailyClosingData] = useState(null);
  const [closedDates, setClosedDates] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Check if a date is closed/frozen
  const isDateClosed = useCallback((targetDate) => {
    if (!targetDate) return false;
    return closedDates.has(targetDate);
  }, [closedDates]);

  // Fetch all transactions from transactions table (and fallback to other_income/expenses)
  const fetchFinanceData = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      // 0. Fetch closed dates
      try {
        const { data: closings } = await supabase.from('daily_closings').select('date, status');
        if (closings && closings.length > 0) {
          const cSet = new Set();
          closings.forEach(c => {
            if (c.status === 'CLOSED' || c.date) cSet.add(c.date);
          });
          setClosedDates(cSet);
        }
      } catch (err) {
        console.warn('Could not fetch daily closings:', err);
      }

      // 1. Fetch from unified transactions table
      let txnQuery = supabase.from('transactions').select('*').order('date', { ascending: false }).order('timestamp', { ascending: false });
      if (filters.startDate) txnQuery = txnQuery.gte('date', filters.startDate);
      if (filters.endDate) txnQuery = txnQuery.lte('date', filters.endDate);

      const { data: allTxns } = await txnQuery;
      
      const incList = [];
      const expList = [];

      allTxns?.forEach(t => {
        const isExp = t.type === 'รายจ่าย' || t.category?.includes('จ่าย') || t.bill_type === 'รายจ่าย';
        const itemObj = {
          id: t.id,
          date: t.date,
          category: t.category || (isExp ? 'ค่าใช้จ่ายทั่วไป' : 'รายรับทั่วไป'),
          description: t.description || t.note || t.booking_ref || '',
          item: t.description || t.note || t.booking_ref || '',
          amount: parseFloat(t.total_amount || t.amount || 0),
          method: t.payment_method || t.method || 'โอนเงิน',
          officer: t.officer || 'Admin',
          timestamp: t.timestamp || t.created_at
        };

        if (isExp) {
          expList.push(itemObj);
        } else {
          incList.push(itemObj);
        }
      });

      // 2. Also check if there are legacy other_income / expenses
      try {
        const [incRes, expRes] = await Promise.all([
          supabase.from('other_income').select('*'),
          supabase.from('expenses').select('*')
        ]);
        if (incRes?.data?.length) {
          incRes.data.forEach(inc => {
            if (!incList.some(x => x.id === inc.id)) incList.push(inc);
          });
        }
        if (expRes?.data?.length) {
          expRes.data.forEach(exp => {
            if (!expList.some(x => x.id === exp.id)) expList.push(exp);
          });
        }
      } catch (err) {
        // Safe to ignore if tables are consolidated
      }

      let filteredIncome = incList;
      let filteredExpense = expList;

      // Apply category filter in-memory if needed
      if (filters.category && filters.category !== 'ทั้งหมด') {
        filteredIncome = filteredIncome.filter(item => item.category === filters.category);
        filteredExpense = filteredExpense.filter(item => item.category === filters.category);
      }

      // Apply payment method filter in-memory if needed
      if (filters.method && filters.method !== 'ทั้งหมด') {
        filteredIncome = filteredIncome.filter(item => item.method === filters.method);
        filteredExpense = filteredExpense.filter(item => item.method === filters.method);
      }

      // Apply search query in-memory if needed
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        filteredIncome = filteredIncome.filter(item => 
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.officer && item.officer.toLowerCase().includes(q))
        );
        filteredExpense = filteredExpense.filter(item => 
          (item.item && item.item.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.officer && item.officer.toLowerCase().includes(q))
        );
      }

      setIncomeList(filteredIncome);
      setExpenseList(filteredExpense);
    } catch (e) {
      console.error('Error fetching finance data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Daily Summary for Closing Reconciliation
  const fetchDailySummary = useCallback(async (targetDate) => {
    const selectedDate = targetDate || new Date().toISOString().split('T')[0];
    setLoading(true);
    try {
      const [bookingsRes, txnsRes, incRes, expRes, closingRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('date', selectedDate),
        supabase.from('transactions').select('*').eq('date', selectedDate),
        supabase.from('other_income').select('*').eq('date', selectedDate),
        supabase.from('expenses').select('*').eq('date', selectedDate),
        supabase.from('daily_closings').select('*').eq('date', selectedDate).maybeSingle()
      ]);

      const bookings = bookingsRes.data || [];
      const txns = txnsRes.data || [];
      const otherIncome = incRes.data || [];
      const expenses = expRes.data || [];
      const existingClosing = closingRes.data || null;

      // Summary Breakdown
      let dailyStallIncome = 0;
      let monthlyIncome = 0;
      let klongthomIncome = 0;
      let storageIncome = 0;
      let otherIncTotal = 0;
      let totalExpenses = 0;

      let cashIn = 0;
      let transferIn = 0;
      let cashOut = 0;
      let transferOut = 0;

      // 1. Transactions
      txns.forEach(t => {
        const amt = parseFloat(t.total_amount) || 0;
        const isCash = t.method === 'Cash' || t.method === 'เงินสด';
        
        if (isCash) cashIn += amt; else transferIn += amt;

        if (t.category?.includes('คลองถม')) {
          klongthomIncome += amt;
        } else if (t.category?.includes('ฝากของ')) {
          storageIncome += amt;
        } else if (t.booking_ref && (t.category?.includes('รายเดือน') || t.category?.includes('ส่วนลด'))) {
          monthlyIncome += amt;
        } else {
          dailyStallIncome += amt;
        }
      });

      // 2. Bookings (Direct daily payments if not recorded in transactions)
      bookings.forEach(b => {
        if (b.status === 'จ่ายแล้ว' && b.price) {
          const amt = parseFloat(b.price) || 0;
          // check if already counted in txns
          const hasTxn = txns.some(t => t.booking_ref === b.id);
          if (!hasTxn) {
            dailyStallIncome += amt;
            if (b.payment_method === 'เงินสด' || b.payment_method === 'Cash') cashIn += amt; else transferIn += amt;
          }
        }
      });

      // 3. Other Income
      otherIncome.forEach(inc => {
        const amt = parseFloat(inc.amount) || 0;
        otherIncTotal += amt;
        if (inc.method === 'Cash' || inc.method === 'เงินสด') cashIn += amt; else transferIn += amt;
      });

      // 4. Expenses
      expenses.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        totalExpenses += amt;
        if (exp.method === 'Cash' || exp.method === 'เงินสด') cashOut += amt; else transferOut += amt;
      });

      const summary = {
        date: selectedDate,
        dailyStallIncome,
        monthlyIncome,
        klongthomIncome,
        storageIncome,
        otherIncome: otherIncTotal,
        totalIncome: dailyStallIncome + monthlyIncome + klongthomIncome + storageIncome + otherIncTotal,
        totalExpenses,
        netProfit: (dailyStallIncome + monthlyIncome + klongthomIncome + storageIncome + otherIncTotal) - totalExpenses,
        cashIn,
        transferIn,
        cashOut,
        transferOut,
        expectedCashInDrawer: cashIn - cashOut, // before float
        existingClosing
      };

      setDailyClosingData(summary);
      return summary;
    } catch (e) {
      console.error('Error fetching daily summary:', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save Daily Closing
  const saveDailyClosing = useCallback(async (payload) => {
    setLoading(true);
    try {
      const closingObj = {
        id: `CLOSE-${payload.date}`,
        date: payload.date,
        status: payload.status || 'CLOSED',
        float_amount: parseFloat(payload.floatAmount) || 0,
        counted_cash: parseFloat(payload.countedCash) || 0,
        cash_shortage_surplus: parseFloat(payload.cashShortageSurplus) || 0,
        discrepancy_note: payload.discrepancyNote?.trim() || '',
        system_daily_income: payload.summary?.dailyStallIncome || 0,
        system_monthly_income: payload.summary?.monthlyIncome || 0,
        system_klongthom_income: payload.summary?.klongthomIncome || 0,
        system_storage_income: payload.summary?.storageIncome || 0,
        system_other_income: payload.summary?.otherIncome || 0,
        system_total_expenses: payload.summary?.totalExpenses || 0,
        system_cash_in: payload.summary?.cashIn || 0,
        system_transfer_in: payload.summary?.transferIn || 0,
        system_cash_out: payload.summary?.cashOut || 0,
        system_transfer_out: payload.summary?.transferOut || 0,
        closed_by: payload.officer || 'Admin',
        closed_at: new Date().toISOString()
      };

      // Try inserting into daily_closings table
      const { data, error } = await supabase.from('daily_closings').upsert([closingObj]).select();
      if (error) {
        console.warn('daily_closings table notice (saving local fallback):', error.message);
        // Fallback to local storage if table doesn't exist yet
        if (typeof window !== 'undefined') {
          localStorage.setItem(`daily_closing_${payload.date}`, JSON.stringify(closingObj));
        }
      }

      setDailyClosingData(prev => prev ? { ...prev, existingClosing: closingObj } : prev);
      return { success: true, data: closingObj };
    } catch (e) {
      console.error('Error saving daily closing:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  // ADD Income Transaction
  const addIncome = useCallback(async (formData, officerName = 'Admin') => {
    setLoading(true);
    try {
      const nowId = `INC-${Date.now()}`;
      const payloadTxn = {
        id: nowId,
        date: formData.date || new Date().toISOString().split('T')[0],
        type: 'รายรับ',
        category: formData.category || 'อื่นๆ',
        description: formData.description.trim(),
        total_amount: parseFloat(formData.amount) || 0,
        amount: parseFloat(formData.amount) || 0,
        payment_method: formData.method || 'โอนเงิน',
        method: formData.method || 'โอนเงิน',
        officer: officerName,
        bill_type: 'other_income',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // 1. Insert into unified transactions table
      await supabase.from('transactions').insert([payloadTxn]);

      // 2. Fallback to other_income table if exists
      try {
        await supabase.from('other_income').insert([{
          id: nowId,
          date: payloadTxn.date,
          category: payloadTxn.category,
          description: payloadTxn.description,
          amount: payloadTxn.amount,
          method: payloadTxn.method,
          officer: payloadTxn.officer,
          timestamp: payloadTxn.timestamp
        }]);
      } catch (err) {
        // Safe to ignore if other_income is deprecated
      }

      await fetchFinanceData();
      return { success: true, data: payloadTxn };
    } catch (e) {
      console.error('Error adding income:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [fetchFinanceData]);

  // ADD Expense Transaction
  const addExpense = useCallback(async (formData, officerName = 'Admin') => {
    setLoading(true);
    try {
      const nowId = `EXP-${Date.now()}`;
      const payloadTxn = {
        id: nowId,
        date: formData.date || new Date().toISOString().split('T')[0],
        type: 'รายจ่าย',
        category: formData.category || 'อื่นๆ',
        description: formData.item.trim(),
        total_amount: parseFloat(formData.amount) || 0,
        amount: parseFloat(formData.amount) || 0,
        payment_method: formData.method || 'โอนเงิน',
        method: formData.method || 'โอนเงิน',
        officer: officerName,
        bill_type: 'expenses',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // 1. Insert into unified transactions table
      await supabase.from('transactions').insert([payloadTxn]);

      // 2. Fallback to expenses table if exists
      try {
        await supabase.from('expenses').insert([{
          id: nowId,
          date: payloadTxn.date,
          category: payloadTxn.category,
          item: payloadTxn.description,
          amount: payloadTxn.amount,
          method: payloadTxn.method,
          officer: payloadTxn.officer,
          timestamp: payloadTxn.timestamp
        }]);
      } catch (err) {
        // Safe to ignore if expenses is deprecated
      }

      await fetchFinanceData();
      return { success: true, data: payloadTxn };
    } catch (e) {
      console.error('Error adding expense:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [fetchFinanceData]);

  // DELETE Income Transaction
  const deleteIncome = useCallback(async (id) => {
    setLoading(true);
    try {
      await supabase.from('transactions').delete().eq('id', id);
      try { await supabase.from('other_income').delete().eq('id', id); } catch (e) {}
      await fetchFinanceData();
      return { success: true };
    } catch (e) {
      console.error('Error deleting income:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [fetchFinanceData]);

  // DELETE Expense Transaction
  const deleteExpense = useCallback(async (id) => {
    setLoading(true);
    try {
      await supabase.from('transactions').delete().eq('id', id);
      try { await supabase.from('expenses').delete().eq('id', id); } catch (e) {}
      await fetchFinanceData();
      return { success: true };
    } catch (e) {
      console.error('Error deleting expense:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [fetchFinanceData]);

  return (
    <FinanceContext.Provider value={{
      incomeList,
      expenseList,
      dailyClosingData,
      closedDates,
      isDateClosed,
      loading,
      fetchFinanceData,
      fetchDailySummary,
      saveDailyClosing,
      addIncome,
      addExpense,
      deleteIncome,
      deleteExpense
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
