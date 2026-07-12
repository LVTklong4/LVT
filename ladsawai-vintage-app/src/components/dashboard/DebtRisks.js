'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AlertTriangle } from 'lucide-react';

export default function DebtRisks() {
  const { data } = useDashboard();
  const { analytics } = data;
  const { debtRisks } = analytics;

  return (
    <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm">
      <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1">
        <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" /> รายการค้างชำระเสี่ยงสูง (ลูกค้ารายเดือน)
      </h3>
      
      {debtRisks.length === 0 ? (
        <p className="text-xs text-green-700 font-bold p-4 text-center bg-green-50 rounded-lg animate-fade-in">
          ยอดเยี่ยม! ไม่มีรายการลูกค้ารายเดือนค้างชำระที่เสี่ยงสูงในเดือนนี้
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {debtRisks.map((item) => (
            <div key={item.id} className="border border-gray-100 hover:border-amber-300 rounded-lg p-3 bg-amber-50/10 flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition-all">
              <div>
                <h4 className="font-bold text-xs md:text-sm text-gray-800">{item.name}</h4>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                  เลขล็อค: {item.stalls} | ยอดบิล: {item.total.toLocaleString()} ฿ | จ่ายแล้ว: {item.paid.toLocaleString()} ฿ ({item.paidPercent}%)
                </p>
                <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold mt-1">
                  {item.riskBreakdown}
                </span>
              </div>

              {/* Risk display badge */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-bold block">ดัชนีความเสี่ยง</span>
                  <strong className={`text-sm md:text-base font-extrabold block ${
                    item.riskPercent >= 80 ? 'text-red-700' : item.riskPercent >= 50 ? 'text-yellow-700' : 'text-blue-700'
                  }`}>{item.riskPercent}%</strong>
                </div>
                <div className="w-12 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${
                    item.riskPercent >= 80 ? 'bg-red-600' : item.riskPercent >= 50 ? 'bg-yellow-600' : 'bg-blue-600'
                  }`} style={{ width: `${item.riskPercent}%` }} />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
