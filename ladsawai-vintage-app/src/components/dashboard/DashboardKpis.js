'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Percent, Layers, Sun, Calendar } from 'lucide-react';

export default function DashboardKpis() {
  const { data } = useDashboard();
  const { stats } = data;

  const occupancyRate = stats.totalStalls > 0 ? ((stats.occupied / stats.totalStalls) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      
      {/* Occupancy KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">อัตราการครองแผงค้า</p>
          <h3 className="text-lg md:text-xl font-extrabold text-amber-800 mt-1">
            {occupancyRate.toFixed(1)}%
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            จอง {stats.occupied} จากทั้งหมด {stats.totalStalls} ล็อค
          </span>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <Percent className="w-6 h-6 text-amber-700" />
        </div>
      </div>

      {/* Total Booked KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">แผงค้าที่จองทั้งหมด</p>
          <h3 className="text-lg md:text-xl font-extrabold text-blue-700 mt-1">
            {stats.occupied} ล็อค
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            ล็อคที่ขายในวันที่เลือก
          </span>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Layers className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Daily Booked KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">จองรายวันวันนี้</p>
          <h3 className="text-lg md:text-xl font-extrabold text-green-700 mt-1">
            {stats.dailyCount} ล็อค
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            สัดส่วนรายวัน: อาหาร {stats.dailyFoodCount} | เสื้อผ้า {stats.dailyClothesCount}
          </span>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <Sun className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Monthly Booked KPI */}
      <div className="bg-white border-2 border-amber-800/20 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-amber-800/40 transition-all">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">จองรายเดือนวันนี้</p>
          <h3 className="text-lg md:text-xl font-extrabold text-purple-700 mt-1">
            {stats.monthlyCount} ล็อค
          </h3>
          <span className="text-[9px] text-gray-400 font-semibold">
            สัดส่วนรายเดือน: อาหาร {stats.monthlyFoodCount} | เสื้อผ้า {stats.monthlyClothesCount}
          </span>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <Calendar className="w-6 h-6 text-purple-600" />
        </div>
      </div>

    </div>
  );
}
