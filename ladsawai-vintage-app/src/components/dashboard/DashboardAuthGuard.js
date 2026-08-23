"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthAdmin } from "@/context/AuthAdminContext";
import { ShieldAlert, Lock, ArrowLeft, RefreshCw } from "lucide-react";

export default function DashboardAuthGuard({ children }) {
  const { adminUser, loadingAuth, handleGoogleLogin } = useAuthAdmin();
  const [loggingIn, setLoggingIn] = useState(false);

  // 1. Loading state while verifying authentication session
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#FDF5E6] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-200 flex flex-col items-center gap-3 text-center max-w-sm w-full animate-fade-in">
          <RefreshCw className="w-10 h-10 text-amber-700 animate-spin" />
          <h3 className="font-bold text-sm text-stone-800">กำลังตรวจสอบสิทธิ์การเข้าถึง...</h3>
          <p className="text-xs text-gray-500">กรุณารอสักครู่ ระบบกำลังยืนยันความปลอดภัย</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated or Suspended admin state
  if (!adminUser || adminUser.status !== "เปิด") {
    return (
      <div className="min-h-screen bg-[#FDF5E6] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden text-center animate-pop-in">
          {/* Header */}
          <div className="bg-stone-900 text-white p-6 flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-amber-500/20 border border-amber-400/40 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">พื้นที่เฉพาะทีมงานผู้ดูแล</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              Restricted Access
            </span>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col gap-5">
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              หน้านี้ประกอบด้วยข้อมูลสถิติภาพรวม ตัวชี้วัดสำคัญ และบัญชีรายรับ-รายจ่ายของตลาด 
              กรุณาเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับสิทธิ์แอดมินก่อนเข้าใช้งาน
            </p>

            {/* Google Login Button */}
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
              className="w-full py-3 px-4 bg-white border-2 border-amber-400 hover:border-amber-600 rounded-xl font-bold text-xs text-stone-800 hover:bg-amber-50/50 transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer group disabled:opacity-50"
            >
              <img 
                src="https://www.vectorlogo.zone/logos/google/google-icon.svg" 
                alt="Google" 
                className="w-5 h-5 group-hover:scale-110 transition-transform" 
              />
              <span className="text-sm font-extrabold text-stone-800 group-hover:text-amber-950">
                {loggingIn ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Google"}
              </span>
            </button>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-900 text-left">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>เฉพาะอีเมล Gmail ที่ลงทะเบียนในตารางสิทธิ์ผู้ดูแลตลาดเท่านั้น</span>
            </div>

            {/* Back to Home Link */}
            <Link
              href="/"
              className="mt-2 text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าผังตลาด</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized admin user
  return <>{children}</>;
}
