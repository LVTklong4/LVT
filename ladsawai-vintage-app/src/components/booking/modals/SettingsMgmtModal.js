'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Settings, Loader2, X, RotateCcw, CloudUpload, ExternalLink, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SettingsMgmtModal() {
  const {
    adminForm,
    adminRolesList,
    handleSaveAdminRole,
    loadingSettings,
    setAdminForm,
    setShowSettingsMgmtModal,
    showSettingsMgmtModal,
    handleSyncDailyFromLegacy,
    handleSyncFromLegacySheets,
    handleSyncAllFromLegacy,
    syncingLegacy,
    selectedDate,
    archiveWebhookUrl,
    setArchiveWebhookUrl,
    archivingMonth,
    archiveSelectedMonth,
    setArchiveSelectedMonth,
    handleArchiveMonthToGoogleSheets,
    showAlert
  } = useBooking();

  if (!showSettingsMgmtModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-stone-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-stone-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">⚙️ จัดการสิทธิ์แอดมิน (Admin Roles Settings)</h3>
              <button onClick={() => setShowSettingsMgmtModal(false)} className="text-stone-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Form panel */}
              <form onSubmit={handleSaveAdminRole} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-stone-50 p-4 border border-stone-200 rounded-lg">
                <h4 className="font-bold text-xs text-stone-900 border-b pb-1">เพิ่ม/แก้ไข สิทธิ์แอดมิน</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">อีเมลล็อกอิน (Google Email) *</label>
                  <input 
                    type="email" 
                    value={adminForm.email} 
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="example@gmail.com"
                    className="p-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-500 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">ชื่อแอดมิน/ชื่อเล่น *</label>
                  <input 
                    type="text" 
                    value={adminForm.name} 
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="แอดมินกิ๊ก, แอดมินส้ม"
                    className="p-1.5 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-stone-500 bg-white" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">บทบาท</label>
                    <select 
                      value={adminForm.role} 
                      onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                      className="p-1.5 border border-stone-300 rounded text-xs bg-white focus:outline-none"
                    >
                      <option value="Admin">แอดมินใหญ่ (Admin)</option>
                      <option value="Staff">พนักงาน (Staff)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">รหัสพนักงาน</label>
                    <input 
                      type="text" 
                      value={adminForm.employee_id} 
                      onChange={(e) => setAdminForm({ ...adminForm, employee_id: e.target.value })}
                      placeholder="EMP01"
                      className="p-1 border border-stone-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">สถานะเปิดใช้งาน</label>
                  <select 
                    value={adminForm.status} 
                    onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                    className="p-1.5 border border-stone-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value="เปิด">เปิดใช้งานปกติ (เปิด)</option>
                    <option value="ปิด">ระงับสิทธิ์ชั่วคราว (ปิด)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-2 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded text-xs font-bold transition-all shadow"
                >
                  บันทึกข้อมูลและสิทธิ์
                </button>
              </form>

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>ผู้มีสิทธิ์เข้าระบบทั้งหมด ({adminRolesList.length} บัญชี)</span>
                  {loadingSettings && <Loader2 className="w-4 h-4 text-stone-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-900 border-b font-bold">
                      <tr>
                        <th className="p-2">รหัสพนักงาน</th>
                        <th className="p-2">ชื่อผู้ใช้</th>
                        <th className="p-2">อีเมลล็อกอิน</th>
                        <th className="p-2">บทบาท</th>
                        <th className="p-2">สถานะ</th>
                        <th className="p-2 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {adminRolesList.map((item) => (
                        <tr key={item.email} className="hover:bg-stone-50/30">
                          <td className="p-2 font-mono font-bold text-gray-600">{item.employee_id || '-'}</td>
                          <td className="p-2 font-bold text-stone-900">{item.name}</td>
                          <td className="p-2 font-semibold text-gray-500">{item.email}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.role === 'Admin' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                              {item.role === 'Admin' ? 'ผู้ดูแลหลัก' : 'พนักงาน'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'เปิด' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status === 'เปิด' ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              onClick={() => setAdminForm(item)}
                              className="px-2 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-[10px] font-bold hover:bg-stone-200"
                            >
                              แก้ไข
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Google Drive / Sheets Archiving Section */}
            <div className="bg-blue-50/70 border-t-2 border-blue-300 p-4 shrink-0 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="font-black text-xs text-blue-950 flex items-center gap-1.5">
                    📦 จัดเก็บประวัติข้อมูลเข้า Google Sheets (Google Drive Archive)
                  </span>
                  <span className="text-[11px] text-blue-900 font-medium">
                    สร้างไฟล์ Google Sheets สรุปข้อมูลการจอง รายเดือน และบัญชีแยกตามเดือน ส่งตรงเข้าโฟลเดอร์ Google Drive อัตโนมัติ
                  </span>
                </div>
                <a
                  href="https://drive.google.com/drive/folders/1kmBElcZAAX0UbQ61cI3fbgbJHHzi6eXu"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100/60 text-blue-900 rounded-lg text-xs font-bold shadow-2xs transition-all w-fit cursor-pointer"
                >
                  <span>📂 เปิดโฟลเดอร์ Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                </a>
              </div>

              {/* Webhook Configuration & Archive Actions Bar */}
              <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-col md:flex-row items-center gap-3 justify-between">
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full">
                  <div className="w-full sm:w-auto shrink-0 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-700 shrink-0">เลือกรอบเดือน:</span>
                    <select
                      value={archiveSelectedMonth}
                      onChange={(e) => setArchiveSelectedMonth(e.target.value)}
                      className="p-1.5 border border-blue-300 rounded bg-blue-50/50 text-xs font-bold text-blue-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="2026-01">มกราคม 2569 (2026-01)</option>
                      <option value="2026-02">กุมภาพันธ์ 2569 (2026-02)</option>
                      <option value="2026-03">มีนาคม 2569 (2026-03)</option>
                      <option value="2026-04">เมษายน 2569 (2026-04)</option>
                      <option value="2026-05">พฤษภาคม 2569 (2026-05)</option>
                      <option value="2026-06">มิถุนายน 2569 (2026-06)</option>
                      <option value="2026-07">กรกฎาคม 2569 (2026-07)</option>
                      <option value="2026-08">สิงหาคม 2569 (2026-08)</option>
                      <option value="2026-09">กันยายน 2569 (2026-09)</option>
                      <option value="2026-10">ตุลาคม 2569 (2026-10)</option>
                      <option value="2026-11">พฤศจิกายน 2569 (2026-11)</option>
                      <option value="2026-12">ธันวาคม 2569 (2026-12)</option>
                    </select>
                  </div>

                  <div className="w-full flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="วาง Google Apps Script Webhook URL ที่นี่..."
                      value={archiveWebhookUrl}
                      onChange={(e) => {
                        setArchiveWebhookUrl(e.target.value);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('lvt_archive_webhook_url', e.target.value);
                        }
                      }}
                      className="flex-1 p-1.5 border border-gray-300 rounded text-xs font-mono text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('lvt_archive_webhook_url', archiveWebhookUrl);
                          showAlert('บันทึก Webhook URL สำเร็จ', 'สำเร็จ');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                      title="บันทึก Webhook URL"
                    >
                      บันทึก URL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  {/* Backup Only */}
                  <button
                    type="button"
                    onClick={() => handleArchiveMonthToGoogleSheets(archiveSelectedMonth, false)}
                    disabled={archivingMonth}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="สำรองข้อมูลรอบเดือนที่เลือกไปเก็บใน Google Drive Sheet"
                  >
                    {archivingMonth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                    <span>{archivingMonth ? 'กำลังสำรอง...' : '📤 สำรองเข้า Google Sheet'}</span>
                  </button>

                  {/* Backup and Purge from Supabase */}
                  <button
                    type="button"
                    onClick={() => handleArchiveMonthToGoogleSheets(archiveSelectedMonth, true)}
                    disabled={archivingMonth}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="สำรองข้อมูลเข้า Google Drive และล้างข้อมูลรายวันของเดือนนี้ออกจากฐานข้อมูลสด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>สำรอง & ล้างฐานข้อมูลสด</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Transition Data Sync Tools (Bottom Section) */}
            <div className="bg-amber-50/70 border-t-2 border-amber-300 p-4 shrink-0 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5 text-left w-full lg:w-auto">
                <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                  🔄 เครื่องมือดึงและแปลงข้อมูลระบบเก่า (Legacy Data Migration)
                </span>
                <span className="text-[11px] text-amber-900 font-medium">
                  ดึงข้อมูลจริงทั้งหมดจาก Google Sheets แปลงโครงสร้างและปรับสถานะผังตลาด/สัญญา/บัญชีเข้าสู่ระบบใหม่
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
                {/* Full Sync All in one click */}
                <button
                  type="button"
                  onClick={handleSyncAllFromLegacy}
                  disabled={syncingLegacy}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 active:scale-95 text-white rounded-lg text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="ดึงข้อมูลทั้งหมดทั้งการจองรายวันทุกวัน สัญญารายเดือน และธุรกรรมการเงิน"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${syncingLegacy ? 'animate-spin' : ''}`} />
                  {syncingLegacy ? 'กำลังดึงข้อมูลทั้งหมด...' : '🚀 ดึงข้อมูลระบบเก่าทั้งหมด (Full Sync)'}
                </button>

                {/* All Daily */}
                <button
                  type="button"
                  onClick={() => handleSyncDailyFromLegacy(false)}
                  disabled={syncingLegacy}
                  className="px-3 py-2 bg-amber-700 hover:bg-amber-800 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="ดึงข้อมูลการจองรายวันทั้งหมดทุกวันจากชีท Bookings"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${syncingLegacy ? 'animate-spin' : ''}`} />
                  {syncingLegacy ? 'กำลังซิงค์...' : '📅 ซิงค์รายวันทั้งหมด'}
                </button>

                {/* All Monthly & Finance */}
                <button
                  type="button"
                  onClick={() => handleSyncFromLegacySheets(false)}
                  disabled={syncingLegacy}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="ดึงข้อมูลสัญญาและประวัติการเงินรายเดือนทั้งหมด"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${syncingLegacy ? 'animate-spin' : ''}`} />
                  {syncingLegacy ? 'กำลังซิงค์...' : '🏢 ซิงค์รายเดือน & บัญชี'}
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}
