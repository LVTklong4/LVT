'use client';

import React from 'react';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { RefreshCw } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardFinanceKpis from '@/components/dashboard/DashboardFinanceKpis';
import DebtRisks from '@/components/dashboard/DebtRisks';
import PrimeCustomers from '@/components/dashboard/PrimeCustomers';
import FinanceInsights from '@/components/dashboard/FinanceInsights';

function DashboardFinanceContent() {
  const { loading } = useDashboard();

  return (
    <div className="min-h-screen bg-[#FDF5E6] py-6 px-4 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <DashboardHeader />

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-10 h-10 text-amber-800 animate-spin" />
            <span className="text-xs font-bold text-amber-900">กำลังประมวลผลข้อมูลการเงินจาก Supabase...</span>
          </div>
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

export default function DashboardFinancePage() {
  return (
    <DashboardProvider>
      <DashboardFinanceContent />
    </DashboardProvider>
  );
}
