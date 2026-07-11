'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Loader2, X, Printer } from 'lucide-react';

export default function StorageMgmtModal() {
  const {
    handleOpenStoragePrintModal,    handleSaveStorage,    handleToggleStorageStatus,    loadingStorage,    note,    setShowStorageMgmtModal,    setStorageForm,    showStorageMgmtModal,    storageForm,    storageList
  } = useBooking();

  if (!showStorageMgmtModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border-2 border-amber-800 overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
            <div className="bg-amber-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-1.5">📦 จัดการฝากของ (Storage Management)</h3>
              <button onClick={() => setShowStorageMgmtModal(false)} className="text-amber-200 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
              {/* Form panel */}
              <form onSubmit={handleSaveStorage} className="flex flex-col gap-3 w-full md:w-80 shrink-0 bg-amber-50/40 p-4 border border-amber-200 rounded-lg">
                <h4 className="font-bold text-xs text-[#8B4513] border-b pb-1">เพิ่ม/แก้ไข รายการฝากของ</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">เลขล็อค *</label>
                  <input 
                    type="text" 
                    value={storageForm.stall_name} 
                    onChange={(e) => setStorageForm({ ...storageForm, stall_name: e.target.value })}
                    placeholder="เช่น A01, B04"
                    className="p-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">ชื่อผู้ฝาก *</label>
                  <input 
                    type="text" 
                    value={storageForm.owner_name} 
                    onChange={(e) => setStorageForm({ ...storageForm, owner_name: e.target.value })}
                    placeholder="ชื่อจริง/ชื่อร้าน"
                    className="p-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white" 
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    value={storageForm.phone} 
                    onChange={(e) => setStorageForm({ ...storageForm, phone: e.target.value })}
                    placeholder="08xxxxxxxx"
                    className="p-1.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่เริ่มฝาก</label>
                    <input 
                      type="date" 
                      value={storageForm.start_date} 
                      onChange={(e) => setStorageForm({ ...storageForm, start_date: e.target.value })}
                      className="p-1 border border-amber-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-700">วันที่สิ้นสุด</label>
                    <input 
                      type="date" 
                      value={storageForm.end_date} 
                      onChange={(e) => setStorageForm({ ...storageForm, end_date: e.target.value })}
                      className="p-1 border border-amber-300 rounded text-xs bg-white text-center" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">สถานะ</label>
                  <select 
                    value={storageForm.status} 
                    onChange={(e) => setStorageForm({ ...storageForm, status: e.target.value })}
                    className="p-1.5 border border-amber-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value="Active">กำลังฝาก (Active)</option>
                    <option value="Inactive">นำของออกแล้ว (Inactive)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-700">หมายเหตุ</label>
                  <textarea 
                    value={storageForm.note} 
                    onChange={(e) => setStorageForm({ ...storageForm, note: e.target.value })}
                    rows="2"
                    placeholder="รายละเอียดสิ่งของฝาก..."
                    className="p-1.5 border border-amber-300 rounded text-xs bg-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button 
                    type="submit" 
                    className="flex-1 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition-all shadow"
                  >
                    บันทึกข้อมูล
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStorageForm({ id: '', stall_name: '', owner_name: '', phone: '', start_date: '', end_date: '', status: 'Active', note: '' })}
                    className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition-all"
                  >
                    ล้างค่า
                  </button>
                </div>
              </form>

              {/* List panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <h4 className="font-bold text-xs text-gray-800 border-b pb-1.5 mb-2 flex justify-between items-center">
                  <span>รายการฝากของทั้งหมด ({storageList.length} รายการ)</span>
                  {loadingStorage && <Loader2 className="w-4 h-4 text-amber-800 animate-spin" />}
                </h4>
                
                <div className="overflow-x-auto border rounded-lg max-h-[50vh]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-amber-50 text-amber-900 border-b font-bold">
                      <tr>
                        <th className="p-2">ล็อค</th>
                        <th className="p-2">ผู้ฝาก / เบอร์</th>
                        <th className="p-2">วันที่เริ่ม-สิ้นสุด</th>
                        <th className="p-2">สถานะ</th>
                        <th className="p-2 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {storageList.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/30">
                          <td className="p-2 font-bold text-[#8B4513]">{item.stall_name}</td>
                          <td className="p-2">
                            <div className="font-semibold">{item.owner_name}</div>
                            <div className="text-[10px] text-gray-500">{item.phone || '-'}</div>
                          </td>
                          <td className="p-2 text-[10px]">
                            <div>เริ่ม: {item.start_date || '-'}</div>
                            <div>สิ้นสุด: {item.end_date || '-'}</div>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.status === 'Active' ? 'ฝากอยู่' : 'นำออกแล้ว'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button 
                                onClick={() => setStorageForm(item)}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100"
                              >
                                แก้ไข
                              </button>
                              <button 
                                onClick={() => handleToggleStorageStatus(item)}
                                className={`px-2 py-0.5 border rounded text-[10px] font-bold ${
                                  item.status === 'Active' 
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                }`}
                              >
                                {item.status === 'Active' ? 'เช็คออก' : 'เช็คอิน'}
                              </button>
                              <button 
                                onClick={() => handleOpenStoragePrintModal(item)}
                                className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100 flex items-center gap-0.5"
                              >
                                <Printer className="w-3 h-3" /> พิมพ์
                              </button>
                            </div>
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
