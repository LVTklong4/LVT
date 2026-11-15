'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { Store, Phone, CheckCircle2, AlertCircle, Loader2, UserCheck, X } from 'lucide-react';

export default function LineRegisterPage() {
  const [liffLoaded, setLiffLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [successData, setSuccessData] = useState(null);

  const liffId = '2008895416-VNkDCPju';

  // Initialize LIFF once SDK script loads
  const initLiff = async () => {
    if (typeof window === 'undefined' || !window.liff) return;

    try {
      await window.liff.init({ liffId });
      setLiffLoaded(true);

      if (!window.liff.isLoggedIn()) {
        if (!window.liff.isInClient()) {
          // If opened in external mobile browser, trigger login
          window.liff.login();
          return;
        }
      }

      const userProfile = await window.liff.getProfile();
      setProfile(userProfile);
    } catch (err) {
      console.error('[LIFF Init Error]', err);
      setErrorMsg('ไม่สามารถเชื่อมต่อกับระบบ LINE ได้ กรุณาลองเปิดใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!profile?.userId) {
      setErrorMsg('ไม่พบข้อมูลผู้ใช้ LINE กรุณารีเฟรชหน้าใหม่อีกครั้ง');
      return;
    }

    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 9) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/line/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: profile.userId,
          phone: clean,
          displayName: profile.displayName || '',
          pictureUrl: profile.pictureUrl || ''
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'การลงทะเบียนไม่สำเร็จ');
      }

      setSuccessData(data);
    } catch (err) {
      console.error('[Register Error]', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else {
      window.close();
    }
  };

  return (
    <>
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={initLiff}
      />

      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center p-4">
        <div className="bg-[#FFFDF9] rounded-2xl shadow-xl w-full max-w-sm border-2 border-[#8B4513] overflow-hidden flex flex-col text-[#4A3B32] animate-pop-in">
          
          {/* Header */}
          <div className="bg-[#5D4037] text-amber-50 px-5 py-4 flex items-center justify-between border-b border-[#8B4513]/30">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-extrabold text-sm leading-none">ตลาดนัดลาดสวายวินเทจ</h3>
                <p className="text-[10px] text-amber-200 mt-0.5">ระบบบริการผู้ค้ารายเดือนผ่าน LINE</p>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-gray-500 font-bold text-xs">
                <Loader2 className="w-8 h-8 text-[#8B4513] animate-spin" />
                <span>กำลังโหลดข้อมูล LINE...</span>
              </div>
            ) : successData ? (
              /* Success View */
              <div className="py-6 flex flex-col items-center text-center gap-3 animate-pop-in">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-lg font-black text-green-800">ผูกบัญชีร้านค้าสำเร็จ!</h4>
                  <p className="text-xs text-gray-600 font-bold">
                    ยินดีต้อนรับร้าน <span className="text-[#8B4513] font-black">{successData.customerName}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    ท่านสามารถพิมพ์ <strong className="text-[#8B4513]">"เช็คยอด"</strong> ในแชท LINE เพื่อตรวจสอบยอดได้ทันที
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full mt-4 py-2.5 bg-[#8B4513] hover:bg-[#5D4037] text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  ปิดหน้านี้ (กลับสู่ห้องแชท)
                </button>
              </div>
            ) : (
              /* Registration Form View */
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                {/* User Avatar & Name */}
                {profile && (
                  <div className="bg-[#FAF0E6] p-3 rounded-xl border border-[#8B4513]/15 flex items-center gap-3">
                    {profile.pictureUrl ? (
                      <img
                        src={profile.pictureUrl}
                        alt="LINE Avatar"
                        className="w-11 h-11 rounded-full border-2 border-white shadow-xs object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-amber-200 flex items-center justify-center font-black text-amber-900 text-sm">
                        {profile.displayName?.[0] || 'L'}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-gray-500 font-bold">บัญชี LINE ที่กำลังเชื่อมต่อ:</span>
                      <span className="text-xs font-black text-[#5D4037] truncate max-w-[190px]">
                        {profile.displayName || 'LINE User'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#8B4513]" /> เบอร์โทรศัพท์ที่แจ้งไว้กับตลาด *
                  </label>
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 0860306794"
                    maxLength={12}
                    className="p-3 border-2 border-amber-200 rounded-xl text-center text-sm font-mono font-bold tracking-wider focus:border-[#8B4513] focus:ring-0 bg-white"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    * กรุณากรอกเบอร์โทรศัพท์ที่ใช้ทำสัญญาเช่าล็อครายเดือน
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !profile}
                  className={`w-full py-3 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    submitting || !profile
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-[#8B4513] hover:bg-[#5D4037]'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบข้อมูล...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> ยืนยันการผูกบัญชีร้านค้า
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
