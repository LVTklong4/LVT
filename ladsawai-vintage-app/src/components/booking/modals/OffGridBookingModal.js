'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '@/context/BookingContext';
import { supabase } from '@/lib/supabase';
import { X, Printer, Trash2, Banknote, Sparkles, PlusCircle, CheckCircle, Store, Phone, User, Zap, Loader2 } from 'lucide-react';
import { getModalDateFormat } from '@/utils/thaiDateHelper';
import { printOffGridReceipt } from '@/utils/offGridReceiptPrinter';

export default function OffGridBookingModal({ isOpen, onClose, selectedBooking, onSaveSuccess }) {
  const {
    selectedDate,
    bookings,
    adminUser,
    parseNumber
  } = useBooking();

  // Form states
  const [bookingId, setBookingId] = useState('');
  const [stallName, setStallName] = useState('');
  const [bookerName, setBookerName] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [customerType] = useState('ขาจร'); // Hardcoded state, no setter needed
  const [product, setProduct] = useState('');
  const [stallPrice, setStallPrice] = useState('160');
  const [elecUnit, setElecUnit] = useState('');
  const [elecPrice, setElecPrice] = useState(0);

  const [paymentList, setPaymentList] = useState([{ method: '', amount: '160' }]);
  const [status] = useState('ชำระแล้ว'); // Hardcoded state, no setter needed
  const [note, setNote] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper to auto-calculate next off-grid stall name
  const getNextOffGridStallName = () => {
    const todayBookings = (bookings || []).filter(b => b.date === selectedDate && b.type === 'นอกผัง');
    let maxNum = 0;
    todayBookings.forEach(b => {
      const name = b.stall_name || '';
      if (name.startsWith('นอกผัง-')) {
        const numPart = name.replace('นอกผัง-', '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `นอกผัง-${maxNum + 1}`;
  };

  // Sync with isOpen and selectedBooking
  useEffect(() => {
    if (isOpen) {
      if (selectedBooking) {
        loadBooking(selectedBooking);
      } else {
        resetForm();
      }
    }
  }, [isOpen, selectedBooking]);

  // Sync electricity price when units change
  useEffect(() => {
    const units = parseNumber(elecUnit);
    setElecPrice(units * 10);
  }, [elecUnit]);

  // Dynamic paymentList amount adjustment when price changes
  useEffect(() => {
    if (!editMode && paymentList.length === 1) {
      const total = (parseFloat(stallPrice) || 0) + (parseFloat(elecPrice) || 0);
      setPaymentList([{ method: paymentList[0].method, amount: String(total) }]);
    }
  }, [stallPrice, elecPrice]);

  // Load bookings for current date
  const offGridBookings = (bookings || []).filter(b => b.type === 'นอกผัง');

  // Load a booking into form for editing
  const loadBooking = (b) => {
    setBookingId(b.id);
    setStallName(b.stall_name || '');
    setBookerName(b.booker_name || '');
    setProduct(b.product || '');
    setStallPrice(String(b.stall_price || 0));
    setElecUnit(String(b.elec_unit || 0));
    setElecPrice(b.elec_price || 0);
    setStatus(b.status || 'ค้างชำระ');
    setEditMode(true);

    // Parse note to extract phone, customer type, and actual note
    let parsedPhone = '';
    let parsedType = 'ขาจร';
    let parsedNote = b.note || '';

    const phoneMatch = parsedNote.match(/\[เบอร์โทร:\s*([^\]]+)\]/);
    if (phoneMatch) parsedPhone = phoneMatch[1].trim();

    const typeMatch = parsedNote.match(/\[ประเภท:\s*([^\]]+)\]/);
    if (typeMatch) parsedType = typeMatch[1].trim();

    parsedNote = parsedNote
      .replace(/\[เบอร์โทร:\s*[^\]]+\]/, '')
      .replace(/\[ประเภท:\s*[^\]]+\]/, '')
      .trim();

    setPhoneVal(parsedPhone === '-' ? '' : parsedPhone);
    setCustomerType(parsedType);
    setNote(parsedNote);

    // Load payment method
    if (b.payment_method) {
      if (b.payment_method.includes(':') || b.payment_method.includes('+')) {
        const splits = b.payment_method.split('+').map(item => {
          const parts = item.split(':');
          const method = parts[0]?.trim() || '';
          const amount = parts[1]?.trim() || '';
          const isSaved = !!(method && amount && parseNumber(amount) > 0);
          return { 
            method: isSaved ? method : '', 
            amount: amount,
            isSaved: isSaved
          };
        });
        setPaymentList(splits);
      } else {
        const method = b.payment_method.trim();
        const amount = b.status === 'ชำระแล้ว' ? String(b.total_price || 0) : '';
        const isSaved = !!(method && amount && parseNumber(amount) > 0);
        setPaymentList([{ 
          method: isSaved ? method : '', 
          amount: amount,
          isSaved: isSaved
        }]);
      }
    } else {
      setPaymentList([{ method: '', amount: '' }]);
    }
  };

  // Clear form/reset to new booking mode
  const resetForm = () => {
    setBookingId('');
    const nextStall = getNextOffGridStallName();
    setStallName(nextStall);
    setBookerName('');
    setPhoneVal('');
    setProduct('');
    setStallPrice('160');
    setElecUnit('');
    setElecPrice(0);
    setPaymentList([{ method: '', amount: '160' }]);
    setNote('');
    setEditMode(false);
  };

  // Submit Handler
  const handleSaveOffGrid = async (autoPrint = false) => {
    if (!adminUser) {
      alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      return;
    }
    if (!bookerName.trim()) {
      alert("โปรดกรอกชื่อผู้ค้า");
      return;
    }
    const cleanPhone = phoneVal.replace(/\s|-/g, '').trim();
    if (!cleanPhone) {
      alert("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      alert("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0 (เช่น 0812345678)");
      return;
    }
    if (!product.trim()) {
      alert("โปรดกรอกสินค้าที่ขาย");
      return;
    }
    if (!stallPrice.trim() || parseFloat(stallPrice) <= 0) {
      alert("โปรดกรอกค่าเช่าล็อก");
      return;
    }

    const totalVal = (parseFloat(stallPrice) || 0) + (parseFloat(elecPrice) || 0);
    const totalPaid = paymentList
      .filter(p => p.amount)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const hasEmptyMethod = paymentList.some(p => !p.method);
    if (hasEmptyMethod) {
      alert("กรุณาเลือกช่องทางการชำระเงิน (เงินสด หรือ โอนจ่าย)");
      return;
    }

    if (totalPaid !== totalVal) {
      alert(`ยอดเงินที่ชำระ (${totalPaid} บาท) ต้องเท่ากับยอดรวมทั้งสิ้น (${totalVal} บาท) เนื่องจากเป็นรายการนอกผังที่ต้องชำระเงินทันที`);
      return;
    }

    setSaving(true);
    try {
      const targetId = bookingId || `B-OFF-${Date.now()}`;
      
      const formattedNote = `[เบอร์โทร: ${cleanPhone}] [ประเภท: ${customerType}] ${note.trim()}`.trim();
      
      const finalPaymentMethod = paymentList
        .filter(p => p.method && p.amount)
        .map(p => `${p.method}:${p.amount}`)
        .join(' + ') || 'เงินสด';

      const bookingData = {
        id: targetId,
        date: selectedDate,
        stall_name: stallName.trim(),
        booker_name: bookerName.trim(),
        product: product.trim(),
        type: 'นอกผัง',
        elec_unit: parseFloat(elecUnit) || 0,
        elec_price: parseFloat(elecPrice) || 0,
        stall_price: parseFloat(stallPrice) || 0,
        total_price: totalVal,
        payment_method: finalPaymentMethod,
        status: status,
        note: formattedNote,
        storage_fee: 0
      };

      // 1. Save Booking
      const { error: saveError } = await supabase
        .from('bookings')
        .upsert(bookingData);
      
      if (saveError) throw saveError;

      // 2. Record Transaction if Paid
      if (status === 'ชำระแล้ว') {
        if (editMode) {
          await supabase.from('transactions').delete().eq('booking_ref', targetId);
        }

        const txnId = `TXN-OFF-${Date.now()}`;
        const txnData = {
          id: txnId,
          booking_ref: targetId,
          date: selectedDate,
          category: 'ค่าล็อครายวัน',
          total_amount: totalVal,
          method: finalPaymentMethod,
          note: `ชำระเงินล็อคนอกผัง ${stallName.trim()}`,
          officer: adminUser.name || adminUser.employee_id || 'lvt-admin',
          timestamp: new Date().toISOString(),
          stall_amt: parseFloat(stallPrice) || 0,
          elec_amt: parseFloat(elecPrice) || 0,
          storage_amt: 0,
          bill_type: 'General'
        };

        const { error: txnError } = await supabase
          .from('transactions')
          .insert(txnData);
        
        if (txnError) throw txnError;
      } else {
        if (editMode) {
          await supabase.from('transactions').delete().eq('booking_ref', targetId);
        }
      }

      alert("บันทึกการจองนอกผังสำเร็จ");
      if (autoPrint) {
        printOffGridReceipt(bookingData, adminUser);
      }
      resetForm();
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteOffGrid = async (id) => {
    if (!id) return;
    if (!confirm("คุณต้องการลบ/ยกเลิกรายการจองนอกผังนี้ใช่หรือไม่? (การลบจะลบรายการธุรกรรมการเงินที่เกี่ยวข้องด้วย)")) return;
    
    setSaving(true);
    try {
      const { error: bookingErr } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      if (bookingErr) throw bookingErr;

      const { error: txnErr } = await supabase
        .from('transactions')
        .delete()
        .eq('booking_ref', id);
      if (txnErr) throw txnErr;

      alert("ลบการจองนอกผังสำเร็จ");
      resetForm();
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการลบ: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const totalVal = (parseFloat(stallPrice) || 0) + (parseFloat(elecPrice) || 0);
  const totalPaid = paymentList
    .filter(p => p.amount)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const changeVal = Math.max(0, totalPaid - totalVal);
  const isFullyPaid = totalPaid >= totalVal && totalVal > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FAF6EE] rounded-xl shadow-2xl w-full max-w-4xl border-2 border-[#8B4513] overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
        {/* Header */}
        <div className="bg-[#8B4513] text-white px-4 py-3 flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-sm flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>จัดการจองนอกผังรายวัน (Off-Grid Daily Booking)</span>
          </h3>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }} 
            className="text-amber-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
          {/* Form Panel */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveOffGrid(false);
            }} 
            className="flex flex-col gap-3 w-full md:w-96 shrink-0 bg-white p-4 border border-amber-200 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="font-bold text-xs text-[#8B4513]">
                {editMode ? '📝 แก้ไขรายการจองนอกผัง' : '➕ เพิ่มรายการจองนอกผังใหม่'}
              </h4>
              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold transition-all flex items-center gap-0.5"
                >
                  <PlusCircle className="w-3 h-3" /> สร้างใหม่
                </button>
              )}
            </div>

            {/* Stall/Area Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700">ชื่อพื้นที่/เลขล็อกชั่วคราว *</label>
              <input
                type="text"
                required
                value={stallName}
                onChange={(e) => setStallName(e.target.value)}
                placeholder="เช่น TEMP-01, นอกผัง-1"
                className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
            </div>

            {/* Booker Name & Product */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">ชื่อผู้ค้า *</label>
                <input
                  type="text"
                  required
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  placeholder="ชื่อผู้ค้า"
                  className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">สินค้าที่ขาย *</label>
                <input
                  type="text"
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="เช่น เสื้อผ้า, อาหาร"
                  className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700">เบอร์โทรศัพท์ *</label>
              <input
                type="text"
                required
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
                placeholder="08xxxxxxxx"
                className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none font-semibold w-full"
              />
            </div>

            {/* Price & Utilities */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-gray-700">ค่าเช่าล็อก *</label>
                <input
                  type="number"
                  required
                  value={stallPrice}
                  onChange={(e) => setStallPrice(e.target.value)}
                  placeholder="0"
                  className="p-1.5 border border-amber-300 rounded text-xs text-right font-mono font-bold"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-gray-700">หน่วยไฟ (หน่วย)</label>
                <input
                  type="number"
                  value={elecUnit}
                  onChange={(e) => setElecUnit(e.target.value)}
                  placeholder="0"
                  className="p-1.5 border border-amber-300 rounded text-xs text-right font-mono"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-gray-700">ค่าไฟ (บ.)</label>
                <div className="p-1.5 border border-gray-200 bg-gray-50 rounded text-xs text-right text-gray-600 font-mono font-bold">
                  {elecPrice.toLocaleString()}.-
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700">หมายเหตุ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="1"
                placeholder="รายละเอียดเพิ่มเติม..."
                className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none"
              />
            </div>

            {/* Total Price Banner */}
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
              <span className="font-extrabold text-[#8B4513]">ยอดรวมทั้งสิ้น:</span>
              <span className="font-black text-amber-900 font-mono text-sm">{totalVal.toLocaleString()} บาท</span>
            </div>

            {/* Payments Section */}
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <label className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-[#8B4513]" /> ช่องทางชำระเงิน
              </label>
              
              {paymentList.map((entry, index) => {
                const isAmountEntered = entry.amount && parseFloat(entry.amount) > 0;
                return (
                  <div key={index} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => {
                        const updated = [...paymentList];
                        updated[index].amount = e.target.value;
                        setPaymentList(updated);
                      }}
                      placeholder="จำนวนเงิน"
                      className="flex-1 p-1.5 border border-amber-300 rounded text-xs text-right font-mono font-bold"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...paymentList];
                          updated[index].method = 'เงินสด';
                          setPaymentList(updated);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-black border transition-all cursor-pointer ${
                          entry.method === 'เงินสด'
                            ? 'bg-[#8B4513] text-white border-[#8B4513]'
                            : 'bg-white text-gray-500 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        เงินสด
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...paymentList];
                          updated[index].method = 'โอนเงิน';
                          setPaymentList(updated);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-black border transition-all cursor-pointer ${
                          entry.method === 'โอนเงิน'
                            ? 'bg-[#8B4513] text-white border-[#8B4513]'
                            : 'bg-white text-gray-500 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        โอนจ่าย
                      </button>
                    </div>
                    {paymentList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = paymentList.filter((_, idx) => idx !== index);
                          setPaymentList(updated);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {!isFullyPaid && (
                <button
                  type="button"
                  onClick={() => setPaymentList([...paymentList, { method: '', amount: '' }])}
                  className="text-[10px] bg-amber-50 hover:bg-amber-100 text-[#8B4513] border border-dashed border-amber-400 py-1 rounded font-bold transition-all cursor-pointer"
                >
                  + เพิ่มช่องทางชำระเงินอื่น
                </button>
              )}

              {changeVal > 0 && (
                <div className="text-right text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-200 p-1 rounded">
                  เงินทอน: {changeVal.toLocaleString()} บาท
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-black transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> ชำระเงินและบันทึก
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveOffGrid(true)}
                  className="py-2.5 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-black transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> บันทึก & พิมพ์
                </button>
              </div>
              
              {editMode && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeleteOffGrid(bookingId)}
                  className="w-full py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ยกเลิก/ลบรายการนอกผังนี้
                </button>
              )}
            </div>
          </form>

          {/* List Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-white p-4 border border-amber-200 rounded-lg shadow-sm">
            <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
              <span>📋 รายการจองนอกผังวันที่ {getModalDateFormat(selectedDate)}</span>
              <span className="text-[10px] text-gray-500 font-bold">ทั้งหมด: {offGridBookings.length} รายการ</span>
            </h4>

            {offGridBookings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16 gap-2">
                <Sparkles className="w-8 h-8 text-gray-300" />
                <span className="text-xs font-bold">ไม่มีรายการจองนอกผังสำหรับวันนี้</span>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg max-h-[55vh]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-amber-50 text-amber-900 border-b font-bold">
                    <tr>
                      <th className="p-2">ชื่อพื้นที่ / ล็อก</th>
                      <th className="p-2">ผู้จอง / เบอร์</th>
                      <th className="p-2 text-right">ยอดรวม</th>
                      <th className="p-2 text-center">สถานะ</th>
                      <th className="p-2 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white font-semibold text-gray-700">
                    {offGridBookings.map((b) => {
                      let dispPhone = '-';
                      let dispType = 'ขาจร';
                      const pMatch = (b.note || '').match(/\[เบอร์โทร:\s*([^\]]+)\]/);
                      if (pMatch) dispPhone = pMatch[1];
                      const tMatch = (b.note || '').match(/\[ประเภท:\s*([^\]]+)\]/);
                      if (tMatch) dispType = tMatch[1];

                      return (
                        <tr key={b.id} className="hover:bg-amber-50/20">
                          <td className="p-2 font-bold text-[#8B4513]">{b.stall_name}</td>
                          <td className="p-2">
                            <div>{b.booker_name}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                              <span>โทร: {dispPhone}</span>
                              <span className="bg-amber-100 text-amber-800 px-1 rounded-sm text-[8px] font-bold">{dispType}</span>
                            </div>
                          </td>
                          <td className="p-2 text-right font-bold text-gray-900 font-mono">
                            {b.total_price?.toLocaleString()}.-
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              b.status === 'ชำระแล้ว'
                                ? 'bg-green-100 text-green-800'
                                : b.status === 'ยกเลิก'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => loadBooking(b)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => printOffGridReceipt(b, adminUser)}
                                className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" /> พิมพ์ตั๋ว
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
