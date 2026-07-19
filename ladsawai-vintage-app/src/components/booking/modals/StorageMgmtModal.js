'use client';

import React, { useState } from 'react';
import { useStorage } from '@/context/StorageContext';
import { Loader2, X, Printer, PlusCircle, CalendarClock, Trash2 } from 'lucide-react';
import StorageDepositModal from './StorageDepositModal';

export default function StorageMgmtModal() {
  const {
    showStorageMgmtModal,
    setShowStorageMgmtModal,
    storageList,
    loadingStorage,
    handleToggleStorageStatus,
    setIsStorageCheckout,
    setShowStoragePrintModal,
    setStoragePrintItem,
    setStoragePrintStartDate,
    setStoragePrintEndDate,
    setStoragePrintOwner,
    setStoragePrintStall,
    setStoragePrintNote,
    setStoragePrintFee,
    setStoragePrintPayment,
    parseNumber
  } = useStorage();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [renewItem, setRenewItem] = useState(null);

  // Open new deposit modal
  const handleOpenNewDeposit = () => {
    setRenewItem(null);
    setIsDepositOpen(true);
  };

  // Open renew deposit modal
  const handleOpenRenew = (item) => {
    setRenewItem(item);
    setIsDepositOpen(true);
  };

  // Checkout Handler: calculate overdue weeks and show checkout modal
  const handleOpenStorageCheckout = (item) => {
    setStoragePrintItem(item);
    setStoragePrintStartDate(item.start_date || '');
    setStoragePrintEndDate(new Date().toISOString().split('T')[0]);
    setStoragePrintOwner(item.owner_name || '');
    setStoragePrintStall(item.stall_name || '');
    setStoragePrintNote(item.note || '-');
    setStoragePrintPayment('เงินสด');

    // Calculate elapsed time vs paid amount to find if they owe anything extra
    let expectedWeeks = 1;
    if (item.start_date) {
      const start = new Date(item.start_date);
      const end = new Date();
      const diffTime = end - start;
      if (diffTime > 0) {
        expectedWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) || 1;
      }
    }

    const expectedTotal = expectedWeeks * 160;
    
    // We will let the admin adjust the final fee on checkout if needed (defaults to 0 if already paid upfront)
    // If they check out on or before the end date, fee is 0.
    // If they check out after the end date, calculate overdue weeks.
    let overdueFee = 0;
    if (item.end_date) {
      const endPaid = new Date(item.end_date);
      const today = new Date();
      const overdueTime = today - endPaid;
      if (overdueTime > 0) {
        const overdueWeeks = Math.ceil(overdueTime / (1000 * 60 * 60 * 24 * 7)) || 1;
        overdueFee = overdueWeeks * 160;
      }
    }

    setStoragePrintFee(overdueFee);
    setIsStorageCheckout(true);
    setShowStoragePrintModal(true);
  };

  const handleReprintReceipt = (item) => {
    setStoragePrintItem(item);
    setStoragePrintStartDate(item.start_date || '');
    setStoragePrintEndDate(item.end_date || '');
    setStoragePrintOwner(item.owner_name || '');
    setStoragePrintStall(item.stall_name || '');
    setStoragePrintNote(item.note || '-');
    setStoragePrintPayment('เงินสด');
    
    // Total weeks paid
    let weeks = 1;
    if (item.start_date && item.end_date) {
      const start = new Date(item.start_date);
      const end = new Date(item.end_date);
      const diffTime = end - start;
      if (diffTime > 0) {
        weeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) || 1;
      }
    }
    setStoragePrintFee(weeks * 160);
    setIsStorageCheckout(false);
    setShowStoragePrintModal(true);
  };

  if (!showStorageMgmtModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FAF6EE] rounded-xl shadow-2xl w-full max-w-4xl border-2 border-orange-600 overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
        {/* Header */}
        <div className="bg-orange-600 text-white px-4 py-3 flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-sm flex items-center gap-1.5">
            📦 ระบบฝากของ (Storage Management)
          </h3>
          <button 
            onClick={() => setShowStorageMgmtModal(false)} 
            className="text-orange-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-orange-200 pb-2">
            <div>
              <h4 className="font-extrabold text-sm text-[#8B4513]">รายการฝากของทั้งหมด</h4>
              <p className="text-[10px] text-gray-500 font-bold">จัดการข้อมูลฝากของสะสมรายสัปดาห์ (อัตรา 160 บาท / สัปดาห์)</p>
            </div>
            
            <button
              onClick={handleOpenNewDeposit}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-lg shadow transition-all flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> แจ้งฝากของใหม่
            </button>
          </div>

          {/* Table List */}
          <div className="flex flex-col min-w-0">
            {loadingStorage ? (
              <div className="flex justify-center items-center py-20 text-orange-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : storageList.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-bold bg-white rounded-lg border border-dashed border-orange-200">
                ไม่มีรายการฝากของในระบบขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto border border-orange-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FFF8EE] text-[#8B4513] border-b border-orange-200 font-bold">
                    <tr>
                      <th className="p-3">ตำแหน่ง / ล็อค</th>
                      <th className="p-3">ผู้ฝาก / เบอร์ติดต่อ</th>
                      <th className="p-3">ช่วงเวลาฝาก (สัปดาห์)</th>
                      <th className="p-3">รายการสิ่งของที่ฝาก</th>
                      <th className="p-3 text-center">สถานะ</th>
                      <th className="p-3 text-center">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 bg-white font-semibold text-gray-700">
                    {storageList.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/20">
                        <td className="p-3 font-extrabold text-[#8B4513] text-sm font-mono">
                          [{item.stall_name}]
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-800">{item.owner_name}</div>
                          <div className="text-[10px] text-gray-500 font-bold">โทร: {item.phone || '-'}</div>
                        </td>
                        <td className="p-3 text-[10px] font-mono">
                          <div className="text-green-800">เริ่ม: {item.start_date || '-'}</div>
                          <div className="text-red-700">สิ้นสุด: {item.end_date || '-'}</div>
                        </td>
                        <td className="p-3 text-[11px] max-w-[200px] truncate text-gray-600" title={item.note}>
                          {item.note || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                            item.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.status === 'Active' ? 'กำลังฝาก' : 'คืนของแล้ว'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1.5 justify-center">
                            {item.status === 'Active' && (
                              <button 
                                onClick={() => handleOpenRenew(item)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[#8B4513] border border-orange-200 rounded text-[10px] font-black flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                <CalendarClock className="w-3.5 h-3.5" /> ต่ออายุ
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                if (item.status === 'Active') {
                                  handleOpenStorageCheckout(item);
                                } else {
                                  handleToggleStorageStatus(item);
                                }
                              }}
                              className={`px-2 py-1 border rounded text-[10px] font-black hover:opacity-95 transition-all cursor-pointer ${
                                item.status === 'Active' 
                                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              }`}
                            >
                              {item.status === 'Active' ? 'เช็คออก' : 'เช็คอิน'}
                            </button>
                            <button 
                              onClick={() => handleReprintReceipt(item)}
                              className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[10px] font-black hover:bg-orange-100 flex items-center gap-0.5 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" /> พิมพ์
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Nested Deposit / Renewal Form Modal */}
        <StorageDepositModal 
          isOpen={isDepositOpen} 
          onClose={() => setIsDepositOpen(false)} 
          renewItem={renewItem} 
        />
      </div>
    </div>
  );
}
