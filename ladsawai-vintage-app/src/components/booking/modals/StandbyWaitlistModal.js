'use client';

import React, { useState } from 'react';
import { 
  X, ClipboardList, Plus, Phone, User, Store, Calendar, 
  CheckCircle, Clock, Trash2, ArrowRightCircle 
} from 'lucide-react';
import { getModalDateFormat } from '@/utils/thaiDateHelper';

export default function StandbyWaitlistModal({
  show,
  onClose,
  selectedDate,
  standbyList,
  handleAddStandbyQueue,
  handleUpdateStandbyStatus,
  handleDeleteStandbyQueue,
  adminUser
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState('');
  const [preferredZone, setPreferredZone] = useState('อาหาร');
  const [preferredStallName, setPreferredStallName] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

  if (!show) return null;

  const handleSubmitNewStandby = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('โปรดระบุชื่อผู้ค้า/เบอร์โทร');
      return;
    }
    handleAddStandbyQueue({
      date: selectedDate,
      booker_name: name.trim(),
      phone: phone.trim(),
      product: product.trim(),
      preferred_zone: preferredZone,
      preferred_stall_name: preferredStallName.trim(),
      status: 'รอคิว',
      officer: adminUser?.name || 'เจ้าหน้าที่'
    });

    // Reset Form
    setName('');
    setPhone('');
    setProduct('');
    setPreferredStallName('');
    setActiveTab('list');
  };

  const filteredStandbyList = standbyList.filter(item => {
    const matchesDate = !selectedDate || item.date === selectedDate;
    const matchesStatus = filterStatus === 'ทั้งหมด' || item.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-2 border-[#8B4513] overflow-hidden animate-pop-in">
        
        {/* Header */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] text-[#4A3B32] px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#8B4513]" />
            <h3 className="font-extrabold text-base">ระบบคิวสำรองผู้ค้า (Standby Waitlist)</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-[#8B4513] p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Banner & Tabs */}
        <div className="bg-[#FAF6EE] border-b border-[#8B4513]/15 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5D4037]">
            <Calendar className="w-4 h-4 text-[#8B4513]" />
            <span>วันที่: <span className="font-extrabold text-amber-900">{getModalDateFormat(selectedDate)}</span></span>
            <span className="bg-[#F5E6D3] text-[#8B4513] px-2 py-0.5 rounded-full text-[10px] font-black">
              {filteredStandbyList.length} คิว
            </span>
          </div>

          <div className="flex gap-1 bg-amber-100/60 p-1 rounded-xl border border-amber-200">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list' 
                  ? 'bg-[#8B4513] text-white shadow-xs' 
                  : 'text-gray-700 hover:bg-amber-100'
              }`}
            >
              รายชื่อคิวสำรอง
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'add' 
                  ? 'bg-[#8B4513] text-white shadow-xs' 
                  : 'text-gray-700 hover:bg-amber-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> ลงคิวใหม่
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'add' ? (
            /* Add Form */
            <form onSubmit={handleSubmitNewStandby} className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5D4037] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#8B4513]" /> ชื่อผู้ค้า / ชื่อร้าน *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ร้านลุงสมชาย"
                    className="p-2 border border-[#8B4513]/30 rounded-lg bg-[#FFFDF9] text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5D4037] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#8B4513]" /> เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="p-2 border border-[#8B4513]/30 rounded-lg bg-[#FFFDF9] text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5D4037] flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-[#8B4513]" /> สินค้าที่ต้องการขาย
                  </label>
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="เช่น หมูปิ้งโบราณ, ส้มตำ"
                    className="p-2 border border-[#8B4513]/30 rounded-lg bg-[#FFFDF9] text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5D4037]">โซนที่ต้องการ</label>
                  <select
                    value={preferredZone}
                    onChange={(e) => setPreferredZone(e.target.value)}
                    className="p-2 border border-[#8B4513]/30 rounded-lg bg-[#FFFDF9] text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                  >
                    <option value="อาหาร">โซนอาหาร</option>
                    <option value="เสื้อผ้า">โซนเสื้อผ้า</option>
                    <option value="ทั่วไป">โซนทั่วไป</option>
                    <option value="ระบุล็อค">ระบุล็อคเจาะจง</option>
                  </select>
                </div>
              </div>

              {preferredZone === 'ระบุล็อค' && (
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#5D4037]">หมายเลขล็อคเจาะจง</label>
                  <input
                    type="text"
                    value={preferredStallName}
                    onChange={(e) => setPreferredStallName(e.target.value)}
                    placeholder="เช่น 28/1"
                    className="p-2 border border-[#8B4513]/30 rounded-lg bg-[#FFFDF9] text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B4513] hover:bg-[#5D4037] text-white font-extrabold rounded-lg shadow transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> บันทึกเข้าคิวสำรอง
                </button>
              </div>
            </form>
          ) : (
            /* Standby List */
            <div className="flex flex-col gap-3">
              {/* Filter */}
              <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-100">
                <span className="font-bold text-gray-500">กรองตามสถานะ:</span>
                <div className="flex gap-1">
                  {['ทั้งหมด', 'รอคิว', 'เรียกแล้ว', 'จองสำเร็จ', 'ยกเลิก'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                        filterStatus === st 
                          ? 'bg-[#8B4513] text-white border-[#8B4513]' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {filteredStandbyList.length === 0 ? (
                <div className="py-10 text-center text-gray-400 font-bold text-xs">
                  ไม่มีคิวสำรองในวันที่เลือก
                </div>
              ) : (
                filteredStandbyList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-[#FFFDF9] border border-[#8B4513]/25 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-[#8B4513]/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F5E6D3] text-[#8B4513] font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                        #{idx + 1}
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#4A3B32]">{item.booker_name}</span>
                          {item.phone && (
                            <a href={`tel:${item.phone}`} className="text-blue-700 font-mono font-bold hover:underline flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {item.phone}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 text-[11px] font-bold">
                          <span>โซน: <strong className="text-amber-900">{item.preferred_zone}</strong></span>
                          {item.preferred_stall_name && (
                            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                              ล็อค {item.preferred_stall_name}
                            </span>
                          )}
                          {item.product && <span>สินค้า: {item.product}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Status */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {item.status === 'รอคิว' && (
                        <button
                          onClick={() => handleUpdateStandbyStatus(item.id, 'เรียกแล้ว')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                          title="กดเมื่อโทรเรียกผู้ค้าแล้ว"
                        >
                          <Clock className="w-3.5 h-3.5" /> เรียกคิว
                        </button>
                      )}

                      {item.status === 'เรียกแล้ว' && (
                        <button
                          onClick={() => handleUpdateStandbyStatus(item.id, 'จองสำเร็จ')}
                          className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> สำเร็จ
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteStandbyQueue(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบคิวนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAEBD7] border-t-2 border-[#8B4513] px-4 py-2.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
