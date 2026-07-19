'use client';

import React from 'react';
import { BookingProvider, useBooking } from '@/context/BookingContext';
import { StorageProvider } from '@/context/StorageContext';
import MonthlyManagerLayout from '@/components/booking/MonthlyManagerLayout';
import StandardBookingLayout from '@/components/booking/StandardBookingLayout';

function BookingPageContent() {
  const { isMonthlyPageOnly } = useBooking();

  if (isMonthlyPageOnly) {
    return <MonthlyManagerLayout />;
  }

  return <StandardBookingLayout />;
}

export default function BookingPage() {
  return (
    <BookingProvider>
      <StorageProvider>
        <BookingPageContent />
      </StorageProvider>
    </BookingProvider>
  );
}
