'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
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
      loading,
      fetchFinanceData,
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
