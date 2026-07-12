'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Award } from 'lucide-react';

export default function PrimeCustomers() {
  const { data } = useDashboard();
  const { analytics } = data;
  const { primeCustomers } = analytics;

  return (
    <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm">
      <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1.5">
        <Award className="w-5 h-5 text-amber-600" /> ลูกค้าดีเด่น (จ่ายก่อนวันที่ 5)
      </h3>
      
      {primeCustomers.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-6">
          ยังไม่พบข้อมูลลูกค้าชำระเงินก่อนวันที่ 5 ในรอบบิลนี้
        </p>
      ) : (
        <div className="divide-y text-xs">
          {primeCustomers.map((item, idx) => (
            <div key={idx} className="py-2.5 flex justify-between items-center font-semibold text-gray-700">
              <div>
                <span className="font-bold text-[#8B4513]">{idx + 1}. {item.name}</span>
                <span className="text-[10px] text-gray-500 block">ล็อค: {item.stalls}</span>
              </div>
              <div className="text-right">
                <strong className="text-green-700">{item.earlyPaid.toLocaleString()} ฿</strong>
                <span className="text-[9px] text-gray-400 block font-normal">ยอดรวม: {item.totalPaid.toLocaleString()} ฿</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
