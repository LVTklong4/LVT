'use client';

import React from 'react';
import { BookingProvider } from '@/context/BookingContext';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { RefreshCw } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardKpis from '@/components/dashboard/DashboardKpis';
import ZoneStats from '@/components/dashboard/ZoneStats';
import BookingInsights from '@/components/dashboard/BookingInsights';

function DashboardContent() {
  const { loading } = useDashboard();

  return (
    <div className="min-h-screen bg-[#FDF5E6] py-6 px-4 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <DashboardHeader />

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-10 h-10 text-amber-800 animate-spin" />
            <span className="text-xs font-bold text-amber-900">กำลังประมวลผลข้อมูลแดชบอร์ดจาก Supabase...</span>
          </div>
        ) : (
          <>
            {/* KPI Cards (Booking-focused) */}
            <DashboardKpis />

            {/* Core Analytics Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column: Stats */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Zone statistics list */}
                <ZoneStats />
              </div>

              {/* Right Column: Insights */}
              <div className="flex flex-col gap-6">
                {/* Insights and tips */}
                <BookingInsights />
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <BookingProvider>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </BookingProvider>
  );
}
