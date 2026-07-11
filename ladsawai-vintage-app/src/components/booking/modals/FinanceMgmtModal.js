'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Loader2, X } from 'lucide-react';

export default function FinanceMgmtModal() {
  const {
    expenseForm,    expenseList,    financeTab,    handleAddExpense,    handleAddIncome,    incomeForm,    incomeList,    loadingFinance,    setExpenseForm,    setFinanceTab,    setIncomeForm,    setShowFinanceMgmtModal,    showFinanceMgmtModal
  } = useBooking();

  if (!showFinanceMgmtModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-emerald-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">💸 บันทึกรายรับ/รายจ่ายตลาด (Other Income & Expenses)</h3>
              <button onClick={() => setShowFinanceMgmtModal(false)} className="text-emerald-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Tabs Selector */}
            <div className="flex border-b bg-emerald-50/40 shrink-0">
              <button 
                onClick={() => setFinanceTab('income')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
                  financeTab === 'income' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                📥 บันทึกรายได้อื่นๆ (Other Income)
              </button>
              <button 
                onClick={() => setFinanceTab('expense')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
                  financeTab === 'expense' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                📤 บันทึกรายจ่าย (Expenses)
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Form panel based on tab */}
              {financeTab === 'income' ? (
                <form onSubmit={handleAddIncome} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-emerald-50/20 p-4 border border-emerald-200 rounded-lg">
                  <h4 className="font-bold text-xs text-emerald-950 border-b pb-1">เพิ่มรายการรายได้อื่น ๆ</h4>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่ทำรายการ</label>
                    <input 
                      type="date" 
                      value={incomeForm.date} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                      className="p-1.5 border border-emerald-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">หมวดหมู่รายได้</label>
                    <select 
                      value={incomeForm.category} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                      className="p-1.5 border border-emerald-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="ค่าปรับ">ค่าปรับ</option>
                      <option value="ดอกเบี้ย">ดอกเบี้ย</option>
                      <option value="รายได้ฝากของ">รายได้ฝากของ</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">รายละเอียด *</label>
                    <input 
                      type="text" 
                      value={incomeForm.description} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                      placeholder="เช่น ค่าปรับขยะล็อค F1"
                      className="p-1.5 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">จำนวนเงิน (บาท) *</label>
                    <input 
                      type="number" 
                      value={incomeForm.amount} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="จำนวนเงินเป็นตัวเลข"
                      className="p-1.5 border border-emerald-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white text-center" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วิธีการชำระ</label>
                    <select 
                      value={incomeForm.method} 
                      onChange={(e) => setIncomeForm({ ...incomeForm, method: e.target.value })}
                      className="p-1.5 border border-emerald-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="โอนเงิน">โอนเงิน</option>
                      <option value="เงินสด">เงินสด</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-all shadow"
                  >
                    บันทึกรายรับ
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddExpense} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-red-50/30 p-4 border border-red-200 rounded-lg">
                  <h4 className="font-bold text-xs text-red-950 border-b pb-1">เพิ่มรายการรายจ่าย</h4>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่ทำรายการ</label>
                    <input 
                      type="date" 
                      value={expenseForm.date} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="p-1.5 border border-red-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">หมวดหมู่รายจ่าย</label>
                    <select 
                      value={expenseForm.category} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="p-1.5 border border-red-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="ค่าน้ำค่าไฟ">ค่าน้ำค่าไฟ</option>
                      <option value="ค่าจ้าง">ค่าจ้างพนักงาน</option>
                      <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
                      <option value="ค่าขยะ">ค่ากำจัดขยะ</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">รายการรายจ่าย *</label>
                    <input 
                      type="text" 
                      value={expenseForm.item} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                      placeholder="เช่น ซื้อหลอดไฟทางเดิน"
                      className="p-1.5 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 bg-white" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">จำนวนเงิน (บาท) *</label>
                    <input 
                      type="number" 
                      value={expenseForm.amount} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="จำนวนเงินจ่าย"
                      className="p-1.5 border border-red-300 rounded text-xs focus:ring-1 focus:ring-red-500 bg-white text-center" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วิธีการจ่ายเงิน</label>
                    <select 
                      value={expenseForm.method} 
                      onChange={(e) => setExpenseForm({ ...expenseForm, method: e.target.value })}
                      className="p-1.5 border border-red-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="โอนเงิน">โอนเงิน</option>
                      <option value="เงินสด">เงินสด</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full mt-2 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition-all shadow"
                  >
                    บันทึกรายจ่าย
                  </button>
                </form>
              )}

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>รายการบันทึก {financeTab === 'income' ? 'รายรับอื่นๆ' : 'รายจ่าย'} ล่าสุด</span>
                  {loadingFinance && <Loader2 className="w-4 h-4 text-emerald-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className={`border-b font-bold ${financeTab === 'income' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                      <tr>
                        <th className="p-2">วันที่</th>
                        <th className="p-2">หมวดหมู่</th>
                        <th className="p-2">รายละเอียด/รายการ</th>
                        <th className="p-2 text-right">จำนวนเงิน</th>
                        <th className="p-2 text-center">วิธีจ่าย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {financeTab === 'income' ? (
                        incomeList.map((item) => (
                          <tr key={item.id} className="hover:bg-emerald-50/10">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2 font-bold text-emerald-800">{item.category}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-right font-extrabold text-emerald-800">+{item.amount.toLocaleString()}.-</td>
                            <td className="p-2 text-center text-[10px] font-semibold text-gray-500">{item.method}</td>
                          </tr>
                        ))
                      ) : (
                        expenseList.map((item) => (
                          <tr key={item.id} className="hover:bg-red-50/10">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2 font-bold text-red-800">{item.category}</td>
                            <td className="p-2">{item.item}</td>
                            <td className="p-2 text-right font-extrabold text-red-800">-{item.amount.toLocaleString()}.-</td>
                            <td className="p-2 text-center text-[10px] font-semibold text-gray-500">{item.method}</td>
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
  );
}
