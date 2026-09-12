'use client';

import React, { useState } from 'react';
import { cleanStallName } from '@/utils/numberHelper';
import { getModalDateFormat } from '@/utils/thaiDateHelper';
import {
  Store, X, Utensils, Shirt, CalendarDays, CheckCircle, AlertCircle,
  Copy, Check, MessageCircle
} from 'lucide-react';

export default function KioskStallDetailModal({
  showModal,
  setShowModal,
  selectedStall,
  selectedBooking,
  selectedDate,
  getStallStatus
}) {
  const [copied, setCopied] = useState(false);

  if (!showModal || !selectedStall) return null;

  const statusInfo = typeof getStallStatus === 'function' 
    ? getStallStatus(selectedStall, selectedBooking) 
    : { isVacant: !selectedBooking, price: selectedStall.price_sat || 300, product: selectedBooking?.product || '' };

  const formattedDateStr = typeof getModalDateFormat === 'function' ? getModalDateFormat(selectedDate) : selectedDate;
  const stallNameClean = cleanStallName(selectedStall.name);
  const priceVal = statusInfo.price ? `${statusInfo.price} บาท` : 'ตามเรทผังตลาด';

  const lineMessage = `สวัสดีครับ สนใจจองล็อคตลาดนัดลาดสวายวินเทจ\n📍 ล็อคที่สนใจ: ${stallNameClean}\n📅 วันที่: ${formattedDateStr}\n💰 ราคา: ${priceVal}\n🛒 สินค้าที่ต้องการขาย: \n\n(หากต้องการเพิ่มล็อค สามารถพิมพ์ชื่อล็อคต่อท้ายได้เลยครับ)`;
  const lineDeepLink = `https://line.me/R/oaMessage/@ladsawaivintage/?${encodeURIComponent(lineMessage)}`;

  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lineMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-[#8B4513] overflow-hidden animate-pop-in">
        
        {/* Modal Header */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] text-[#4A3B32] px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#8B4513]" />
            <h3 className="font-extrabold text-base text-[#4A3B32]">ข้อมูลล็อค {stallNameClean}</h3>
          </div>
          <button 
            type="button"
            onClick={() => setShowModal(false)} 
            className="p-1 rounded-full text-gray-500 hover:text-[#8B4513] hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 text-center">
          
          {/* Stall Visual Badge */}
          <div className="bg-gradient-to-br from-[#FAEBD7] to-amber-50/50 p-6 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col items-center justify-center relative">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 shadow-xs border border-amber-200 shrink-0">
              {selectedStall.type === 'อาหาร' ? (
                <Utensils className="w-8 h-8 text-[#8B4513]" />
              ) : selectedStall.type === 'เสื้อผ้า' ? (
                <Shirt className="w-8 h-8 text-[#8B4513]" />
              ) : (
                <Store className="w-8 h-8 text-[#8B4513]" />
              )}
            </div>
            
            <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">หมายเลขล็อค</span>
            <h2 className="text-4xl font-black text-[#4A3B32] mt-0.5 tracking-tight">{stallNameClean}</h2>
            
            <span className="text-[10px] text-amber-900 font-extrabold bg-[#FAEBD7] border border-amber-300 px-3 py-1 rounded-full mt-3 shadow-2xs">
              โซน {selectedStall.type || 'ทั่วไป'}
            </span>
          </div>

          {/* Date info */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700 font-bold bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
            <CalendarDays className="w-4 h-4 text-amber-800 shrink-0" />
            <span>วันที่ทำการค้า: <strong className="text-stone-900">{formattedDateStr}</strong></span>
          </div>

          {/* Status info */}
          {statusInfo.isVacant ? (
            <div className="flex flex-col items-center gap-1.5 p-4 bg-green-50/70 border-2 border-dashed border-green-300 rounded-2xl text-center">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xs text-green-800 font-extrabold">สถานะ: ล็อคว่างพร้อมจอง</span>
              <span className="text-2xl font-black text-green-700 mt-0.5">
                {statusInfo.price} <span className="text-xs font-bold text-gray-500">บาท / วัน</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-4 bg-red-50/70 border-2 border-dashed border-red-300 rounded-2xl text-center">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-xs text-red-800 font-extrabold">สถานะ: ล็อคไม่ว่าง (มีผู้จองแล้ว)</span>
              
              {statusInfo.product && (
                <div className="mt-1 border-t border-dashed border-red-200 pt-2 w-full text-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">ประเภทสินค้า</span>
                  <span className="text-xs font-extrabold text-gray-800 bg-white px-3 py-1 rounded-lg border border-red-100 inline-block">
                    {statusInfo.product}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* LINE Booking Area for Vacant Stalls */}
          {statusInfo.isVacant && (
            <div className="flex flex-col gap-2.5 mt-1">
              {/* Preview Box of pre-filled text */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-left">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 mb-1.5">
                  <span>💬 ข้อความที่จะนำไปใส่ในแชท LINE:</span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs hover:bg-emerald-50 cursor-pointer transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}</span>
                  </button>
                </div>
                <div className="text-[11px] text-gray-700 bg-white p-2.5 rounded-lg border border-emerald-100 font-mono whitespace-pre-line leading-relaxed select-all">
                  {lineMessage}
                </div>
              </div>

              {/* LINE Deep Link Action Button */}
              <a 
                href={lineDeepLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] active:scale-98 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm hover:shadow-lg cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                จองล็อคนี้ผ่าน LINE (@ladsawaivintage)
              </a>

              <span className="text-[10px] text-gray-500 font-medium text-center">
                * ระบบจะเปิดแชท LINE และใส่ข้อความให้อัตโนมัติ สามารถพิมพ์เพิ่มล็อคหรือสินค้าก่อนกดส่งได้ครับ
              </span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
