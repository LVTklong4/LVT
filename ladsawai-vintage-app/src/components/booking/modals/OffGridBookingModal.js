'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import OffGridBookingForm from './OffGridBookingForm';
import OffGridBookingList from './OffGridBookingList';

export default function OffGridBookingModal({ isOpen, onClose, selectedBooking: initialSelectedBooking, onSaveSuccess }) {
  const [activeBooking, setActiveBooking] = useState(initialSelectedBooking || null);

  useEffect(() => {
    if (isOpen) {
      setActiveBooking(initialSelectedBooking || null);
    }
  }, [isOpen, initialSelectedBooking]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#FAF6EE] rounded-xl shadow-2xl w-full max-w-4xl border-2 border-[#8B4513] overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
        {/* Header */}
        <div className="bg-[#8B4513] text-white px-4 py-3 flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-sm flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>จัดการจองนอกผังรายวัน (Off-Grid Daily Booking)</span>
          </h3>
          <button 
            onClick={() => {
              setActiveBooking(null);
              onClose();
            }} 
            className="text-amber-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto flex flex-col md:flex-row gap-5">
          <OffGridBookingForm
            selectedBooking={activeBooking}
            onClearSelection={() => setActiveBooking(null)}
            onSaveSuccess={onSaveSuccess}
          />
          <OffGridBookingList
            selectedBookingId={activeBooking?.id}
            onSelectBooking={(b) => setActiveBooking(b)}
          />
        </div>
      </div>
    </div>
  );
}
