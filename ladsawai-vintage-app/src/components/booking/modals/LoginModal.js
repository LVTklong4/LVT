'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X } from 'lucide-react';

export default function LoginModal() {
  const {
    adminList,    handleGoogleLogin,    handleLogin,    selectedAdminEmail,    setSelectedAdminEmail,    setShowLoginModal,    showLoginModal
  } = useBooking();

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border-2 border-amber-800 overflow-hidden animate-pop-in">
            <div className="bg-amber-800 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">เข้าสู่ระบบทีมงานผู้ดูแล</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-amber-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white border border-gray-300 rounded-lg font-bold text-xs text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <img 
                  src="https://www.vectorlogo.zone/logos/google/google-icon.svg" 
                  alt="Google" 
                  className="w-4 h-4" 
                />
                เข้าสู่ระบบด้วยบัญชี Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold">หรือใช้ระบบทดสอบ (Bypass)</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">เลือกชื่อผู้ใช้ทดสอบ</label>
                <select
                  value={selectedAdminEmail}
                  onChange={(e) => setSelectedAdminEmail(e.target.value)}
                  className="p-2 border border-amber-300 rounded bg-amber-50/50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- โปรดเลือกผู้ใช้งาน --</option>
                  {adminList.map(a => (
                    <option key={a.email} value={a.email}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white rounded font-bold text-xs transition-all shadow"
              >
                เข้าสู่ระบบ (Bypass)
              </button>
            </div>
          </div>
        </div>
  );
}
