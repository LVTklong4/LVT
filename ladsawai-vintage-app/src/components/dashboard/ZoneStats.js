'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Layers } from 'lucide-react';

export default function ZoneStats() {
  const { data } = useDashboard();
  const { stats } = data;

  const totalDailyMonthly = stats.dailyCount + stats.monthlyCount;
  const dailyPercent = totalDailyMonthly > 0 ? (stats.dailyCount / totalDailyMonthly) * 100 : 50;

  return (
    <div className="bg-white border-2 border-[#8B4513]/30 rounded-xl p-4 shadow-sm">
      <h3 className="font-extrabold text-sm md:text-base text-gray-800 mb-3 flex items-center gap-1">
        <Layers className="w-5 h-5 text-amber-800" /> ข้อมูลเปรียบเทียบประเภทพื้นที่ (Zone Stats)
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-green-50/50 rounded-lg p-3 text-center border border-green-100">
          <span className="text-[10px] text-gray-500 font-bold block">รายวันโซนอาหาร</span>
          <strong className="text-base font-extrabold text-green-800 block mt-1">{stats.dailyFoodCount} ล็อค</strong>
        </div>
        <div className="bg-blue-50/50 rounded-lg p-3 text-center border border-blue-100">
          <span className="text-[10px] text-gray-500 font-bold block">รายวันโซนเสื้อผ้า</span>
          <strong className="text-base font-extrabold text-blue-800 block mt-1">{stats.dailyClothesCount} ล็อค</strong>
        </div>
        <div className="bg-purple-50/50 rounded-lg p-3 text-center border border-purple-100">
          <span className="text-[10px] text-gray-500 font-bold block">รายเดือนโซนอาหาร</span>
          <strong className="text-base font-extrabold text-purple-800 block mt-1">{stats.monthlyFoodCount} ล็อค</strong>
        </div>
        <div className="bg-amber-50/50 rounded-lg p-3 text-center border border-amber-100">
          <span className="text-[10px] text-gray-500 font-bold block">รายเดือนโซนเสื้อผ้า</span>
          <strong className="text-base font-extrabold text-amber-800 block mt-1">{stats.monthlyClothesCount} ล็อค</strong>
        </div>
      </div>

      {/* Summary progress bars */}
      <div className="mt-4 flex flex-col gap-3 border-t pt-3 text-xs">
        <div className="flex justify-between items-center font-bold">
          <span className="text-gray-600">สัดส่วนล็อค (รายวัน vs รายเดือน)</span>
          <span>รายวัน: {stats.dailyCount} | รายเดือน: {stats.monthlyCount}</span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-green-600 h-full" style={{ width: `${dailyPercent}%` }} />
          <div className="bg-purple-600 h-full flex-1" />
        </div>
      </div>
    </div>
  );
}
