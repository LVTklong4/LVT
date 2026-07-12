'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { X } from 'lucide-react';

export default function SlipPreviewModal() {
  const {
    setFullScreenSlipUrl,
    fullScreenSlipUrl
  } = useBooking();

  if (!fullScreenSlipUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" onClick={() => setFullScreenSlipUrl(null)}>
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col relative border border-gray-100" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
          <span className="font-bold text-xs text-gray-800">📸 พรีวิวรูปภาพสลิปโอนเงิน</span>
          <button 
            type="button"
            onClick={() => setFullScreenSlipUrl(null)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 flex justify-center bg-gray-100 max-h-[70vh] overflow-auto">
          <img 
            src={fullScreenSlipUrl} 
            alt="Slip Preview" 
            className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-sm border border-gray-200" 
          />
        </div>
        <div className="p-3 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={() => setFullScreenSlipUrl(null)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold text-xs shadow cursor-pointer transition-all active:scale-95"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
