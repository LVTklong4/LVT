import { formatPrice, formatPriceInt, parseNumber, cleanStallName } from '@/utils/numberHelper';
import { monthNamesFull, formatBookingMonth } from '@/utils/thaiDateHelper';

/**
 * Weekly Milestones for Market Stall Rental Collection:
 * - W1 (Days 1–7): Accumulated paid >= 50% (or +25% if 25% renewal deposit was paid last month)
 * - W2 (Days 8–14): Accumulated paid >= 75%
 * - W3 (Days 15–21): Accumulated paid 100%
 * - W4 (Days 22+): Paid 100% current month + 25% renewal deposit for next month
 * - ALL: All outstanding contracts with remaining debt > 0
 */
export const MILESTONES = {
  W1: {
    id: 'W1',
    label: 'สัปดาห์ที่ 1 (1–7)',
    shortLabel: 'สัปดาห์ 1 (50%)',
    name: 'สัปดาห์ที่ 1 (วันที่ 1 – 7)',
    dayRange: 'วันที่ 1 – 7 ของเดือน',
    targetPercent: 50,
    depositPercent: 0,
    description: 'ยอดชำระสะสมขั้นต่ำ 50% ของค่าเช่าทั้งเดือน (ชำระเพิ่ม 25% หากวางมัดจำแล้ว)',
  },
  W2: {
    id: 'W2',
    label: 'สัปดาห์ที่ 2 (8–14)',
    shortLabel: 'สัปดาห์ 2 (75%)',
    name: 'สัปดาห์ที่ 2 (วันที่ 8 – 14)',
    dayRange: 'วันที่ 8 – 14 ของเดือน',
    targetPercent: 75,
    depositPercent: 0,
    description: 'ยอดชำระสะสมขั้นต่ำ 75% ของค่าเช่าทั้งเดือน',
  },
  W3: {
    id: 'W3',
    label: 'สัปดาห์ที่ 3 (15–21)',
    shortLabel: 'สัปดาห์ 3 (100%)',
    name: 'สัปดาห์ที่ 3 (วันที่ 15 – 21)',
    dayRange: 'วันที่ 15 – 21 ของเดือน',
    targetPercent: 100,
    depositPercent: 0,
    description: 'ยอดชำระครบ 100% ของค่าเช่าทั้งเดือน',
  },
  W4: {
    id: 'W4',
    label: 'สัปดาห์สุดท้าย (22+)',
    shortLabel: 'สัปดาห์ท้าย (+มัดจำ 25%)',
    name: 'สัปดาห์สุดท้าย (วันที่ 22 เป็นต้นไป)',
    dayRange: 'วันที่ 22 ถึงสิ้นเดือน',
    targetPercent: 100,
    depositPercent: 25,
    description: 'ชำระครบ 100% ของเดือนปัจจุบัน + เงินมัดจำต่อสัญญาเดือนถัดไป 25%',
  },
  ALL: {
    id: 'ALL',
    label: 'ค้างชำระทั้งหมด',
    shortLabel: 'ค้างทั้งหมด',
    name: 'ค้างชำระทั้งหมด (ทุกช่วงเวลา)',
    dayRange: 'ทุกช่วงเวลาของเดือน',
    targetPercent: 100,
    depositPercent: 0,
    description: 'รายการที่มีหนี้ค้างชำระคงเหลือทั้งหมด',
  }
};

/**
 * Auto-detects milestone from current calendar date.
 */
export function getCurrentMilestone(date = new Date()) {
  const day = date.getDate();
  if (day <= 7) return MILESTONES.W1;
  if (day <= 14) return MILESTONES.W2;
  if (day <= 21) return MILESTONES.W3;
  return MILESTONES.W4;
}

/**
 * Natural alphanumeric comparator for stall numbers (e.g. A1, A2, A9, A10, B1).
 */
export function compareStallNatural(stallA = '', stallB = '') {
  if (!stallA && !stallB) return 0;
  if (!stallA) return 1;
  if (!stallB) return -1;
  return stallA.localeCompare(stallB, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Calculates debt status and milestone targets for a single monthly contract.
 */
export function calculateContractDebtStatus(item, milestoneId = 'W1') {
  const totalPrice = parseNumber(item.total_price);
  const paidAmount = parseNumber(item.paid_amount || 0);
  const remainingDebt = Math.max(0, totalPrice - paidAmount);
  const paidPercent = totalPrice > 0 ? Math.min(100, Math.round((paidAmount / totalPrice) * 100)) : 100;

  const milestone = MILESTONES[milestoneId] || MILESTONES.W1;

  let targetAmount = 0;
  let shortfall = 0; // ยอดขั้นต่ำที่ต้องชำระเพิ่มตามเกณฑ์
  const isRenewalMilestone = milestone.id === 'W4';
  let renewalDeposit = 0;
  const isRenewing = item.renewal_status !== 'ไม่ต่อสัญญา';

  if (milestone.id === 'ALL') {
    targetAmount = totalPrice;
    shortfall = remainingDebt;
  } else if (milestone.id === 'W4') {
    // Current month must be 100% + 25% renewal deposit if renewing
    renewalDeposit = isRenewing ? Math.round(totalPrice * 0.25) : 0;
    targetAmount = totalPrice + renewalDeposit;
    shortfall = remainingDebt + renewalDeposit;
  } else {
    // W1 (50%), W2 (75%), W3 (100%)
    targetAmount = Math.round((totalPrice * milestone.targetPercent) / 100);
    shortfall = Math.max(0, targetAmount - paidAmount);
  }

  // Status classification
  let status = 'ON_TRACK'; // ชำระถึงเกณฑ์แล้ว
  if (shortfall > 0) {
    status = 'BEHIND_TARGET'; // ยังไม่ถึงเกณฑ์ (ต้องตามเก็บ)
  } else if (remainingDebt === 0 && (!isRenewalMilestone || renewalDeposit === 0)) {
    status = 'PAID_FULL'; // ปิดยอดครบ 100%
  }

  // Stall display & zone extraction
  const displayStalls = (() => {
    const rawStall = item.stalls || item.stall_name;
    if (rawStall) return cleanStallName(rawStall);
    if (item.stall_details) {
      try {
        const parsed = typeof item.stall_details === 'string' ? JSON.parse(item.stall_details) : item.stall_details;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed.map(s => cleanStallName(s.name || s.stall_name)).filter(Boolean);
          if (names.length > 0) return names.join(', ');
        }
      } catch (e) {}
    }
    return '-';
  })();

  const primaryStall = displayStalls.split(',')[0].trim();
  // Extract zone letter or prefix (e.g. "A12" -> "A", "ก5" -> "ก")
  const zoneMatch = primaryStall.match(/^([A-Za-zก-๙]+)/);
  const zone = zoneMatch ? zoneMatch[1].toUpperCase() : 'ทั่วไป';

  return {
    item,
    id: item.id,
    displayStalls,
    primaryStall,
    zone,
    bookerName: item.booker_name || item.customer_name || 'ไม่ระบุชื่อ',
    phone: item.phone || '',
    product: item.product || '-',
    bookingMonth: formatBookingMonth(item.booking_month),
    rawBookingMonth: item.booking_month,
    totalPrice,
    paidAmount,
    paidPercent,
    remainingDebt,
    targetPercent: milestone.targetPercent,
    targetAmount,
    shortfall,
    renewalDeposit,
    isRenewalMilestone,
    status,
    renewalStatus: item.renewal_status || 'ต่อสัญญา'
  };
}

/**
 * Filters and sorts the monthly bookings list based on user selections.
 */
export function filterAndSortDebtList({
  monthlyList = [],
  milestoneId = 'W1',
  selectedMonth = 'ทั้งหมด',
  statusFilter = 'BEHIND_TARGET', // 'BEHIND_TARGET' | 'ALL_OVERDUE' | 'PAID' | 'ALL'
  zoneFilter = 'ทั้งหมด',
  searchQuery = ''
}) {
  // Exclude cancelled bookings
  let activeList = (monthlyList || []).filter(item => item.status !== 'ยกเลิก');

  // Month filter
  if (selectedMonth && selectedMonth !== 'ทั้งหมด') {
    activeList = activeList.filter(item => formatBookingMonth(item.booking_month) === selectedMonth);
  }

  // Calculate debt and milestone status for each item
  let calculated = activeList.map(item => calculateContractDebtStatus(item, milestoneId));

  // Status Filter
  if (statusFilter === 'BEHIND_TARGET') {
    calculated = calculated.filter(row => row.shortfall > 0);
  } else if (statusFilter === 'ALL_OVERDUE') {
    calculated = calculated.filter(row => row.remainingDebt > 0);
  } else if (statusFilter === 'PAID') {
    calculated = calculated.filter(row => row.shortfall === 0);
  }

  // Zone Filter
  if (zoneFilter && zoneFilter !== 'ทั้งหมด') {
    calculated = calculated.filter(row => row.zone.toUpperCase() === zoneFilter.toUpperCase());
  }

  // Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    calculated = calculated.filter(row =>
      row.displayStalls.toLowerCase().includes(q) ||
      row.bookerName.toLowerCase().includes(q) ||
      row.phone.includes(q) ||
      row.product.toLowerCase().includes(q)
    );
  }

  // Sort by natural stall walk order (A1, A2, A3... A10, B1...)
  calculated.sort((a, b) => compareStallNatural(a.primaryStall, b.primaryStall));

  return calculated;
}

/**
 * Extracts distinct zones from a list of calculated debt items.
 */
export function extractDistinctZones(items = []) {
  const set = new Set();
  items.forEach(it => {
    if (it.zone && it.zone !== 'ทั่วไป') set.add(it.zone);
  });
  return Array.from(set).sort();
}

/**
 * Generates high-readability A4 HTML checklist document ready for printing.
 */
export function generateDebtFollowUpA4HTML({
  items = [],
  milestone = MILESTONES.W1,
  selectedMonth = 'ประจำเดือน',
  zoneFilter = 'ทั้งหมด',
  statusFilter = 'BEHIND_TARGET',
  adminUser = null
}) {
  const now = new Date();
  const printDateStr = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' เวลา ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

  const adminName = adminUser?.name || 'เจ้าหน้าที่ตลาด';

  const statusLabel = statusFilter === 'BEHIND_TARGET'
    ? 'เฉพาะที่ยังไม่ถึงเกณฑ์ (ต้องตามเก็บ)'
    : statusFilter === 'ALL_OVERDUE'
      ? 'ค้างชำระทั้งหมด'
      : statusFilter === 'PAID'
        ? 'ชำระครบตามเกณฑ์'
        : 'ทั้งหมด';

  // Build table rows
  const rowsHtml = items.map((row, idx) => {
    const isBehind = row.shortfall > 0;
    const shortfallDisplay = row.shortfall > 0
      ? `<span class="shortfall-badge">฿${formatPriceInt(row.shortfall)}</span>`
      : `<span class="paid-badge">✓ ครบเกณฑ์</span>`;

    const remainingDisplay = row.remainingDebt > 0
      ? `฿${formatPriceInt(row.remainingDebt)}`
      : `<span style="color:#2e7d32; font-weight:bold;">0 (ครบ)</span>`;

    const renewalTag = row.isRenewalMilestone && row.renewalDeposit > 0
      ? `<div class="renewal-note">+มัดจำต่อสัญญา ฿${formatPriceInt(row.renewalDeposit)}</div>`
      : '';

    const nonRenewTag = row.renewalStatus === 'ไม่ต่อสัญญา'
      ? `<div class="non-renewal-badge">แจ้งไม่ต่อสัญญา</div>`
      : '';

    return `
      <tr class="${idx % 2 === 1 ? 'row-alt' : ''}">
        <td class="col-num">${idx + 1}</td>
        <td class="col-stall">
          <div class="stall-badge">${row.displayStalls}</div>
        </td>
        <td class="col-tenant">
          <div class="tenant-name">${row.bookerName}</div>
          <div class="tenant-sub">
            ${row.phone ? `📞 ${row.phone}` : ''}
            ${row.product && row.product !== '-' ? ` • ${row.product}` : ''}
          </div>
          ${nonRenewTag}
        </td>
        <td class="col-price">฿${formatPriceInt(row.totalPrice)}</td>
        <td class="col-paid">
          <div>฿${formatPriceInt(row.paidAmount)}</div>
          <div class="percent-tag">(${row.paidPercent}%)</div>
        </td>
        <td class="col-shortfall ${isBehind ? 'highlight-cell' : ''}">
          ${shortfallDisplay}
          ${renewalTag}
        </td>
        <td class="col-debt">${remainingDisplay}</td>
        <td class="col-check">
          <div class="check-box-group">
            <div class="check-option">[ ] ชำระแล้ว (สลิป/สด)</div>
            <div class="check-option">[ ] นัดชำระ: ___/___/___</div>
          </div>
        </td>
        <td class="col-note">
          <div class="note-line"></div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบติดตามยอดค้างชำระ - ตลาดนัดลาดสวายวินเทจ</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 7mm 7mm 8mm 7mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Sarabun", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #1a1a1a;
            font-size: 11px;
            line-height: 1.35;
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
          
          /* Printable Report Header */
          .report-header {
            border-bottom: 2px solid #8b4513;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-title {
            font-size: 16px;
            font-weight: 900;
            color: #4a2e1b;
            letter-spacing: -0.2px;
          }
          .report-subtitle {
            font-size: 13px;
            font-weight: 700;
            color: #8b4513;
            margin-top: 2px;
          }
          .meta-info {
            text-align: right;
            font-size: 10px;
            color: #555;
            line-height: 1.4;
          }

          /* Main Checklist Table */
          table.checklist-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          table.checklist-table th {
            background: #4a2e1b;
            color: #ffffff;
            font-weight: 700;
            padding: 5px 4px;
            text-align: left;
            border: 1px solid #3d2312;
            font-size: 9.5px;
          }
          table.checklist-table td {
            padding: 4px 4px;
            border: 1px solid #d1d5db;
            vertical-align: middle;
          }
          tr.row-alt {
            background-color: #faf8f5;
          }
          
          .col-num { width: 22px; text-align: center; font-weight: bold; color: #6b7280; }
          .col-stall { width: 55px; text-align: center; }
          .col-tenant { width: 150px; }
          .col-price { width: 55px; text-align: right; font-weight: 600; }
          .col-paid { width: 62px; text-align: right; }
          .col-shortfall { width: 85px; text-align: right; }
          .col-debt { width: 60px; text-align: right; font-weight: 700; color: #dc2626; }
          .col-check { width: 140px; font-size: 9px; }
          .col-note { width: 100px; }

          .stall-badge {
            font-size: 11.5px;
            font-weight: 900;
            color: #8b4513;
            background: #fdf3e7;
            border: 1px solid #eed6be;
            border-radius: 4px;
            padding: 2px 4px;
            display: inline-block;
          }
          .tenant-name {
            font-weight: 700;
            color: #111827;
            font-size: 10.5px;
          }
          .tenant-sub {
            font-size: 9px;
            color: #6b7280;
            margin-top: 1px;
          }
          .percent-tag {
            font-size: 8.5px;
            color: #059669;
            font-weight: 600;
          }
          .shortfall-badge {
            font-size: 11px;
            font-weight: 900;
            color: #b91c1c;
            background: #fee2e2;
            padding: 2px 5px;
            border-radius: 3px;
            display: inline-block;
            border: 1px solid #fecaca;
          }
          .paid-badge {
            font-size: 9px;
            font-weight: 700;
            color: #15803d;
          }
          .renewal-note {
            font-size: 8px;
            color: #7c2d12;
            font-weight: 600;
            margin-top: 1px;
          }
          .non-renewal-badge {
            display: inline-block;
            font-size: 8px;
            color: #991b1b;
            background: #fee2e2;
            padding: 1px 4px;
            border-radius: 3px;
            font-weight: bold;
            margin-top: 1px;
          }
          .highlight-cell {
            background-color: #fff1f2 !important;
          }
          .check-box-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .check-option {
            color: #374151;
            font-family: monospace;
          }
          .note-line {
            border-bottom: 1px dotted #9ca3af;
            height: 14px;
            width: 100%;
          }

          /* Footer Sign-off */
          .signoff-section {
            margin-top: 12px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            page-break-inside: avoid;
          }
          .signoff-box {
            border: 1px dashed #9ca3af;
            border-radius: 5px;
            padding: 8px;
            text-align: center;
            font-size: 9.5px;
          }
          .signoff-line {
            margin-top: 25px;
            border-bottom: 1px solid #4b5563;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
          }
          .signoff-title {
            margin-top: 4px;
            font-weight: bold;
            color: #374151;
          }

          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div style="padding: 6px;">
          <!-- Header -->
          <div class="report-header">
            <div class="header-top">
              <div>
                <div class="brand-title">ตลาดนัดลาดสวายวินเทจ</div>
                <div class="report-subtitle">ใบตรวจติดตามยอดค้างชำระค่าเช่ารายเดือน (Ground Inspection Sheet)</div>
              </div>
              <div class="meta-info">
                <div><strong>รอบประจำเดือน:</strong> ${selectedMonth} | <strong>เกณฑ์:</strong> ${milestone.name}</div>
                <div><strong>โซน:</strong> ${zoneFilter} | <strong>สถานะ:</strong> ${statusLabel} (${items.length} ล็อค)</div>
                <div><strong>พิมพ์เมื่อ:</strong> ${printDateStr} | <strong>ผู้พิมพ์:</strong> ${adminName}</div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <table class="checklist-table">
            <thead>
              <tr>
                <th style="width: 22px; text-align: center;">#</th>
                <th style="width: 55px; text-align: center;">ล็อค</th>
                <th style="width: 150px;">ผู้เช่า / โทรศัพท์ / สินค้า</th>
                <th style="width: 55px; text-align: right;">ค่าเช่าเต็ม</th>
                <th style="width: 62px; text-align: right;">ชำระแล้ว (%)</th>
                <th style="width: 85px; text-align: right;">ยอดต้องเก็บเพิ่ม</th>
                <th style="width: 60px; text-align: right;">ค้างรวม</th>
                <th style="width: 140px;">ผลการตรวจเดินตลาด</th>
                <th style="width: 100px;">หมายเหตุ / ลายเซ็น</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#6b7280;">ไม่พบข้อมูลรายการที่ตรงตามเงื่อนไขที่เลือก</td></tr>`}
            </tbody>
          </table>

          <!-- Sign-off Block -->
          <div class="signoff-section">
            <div class="signoff-box">
              <div class="signoff-line"></div>
              <div class="signoff-title">เจ้าหน้าที่ตรวจเดินตลาด</div>
              <div style="font-size: 8.5px; color:#6b7280; margin-top:2px;">(......................................................)</div>
              <div style="font-size: 8.5px; color:#6b7280; margin-top:2px;">วันที่: _____/_____/_________</div>
            </div>
            <div class="signoff-box">
              <div class="signoff-line"></div>
              <div class="signoff-title">เจ้าหน้าที่รับชำระเงิน / การเงิน</div>
              <div style="font-size: 8.5px; color:#6b7280; margin-top:2px;">(......................................................)</div>
              <div style="font-size: 8.5px; color:#6b7280; margin-top:2px;">วันที่: _____/_____/_________</div>
            </div>
            <div class="signoff-box">
              <div class="signoff-line"></div>
              <div class="signoff-title">ผู้จัดการตลาดนัดลาดสวายวินเทจ</div>
              <div style="font-size: 8.5px; color:#6b7280; margin-top:2px;">(......................................................)</div>
              <div style="font-size: 8.5px; color:#6b7280; margin-top:2px;">วันที่: _____/_____/_________</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Prints the A4 debt follow-up checklist directly using a hidden iframe.
 * This completely avoids window.open / popup-blockers and eliminates
 * the Arc/Chromium/PWA "This page couldn't load" crash screen.
 */
export function printDebtFollowUpA4(htmlContent) {
  if (typeof window === 'undefined') return;

  try {
    // Remove any existing print iframe
    const existing = document.getElementById('debt-followup-print-frame');
    if (existing) {
      try { existing.remove(); } catch (e) {}
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'debt-followup-print-frame';
    iframe.setAttribute('style', 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give browser time to parse CSS and fonts, then trigger native print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Error invoking iframe.contentWindow.print():', err);
      } finally {
        // Clean up iframe after print dialog completes
        setTimeout(() => {
          try {
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          } catch (e) {}
        }, 10000);
      }
    }, 250);
  } catch (err) {
    console.error('Print iframe creation failed:', err);
    alert('เกิดข้อผิดพลาดในการสั่งพิมพ์ กรุณาลองใหม่อีกครั้ง');
  }
}
