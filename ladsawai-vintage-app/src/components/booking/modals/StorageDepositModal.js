'use client';

import React, { useState, useEffect } from 'react';
import { useStorage } from '@/context/StorageContext';
import { X, Lock, User, Phone, FileText, Calendar, DollarSign, Search } from 'lucide-react';

export default function StorageDepositModal({ isOpen, onClose, renewItem = null }) {
  const {
    handleSaveStorage,
    handleRenewStorage,
    parseNumber,
    formatPrice
  } = useStorage();

  // Form states
  const [stallName, setStallName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeksCount, setWeeksCount] = useState(1);
  const [payImmediately, setPayImmediately] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('เงินสด');

  // Load data if in renew mode
  useEffect(() => {
    if (isOpen) {
      if (renewItem) {
        setStallName(renewItem.stall_name || '');
        setOwnerName(renewItem.owner_name || '');
        setPhone(renewItem.phone || '');
        setNote(renewItem.note || '');
        // Extension starts from previous end date
        setStartDate(renewItem.end_date || new Date().toISOString().split('T')[0]);
        setWeeksCount(1);
        setPayImmediately(true);
        setPaymentMethod('เงินสด');
      } else {
        // Reset for new deposit
        setStallName('');
        setOwnerName('');
        setPhone('');
        setNote('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setWeeksCount(1);
        setPayImmediately(true);
        setPaymentMethod('เงินสด');
      }
    }
  }, [isOpen, renewItem]);

  if (!isOpen) return null;

  const totalFee = parseNumber(weeksCount) * 160;

  const getThaiEndDateStr = (startDateStr, weeks) => {
    if (!startDateStr) return '';
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(start.getDate() + (parseNumber(weeks) * 7));
    
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const thaiDayName = thaiDays[end.getDay()];
    
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const thaiMonthName = thaiMonths[end.getMonth()];
    
    return `${thaiDayName} ${end.getDate()} ${thaiMonthName} ${end.getFullYear() + 543}`;
  };

  const calculatedEndStr = getThaiEndDateStr(startDate, weeksCount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stallName.trim()) {
      alert("กรุณากรอกชื่อล็อก/จุดวางของ");
      return;
    }
    if (!ownerName.trim()) {
      alert("กรุณากรอกชื่อเจ้าของของ");
      return;
    }

    if (renewItem) {
      handleRenewStorage({
        item: renewItem,
        weeksCount,
        paymentMethod
      });
    } else {
      handleSaveStorage({
        stall_name: stallName,
        owner_name: ownerName,
        phone,
        note,
        start_date: startDate,
        weeks: weeksCount,
        payImmediately,
        paymentMethod
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FAF6EE] rounded-xl shadow-2xl w-full max-w-sm border-2 border-orange-600 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-orange-600 text-white px-4 py-3.5 flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-sm flex items-center gap-1.5">
            <Lock className="w-5 h-5 text-orange-200" />
            <span>{renewItem ? 'แจ้งต่ออายุฝากของ' : 'แจ้งฝากของ / ต่ออายุ'}</span>
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-orange-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex flex-col gap-3.5 text-xs text-[#5D4037]">
          {/* Stall Name */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700">เลือกตำแหน่งฝาก (ล็อค/จุดพัก) *</label>
            <div className="relative">
              <input
                type="text"
                disabled={!!renewItem}
                required
                value={stallName}
                onChange={(e) => setStallName(e.target.value)}
                placeholder="พิมพ์ชื่อล็อค..."
                className="w-full p-2 pl-8 border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
              />
              <Search className="w-4 h-4 text-orange-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Owner Name */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700">ชื่อเจ้าของของ *</label>
            <div className="relative">
              <input
                type="text"
                disabled={!!renewItem}
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="ระบุชื่อ"
                className="w-full p-2 pl-8 border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <User className="w-4 h-4 text-orange-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700">เบอร์โทรศัพท์</label>
            <div className="relative">
              <input
                type="text"
                disabled={!!renewItem}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0xx-xxxxxxx"
                className="w-full p-2 pl-8 border border-orange-300 rounded-lg bg-white focus:outline-none"
              />
              <Phone className="w-4 h-4 text-orange-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Details / Note */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-gray-700">รายละเอียด/โน้ต</label>
            <div className="relative">
              <textarea
                disabled={!!renewItem}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="2"
                placeholder="เช่น ฝากโครงเหล็ก, ร่ม"
                className="w-full p-2 pl-8 border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <FileText className="w-4 h-4 text-orange-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Weekly Calculation Card */}
          <div className="bg-[#FFFDF9] border border-orange-200 rounded-xl p-3.5 flex flex-col gap-3 shadow-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-700">วันที่เริ่มฝาก</span>
                <input
                  type="date"
                  disabled={!!renewItem}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-1.5 border border-orange-300 rounded bg-white text-center focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-orange-950">จำนวนสัปดาห์</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={weeksCount}
                  onChange={(e) => setWeeksCount(e.target.value)}
                  className="p-1.5 border border-orange-300 rounded bg-white text-center focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                />
              </div>
            </div>

            <div className="border-t border-dashed border-orange-200 pt-2 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-bold">วันสิ้นสุด:</span>
                <span className="font-extrabold text-red-600 font-sans">{calculatedEndStr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8B4513] font-black">ค่าฝากรวม:</span>
                <span className="font-mono font-extrabold text-sm text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                  {totalFee.toLocaleString()} บาท
                </span>
              </div>
            </div>
          </div>

          {/* Payment (only visible when not checking out or can toggle payImmediately) */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={payImmediately}
                disabled={!!renewItem} // Always pay upfront on renewal
                onChange={(e) => setPayImmediately(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
              />
              <span>ชำระเงินทันที</span>
            </label>

            {payImmediately && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('เงินสด')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    paymentMethod === 'เงินสด'
                      ? 'bg-green-600 text-white border-green-600 shadow'
                      : 'bg-white text-gray-500 border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  เงินสด
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('โอนเงิน')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    paymentMethod === 'โอนเงิน'
                      ? 'bg-green-600 text-white border-green-600 shadow'
                      : 'bg-white text-gray-500 border-orange-200 hover:bg-orange-50/20'
                  }`}
                >
                  โอน
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Lock className="w-4 h-4" />
            <span>{renewItem ? 'บันทึกต่ออายุ / ออกตั๋ว' : 'บันทึกการฝาก / ออกตั๋ว'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
