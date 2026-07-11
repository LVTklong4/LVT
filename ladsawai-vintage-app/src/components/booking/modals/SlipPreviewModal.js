'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';

export default function SlipPreviewModal() {
  const {
    setMonthlyPaymentForm,    setSlipPreviewUrl,    slipPreviewUrl
  } = useBooking();

  if (!slipPreviewUrl) return null;

  return (
    <button
                        type="button"
                        onClick={() => {
                          setSlipPreviewUrl(null);
                          setMonthlyPaymentForm(prev => ({ ...prev, slip_base64: null }));
                        }}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ลบรูป
                      </button>
  );
}
