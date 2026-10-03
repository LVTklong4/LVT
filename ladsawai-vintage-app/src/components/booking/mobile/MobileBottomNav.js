'use client';

import React, { useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useStorage } from '@/context/StorageContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import {
  MapPin, CalendarDays, Package, Banknote, Menu,
  Store, FileText, Settings, Info, LogOut, LogIn,
  X, CheckCircle, ChevronUp, AlertCircle
} from 'lucide-react';

export default function MobileBottomNav({
  onOpenOffGrid,
  onOpenKlongThom,
  onOpenDailyClosing
}) {
  const { adminUser } = useAuthAdmin();
  const {
    bookings,
    setShowLoginModal,
    setShowMonthlyMgmtModal,
    setShowStandbyModal,
    setShowActivityLogsModal,
    setShowSettingsMgmtModal,
    handleLogout
  } = useBooking();

  const { setShowStorageMgmtModal } = useStorage();

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Stats for badge
  const unpaidCount = bookings.filter(b => b.status === 'ค้างชำระ').length;

  return (
    <>
      {/* Slide-up "More" Action Sheet Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs md:hidden animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="bg-[#FFFDF9] rounded-t-2xl shadow-2xl w-full border-t-2 border-[#8B4513] z-50 p-4 pb-8 flex flex-col gap-3 relative animate-slide-up text-[#4A3B32]">
            {/* Pull handle */}
            <div className="w-10 h-1 bg-[#8B4513]/30 rounded-full mx-auto mb-1" />

            <div className="flex justify-between items-center border-b border-[#8B4513]/15 pb-2.5">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-[#8B4513]" />
                <h3 className="font-extrabold text-sm text-[#4A3B32]">เมนูระบบเพิ่มเติม</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenOffGrid?.();
                }}
                className="p-3 bg-white hover:bg-amber-50 active:scale-95 border border-[#8B4513]/15 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#8B4513] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[#4A3B32] font-black">จองนอกผัง</div>
                  <div className="text-[10px] text-gray-500 font-medium">บันทึกแผงจรชั่วคราว</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenKlongThom?.();
                }}
                className="p-3 bg-white hover:bg-amber-50 active:scale-95 border border-[#8B4513]/15 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-red-800 font-black">คลองถม</div>
                  <div className="text-[10px] text-gray-500 font-medium">จัดเก็บรายวันคลองถม</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowStandbyModal(true);
                }}
                className="p-3 bg-white hover:bg-amber-50 active:scale-95 border border-[#8B4513]/15 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-purple-900 font-black">คิวสำรองผู้ค้า</div>
                  <div className="text-[10px] text-gray-500 font-medium">จัดลำดับผู้รอเสียบ</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowActivityLogsModal(true);
                }}
                className="p-3 bg-white hover:bg-amber-50 active:scale-95 border border-[#8B4513]/15 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-emerald-900 font-black">ประวัติทีมงาน</div>
                  <div className="text-[10px] text-gray-500 font-medium">Audit Activity Logs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowSettingsMgmtModal(true);
                }}
                className="p-3 bg-white hover:bg-amber-50 active:scale-95 border border-[#8B4513]/15 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-blue-900 font-black">ตั้งค่าระบบ</div>
                  <div className="text-[10px] text-gray-500 font-medium">ราคาแผงและสิทธิ์</div>
                </div>
              </button>

              {adminUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleLogout();
                  }}
                  className="p-3 bg-red-50 hover:bg-red-100 active:scale-95 border border-red-200 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-200 flex items-center justify-center text-red-800 shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-red-900 font-black">ออกจากระบบ</div>
                    <div className="text-[10px] text-red-600 font-medium">{adminUser.name}</div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowLoginModal(true);
                  }}
                  className="p-3 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-300 rounded-xl flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center text-amber-900 shrink-0">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-amber-950 font-black">เข้าสู่ระบบ</div>
                    <div className="text-[10px] text-amber-700 font-medium">สำหรับเจ้าหน้าที่</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom App Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t-2 border-[#8B4513]/25 shadow-2xl px-2 py-1 flex justify-around items-center md:hidden pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      >
        {/* 1. Daily Map */}
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl active:scale-90 transition-all text-[#8B4513] hover:bg-amber-100/50 relative cursor-pointer"
        >
          <div className="relative">
            <MapPin className="w-5 h-5 text-[#8B4513]" />
            {unpaidCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unpaidCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black mt-0.5 tracking-tight text-[#5D4037]">ผังรายวัน</span>
        </button>

        {/* 2. Monthly Bookings */}
        <button
          type="button"
          onClick={() => setShowMonthlyMgmtModal(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl active:scale-90 transition-all text-[#5D4037] hover:bg-amber-100/50 cursor-pointer"
        >
          <CalendarDays className="w-5 h-5 text-purple-700" />
          <span className="text-[10px] font-black mt-0.5 tracking-tight text-purple-900">รายเดือน</span>
        </button>

        {/* 3. Storage */}
        <button
          type="button"
          onClick={() => setShowStorageMgmtModal(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl active:scale-90 transition-all text-[#5D4037] hover:bg-amber-100/50 cursor-pointer"
        >
          <Package className="w-5 h-5 text-amber-700" />
          <span className="text-[10px] font-black mt-0.5 tracking-tight text-amber-900">ฝากของ</span>
        </button>

        {/* 4. Daily Closing / Finance */}
        <button
          type="button"
          onClick={() => {
            if (adminUser) {
              onOpenDailyClosing?.();
            } else {
              setShowLoginModal(true);
            }
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl active:scale-90 transition-all text-[#5D4037] hover:bg-amber-100/50 cursor-pointer"
        >
          <Banknote className="w-5 h-5 text-emerald-700" />
          <span className="text-[10px] font-black mt-0.5 tracking-tight text-emerald-900">ปิดกะ/สรุป</span>
        </button>

        {/* 5. More Actions */}
        <button
          type="button"
          onClick={() => setShowMoreMenu(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl active:scale-90 transition-all text-[#5D4037] hover:bg-amber-100/50 cursor-pointer"
        >
          <Menu className="w-5 h-5 text-gray-700" />
          <span className="text-[10px] font-black mt-0.5 tracking-tight text-gray-700">เพิ่มเติม</span>
        </button>
      </nav>
    </>
  );
}
