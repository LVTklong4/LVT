import { formatPrice, formatPriceInt, parseNumber, cleanStallName } from '@/utils/numberHelper';
import { dayNamesShort, monthNamesFull, formatPhoneDisplay, formatThaiDateRangeShort } from '@/utils/thaiDateHelper';

/**
 * Compares stalls alphanumeric naturally (e.g. 1, 2, 10, 13/1, 13/2, ส1, ส2)
 */
export function compareStallNames(a, b) {
  const stallA = cleanStallName(a || '');
  const stallB = cleanStallName(b || '');
  return stallA.localeCompare(stallB, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Format Date to Thai full string e.g. "วันเสาร์ที่ 7 พฤศจิกายน 2569"
 */
export function formatThaiDateLong(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dayName = 'วัน' + (dayNamesShort[d.getDay()] || '');
  const dateNum = d.getDate();
  const monthName = monthNamesFull[d.getMonth()] || '';
  const yearTh = d.getFullYear() + 543;
  return `${dayName}ที่ ${dateNum} ${monthName} ${yearTh}`;
}

/**
 * Prepare Occupied Stalls for Electricity Inspection
 */
export function prepareElectricityInspectionData({
  selectedDate,
  stalls = [],
  bookings = [],
  filterType = 'ALL', // 'ALL' | 'WITH_ELEC' | 'NO_ELEC'
  sortType = 'STALL_NAME' // 'STALL_NAME' | 'WALKWAY' | 'ELEC_DESC'
}) {
  const dateBookings = (bookings || []).filter(b => b.date === selectedDate && b.status !== 'ยกเลิก');

  // Group bookings by merchant/contract so customers with multiple stalls
  // do not duplicate electricity units and are consolidated into a single row.
  const groups = new Map();
  let totalStallsCount = 0;

  dateBookings.forEach((b) => {
    const isMonthly = !!b.master_id || b.type === 'รายเดือน';
    let groupKey;
    if (b.master_id) {
      groupKey = `monthly_${b.master_id}`;
    } else if (isMonthly && b.booker_name && b.booker_name !== '.' && b.booker_name !== '-') {
      groupKey = `monthly_${b.booker_name.trim().toLowerCase()}_${(b.product || '').trim().toLowerCase()}`;
    } else if (
      b.booker_name && 
      !['.', '-', '0', '00', '000', 'ปจ'].includes(b.booker_name.trim()) && 
      b.product && 
      b.product.trim() && 
      b.product.trim() !== '-'
    ) {
      groupKey = `daily_${b.booker_name.trim().toLowerCase()}_${b.product.trim().toLowerCase()}`;
    } else {
      groupKey = `daily_id_${b.id}`;
    }

    const rawStallStr = b.stall_name || b.stall_id || '';
    const stallNames = rawStallStr.split(',').map(s => cleanStallName(s)).filter(Boolean);
    const unit = parseNumber(b.elec_unit || 0);
    const price = parseNumber(b.elec_price || (unit > 0 ? unit * 10 : 0));
    const isAbsent = b.status === 'ลา';

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: b.id,
        groupKey,
        isMonthly,
        masterId: b.master_id,
        bookerName: b.booker_name || b.customer_name || '-',
        product: b.product || '-',
        type: isMonthly ? 'รายเดือน' : 'รายวัน',
        stallsSet: new Set(stallNames),
        elecUnit: unit,
        elecPrice: price,
        isAbsent,
        note: b.note || ''
      });
    } else {
      const g = groups.get(groupKey);
      stallNames.forEach(s => g.stallsSet.add(s));
      // For both monthly contracts and daily multi-stall setups, the electricity unit
      // requested represents the total electricity for their whole shop on that day.
      if (unit > g.elecUnit) {
        g.elecUnit = unit;
        g.elecPrice = price;
      }
      if (isAbsent) g.isAbsent = true;
      if (b.note && !g.note) g.note = b.note;
    }
  });

  // Convert groups to array items with sorted stalls and walkway coordinates
  const items = Array.from(groups.values()).map((g) => {
    const sortedStalls = Array.from(g.stallsSet).sort(compareStallNames);
    const displayStalls = sortedStalls.join(', ') || '-';
    totalStallsCount += sortedStalls.length;

    // Find lowest row and col across all stalls in this group
    let minRow = 999;
    let minCol = 999;
    sortedStalls.forEach((sName) => {
      const sm = stalls.find(s => cleanStallName(s.name) === sName);
      if (sm) {
        if (sm.row != null && sm.row < minRow) minRow = sm.row;
        if (sm.col != null && sm.col < minCol) minCol = sm.col;
      }
    });

    return {
      id: g.id,
      groupKey: g.groupKey,
      stallName: displayStalls,
      displayStalls,
      stallsList: sortedStalls,
      firstStall: sortedStalls[0] || '',
      row: minRow,
      col: minCol,
      bookerName: g.bookerName,
      product: g.product,
      type: g.type,
      isAbsent: g.isAbsent,
      elecUnit: g.elecUnit,
      elecPrice: g.elecPrice,
      note: g.note
    };
  });

  // Calculate statistics
  const totalOccupied = items.length; // Number of unique merchant shops/rows
  const withElecCount = items.filter(i => i.elecUnit > 0).length;
  const totalElecUnits = items.reduce((sum, i) => sum + i.elecUnit, 0);
  const totalElecAmount = items.reduce((sum, i) => sum + i.elecPrice, 0);
  const noElecCount = totalOccupied - withElecCount;

  // Filter
  let filtered = [...items];
  if (filterType === 'WITH_ELEC') {
    filtered = filtered.filter(i => i.elecUnit > 0);
  } else if (filterType === 'NO_ELEC') {
    filtered = filtered.filter(i => i.elecUnit === 0);
  }

  // Sort
  filtered.sort((a, b) => {
    if (sortType === 'WALKWAY') {
      if (a.row !== b.row) return a.row - b.row;
      if (a.col !== b.col) return a.col - b.col;
      return compareStallNames(a.firstStall, b.firstStall);
    }
    if (sortType === 'ELEC_DESC') {
      if (b.elecUnit !== a.elecUnit) return b.elecUnit - a.elecUnit;
      return compareStallNames(a.firstStall, b.firstStall);
    }
    return compareStallNames(a.firstStall, b.firstStall);
  });

  return {
    items: filtered,
    stats: {
      totalOccupied,
      totalStallsCount,
      withElecCount,
      totalElecUnits,
      totalElecAmount,
      noElecCount
    }
  };
}

/**
 * Generate A4 HTML for Electricity Inspection
 */
export function generateElectricityInspectionA4HTML({
  selectedDate,
  stalls = [],
  bookings = [],
  adminUser = null,
  filterType = 'ALL',
  sortType = 'STALL_NAME'
}) {
  const { items, stats } = prepareElectricityInspectionData({
    selectedDate,
    stalls,
    bookings,
    filterType,
    sortType
  });

  const now = new Date();
  const printTimeStr = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';

  const formattedDate = formatThaiDateLong(selectedDate);
  const inspectorName = adminUser?.name || 'เจ้าหน้าที่ตรวจตลาด';

  const filterLabel = filterType === 'WITH_ELEC' 
    ? 'เฉพาะร้านที่ขอใช้ไฟ' 
    : filterType === 'NO_ELEC' 
      ? 'เฉพาะร้านที่ไม่ขอใช้ไฟ (ตรวจจับแอบใช้)' 
      : 'ทุกล็อคที่ลงขาย';

  const rowsHtml = items.map((item, idx) => {
    const hasElec = item.elecUnit > 0;
    const elecBadge = hasElec
      ? `<span class="elec-badge">⚡ ${item.elecUnit} หน่วย</span>`
      : `<span class="no-elec-tag">0 หน่วย</span>`;

    const typeBadge = item.type === 'รายเดือน'
      ? `<span class="type-monthly">รายเดือน</span>`
      : `<span class="type-daily">รายวัน</span>`;

    const statusBadge = item.isAbsent
      ? `<span class="absent-badge">(ลา)</span>`
      : '';

    return `
      <tr class="${idx % 2 === 1 ? 'row-alt' : ''} ${item.isAbsent ? 'row-absent' : ''}">
        <td class="col-num">${idx + 1}</td>
        <td class="col-type">${typeBadge}</td>
        <td class="col-tenant">
          <div class="tenant-name">${item.bookerName} ${statusBadge}</div>
          <div class="tenant-product">${item.product || '-'}</div>
        </td>
        <td class="col-stall">
          <div class="stall-badge">${item.stallName}</div>
        </td>
        <td class="col-elec">${elecBadge}</td>
        <td class="col-checklist">
          <div class="check-box-group">
            <span class="chk-item">[ ] ตรง</span>
            <span class="chk-item">[ ] เกิน/แอบใช้</span>
          </div>
        </td>
        <td class="col-note">
          <div class="note-dots"></div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบตรวจการใช้ไฟฟ้าประจำวัน - ${selectedDate}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 7mm 7mm 8mm 7mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Sarabun", "Segoe UI", Roboto, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #111;
            font-size: 10pt;
            line-height: 1.3;
          }
          .no-print {
            background: #fef3c7;
            border-bottom: 2px solid #d97706;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            font-weight: bold;
            color: #92400e;
          }
          .print-btn {
            background: #8b4513;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          .print-btn:hover { background: #6d340c; }
          .close-btn {
            background: #e5e7eb;
            color: #374151;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 8px;
          }
          
          /* Header */
          .report-header {
            border-bottom: 2px solid #8b4513;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-title-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-img {
            width: 44px;
            height: 44px;
            object-fit: contain;
          }
          .brand-title {
            font-size: 15pt;
            font-weight: 900;
            color: #4a2e1b;
            letter-spacing: -0.2px;
            line-height: 1.1;
          }
          .report-subtitle {
            font-size: 11pt;
            font-weight: 800;
            color: #b45309;
            margin-top: 2px;
          }
          .meta-info {
            text-align: right;
            font-size: 8.5pt;
            color: #444;
            line-height: 1.4;
          }

          /* Checklist Table */
          table.checklist-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          table.checklist-table th {
            background: #4a2e1b;
            color: #ffffff;
            font-weight: 800;
            padding: 5px 4px;
            text-align: left;
            border: 1px solid #3d2312;
            font-size: 8.5pt;
          }
          table.checklist-table td {
            padding: 4px 4px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr.row-alt {
            background-color: #faf8f5;
          }
          tr.row-absent {
            background-color: #f3f4f6;
            color: #9ca3af;
          }
          
          .col-num { width: 26px; text-align: center; font-weight: bold; color: #6b7280; font-size: 8pt; }
          .col-type { width: 55px; text-align: center; }
          .col-tenant { width: 175px; }
          .col-stall { width: 75px; text-align: center; }
          .col-elec { width: 85px; text-align: center; }
          .col-checklist { width: 135px; }
          .col-note { width: 135px; }

          .stall-badge {
            font-size: 9.5pt;
            font-weight: 900;
            color: #7c2d12;
            background: #ffedd5;
            border: 1px solid #fdba74;
            border-radius: 4px;
            padding: 1.5px 4px;
            display: inline-block;
            line-height: 1.25;
            word-break: break-word;
          }
          .tenant-name {
            font-weight: 800;
            color: #1f2937;
            font-size: 9pt;
          }
          .tenant-product {
            font-size: 8pt;
            color: #6b7280;
          }
          .type-monthly {
            font-size: 7.5pt;
            font-weight: 800;
            color: #1e40af;
            background: #dbeafe;
            padding: 1px 4px;
            border-radius: 3px;
          }
          .type-daily {
            font-size: 7.5pt;
            font-weight: 800;
            color: #065f46;
            background: #d1fae5;
            padding: 1px 4px;
            border-radius: 3px;
          }
          .absent-badge {
            color: #dc2626;
            font-size: 7.5pt;
            font-weight: bold;
          }
          .elec-badge {
            font-weight: 800;
            color: #9a3412;
            background: #fef3c7;
            border: 1px solid #fde68a;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 8.5pt;
          }
          .no-elec-tag {
            color: #6b7280;
            font-size: 8pt;
            font-weight: 600;
          }
          .check-box-group {
            display: flex;
            gap: 8px;
            font-size: 8pt;
            font-weight: 700;
            color: #374151;
          }
          .chk-item {
            white-space: nowrap;
          }
          .note-dots {
            border-bottom: 1px dotted #9ca3af;
            height: 14px;
            width: 100%;
          }

          /* Signature Footer */
          .signature-section {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            page-break-inside: avoid;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
          }
          .sign-box {
            width: 45%;
            text-align: center;
          }
          .sign-line {
            margin-top: 25px;
            border-bottom: 1px dashed #6b7280;
            width: 180px;
            margin-left: auto;
            margin-right: auto;
          }
          .sign-label {
            margin-top: 4px;
            font-weight: bold;
            color: #374151;
          }

          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div>
            <span>⚡ ตลาดนัดลาดสวายวินเทจ - ใบตรวจการใช้ไฟฟ้า (A4)</span>
            <span style="margin-left: 10px; font-weight: normal; font-size: 11px;">[ตัวกรอง: ${filterLabel} | ทั้งหมด ${items.length} รายการ]</span>
          </div>
          <div>
            <button class="close-btn" onclick="window.close()">ปิดหน้าต่าง</button>
            <button class="print-btn" onclick="window.print()">🖨️ สั่งพิมพ์เอกสาร (Print)</button>
          </div>
        </div>

        <div class="report-header">
          <div class="header-top">
            <div class="logo-title-group">
              <img src="/logo.png" class="logo-img" alt="Logo" />
              <div>
                <div class="brand-title">ตลาดนัดลาดสวายวินเทจ</div>
                <div class="report-subtitle">⚡ ใบตรวจการใช้ไฟฟ้าประจำวัน (Electricity Inspection Sheet)</div>
              </div>
            </div>
            <div class="meta-info">
              <div><strong>ประจำวัน:</strong> ${formattedDate}</div>
              <div><strong>พิมพ์เมื่อ:</strong> ${printTimeStr}</div>
              <div><strong>ผู้สั่งพิมพ์:</strong> ${inspectorName}</div>
            </div>
          </div>
        </div>

        <table class="checklist-table">
          <thead>
            <tr>
              <th class="col-num">ลำดับ</th>
              <th class="col-type">ประเภท</th>
              <th class="col-tenant">ชื่อร้านค้า / สินค้า</th>
              <th class="col-stall">ล็อค</th>
              <th class="col-elec">ไฟฟ้าที่แจ้ง</th>
              <th class="col-checklist">ผลตรวจหน้างาน</th>
              <th class="col-note">อุปกรณ์ที่ตรวจพบ / บันทึก</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#6b7280;">ไม่พบรายการล็อคที่ลงขายในเงื่อนไขนี้</td></tr>`}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">ลงชื่อ ................................................................ (ผู้ตรวจ)</div>
            <div style="font-size: 8pt; color: #6b7280; margin-top: 2px;">เจ้าหน้าที่ตรวจตราความเรียบร้อย</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">ลงชื่อ ................................................................ (ผู้รับทราบ)</div>
            <div style="font-size: 8pt; color: #6b7280; margin-top: 2px;">ผู้จัดการตลาด / ผู้ดูแลระบบ</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Print Electricity Inspection Sheet
 */
export function printElectricityInspectionA4(options) {
  const html = generateElectricityInspectionA4HTML(options);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    if (typeof options.showAlert === 'function') {
      options.showAlert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์เอกสาร A4', 'แจ้งเตือน', true);
    } else {
      alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์เอกสาร A4');
    }
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Prepare Storage Inspection Data
 */
export function prepareStorageInspectionData({
  storageList = [],
  monthlyList = [],
  selectedDate = null
}) {
  const groups = new Map();

  // Determine target month from selectedDate if provided (e.g. "2026-11")
  const selectedMonth = selectedDate ? String(selectedDate).substring(0, 7) : null;
  const hasMonthMatches = selectedMonth && (monthlyList || []).some(
    m => m.status !== 'ยกเลิก' && parseNumber(m.storage_fee) > 0 && String(m.start_date).substring(0, 7) === selectedMonth
  );

  // 1. Regular Storage items (Daily / Weekly deposits)
  (storageList || []).forEach(item => {
    if (item.status === 'Active' || item.status === 'Overdue') {
      const owner = (item.owner_name || '').trim();
      const phone = (item.phone || '').trim();
      const groupKey = 'daily_' + (owner ? owner.toLowerCase() : item.id) + '_' + phone;
      const rawStallStr = item.stall_name || item.stall_id || '';
      const stallNames = rawStallStr.split(',').map(s => cleanStallName(s)).filter(Boolean);
      const period = formatThaiDateRangeShort(item.start_date, item.end_date);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: item.id,
          source: 'STORAGE',
          type: 'รายวัน',
          ownerName: owner || '-',
          phone: phone || '-',
          stallsSet: new Set(stallNames),
          period: period,
          startDate: item.start_date || '-',
          endDate: item.end_date || '-',
          status: item.status === 'Overdue' ? 'เกินกำหนด' : 'ปกติ',
          isOverdue: item.status === 'Overdue',
          note: item.note || ''
        });
      } else {
        const g = groups.get(groupKey);
        stallNames.forEach(s => g.stallsSet.add(s));
      }
    }
  });

  // 2. Monthly bookings with storage fee
  (monthlyList || []).forEach(m => {
    if (m.status !== 'ยกเลิก' && parseNumber(m.storage_fee) > 0) {
      if (hasMonthMatches && m.start_date) {
        const contractMonth = String(m.start_date).substring(0, 7);
        if (contractMonth !== selectedMonth) return;
      }

      const owner = (m.booker_name || m.customer_name || '').trim();
      const phone = (m.phone || '').trim();
      const groupKey = 'monthly_' + (owner ? owner.toLowerCase() : m.id) + '_' + phone;
      const rawStallStr = m.stalls || m.stall_name || '';
      const stallNames = rawStallStr.split(',').map(s => cleanStallName(s)).filter(Boolean);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: m.id,
          source: 'MONTHLY',
          type: 'รายเดือน',
          ownerName: owner || '-',
          phone: phone || '-',
          stallsSet: new Set(stallNames),
          period: 'ทั้งเดือน',
          startDate: m.start_date || '-',
          endDate: m.end_date || '-',
          status: m.status || 'ชำระแล้ว',
          isOverdue: false,
          note: m.product || ''
        });
      } else {
        const g = groups.get(groupKey);
        stallNames.forEach(s => g.stallsSet.add(s));
      }
    }
  });

  // Convert groups to sorted array
  const items = Array.from(groups.values()).map(g => {
    const sortedStalls = Array.from(g.stallsSet).sort(compareStallNames);
    const displayStalls = sortedStalls.join(', ') || '-';

    return {
      ...g,
      stallName: displayStalls,
      displayStalls,
      stallsList: sortedStalls,
      firstStall: sortedStalls[0] || ''
    };
  });

  // Sort by first stall naturally
  items.sort((a, b) => compareStallNames(a.firstStall, b.firstStall));

  return items;
}

/**
 * Generate A4 HTML for Storage Inspection
 */
export function generateStorageInspectionA4HTML({
  storageList = [],
  monthlyList = [],
  adminUser = null,
  selectedDate = null
}) {
  const items = prepareStorageInspectionData({ storageList, monthlyList, selectedDate });
  const totalStallsCount = items.reduce((sum, i) => sum + (i.stallsList?.length || 1), 0);

  const now = new Date();
  const printTimeStr = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';

  const formattedDate = formatThaiDateLong(selectedDate || new Date().toISOString().split('T')[0]);
  const inspectorName = adminUser?.name || 'เจ้าหน้าที่ตรวจตลาด';

  const rowsHtml = items.map((item, idx) => {
    const typeBadge = item.type === 'รายเดือน'
      ? `<span class="type-monthly">รายเดือน</span>`
      : `<span class="type-daily">รายวัน</span>`;

    const phoneHtml = item.phone && item.phone !== '-' 
      ? `<div class="owner-phone">📞 ${formatPhoneDisplay(item.phone)}</div>` 
      : '';

    return `
      <tr class="${idx % 2 === 1 ? 'row-alt' : ''}">
        <td class="col-num">${idx + 1}</td>
        <td class="col-type">${typeBadge}</td>
        <td class="col-owner">
          <div class="owner-name">${item.ownerName}</div>
          ${phoneHtml}
        </td>
        <td class="col-stall">
          <div class="stall-badge">${item.stallName}</div>
        </td>
        <td class="col-dates">
          <div class="period-text">${item.period}</div>
        </td>
        <td class="col-checklist">
          <div class="check-box-group">
            <span class="chk-item">[ ] มีของ</span>
            <span class="chk-item">[ ] ไม่พบของ</span>
            <span class="chk-item">[ ] แอบฝาก/วางเกิน</span>
          </div>
        </td>
        <td class="col-note">
          <div class="note-dots"></div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบตรวจการฝากของประจำตลาด (A4) - ${selectedDate || ''}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 7mm 7mm 8mm 7mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Sarabun", "Segoe UI", Roboto, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #111;
            font-size: 10pt;
            line-height: 1.3;
          }
          .no-print {
            background: #fef3c7;
            border-bottom: 2px solid #d97706;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            font-weight: bold;
            color: #92400e;
          }
          .print-btn {
            background: #8b4513;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          .print-btn:hover { background: #6d340c; }
          .close-btn {
            background: #e5e7eb;
            color: #374151;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 8px;
          }
          
          /* Header */
          .report-header {
            border-bottom: 2px solid #8b4513;
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-title-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-img {
            width: 44px;
            height: 44px;
            object-fit: contain;
          }
          .brand-title {
            font-size: 15pt;
            font-weight: 900;
            color: #4a2e1b;
            letter-spacing: -0.2px;
            line-height: 1.1;
          }
          .report-subtitle {
            font-size: 11pt;
            font-weight: 800;
            color: #854d0e;
            margin-top: 2px;
          }
          .meta-info {
            text-align: right;
            font-size: 8.5pt;
            color: #444;
            line-height: 1.4;
          }

          /* Checklist Table */
          table.checklist-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
          }
          table.checklist-table th {
            background: #4a2e1b;
            color: #ffffff;
            font-weight: 800;
            padding: 5px 4px;
            text-align: left;
            border: 1px solid #3d2312;
            font-size: 8pt;
          }
          table.checklist-table td {
            padding: 4px 4px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }
          tr.row-alt {
            background-color: #faf8f5;
          }
          
          .col-num { width: 28px; text-align: center; font-weight: bold; color: #6b7280; font-size: 8pt; }
          .col-type { width: 60px; text-align: center; }
          .col-owner { width: 155px; }
          .col-stall { width: 75px; text-align: center; }
          .col-dates { width: 115px; text-align: center; }
          .col-checklist { width: 135px; }
          .col-note { width: 120px; }

          .stall-badge {
            font-size: 9.5pt;
            font-weight: 900;
            color: #7c2d12;
            background: #ffedd5;
            border: 1px solid #fdba74;
            border-radius: 4px;
            padding: 1.5px 4px;
            display: inline-block;
            line-height: 1.25;
            word-break: break-word;
          }
          .owner-name {
            font-weight: 800;
            color: #1f2937;
            font-size: 8.5pt;
          }
          .owner-phone {
            font-size: 7.5pt;
            color: #6b7280;
          }
          .type-monthly {
            font-size: 7.5pt;
            font-weight: 800;
            color: #1e40af;
            background: #dbeafe;
            padding: 1px 4px;
            border-radius: 3px;
          }
          .type-daily {
            font-size: 7.5pt;
            font-weight: 800;
            color: #065f46;
            background: #d1fae5;
            padding: 1px 4px;
            border-radius: 3px;
          }
          .period-text {
            font-weight: 700;
            font-size: 8.5pt;
            color: #374151;
          }
          .check-box-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 7.5pt;
            font-weight: 700;
            color: #374151;
          }
          .chk-item {
            white-space: nowrap;
          }
          .note-dots {
            border-bottom: 1px dotted #9ca3af;
            height: 16px;
            width: 100%;
          }

          /* Signature Footer */
          .signature-section {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            page-break-inside: avoid;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
          }
          .sign-box {
            width: 45%;
            text-align: center;
          }
          .sign-line {
            margin-top: 25px;
            border-bottom: 1px dashed #6b7280;
            width: 180px;
            margin-left: auto;
            margin-right: auto;
          }
          .sign-label {
            margin-top: 4px;
            font-weight: bold;
            color: #374151;
          }

          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div>
            <span>📦 ตลาดนัดลาดสวายวินเทจ - ใบตรวจการฝากของประจำตลาด (A4)</span>
            <span style="margin-left: 10px; font-weight: normal; font-size: 11px;">[ทั้งหมด ${items.length} ร้าน (${totalStallsCount} ล็อค)]</span>
          </div>
          <div>
            <button class="close-btn" onclick="window.close()">ปิดหน้าต่าง</button>
            <button class="print-btn" onclick="window.print()">🖨️ สั่งพิมพ์เอกสาร (Print)</button>
          </div>
        </div>

        <div class="report-header">
          <div class="header-top">
            <div class="logo-title-group">
              <img src="/logo.png" class="logo-img" alt="Logo" />
              <div>
                <div class="brand-title">ตลาดนัดลาดสวายวินเทจ</div>
                <div class="report-subtitle">📦 ใบตรวจการฝากของประจำตลาด (Storage Inspection Sheet)</div>
              </div>
            </div>
            <div class="meta-info">
              <div><strong>ประจำวัน/รอบสัปดาห์:</strong> ${formattedDate}</div>
              <div><strong>พิมพ์เมื่อ:</strong> ${printTimeStr}</div>
              <div><strong>ผู้สั่งพิมพ์:</strong> ${inspectorName}</div>
              <div><strong>รายการที่ตรวจ:</strong> ${items.length} ร้าน (${totalStallsCount} ล็อค)</div>
            </div>
          </div>
        </div>

        <table class="checklist-table">
          <thead>
            <tr>
              <th class="col-num">ลำดับ</th>
              <th class="col-type">ประเภท</th>
              <th class="col-owner">ผู้ฝาก / เบอร์โทร</th>
              <th class="col-stall">ล็อค</th>
              <th class="col-dates">ช่วงเวลา</th>
              <th class="col-checklist">ผลตรวจหน้างาน</th>
              <th class="col-note">สิ่งของที่ตรวจพบ / บันทึก</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#6b7280;">ไม่พบรายการฝากของในขณะนี้</td></tr>`}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">ลงชื่อ ................................................................ (ผู้ตรวจ)</div>
            <div style="font-size: 8pt; color: #6b7280; margin-top: 2px;">เจ้าหน้าที่ตรวจตราความเรียบร้อย</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">ลงชื่อ ................................................................ (ผู้รับทราบ)</div>
            <div style="font-size: 8pt; color: #6b7280; margin-top: 2px;">ผู้จัดการตลาด / ผู้ดูแลระบบ</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Print Storage Inspection Sheet
 */
export function printStorageInspectionA4(options) {
  const html = generateStorageInspectionA4HTML(options);
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    if (typeof options.showAlert === 'function') {
      options.showAlert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์เอกสาร A4', 'แจ้งเตือน', true);
    } else {
      alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์เอกสาร A4');
    }
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}
