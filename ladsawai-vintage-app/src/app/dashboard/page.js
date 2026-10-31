'use client';

import React, { useState } from 'react';
import { AuthAdminProvider } from '@/context/AuthAdminContext';
import { MonthlyBookingProvider } from '@/context/MonthlyBookingContext';
import { BookingProvider } from '@/context/BookingContext';
import { StorageProvider } from '@/context/StorageContext';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { RefreshCw, Store, TrendingUp } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardKpis from '@/components/dashboard/DashboardKpis';
import ZoneStats from '@/components/dashboard/ZoneStats';
import BookingInsights from '@/components/dashboard/BookingInsights';
import DashboardFinanceKpis from '@/components/dashboard/DashboardFinanceKpis';
import DebtRisks from '@/components/dashboard/DebtRisks';
import PrimeCustomers from '@/components/dashboard/PrimeCustomers';
import FinanceInsights from '@/components/dashboard/FinanceInsights';
import DashboardAuthGuard from '@/components/dashboard/DashboardAuthGuard';

function DashboardContent() {
  const { loading } = useDashboard();
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' or 'finance'

  return (
    <div className="min-h-screen bg-[#FDF5E6] py-6 px-4 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <DashboardHeader />

        {/* Tab Navigation between Booking Overview and Finance Analytics */}
        <div className="flex bg-white/80 p-1.5 rounded-2xl border border-amber-300/80 shadow-xs w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('booking')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'booking'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-gray-600 hover:text-amber-900 hover:bg-amber-100/50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>ภาพรวมการจองล็อค (Booking Analytics)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-gray-600 hover:text-amber-900 hover:bg-amber-100/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>วิเคราะห์การเงินและความเสี่ยง (Finance Analytics)</span>
          </button>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-10 h-10 text-amber-800 animate-spin" />
            <span className="text-xs font-bold text-amber-900">กำลังประมวลผลข้อมูลแดชบอร์ดจาก Supabase...</span>
          </div>
        ) : activeTab === 'booking' ? (
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
        ) : (
          <>
            {/* KPI Cards (Finance-focused) */}
            <DashboardFinanceKpis />

            {/* Core Analytics Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column: Debt Risks */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Overdue Debt Risk List */}
                <DebtRisks />
              </div>

              {/* Right Column: Early Payers & Insights */}
              <div className="flex flex-col gap-6">
                {/* Prime early-paying Customers */}
                <PrimeCustomers />

                {/* Insights and tips */}
                <FinanceInsights />
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
    <AuthAdminProvider>
      <DashboardAuthGuard>
        <MonthlyBookingProvider>
          <BookingProvider>
            <StorageProvider>
              <DashboardProvider>
                <DashboardContent />
              </DashboardProvider>
            </StorageProvider>
          </BookingProvider>
        </MonthlyBookingProvider>
      </DashboardAuthGuard>
    </AuthAdminProvider>
  );
}
