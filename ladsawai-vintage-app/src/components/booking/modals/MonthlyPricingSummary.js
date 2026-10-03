'use client';

import React from 'react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { Info } from 'lucide-react';

export default function MonthlyPricingSummary() {
  const {
    newMonthlyCustomerType,
    newMonthlyCustomPrice,
    parseNumber,
    getNewMonthlyPricing,
    newMonthlyDays,
    newMonthlyStallsWed,
    newMonthlyStallsSat,
    newMonthlyStallsSun,
    cleanStallName,
    newMonthlyElecUnit,
    newMonthlyStorageFee
  } = useMonthlyBooking();

  if (newMonthlyCustomerType === 'Regular') {
    return (
      <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 flex items-start gap-2 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1 text-[11px] font-bold leading-normal">
          <h5 className="font-extrabold text-amber-800 text-xs mb-0.5">ชำระเงินในรูปแบบรายวัน</h5>
          <p>สัญญาลูกค้าประจำนี้จะทำการล็อกผังไว้ทั้งเดือนโดยขึ้นสถานะ "ค้างชำระ (ประจำ)" และจะชำระเงินเป็นรายวันทีละล็อคเมื่อเริ่มขายจริงในแต่ละวัน โดยอ้างอิงราคาตามปกติของแต่ละล็อค</p>
        </div>
      </div>
    );
  }

  if (newMonthlyCustomerType === 'Room') {
    return (
      <div className="bg-blue-50 border border-blue-300 text-blue-900 rounded-lg p-3.5 flex flex-col gap-2 shadow-xs">
        <div className="font-bold text-blue-900 border-b border-dashed pb-1.5 mb-1 text-xs">สรุปรายละเอียดราคา</div>
        <div className="flex justify-between font-bold text-xs text-blue-950">
          <span>ยอดที่ต้องชำระทั้งสิ้น:</span>
          <span className="text-sm font-extrabold">{parseNumber(newMonthlyCustomPrice).toLocaleString()}.- บ.</span>
        </div>
        <div className="text-[10px] text-blue-700 font-bold mt-1.5 leading-relaxed">
          * สัญญาห้องเช่าคิดค่าใช้จ่ายเป็นยอดรวมสุทธิที่ตกลงกันไว้โดยตรง
        </div>
      </div>
    );
  }

  if (newMonthlyCustomerType === 'VIP') {
    return (
      <div className="bg-purple-50 border border-purple-300 text-purple-900 rounded-lg p-3.5 flex flex-col gap-2 shadow-xs">
        <div className="font-bold text-purple-850 border-b border-dashed pb-1.5 mb-1 text-xs">สรุปรายละเอียดราคา</div>
        <div className="flex justify-between font-bold text-xs text-purple-950">
          <span>ยอดที่ต้องชำระทั้งสิ้น:</span>
          <span className="text-sm font-extrabold">{parseNumber(newMonthlyCustomPrice).toLocaleString()}.- บ.</span>
        </div>
        <div className="text-[10px] text-purple-700 font-bold mt-1.5 leading-relaxed">
          * สัญญาลูกค้า VIP คิดค่าใช้จ่ายเป็นยอดรวมสุทธิที่ตกลงกันไว้โดยตรง
        </div>
      </div>
    );
  }

  const pricing = getNewMonthlyPricing() || {};
  const totalNads = (newMonthlyDays.wed && newMonthlyStallsWed.length > 0 ? (pricing.wedCount || 0) : 0) +
                    (newMonthlyDays.sat && newMonthlyStallsSat.length > 0 ? (pricing.satCount || 0) : 0) +
                    (newMonthlyDays.sun && newMonthlyStallsSun.length > 0 ? (pricing.sunCount || 0) : 0);

  return (
    <div className="bg-[#FFFDF9] border border-[#8B4513]/30 rounded-lg p-3 flex flex-col gap-2 shadow-xs">
      <div className="font-bold text-gray-800 border-b border-dashed pb-1.5 mb-1.5 text-xs">สรุปรายละเอียดราคา</div>
      <div className="space-y-2 text-gray-700 font-bold">
        {newMonthlyDays.wed && newMonthlyStallsWed.length > 0 && (
          <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100 flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-950 font-extrabold flex items-center gap-1.5 flex-wrap">
                <span>พุธ:</span>
                <span className="text-purple-900 font-mono bg-purple-100/90 px-1.5 py-0.5 rounded border border-purple-200 text-[11px]">
                  ล็อค {newMonthlyStallsWed.map(cleanStallName).join(', ')}
                </span>
              </span>
              <span className="font-black text-purple-950 text-xs">{(pricing.wedTotal || 0).toLocaleString()}.-</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium pl-0.5">
              {pricing.wedCount || 0} วัน x {(pricing.wedStallsPrice || 0).toLocaleString()}.-
            </div>
          </div>
        )}

        {newMonthlyDays.sat && newMonthlyStallsSat.length > 0 && (
          <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100 flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-950 font-extrabold flex items-center gap-1.5 flex-wrap">
                <span>เสาร์:</span>
                <span className="text-purple-900 font-mono bg-purple-100/90 px-1.5 py-0.5 rounded border border-purple-200 text-[11px]">
                  ล็อค {newMonthlyStallsSat.map(cleanStallName).join(', ')}
                </span>
              </span>
              <span className="font-black text-purple-950 text-xs">{(pricing.satTotal || 0).toLocaleString()}.-</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium pl-0.5">
              {pricing.satCount || 0} วัน x {(pricing.satStallsPrice || 0).toLocaleString()}.-
            </div>
          </div>
        )}

        {newMonthlyDays.sun && newMonthlyStallsSun.length > 0 && (
          <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100 flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-950 font-extrabold flex items-center gap-1.5 flex-wrap">
                <span>อาทิตย์:</span>
                <span className="text-purple-900 font-mono bg-purple-100/90 px-1.5 py-0.5 rounded border border-purple-200 text-[11px]">
                  ล็อค {newMonthlyStallsSun.map(cleanStallName).join(', ')}
                </span>
              </span>
              <span className="font-black text-purple-950 text-xs">{(pricing.sunTotal || 0).toLocaleString()}.-</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium pl-0.5">
              {pricing.sunCount || 0} วัน x {(pricing.sunStallsPrice || 0).toLocaleString()}.-
            </div>
          </div>
        )}

        {parseNumber(newMonthlyElecUnit) > 0 && (pricing.totalElecCharged || 0) > 0 && (
          <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/80 flex justify-between items-center text-xs text-amber-950">
            <span>⚡ ค่าไฟ: {pricing.totalElecCharged || 0} วัน x ({parseNumber(newMonthlyElecUnit)} หน่วย x 10บ.)</span>
            <span className="font-black text-amber-900">{(pricing.totalElecPrice || 0).toLocaleString()}.-</span>
          </div>
        )}

        {parseNumber(newMonthlyStorageFee) > 0 && (
          <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/80 flex justify-between items-center text-xs text-amber-950">
            <span>📦 ค่าฝากของ:</span>
            <span className="font-black text-amber-900">{(pricing.storageFeeVal || 0).toLocaleString()}.-</span>
          </div>
        )}

        {totalNads > 0 && (
          <div className="flex justify-between border-t border-dashed border-gray-200 pt-1.5 mt-1 text-slate-700 text-xs text-left">
            <span>จำนวนวันลงขายรวม:</span>
            <span className="font-extrabold">{totalNads} นัด (ครั้ง)</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-[#8B4513]/30 pt-2 mt-1 flex justify-between items-center">
        <span className="font-bold text-sm text-[#3E2723]">ยอดรวมที่ต้องชำระทั้งสิ้น</span>
        <span className="font-black text-lg text-amber-800">{(pricing.grandTotal || 0).toLocaleString()} บาท</span>
      </div>
    </div>
  );
}
