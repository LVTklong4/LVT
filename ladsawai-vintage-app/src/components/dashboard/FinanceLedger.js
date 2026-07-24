'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useDashboard } from '@/context/DashboardContext';
import { Trash2, Plus, Search, Filter, Calendar, TrendingUp, TrendingDown, Loader2, RefreshCw, X, AlertCircle, Lock } from 'lucide-react';
import DailyClosingModal from './DailyClosingModal';

export default function FinanceLedger() {
  const { 
    incomeList, 
    expenseList, 
    loading: loadingFinance, 
    fetchFinanceData, 
    addIncome, 
    addExpense, 
    deleteIncome, 
    deleteExpense 
  } = useFinance();

  const { calculateDashboard } = useDashboard();

  // Daily Closing Modal state
  const [showDailyClosingModal, setShowDailyClosingModal] = useState(false);

  // Local state for tabs
  const [activeTab, setActiveTab] = useState('income'); // 'income' or 'expense'

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [methodFilter, setMethodFilter] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ค่าปรับ',
    description: '',
    amount: '',
    method: 'โอนเงิน'
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ค่าจ้างพนักงาน',
    item: '',
    amount: '',
    method: 'โอนเงิน'
  });

  // Fetch data on filter change
  const loadData = useCallback(() => {
    fetchFinanceData({
      startDate,
      endDate,
      category: categoryFilter,
      method: methodFilter,
      searchQuery
    });
  }, [fetchFinanceData, startDate, endDate, categoryFilter, methodFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form submission handlers
  const handleAddIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || !incomeForm.description.trim()) {
      alert('กรุณากรอกข้อมูลจำนวนเงินและรายละเอียดให้ครบถ้วน');
      return;
    }

    const res = await addIncome(incomeForm, 'Admin');
    if (res.success) {
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        category: 'ค่าปรับ',
        description: '',
        amount: '',
        method: 'โอนเงิน'
      });
      loadData();
      calculateDashboard(); // refresh dashboard KPIs
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกรายรับ: ' + res.error.message);
    }
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.item.trim()) {
      alert('กรุณากรอกข้อมูลจำนวนเงินและรายการรายจ่ายให้ครบถ้วน');
      return;
    }

    const res = await addExpense(expenseForm, 'Admin');
    if (res.success) {
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        category: 'ค่าจ้างพนักงาน',
        item: '',
        amount: '',
        method: 'โอนเงิน'
      });
      loadData();
      calculateDashboard(); // refresh dashboard KPIs
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย: ' + res.error.message);
    }
  };

  // Delete handlers
  const handleDeleteItem = async (id, type) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การลบไม่สามารถย้อนกลับได้')) return;

    let res;
    if (type === 'income') {
      res = await deleteIncome(id);
    } else {
      res = await deleteExpense(id);
    }

    if (res.success) {
      loadData();
      calculateDashboard(); // refresh dashboard KPIs
    } else {
      alert('ไม่สามารถลบรายการได้: ' + res.error.message);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('ทั้งหมด');
    setMethodFilter('ทั้งหมด');
    setSearchQuery('');
  };

  // Category Options
  const incomeCategories = ['ค่าปรับ', 'เงินประกัน/มัดจำ', 'รายได้เบ็ดเตล็ด', 'ค่าบริการอื่นๆ', 'อื่นๆ'];
  const expenseCategories = [
    'ค่าจ้างพนักงาน', 'เงินเดือนพนักงาน', 'ค่าล่วงเวลา (OT)', 'สวัสดิการพนักงาน', 'โบนัส/เงินพิเศษ',
    'ค่าน้ำส่วนกลาง', 'ค่าไฟส่วนกลาง', 'ค่ากำจัดขยะ', 'ค่าซ่อมบำรุง', 'ค่าการตลาด', 
    'ค่ารักษาความปลอดภัย (รปภ.)', 'วัสดุสำนักงาน', 'ภาษีและค่าธรรมเนียม', 'อื่นๆ'
  ];

  // Calculations for display list
  const currentList = activeTab === 'income' ? incomeList : expenseList;
  const listTotalAmount = currentList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-5 shadow-sm flex flex-col gap-5">
      
      {/* Tab Switcher & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-base md:text-lg font-extrabold text-gray-800 flex items-center gap-2">
            บันทึกการเงินและสมุดบัญชี (General Ledger)
          </h2>
          <p className="text-[10px] md:text-xs text-gray-500 font-bold">
            ระบบบันทึกรายรับเบ็ดเตล็ด รายจ่ายบริหาร และค่าจ้างพนักงานรายวัน/ประจำ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={() => setShowDailyClosingModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-emerald-300" />
            <span>🔒 ปิดยอดประจำวัน</span>
          </button>

          <div className="flex bg-[#FDF5E6] p-1 rounded-lg border border-[#8B4513]/20 flex-1 md:flex-initial">
            <button
              onClick={() => { setActiveTab('income'); handleResetFilters(); }}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'income' 
                  ? 'bg-emerald-700 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-emerald-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>รายรับอื่นๆ</span>
            </button>
            <button
              onClick={() => { setActiveTab('expense'); handleResetFilters(); }}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'expense' 
                  ? 'bg-red-700 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-red-700'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>รายจ่ายทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form and Filter section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transaction Input Form */}
        <div className="lg:col-span-1 border-r border-[#8B4513]/10 pr-0 lg:pr-6">
          {activeTab === 'income' ? (
            <form onSubmit={handleAddIncomeSubmit} className="flex flex-col gap-3.5 bg-emerald-50/20 p-4 border border-emerald-200 rounded-lg">
              <h3 className="font-extrabold text-xs text-emerald-950 border-b pb-1 flex items-center gap-1">
                📥 เพิ่มรายการรายรับอื่นๆ
              </h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">วันที่ทำรายการ</label>
                <input 
                  type="date" 
                  value={incomeForm.date} 
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  className="p-2 border border-emerald-300 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">หมวดหมู่รายรับ</label>
                <select 
                  value={incomeForm.category} 
                  onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                  className="p-2 border border-emerald-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {incomeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">รายละเอียดรายรับ *</label>
                <input 
                  type="text" 
                  value={incomeForm.description} 
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  placeholder="เช่น ค่าปรับถังขยะแผง A12"
                  className="p-2 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white" 
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">จำนวนเงิน (บาท) *</label>
                <input 
                  type="number" 
                  value={incomeForm.amount} 
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  placeholder="0.00"
                  min="0.01"
                  step="any"
                  className="p-2 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white font-bold" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">ช่องทางการชำระเงิน</label>
                <select 
                  value={incomeForm.method} 
                  onChange={(e) => setIncomeForm({ ...incomeForm, method: e.target.value })}
                  className="p-2 border border-emerald-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เงินสด">เงินสด</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loadingFinance}
                className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {loadingFinance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                บันทึกรายรับ
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddExpenseSubmit} className="flex flex-col gap-3.5 bg-red-50/20 p-4 border border-red-200 rounded-lg">
              <h3 className="font-extrabold text-xs text-red-950 border-b pb-1 flex items-center gap-1">
                📤 เพิ่มรายการรายจ่าย
              </h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">วันที่ทำรายการ</label>
                <input 
                  type="date" 
                  value={expenseForm.date} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="p-2 border border-red-300 rounded text-xs bg-white focus:ring-1 focus:ring-red-500" 
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">หมวดหมู่รายจ่าย</label>
                <select 
                  value={expenseForm.category} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="p-2 border border-red-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">รายการจ่าย/คำอธิบาย *</label>
                <input 
                  type="text" 
                  value={expenseForm.item} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                  placeholder="เช่น ค่าแรงรายวัน นายกมล (รปภ.)"
                  className="p-2 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 bg-white" 
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">จำนวนเงินจ่าย (บาท) *</label>
                <input 
                  type="number" 
                  value={expenseForm.amount} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                  min="0.01"
                  step="any"
                  className="p-2 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 bg-white font-bold" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">วิธีการจ่ายเงิน</label>
                <select 
                  value={expenseForm.method} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, method: e.target.value })}
                  className="p-2 border border-red-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เงินสด">เงินสด</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loadingFinance}
                className="w-full mt-2 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {loadingFinance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                บันทึกรายจ่าย
              </button>
            </form>
          )}
        </div>

        {/* Filter bar and Ledger list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Filters Dashboard */}
          <div className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-800" /> ฟิลเตอร์คัดกรองข้อมูล
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> ล้างตัวกรอง
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-500 font-bold">วันที่เริ่มต้น</span>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-1.5 border border-amber-200 rounded text-[10px] bg-white"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-500 font-bold">วันที่สิ้นสุด</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-1.5 border border-amber-200 rounded text-[10px] bg-white"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-500 font-bold">หมวดหมู่</span>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="p-1.5 border border-amber-200 rounded text-[10px] bg-white focus:outline-none"
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  {(activeTab === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-500 font-bold">การจ่ายเงิน</span>
                <select 
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="p-1.5 border border-amber-200 rounded text-[10px] bg-white focus:outline-none"
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="โอนเงิน">โอนเงิน</option>
                  <option value="เงินสด">เงินสด</option>
                </select>
              </div>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารายละเอียด หรือชื่อผู้บันทึก..."
                className="w-full pl-8 pr-3 py-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-600">
                พบทั้งหมด {currentList.length} รายการ | ยอดรวมในตาราง: <strong className={activeTab === 'income' ? 'text-emerald-700' : 'text-red-700'}>{listTotalAmount.toLocaleString()} ฿</strong>
              </span>
              <button 
                onClick={loadData}
                className="p-1 border hover:bg-amber-50 rounded-lg text-gray-500 transition-colors"
                title="รีเฟรชรายการ"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-inner flex-1 flex flex-col bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className={`border-b font-extrabold uppercase ${
                    activeTab === 'income' ? 'bg-emerald-50/50 text-emerald-950' : 'bg-red-50/40 text-red-950'
                  }`}>
                    <tr>
                      <th className="p-3">วันที่</th>
                      <th className="p-3">หมวดหมู่</th>
                      <th className="p-3">รายการ/คำอธิบาย</th>
                      <th className="p-3 text-right">จำนวนเงิน</th>
                      <th className="p-3 text-center">วิธีชำระ</th>
                      <th className="p-3">ผู้บันทึก</th>
                      <th className="p-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-gray-700">
                    {loadingFinance ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-800 mb-2" />
                          <span>กำลังดึงข้อมูลบัญชี...</span>
                        </td>
                      </tr>
                    ) : currentList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400 font-bold">
                          <AlertCircle className="w-6 h-6 mx-auto text-amber-800/30 mb-2" />
                          <span>ไม่พบรายการที่ตรงกับฟิลเตอร์ตัวกรอง</span>
                        </td>
                      </tr>
                    ) : (
                      currentList.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/10">
                          <td className="p-3 whitespace-nowrap">{item.date}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              activeTab === 'income' 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                : 'bg-red-100 text-red-900 border border-red-200'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 max-w-[180px] break-words">
                            {activeTab === 'income' ? item.description : item.item}
                          </td>
                          <td className={`p-3 text-right font-black ${
                            activeTab === 'income' ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {activeTab === 'income' ? '+' : '-'}{item.amount.toLocaleString()}.-
                          </td>
                          <td className="p-3 text-center text-[10px] text-gray-500">{item.method}</td>
                          <td className="p-3 text-[10px] text-gray-500 whitespace-nowrap">{item.officer}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id, activeTab)}
                              className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Daily Closing Modal */}
      <DailyClosingModal 
        isOpen={showDailyClosingModal}
        onClose={() => setShowDailyClosingModal(false)}
      />

    </div>
  );
}
