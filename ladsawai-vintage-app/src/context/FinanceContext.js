'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const FinanceContext = createContext();

// Helper: Parse single or split payment methods into cash and transfer amounts
export function parsePaymentBreakdown(methodStr, totalAmount = 0) {
  const str = String(methodStr || '').trim();
  const amt = parseFloat(totalAmount) || 0;

  if (!str) {
    return { cash: 0, transfer: amt, isDiscount: false };
  }

  if (str.includes('ส่วนลด') || str.toLowerCase().includes('discount')) {
    return { cash: 0, transfer: 0, discount: amt, isDiscount: true };
  }

  if (str.includes('+') || str.includes(':')) {
    let parsedCash = 0;
    let parsedTransfer = 0;
    const parts = str.split('+');

    parts.forEach(p => {
      const seg = p.trim();
      if (seg.includes(':')) {
        const [methodName, valStr] = seg.split(':');
        const val = parseFloat(valStr) || 0;
        const mLow = (methodName || '').trim().toLowerCase();
        if (mLow.includes('สด') || mLow.includes('cash')) {
          parsedCash += val;
        } else {
          parsedTransfer += val;
        }
      } else {
        const segLow = seg.toLowerCase();
        if (segLow.includes('สด') || segLow.includes('cash')) {
          parsedCash += amt;
        } else {
          parsedTransfer += amt;
        }
      }
    });

    return { cash: parsedCash, transfer: parsedTransfer, isDiscount: false };
  }

  const lower = str.toLowerCase();
  if (lower.includes('สด') || lower.includes('cash')) {
    return { cash: amt, transfer: 0, isDiscount: false };
  }

  return { cash: 0, transfer: amt, isDiscount: false };
}

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
        const isExp = t.bill_type === 'รายจ่าย' || t.bill_type === 'expenses' || t.type === 'รายจ่าย' || t.category?.includes('จ่าย') || t.category?.includes('ค่าจ้าง') || t.category?.includes('ค่าซ่อม');
        const amt = parseFloat(t.total_amount || t.amount || 0);
        const rawMethod = t.payment_method || t.method || 'โอนเงิน';
        const breakdown = parsePaymentBreakdown(rawMethod, amt);

        const itemObj = {
          id: t.id,
          date: t.date,
          category: t.category || (isExp ? 'ค่าใช้จ่ายทั่วไป' : 'รายรับทั่วไป'),
          description: t.description || t.note || t.booking_ref || '',
          item: t.description || t.note || t.booking_ref || '',
          amount: amt,
          method: rawMethod,
          cashAmount: breakdown.cash,
          transferAmount: breakdown.transfer,
          officer: t.officer || 'Admin',
          timestamp: t.timestamp || t.created_at
        };

        if (isExp) {
          expList.push(itemObj);
        } else {
          // Do not include pure discounts in General Ledger income list
          if (!breakdown.isDiscount) {
            incList.push(itemObj);
          }
        }
      });

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

  // Fetch Daily Summary for Closing Reconciliation (with Unclosed Carry-Forward & Float Handover)
  const fetchDailySummary = useCallback(async (targetDate) => {
    const selectedDate = targetDate || new Date().toISOString().split('T')[0];
    setLoading(true);
    try {
      // 0. Fetch previous closing for Float Handover & unclosed dates
      let suggestedFloat = 0;
      let carryForwardCash = 0;
      let carryForwardTransfer = 0;
      let carryForwardExpenses = 0;
      const carryForwardItems = [];

      try {
        const [prevClosingRes, allClosedRes] = await Promise.all([
          supabase
            .from('daily_closings')
            .select('*')
            .lt('date', selectedDate)
            .order('date', { ascending: false })
            .limit(1),
          supabase
            .from('daily_closings')
            .select('date')
            .eq('status', 'CLOSED')
        ]);

        if (prevClosingRes.data && prevClosingRes.data.length > 0) {
          suggestedFloat = parseFloat(prevClosingRes.data[0].float_amount) || 0;
        }

        const closedDateSet = new Set((allClosedRes.data || []).map(r => r.date));

        // Query transactions prior to selectedDate that were never closed
        const { data: pastTxns } = await supabase
          .from('transactions')
          .select('*')
          .lt('date', selectedDate)
          .order('date', { ascending: true });

        pastTxns?.forEach(t => {
          if (!closedDateSet.has(t.date)) {
            const amt = parseFloat(t.total_amount || t.amount) || 0;
            const isExp = t.bill_type === 'รายจ่าย' || t.bill_type === 'expenses' || t.type === 'รายจ่าย' || t.category?.includes('จ่าย') || t.category?.includes('ค่าจ้าง') || t.category?.includes('ค่าซ่อม');
            const payment = parsePaymentBreakdown(t.payment_method || t.method, amt);

            if (isExp) {
              carryForwardExpenses += amt;
              carryForwardCash -= payment.cash;
              carryForwardTransfer -= payment.transfer;
              carryForwardItems.push({
                id: t.id,
                date: t.date,
                description: `[ยกยอด ${t.date}] ${t.description || t.note || t.category || 'รายจ่าย'}`,
                category: t.category || 'ยกยอด',
                amount: amt,
                method: payment.cash > 0 ? (payment.transfer > 0 ? 'เงินสด+โอน' : 'เงินสด') : 'โอนเงิน',
                officer: t.officer || 'Admin',
                isCarryForward: true
              });
            } else {
              const isDiscount = t.category?.includes('ส่วนลด') || payment.isDiscount;
              if (!isDiscount) {
                carryForwardCash += payment.cash;
                carryForwardTransfer += payment.transfer;
                carryForwardItems.push({
                  id: t.id,
                  date: t.date,
                  description: `[ยกยอด ${t.date}] ${t.description || t.note || t.category || 'รายรับ'}`,
                  category: t.category || 'ยกยอด',
                  amount: amt,
                  method: payment.cash > 0 ? (payment.transfer > 0 ? 'เงินสด+โอน' : 'เงินสด') : 'โอนเงิน',
                  officer: t.officer || 'Admin',
                  isCarryForward: true
                });
              }
            }
          }
        });
      } catch (err) {
        console.warn('Notice: Error checking carry-forward data:', err);
      }

      const [bookingsRes, txnsRes, closingRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('date', selectedDate),
        supabase.from('transactions').select('*').eq('date', selectedDate),
        supabase.from('daily_closings').select('*').eq('date', selectedDate).maybeSingle()
      ]);

      const bookings = bookingsRes.data || [];
      const txns = txnsRes.data || [];
      const existingClosing = closingRes.data || null;

      // Summary Breakdown
      let dailyStallIncome = 0;
      let monthlyIncome = 0;
      let klongthomIncome = 0;
      let storageIncome = 0;
      let otherIncTotal = 0;
      let totalExpenses = carryForwardExpenses;

      let cashIn = Math.max(0, carryForwardCash);
      let transferIn = Math.max(0, carryForwardTransfer);
      let cashOut = carryForwardCash < 0 ? Math.abs(carryForwardCash) : 0;
      let transferOut = carryForwardTransfer < 0 ? Math.abs(carryForwardTransfer) : 0;

      // Detailed category breakdown (Cash vs Transfer)
      const breakdown = {
        dailyStall: { cash: 0, transfer: 0, total: 0 },
        monthly: { cash: 0, transfer: 0, total: 0 },
        klongthom: { cash: 0, transfer: 0, total: 0 },
        storage: { cash: 0, transfer: 0, total: 0 },
        otherIncome: { cash: 0, transfer: 0, total: 0 },
        expenses: { cash: 0, transfer: 0, total: 0 },
        discounts: { total: 0, count: 0 }
      };

      // 1. Transactions
      const expenseItems = [];
      let transferTxnCount = 0;

      txns.forEach(t => {
        const amt = parseFloat(t.total_amount || t.amount) || 0;
        const isExp = t.bill_type === 'รายจ่าย' || t.bill_type === 'expenses' || t.type === 'รายจ่าย' || t.category?.includes('จ่าย') || t.category?.includes('ค่าจ้าง') || t.category?.includes('ค่าซ่อม');
        const payment = parsePaymentBreakdown(t.payment_method || t.method, amt);
        
        if (isExp) {
          totalExpenses += amt;
          expenseItems.push({
            id: t.id,
            description: t.description || t.note || t.category || 'รายจ่าย',
            category: t.category || 'ทั่วไป',
            amount: amt,
            method: payment.cash > 0 ? (payment.transfer > 0 ? 'เงินสด+โอน' : 'เงินสด') : 'โอนเงิน',
            officer: t.officer || 'Admin'
          });
          cashOut += payment.cash;
          transferOut += payment.transfer;
          breakdown.expenses.cash += payment.cash;
          breakdown.expenses.transfer += payment.transfer;
          breakdown.expenses.total += amt;
        } else {
          // Check for pure discounts
          const isDiscountCategory = t.category?.includes('ส่วนลด') || payment.isDiscount;
          if (isDiscountCategory) {
            // Discounts are reductions, NOT income
            breakdown.discounts.total += amt;
            breakdown.discounts.count += 1;
            return;
          }

          cashIn += payment.cash;
          transferIn += payment.transfer;
          if (payment.transfer > 0) {
            transferTxnCount++;
          }

          if (t.category?.includes('คลองถม') || t.bill_type === 'KlongThom') {
            klongthomIncome += amt;
            breakdown.klongthom.cash += payment.cash;
            breakdown.klongthom.transfer += payment.transfer;
            breakdown.klongthom.total += amt;
          } else if (t.category?.includes('ฝากของ') || t.bill_type === 'Storage') {
            storageIncome += amt;
            breakdown.storage.cash += payment.cash;
            breakdown.storage.transfer += payment.transfer;
            breakdown.storage.total += amt;
          } else if (t.booking_ref && (t.category?.includes('รายเดือน') || t.category?.includes('สัญญา'))) {
            monthlyIncome += amt;
            breakdown.monthly.cash += payment.cash;
            breakdown.monthly.transfer += payment.transfer;
            breakdown.monthly.total += amt;
          } else if (t.category?.includes('รายได้อื่นๆ') || t.category?.includes('รายรับอื่นๆ')) {
            otherIncTotal += amt;
            breakdown.otherIncome.cash += payment.cash;
            breakdown.otherIncome.transfer += payment.transfer;
            breakdown.otherIncome.total += amt;
          } else {
            dailyStallIncome += amt;
            breakdown.dailyStall.cash += payment.cash;
            breakdown.dailyStall.transfer += payment.transfer;
            breakdown.dailyStall.total += amt;
          }
        }
      });

      // 2. Bookings (Direct daily payments if not recorded in transactions)
      bookings.forEach(b => {
        if (b.status === 'จ่ายแล้ว' && b.price) {
          const amt = parseFloat(b.price) || 0;
          // check if already counted in txns
          const hasTxn = txns.some(t => t.booking_ref === b.id);
          if (!hasTxn) {
            const bPayment = parsePaymentBreakdown(b.payment_method, amt);
            dailyStallIncome += amt;
            cashIn += bPayment.cash;
            transferIn += bPayment.transfer;
            if (bPayment.transfer > 0) {
              transferTxnCount++;
            }
            breakdown.dailyStall.cash += bPayment.cash;
            breakdown.dailyStall.transfer += bPayment.transfer;
            breakdown.dailyStall.total += amt;
          }
        }
      });

      const bookedCount = bookings.filter(b => b.status === 'จ่ายแล้ว' || b.status === 'จองแล้ว' || (b.customer_name && b.customer_name.trim() !== '')).length;
      const occupancy = {
        totalStalls: 275,
        booked: bookedCount,
        available: Math.max(0, 275 - bookedCount)
      };

      const totalIncomeCash = breakdown.dailyStall.cash + breakdown.monthly.cash + breakdown.klongthom.cash + breakdown.storage.cash + breakdown.otherIncome.cash;
      const totalIncomeTransfer = breakdown.dailyStall.transfer + breakdown.monthly.transfer + breakdown.klongthom.transfer + breakdown.storage.transfer + breakdown.otherIncome.transfer;
      const totalIncomeAll = totalIncomeCash + totalIncomeTransfer;

      const allExpenseItems = [...expenseItems, ...carryForwardItems.filter(i => i.isCarryForward && i.type === 'expense')];

      const summary = {
        date: selectedDate,
        suggestedFloat,
        carryForward: {
          cash: carryForwardCash,
          transfer: carryForwardTransfer,
          total: carryForwardCash + carryForwardTransfer,
          items: carryForwardItems
        },
        dailyStallIncome,
        monthlyIncome,
        klongthomIncome,
        storageIncome,
        otherIncome: otherIncTotal,
        totalIncome: totalIncomeAll,
        totalExpenses,
        netProfit: totalIncomeAll - totalExpenses,
        cashIn,
        transferIn,
        cashOut,
        transferOut,
        expectedCashInDrawer: cashIn - cashOut, // before float
        expenseItems: allExpenseItems,
        occupancy,
        transferTxnCount,
        breakdown: {
          ...breakdown,
          totalIncome: {
            cash: totalIncomeCash,
            transfer: totalIncomeTransfer,
            total: totalIncomeAll
          }
        },
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

      // 1. Insert/Update daily_closings table
      const { data, error } = await supabase.from('daily_closings').upsert([closingObj]).select();
      if (error) {
        console.warn('daily_closings table notice (saving local fallback):', error.message);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`daily_closing_${payload.date}`, JSON.stringify(closingObj));
        }
      }

      // 2. Stamp closing_id on closed transactions (gracefully attempts if column exists)
      try {
        const txnIdsToStamp = [];
        if (payload.summary?.expenseItems) {
          payload.summary.expenseItems.forEach(i => { if (i.id) txnIdsToStamp.push(i.id); });
        }
        if (payload.summary?.carryForward?.items) {
          payload.summary.carryForward.items.forEach(i => { if (i.id) txnIdsToStamp.push(i.id); });
        }

        if (txnIdsToStamp.length > 0) {
          await supabase
            .from('transactions')
            .update({ closing_id: closingObj.id })
            .in('id', txnIdsToStamp);
        }

        // Also stamp transactions on this date
        await supabase
          .from('transactions')
          .update({ closing_id: closingObj.id })
          .eq('date', payload.date);
      } catch (stampErr) {
        // Safe ignore if closing_id column does not exist yet
      }

      // 3. Update in-memory closedDates set immediately
      setClosedDates(prev => {
        const next = new Set(prev);
        next.add(payload.date);
        return next;
      });

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
        category: formData.category || 'อื่นๆ',
        description: formData.description?.trim() || '',
        note: formData.description?.trim() || '',
        total_amount: parseFloat(formData.amount) || 0,
        method: formData.method || 'โอนเงิน',
        officer: officerName,
        bill_type: 'รายรับ',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Insert into unified transactions table
      const { error } = await supabase.from('transactions').insert([payloadTxn]);
      if (error) throw error;

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
        category: formData.category || 'อื่นๆ',
        description: formData.item?.trim() || '',
        note: formData.item?.trim() || '',
        total_amount: parseFloat(formData.amount) || 0,
        method: formData.method || 'โอนเงิน',
        officer: officerName,
        bill_type: 'รายจ่าย',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Insert into unified transactions table
      const { error } = await supabase.from('transactions').insert([payloadTxn]);
      if (error) throw error;

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
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
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
