'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Settings, Loader2, X } from 'lucide-react';

export default function SettingsMgmtModal() {
  const {
    adminForm,    adminRolesList,    handleSaveAdminRole,    loadingSettings,    setAdminForm,    setShowSettingsMgmtModal,    showSettingsMgmtModal
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
          </div>
        </div>
  );
}
