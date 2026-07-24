'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { Loader2 } from 'lucide-react';

export default function StallMapGrid() {
  const {
    stalls,
    bookings,
    loading,
    selectedDate,
    highlightedStall,
    handleStallClick
  } = useBooking();

  const maxCol = 24;
  const maxRow = 26;

  return (
    <>
      {/* Colors Legend */}
      <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-1.5 mb-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] md:text-[10px] font-bold justify-center text-gray-700">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#DCEDC8] border border-[#AED581] rounded-sm"></span>อาหาร (ว่าง)</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#B3E5FC] border border-[#81D4FA] rounded-sm"></span>เสื้อผ้า (ว่าง)</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#FFE0B2] border border-[#FFB74D] rounded-sm"></span>ค้างชำระ</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#FFCDD2] border border-[#E57373] rounded-sm"></span>จองแล้ว</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#D1C4E9] border border-[#B39DDB] rounded-sm"></span>รายเดือน</div>
        </div>
      </div>

      {/* The Grid Map Container */}
      <div className="relative bg-[#D7CCC8] border-4 border-[#5D4037] rounded-lg shadow-2xl p-4 overflow-x-auto min-h-[600px] custom-scrollbar">
        {loading && (
          <div className="absolute inset-0 z-30 bg-amber-50/80 flex items-center justify-center backdrop-blur-[1px] transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 text-amber-800 animate-spin" />
              <span className="text-xs font-bold text-amber-900">กำลังดาวน์โหลดข้อมูลผังตลาด...</span>
            </div>
          </div>
        )}

        {stalls.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-96 text-gray-500 font-bold">
            ไม่พบโครงสร้างล็อคในระบบ กรุณาตรวจสอบตาราง stalls
          </div>
        ) : (
          <div 
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${maxCol}, 40px)`,
              gridAutoRows: 'minmax(20px, auto)',
              gap: '3px'
            }}
          >
            {Array.from({ length: maxRow }).map((_, rIdx) => {
              const r = rIdx + 1;
              return Array.from({ length: maxCol }).map((_, cIdx) => {
                const c = cIdx + 1;
                const stall = stalls.find(s => s.row === r && s.col === c);
                
                if (!stall) {
                  const isInsideGrocery = r >= 1 && r <= 3 && c >= 13 && c <= 15;
                  const isInsideBathroom = r >= 1 && r <= 3 && c >= 16 && c <= 20;
                  const isInsideWater = r >= 23 && r <= 26 && c >= 2 && c <= 7;
                  const isInsideParking = r >= 1 && r <= 25 && c >= 21 && c <= 24;
                  
                  if (isInsideGrocery || isInsideBathroom || isInsideWater || isInsideParking) {
                    return null;
                  }
                  return <div key={`empty-${r}-${c}`} style={{ gridRow: r, gridColumn: c }} className="invisible" />;
                }

                const matchedBookings = bookings.filter(b => b.stall_name === stall.name || (b.stall_name && b.stall_name.split(',').map(s => s.trim()).includes(stall.name)));
                const booking = matchedBookings.sort((a, b) => {
                  if (a.status === 'ลา' && b.status !== 'ลา') return 1;
                  if (a.status !== 'ลา' && b.status === 'ลา') return -1;
                  return 0;
                })[0];
                
                // Setup classes based on status
                let statusClass = "bg-white";
                let priceText = "";
                let statusText = "";

                const dateObj = new Date(selectedDate);
                const day = dateObj.getDay();
                let price = stall.price_wed;
                if (day === 6) price = stall.price_sat;
                if (day === 0) price = stall.price_sun;
                priceText = `${price}.-`;

                const isFood = stall.type.includes('อาหาร') || stall.name.startsWith('F');

                if (stall.type === 'ทางเดิน') {
                  statusClass = "bg-walkway border-gray-600 opacity-60";
                } else if (stall.type === 'อื่นๆ') {
                  statusClass = "bg-other-stall opacity-70";
                } else if (stall.type === 'รายเดือน' || stall.type.includes('รายเดือน')) {
                  if (booking) {
                    if (booking.status === 'ลา') {
                      statusClass = isFood ? "bg-food-free text-green-900" : "bg-cloth-free text-blue-900";
                      statusText = priceText;
                    } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
                      statusClass = "bg-occupied text-red-900";
                      statusText = booking.product || "จองแล้ว";
                    } else if (booking.status === 'ค้างชำระ' && booking.type === 'ประจำ') {
                      statusClass = "bg-unpaid text-amber-900";
                      statusText = booking.product || "ประจำ";
                    } else if (booking.type === 'ประจำ') {
                      statusClass = "bg-unpaid text-amber-900";
                      statusText = booking.product || "ประจำ";
                    } else {
                      statusClass = "bg-monthly-stall";
                      statusText = booking.product || "รายเดือน";
                    }
                  } else {
                    statusClass = "bg-monthly-stall";
                    statusText = "รายเดือน";
                  }
                } else {
                  if (booking) {
                    if (booking.status === 'ลา') {
                      statusClass = isFood ? "bg-food-free text-green-900" : "bg-cloth-free text-blue-900";
                      statusText = priceText;
                    } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
                      statusClass = "bg-occupied text-red-900";
                      statusText = booking.product || "จองแล้ว";
                    } else if (booking.status === 'ค้างชำระ' && booking.type === 'ประจำ') {
                      statusClass = "bg-unpaid text-amber-900";
                      statusText = booking.product || "ประจำ";
                    } else if (booking.type === 'ประจำ') {
                      statusClass = "bg-unpaid text-amber-900";
                      statusText = booking.product || "ประจำ";
                    } else if (booking.type === 'รายเดือน') {
                      statusClass = "bg-monthly-stall";
                      statusText = booking.product || "รายเดือน";
                    } else {
                      statusClass = "bg-unpaid text-amber-900";
                      statusText = booking.product || "จองแล้ว";
                    }
                  } else {
                    statusClass = isFood ? "bg-food-free text-green-900" : "bg-cloth-free text-blue-900";
                    statusText = priceText;
                  }
                }

                const isClickable = stall.type !== 'ทางเดิน' && stall.type !== 'อื่นๆ';
                const isHighlighted = highlightedStall === stall.name;
                const displayName = stall.name.replace(/[\[\]]/g, '');

                return (
                  <button
                    key={stall.name}
                    id={`stall-${stall.name}`}
                    style={{ gridRow: r, gridColumn: c }}
                    onClick={() => isClickable && handleStallClick(stall)}
                    disabled={!isClickable}
                    className={`stall-box relative p-0.5 rounded-sm border shadow-sm flex flex-col items-center justify-center transition-all ${statusClass} ${
                      isClickable ? 'clickable cursor-pointer' : 'non-clickable pointer-events-none'
                    } ${isHighlighted ? 'search-highlight' : ''}`}
                  >
                    <span className="text-[11px] font-black leading-none">{displayName}</span>
                    {statusText && (
                      <span 
                        className="text-[8px] font-extrabold leading-none mt-0.5 max-w-full truncate px-0.5 text-center block"
                        title={statusText}
                      >
                        {statusText}
                      </span>
                    )}
                    {statusText === 'ลา' && (
                      <span className="text-[8.5px] font-black text-red-600 leading-none mt-0.5">ลา</span>
                    )}
                  </button>
                );
              });
            })}

            {/* Custom Highlight Zones */}
            <div 
              style={{ 
                gridRow: "1 / span 3", 
                gridColumn: "13 / span 3",
                border: "2.5px dashed #8B4513",
                backgroundColor: "#FAF0E6"
              }}
              className="rounded-md p-1 flex flex-col items-center justify-center z-10 pointer-events-none shadow-sm"
            >
              <span className="text-[#8B4513] font-black text-xs">ร้านชำ</span>
            </div>

            <div 
              style={{ 
                gridRow: "23 / span 4", 
                gridColumn: "2 / span 6",
                border: "2.5px dashed #D97706",
                backgroundColor: "#FEF9C3"
              }}
              className="rounded-md p-1 flex flex-col items-center justify-center z-10 pointer-events-none shadow-sm"
            >
              <span className="text-[#854D0E] font-black text-xs">ร้านน้ำ</span>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
