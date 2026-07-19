'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, Printer, Trash2, Plus, Banknote, Sparkles, PlusCircle, CheckCircle } from 'lucide-react';
import { getModalDateFormat } from '@/utils/thaiDateHelper';

export default function OffGridBookingModal() {
  const {
    showOffGridBookingModal,
    setShowOffGridBookingModal,
    selectedOffGridBooking,
    setSelectedOffGridBooking,
    selectedDate,
    bookings,
    adminUser,
    handleSaveOffGridBooking,
    handleDeleteOffGridBooking,
    parseNumber,
    setReceiptPreviewData,
    setShowReceiptPreviewModal
  } = useBooking();

  // Form states
  const [bookingId, setBookingId] = useState('');
  const [stallName, setStallName] = useState('');
  const [bookerName, setBookerName] = useState('');
  const [phone, setPhone] = useState('');
  const [customerType, setCustomerType] = useState('ขาจร');
  const [stallPrice, setStallPrice] = useState('');
  const [elecUnit, setElecUnit] = useState('');
  const [elecPrice, setElecPrice] = useState(0);

  const [paymentList, setPaymentList] = useState([{ method: '', amount: '' }]);
  const [status, setStatus] = useState('ค้างชำระ');
  const [note, setNote] = useState('');

  const [editMode, setEditMode] = useState(false);

  // Sync with selectedOffGridBooking when it changes from outside
  useEffect(() => {
    if (selectedOffGridBooking) {
      loadBooking(selectedOffGridBooking);
    }
  }, [selectedOffGridBooking]);

  // Sync electricity price when units change
  useEffect(() => {
    const units = parseNumber(elecUnit);
    setElecPrice(units * 10);
  }, [elecUnit]);

  // Load bookings for current date
  const offGridBookings = bookings.filter(b => b.type === 'นอกผัง');

  // Load a booking into form for editing
  const loadBooking = (b) => {
    setBookingId(b.id);
    setStallName(b.stall_name || '');
    setBookerName(b.booker_name || '');
    setStallPrice(String(b.stall_price || 0));
    setElecUnit(String(b.elec_unit || 0));
    setElecPrice(b.elec_price || 0);

    setStatus(b.status || 'ค้างชำระ');
    setEditMode(true);

    // Parse note to extract phone, customer type, and actual note
    // Note format: `[เบอร์โทร: 0812345678] [ประเภท: VIP] Actual note here`
    let parsedPhone = '';
    let parsedType = 'ขาจร';
    let parsedNote = b.note || '';

    const phoneMatch = parsedNote.match(/\[เบอร์โทร:\s*([^\]]+)\]/);
    if (phoneMatch) parsedPhone = phoneMatch[1].trim();

    const typeMatch = parsedNote.match(/\[ประเภท:\s*([^\]]+)\]/);
    if (typeMatch) parsedType = typeMatch[1].trim();

    // Clean final note
    parsedNote = parsedNote
      .replace(/\[เบอร์โทร:\s*[^\]]+\]/, '')
      .replace(/\[ประเภท:\s*[^\]]+\]/, '')
      .trim();

    setPhone(parsedPhone === '-' ? '' : parsedPhone);
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
    setStallName('');
    setBookerName('');
    setPhone('');
    setCustomerType('ขาจร');
    setStallPrice('');
    setElecUnit('');
    setElecPrice(0);

    setPaymentList([{ method: '', amount: '' }]);
    setStatus('ค้างชำระ');
    setNote('');
    setEditMode(false);
    setSelectedOffGridBooking(null);
  };

  // Submit handler
  const onSubmit = (e) => {
    e.preventDefault();
    handleSaveOffGridBooking({
      id: bookingId,
      stallName,
      bookerName,
      phone,
      customerType,
      stallPrice,
      elecUnit,
      elecPrice,
      paymentList,
      status,
      note,
      autoPrint: false
    });
  };

  const onSubmitAndPrint = () => {
    handleSaveOffGridBooking({
      id: bookingId,
      stallName,
      bookerName,
      phone,
      customerType,
      stallPrice,
      elecUnit,
      elecPrice,
      paymentList,
      status,
      note,
      autoPrint: true
    });
  };

  if (!showOffGridBookingModal) return null;

  const totalVal = parseNumber(stallPrice) + parseNumber(elecPrice);
  const totalPaid = paymentList
    .filter(p => p.amount)
    .reduce((sum, p) => sum + parseNumber(p.amount), 0);
  const changeVal = Math.max(0, totalPaid - totalVal);
  const isFullyPaid = totalPaid >= totalVal && totalVal > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FAF6EE] rounded-xl shadow-2xl w-full max-w-4xl border-2 border-amber-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-amber-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>จัดการจองนอกผังรายวัน (Off-Grid Daily Booking)</span>
          </h3>
          <button 
            onClick={() => {
              resetForm();
              setShowOffGridBookingModal(false);
            }} 
            className="text-amber-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
          {/* Form Panel */}
          <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full md:w-96 shrink-0 bg-white p-4 border border-amber-200 rounded-lg shadow-sm">
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
                  <PlusCircle className="w-3 h-3" /> สร้างรายการใหม่
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
                placeholder="เช่น TEMP-01, ลานกิจกรรม-A"
                className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
            </div>

            {/* Booker Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700">ชื่อผู้จอง *</label>
              <input
                type="text"
                required
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                placeholder="ชื่อผู้จอง/ร้านค้า"
                className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Phone and Customer Type */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxx"
                  className="p-1.5 border border-amber-300 rounded text-xs focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-700">ประเภทลูกค้า</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="p-1.5 border border-amber-300 rounded text-xs bg-white focus:outline-none"
                >
                  <option value="ขาจร">ขาจร</option>
                  <option value="ประจำ">ประจำ</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            {/* Price & Utilities */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-gray-700">ค่าเช่าล็อก (บ.) *</label>
                <input
                  type="number"
                  required
                  value={stallPrice}
                  onChange={(e) => setStallPrice(e.target.value)}
                  placeholder="0"
                  className="p-1.5 border border-amber-300 rounded text-xs text-right focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-gray-700">หน่วยไฟ (หน่วย)</label>
                <input
                  type="number"
                  value={elecUnit}
                  onChange={(e) => setElecUnit(e.target.value)}
                  placeholder="0"
                  className="p-1.5 border border-amber-300 rounded text-xs text-right focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[10px] font-bold text-gray-700">ค่าไฟสะสม (บ.)</label>
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

            {/* Total Section */}
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
              <span className="font-bold text-[#8B4513]">ยอดรวมทั้งสิ้น:</span>
              <span className="font-extrabold text-amber-900 font-mono text-sm">{totalVal.toLocaleString()} บาท</span>
            </div>

            {/* Payments */}
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <label className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-[#8B4513]" /> ช่องทางชำระเงิน
              </label>
              
              {paymentList.map((entry, index) => {
                const isAmountEntered = entry.amount && parseNumber(entry.amount) > 0;
                return (
                  <div key={index} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      disabled={entry.isSaved}
                      value={entry.amount}
                      onChange={(e) => {
                        const updated = [...paymentList];
                        updated[index].amount = e.target.value;
                        setPaymentList(updated);
                      }}
                      placeholder="กรอกยอดเงินชำระ"
                      className="flex-1 p-1.5 border border-amber-300 rounded text-xs text-right font-mono"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={!isAmountEntered || entry.isSaved}
                        onClick={() => {
                          const updated = [...paymentList];
                          updated[index].method = 'เงินสด';
                          setPaymentList(updated);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                          entry.method === 'เงินสด'
                            ? 'bg-[#5D4037] text-white border-[#5D4037]'
                            : 'bg-white text-gray-500 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        เงินสด
                      </button>
                      <button
                        type="button"
                        disabled={!isAmountEntered || entry.isSaved}
                        onClick={() => {
                          const updated = [...paymentList];
                          updated[index].method = 'โอนเงิน';
                          setPaymentList(updated);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                          entry.method === 'โอนเงิน'
                            ? 'bg-[#5D4037] text-white border-[#5D4037]'
                            : 'bg-white text-gray-500 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        โอนจ่าย
                      </button>
                    </div>
                    {paymentList.length > 1 && !entry.isSaved && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = paymentList.filter((_, idx) => idx !== index);
                          setPaymentList(updated);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
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
                  className="text-[10px] bg-amber-50 hover:bg-amber-100 text-[#8B4513] border border-dashed border-amber-400 py-1 rounded font-bold transition-all"
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

            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-700">สถานะรายการ *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="p-1.5 border border-amber-300 rounded text-xs bg-white focus:outline-none"
              >
                <option value="ค้างชำระ">ค้างชำระ (Unpaid)</option>
                <option value="ชำระแล้ว">ชำระแล้ว (Paid)</option>
              </select>
            </div>

            {/* Submit buttons */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition-all shadow flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> บันทึกการจอง
                </button>
                <button
                  type="button"
                  onClick={onSubmitAndPrint}
                  className="py-2 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-bold transition-all shadow flex items-center justify-center gap-1"
                >
                  <Printer className="w-4 h-4" /> บันทึก & พิมพ์
                </button>
              </div>
              
              {editMode && (
                <button
                  type="button"
                  onClick={() => handleDeleteOffGridBooking(bookings.find(b => b.id === bookingId))}
                  className="w-full py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ยกเลิก/ลบการจองนี้
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
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptPreviewData({ bookingObj: b, stallObj: { name: b.stall_name, type: 'นอกผัง' } });
                                  setShowReceiptPreviewModal(true);
                                }}
                                className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" /> ใบเสร็จ
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
