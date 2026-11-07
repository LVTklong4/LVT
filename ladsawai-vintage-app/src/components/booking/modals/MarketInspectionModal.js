'use client';

import React, { useState, useMemo } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useMonthlyBooking } from '@/context/MonthlyBookingContext';
import { useStorage } from '@/context/StorageContext';
import {
  X,
  Printer,
  Zap,
  Package,
  Map,
  ClipboardList,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import {
  prepareElectricityInspectionData,
  printElectricityInspectionA4,
  prepareStorageInspectionData,
  printStorageInspectionA4,
  formatThaiDateLong
} from '@/services/inspection/marketInspectionPrintService';
import { printMarketLayoutA4 } from '@/utils/marketLayoutPrinter';
import { formatPrice, formatPriceInt } from '@/utils/numberHelper';
import { formatPhoneDisplay } from '@/utils/thaiDateHelper';

export default function MarketInspectionModal() {
  const {
    showInspectionModal,
    setShowInspectionModal,
    selectedDate,
    setSelectedDate,
    stalls,
    bookings,
    adminUser,
    showAlert
  } = useBooking();

  const { monthlyList, setShowDebtFollowUpModal } = useMonthlyBooking();
  const { storageList } = useStorage();

  const [activeTab, setActiveTab] = useState('ELECTRICITY'); // 'ELECTRICITY' | 'STORAGE' | 'MAP' | 'DEBT'
  
  // Electricity Tab Filters
  const [elecFilter, setElecFilter] = useState('ALL'); // 'ALL' | 'WITH_ELEC' | 'NO_ELEC'
  const [elecSort, setElecSort] = useState('STALL_NAME'); // 'STALL_NAME' | 'WALKWAY' | 'ELEC_DESC'
  const [elecSearch, setElecSearch] = useState('');

  // Storage Tab Filters
  const [storageTypeFilter, setStorageTypeFilter] = useState('ALL'); // 'ALL' | 'MONTHLY' | 'DAILY'
  const [storageSearch, setStorageSearch] = useState('');

  if (!showInspectionModal) return null;

  // Electricity Data
  const elecData = prepareElectricityInspectionData({
    selectedDate,
    stalls,
    bookings,
    filterType: elecFilter,
    sortType: elecSort
  });

  // Filter by search query
  const filteredElecItems = elecData.items.filter(item => {
    if (!elecSearch.trim()) return true;
    const q = elecSearch.toLowerCase().trim();
    return (
      item.stallName.toLowerCase().includes(q) ||
      item.bookerName.toLowerCase().includes(q) ||
      item.product.toLowerCase().includes(q)
    );
  });

  // Storage Data
  const storageItems = prepareStorageInspectionData({
    storageList,
    monthlyList,
    selectedDate
  });

  const monthlyStorageCount = storageItems.filter(i => i.type === 'รายเดือน').length;
  const dailyStorageCount = storageItems.filter(i => i.type === 'รายวัน').length;

  const filteredStorageItems = storageItems.filter(item => {
    if (storageTypeFilter === 'MONTHLY' && item.type !== 'รายเดือน') return false;
    if (storageTypeFilter === 'DAILY' && item.type !== 'รายวัน') return false;

    if (!storageSearch.trim()) return true;
    const q = storageSearch.toLowerCase().trim();
    return (
      item.stallName.toLowerCase().includes(q) ||
      item.ownerName.toLowerCase().includes(q) ||
      (item.phone && item.phone.toLowerCase().includes(q)) ||
      item.period.toLowerCase().includes(q)
    );
  });

  // Handlers for printing
  const handlePrintElectricity = () => {
    printElectricityInspectionA4({
      selectedDate,
      stalls,
      bookings,
      adminUser,
      filterType: elecFilter,
      sortType: elecSort,
      showAlert
    });
  };

  const handlePrintStorage = () => {
    printStorageInspectionA4({
      storageList,
      monthlyList,
      stalls,
      adminUser,
      selectedDate,
      showAlert
    });
  };

  const handlePrintMap = () => {
    printMarketLayoutA4({
      selectedDate,
      stalls,
      bookings,
      adminUser,
      showAlert
    });
  };

  const handleOpenDebt = () => {
    setShowInspectionModal(false);
    setShowDebtFollowUpModal(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl w-full max-w-5xl border border-[#8B4513]/40 overflow-hidden flex flex-col max-h-[92vh] text-gray-800 animate-pop-in">
        
        {/* Modal Header */}
        <div className="bg-[#4A2E1B] text-white px-5 py-3.5 flex justify-between items-center shrink-0 border-b-2 border-amber-600 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0">
              🛡️
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-amber-100 leading-tight">
                ศูนย์รวมการตรวจสอบตลาด (Market Inspection Hub)
              </h3>
              <p className="text-[10px] sm:text-xs text-amber-200/80 font-medium">
                พิมพ์เอกสาร A4 สำหรับเจ้าหน้าที่เดินตรวจตราหน้างาน: ผังตลาด, ไฟฟ้า, ฝากของ และยอดค้างชำระ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInspectionModal(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Inspection Date Bar */}
        <div className="bg-[#F8EFE6] border-b border-amber-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#4A2E1B]">
            <Calendar className="w-4 h-4 text-amber-800 shrink-0" />
            <span>วันที่ตรวจตลาด:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-md font-bold text-gray-800 shadow-2xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
            <span className="text-amber-900 font-extrabold hidden md:inline ml-1">
              ({formatThaiDateLong(selectedDate)})
            </span>
          </div>

          <div className="text-[11px] text-amber-900 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-amber-200">
            เจ้าหน้าที่: <strong className="text-[#4A2E1B]">{adminUser?.name || 'Admin'}</strong>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-amber-50/40 px-3 pt-2 gap-1 overflow-x-auto text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ELECTRICITY')}
            className={`px-3 sm:px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ELECTRICITY'
                ? 'bg-[#FFFDF9] text-amber-900 border-t-2 border-x border-t-amber-600 border-x-amber-200/80 font-black shadow-xs'
                : 'text-gray-600 hover:text-amber-900 hover:bg-amber-100/50'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeTab === 'ELECTRICITY' ? 'text-amber-600 fill-amber-500' : 'text-gray-500'}`} />
            <span>⚡ ใบตรวจไฟฟ้า (A4)</span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-extrabold">
              {elecData.stats.totalOccupied}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STORAGE')}
            className={`px-3 sm:px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'STORAGE'
                ? 'bg-[#FFFDF9] text-amber-900 border-t-2 border-x border-t-amber-600 border-x-amber-200/80 font-black shadow-xs'
                : 'text-gray-600 hover:text-amber-900 hover:bg-amber-100/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-700" />
            <span>📦 ใบตรวจฝากของ (A4)</span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-extrabold">
              {storageItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MAP')}
            className={`px-3 sm:px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'MAP'
                ? 'bg-[#FFFDF9] text-amber-900 border-t-2 border-x border-t-amber-600 border-x-amber-200/80 font-black shadow-xs'
                : 'text-gray-600 hover:text-amber-900 hover:bg-amber-100/50'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-blue-600" />
            <span>🗺️ พิมพ์ผังตลาด (A4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEBT')}
            className={`px-3 sm:px-4 py-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'DEBT'
                ? 'bg-[#FFFDF9] text-amber-900 border-t-2 border-x border-t-amber-600 border-x-amber-200/80 font-black shadow-xs'
                : 'text-gray-600 hover:text-amber-900 hover:bg-amber-100/50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-red-600" />
            <span>📋 ใบตรวจยอดค้างชำระ (A4)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          
          {/* TAB 1: ELECTRICITY */}
          {activeTab === 'ELECTRICITY' && (
            <div className="flex flex-col gap-3">

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-gray-50/80 border border-gray-200 rounded-xl p-2.5 text-xs font-bold">
                
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-500 text-[11px] mr-1">ตัวกรอง:</span>
                  <button
                    type="button"
                    onClick={() => setElecFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      elecFilter === 'ALL'
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    ทั้งหมด ({elecData.stats.totalOccupied})
                  </button>
                  <button
                    type="button"
                    onClick={() => setElecFilter('WITH_ELEC')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      elecFilter === 'WITH_ELEC'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    ⚡ ขอใช้ไฟ ({elecData.stats.withElecCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setElecFilter('NO_ELEC')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      elecFilter === 'NO_ELEC'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    🔌 ไม่ใช้ไฟ ({elecData.stats.noElecCount})
                  </button>
                </div>

                {/* Sort & Search & Print */}
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  
                  {/* Sorting */}
                  <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <select
                      value={elecSort}
                      onChange={(e) => setElecSort(e.target.value)}
                      className="bg-transparent text-gray-700 font-bold outline-none cursor-pointer py-1"
                    >
                      <option value="STALL_NAME">เรียงเลขล็อค (A-Z)</option>
                      <option value="WALKWAY">เรียงแนวทางเดิน (Row/Col)</option>
                      <option value="ELEC_DESC">ไฟมาก ➔ น้อย</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาล็อค/ร้านค้า..."
                      value={elecSearch}
                      onChange={(e) => setElecSearch(e.target.value)}
                      className="pl-8 pr-2.5 py-1 bg-white border border-gray-200 rounded-md font-medium text-gray-800 w-36 sm:w-44 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={handlePrintElectricity}
                    className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์ใบตรวจไฟฟ้า (A4)</span>
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[58vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#4A2E1B] text-white font-bold sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="p-2 w-10 text-center">ลำดับ</th>
                        <th className="p-2 w-24 text-center">ประเภท</th>
                        <th className="p-2">ชื่อร้านค้า / สินค้า</th>
                        <th className="p-2 w-28 text-center">ล็อค</th>
                        <th className="p-2 w-28 text-center">ไฟฟ้าที่แจ้ง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredElecItems.length > 0 ? (
                        filteredElecItems.map((item, idx) => {
                          const hasElec = item.elecUnit > 0;
                          return (
                            <tr key={item.id || idx} className={`hover:bg-amber-50/40 transition-colors ${item.isAbsent ? 'bg-gray-50 text-gray-400' : ''}`}>
                              <td className="p-2 text-center text-gray-400 font-semibold">{idx + 1}</td>
                              <td className="p-2 text-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  item.type === 'รายเดือน'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="p-2">
                                <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                                  <span>{item.bookerName}</span>
                                  {item.isAbsent && (
                                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                                      (ลา)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">{item.product}</div>
                              </td>
                              <td className="p-2 text-center">
                                <span className="font-extrabold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-xs inline-block">
                                  {item.stallName}
                                </span>
                              </td>
                              <td className="p-2 text-center font-bold">
                                {hasElec ? (
                                  <span className="text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-black">
                                    ⚡ {item.elecUnit} หน่วย
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-[11px] font-medium">0 หน่วย</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                            ไม่พบรายการล็อคที่ลงขายในเงื่อนไขนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE */}
          {activeTab === 'STORAGE' && (
            <div className="flex flex-col gap-3">
              
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-gray-50/80 border border-gray-200 rounded-xl p-2.5 text-xs font-bold">
                
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-500 text-[11px] mr-1">ตัวกรอง:</span>
                  <button
                    type="button"
                    onClick={() => setStorageTypeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      storageTypeFilter === 'ALL'
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    ทั้งหมด ({storageItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageTypeFilter('MONTHLY')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      storageTypeFilter === 'MONTHLY'
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    📅 รายเดือน ({monthlyStorageCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageTypeFilter('DAILY')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      storageTypeFilter === 'DAILY'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    📦 รายวัน ({dailyStorageCount})
                  </button>
                </div>

                {/* Search & Print */}
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาล็อค/ผู้ฝาก/เบอร์..."
                      value={storageSearch}
                      onChange={(e) => setStorageSearch(e.target.value)}
                      className="pl-8 pr-2.5 py-1 bg-white border border-gray-200 rounded-md font-medium text-gray-800 w-44 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintStorage}
                    className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์ใบตรวจฝากของ (A4)</span>
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[58vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#4A2E1B] text-white font-bold sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="p-2 w-10 text-center">ลำดับ</th>
                        <th className="p-2 w-24 text-center">ประเภท</th>
                        <th className="p-2">ผู้ฝาก / เบอร์โทร</th>
                        <th className="p-2 w-28 text-center">ล็อค</th>
                        <th className="p-2 w-36 text-center">ช่วงเวลา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredStorageItems.length > 0 ? (
                        filteredStorageItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-2 text-center text-gray-400 font-semibold">{idx + 1}</td>
                            <td className="p-2 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                item.type === 'รายเดือน'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-2">
                              <div className="font-extrabold text-gray-900">{item.ownerName}</div>
                              {item.phone && item.phone !== '-' && (
                                <div className="text-[10px] text-gray-500 font-medium">📞 {formatPhoneDisplay(item.phone)}</div>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <span className="font-extrabold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-xs inline-block">
                                {item.stallName}
                              </span>
                            </td>
                            <td className="p-2 text-center font-bold">
                              <span className={`text-xs ${item.type === 'รายเดือน' ? 'text-blue-900 font-extrabold' : 'text-gray-800 font-bold'}`}>
                                {item.period}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                            ไม่พบรายการฝากของในขณะนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARKET LAYOUT */}
          {activeTab === 'MAP' && (
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center gap-4 bg-amber-50/30 rounded-2xl border border-amber-200/80">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-sm">
                🗺️
              </div>
              <div className="max-w-md">
                <h4 className="text-base sm:text-lg font-black text-amber-950 mb-1">
                  พิมพ์ผังตลาดขนาด A4 (Market Layout)
                </h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  สร้างเอกสารผังตลาด A4 แนวนอน/แนวตั้ง จัดเต็มทุกล็อค 20x26 ช่อง พร้อมไฮไลต์สถานะการจอง, ร้านค้าที่ลงขาย และรายการค้างชำระด้านล่าง สำหรับติดบอร์ดและให้เจ้าหน้าที่ถือเดินตรวจ
                </p>
              </div>

              <div className="bg-white px-4 py-2 rounded-lg border border-amber-200 text-xs font-bold text-amber-900">
                ผังตลาดประจำ: <strong>{formatThaiDateLong(selectedDate)}</strong>
              </div>

              <button
                type="button"
                onClick={handlePrintMap}
                className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ผังตลาด A4 (Print Layout)</span>
              </button>
            </div>
          )}

          {/* TAB 4: MONTHLY DEBT */}
          {activeTab === 'DEBT' && (
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center gap-4 bg-rose-50/30 rounded-2xl border border-rose-200/80">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-3xl shadow-sm">
                📋
              </div>
              <div className="max-w-md">
                <h4 className="text-base sm:text-lg font-black text-rose-950 mb-1">
                  ใบตรวจยอดค้างชำระรายเดือนตามเกณฑ์ 4 สัปดาห์ (A4)
                </h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  ตรวจสอบและจัดพิมพ์ใบเช็คลิสต์ติดตามหนี้รายเดือนตามเกณฑ์บันได 4 สัปดาห์ (สัปดาห์ 1: 50%, สัปดาห์ 2: 75%, สัปดาห์ 3: 100%, สัปดาห์ 4: มัดจำล่วงหน้า 25%)
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenDebt}
                className="px-6 py-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all text-sm"
              >
                <ClipboardList className="w-4 h-4" />
                <span>เปิดหน้าต่างใบตรวจยอดค้างชำระ A4</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAEBD7] border-t border-[#8B4513]/20 px-5 py-2.5 flex justify-between items-center text-xs font-bold text-gray-700 shrink-0">
          <span className="text-[11px] text-gray-500">
            ตลาดนัดลาดสวายวินเทจ • ศูนย์รวมการตรวจสอบตลาด
          </span>
          <button
            type="button"
            onClick={() => setShowInspectionModal(false)}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg cursor-pointer transition-colors"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
