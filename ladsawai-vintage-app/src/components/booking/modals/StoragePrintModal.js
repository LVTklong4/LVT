'use client';

import React from 'react';
import { useStorage } from '@/context/StorageContext';
import { X, Printer, Check } from 'lucide-react';

export default function StoragePrintModal() {
  const {
    handlePrintStorageReceipt,
    parseNumber,
    setShowStoragePrintModal,
    setStoragePrintEndDate,
    setStoragePrintFee,
    setStoragePrintNote,
    setStoragePrintOwner,
    setStoragePrintPayment,
    setStoragePrintStall,
    setStoragePrintStartDate,
    showStoragePrintModal,
    storagePrintEndDate,
    storagePrintFee,
    storagePrintItem,
    storagePrintNote,
    storagePrintOwner,
    storagePrintPayment,
    storagePrintStall,
    storagePrintStartDate,
    isStorageCheckout,
    setIsStorageCheckout,
    handleCheckoutStorage
  } = useStorage();

  const handleClose = () => {
    setIsStorageCheckout(false);
    setShowStoragePrintModal(false);
  };

  if (!showStoragePrintModal && !storagePrintItem) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-amber-800 overflow-hidden animate-pop-in">
            <div className="bg-amber-800 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                {isStorageCheckout ? <Check className="w-5 h-5" /> : <Printer className="w-5 h-5" />} 
                {isStorageCheckout ? 'เช็คเอาท์ฝากของ & พิมพ์ใบเสร็จ' : 'ตั้งค่าการพิมพ์ตั๋วฝากของ'}
              </h3>
              <button onClick={handleClose} className="text-amber-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5">
                <div className="font-bold text-amber-900">ผู้ฝาก: {storagePrintOwner}</div>
                <div className="text-gray-600 mt-0.5">ล็อก: {storagePrintStall}</div>
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">วันที่เริ่มฝาก</label>
                <input 
                  type="date"
                  value={storagePrintStartDate}
                  onChange={(e) => setStoragePrintStartDate(e.target.value)}
                  className="p-2 border rounded text-xs bg-white"
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">วันที่สิ้นสุด</label>
                <input 
                  type="date"
                  value={storagePrintEndDate}
                  onChange={(e) => setStoragePrintEndDate(e.target.value)}
                  className="p-2 border rounded text-xs bg-white"
                />
              </div>

              {/* Owner Name */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">ชื่อผู้ฝาก</label>
                <input 
                  type="text"
                  value={storagePrintOwner}
                  onChange={(e) => setStoragePrintOwner(e.target.value)}
                  className="p-2 border rounded text-xs"
                />
              </div>

              {/* Stall Name */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">วางของไว้ล็อค</label>
                <input 
                  type="text"
                  value={storagePrintStall}
                  onChange={(e) => setStoragePrintStall(e.target.value)}
                  className="p-2 border rounded text-xs font-mono"
                />
              </div>

              {/* Fee */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">ค่าฝากของ (บาท)</label>
                <input 
                  type="number"
                  value={storagePrintFee}
                  onChange={(e) => setStoragePrintFee(parseNumber(e.target.value))}
                  className="p-2 border rounded text-xs"
                />
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">การชำระเงิน</label>
                <select 
                  value={storagePrintPayment}
                  onChange={(e) => setStoragePrintPayment(e.target.value)}
                  className="p-2 border rounded text-xs bg-white"
                >
                  <option value="เงินสด">เงินสด</option>
                  <option value="โอนเงิน">โอนเงิน (โอนจ่าย)</option>
                </select>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700">รายการที่ฝาก</label>
                <textarea 
                  value={storagePrintNote}
                  onChange={(e) => setStoragePrintNote(e.target.value)}
                  rows="2"
                  className="p-2 border rounded text-xs bg-white"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 border-t flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={handleClose}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded text-xs"
              >
                ยกเลิก
              </button>
              <button 
                type="button"
                onClick={async () => {
                  if (isStorageCheckout) {
                    await handleCheckoutStorage({
                      id: storagePrintItem.id,
                      endDate: storagePrintEndDate,
                      fee: storagePrintFee,
                      paymentMethod: storagePrintPayment,
                      note: storagePrintNote
                    });
                  }
                  handlePrintStorageReceipt();
                }}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded text-xs flex items-center gap-1 shadow"
              >
                {isStorageCheckout ? <Check className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                {isStorageCheckout ? 'ชำระเงิน & สิ้นสุดการฝาก' : 'สั่งพิมพ์ (80mm)'}
              </button>
            </div>
          </div>
        </div>
  );
}
