'use client';

import React, { useState, useEffect, useMemo, Component } from 'react';
import {
  Printer, X, Search, Calendar, CheckCircle2,
  Phone, FileText, LayoutList, AlertTriangle,
  MessageSquare, Loader2, Send, CheckCircle, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
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

class ModalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('MonthlyDebtFollowUpModal error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-red-300 text-center flex flex-col gap-3">
            <h3 className="font-extrabold text-base text-red-700">เกิดข้อผิดพลาดในการแสดงผลใบตรวจยอดค้าง</h3>
            <p className="text-xs text-gray-600 bg-red-50 p-3 rounded-lg text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="flex gap-2 justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onClose?.();
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MonthlyDebtFollowUpModalContent({ isOpen, onClose }) {
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
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'A4_PREVIEW'

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

  // Real-time A4 HTML for live preview and printing
  const previewHTML = useMemo(() => {
    try {
      return generateDebtFollowUpA4HTML({
        items: filteredItems,
        milestone: activeMilestone,
        selectedMonth,
        zoneFilter,
        statusFilter,
        adminUser
      });
    } catch (err) {
      console.error('generateDebtFollowUpA4HTML error:', err);
      return `<div style="padding:20px;color:red;font-family:sans-serif;">เกิดข้อผิดพลาดในการสร้างเอกสาร: ${err.message}</div>`;
    }
  }, [filteredItems, activeMilestone, selectedMonth, zoneFilter, statusFilter, adminUser]);

  // Handle A4 Print
  const handlePrintA4 = () => {
    printDebtFollowUpA4(previewHTML);
  };

  // LINE Notification States
  const [lineUsersMap, setLineUsersMap] = useState(new Map());
  const [isLoadingLineUsers, setIsLoadingLineUsers] = useState(false);
  const [showLineNotifyModal, setShowLineNotifyModal] = useState(false);
  const [isSendingLine, setIsSendingLine] = useState(false);
  const [lineSendResult, setLineSendResult] = useState(null);

  // Fetch registered LINE users from Supabase when modal opens
  useEffect(() => {
    if (!isModalOpen) return;
    let isMounted = true;

    async function fetchLineUsers() {
      try {
        setIsLoadingLineUsers(true);
        const { data, error } = await supabase
          .from('line_users')
          .select('line_user_id, phone, display_name');

        if (!error && data && isMounted) {
          const map = new Map();
          data.forEach(u => {
            const clean = (u.phone || '').replace(/[^0-9]/g, '');
            if (clean) map.set(clean, u);
          });
          setLineUsersMap(map);
        }
      } catch (err) {
        console.warn('[MonthlyDebtFollowUpModal] Could not fetch line_users:', err);
      } finally {
        if (isMounted) setIsLoadingLineUsers(false);
      }
    }

    fetchLineUsers();
    return () => { isMounted = false; };
  }, [isModalOpen]);

  // Helper to match phone to a registered LINE user
  const checkLineUser = (phone) => {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) return null;
    if (lineUsersMap.has(clean)) return lineUsersMap.get(clean);
    for (const [k, v] of lineUsersMap.entries()) {
      if (k.endsWith(clean) || clean.endsWith(k)) return v;
    }
    return null;
  };

  // Group overdue debtors from filtered list for LINE notification
  const overdueDebtors = useMemo(() => {
    const debtors = (filteredItems || []).filter(item => {
      const hasDebt = (item.remainingDebt || 0) > 0 || (item.shortfall || 0) > 0;
      return hasDebt && item.renewalStatus !== 'ลา';
    });

    const map = new Map();
    debtors.forEach(item => {
      const clean = (item.phone || '').replace(/[^0-9]/g, '') || `item_${item.id}`;
      if (!map.has(clean)) {
        map.set(clean, {
          phone: item.phone,
          customerName: item.bookerName,
          items: [],
          totalRemainingDebt: 0,
          totalShortfall: 0,
          lineUser: checkLineUser(item.phone)
        });
      }
      const entry = map.get(clean);
      entry.items.push(item);
      entry.totalRemainingDebt += (item.remainingDebt || 0);
      entry.totalShortfall += (item.shortfall || 0);
      if (!entry.lineUser) {
        entry.lineUser = checkLineUser(item.phone);
      }
    });

    return Array.from(map.values());
  }, [filteredItems, lineUsersMap]);

  const connectedDebtors = useMemo(() => overdueDebtors.filter(d => !!d.lineUser), [overdueDebtors]);
  const unconnectedDebtors = useMemo(() => overdueDebtors.filter(d => !d.lineUser), [overdueDebtors]);

  // Handle Send LINE Notifications
  const handleSendLineNotification = async () => {
    if (connectedDebtors.length === 0) return;

    try {
      setIsSendingLine(true);
      setLineSendResult(null);

      // Collect target contracts
      const targets = connectedDebtors.flatMap(d => d.items.map(item => ({
        id: item.id,
        phone: d.phone,
        customerName: d.customerName,
        stalls: item.displayStalls || item.stalls,
        shortfall: item.shortfall,
        remainingDebt: item.remainingDebt,
        totalPrice: item.totalPrice,
        paidAmount: item.paidAmount,
        bookingMonth: item.bookingMonth || selectedMonth
      })));

      const res = await fetch('/api/line/notify-debt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่ง LINE');
      }

      setLineSendResult(data);
    } catch (err) {
      alert(`ไม่สามารถส่งข้อความได้: ${err.message}`);
    } finally {
      setIsSendingLine(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] border-2 border-[#8B4513] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-[#4A3B32]">
        
        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-6 bg-[#FAEBD7] border-b-2 border-[#8B4513]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Toggle: Interactive Table vs A4 Real Preview */}
            <div className="flex items-center bg-[#8B4513]/10 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-stone-900 shadow-sm font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>ตารางค้นหา ({filteredItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('A4_PREVIEW')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'A4_PREVIEW'
                    ? 'bg-amber-800 text-white shadow-sm font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ดูตัวอย่างใบ A4 จริง</span>
              </button>
            </div>

            <button
              onClick={() => {
                setLineSendResult(null);
                setShowLineNotifyModal(true);
              }}
              disabled={filteredItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="ส่งแจ้งเตือนยอดค้างผ่าน LINE ให้กับผู้ค้าที่ผูกบัญชีไว้"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">แจ้งเตือนผ่าน LINE ({connectedDebtors.length})</span>
              <span className="sm:hidden">LINE ({connectedDebtors.length})</span>
            </button>

            <button
              onClick={handlePrintA4}
              disabled={filteredItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-800 to-[#8B4513] hover:from-[#70360f] hover:to-amber-900 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="พิมพ์เอกสาร A4 พร้อมตารางติ๊กผลตรวจ"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">สั่งพิมพ์ใบตรวจ A4 ({filteredItems.length})</span>
              <span className="sm:hidden">สั่งพิมพ์ A4</span>
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

        {/* Main Content: Interactive Table or Live A4 Document Preview */}
        {viewMode === 'A4_PREVIEW' ? (
          <div className="flex-1 min-h-[350px] overflow-auto p-3 sm:p-5 bg-stone-200/60 flex flex-col items-center custom-scrollbar">
            <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col">
              <div className="bg-amber-100/70 px-4 py-2 border-b border-amber-300/80 flex flex-wrap justify-between items-center text-xs font-bold text-amber-950">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-800" />
                  พรีวิวใบตรวจ A4 จริง (ตัดการ์ด 4 ใบและแถบเงื่อนไขออกแล้ว)
                </span>
                <span className="text-stone-500 font-mono text-[11px]">
                  พร้อมพิมพ์ {filteredItems.length} ล็อค
                </span>
              </div>
              <iframe
                srcDoc={previewHTML}
                title="A4 Debt Follow-Up Document Preview"
                className="w-full h-[62vh] border-0 bg-white"
              />
            </div>
          </div>
        ) : (
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
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                            {row.phone && (
                              <a
                                href={`tel:${row.phone}`}
                                className="flex items-center gap-0.5 text-blue-700 hover:underline font-mono"
                                title="คลิกเพื่อโทรออก"
                              >
                                <Phone className="w-3 h-3" />
                                {row.phone}
                              </a>
                            )}
                            {row.phone && (
                              checkLineUser(row.phone) ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#06C755]/15 text-[#05913e] border border-[#06C755]/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]"></span>
                                  ผูก LINE แล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-stone-100 text-stone-400 border border-stone-200">
                                  ยังไม่ผูก LINE
                                </span>
                              )
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
        )}

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
              onClick={() => {
                setLineSendResult(null);
                setShowLineNotifyModal(true);
              }}
              disabled={filteredItems.length === 0}
              className="px-4 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" />
              <span>แจ้งเตือนผ่าน LINE ({connectedDebtors.length})</span>
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

        {/* LINE Notification Dialog */}
        {showLineNotifyModal && (
          <div className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-[#FFFDF9] border-2 border-[#06C755] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-[#4A3B32]">
              {/* Dialog Header */}
              <div className="bg-[#06C755] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-white" />
                  <h3 className="font-black text-sm sm:text-base">ส่งแจ้งเตือนยอดค้างผ่าน LINE</h3>
                </div>
                <button
                  onClick={() => setShowLineNotifyModal(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4 text-xs">
                {lineSendResult ? (
                  /* Result Screen */
                  <div className="flex flex-col items-center text-center py-2 gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-stone-900">ดำเนินการส่งข้อความเรียบร้อย</h4>
                      <p className="text-stone-600 text-xs mt-1">ระบบได้ส่งข้อความ Flex Card ไปยังห้องแชท LINE ของผู้ค้าแล้ว</p>
                    </div>

                    <div className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 flex justify-around text-center mt-2">
                      <div>
                        <div className="text-xl font-black text-[#06C755]">{lineSendResult.sentCount || 0}</div>
                        <div className="text-[11px] font-bold text-stone-600">ส่งสำเร็จ (ร้าน)</div>
                      </div>
                      {lineSendResult.failedCount > 0 && (
                        <div>
                          <div className="text-xl font-black text-red-600">{lineSendResult.failedCount}</div>
                          <div className="text-[11px] font-bold text-red-700">ส่งไม่สำเร็จ</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xl font-black text-stone-500">{lineSendResult.unregisteredCount || 0}</div>
                        <div className="text-[11px] font-bold text-stone-600">ยังไม่ผูก LINE</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowLineNotifyModal(false);
                        setLineSendResult(null);
                      }}
                      className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs mt-2 transition-all cursor-pointer shadow-md"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                ) : (
                  /* Confirmation Screen */
                  <>
                    <div>
                      <p className="text-stone-700 font-medium">
                        ระบบจะส่งข้อความสรุปยอดค้างชำระค่าเช่ารายเดือน <span className="font-bold text-[#8B4513]">({selectedMonth})</span> ให้กับผู้ค้าที่ยังมียอดค้างชำระในรอบนี้โดยตรงทาง LINE Official
                      </p>
                    </div>

                    {/* Stats Breakdown */}
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-3 rounded-xl border border-stone-200">
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                        <div className="text-[11px] font-bold text-emerald-800">🟢 ผูก LINE แล้ว</div>
                        <div className="text-xl font-black text-emerald-600 mt-0.5">{connectedDebtors.length} ร้าน</div>
                        <div className="text-[10px] text-emerald-700 font-medium">พร้อมรับข้อความเตือน</div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <div className="text-[11px] font-bold text-stone-600">⚪ ยังไม่ผูก LINE</div>
                        <div className="text-xl font-black text-stone-700 mt-0.5">{unconnectedDebtors.length} ร้าน</div>
                        <div className="text-[10px] text-stone-500 font-medium">ต้องตามเก็บโดยตรง</div>
                      </div>
                    </div>

                    {connectedDebtors.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">ไม่พบผู้ค้าที่ผูก LINE ในกลุ่มนี้</div>
                          <div className="text-[11px] mt-0.5 text-amber-800">
                            แนะนำให้แชร์ LINE Official <span className="font-bold">@ladsawaivintage</span> ให้ผู้ค้าแอดเพื่อน และกดปุ่มลงทะเบียนใน LINE เพื่อผูกเบอร์โทรค่ะ
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
                        💡 ข้อความจะส่งเป็นการ์ดแจ้งเตือน (Flex Card) แสดงเลขล็อค ยอดคงค้าง และวิธีการชำระเงินอย่างสุภาพ
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={() => setShowLineNotifyModal(false)}
                        disabled={isSendingLine}
                        className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>

                      <button
                        type="button"
                        onClick={handleSendLineNotification}
                        disabled={connectedDebtors.length === 0 || isSendingLine}
                        className="flex-1 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingLine ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังส่งข้อความ...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>ส่งข้อความ ({connectedDebtors.length} ร้าน)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function MonthlyDebtFollowUpModal(props) {
  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <MonthlyDebtFollowUpModalContent {...props} />
    </ModalErrorBoundary>
  );
}
