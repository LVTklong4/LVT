'use client';

import React, { useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { X, ShieldCheck, Lock } from 'lucide-react';

export default function LoginModal() {
  const {
    handleGoogleLogin,
    setShowLoginModal,
    showLoginModal
  } = useBooking();

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
        </div>
      </div>
    </div>
  );
}
