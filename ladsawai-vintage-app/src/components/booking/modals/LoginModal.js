'use client';

import React, { useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, ShieldCheck, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export default function LoginModal() {
  const {
    adminList,
    handleGoogleLogin,
    handleLogin,
    selectedAdminEmail,
    setSelectedAdminEmail,
    setShowLoginModal,
    showLoginModal
  } = useBooking();

  const [showBypass, setShowBypass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-stone-200 overflow-hidden animate-pop-in flex flex-col text-left">
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">เข้าสู่ระบบทีมงานผู้ดูแล</h3>
          </div>
          <button 
            onClick={() => setShowLoginModal(false)} 
            className="text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div className="text-center flex flex-col gap-1">
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับสิทธิ์ในการบริหารจัดการตลาด
            </p>
          </div>
          
          {/* Primary Action: Google Sign-In Button */}
          <button
            type="button"
            onClick={async () => {
              setLoggingIn(true);
              try {
                await handleGoogleLogin();
              } finally {
                setLoggingIn(false);
              }
            }}
            disabled={loggingIn}
            className="w-full py-3 px-4 bg-white border-2 border-gray-200 hover:border-amber-500 rounded-xl font-bold text-xs text-gray-800 hover:bg-amber-50/40 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer group disabled:opacity-50"
          >
            <img 
              src="https://www.vectorlogo.zone/logos/google/google-icon.svg" 
              alt="Google" 
              className="w-5 h-5 group-hover:scale-110 transition-transform" 
            />
            <span className="text-sm font-extrabold text-gray-700 group-hover:text-amber-950">
              {loggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}
            </span>
          </button>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-900 font-medium leading-normal">
            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>เฉพาะอีเมล Gmail ที่ลงทะเบียนในตารางสิทธิ์แอดมินเท่านั้นที่จะสามารถเข้าใช้งานได้</span>
          </div>

          {/* Dev Bypass Section (Collapsible) */}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <button
              type="button"
              onClick={() => setShowBypass(!showBypass)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer py-1 select-none"
            >
              <span>⚙️ ตัวเลือกระบบทดสอบ (Dev Bypass)</span>
              {showBypass ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showBypass && (
              <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2.5 animate-fade-in">
                <label className="text-[11px] font-bold text-gray-600">เลือกชื่อผู้ใช้ทดสอบในระบบ</label>
                <select
                  value={selectedAdminEmail}
                  onChange={(e) => setSelectedAdminEmail(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                >
                  <option value="">-- โปรดเลือกผู้ใช้งาน --</option>
                  {adminList.map(a => (
                    <option key={a.email} value={a.email}>{a.name} ({a.role})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  เข้าสู่ระบบ (Bypass Mode)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
