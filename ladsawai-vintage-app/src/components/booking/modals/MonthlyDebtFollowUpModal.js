'use client';

import React, { useState, useMemo } from 'react';
import {
  Printer, X, Search, Calendar, CheckCircle2,
  Phone
} from 'lucide-react';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { useAuthAdmin } from '@/context/AuthAdminContext';
import { monthNamesFull, formatBookingMonth, sortThaiMonthsDescending } from '@/utils/thaiDateHelper';
import { formatPriceInt, parseNumber } from '@/utils/numberHelper';
import {
  MILESTONES,
  getCurrentMilestone,
  filterAndSortDebtList,
  extractDistinctZones,
  generateDebtFollowUpA4HTML,
  printDebtFollowUpA4
} from '@/services/monthly/debtFollowUpService';

export default function MonthlyDebtFollowUpModal({ isOpen, onClose }) {
  const {
    monthlyList,
    stalls,
    adminUser,
    showDebtFollowUpModal,
    setShowDebtFollowUpModal
  } = useMonthlyBooking();

  const isModalOpen = isOpen !== undefined ? isOpen : showDebtFollowUpModal;
  const handleClose = onClose || (() => setShowDebtFollowUpModal(false));

  // Current date & auto-detected milestone
  const todayMilestone = useMemo(() => getCurrentMilestone(new Date()), []);

  // Filter States
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(todayMilestone.id);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${monthNamesFull[now.getMonth()]} ${now.getFullYear() + 543}`;
  });
  const [statusFilter, setStatusFilter] = useState('BEHIND_TARGET'); // 'BEHIND_TARGET' | 'ALL_OVERDUE' | 'PAID' | 'ALL'
  const [zoneFilter, setZoneFilter] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  // Months available in system
  const monthOptions = useMemo(() => {
    const now = new Date();
    const currentMonthYear = `${monthNamesFull[now.getMonth()]} ${now.getFullYear() + 543}`;
    const set = new Set((monthlyList || []).map(item => formatBookingMonth(item.booking_month)).filter(m => m !== '-'));
    set.add(currentMonthYear);
    return sortThaiMonthsDescending(Array.from(set));
  }, [monthlyList]);

  // Compute filtered & sorted list
  const filteredItems = useMemo(() => {
    return filterAndSortDebtList({
      monthlyList,
      milestoneId: selectedMilestoneId,
      selectedMonth,
      statusFilter,
      zoneFilter,
      searchQuery
    });
  }, [monthlyList, selectedMilestoneId, selectedMonth, statusFilter, zoneFilter, searchQuery]);

  // Extract distinct zones for zone dropdown
  const availableZones = useMemo(() => {
    // Get all items of the selected month to extract zones
    const monthItems = filterAndSortDebtList({
      monthlyList,
      milestoneId: selectedMilestoneId,
      selectedMonth,
      statusFilter: 'ALL',
      zoneFilter: 'ทั้งหมด',
      searchQuery: ''
    });
    return extractDistinctZones(monthItems);
  }, [monthlyList, selectedMilestoneId, selectedMonth]);

  const activeMilestone = MILESTONES[selectedMilestoneId] || MILESTONES.W1;

  // Handle A4 Print
  const handlePrintA4 = () => {
    const html = generateDebtFollowUpA4HTML({
      items: filteredItems,
      milestone: activeMilestone,
      selectedMonth,
      zoneFilter,
      statusFilter,
      adminUser
    });
    printDebtFollowUpA4(html);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] border-2 border-[#8B4513] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-[#4A3B32]">
        
        {/* Header Bar */}
        <div className="px-4 py-3.5 sm:px-6 bg-[#FAEBD7] border-b-2 border-[#8B4513]/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 text-white flex items-center justify-center shadow-md shrink-0">
              <Printer className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#3E2723] tracking-tight">
                  ใบตรวจติดตามยอดค้างชำระค่าเช่ารายเดือน
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  พิมพ์ A4 สำหรับเดินตลาด
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium">
                คำนวณยอดขั้นต่ำตามบันได 4 สัปดาห์ (50% → 75% → 100% → มัดจำ 25%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintA4}
              disabled={filteredItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-800 to-[#8B4513] hover:from-[#70360f] hover:to-amber-900 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="พิมพ์เอกสาร A4 พร้อมตารางติ๊กผลตรวจ"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">พิมพ์ใบตรวจ A4 ({filteredItems.length})</span>
              <span className="sm:hidden">พิมพ์ A4</span>
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Milestone Selector Tabs */}
        <div className="bg-[#F5E6D3]/40 border-b border-[#8B4513]/15 px-3 py-2 sm:px-6 flex flex-wrap items-center gap-1.5 shrink-0 overflow-x-auto">
          <span className="text-xs font-bold text-stone-600 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-800" />
            เกณฑ์ประจำสัปดาห์:
          </span>

          {Object.values(MILESTONES).map((ms) => {
            const isSelected = selectedMilestoneId === ms.id;
            const isToday = todayMilestone.id === ms.id;

            return (
              <button
                key={ms.id}
                type="button"
                onClick={() => setSelectedMilestoneId(ms.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#8B4513] text-white shadow-sm ring-1 ring-[#8B4513]'
                    : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-200'
                }`}
              >
                <span>{ms.label}</span>
                {isToday && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-900'
                  }`}>
                    สัปดาห์นี้
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 sm:p-4 bg-white border-b border-stone-200 flex flex-wrap gap-2.5 items-center justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold">
              <span className="text-stone-500">รอบเดือน:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="ทั้งหมด">ทั้งหมดทุกเดือน</option>
                {monthOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold">
              <span className="text-stone-500">สถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="BEHIND_TARGET">⚠️ เฉพาะที่ยังไม่ถึงเกณฑ์ (ต้องตามเก็บ)</option>
                <option value="ALL_OVERDUE">🔴 ค้างชำระทั้งหมด (หนี้คงเหลือ &gt; 0)</option>
                <option value="PAID">✅ ชำระครบตามเกณฑ์</option>
                <option value="ALL">📋 ทั้งหมด (ทุกสถานะ)</option>
              </select>
            </div>

            {/* Zone Filter */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold">
              <span className="text-stone-500">โซนแผง:</span>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="ทั้งหมด">ทุกโซนเดินตลาด</option>
                {availableZones.map(z => (
                  <option key={z} value={z}>โซน {z}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาเลขล็อค, ชื่อผู้ค้า, เบอร์โทร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-stone-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 min-h-[300px] overflow-y-auto overflow-x-auto p-3 sm:p-6 bg-stone-50">
          <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left min-w-[760px]">
              <thead className="bg-[#4A2E1B] text-white font-bold sticky top-0 z-10 text-[11px]">
                <tr>
                  <th className="p-2.5 text-center w-12">#</th>
                  <th className="p-2.5 text-center w-24">ล็อค</th>
                  <th className="p-2.5">ผู้เช่า / ติดต่อ</th>
                  <th className="p-2.5 text-right w-24">ค่าเช่าเต็ม</th>
                  <th className="p-2.5 text-right w-28">ชำระแล้ว (%)</th>
                  <th className="p-2.5 text-right w-36 bg-amber-900/90 text-amber-100">
                    ยอดต้องเก็บเพิ่ม (ขั้นต่ำ)
                  </th>
                  <th className="p-2.5 text-right w-28">หนี้ค้างรวม</th>
                  <th className="p-2.5 text-center w-28">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-stone-500">
                      <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="font-bold text-stone-700">ไม่พบรายการค้างชำระตามเงื่อนไขที่เลือก</div>
                      <div className="text-[11px] text-stone-500 mt-1">ผู้ค้าทุกคนชำระตามเกณฑ์เรียบร้อย หรือไม่มีข้อมูลในรอบนี้</div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row, idx) => {
                    const isBehind = row.shortfall > 0;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-amber-50/40 transition-colors ${
                          idx % 2 === 1 ? 'bg-stone-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Num */}
                        <td className="p-2.5 text-center font-bold text-stone-400">
                          {idx + 1}
                        </td>

                        {/* Stall Badge */}
                        <td className="p-2.5 text-center">
                          <span className="inline-block px-2 py-1 rounded-md bg-amber-100 text-[#8B4513] font-black border border-amber-300 text-xs">
                            {row.displayStalls}
                          </span>
                        </td>

                        {/* Tenant Info */}
                        <td className="p-2.5">
                          <div className="font-bold text-stone-900">{row.bookerName}</div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                            {row.phone && (
                              <a
                                href={`tel:${row.phone}`}
                                className="flex items-center gap-0.5 text-blue-700 hover:underline"
                                title="คลิกเพื่อโทรออก"
                              >
                                <Phone className="w-3 h-3" />
                                {row.phone}
                              </a>
                            )}
                            {row.product && row.product !== '-' && (
                              <span>• {row.product}</span>
                            )}
                          </div>
                          {row.renewalStatus === 'ไม่ต่อสัญญา' && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-200">
                              แจ้งไม่ต่อสัญญา
                            </span>
                          )}
                        </td>

                        {/* Total Rent */}
                        <td className="p-2.5 text-right font-semibold text-stone-800">
                          ฿{formatPriceInt(row.totalPrice)}
                        </td>

                        {/* Paid Amount & Percent */}
                        <td className="p-2.5 text-right">
                          <div className="font-semibold text-stone-800">
                            ฿{formatPriceInt(row.paidAmount)}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-700">
                            {row.paidPercent}%
                          </div>
                        </td>

                        {/* Minimum Due / Shortfall */}
                        <td className="p-2.5 text-right bg-amber-50/50">
                          {isBehind ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded font-black text-xs bg-red-100 text-red-800 border border-red-200">
                                ฿{formatPriceInt(row.shortfall)}
                              </span>
                              {row.isRenewalMilestone && row.renewalDeposit > 0 && (
                                <div className="text-[9px] text-amber-800 font-bold mt-0.5">
                                  (+มัดจำต่อ ฿{formatPriceInt(row.renewalDeposit)})
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700">
                              ✓ ครบเกณฑ์
                            </span>
                          )}
                        </td>

                        {/* Total Remaining Debt */}
                        <td className="p-2.5 text-right font-bold text-stone-700">
                          {row.remainingDebt > 0 ? (
                            <span className="text-red-700">฿{formatPriceInt(row.remainingDebt)}</span>
                          ) : (
                            <span className="text-emerald-700">0.-</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-2.5 text-center">
                          {isBehind ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              ต้องตามเก็บ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ถึงเกณฑ์
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-4 py-3 sm:px-6 bg-[#FAEBD7] border-t-2 border-[#8B4513]/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600 text-center sm:text-left">
            <span className="font-bold text-stone-800">คำแนะนำ:</span> สั่งพิมพ์เป็นเอกสาร A4 เจ้าหน้าที่สามารถพกพาพร้อมคลิปบอร์ดเพื่อเดินตรวจเก็บเงินตามล็อค พร้อมช่องติ๊กรับเงินและนัดชำระ
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ปิด
            </button>
            <button
              onClick={handlePrintA4}
              disabled={filteredItems.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-amber-800 to-[#8B4513] hover:from-[#70360f] hover:to-amber-900 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบตรวจ A4 ({filteredItems.length} รายการ)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
