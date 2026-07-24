'use client';

import React from 'react';
import { BookingProvider, useBooking } from '@/context/BookingContext';
import { AuthAdminProvider } from '@/context/AuthAdminContext';
import { StorageProvider } from '@/context/StorageContext';
import { KlongThomProvider } from '@/context/KlongThomContext';
import MonthlyManagerLayout from '@/components/booking/MonthlyManagerLayout';
import StandardBookingLayout from '@/components/booking/StandardBookingLayout';
import KlongThomBookingLayout from '@/components/booking/KlongThomBookingLayout';

function BookingPageContent() {
  const { isMonthlyPageOnly } = useBooking();
  const [view] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') || '';
    }
    return '';
  });

  if (isMonthlyPageOnly) {
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
      <BookingProvider>
        <StorageProvider>
          <BookingPageContent />
        </StorageProvider>
      </BookingProvider>
    </AuthAdminProvider>
  );
}

