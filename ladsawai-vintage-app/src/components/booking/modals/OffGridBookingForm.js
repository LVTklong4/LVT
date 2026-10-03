'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Printer, Trash2, Sparkles, PlusCircle, Loader2 } from 'lucide-react';
import { printOffGridReceipt } from '@/utils/offGridReceiptPrinter';
import { saveOffGridBooking, deleteOffGridBooking } from '@/services/booking/offGridService';
import OffGridPaymentSection from './OffGridPaymentSection';

export default function OffGridBookingForm({ selectedBooking, onClearSelection, onSaveSuccess }) {
  const {
    selectedDate,
    bookings,
    setBookings,
    fetchBookingsAndStorage,
    adminUser,
    parseNumber,
    showConfirm,
    showAlert
  } = useBooking();

  // Form states
  const [bookingId, setBookingId] = useState('');
  const [stallName, setStallName] = useState('');
  const [bookerName, setBookerName] = useState('');
  const [customerType, setCustomerType] = useState('ขาจร');
  const [product, setProduct] = useState('');
  const [stallPrice, setStallPrice] = useState('0');
  const [elecUnit, setElecUnit] = useState('0');
  const [elecPrice, setElecPrice] = useState(0);

  const [paymentList, setPaymentList] = useState([{ method: '', amount: '' }]);
  const [status, setStatus] = useState('ชำระแล้ว');
  const [note, setNote] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper to auto-calculate next off-grid stall name
  const getNextOffGridStallName = (customList = null) => {
    const list = customList || bookings || [];
    const todayBookings = list.filter(b => b.date === selectedDate && b.type === 'นอกผัง');
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

  // Clear form/reset to new booking mode
  const resetForm = (customList = null) => {
    setBookingId('');
    const nextStall = getNextOffGridStallName(customList);
    setStallName(nextStall);
    setBookerName('');
    setCustomerType('ขาจร');
    setProduct('');
    setStallPrice('0');
    setElecUnit('0');
    setElecPrice(0);
    setPaymentList([{ method: '', amount: '' }]);
    setStatus('ชำระแล้ว');
    setNote('');
    setEditMode(false);
    if (onClearSelection) onClearSelection();
  };

  // Load a booking into form for editing
  const loadBooking = (b) => {
    if (!b) return;
    setBookingId(b.id);
    setStallName(b.stall_name || '');
    setBookerName(b.booker_name || '');
    setProduct(b.product || '');
    setStallPrice(String(b.stall_price || 0));
    setElecUnit(String(b.elec_unit || 0));
    setElecPrice(b.elec_price || 0);
    setStatus(b.status || 'ชำระแล้ว');
    setEditMode(true);

    let parsedType = 'ขาจร';
    let parsedNote = b.note || '';

    const typeMatch = parsedNote.match(/\[ประเภท:\s*([^\]]+)\]/);
    if (typeMatch) parsedType = typeMatch[1].trim();

    parsedNote = parsedNote
      .replace(/\[(?:เบอร์โทร|เบอร์|โทร)\s*:\s*[^\]]+\]/gi, '')
      .replace(/\[ประเภท:\s*[^\]]+\]/gi, '')
      .trim();

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
        const amount = String(b.total_price || (parseFloat(b.stall_price || 0) + parseFloat(b.elec_price || 0)));
        setPaymentList([{ 
          method, 
          amount,
          isSaved: true
        }]);
      }
    } else {
      const total = (parseFloat(b.stall_price || 0) + parseFloat(b.elec_price || 0));
      setPaymentList([{ method: '', amount: total > 0 ? String(total) : '' }]);
    }
  };

  // Sync with selectedBooking prop
  useEffect(() => {
    if (selectedBooking) {
      loadBooking(selectedBooking);
    } else {
      resetForm();
    }
  }, [selectedBooking]);

  // Sync electricity price when units change
  useEffect(() => {
    const units = parseNumber(elecUnit);
    setElecPrice(units * 10);
  }, [elecUnit]);

  // Dynamic paymentList amount adjustment when price changes
  useEffect(() => {
    if (paymentList.length === 1) {
      const total = (parseFloat(stallPrice) || 0) + (parseFloat(elecPrice) || 0);
      setPaymentList(prev => [{ 
        method: prev[0]?.method || '', 
        amount: total > 0 ? String(total) : '' 
      }]);
    }
  }, [stallPrice, elecPrice]);

  // Submit Handler
  const handleSaveOffGrid = async (autoPrint = false) => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    if (!bookerName.trim()) {
      showAlert("โปรดกรอกชื่อผู้ค้า / เบอร์โทร", "แจ้งเตือน", true);
      return;
    }
    if (!product.trim()) {
      showAlert("โปรดกรอกสินค้าที่ขาย", "แจ้งเตือน", true);
      return;
    }
    if (!stallPrice.trim() || parseFloat(stallPrice) < 0) {
      showAlert("โปรดกรอกค่าเช่าล็อกให้ถูกต้อง", "แจ้งเตือน", true);
      return;
    }

    const totalVal = (parseFloat(stallPrice) || 0) + (parseFloat(elecPrice) || 0);
    const totalPaid = paymentList
      .filter(p => p.amount)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const hasEmptyMethod = paymentList.some(p => !p.method);
    if (hasEmptyMethod) {
      showAlert("กรุณาเลือกช่องทางการชำระเงิน (เงินสด หรือ โอนจ่าย)", "แจ้งเตือน", true);
      return;
    }

    if (totalPaid !== totalVal) {
      showAlert(`ยอดเงินที่ชำระ (${totalPaid} บาท) ต้องเท่ากับยอดรวมทั้งสิ้น (${totalVal} บาท) เนื่องจากเป็นรายการนอกผังที่ต้องชำระเงินทันที`, "แจ้งเตือน", true);
      return;
    }

    setSaving(true);
    try {
      const targetId = bookingId || `B-OFF-${Date.now()}`;
      const finalPaymentMethod = paymentList
        .filter(p => p.method && p.amount)
        .map(p => `${p.method}:${p.amount}`)
        .join(' + ') || 'เงินสด';

      const bookingData = await saveOffGridBooking({
        targetId,
        selectedDate,
        stallName,
        bookerName,
        product,
        elecUnit,
        elecPrice,
        stallPrice,
        totalVal,
        finalPaymentMethod,
        status,
        customerType,
        note,
        editMode,
        adminUser
      });

      // Update bookings list in context synchronously
      let updatedList = [];
      if (setBookings) {
        setBookings(prev => {
          const filtered = (prev || []).filter(b => b.id !== targetId);
          updatedList = [...filtered, bookingData];
          return updatedList;
        });
      }

      showAlert("บันทึกการจองนอกผังสำเร็จ", "สำเร็จ");

      if (autoPrint) {
        printOffGridReceipt(bookingData, adminUser, showAlert);
      }

      // Auto-increment to next stall name and clear merchant fields
      resetForm(updatedList);

      if (fetchBookingsAndStorage) fetchBookingsAndStorage();
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffGrid = async (id) => {
    if (!id) return;
    const isConfirmed = await showConfirm({
      title: 'ยืนยันยกเลิกจองนอกผัง',
      message: 'คุณต้องการลบ/ยกเลิกรายการจองนอกผังนี้ใช่หรือไม่? (การลบจะลบรายการธุรกรรมการเงินที่เกี่ยวข้องด้วย)',
      confirmText: 'ลบรายการนอกผัง',
      cancelText: 'ยกเลิก',
      isDanger: true
    });
    if (!isConfirmed) return;
    
    setSaving(true);
    try {
      await deleteOffGridBooking(id);

      let updatedList = [];
      if (setBookings) {
        setBookings(prev => {
          updatedList = (prev || []).filter(b => b.id !== id);
          return updatedList;
        });
      }

      showAlert("ลบการจองนอกผังสำเร็จ", "สำเร็จ");
      resetForm(updatedList);
      if (fetchBookingsAndStorage) fetchBookingsAndStorage();
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการลบ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setSaving(false);
    }
  };

  const totalVal = (parseFloat(stallPrice) || 0) + (parseFloat(elecPrice) || 0);
  const totalPaid = paymentList
    .filter(p => p.amount)
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const changeVal = Math.max(0, totalPaid - totalVal);

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveOffGrid(true);
      }} 
      className="flex flex-col gap-3 w-full md:w-96 shrink-0 bg-white p-4 border border-amber-200 rounded-lg shadow-sm"
    >
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="font-bold text-xs text-[#8B4513] flex items-center gap-1">
          {editMode ? (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-black">
              ✏️ แก้ไขรายการ [{stallName}]
            </span>
          ) : (
            <span>➕ เพิ่มรายการจองนอกผังใหม่</span>
          )}
        </h4>
        {editMode && (
          <button
            type="button"
            onClick={() => resetForm()}
            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded-md font-black transition-all flex items-center gap-0.5 cursor-pointer shadow-xs border border-amber-300"
          >
            <PlusCircle className="w-3 h-3 text-[#8B4513]" /> เพิ่มรายการใหม่
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
          onFocus={(e) => e.target.select()}
          onChange={(e) => setStallName(e.target.value)}
          placeholder="เช่น TEMP-01, นอกผัง-1"
          className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold bg-amber-50/30"
        />
      </div>

      {/* Booker Name / Phone & Product */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-700">ชื่อผู้ค้า / เบอร์โทร *</label>
          <input
            type="text"
            required
            value={bookerName}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setBookerName(e.target.value)}
            placeholder="ชื่อผู้ค้า หรือ เบอร์โทร"
            className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-700">สินค้าที่ขาย *</label>
          <input
            type="text"
            required
            value={product}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="เช่น เสื้อผ้า, อาหาร"
            className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          />
        </div>
      </div>

      {/* Price & Utilities */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 col-span-1">
          <label className="text-[10px] font-bold text-gray-700">ค่าเช่าล็อก *</label>
          <input
            type="number"
            required
            value={stallPrice}
            onFocus={(e) => e.target.select()}
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
            onFocus={(e) => e.target.select()}
            onChange={(e) => setElecUnit(e.target.value)}
            placeholder="0"
            className="p-1.5 border border-amber-300 rounded text-xs text-right font-mono font-bold"
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
          onFocus={(e) => e.target.select()}
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
      <OffGridPaymentSection
        paymentList={paymentList}
        setPaymentList={setPaymentList}
        changeVal={changeVal}
        parseNumber={parseNumber}
      />

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5 mt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-black transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editMode ? (
            <>
              <Sparkles className="w-4 h-4" /> บันทึกการแก้ไข & พิมพ์ตั๋ว
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" /> บันทึก & พิมพ์ตั๋ว
            </>
          )}
        </button>
        
        {editMode && status !== 'ชำระแล้ว' && (
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
  );
}
