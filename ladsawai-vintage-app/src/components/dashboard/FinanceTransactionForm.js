'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Plus, Loader2 } from 'lucide-react';

export const incomeCategories = ['ค่าปรับ', 'เงินประกัน/มัดจำ', 'รายได้เบ็ดเตล็ด', 'ค่าบริการอื่นๆ', 'อื่นๆ'];
export const expenseCategories = [
  'ค่าจ้างพนักงาน', 'เงินเดือนพนักงาน', 'ค่าล่วงเวลา (OT)', 'สวัสดิการพนักงาน', 'โบนัส/เงินพิเศษ',
  'ค่าน้ำส่วนกลาง', 'ค่าไฟส่วนกลาง', 'ค่ากำจัดขยะ', 'ค่าซ่อมบำรุง', 'ค่าการตลาด', 
  'ค่ารักษาความปลอดภัย (รปภ.)', 'วัสดุสำนักงาน', 'ภาษีและค่าธรรมเนียม', 'อื่นๆ'
];

export default function FinanceTransactionForm({ activeTab, onSuccess }) {
  const { 
    loading: loadingFinance, 
    addIncome, 
    addExpense, 
    isDateClosed 
  } = useFinance();

  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ค่าปรับ',
    description: '',
    amount: '',
    method: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'ค่าจ้างพนักงาน',
    item: '',
    amount: '',
    method: ''
  });

  const handleAddIncomeSubmit = async (e) => {
    e.preventDefault();
    if (isDateClosed(incomeForm.date)) {
      alert(`⚠️ วันที่ ${incomeForm.date} ได้ทำการปิดยอดประจำวันเรียบร้อยแล้ว ข้อมูลถูกล็อคไม่สามารถเพิ่มรายการได้`);
      return;
    }
    if (!incomeForm.amount || !incomeForm.description.trim()) {
      alert('กรุณากรอกข้อมูลจำนวนเงินและรายละเอียดให้ครบถ้วน');
      return;
    }
    if (!incomeForm.method) {
      alert('⚠️ กรุณาเลือกช่องทางการชำระเงิน (โอนเงิน หรือ เงินสด)');
      return;
    }

    const res = await addIncome(incomeForm, 'Admin');
    if (res.success) {
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        category: 'ค่าปรับ',
        description: '',
        amount: '',
        method: ''
      });
      if (onSuccess) onSuccess();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกรายรับ: ' + res.error.message);
    }
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (isDateClosed(expenseForm.date)) {
      alert(`⚠️ วันที่ ${expenseForm.date} ได้ทำการปิดยอดประจำวันเรียบร้อยแล้ว ข้อมูลถูกล็อคไม่สามารถเพิ่มรายการได้`);
      return;
    }
    if (!expenseForm.amount || !expenseForm.item.trim()) {
      alert('กรุณากรอกข้อมูลจำนวนเงินและรายการรายจ่ายให้ครบถ้วน');
      return;
    }
    if (!expenseForm.method) {
      alert('⚠️ กรุณาเลือกวิธีการจ่ายเงิน (โอนเงิน หรือ เงินสด)');
      return;
    }

    const res = await addExpense(expenseForm, 'Admin');
    if (res.success) {
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        category: 'ค่าจ้างพนักงาน',
        item: '',
        amount: '',
        method: ''
      });
      if (onSuccess) onSuccess();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย: ' + res.error.message);
    }
  };

  return (
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-700">ช่องทางการชำระเงิน *</label>
              {!incomeForm.method && (
                <span className="text-[9px] text-amber-600 font-semibold animate-pulse">
                  * กรุณาเลือก
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'โอนเงิน', label: 'โอนเงิน', icon: '📲' },
                { id: 'เงินสด', label: 'เงินสด', icon: '💵' }
              ].map((opt) => {
                const isSelected = incomeForm.method === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIncomeForm({ ...incomeForm, method: opt.id })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-emerald-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-emerald-600 bg-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </span>
                    <span>{opt.icon} {opt.label}</span>
                  </button>
                );
              })}
            </div>
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-700">วิธีการจ่ายเงิน *</label>
              {!expenseForm.method && (
                <span className="text-[9px] text-amber-600 font-semibold animate-pulse">
                  * กรุณาเลือก
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'โอนเงิน', label: 'โอนเงิน', icon: '📲' },
                { id: 'เงินสด', label: 'เงินสด', icon: '💵' }
              ].map((opt) => {
                const isSelected = expenseForm.method === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, method: opt.id })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-red-50 border-red-600 text-red-900 ring-1 ring-red-600 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-red-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-red-600 bg-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                    </span>
                    <span>{opt.icon} {opt.label}</span>
                  </button>
                );
              })}
            </div>
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
  );
}
