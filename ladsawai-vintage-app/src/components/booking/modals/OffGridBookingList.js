'use client';

import React, { useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Sparkles, Printer } from 'lucide-react';
import { printOffGridReceipt } from '@/utils/offGridReceiptPrinter';

export default function OffGridBookingList({ selectedBookingId, onSelectBooking }) {
  const { selectedDate, bookings, adminUser, showAlert } = useBooking();
  const [searchTerm, setSearchTerm] = useState('');

  // Load bookings for current date
  const offGridBookings = (bookings || []).filter(b => b.type === 'นอกผัง' && b.date === selectedDate);

  // Filtered bookings based on searchTerm
  const filteredOffGridBookings = offGridBookings.filter(b => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return (
      (b.stall_name || '').toLowerCase().includes(term) ||
      (b.booker_name || '').toLowerCase().includes(term) ||
      (b.product || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      <div className="bg-white p-3 border border-amber-200 rounded-lg shadow-sm flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-xs text-[#8B4513] flex items-center gap-1.5">
            📋 รายการจองนอกผังวันที่ {selectedDate}
          </span>
          <span className="text-[10px] font-extrabold text-gray-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            ทั้งหมด: {offGridBookings.length} รายการ
          </span>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 ค้นหาด้วยชื่อผู้ค้า, เบอร์โทร, เลขล็อก, หรือสินค้า..."
          className="p-2 border border-amber-300 rounded text-xs w-full focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
        />
      </div>

      {offGridBookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16 gap-2 bg-white rounded-lg border border-amber-200 border-dashed">
          <Sparkles className="w-8 h-8 text-amber-300" />
          <span className="text-xs font-bold">ไม่มีรายการจองนอกผังสำหรับวันนี้</span>
        </div>
      ) : filteredOffGridBookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-16 gap-2 bg-white rounded-lg border border-amber-200">
          <span className="text-xs font-bold">ไม่พบข้อมูลตรงกับที่ค้นหา</span>
        </div>
      ) : (
        <div className="overflow-x-auto border border-amber-200 rounded-lg max-h-[55vh] bg-white shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-amber-100/70 text-[#8B4513] border-b border-amber-200 font-extrabold sticky top-0 z-10">
              <tr>
                <th className="p-2.5">ชื่อพื้นที่ / ล็อก</th>
                <th className="p-2.5">ผู้จอง / เบอร์โทร</th>
                <th className="p-2.5 text-right">ยอดรวม</th>
                <th className="p-2.5 text-center">สถานะ</th>
                <th className="p-2.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 font-semibold text-gray-700">
              {filteredOffGridBookings.map((b) => {
                let dispType = 'ขาจร';
                const tMatch = (b.note || '').match(/\[ประเภท:\s*([^\]]+)\]/);
                if (tMatch) dispType = tMatch[1];
                const isBeingEdited = b.id === selectedBookingId;

                return (
                  <tr 
                    key={b.id} 
                    className={`transition-colors ${
                      isBeingEdited 
                        ? 'bg-amber-100/80 font-bold border-l-4 border-l-[#8B4513]' 
                        : 'hover:bg-amber-50/50'
                    }`}
                  >
                    <td className="p-2.5 font-bold text-[#8B4513]">
                      {b.stall_name}
                      {isBeingEdited && (
                        <span className="ml-1 text-[9px] bg-[#8B4513] text-white px-1.5 py-0.2 rounded font-black">
                          กำลังแก้ไข
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <div className="font-bold text-gray-900">{b.booker_name || '-'}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                        <span className="bg-amber-100 text-amber-800 px-1 rounded-sm text-[8px] font-bold">{dispType}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-bold text-gray-900 font-mono">
                      {b.total_price?.toLocaleString()}.-
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.status === 'ชำระแล้ว'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'ยกเลิก'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => onSelectBooking(b)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            isBeingEdited
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {isBeingEdited ? 'กำลังแก้ไข' : 'แก้ไข'}
                        </button>
                        <button
                          type="button"
                          onClick={() => printOffGridReceipt(b, adminUser, showAlert)}
                          className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> พิมพ์ตั๋ว
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
