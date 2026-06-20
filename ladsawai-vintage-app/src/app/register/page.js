'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { Info, UserCheck, Smartphone, ShoppingBag } from 'lucide-react';

export default function RegisterPage() {
  const [liffLoaded, setLiffLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('กำลังโหลดระบบ LINE LIFF...');
  
  // User Profile States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Form States
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [isExisting, setIsExisting] = useState(false);

  const LIFF_ID = "2008895416-3c35BsXZ";

  // Initialize LIFF once script is loaded
  const initLiff = async () => {
    try {
      setStatusText("กำลังตรวจสอบการเข้าสู่ระบบ LINE...");
      await window.liff.init({ liffId: LIFF_ID });
      setLiffLoaded(true);

      if (window.liff.isLoggedIn()) {
        setIsLoggedIn(true);
        setStatusText("ยืนยันตัวตนสำเร็จ กำลังดึงโปรไฟล์...");
        await getProfileAndCheckDB();
      } else {
        setIsLoggedIn(false);
        setStatusText("รอการกดปุ่มเพื่อยืนยันตัวตนด้วย LINE");
      }
    } catch (err) {
      console.error(err);
      setStatusText(`แอปพลิเคชันกำลังทำงานภายนอกระบบเฟรม หรือเกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const getProfileAndCheckDB = async () => {
    setLoading(true);
    try {
      const profile = await window.liff.getProfile();
      setUserProfile(profile);

      // Check if user is already in Supabase members table
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('line_user_id', profile.userId)
        .single();

      if (data) {
        setShopName(data.shop_name || '');
        setPhone(data.phone || '');
        setIsExisting(true);
        setStatusText("พบข้อมูลเดิมของคุณ ดึงข้อมูลการลงทะเบียนมาแสดงแล้ว");
      } else {
        setIsExisting(false);
        setStatusText("ยินดีต้อนรับสมาชิกใหม่! โปรดกรอกข้อมูลเพื่อลงทะเบียน");
      }
    } catch (err) {
      console.error("Error profile check:", err);
      setStatusText(`ดึงโปรไฟล์ไม่สำเร็จ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startLineLogin = () => {
    if (!window.liff) {
      alert("LINE LIFF SDK ยังโหลดไม่เสร็จสมบูรณ์");
      return;
    }
    if (!window.liff.isLoggedIn()) {
      window.liff.login();
    } else {
      getProfileAndCheckDB();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      alert("กรุณายืนยันตัวตนด้วย LINE ก่อนทำรายการ");
      return;
    }
    if (!shopName.trim() || !phone.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (phone.length < 9) {
      alert("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)");
      return;
    }

    setLoading(true);
    setStatusText("กำลังบันทึกข้อมูล...");

    try {
      const timestamp = new Date().toISOString();
      const payload = {
        line_user_id: userProfile.userId,
        name: userProfile.displayName,
        picture_url: userProfile.pictureUrl || '',
        shop_name: shopName.trim(),
        phone: phone.trim(),
        status: 'Active',
        registered_date: timestamp,
        note: isExisting ? 'Updated via Next.js LIFF' : 'Registered via Next.js LIFF'
      };

      // Upsert to Supabase
      const { error } = await supabase
        .from('members')
        .upsert(payload);

      if (error) throw error;

      alert(isExisting ? "อัปเดตข้อมูลร้านค้าเรียบร้อยแล้ว!" : "ลงทะเบียนสมาชิกตลาดนัดสำเร็จแล้ว!");
      
      // Close LIFF in-app browser
      if (window.liff && window.liff.isInClient()) {
        window.liff.closeWindow();
      } else {
        setStatusText("บันทึกข้อมูลสำเร็จ! คุณสามารถปิดหน้านี้ได้เลยครับ");
      }

    } catch (err) {
      console.error(err);
      alert(`บันทึกข้อมูลล้มเหลว: ${err.message}`);
      setStatusText("การลงทะเบียนขัดข้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#FDF5E6] p-4">
      {/* LINE SDK script loader */}
      <Script 
        src="https://static.line-scdn.net/liff/edge/2/sdk.js" 
        onLoad={initLiff}
        onError={() => setStatusText("โหลด LINE SDK ล้มเหลว")}
      />

      <div className="w-full max-w-sm bg-[#FFF8DC] border-2 border-[#8B4513] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Paper texture overlay */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper.png')" }}
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo / Profile picture */}
          {userProfile ? (
            <div className="w-20 h-20 rounded-full border-4 border-[#8B4513] overflow-hidden bg-[#E0C097] mb-3 shadow-inner">
              <img 
                src={userProfile.pictureUrl || "https://img2.pic.in.th/pic/Profile-Alpha_0.png"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" 
                alt="LINE Logo" 
                className="w-16 h-16 mx-auto drop-shadow" 
              />
            </div>
          )}

          <h2 className="text-lg md:text-xl font-extrabold text-[#5D4037] text-center font-hand">
            {userProfile ? `สวัสดีคุณ ${userProfile.displayName}` : 'ระบบลงทะเบียนสมาชิก'}
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1 mb-4 text-center">
            ตลาดนัดลาดสวายวินเทจ
          </p>

          {!isLoggedIn ? (
            <div className="w-full flex flex-col gap-4 text-center">
              <p className="text-xs text-amber-900/80 font-bold bg-amber-50 border border-amber-200 rounded p-2">
                ต้องการเข้าถึงโปรไฟล์เพื่อเชื่อมโยงบัญชีและสิทธิ์ในการฝากของ/จองล็อคประจำ
              </p>
              
              <button 
                onClick={startLineLogin}
                className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                ยืนยันตัวตนด้วย LINE
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="w-full text-left flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#8D6E63] flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" /> ชื่อร้านค้าของคุณ
                </label>
                <input
                  type="text"
                  placeholder="ระบุชื่อร้านค้าที่จะขึ้นบอร์ด"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#D2B48C] rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8B4513] shadow-inner"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#8D6E63] flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  placeholder="เช่น 0891234567"
                  maxLength="10"
                  pattern="[0-9]{9,10}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-white border-2 border-[#D2B48C] rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8B4513] shadow-inner"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#8B4513] hover:bg-[#6D4C41] disabled:bg-gray-400 text-white font-extrabold rounded-lg shadow-md transition-all text-xs font-hand mt-2"
              >
                {loading ? 'กำลังดำเนินรายการ...' : 'บันทึกข้อมูลลงทะเบียน'}
              </button>
            </form>
          )}

          {/* Status logs text */}
          <div className="mt-6 text-[10px] text-gray-400 font-bold bg-amber-50/40 p-2 rounded border border-amber-100 flex items-center gap-1.5 w-full justify-center">
            <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span className="truncate">{statusText}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
