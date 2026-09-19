'use client';

import React from 'react';
import { BookingProvider, useBooking } from '@/context/BookingContext';
import { AuthAdminProvider } from '@/context/AuthAdminContext';
import { MonthlyBookingProvider } from '@/context/MonthlyBookingContext';
import { StorageProvider } from '@/context/StorageContext';
import { KlongThomProvider } from '@/context/KlongThomContext';
import MonthlyManagerLayout from '@/components/booking/MonthlyManagerLayout';
import StandardBookingLayout from '@/components/booking/StandardBookingLayout';
import KlongThomBookingLayout from '@/components/booking/KlongThomBookingLayout';

function BookingPageContent() {
  const [view, setView] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view') || '';
      if (v) setView(v);
    }
  }, []);

  if (view === 'monthly') {
    return <MonthlyManagerLayout />;
  }

  if (view === 'klongthom') {
    return (
      <KlongThomProvider>
        <KlongThomBookingLayout />
      </KlongThomProvider>
    );
  }

  return <StandardBookingLayout />;
}

export default function BookingPage() {
  return (
    <AuthAdminProvider>
      <MonthlyBookingProvider>
        <BookingProvider>
          <StorageProvider>
            <BookingPageContent />
          </StorageProvider>
        </BookingProvider>
      </MonthlyBookingProvider>
    </AuthAdminProvider>
  );
}

