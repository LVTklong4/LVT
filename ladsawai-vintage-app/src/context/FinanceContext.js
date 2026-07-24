'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [dailyClosingData, setDailyClosingData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all transactions from other_income and expenses tables
  const fetchFinanceData = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let incomeQuery = supabase.from('other_income').select('*').order('date', { ascending: false }).order('timestamp', { ascending: false });
      let expenseQuery = supabase.from('expenses').select('*').order('date', { ascending: false }).order('timestamp', { ascending: false });

      // Apply date range filters if provided
      if (filters.startDate) {
        incomeQuery = incomeQuery.gte('date', filters.startDate);
        expenseQuery = expenseQuery.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        incomeQuery = incomeQuery.lte('date', filters.endDate);
        expenseQuery = expenseQuery.lte('date', filters.endDate);
      }

      const [incRes, expRes] = await Promise.all([incomeQuery, expenseQuery]);

      if (incRes.error) throw incRes.error;
      if (expRes.error) throw expRes.error;

      let filteredIncome = incRes.data || [];
      let filteredExpense = expRes.data || [];

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
      const payload = {
        id: `INC-${Date.now()}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        category: formData.category || 'อื่นๆ',
        description: formData.description.trim(),
        amount: parseFloat(formData.amount) || 0,
        method: formData.method || 'โอนเงิน',
        officer: officerName,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.from('other_income').insert([payload]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.error('Error adding income:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  // ADD Expense Transaction
  const addExpense = useCallback(async (formData, officerName = 'Admin') => {
    setLoading(true);
    try {
      const payload = {
        id: `EXP-${Date.now()}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        category: formData.category || 'อื่นๆ',
        item: formData.item.trim(),
        amount: parseFloat(formData.amount) || 0,
        method: formData.method || 'โอนเงิน',
        officer: officerName,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.from('expenses').insert([payload]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.error('Error adding expense:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE Income Transaction
  const deleteIncome = useCallback(async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('other_income').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting income:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE Expense Transaction
  const deleteExpense = useCallback(async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting expense:', e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FinanceContext.Provider value={{
      incomeList,
      expenseList,
      dailyClosingData,
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
