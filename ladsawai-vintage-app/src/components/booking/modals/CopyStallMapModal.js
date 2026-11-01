'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { useBooking } from '@/context/BookingContext';
import { getCopyableBookings, copyBookingsBetweenDates } from '@/services/booking/copyStallMapService';
import { broadcastBookingSync, SYNC_EVENT_TYPES } from '@/utils/broadcastSync';
import { Copy, X, Calendar, AlertCircle, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CopyStallMapModal({ isOpen, onClose, defaultTargetDate }) {
  const { adminUser } = useAuthAdmin();
  const { showAlert, fetchBookingsAndStorage, setSelectedDate } = useBooking();

  const [sourceDate, setSourceDate] = useState('2026-10-30');
  const [targetDate, setTargetDate] = useState(() => defaultTargetDate || '2026-11-06');
  const [sourceCount, setSourceCount] = useState(null);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);

  // Sync defaultTargetDate if prop changes
  useEffect(() => {
    if (defaultTargetDate) {
      setTargetDate(defaultTargetDate);
    }
  }, [defaultTargetDate]);

  // Check source bookings count whenever sourceDate changes
  useEffect(() => {
    let isMounted = true;
    async function loadCount() {
      if (!sourceDate) return;
      setLoadingCheck(true);
      const res = await getCopyableBookings(supabase, sourceDate);
      if (isMounted) {
        setSourceCount(res.count);
        setLoadingCheck(false);
      }
    }
    loadCount();
    return () => { isMounted = false; };
  }, [sourceDate]);

  if (!isOpen) return null;

  const handleExecuteCopy = async () => {
    if (!sourceDate || !targetDate) {
      alert('กรุณาระบุทั้งวันที่ต้นทางและวันที่ปลายทาง');
      return;
    }
    if (sourceDate === targetDate) {
      alert('วันที่ต้นทางและปลายทางต้องไม่ใช่วันเดียวกัน');
      return;
    }
    if (sourceCount === 0) {
      alert('ไม่พบข้อมูลการจองในวันที่ต้นทาง');
      return;
    }

    const isConfirmed = window.confirm(
      `ยืนยันคัดลอกข้อมูลการจองรายวันจากวันที่ ${sourceDate} (${sourceCount} รายการ) มาลงในวันที่ ${targetDate} หรือไม่?\n\n(ล็อคที่มีการจองอยู่แล้วจะไม่ถูกเขียนทับ)`
    );
    if (!isConfirmed) return;

    setLoadingCopy(true);
    try {
      const res = await copyBookingsBetweenDates({
        supabase,
        sourceDate,
        targetDate,
        adminUser
      });

      if (res.success) {
        if (typeof showAlert === 'function') {
          showAlert(
            `คัดลอกข้อมูลลงผังสำเร็จเรียบร้อย ${res.copiedCount} รายการ ${res.skippedCount > 0 ? `(ข้ามล็อคที่มีการจองอยู่แล้ว ${res.skippedCount} ล็อค)` : ''}`,
            'สำเร็จ'
          );
        } else {
          alert(`คัดลอกสำเร็จ ${res.copiedCount} รายการ`);
        }

        // Switch active date to targetDate and refresh map
        if (typeof setSelectedDate === 'function') {
          setSelectedDate(targetDate);
        }
        if (typeof fetchBookingsAndStorage === 'function') {
          fetchBookingsAndStorage();
        }
        broadcastBookingSync({ type: SYNC_EVENT_TYPES.BOOKING_MUTATION, date: targetDate });

        onClose();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (res.error || 'ไม่สามารถคัดลอกข้อมูลได้'));
      }
    } finally {
      setLoadingCopy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#8B4513] overflow-hidden flex flex-col animate-pop-in">
        
        {/* Header */}
        <div className="bg-[#5D4037] text-white px-5 py-3.5 flex justify-between items-center shrink-0 border-b-2 border-[#8B4513]">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-300" />
            <span>คัดลอกข้อมูลผังจากวันก่อนหน้า</span>
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-amber-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col gap-4 text-xs font-bold text-gray-700">
          
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-[#4A3B32]">
            <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              ฟังก์ชันนี้จะดึงข้อมูลรายวันจากวันต้นทาง (ชื่อผู้ค้า, สินค้า, เลขล็อค) มาสร้างเป็นรายการจองในวันเป้าหมายในสถานะ <strong>"ค้างชำระ"</strong> เพื่อเตรียมรอเก็บเงิน โดยจะไม่ทับล็อคที่มีการจองอยู่แล้ว
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-1 gap-3.5 bg-white border border-[#8B4513]/15 rounded-xl p-3.5 shadow-2xs">
            
            {/* 1. Source Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600 flex items-center justify-between">
                <span>1. วันที่ต้นทาง (ดึงข้อมูลมา)</span>
                {loadingCheck ? (
                  <span className="text-amber-700 flex items-center gap-1 font-normal text-[10px]">
                    <Loader2 className="w-3 h-3 animate-spin" /> กำลังตรวจสอบ...
                  </span>
                ) : sourceCount !== null ? (
                  <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    พบ {sourceCount} รายการ
                  </span>
                ) : null}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={sourceDate}
                  onChange={(e) => setSourceDate(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setSourceDate('2026-10-30')}
                  className="px-2.5 py-2 rounded-lg text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer shrink-0"
                >
                  30 ต.ค.
                </button>
              </div>
            </div>

            <div className="flex justify-center text-amber-800">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* 2. Target Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">
                2. วันที่ปลายทาง (ลงข้อมูลในผัง)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setTargetDate('2026-11-06')}
                  className="px-2.5 py-2 rounded-lg text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer shrink-0"
                >
                  6 พ.ย.
                </button>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingCopy}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleExecuteCopy}
              disabled={loadingCopy || loadingCheck || sourceCount === 0}
              className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-800 to-[#5D4037] hover:from-amber-900 hover:to-[#4A2E1B] text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingCopy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังคัดลอก...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-200" />
                  <span>คัดลอกลงผัง ({sourceCount || 0} รายการ)</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
