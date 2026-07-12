'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Lightbulb, Clock } from 'lucide-react';

export default function FinanceInsights() {
  const { data } = useDashboard();
  const { analytics } = data;
  const { financeInsights, forecast } = analytics;

  return (
    <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm flex-1">
      <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1.5">
        <Lightbulb className="w-5 h-5 text-yellow-600" /> วิเคราะห์การเงิน (Financial Insights)
      </h3>
      
      <ul className="flex flex-col gap-3 text-xs">
        {financeInsights.map((insight, idx) => (
          <li key={idx} className="flex gap-2 items-start bg-yellow-50/40 p-2.5 rounded-lg border border-yellow-100/60 font-semibold text-gray-700">
            <span className="text-yellow-700 mt-0.5">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>

      {/* Future Forecast */}
      <div className="mt-5 border-t pt-4 text-xs">
        <div className="flex items-center gap-1 font-bold text-gray-600">
          <Clock className="w-4 h-4 text-amber-800" />
          <span>ประมาณการรายรับรายเดือน</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">คำนวณจากยอดรายได้เฉลี่ยของวันนี้สะสมทั้งเดือน</p>
        <strong className="text-base md:text-lg font-extrabold text-[#8B4513] block mt-2">
          {forecast.toLocaleString()} บาท/เดือน
        </strong>
      </div>
    </div>
  );
}
