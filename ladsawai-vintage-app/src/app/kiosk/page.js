"use client";

import React from "react";
import { BookingProvider } from "@/context/BookingContext";
import { AuthAdminProvider } from "@/context/AuthAdminContext";
import { MonthlyBookingProvider } from "@/context/MonthlyBookingContext";
import { StorageProvider } from "@/context/StorageContext";
import KioskBookingLayout from "@/components/booking/KioskBookingLayout";

export default function KioskPage() {
  return (
    <AuthAdminProvider>
      <MonthlyBookingProvider>
        <BookingProvider>
          <StorageProvider>
            <KioskBookingLayout />
          </StorageProvider>
        </BookingProvider>
      </MonthlyBookingProvider>
    </AuthAdminProvider>
  );
}
