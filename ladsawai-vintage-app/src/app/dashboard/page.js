'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  AlertTriangle, 
  Award, 
  Lightbulb, 
  Calendar,
  Layers,
  ArrowRightLeft,
  Coins,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalIncome: 0, totalExpense: 0, netProfit: 0, cashIn: 0, transferIn: 0, cashOut: 0, transferOut: 0 },
    stats: { totalStalls: 0, occupied: 0, foodCount: 0, clothesCount: 0, dailyCount: 0, monthlyCount: 0, dailyFoodCount: 0, dailyClothesCount: 0, monthlyFoodCount: 0, monthlyClothesCount: 0 },
    analytics: { debtRisks: [], primeCustomers: [], insights: [], forecast: 0 }
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

      // Insights list
      const insights = [];
      if (totalIncome === 0) {
        insights.push("ไม่มีข้อมูลรายได้ในวันนี้");
      } else {
        insights.push(`รายได้รวมวันนี้ ${totalIncome.toLocaleString()} บาท`);
      }
      
      const occRate = totalStallsCount > 0 ? (occupiedCount / totalStallsCount * 100) : 0;
      if (occRate > 80) {
        insights.push(`อัตราการจองล็อคสูงมาก (${occRate.toFixed(1)}%) เป็นสัญญาณบวกสำหรับตลาด!`);
      } else if (occRate < 40) {
        insights.push(`อัตราการจองต่ำผิดปกติ (${occRate.toFixed(1)}%) กรุณาติดตามสาเหตุ`);
      } else {
        insights.push(`อัตราการจองปัจจุบันอยู่ที่ ${occRate.toFixed(1)}%`);
      }

      if (debtRisks.length > 0) {
        insights.push(`มีลูกค้ารายเดือนค้างชำระทั้งหมด ${debtRisks.length} รายการที่ต้องเร่งรัดติดตาม`);
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
          insights,
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
    <div className="min-h-screen bg-[#FDF5E6] py-6 px-4 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <a href="/" className="p-2 hover:bg-amber-100 rounded-full text-amber-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 leading-none">แดชบอร์ดบริหารตลาดนัด</h1>
              <p className="text-xs text-gray-500 font-bold mt-1">สรุปข้อมูลการจอง รายรับ-รายจ่าย และประมาณการหนี้สิน</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-amber-800 hidden sm:block" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 text-xs border border-amber-300 rounded-lg bg-white font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            <button 
              onClick={calculateDashboard}
              className="p-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors shadow"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-10 h-10 text-amber-800 animate-spin" />
            <span className="text-xs font-bold text-amber-900">กำลังประมวลผลข้อมูลแดชบอร์ดจาก Supabase...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">รายรับวันนี้</p>
                  <h3 className="text-lg md:text-xl font-extrabold text-green-700 mt-1">
                    {data.summary.totalIncome.toLocaleString()} ฿
                  </h3>
                  <span className="text-[9px] text-gray-400 font-semibold">โอน: {data.summary.transferIn.toLocaleString()} ฿ | เงินสด: {data.summary.cashIn.toLocaleString()} ฿</span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div>
              </div>

              <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">รายจ่ายวันนี้</p>
                  <h3 className="text-lg md:text-xl font-extrabold text-red-700 mt-1">
                    {data.summary.totalExpense.toLocaleString()} ฿
                  </h3>
                  <span className="text-[9px] text-gray-400 font-semibold">โอน: {data.summary.transferOut.toLocaleString()} | เงินสด: {data.summary.cashOut.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-lg"><TrendingDown className="w-6 h-6 text-red-600" /></div>
              </div>

              <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">กำไรสุทธิวันนี้</p>
                  <h3 className={`text-lg md:text-xl font-extrabold mt-1 ${data.summary.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {data.summary.netProfit.toLocaleString()} ฿
                  </h3>
                  <span className="text-[9px] text-gray-400 font-semibold">รายรับหักรายจ่ายในวัน</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg"><DollarSign className="w-6 h-6 text-blue-600" /></div>
              </div>

              <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">อัตราการจองล็อค</p>
                  <h3 className="text-lg md:text-xl font-extrabold text-[#8B4513] mt-1">
                    {data.stats.totalStalls > 0 ? ((data.stats.occupied / data.stats.totalStalls) * 100).toFixed(1) : 0}%
                  </h3>
                  <span className="text-[9px] text-gray-400 font-semibold">จอง {data.stats.occupied} จากทั้งหมด {data.stats.totalStalls} ล็อค</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg"><Percent className="w-6 h-6 text-amber-700" /></div>
              </div>

            </div>

            {/* Core Analytics Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column: Stats and Risk List */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Zone statistics list */}
                <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm">
                  <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1">
                    <Layers className="w-5 h-5 text-amber-800" /> ข้อมูลเปรียบเทียบประเภทพื้นที่ (Zone Stats)
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-green-50/50 rounded-lg p-3 text-center border border-green-100">
                      <span className="text-[10px] text-gray-500 font-bold block">รายวันโซนอาหาร</span>
                      <strong className="text-base font-extrabold text-green-800 block mt-1">{data.stats.dailyFoodCount} ล็อค</strong>
                    </div>
                    <div className="bg-blue-50/50 rounded-lg p-3 text-center border border-blue-100">
                      <span className="text-[10px] text-gray-500 font-bold block">รายวันโซนเสื้อผ้า</span>
                      <strong className="text-base font-extrabold text-blue-800 block mt-1">{data.stats.dailyClothesCount} ล็อค</strong>
                    </div>
                    <div className="bg-purple-50/50 rounded-lg p-3 text-center border border-purple-100">
                      <span className="text-[10px] text-gray-500 font-bold block">รายเดือนโซนอาหาร</span>
                      <strong className="text-base font-extrabold text-purple-800 block mt-1">{data.stats.monthlyFoodCount} ล็อค</strong>
                    </div>
                    <div className="bg-amber-50/50 rounded-lg p-3 text-center border border-amber-100">
                      <span className="text-[10px] text-gray-500 font-bold block">รายเดือนโซนเสื้อผ้า</span>
                      <strong className="text-base font-extrabold text-amber-800 block mt-1">{data.stats.monthlyClothesCount} ล็อค</strong>
                    </div>
                  </div>

                  {/* Summary progress bars */}
                  <div className="mt-4 flex flex-col gap-3 border-t pt-3 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-gray-600">สัดส่วนล็อค (รายวัน vs รายเดือน)</span>
                      <span>รายวัน: {data.stats.dailyCount} | รายเดือน: {data.stats.monthlyCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-green-600 h-full" style={{ width: `${data.stats.dailyCount + data.stats.monthlyCount > 0 ? (data.stats.dailyCount / (data.stats.dailyCount + data.stats.monthlyCount)) * 100 : 50}%` }} />
                      <div className="bg-purple-600 h-full flex-1" />
                    </div>
                  </div>
                </div>

                {/* Overdue Debt Risk List */}
                <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm">
                  <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1">
                    <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" /> รายการค้างชำระเสี่ยงสูง (ลูกค้ารายเดือน)
                  </h3>
                  
                  {data.analytics.debtRisks.length === 0 ? (
                    <p className="text-xs text-green-700 font-bold p-4 text-center bg-green-50 rounded-lg">
                      ยอดเยี่ยม! ไม่มีรายการลูกค้ารายเดือนค้างชำระที่เสี่ยงสูงในเดือนนี้
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {data.analytics.debtRisks.map((item) => (
                        <div key={item.id} className="border border-gray-100 hover:border-amber-300 rounded-lg p-3 bg-amber-50/10 flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition-all">
                          <div>
                            <h4 className="font-bold text-xs md:text-sm text-gray-800">{item.name}</h4>
                            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                              เลขล็อค: {item.stalls} | ยอดบิล: {item.total.toLocaleString()} ฿ | จ่ายแล้ว: {item.paid.toLocaleString()} ฿ ({item.paidPercent}%)
                            </p>
                            <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold mt-1">
                              {item.riskBreakdown}
                            </span>
                          </div>

                          {/* Risk display badge */}
                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 font-bold block">ดัชนีความเสี่ยง</span>
                              <strong className={`text-sm md:text-base font-extrabold block ${
                                item.riskPercent >= 80 ? 'text-red-700' : item.riskPercent >= 50 ? 'text-yellow-700' : 'text-blue-700'
                              }`}>{item.riskPercent}%</strong>
                            </div>
                            <div className="w-12 bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full ${
                                item.riskPercent >= 80 ? 'bg-red-600' : item.riskPercent >= 50 ? 'bg-yellow-600' : 'bg-blue-600'
                              }`} style={{ width: `${item.riskPercent}%` }} />
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Insights & Forecast */}
              <div className="flex flex-col gap-6">
                
                {/* Prime early-paying Customers */}
                <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm">
                  <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-amber-600" /> ลูกค้าดีเด่น (จ่ายก่อนวันที่ 5)
                  </h3>
                  
                  {data.analytics.primeCustomers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">
                      ยังไม่พบข้อมูลลูกค้าชำระเงินก่อนวันที่ 5 ในรอบบิลนี้
                    </p>
                  ) : (
                    <div className="divide-y text-xs">
                      {data.analytics.primeCustomers.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center font-semibold text-gray-700">
                          <div>
                            <span className="font-bold text-[#8B4513]">{idx + 1}. {item.name}</span>
                            <span className="text-[10px] text-gray-500 block">ล็อค: {item.stalls}</span>
                          </div>
                          <div className="text-right">
                            <strong className="text-green-700">{item.earlyPaid.toLocaleString()} ฿</strong>
                            <span className="text-[9px] text-gray-400 block font-normal">ยอดรวม: {item.totalPaid.toLocaleString()} ฿</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Insights and tips */}
                <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm flex-1">
                  <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1.5">
                    <Lightbulb className="w-5 h-5 text-yellow-600" /> คำแนะนำ & ข้อมูลวิเคราะห์ (Insights)
                  </h3>
                  
                  <ul className="flex flex-col gap-3 text-xs">
                    {data.analytics.insights.map((insight, idx) => (
                      <li key={idx} className="flex gap-2 items-start bg-yellow-50/40 p-2.5 rounded-lg border border-yellow-100/60 font-semibold text-gray-700">
                        <span className="text-yellow-700 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Future Forecast */}
                  <div className="mt-5 border-t pt-4 text-xs">
                    <div className="flex items-center gap-1 font-bold text-gray-600">
                      <Clock className="w-4 h-4 text-amber-800" />
                      <span>ประมาณการรายรับรายเดือน</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">คำนวณจากยอดรายได้เฉลี่ยของวันนี้สะสมทั้งเดือน</p>
                    <strong className="text-base md:text-lg font-extrabold text-[#8B4513] block mt-2">
                      {data.analytics.forecast.toLocaleString()} บาท/เดือน
                    </strong>
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
