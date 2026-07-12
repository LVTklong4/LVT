'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalIncome: 0, totalExpense: 0, netProfit: 0, cashIn: 0, transferIn: 0, cashOut: 0, transferOut: 0 },
    stats: { totalStalls: 0, occupied: 0, foodCount: 0, clothesCount: 0, dailyCount: 0, monthlyCount: 0, dailyFoodCount: 0, dailyClothesCount: 0, monthlyFoodCount: 0, monthlyClothesCount: 0 },
    analytics: { debtRisks: [], primeCustomers: [], bookingInsights: [], financeInsights: [], forecast: 0 }
  });

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      calculateDashboard();
    }
  }, [selectedDate]);

  const calculateDashboard = async () => {
    setLoading(true);
    try {
      // 1. Get stalls mapping
      const { data: stalls, error: stallErr } = await supabase.from('stalls').select('*');
      if (stallErr) throw stallErr;
      
      const totalStallsCount = stalls?.filter(s => s.type !== 'ทางเดิน' && s.type !== 'อื่นๆ').length || 0;

      // 2. Get bookings for selected date
      const { data: bookings, error: bookErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', selectedDate);
      if (bookErr) throw bookErr;

      // Determine zone statistics
      let occupiedCount = 0;
      let zoneStats = { dailyFood: 0, dailyClothes: 0, monthlyFood: 0, monthlyClothes: 0 };
      
      bookings?.forEach(b => {
        const stall = stalls?.find(s => s.name === b.stall_name);
        if (stall && stall.type !== 'ทางเดิน' && stall.type !== 'อื่นๆ' && b.status !== 'ลา') {
          occupiedCount++;
          const isFood = stall.type.includes('อาหาร') || (b.product && b.product.includes('อาหาร'));
          const isDaily = b.type === 'รายวัน';
          
          if (isDaily) {
            if (isFood) zoneStats.dailyFood++; else zoneStats.dailyClothes++;
          } else {
            if (isFood) zoneStats.monthlyFood++; else zoneStats.monthlyClothes++;
          }
        }
      });

      // 3. Get transactions for selected date
      const { data: txns, error: txnErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('date', selectedDate);
      if (txnErr) throw txnErr;

      // 4. Get other income for selected date
      const { data: otherIncome, error: incErr } = await supabase
        .from('other_income')
        .select('*')
        .eq('date', selectedDate);
      if (incErr) throw incErr;

      // 5. Get expenses for selected date
      const { data: expenses, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('date', selectedDate);
      if (expErr) throw expErr;

      // Compile financial summary
      let totalIncome = 0;
      let totalExpense = 0;
      let cashIn = 0;
      let transferIn = 0;
      let cashOut = 0;
      let transferOut = 0;

      txns?.forEach(t => {
        const amt = parseFloat(t.total_amount) || 0;
        totalIncome += amt;
        if (t.method === 'Cash' || t.method === 'เงินสด') cashIn += amt; else transferIn += amt;
      });

      otherIncome?.forEach(inc => {
        const amt = parseFloat(inc.amount) || 0;
        totalIncome += amt;
        if (inc.method === 'Cash' || inc.method === 'เงินสด') cashIn += amt; else transferIn += amt;
      });

      expenses?.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        totalExpense += amt;
        if (exp.method === 'Cash' || exp.method === 'เงินสด') cashOut += amt; else transferOut += amt;
      });

      // 6. Get all monthly bookings and transaction histories for advanced debt and prime customer analysis
      const { data: allMonthly, error: mErr } = await supabase.from('monthly_bookings').select('*');
      if (mErr) throw mErr;

      const { data: allTxns, error: allTxnErr } = await supabase.from('transactions').select('*');
      if (allTxnErr) throw allTxnErr;

      // Map transactions to booking ID
      const txMap = {};
      allTxns?.forEach(t => {
        const ref = t.booking_ref;
        if (ref) {
          if (!txMap[ref]) txMap[ref] = { totalPaid: 0, history: [] };
          const amt = parseFloat(t.total_amount) || 0;
          txMap[ref].totalPaid += amt;
          txMap[ref].history.push({ date: t.date, amount: amt });
        }
      });

      // Calculate Debt Risks
      const dateObj = new Date(selectedDate);
      const currentMonthIndex = dateObj.getMonth();
      const currentYear = dateObj.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
      const today = new Date();
      const currentDayNum = today.getDate();
      
      const deadlineDay = 20;
      let daysRemaining = deadlineDay - currentDayNum;
      
      if (dateObj.getMonth() !== today.getMonth() || dateObj.getFullYear() !== today.getFullYear()) {
        daysRemaining = dateObj.getTime() < today.getTime() ? -99 : deadlineDay;
      }

      const debtRisks = [];
      const currentMonthName = dateObj.toLocaleDateString('th-TH', { month: 'long' });
      const currentYearTH = String(currentYear + 543);

      allMonthly?.forEach(row => {
        const mStr = String(row.booking_month || "");
        let isMatch = false;
        
        if (mStr.includes(currentMonthName) && mStr.includes(currentYearTH)) {
          isMatch = true;
        } else if (row.start_date) {
          const sDate = new Date(row.start_date);
          if (sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonthIndex) {
            isMatch = true;
          }
        }

        if (isMatch) {
          const bookingId = row.id;
          const realPaid = txMap[bookingId] ? txMap[bookingId].totalPaid : 0;
          const total = parseFloat(row.total_price) || 0;
          const debt = total - realPaid;
          
          if ((row.status && row.status.includes('ค้าง')) || debt > 1) {
            if (row.customer_type !== 'Regular' && debt > 0) {
              // Calculate Risk score & percent
              let safeDays = Math.max(0, daysRemaining);
              let riskScore = debt * (1 + (10 / (safeDays + 1)));

              let timeRatio = daysRemaining < 0 ? 1.2 : Math.min(1, currentDayNum / deadlineDay);
              const timeScore = timeRatio * 50;
              
              let debtRatio = Math.min(1, debt / total);
              const debtScore = debtRatio * 40;

              const sundayScore = today.getDay() === 0 ? 10 : 0;
              const penaltyScore = (currentDayNum > 10 && realPaid === 0) ? 10 : 0;

              let milestonePenalty = 0;
              let milestoneText = "";
              const paidPercentVal = (realPaid / total) * 100;

              if (currentDayNum > 21) {
                if (paidPercentVal < 95) { milestonePenalty = 40; milestoneText = " + ตกเกณฑ์ W3"; }
              } else if (currentDayNum > 14) {
                if (paidPercentVal < 55) { milestonePenalty = 20; milestoneText = " + ตกเกณฑ์ W2"; }
              } else if (currentDayNum > 7) {
                if (paidPercentVal < 35) { milestonePenalty = 10; milestoneText = " + ตกเกณฑ์ W1"; }
              }

              let riskPercent = Math.round(timeScore + debtScore + sundayScore + penaltyScore + milestonePenalty);
              if (daysRemaining < 0) riskPercent = 98; // Past 20th overdue
              riskPercent = Math.min(100, riskPercent);

              const paidPercent = Math.round((realPaid / total) * 100);

              debtRisks.push({
                id: bookingId,
                name: `${row.booker_name} (${row.product || '-'})`,
                stalls: row.stalls,
                total: total,
                paid: realPaid,
                debt: debt,
                daysLeft: daysRemaining < 0 ? "เลยกำหนด" : daysRemaining,
                riskPercent: riskPercent,
                paidPercent: paidPercent,
                riskBreakdown: `เวลา(${Math.round(timeScore)}) + หนี้(${Math.round(debtScore)})${milestoneText}`
              });
            }
          }
        }
      });

      // Sort debt risks
      debtRisks.sort((a, b) => b.riskPercent - a.riskPercent);

      // Prime Customers (paid early before 5th)
      const primeCustomers = [];
      allMonthly?.filter(row => row.customer_type === 'Standard').forEach(row => {
        let earlyPaid = 0;
        const history = txMap[row.id]?.history || [];
        history.forEach(txn => {
          const txnDay = new Date(txn.date).getDate();
          if (txnDay <= 5) {
            earlyPaid += txn.amount;
          }
        });

        if (earlyPaid > 0) {
          primeCustomers.push({
            name: row.booker_name,
            totalPaid: txMap[row.id]?.totalPaid || 0,
            stalls: row.stalls,
            earlyPaid
          });
        }
      });

      primeCustomers.sort((a, b) => b.earlyPaid - a.earlyPaid);

      // Forecast
      const forecast = totalIncome * daysInMonth;

      // Booking Insights
      const bookingInsights = [];
      const occRate = totalStallsCount > 0 ? (occupiedCount / totalStallsCount * 100) : 0;
      if (occRate > 80) {
        bookingInsights.push(`อัตราการจองล็อคสูงมาก (${occRate.toFixed(1)}%) เป็นสัญญาณบวกสำหรับตลาด!`);
      } else if (occRate < 40) {
        bookingInsights.push(`อัตราการจองต่ำผิดปกติ (${occRate.toFixed(1)}%) กรุณาติดตามสาเหตุ`);
      } else {
        bookingInsights.push(`อัตราการจองปัจจุบันอยู่ที่ ${occRate.toFixed(1)}%`);
      }

      // Finance Insights
      const financeInsights = [];
      if (totalIncome === 0) {
        financeInsights.push("ไม่มีข้อมูลรายได้ในวันนี้");
      } else {
        financeInsights.push(`รายได้รวมวันนี้ ${totalIncome.toLocaleString()} บาท`);
      }
      if (debtRisks.length > 0) {
        financeInsights.push(`มีลูกค้ารายเดือนค้างชำระทั้งหมด ${debtRisks.length} รายการที่ต้องเร่งรัดติดตาม`);
      }

      setData({
        summary: {
          totalIncome,
          totalExpense,
          netProfit: totalIncome - totalExpense,
          cashIn,
          transferIn,
          cashOut,
          transferOut
        },
        stats: {
          totalStalls: totalStallsCount,
          occupied: occupiedCount,
          foodCount: zoneStats.dailyFood + zoneStats.monthlyFood,
          clothesCount: zoneStats.dailyClothes + zoneStats.monthlyClothes,
          dailyCount: zoneStats.dailyFood + zoneStats.dailyClothes,
          monthlyCount: zoneStats.monthlyFood + zoneStats.monthlyClothes,
          dailyFoodCount: zoneStats.dailyFood,
          dailyClothesCount: zoneStats.dailyClothes,
          monthlyFoodCount: zoneStats.monthlyFood,
          monthlyClothesCount: zoneStats.monthlyClothes
        },
        analytics: {
          debtRisks: debtRisks.slice(0, 5),
          primeCustomers: primeCustomers.slice(0, 5),
          bookingInsights,
          financeInsights,
          forecast
        }
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContext.Provider value={{
      selectedDate,
      setSelectedDate,
      loading,
      data,
      calculateDashboard
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
