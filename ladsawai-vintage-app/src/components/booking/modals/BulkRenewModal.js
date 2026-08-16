'use client';

import React, { useState, useMemo } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Loader2, X, Phone, Check, Search, ArrowUpDown, Users, AlertTriangle } from 'lucide-react';

export default function BulkRenewModal() {
  const {
    bulkRenewCheckedIds,    bulkRenewEditData,    bulkRenewFromMonth,    cleanStallName,    computeNextMonthThai,    formatBookingMonth,    handleBulkRenewSubmit,    loadingMonthly,    monthlyList,    note,    parseNumber,    product,    setBulkRenewCheckedIds,    setBulkRenewEditData,    setBulkRenewEditingItem,    setBulkRenewFromMonth,    setBulkRenewToMonth,    setShowBulkRenewModal,    showBulkRenewModal,    sortThaiMonthsDescending,    stalls
  } = useBooking();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc' | 'none'

  if (!showBulkRenewModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#FFFDF9] rounded-xl shadow-2xl w-full max-w-5xl border-2 border-purple-800 overflow-hidden flex flex-col max-h-[90vh] animate-pop-in text-left text-xs font-sans text-gray-800">
              {/* Header */}
              <div className="bg-purple-900 text-white px-4 py-3 flex justify-between items-center shrink-0 border-b-2 border-purple-955">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5 text-white">🔄 จัดการต่อสัญญาลูกค้ารายเดือนแบบกลุ่ม</h3>
                  <p className="text-[10px] text-purple-200 font-bold mt-0.5">คัดลอกและอัปเดตข้อมูลสัญญาสำหรับรอบเดือนถัดไป</p>
                </div>
                <button 
                  onClick={() => setShowBulkRenewModal(false)} 
                  className="p-1 rounded-full bg-red-600/80 hover:bg-red-700 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Month Selectors & Search Bar */}
              <div className="bg-purple-50/50 px-5 py-3 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 shrink-0 font-bold text-gray-700">
                {/* Left: Month selection */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">จากรอบเดือน:</span>
                    <select
                      value={bulkRenewFromMonth}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        setBulkRenewFromMonth(selectedVal);
                        setBulkRenewToMonth(computeNextMonthThai(selectedVal));
                        setBulkRenewCheckedIds([]);
                        setBulkRenewEditData({});
                      }}
                      className="p-1.5 border border-purple-200 rounded-lg bg-white text-purple-900 cursor-pointer font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                    >
                      {sortThaiMonthsDescending(Array.from(new Set(monthlyList.map(item => formatBookingMonth(item.booking_month)).filter(m => m !== '-')))).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs">➡️ ปลายทาง:</span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 font-extrabold shadow-xs">
                      {computeNextMonthThai(bulkRenewFromMonth) || '(ระบุเดือนต้นทาง)'}
                    </span>
                  </div>
                </div>

                {/* Right: Search box & Duplicate Filter toggle */}
                <div className="flex items-center gap-2.5 ml-auto">
                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาชื่อ, เบอร์โทร, แผงค้า, สินค้า..."
                      className="w-56 pl-8 pr-7 py-1.5 border border-purple-200 rounded-lg text-xs bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs font-normal"
                    />
                    <Search className="w-3.5 h-3.5 text-purple-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Table Area */}
              <div className="flex-1 overflow-auto p-4 min-h-[300px]">
                {(() => {
                  const targetMonth = computeNextMonthThai(bulkRenewFromMonth);
                  
                  // 1. Get base source bookings
                  let sourceBookings = monthlyList.filter(item =>
                    formatBookingMonth(item.booking_month) === bulkRenewFromMonth &&
                    item.renewal_status !== 'ไม่ต่อสัญญา'
                  );

                  if (sourceBookings.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-bold gap-2">
                        <span>ไม่พบลูกค้ารายเดือนในรอบเดือน {bulkRenewFromMonth}</span>
                        <span className="text-[10px] text-gray-400 font-normal">(หรือผู้เช่าทั้งหมดได้รับการตั้งค่าสถานะไม่ต่อสัญญา)</span>
                      </div>
                    );
                  }

                  // 2. Count contracts per customer name in this source month
                  const bookerCountMap = {};
                  sourceBookings.forEach(item => {
                    const name = (item.booker_name || '').trim();
                    if (name) {
                      bookerCountMap[name] = (bookerCountMap[name] || 0) + 1;
                    }
                  });

                  const duplicateCustomerNames = new Set(
                    Object.keys(bookerCountMap).filter(name => bookerCountMap[name] > 1)
                  );

                  // 3. Filter by search query
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    sourceBookings = sourceBookings.filter(item => {
                      const name = (item.booker_name || '').toLowerCase();
                      const phone = (item.phone || '').toLowerCase();
                      const stalls = (item.stalls || '').toLowerCase();
                      const product = (item.product || '').toLowerCase();
                      const custom = bulkRenewEditData[item.id] || {};
                      const cName = (custom.booker_name || '').toLowerCase();
                      const cPhone = (custom.phone || '').toLowerCase();
                      const cProduct = (custom.product || '').toLowerCase();
                      return name.includes(q) || phone.includes(q) || stalls.includes(q) || product.includes(q) ||
                             cName.includes(q) || cPhone.includes(q) || cProduct.includes(q);
                    });
                  }

                  // 4. Filter by duplicates only
                  if (filterDuplicatesOnly) {
                    sourceBookings = sourceBookings.filter(item => {
                      const name = (item.booker_name || '').trim();
                      return duplicateCustomerNames.has(name);
                    });
                  }

                  // 5. Sort by customer name
                  sourceBookings.sort((a, b) => {
                    const nameA = (a.booker_name || '').trim();
                    const nameB = (b.booker_name || '').trim();
                    const cmp = nameA.localeCompare(nameB, 'th');
                    return sortOrder === 'asc' ? cmp : -cmp;
                  });

                  const isAlreadyRenewed = (item) => {
                    return monthlyList.some(mb => mb.booker_name === item.booker_name && formatBookingMonth(mb.booking_month) === targetMonth);
                  };

                  const nonRenewedBookings = sourceBookings.filter(item => !isAlreadyRenewed(item));
                  const allChecked = nonRenewedBookings.length > 0 && nonRenewedBookings.every(b => bulkRenewCheckedIds.includes(b.id));

                  return (
                    <div>
                      {/* Active Filter Bar if active */}
                      {(filterDuplicatesOnly || searchQuery) && (
                        <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs font-bold text-amber-900">
                          <div className="flex items-center gap-2">
                            <span>🔍 ผลการกรอง: แสดง {sourceBookings.length} รายการ</span>
                            {filterDuplicatesOnly && (
                              <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[10px]">
                                เฉพาะลูกค้าที่มีหลายสัญญา ({duplicateCustomerNames.size} คน)
                              </span>
                            )}
                            {searchQuery && (
                              <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[10px]">
                                คำค้น: &quot;{searchQuery}&quot;
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDuplicatesOnly(false);
                              setSearchQuery('');
                            }}
                            className="text-amber-800 hover:text-amber-950 underline text-[11px] cursor-pointer"
                          >
                            ล้างตัวกรองทั้งหมด
                          </button>
                        </div>
                      )}

                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-purple-100/60 border-b border-purple-200 text-purple-955 font-bold">
                            <th className="p-2 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                disabled={nonRenewedBookings.length === 0}
                                onChange={() => {
                                  if (allChecked) {
                                    const nonRenewedIds = new Set(nonRenewedBookings.map(b => b.id));
                                    setBulkRenewCheckedIds(bulkRenewCheckedIds.filter(id => !nonRenewedIds.has(id)));
                                  } else {
                                    const newIds = new Set([...bulkRenewCheckedIds, ...nonRenewedBookings.map(b => b.id)]);
                                    setBulkRenewCheckedIds(Array.from(newIds));
                                  }
                                }}
                                className="w-4 h-4 cursor-pointer rounded"
                              />
                            </th>
                            <th className="p-2 w-20">ประเภท</th>
                            <th className="p-2 min-w-[220px]">
                              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                  className="flex items-center gap-1 text-purple-955 hover:text-purple-900 cursor-pointer font-bold select-none group"
                                  title="คลิกเพื่อเรียงลำดับชื่อลูกค้า ก-ฮ หรือ ฮ-ก"
                                >
                                  <span>ชื่อลูกค้า</span>
                                  <ArrowUpDown className="w-3 h-3 text-purple-600 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] text-purple-700 bg-purple-200/70 px-1 rounded font-mono">
                                    {sortOrder === 'asc' ? 'ก-ฮ' : 'ฮ-ก'}
                                  </span>
                                </button>

                                {duplicateCustomerNames.size > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setFilterDuplicatesOnly(prev => !prev)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer select-none border shadow-2xs ${
                                      filterDuplicatesOnly 
                                        ? 'bg-amber-500 text-white border-amber-600 ring-1 ring-amber-400' 
                                        : 'bg-amber-100/90 text-amber-900 border-amber-300 hover:bg-amber-200'
                                    }`}
                                    title="คลิกเพื่อกรองดูเฉพาะลูกค้าที่มีสัญญามากกว่า 1 ชุด (ขอเพิ่มล็อคกลางคัน)"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                                    <span>พบซ้ำ {duplicateCustomerNames.size} คน</span>
                                  </button>
                                )}
                              </div>
                            </th>
                            <th className="p-2">ล็อคต้นทาง</th>
                            <th className="p-2">วันลงขาย</th>
                            <th className="p-2 text-center">จำนวนไฟ</th>
                            <th className="p-2 text-center">ค่าฝากของ</th>
                            <th className="p-2 text-center">ยอดเช่ารวม</th>
                            <th className="p-2 text-center">สถานะ/จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {sourceBookings.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-gray-400 font-bold">
                                ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง
                              </td>
                            </tr>
                          ) : (
                            sourceBookings.map(item => {
                              const renewed = isAlreadyRenewed(item);
                              const isChecked = bulkRenewCheckedIds.includes(item.id);
                              const customEdit = bulkRenewEditData[item.id] || {};
                              const trimmedName = (item.booker_name || '').trim();
                              const contractCount = bookerCountMap[trimmedName] || 1;
                              const isDuplicate = contractCount > 1;
                              
                              // Resolve display properties with custom edits
                              const dispBookerName = customEdit.booker_name !== undefined ? customEdit.booker_name : item.booker_name;
                              const dispType = customEdit.customer_type || item.customer_type || 'Standard';
                              const dispProduct = customEdit.product !== undefined ? customEdit.product : item.product || '';
                              const dispPhone = customEdit.phone !== undefined ? customEdit.phone : item.phone || '';
                              const dispStorage = customEdit.storage_fee !== undefined ? parseNumber(customEdit.storage_fee) : parseNumber(item.storage_fee || 0);
                              const dispElec = customEdit.elec_unit !== undefined ? parseNumber(customEdit.elec_unit) : parseNumber(item.elec_unit || 0);
                              const dispDays = customEdit.selected_days || item.selected_days;
                              
                              let dispStalls = item.stalls;
                              if (customEdit.stall_details) {
                                try {
                                  const sDet = JSON.parse(customEdit.stall_details);
                                  dispStalls = sDet.map(x => x.name).join(', ');
                                } catch(e){}
                              }

                              // Compute simulated price if edited
                              let dispPrice = item.total_price;
                              if (dispType === 'Room' || dispType === 'VIP') {
                                dispPrice = customEdit.total_price !== undefined ? parseNumber(customEdit.total_price) : item.total_price;
                              } else if (dispType === 'Regular') {
                                dispPrice = 0;
                              } else if (customEdit.stall_details || customEdit.elec_unit !== undefined || customEdit.storage_fee !== undefined || customEdit.selected_days) {
                                try {
                                  const sDet = JSON.parse(customEdit.stall_details || item.stall_details || '[]');
                                  const startD = new Date(item.start_date);
                                  const year = startD.getFullYear();
                                  const monthVal = startD.getMonth();
                                  const lastDay = new Date(year, monthVal + 1, 0).getDate();
                                  let totalRent = 0;
                                  let datesSet = new Set();
                                  const isFullPkg = dispDays.toLowerCase().includes('wed') && dispDays.toLowerCase().includes('sat') && dispDays.toLowerCase().includes('sun');
                                  
                                  for (let d = 1; d <= lastDay; d++) {
                                    const curD = new Date(year, monthVal, d);
                                    const dayOfWeek = curD.getDay();
                                    sDet.forEach(st => {
                                      const myDays = st.days || [];
                                      if (myDays.includes(dayOfWeek)) {
                                        datesSet.add(`${year}-${monthVal+1}-${d}`);
                                        const sMaster = stalls.find(s => s.name === st.name);
                                        let price = sMaster ? sMaster.price_wed : 0;
                                        if (dayOfWeek === 6 && sMaster) price = sMaster.price_sat;
                                        if (dayOfWeek === 0 && sMaster) price = sMaster.price_sun;
                                        if (dispType === 'Standard' && isFullPkg && sMaster && sMaster.price_month > 0) {
                                          const normalSum = parseNumber(sMaster.price_wed) + parseNumber(sMaster.price_sat) + parseNumber(sMaster.price_sun);
                                          const packageSum = 3 * parseNumber(sMaster.price_month);
                                          const weeklyDiscount = Math.max(0, normalSum - packageSum);
                                          const satDiscount = weeklyDiscount >= 100 ? 50 : weeklyDiscount;
                                          const sunDiscount = weeklyDiscount >= 100 ? (weeklyDiscount - 50) : 0;

                                          if (dayOfWeek === 3) price = sMaster.price_wed;
                                          else if (dayOfWeek === 6) price = sMaster.price_sat - satDiscount;
                                          else if (dayOfWeek === 0) price = sMaster.price_sun - sunDiscount;
                                        }
                                        totalRent += price;
                                      }
                                    });
                                  }
                                  const totalElecCharged = datesSet.size;
                                  const totalElecPrice = totalElecCharged * (dispElec * 10);
                                  dispPrice = totalRent + totalElecPrice + dispStorage;
                                } catch(e){}
                              }

                              let statusText = "ยังไม่ต่อ";
                              let statusColor = "bg-gray-100 text-gray-600";
                              if (renewed) {
                                statusText = "ต่อแล้ว";
                                statusColor = "bg-green-100 text-green-800";
                              } else if (bulkRenewEditData[item.id]) {
                                statusText = "พร้อม (แก้ไขแล้ว)";
                                statusColor = "bg-blue-100 text-blue-800";
                              }

                              return (
                                <tr 
                                  key={item.id} 
                                  className={`font-medium border-b border-gray-100 transition-colors ${
                                    isDuplicate 
                                      ? 'bg-amber-50/50 hover:bg-amber-100/50' 
                                      : 'hover:bg-purple-50/20 bg-white'
                                  }`}
                                >
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={renewed}
                                      onChange={() => {
                                        if (isChecked) {
                                          setBulkRenewCheckedIds(bulkRenewCheckedIds.filter(id => id !== item.id));
                                        } else {
                                          setBulkRenewCheckedIds([...bulkRenewCheckedIds, item.id]);
                                        }
                                      }}
                                      className="w-4 h-4 cursor-pointer rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    {(() => {
                                      if (dispType === 'Regular') {
                                        return <span className="inline-block w-[68px] text-center py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">ประจำ</span>;
                                      } else if (dispType === 'VIP') {
                                        return <span className="inline-block w-[68px] text-center py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">VIP</span>;
                                      } else if (dispType === 'Room') {
                                        return <span className="inline-block w-[68px] text-center py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">ห้องเช่า</span>;
                                      } else {
                                        return <span className="inline-block w-[68px] text-center py-0.5 rounded bg-[#E1BEE7] text-[#4A148C] border border-[#BA68C8] font-bold text-[10px]">รายเดือน</span>;
                                      }
                                    })()}
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-gray-800">{dispBookerName}</span>
                                      {isDuplicate && (
                                        <span 
                                          className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] flex items-center gap-0.5 shadow-2xs"
                                          title={`ลูกค้ารายนี้มี ${contractCount} สัญญาในเดือนเดียวกัน (อาจมีการขอเพิ่มล็อคกลางคัน สามารถแก้ไขรวมล็อคก่อนต่อสัญญาได้)`}
                                        >
                                          ⚠️ มี {contractCount} สัญญา
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-normal mt-0.5">{dispPhone || '-'} | สินค้า: {dispProduct || '-'}</div>
                                  </td>
                                  <td className="p-2 font-bold text-purple-950 font-mono">{cleanStallName(dispStalls)}</td>
                                  <td className="p-2 text-[10px]">{dispDays}</td>
                                  <td className="p-2 text-center font-mono font-bold">{dispElec} หน่วย</td>
                                  <td className="p-2 text-center font-mono font-semibold">{dispStorage.toLocaleString()}.-</td>
                                  <td className="p-2 text-center font-mono font-bold text-purple-900">{dispPrice.toLocaleString()}.-</td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor}`}>{statusText}</span>
                                      {!renewed && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Helper to normalize selected days string (Thai/English -> Wed, Sat, Sun)
                                            const rawDaysStr = String(dispDays || '').toLowerCase();
                                            const orderedDays = [];
                                            if (rawDaysStr.includes('wed') || rawDaysStr.includes('พุธ')) orderedDays.push('Wed');
                                            if (rawDaysStr.includes('sat') || rawDaysStr.includes('เสาร์')) orderedDays.push('Sat');
                                            if (rawDaysStr.includes('sun') || rawDaysStr.includes('อาทิตย์')) orderedDays.push('Sun');
                                            const normalizedDaysStr = orderedDays.length > 0 ? orderedDays.join(', ') : 'Wed, Sat, Sun';

                                            const activeDayNums = [];
                                            if (normalizedDaysStr.includes('Wed')) activeDayNums.push(3);
                                            if (normalizedDaysStr.includes('Sat')) activeDayNums.push(6);
                                            if (normalizedDaysStr.includes('Sun')) activeDayNums.push(0);

                                            // Resolve raw stall details array
                                            let resolvedRawStalls = [];
                                            const stallDetailsSource = customEdit.stall_details || item.stall_details;
                                            try {
                                              if (stallDetailsSource && typeof stallDetailsSource === 'string' && stallDetailsSource.trim() !== '' && stallDetailsSource !== '[]') {
                                                const parsed = JSON.parse(stallDetailsSource);
                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                  resolvedRawStalls = parsed.map(st => ({
                                                    name: st.name || st.stall || '',
                                                    days: (Array.isArray(st.days) && st.days.length > 0) ? st.days : activeDayNums
                                                  })).filter(st => st.name);
                                                }
                                              }
                                            } catch (e) {}

                                            // Fallback from stalls string if empty
                                            if (resolvedRawStalls.length === 0 && (dispStalls || item.stalls)) {
                                              const rawStallNames = String(dispStalls || item.stalls || '')
                                                .split(',')
                                                .map(s => s.replace(/[\[\]]/g, '').trim())
                                                .filter(Boolean);

                                              resolvedRawStalls = rawStallNames.map(sName => ({
                                                name: sName,
                                                days: activeDayNums.length > 0 ? [...activeDayNums] : [3, 6, 0]
                                              }));
                                            }

                                            setBulkRenewEditingItem({
                                              id: item.id,
                                              booker_name: dispBookerName,
                                              customer_type: dispType,
                                              product: dispProduct,
                                              phone: dispPhone,
                                              note: customEdit.note || item.note || '',
                                              storage_fee: String(dispStorage),
                                              elec_unit: String(dispElec),
                                              total_price: String(customEdit.total_price !== undefined ? customEdit.total_price : item.total_price || '0'),
                                              selected_days: normalizedDaysStr,
                                              stall_details: dispStalls,
                                              raw_stall_details: resolvedRawStalls
                                            });
                                          }}
                                          className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                          title={isDuplicate ? "มีหลายสัญญาในเดือนเดียวกัน สามารถเพิ่ม/รวมล็อคที่นี่ได้" : "แก้ไขข้อมูลก่อนต่อสัญญา"}
                                        >
                                          แก้ไขก่อนต่อ
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-purple-50 px-4 py-3 shrink-0 border-t border-purple-100 flex justify-between items-center">
                <span className="text-[10px] text-purple-800 font-bold">เลือกทำรายการต่อสัญญา {bulkRenewCheckedIds.length} รายการ</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkRenewSubmit}
                    disabled={loadingMonthly || bulkRenewCheckedIds.length === 0}
                    className={`px-4 py-2 rounded text-xs font-bold shadow transition-all flex items-center gap-1 cursor-pointer ${
                      bulkRenewCheckedIds.length > 0
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingMonthly ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    ยืนยันต่อสัญญาแผงเช่ากลุ่ม
                  </button>
                  <button
                    onClick={() => setShowBulkRenewModal(false)}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          </div>
  );
}
