'use client';

import React from 'react';
import { useKlongThom } from '@/context/KlongThomContext';
import { 
  X, Calendar, Loader2, DollarSign, Store, Users, CheckCircle2, 
  RefreshCw, AlertCircle, Printer, Plus, Trash2, FileText, CheckSquare, Coins
} from 'lucide-react';
import { printBatchKlongThomTickets } from '@/utils/klongthomReceiptPrinter';

export default function KlongThomBookingLayout({ onClose }) {
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
  const ticketPrice = parseFloat(remitForm.ticketPrice) || 0;
  
  // Calculate ticket revenue
  let ticketCashAmt = 0;
  let ticketTransferAmt = 0;
  if (ticketType === 'main') {
    const carsCash = parseInt(remitForm.carsCash) || 0;
    const carsTransfer = parseInt(remitForm.carsTransfer) || 0;
    ticketCashAmt = carsCash * ticketPrice;
    ticketTransferAmt = carsTransfer * ticketPrice;
  } else {
    ticketCashAmt = parseFloat(remitForm.ticketCash) || 0;
    ticketTransferAmt = parseFloat(remitForm.ticketTransfer) || 0;
  }
  const totalTicket = ticketCashAmt + ticketTransferAmt;

  // Calculate electricity revenue
  const elecCash = parseFloat(remitForm.elecCash) || 0;
  const elecTransfer = parseFloat(remitForm.elecTransfer) || 0;
  const totalElec = elecCash + elecTransfer;

  // Calculate totals
  const grandTotalCash = ticketCashAmt + elecCash;
  const grandTotalTransfer = ticketTransferAmt + elecTransfer;
  const grandTotal = totalTicket + totalElec;

  const handlePrintSubmit = (e) => {
    e.preventDefault();
    if (ticketType === 'main') {
      const priceVal = parseFloat(printForm.price) || 0;
      if (priceVal <= 0) {
        alert("กรุณาระบุราคาตั๋วต่อคันให้ถูกต้องก่อนพิมพ์");
        return;
      }
    }
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

  return (
    <div className="flex flex-col bg-[#FAF6F0] text-gray-800 font-sans w-full rounded-xl overflow-hidden shadow-2xl max-w-md border border-amber-800/60 max-h-[95vh] animate-pop-in">
      
      {/* Toast Alert */}
      {alertInfo && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs transition-all duration-300 animate-bounce-in max-w-sm ${
          alertInfo.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-250 text-amber-900'
        }`}>
          {alertInfo.isError ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />}
          <div className="flex-1">
            <h4 className="font-bold">{alertInfo.title}</h4>
            <p className="font-semibold whitespace-pre-line">{alertInfo.message}</p>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-gray-400 hover:text-gray-600 font-bold shrink-0 cursor-pointer">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-amber-800 text-white px-4 py-3.5 flex justify-between items-center shrink-0">
        <h3 className="font-extrabold text-sm flex items-center gap-2">
          🚗 จัดการตั๋วคลองถม
        </h3>
        <button 
          type="button"
          onClick={onClose || (() => window.location.href = '/')}
          className="text-white hover:text-amber-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Selector Ticket Type (Radio buttons) */}
      <div className="p-4 border-b border-amber-100 bg-[#FAF9F5] shrink-0 text-xs flex flex-col gap-2">
        <span className="font-bold text-gray-500">เลือกประเภทคลองถม:</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 font-extrabold text-gray-700 cursor-pointer select-none">
            <input 
              type="radio" 
              name="ticketType" 
              checked={ticketType === 'main'}
              onChange={() => setTicketType('main')}
              className="w-4 h-4 text-amber-800 focus:ring-amber-600 border-amber-300 accent-amber-800"
            />
            <span>คลองถม (หลัก)</span>
          </label>
          
          <label className="flex items-center gap-2 font-extrabold text-gray-700 cursor-pointer select-none">
            <input 
              type="radio" 
              name="ticketType" 
              checked={ticketType === 'general'}
              onChange={() => setTicketType('general')}
              className="w-4 h-4 text-amber-800 focus:ring-amber-600 border-amber-300 accent-amber-800"
            />
            <span>คลองถมทั่วไป <span className="text-[10px] text-gray-400 font-normal">(ราคาไม่คงที่)</span></span>
          </label>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b bg-amber-50/30 shrink-0 text-xs">
        <button
          onClick={() => setActiveTab('print')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 ${
            activeTab === 'print' 
              ? 'bg-[#FAF6F0] border-amber-800 text-amber-900' 
              : 'text-gray-500 border-transparent hover:bg-amber-50/50'
          }`}
        >
          🖨️ พิมพ์ตั๋วล่วงหน้า
        </button>
        <button
          onClick={() => setActiveTab('remit')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 ${
            activeTab === 'remit' 
              ? 'bg-[#FAF6F0] border-amber-800 text-amber-900' 
              : 'text-gray-500 border-transparent hover:bg-amber-50/50'
          }`}
        >
          📊 สรุปยอด/ส่งเงิน
        </button>
      </div>

      {/* Form Scroll Area */}
      <div className="p-4 flex-1 overflow-y-auto text-xs flex flex-col gap-4 custom-scrollbar">
        
        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4 text-amber-800 gap-1 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" /> กำลังประมวลผลข้อมูล...
          </div>
        )}

        {/* TAB 1: พิมพ์ตั๋วล่วงหน้า */}
        {activeTab === 'print' && (
          <form onSubmit={handlePrintSubmit} className="flex flex-col gap-4">
            
            {/* Info Alert Box */}
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-3 text-amber-900 font-semibold leading-relaxed flex items-start gap-2">
              <CheckSquare className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                ระบบจะสร้างรหัสตั๋วอัตโนมัติตามวันที่ 
                <div className="font-extrabold text-amber-950 mt-0.5">
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
                  className="p-2 border border-amber-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 font-bold"
                  required
                />
              </div>
            )}

            {/* General Info Note (Only KlongThom General) */}
            {ticketType === 'general' && (
              <div className="bg-[#FAF9F5] border border-amber-100 rounded-lg p-2.5 text-gray-500 italic text-[10px] leading-relaxed">
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
                  className="p-2 border border-amber-200 rounded-lg text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 font-bold font-mono"
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
                  className="p-2 border border-amber-200 rounded-lg text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 font-bold font-mono"
                  required
                />
              </div>
            </div>

            {/* Total tickets calculated display */}
            <div className="bg-amber-50/40 border border-amber-150 rounded-lg p-3.5 flex justify-between items-center">
              <span className="font-bold text-gray-600">จำนวนที่ปริ้นท์:</span>
              <strong className="text-base font-black text-amber-800 font-mono">{printCount} ใบ</strong>
            </div>

            {/* Print button */}
            <button
              type="submit"
              disabled={printCount <= 0}
              className={`w-full py-3 text-white rounded-lg font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                printCount <= 0 
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-amber-800 hover:bg-amber-900'
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
            <div className="flex flex-col gap-3">
              
              {/* Date & Price Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700">วันที่ประจำรอบ</label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border border-amber-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>
                
                {ticketType === 'main' && (
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-700">ราคาตั๋ว (บาท/คัน)</label>
                    <input 
                      type="number"
                      value={remitForm.ticketPrice}
                      onChange={(e) => setRemitForm({ ...remitForm, ticketPrice: e.target.value })}
                      placeholder="0"
                      className="p-2 border border-amber-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                )}
              </div>

              {/* Section 1: Ticket Sales */}
              <div className="border-t border-amber-100 pt-2.5">
                <span className="font-extrabold text-amber-800 text-[11px] block mb-2">
                  {ticketType === 'main' 
                    ? '1. รายรับค่าตั๋ว (ระบุจำนวนคัน)' 
                    : '1. รายรับค่าตั๋ว (ระบุยอดเงินรวม)'
                  }
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Cash */}
                  <div className="border border-green-200 rounded-lg p-2 bg-green-50/10 flex flex-col gap-1 items-center">
                    <span className="font-bold text-green-700 text-[10px] block">
                      {ticketType === 'main' ? '💵 สด (คัน)' : '💵 ยอดเงินรวม สด (บ.)'}
                    </span>
                    <input
                      type="number"
                      value={ticketType === 'main' ? remitForm.carsCash : remitForm.ticketCash}
                      onChange={(e) => setRemitForm({ 
                        ...remitForm, 
                        [ticketType === 'main' ? 'carsCash' : 'ticketCash']: e.target.value 
                      })}
                      placeholder="0"
                      className="w-full text-center text-sm font-black font-mono border border-green-200 rounded-lg p-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 text-green-800"
                    />
                  </div>

                  {/* Transfer */}
                  <div className="border border-blue-200 rounded-lg p-2 bg-blue-50/10 flex flex-col gap-1 items-center">
                    <span className="font-bold text-blue-700 text-[10px] block">
                      {ticketType === 'main' ? '📱 โอน (คัน)' : '📱 ยอดเงินรวม โอน (บ.)'}
                    </span>
                    <input
                      type="number"
                      value={ticketType === 'main' ? remitForm.carsTransfer : remitForm.ticketTransfer}
                      onChange={(e) => setRemitForm({ 
                        ...remitForm, 
                        [ticketType === 'main' ? 'carsTransfer' : 'ticketTransfer']: e.target.value 
                      })}
                      placeholder="0"
                      className="w-full text-center text-sm font-black font-mono border border-blue-200 rounded-lg p-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Electricity Sales */}
              <div className="border-t border-amber-100 pt-2.5">
                <span className="font-extrabold text-amber-800 text-[11px] block mb-2">
                  ⚡ 2. รายรับค่าไฟ (บาท)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Elec Cash */}
                  <div className="border border-amber-250 rounded-lg p-2 bg-amber-50/10 flex flex-col gap-1 items-center">
                    <span className="font-bold text-amber-700 text-[10px] block">💵 ค่าไฟ สด (บ.)</span>
                    <input
                      type="number"
                      value={remitForm.elecCash}
                      onChange={(e) => setRemitForm({ ...remitForm, elecCash: e.target.value })}
                      placeholder="0"
                      className="w-full text-center text-sm font-black font-mono border border-amber-250 rounded-lg p-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-800"
                    />
                  </div>

                  {/* Elec Transfer */}
                  <div className="border border-amber-250 rounded-lg p-2 bg-amber-50/10 flex flex-col gap-1 items-center">
                    <span className="font-bold text-amber-700 text-[10px] block">📱 ค่าไฟ โอน (บ.)</span>
                    <input
                      type="number"
                      value={remitForm.elecTransfer}
                      onChange={(e) => setRemitForm({ ...remitForm, elecTransfer: e.target.value })}
                      placeholder="0"
                      className="w-full text-center text-sm font-black font-mono border border-amber-250 rounded-lg p-1 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-800"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1 border-t border-amber-100 pt-2.5">
                <label className="font-bold text-gray-700">หมายเหตุ</label>
                <input 
                  type="text"
                  value={remitForm.note}
                  onChange={(e) => setRemitForm({ ...remitForm, note: e.target.value })}
                  placeholder="ระบุเพิ่มเติม (ถ้ามี)"
                  className="p-1.5 border border-amber-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Summary Panel (Dark Navy Container) */}
              <div className="bg-[#1E293B] text-white rounded-lg p-3 mt-1.5 flex flex-col gap-2 font-semibold">
                <div className="flex justify-between items-center text-[11px] text-gray-300">
                  <span>ยอดตั๋วรวม:</span>
                  <span className="font-mono">{totalTicket.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-300">
                  <span>ยอดค่าไฟรวม:</span>
                  <span className="font-mono">{totalElec.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-600/40 my-0.5"></div>
                
                <div className="flex justify-between items-center text-[11px] text-green-400">
                  <span className="flex items-center gap-1">💵 รวมเงินสด:</span>
                  <span className="font-mono font-bold">{grandTotalCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-blue-400">
                  <span className="flex items-center gap-1">📱 รวมเงินโอน:</span>
                  <span className="font-mono font-bold">{grandTotalTransfer.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-600/40 my-0.5"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold text-gray-200">รวมส่งยอดทั้งหมด</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSaveRemittance}
                className="w-full mt-1.5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Coins className="w-4 h-4" /> ยืนยันบันทึกส่งยอด
              </button>

            </div>

            {/* History list of remittances for selected Date */}
            <div className="flex flex-col gap-2 border-t border-amber-100 pt-3">
              <h4 className="font-extrabold text-amber-950 pb-1 flex justify-between items-center">
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
                      className="p-2.5 border border-amber-100 bg-[#FAF9F5]/80 rounded-lg flex justify-between items-center gap-2 hover:border-amber-300 transition-all text-[11px]"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-amber-900 block">
                          {txn.category === 'ค่าเช่าคลองถมหลัก' ? '🔴 คลองถม (หลัก)' : '🔵 คลองถมทั่วไป'}
                        </span>
                        <span className="text-gray-500 font-semibold block text-[10px] leading-relaxed mt-0.5">
                          {txn.note}
                        </span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">
                          ผู้รับ: {txn.officer} | เวลา: {new Date(txn.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <strong className="text-amber-900 text-xs block font-mono font-black">
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
  );
}
