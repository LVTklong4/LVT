'use client';

import React, { useState } from 'react';
import { AuthAdminProvider } from '@/context/AuthAdminContext';
import { MonthlyBookingProvider } from '@/context/MonthlyBookingContext';
import { BookingProvider } from '@/context/BookingContext';
import { StorageProvider } from '@/context/StorageContext';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import FinanceHeader from '@/components/dashboard/FinanceHeader';
import FinanceSummaryCards from '@/components/dashboard/FinanceSummaryCards';
import FinanceLedger from '@/components/dashboard/FinanceLedger';
import DailyClosingModal from '@/components/dashboard/DailyClosingModal';
import DashboardAuthGuard from '@/components/dashboard/DashboardAuthGuard';

function FinanceWorkplaceContent() {
  const { 
    incomeList, 
    expenseList, 
    loading, 
    isDateClosed, 
    fetchFinanceData 
  } = useFinance();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDailyClosingModal, setShowDailyClosingModal] = useState(false);

  const isClosed = isDateClosed(selectedDate);

  const handleRefresh = () => {
    fetchFinanceData();
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] py-5 px-3 sm:px-6 pb-20 font-sans selection:bg-amber-200 print:bg-white print:p-0">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-5">
        
        <div className="print:hidden flex flex-col gap-5">
          {/* 1. Dedicated Finance Header */}
          <FinanceHeader
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isClosed={isClosed}
            onOpenDailyClosing={() => setShowDailyClosingModal(true)}
            onRefresh={handleRefresh}
            loading={loading}
          />

          {/* 2. Operational Cashflow Summary Cards */}
          <FinanceSummaryCards
            incomeList={incomeList}
            expenseList={expenseList}
            selectedDate={selectedDate}
          />

          {/* 3. General Ledger Workplace (Forms & Table) */}
          <FinanceLedger
            defaultDate={selectedDate}
            onOpenDailyClosing={() => setShowDailyClosingModal(true)}
          />
        </div>

        {/* 4. Daily Closing Modal */}
        <DailyClosingModal
          isOpen={showDailyClosingModal}
          onClose={() => {
            setShowDailyClosingModal(false);
            fetchFinanceData();
          }}
          defaultDate={selectedDate}
        />

      </div>
    </div>
  );
}

export default function DashboardFinancePage() {
  return (
    <AuthAdminProvider>
      <DashboardAuthGuard>
        <MonthlyBookingProvider>
          <BookingProvider>
            <StorageProvider>
              <FinanceProvider>
                <FinanceWorkplaceContent />
              </FinanceProvider>
            </StorageProvider>
          </BookingProvider>
        </MonthlyBookingProvider>
      </DashboardAuthGuard>
    </AuthAdminProvider>
  );
}
