'use client';

import React from 'react';

export default function OffGridPaymentSection({
  paymentList,
  setPaymentList,
  changeVal,
  parseNumber
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-amber-100 pt-2">
      <label className="text-[10px] font-bold text-gray-700 flex justify-between items-center">
        <span>ช่องทางชำระเงิน <span className="text-red-500">*</span></span>
      </label>

      {paymentList.map((entry, index) => {
        const isAmtValid = !!(entry.amount && parseNumber(entry.amount) > 0);
        return (
          <div key={index} className="flex gap-1.5 items-center">
            <input
              type="number"
              value={entry.amount}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const updated = [...paymentList];
                updated[index].amount = e.target.value;
                setPaymentList(updated);
              }}
              placeholder="จำนวนเงิน"
              className="w-24 p-1 border border-amber-300 rounded text-xs text-right font-mono font-bold"
            />
            <div className="flex gap-1 flex-1">
              <button
                type="button"
                onClick={() => {
                  const updated = [...paymentList];
                  updated[index].method = 'เงินสด';
                  setPaymentList(updated);
                }}
                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                  entry.method === 'เงินสด'
                    ? 'bg-[#8B4513] text-white border-[#8B4513]'
                    : !isAmtValid
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                    : 'bg-white text-gray-500 border-amber-200 hover:bg-amber-50'
                }`}
              >
                เงินสด
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = [...paymentList];
                  updated[index].method = 'โอนเงิน';
                  setPaymentList(updated);
                }}
                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                  entry.method === 'โอนเงิน'
                    ? 'bg-[#8B4513] text-white border-[#8B4513]'
                    : !isAmtValid
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                    : 'bg-white text-gray-500 border-amber-200 hover:bg-amber-50'
                }`}
              >
                โอนจ่าย
              </button>
            </div>
          </div>
        );
      })}

      {changeVal > 0 && (
        <div className="text-right text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-200 p-1 rounded">
          เงินทอน: {changeVal.toLocaleString()} บาท
        </div>
      )}
    </div>
  );
}
