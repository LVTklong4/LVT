'use client';

import React, { useState } from 'react';
import { useKlongThom } from '@/context/KlongThomContext';
import { 
  ArrowLeft, Calendar, Loader2, DollarSign, Store, Users, CheckCircle2, 
  RefreshCw, AlertCircle, Printer, Plus, Trash2, FileText, CheckSquare, Coins
} from 'lucide-react';
import { printBatchKlongThomTickets } from '@/utils/klongthomReceiptPrinter';

export default function KlongThomBookingLayout() {
  const {
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
    handleDeleteRemittance
  } = useKlongThom();

  // Helper to format Date Code to Thai Buddhist Era YYMMDD
  const getThaiDateCode = (dateStr) => {
    if (!dateStr) return '######';
    const d = new Date(dateStr);
    const thaiYear = d.getFullYear() + 543;
    const yy = String(thaiYear).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  };

  const dateCode = getThaiDateCode(selectedDate);

  // Print Form Calculations
  const start = parseInt(printForm.startNo) || 1;
  const end = parseInt(printForm.endNo) || 0;
  const printCount = end >= start ? (end - start + 1) : 0;

  // Remit Form Calculations
  const cars = parseInt(remitForm.cars) || 0;
  const pricePerCar = parseFloat(remitForm.pricePerCar) || 0;
  const computedTotal = ticketType === 'main' ? (cars * pricePerCar) : 0;
  const targetTotal = ticketType === 'main' ? computedTotal : (parseFloat(remitForm.totalAmount) || 0);

  // Remit Payment List Sum
  const currentPaidSum = paymentList.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const isPaidMatched = targetTotal === currentPaidSum;

  const handlePrintSubmit = (e) => {
    e.preventDefault();
    if (printCount <= 0) {
      alert("กรุณาระบุหมายเลขสิ้นสุดให้ถูกต้อง");
      return;
    }
    printBatchKlongThomTickets({
      ticketType,
      dateStr: selectedDate,
      price: printForm.price,
      startNo: printForm.startNo,
      endNo: printForm.endNo
    }, adminUser);
  };

  const handleAddPaymentRow = () => {
    const remaining = targetTotal - currentPaidSum;
    const nextAmt = remaining > 0 ? remaining : '';
    setPaymentList([...paymentList, { method: 'เงินสด', amount: nextAmt }]);
  };

  const handleRemovePaymentRow = (idx) => {
    setPaymentList(paymentList.filter((_, i) => i !== idx));
  };

  const handlePaymentChange = (idx, field, value) => {
    const updated = [...paymentList];
    updated[idx][field] = value;
    setPaymentList(updated);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F7F4] text-gray-800 font-sans">
      
      {/* Toast Alert */}
      {alertInfo && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs transition-all duration-300 animate-bounce-in max-w-sm ${
          alertInfo.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {alertInfo.isError ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
          <div className="flex-1">
            <h4 className="font-bold">{alertInfo.title}</h4>
            <p className="font-semibold whitespace-pre-line">{alertInfo.message}</p>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-gray-400 hover:text-gray-600 font-bold shrink-0 cursor-pointer">×</button>
        </div>
      )}

      {/* Main Container Modal Mock-up */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-[#0F8A6B] overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
          
          {/* Header */}
          <div className="bg-[#0F8A6B] text-white px-4 py-3.5 flex justify-between items-center shrink-0">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              🚗 จัดการตั๋วคลองถม
            </h3>
            <button 
              type="button"
              onClick={() => window.location.href = '/'}
              className="text-white hover:text-emerald-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Date Selector Banner */}
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 shrink-0 flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              📅 วันที่ทำรายการ:
            </span>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-emerald-200 rounded px-2 py-0.5 font-mono font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#0F8A6B]"
            />
          </div>

          {/* Selector Ticket Type (Radio buttons) */}
          <div className="p-4 border-b border-gray-100 bg-[#FAFDFB] shrink-0 text-xs flex flex-col gap-2">
            <span className="font-bold text-gray-500">เลือกประเภทคลองถม:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-extrabold text-gray-700 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="ticketType" 
                  checked={ticketType === 'main'}
                  onChange={() => {
                    setTicketType('main');
                    // Reset inputs
                    setPaymentList([{ method: 'เงินสด', amount: '' }]);
                  }}
                  className="w-4 h-4 text-[#0F8A6B] focus:ring-[#0F8A6B] border-gray-300"
                />
                <span>คลองถม (หลัก)</span>
              </label>
              
              <label className="flex items-center gap-2 font-extrabold text-gray-700 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="ticketType" 
                  checked={ticketType === 'general'}
                  onChange={() => {
                    setTicketType('general');
                    // Reset inputs
                    setPaymentList([{ method: 'เงินสด', amount: '' }]);
                  }}
                  className="w-4 h-4 text-[#0F8A6B] focus:ring-[#0F8A6B] border-gray-300"
                />
                <span>คลองถมทั่วไป <span className="text-[10px] text-gray-400 font-normal">(ราคาไม่คงที่)</span></span>
              </label>
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="flex border-b bg-gray-50 shrink-0 text-xs">
            <button
              onClick={() => setActiveTab('print')}
              className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 ${
                activeTab === 'print' 
                  ? 'bg-white border-[#0F8A6B] text-[#0F8A6B]' 
                  : 'text-gray-500 border-transparent hover:bg-gray-100'
              }`}
            >
              🖨️ พิมพ์ตั๋วล่วงหน้า
            </button>
            <button
              onClick={() => setActiveTab('remit')}
              className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 ${
                activeTab === 'remit' 
                  ? 'bg-white border-[#0F8A6B] text-[#0F8A6B]' 
                  : 'text-gray-500 border-transparent hover:bg-gray-100'
              }`}
            >
              📊 สรุปยอด/ส่งเงิน
            </button>
          </div>

          {/* Form Scroll Area */}
          <div className="p-4 flex-1 overflow-y-auto text-xs flex flex-col gap-4 custom-scrollbar">
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center justify-center py-4 text-emerald-800 gap-1 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังประมวลผลข้อมูล...
              </div>
            )}

            {/* TAB 1: พิมพ์ตั๋วล่วงหน้า */}
            {activeTab === 'print' && (
              <form onSubmit={handlePrintSubmit} className="flex flex-col gap-4">
                
                {/* Info Alert Box */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-emerald-900 font-semibold leading-relaxed flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    ระบบจะสร้างรหัสตั๋วอัตโนมัติตามวันที่ 
                    <div className="font-extrabold text-emerald-800 mt-0.5">
                      {ticketType === 'main' ? 'คลองถม' : 'คลองถมทั่วไป'} {dateCode}-XXX
                    </div>
                  </div>
                </div>

                {/* Price (Only KlongThom Main) */}
                {ticketType === 'main' && (
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">ราคาตั๋วต่อคัน (บาท)</label>
                    <input 
                      type="number" 
                      value={printForm.price}
                      onChange={(e) => setPrintForm({ ...printForm, price: e.target.value })}
                      placeholder="0"
                      className="p-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B] font-bold"
                      required
                    />
                  </div>
                )}

                {/* General Info Note (Only KlongThom General) */}
                {ticketType === 'general' && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-gray-500 italic text-[10px] leading-relaxed">
                    *โหมดคลองถมทั่วไป: ตั๋วจะถูกพิมพ์โดยเว้นช่องราคาว่างไว้ พร้อมหางตั๋ว(ต้นขั้ว) เพื่อให้พนักงานเขียนราคาและเช็คหน้างานได้เอง
                  </div>
                )}

                {/* Running Number inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">เริ่มตั้งแต่เลขที่</label>
                    <input 
                      type="number" 
                      value={printForm.startNo}
                      onChange={(e) => setPrintForm({ ...printForm, startNo: e.target.value })}
                      placeholder="1"
                      className="p-2 border border-gray-200 rounded-lg text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B] font-bold font-mono"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">ถึงเลขที่</label>
                    <input 
                      type="number" 
                      value={printForm.endNo}
                      onChange={(e) => setPrintForm({ ...printForm, endNo: e.target.value })}
                      placeholder="เช่น 50"
                      className="p-2 border border-gray-200 rounded-lg text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B] font-bold font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Total tickets calculated display */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3.5 flex justify-between items-center">
                  <span className="font-bold text-gray-600">จำนวนที่ปริ้นท์:</span>
                  <strong className="text-base font-black text-[#0F8A6B] font-mono">{printCount} ใบ</strong>
                </div>

                {/* Print button */}
                <button
                  type="submit"
                  disabled={printCount <= 0}
                  className={`w-full py-3 text-white rounded-lg font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    printCount <= 0 
                      ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                      : 'bg-[#0F8A6B] hover:bg-[#0c7057]'
                  }`}
                >
                  <Printer className="w-4 h-4" /> พิมพ์ตั๋วออกเครื่อง
                </button>

              </form>
            )}

            {/* TAB 2: สรุปยอด/ส่งเงิน */}
            {activeTab === 'remit' && (
              <div className="flex flex-col gap-4">
                
                {/* Remit form input elements */}
                <div className="flex flex-col gap-3 p-3.5 border border-emerald-100 rounded-lg bg-emerald-50/10">
                  <h4 className="font-bold text-emerald-900 border-b pb-1">ฟอร์มนำส่งเงินยอดขาย</h4>
                  
                  {ticketType === 'main' ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-gray-700">จำนวนรถ (คัน) *</label>
                          <input 
                            type="number"
                            value={remitForm.cars}
                            onChange={(e) => setRemitForm({ ...remitForm, cars: e.target.value })}
                            placeholder="ระบุจำนวนรถ"
                            className="p-1.5 border border-gray-200 rounded text-xs text-right font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B]"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-gray-700">ราคาต่อคัน (บาท) *</label>
                          <input 
                            type="number"
                            value={remitForm.pricePerCar}
                            onChange={(e) => setRemitForm({ ...remitForm, pricePerCar: e.target.value })}
                            placeholder="0"
                            className="p-1.5 border border-gray-200 rounded text-xs text-right font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="font-bold text-gray-600">ยอดรวมจัดเก็บ:</span>
                        <strong className="text-sm font-black text-emerald-700 font-mono">
                          {computedTotal.toLocaleString()}.- บ.
                        </strong>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-700">ยอดเงินรวมที่จัดเก็บได้ (บาท) *</label>
                      <input 
                        type="number"
                        value={remitForm.totalAmount}
                        onChange={(e) => setRemitForm({ ...remitForm, totalAmount: e.target.value })}
                        placeholder="ระบุยอดเงินรวม"
                        className="p-1.5 border border-gray-200 rounded text-xs text-right font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B]"
                      />
                    </div>
                  )}

                  {/* Payment Breakdown (Split payments: Cash/Transfer) */}
                  <div className="border-t border-dashed pt-2.5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">ช่องทางนำส่งเงิน</span>
                      <span className={`font-mono font-black text-[10px] ${isPaidMatched ? 'text-green-700' : 'text-red-600'}`}>
                        {currentPaidSum.toLocaleString()} / {targetTotal.toLocaleString()} บ.
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {paymentList.map((pay, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            value={pay.method}
                            onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                            className="p-1.5 border border-gray-200 rounded text-[11px] bg-white focus:outline-none"
                          >
                            <option value="เงินสด">เงินสด</option>
                            <option value="โอนเงิน">โอนเงิน</option>
                          </select>
                          
                          <input
                            type="number"
                            value={pay.amount}
                            onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                            placeholder="จำนวนเงิน"
                            className="flex-1 p-1.5 border border-gray-200 rounded text-[11px] text-right font-mono font-bold bg-white"
                          />

                          {paymentList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentRow(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {currentPaidSum < targetTotal && (
                      <button
                        type="button"
                        onClick={handleAddPaymentRow}
                        className="mt-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> เพิ่มช่องทางชำระเงินผสม
                      </button>
                    )}
                  </div>

                  {/* Note */}
                  <div className="flex flex-col gap-1 mt-1 border-t border-dashed pt-2.5">
                    <label className="font-bold text-gray-700">หมายเหตุ</label>
                    <input 
                      type="text"
                      value={remitForm.note}
                      onChange={(e) => setRemitForm({ ...remitForm, note: e.target.value })}
                      placeholder="ระบุเพิ่มเติม (ถ้ามี)"
                      className="p-1.5 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8A6B]"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleSaveRemittance}
                    className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="w-4 h-4" /> บันทึกนำส่งเงิน
                  </button>

                </div>

                {/* History list of remittances for selected Date */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-extrabold text-gray-800 border-b pb-1 flex justify-between items-center">
                    <span>รายการนำส่งเงินประจำวัน ({selectedDate})</span>
                    <span className="text-[10px] text-gray-400">ทั้งหมด {remittanceHistory.length} รายการ</span>
                  </h4>

                  {remittanceHistory.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 italic">
                      ยังไม่มีรายการนำส่งเงินของวันนี้
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {remittanceHistory.map((txn) => (
                        <div 
                          key={txn.id}
                          className="p-2.5 border border-gray-100 bg-gray-50/50 rounded-lg flex justify-between items-center gap-2 hover:border-emerald-200 transition-all text-[11px]"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-[#0F8A6B] block">
                              {txn.category === 'ค่าเช่าคลองถมหลัก' ? '🔴 คลองถม (หลัก)' : '🔵 คลองถมทั่วไป'}
                            </span>
                            <span className="text-gray-500 font-semibold block truncate mt-0.5">
                              {txn.note}
                            </span>
                            <span className="text-[9px] text-gray-400 block mt-0.5">
                              ผู้รับ: {txn.officer} | เวลา: {new Date(txn.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-3">
                            <div>
                              <strong className="text-emerald-800 text-xs block font-mono font-black">
                                +{txn.total_amount.toLocaleString()}.-
                              </strong>
                              <span className="text-[9px] text-gray-400 block">{txn.method}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteRemittance(txn.id)}
                              className="p-1 hover:bg-red-50 text-red-600 hover:text-red-700 rounded transition-colors cursor-pointer border border-transparent hover:border-red-100"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
