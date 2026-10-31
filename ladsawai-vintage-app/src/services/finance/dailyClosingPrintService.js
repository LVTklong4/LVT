import { parseNumber } from '@/utils/numberHelper';

/**
 * Generates standalone A4 HTML document for Daily Cash Settlement & Remittance Form.
 * Designed for crisp single-page A4 printing without layout bleed, background interference, or multi-page spill.
 */
export function generateDailyClosingRemittanceHTML({
  summary,
  selectedDate,
  floatVal = 0,
  cashIn = 0,
  cashOut = 0,
  expectedCashInDrawer = 0,
  countedCashVal = null,
  shortageSurplus = 0,
  denominations = {},
  discrepancyNote = '',
  officerName = 'Admin'
}) {
  if (!summary) return '';

  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const fmt = (n) => (n ?? 0).toLocaleString();

  // Denominations list
  const denomRows = [
    { label: 'ธนบัตร 1,000 บาท', count: denominations.b1000, mult: 1000 },
    { label: 'ธนบัตร 500 บาท', count: denominations.b500, mult: 500 },
    { label: 'ธนบัตร 100 บาท', count: denominations.b100, mult: 100 },
    { label: 'ธนบัตร 50 บาท', count: denominations.b50, mult: 50 },
    { label: 'ธนบัตร 20 บาท', count: denominations.b20, mult: 20 },
    { label: 'เหรียญกษาปณ์รวม', count: '-', amt: parseNum(denominations.coins) }
  ];

  const bookedStalls = summary.occupancy?.booked || 0;
  const availableStalls = summary.occupancy?.available ?? (275 - bookedStalls);
  const transferTxnCount = summary.transferTxnCount || 0;
  const transferTotal = summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0;

  const docNo = `CLS-${selectedDate ? selectedDate.split('-').join('') : ''}`;
  const recordedBy = summary?.existingClosing?.closed_by || officerName || 'Admin';
  const printTimestamp = new Date().toLocaleString('th-TH');

  // Revenue items
  const dailyStallCash = summary.breakdown?.dailyStall?.cash ?? 0;
  const dailyStallTransfer = summary.breakdown?.dailyStall?.transfer ?? 0;
  const dailyStallTotal = summary.breakdown?.dailyStall?.total ?? summary.dailyStallIncome ?? 0;

  const monthlyCash = summary.breakdown?.monthly?.cash ?? 0;
  const monthlyTransfer = summary.breakdown?.monthly?.transfer ?? 0;
  const monthlyTotal = summary.breakdown?.monthly?.total ?? summary.monthlyIncome ?? 0;

  const klongthomCash = summary.breakdown?.klongthom?.cash ?? 0;
  const klongthomTransfer = summary.breakdown?.klongthom?.transfer ?? 0;
  const klongthomTotal = summary.breakdown?.klongthom?.total ?? summary.klongthomIncome ?? 0;

  const storageCash = summary.breakdown?.storage?.cash ?? 0;
  const storageTransfer = summary.breakdown?.storage?.transfer ?? 0;
  const storageTotal = summary.breakdown?.storage?.total ?? summary.storageIncome ?? 0;

  const otherCash = summary.breakdown?.otherIncome?.cash ?? 0;
  const otherTransfer = summary.breakdown?.otherIncome?.transfer ?? 0;
  const otherTotal = summary.breakdown?.otherIncome?.total ?? summary.otherIncome ?? 0;

  const grossCash = summary.breakdown?.totalIncome?.cash ?? summary.cashIn ?? 0;
  const grossTransfer = summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0;
  const grossTotal = summary.breakdown?.totalIncome?.total ?? summary.totalIncome ?? 0;

  const expenseCash = summary.breakdown?.expenses?.cash ?? summary.cashOut ?? 0;
  const expenseTransfer = summary.breakdown?.expenses?.transfer ?? summary.transferOut ?? 0;
  const expenseTotal = summary.breakdown?.expenses?.total ?? summary.totalExpenses ?? 0;

  const netCash = summary.cashIn - summary.cashOut;
  const netTransfer = summary.transferIn - summary.transferOut;
  const netTotal = netCash + netTransfer;

  // Expenses table rows
  const expenseItems = summary.expenseItems || [];
  let expenseRowsHtml = '';
  if (expenseItems.length > 0) {
    expenseRowsHtml = expenseItems.map((exp, idx) => `
      <tr>
        <td style="text-align:center; color:#555;">${idx + 1}</td>
        <td>${exp.description || '-'}</td>
        <td>${exp.category || '-'}</td>
        <td style="text-align:center; font-weight:bold;">${exp.method || '-'}</td>
        <td style="text-align:right; font-family:monospace; color:#dc2626; font-weight:bold;">-${fmt(exp.amount)} ฿</td>
      </tr>
    `).join('');
  }

  // Carry forward row if applicable
  const carryForwardHtml = summary.carryForward && summary.carryForward.total !== 0 ? `
    <tr style="background:#fffbeb; color:#78350f;">
      <td style="font-weight:600;">6. ยกยอดรายรับที่ค้างปิดยอดสะสม (Unclosed Carry-Forward)</td>
      <td style="text-align:right; font-family:monospace; font-weight:600;">${fmt(summary.carryForward.cash)} ฿</td>
      <td style="text-align:right; font-family:monospace; font-weight:600;">${fmt(summary.carryForward.transfer)} ฿</td>
      <td style="text-align:right; font-family:monospace; font-weight:bold;">${fmt(summary.carryForward.total)} ฿</td>
    </tr>
  ` : '';

  // Denominations rows HTML
  const denomRowsHtml = denomRows.map((row) => {
    const amt = row.amt !== undefined ? row.amt : (parseNum(row.count) * row.mult) || 0;
    const countDisplay = row.count !== '-' ? (row.count || '-') : '-';
    return `
      <tr>
        <td>${row.label}</td>
        <td style="text-align:center; font-family:monospace;">${countDisplay}</td>
        <td style="text-align:right; font-family:monospace; font-weight:600;">${fmt(amt)} ฿</td>
      </tr>
    `;
  }).join('');

  const shortageSurplusColor = shortageSurplus === 0 ? '#065f46' : shortageSurplus < 0 ? '#b91c1c' : '#1d4ed8';
  const shortageSurplusPrefix = shortageSurplus > 0 ? '+' : '';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบนำส่งเงินและสรุปการปิดยอด - ${selectedDate}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Sarabun', 'Prompt', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      line-height: 1.25;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      width: 100%;
      max-width: 194mm;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }
    .title-h1 {
      font-size: 13pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .title-h2 {
      font-size: 9pt;
      font-weight: 700;
      color: #111;
      margin-top: 1px;
    }
    .title-sub {
      font-size: 7.5pt;
      color: #555;
      margin-top: 1px;
    }
    .header-meta {
      text-align: right;
      font-size: 7.5pt;
      line-height: 1.35;
    }
    .header-meta strong {
      font-weight: 700;
      color: #333;
    }
    .header-meta .date-val {
      font-size: 9pt;
      font-weight: 900;
      color: #000;
    }
    
    /* Stat Strip */
    .stat-strip {
      background: #f3f4f6;
      border: 1px solid #9ca3af;
      border-radius: 4px;
      padding: 3px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      margin-bottom: 5px;
    }

    /* Section titles */
    .section-title {
      font-size: 8.5pt;
      font-weight: 900;
      border-bottom: 1.5px solid #000;
      padding-bottom: 1.5px;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-unit {
      font-size: 7pt;
      font-weight: 500;
      color: #555;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #6b7280;
      font-size: 8pt;
      margin-bottom: 4px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 2px 5px;
      vertical-align: middle;
    }
    th {
      background: #e5e7eb;
      font-weight: 700;
      color: #111;
      border-bottom: 1.5px solid #6b7280;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace, Courier, monospace; }
    .bold { font-weight: 700; }
    .bolder { font-weight: 900; }

    /* Highlights */
    .row-total {
      background: #f3f4f6;
      font-weight: 900;
      border-top: 1.5px solid #374151;
      border-bottom: 1.5px solid #374151;
    }
    .row-expense {
      background: #fef2f2;
      color: #991b1b;
      font-weight: 700;
      border-bottom: 1.5px solid #000;
    }
    .row-net {
      background: #ecfdf5;
      font-weight: 900;
      border-bottom: 2px solid #000;
    }

    /* 2 Columns Section */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 4px;
    }

    /* Note */
    .note-box {
      border: 1px solid #fcd34d;
      background: #fffbeb;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      margin-bottom: 4px;
    }

    /* Sign-off */
    .signoff-section {
      border-top: 1.5px solid #000;
      padding-top: 4px;
      margin-top: 4px;
      page-break-inside: avoid;
    }
    .signoff-heading {
      font-size: 8pt;
      font-weight: 900;
      text-align: center;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }
    .signoff-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      text-align: center;
    }
    .signoff-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .signoff-role {
      font-size: 8pt;
      font-weight: 700;
      color: #111;
    }
    .signoff-sub {
      font-size: 7pt;
      color: #555;
    }
    .signoff-line {
      width: 130px;
      border-bottom: 1.5px dotted #555;
      margin: 14px auto 3px auto;
    }
    .signoff-name {
      font-size: 7.5pt;
      color: #333;
    }
    .signoff-date {
      font-size: 7pt;
      color: #555;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <img src="/logo.png" alt="Logo" class="logo" />
        <div>
          <div class="title-h1">ตลาดนัดลาดสวายวินเทจ</div>
          <div class="title-h2">ใบนำส่งเงินและสรุปการปิดยอดประจำวัน (Daily Cash Settlement & Remittance Form)</div>
          <div class="title-sub">ระบบควบคุมการเงินและการตรวจนับเงินสดประจำวัน (Dual Control Remittance)</div>
        </div>
      </div>
      <div class="header-meta">
        <div><strong>วันที่ปิดยอด:</strong> <span class="date-val">${selectedDate}</span></div>
        <div><strong>เลขที่เอกสาร:</strong> <span class="font-mono">${docNo}</span></div>
        <div><strong>ผู้บันทึก:</strong> <span>${recordedBy}</span></div>
        <div style="color: #6b7280; font-size: 7pt;">พิมพ์เมื่อ: ${printTimestamp}</div>
      </div>
    </div>

    <!-- Stat Strip -->
    <div class="stat-strip">
      <div>
        <strong>สถิติแผงค้า:</strong>
        <span>แผงทั้งหมด <strong>275</strong> แผง</span> |
        <span>จอง/เปิดใช้งาน <strong>${bookedStalls}</strong> แผง</span> |
        <span>แผงว่าง <strong>${availableStalls}</strong> แผง</span>
      </div>
      <div>
        <strong>เงินโอนเข้าบัญชี:</strong>
        <span><strong style="color:#1e3a8a;">${transferTxnCount}</strong> รายการ</span>
        <span>(รวม <strong style="color:#1e3a8a;" class="font-mono">${fmt(transferTotal)} ฿</strong>)</span>
      </div>
    </div>

    <!-- 1. Daily Revenues -->
    <div class="section-title">
      <span>1. สรุปรายรับแยกตามประเภท (Daily Revenues)</span>
      <span class="section-unit">หน่วย: บาท (THB)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>หมวดหมู่รายการ</th>
          <th style="width: 25%;" class="text-right">เงินสด (บาท)</th>
          <th style="width: 25%;" class="text-right">โอนเงิน (บาท)</th>
          <th style="width: 26%;" class="text-right">ยอดรวมสุทธิ (บาท)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. ค่าจองแผงรายวัน (Daily Stalls)</td>
          <td class="text-right font-mono">${fmt(dailyStallCash)} ฿</td>
          <td class="text-right font-mono">${fmt(dailyStallTransfer)} ฿</td>
          <td class="text-right font-mono bold">${fmt(dailyStallTotal)} ฿</td>
        </tr>
        <tr>
          <td>2. ค่างวดรายเดือน (ชำระในวัน)</td>
          <td class="text-right font-mono">${fmt(monthlyCash)} ฿</td>
          <td class="text-right font-mono">${fmt(monthlyTransfer)} ฿</td>
          <td class="text-right font-mono bold">${fmt(monthlyTotal)} ฿</td>
        </tr>
        <tr>
          <td>3. บัตรตั๋ว & ค่าไฟคลองถม</td>
          <td class="text-right font-mono">${fmt(klongthomCash)} ฿</td>
          <td class="text-right font-mono">${fmt(klongthomTransfer)} ฿</td>
          <td class="text-right font-mono bold">${fmt(klongthomTotal)} ฿</td>
        </tr>
        <tr>
          <td>4. ค่าบริการฝากของ (Storage)</td>
          <td class="text-right font-mono">${fmt(storageCash)} ฿</td>
          <td class="text-right font-mono">${fmt(storageTransfer)} ฿</td>
          <td class="text-right font-mono bold">${fmt(storageTotal)} ฿</td>
        </tr>
        <tr>
          <td>5. รายรับอื่นๆ (Other Income)</td>
          <td class="text-right font-mono">${fmt(otherCash)} ฿</td>
          <td class="text-right font-mono">${fmt(otherTransfer)} ฿</td>
          <td class="text-right font-mono bold">${fmt(otherTotal)} ฿</td>
        </tr>
        ${carryForwardHtml}
        <tr class="row-total">
          <td>รวมรายรับทั้งหมด (Gross Revenue)</td>
          <td class="text-right font-mono bold" style="color: #15803d;">${fmt(grossCash)} ฿</td>
          <td class="text-right font-mono bold" style="color: #1d4ed8;">${fmt(grossTransfer)} ฿</td>
          <td class="text-right font-mono bolder">${fmt(grossTotal)} ฿</td>
        </tr>
        <tr class="row-expense">
          <td>หัก: รายจ่ายประจำวัน (Total Expenses)</td>
          <td class="text-right font-mono">-${fmt(expenseCash)} ฿</td>
          <td class="text-right font-mono">-${fmt(expenseTransfer)} ฿</td>
          <td class="text-right font-mono bolder">-${fmt(expenseTotal)} ฿</td>
        </tr>
        <tr class="row-net">
          <td class="bolder">รายรับสุทธิประจำวัน (Net Daily Inflow)</td>
          <td class="text-right font-mono bolder" style="color: #065f46;">${fmt(netCash)} ฿</td>
          <td class="text-right font-mono bolder" style="color: #1e40af;">${fmt(netTransfer)} ฿</td>
          <td class="text-right font-mono bolder" style="font-size: 9pt;">${fmt(netTotal)} ฿</td>
        </tr>
      </tbody>
    </table>

    <!-- 2. Cash Reconciliation & Denominations (2 Columns) -->
    <div class="section-title">
      <span>2. การกระทบยอดเงินสดและการตรวจนับ (Cash Reconciliation & Denomination Count)</span>
    </div>
    <div class="grid-2">
      <!-- Col 1: Reconciliation -->
      <table>
        <tbody>
          <tr>
            <td style="background:#f9fafb; font-weight:bold;">เงินทอนเริ่มต้น (Opening Float)</td>
            <td class="text-right font-mono bold">${fmt(floatVal)} ฿</td>
          </tr>
          <tr>
            <td style="background:#f9fafb; font-weight:bold;">เงินสดรับรวม (Cash In)</td>
            <td class="text-right font-mono bold" style="color:#15803d;">+${fmt(cashIn)} ฿</td>
          </tr>
          <tr>
            <td style="background:#f9fafb; font-weight:bold;">เงินสดจ่ายรวม (Cash Out)</td>
            <td class="text-right font-mono bold" style="color:#b91c1c;">-${fmt(cashOut)} ฿</td>
          </tr>
          <tr style="background:#f3f4f6; font-weight:bold; border-top:1.5px solid #4b5563; border-bottom:1.5px solid #4b5563;">
            <td>เงินสดที่ควรมีในลิ้นชัก (Expected Cash)</td>
            <td class="text-right font-mono bolder" style="font-size:8.5pt;">${fmt(expectedCashInDrawer)} ฿</td>
          </tr>
          <tr style="background:#ecfdf5; font-weight:bold; border-bottom:1.5px solid #000;">
            <td>ยอดเงินสดนับนำส่งจริง (Counted Cash Remitted)</td>
            <td class="text-right font-mono bolder" style="font-size:8.5pt; color:#065f46;">${countedCashVal !== null ? fmt(countedCashVal) : '0'} ฿</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">ผลต่างเงินขาด / เงินเกิน (Shortage/Surplus)</td>
            <td class="text-right font-mono bolder" style="color:${shortageSurplusColor};">
              ${shortageSurplusPrefix}${fmt(shortageSurplus)} ฿
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Col 2: Denominations -->
      <table>
        <thead>
          <tr>
            <th>ชนิดธนบัตร / เหรียญ</th>
            <th style="width: 20%;" class="text-center">จำนวน</th>
            <th style="width: 38%;" class="text-right">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          ${denomRowsHtml}
          <tr style="background:#f3f4f6; font-weight:bold; border-top:1.5px solid #000;">
            <td colspan="2" class="text-right bolder">รวมเงินสดตรวจนับได้จริง</td>
            <td class="text-right font-mono bolder" style="color:#065f46;">${countedCashVal !== null ? fmt(countedCashVal) : '0'} ฿</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. Expenses List -->
    <div class="section-title">
      <span>3. รายการแจกแจงรายจ่ายประจำวัน (Daily Expense Itemization)</span>
      <span class="section-unit">${expenseItems.length > 0 ? `${expenseItems.length} รายการ` : 'ไม่มีรายการ'}</span>
    </div>
    ${expenseItems.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 6%;" class="text-center">#</th>
            <th>รายการ / คำอธิบายรายจ่าย</th>
            <th style="width: 25%;">หมวดหมู่</th>
            <th style="width: 18%;" class="text-center">ช่องทางจ่าย</th>
            <th style="width: 22%;" class="text-right">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRowsHtml}
          <tr style="background:#f3f4f6; font-weight:bold; border-top:1.5px solid #000;">
            <td colspan="4" class="text-right bolder">รวมรายจ่ายทั้งสิ้น (Total Expenses)</td>
            <td class="text-right font-mono bolder" style="color:#b91c1c;">-${fmt(summary.totalExpenses)} ฿</td>
          </tr>
        </tbody>
      </table>
    ` : `
      <div style="border:1px solid #d1d5db; padding:4px; text-align:center; color:#6b7280; font-style:italic; background:#f9fafb; font-size:7.5pt; margin-bottom:4px; border-radius:3px;">
        — ไม่มีรายการรายจ่ายในวันที่เลือก —
      </div>
    `}

    <!-- Discrepancy Note (if any) -->
    ${discrepancyNote ? `
      <div class="note-box">
        <strong>หมายเหตุ / เหตุผลเงินขาด-เกิน: </strong>
        <span>${discrepancyNote}</span>
      </div>
    ` : ''}

    <!-- 4. Sign-off Dual Control Chain -->
    <div class="signoff-section">
      <div class="signoff-heading">การลงนามรับรองความถูกต้อง (SIGN-OFF & DUAL CONTROL CHAIN)</div>
      <div class="signoff-grid">
        <div class="signoff-box">
          <div class="signoff-role">1. เจ้าหน้าที่ผู้นำส่งเงิน</div>
          <div class="signoff-sub">(ผู้จัดทำ / Cashier)</div>
          <div class="signoff-line"></div>
          <div class="signoff-name">( ................................................................ )</div>
          <div class="signoff-date">วันที่ .......... / .......... / ................</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-role">2. ฝ่ายการเงิน / บัญชี</div>
          <div class="signoff-sub">(ผู้ตรวจนับรับเงินสด / Receiver)</div>
          <div class="signoff-line"></div>
          <div class="signoff-name">( ................................................................ )</div>
          <div class="signoff-date">วันที่ .......... / .......... / ................</div>
        </div>
        <div class="signoff-box">
          <div class="signoff-role">3. ผู้ตรวจสอบ / ผู้จัดการตลาด</div>
          <div class="signoff-sub">(ผู้อนุมัติ / Approved by)</div>
          <div class="signoff-line"></div>
          <div class="signoff-name">( ................................................................ )</div>
          <div class="signoff-date">วันที่ .......... / .......... / ................</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints the A4 Daily Remittance slip using a hidden iframe.
 * Completely isolates the printed document from the main DOM, preventing
 * stall map bleed, footer overlaps, and browser popup crashes.
 */
export function printDailyRemittanceA4(htmlContent) {
  if (typeof window === 'undefined') return;

  try {
    const existing = document.getElementById('daily-remittance-print-frame');
    if (existing) {
      try { existing.remove(); } catch (e) {}
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'daily-remittance-print-frame';
    iframe.setAttribute('style', 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Error invoking iframe.contentWindow.print():', err);
      } finally {
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
