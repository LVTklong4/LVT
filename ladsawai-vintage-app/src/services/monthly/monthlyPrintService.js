import { formatPrice, formatPriceInt, parseNumber } from '@/utils/numberHelper';
import { monthNamesFull, formatBookingMonth } from '@/utils/thaiDateHelper';
import { calculateStallDayPrice } from './monthlyPricingService';

/**
 * Counts occurrences of a specific day of week within the contract's month range.
 */
export function getDayOccurrences(startDateStr, dayOfWeek, daysActive) {
  if (!daysActive || !daysActive.includes(dayOfWeek)) return 0;
  const startD = new Date(startDateStr);
  const year = startD.getFullYear();
  const monthVal = startD.getMonth();
  const lastDay = new Date(year, monthVal + 1, 0).getDate();
  let count = 0;
  for (let d = startD.getDate(); d <= lastDay; d++) {
    const currentD = new Date(year, monthVal, d);
    if (currentD.getDay() === dayOfWeek) count++;
  }
  return count;
}

/**
 * Builds HTML document for 80mm thermal receipt printing.
 */
export function generateMonthlyReceiptHTML({
  item,
  stalls = [],
  adminUser = null,
  activeMonthlyTransactions = [],
  customCounts = null // { satCount, sunCount, wedCount, month, product, txnNo, payments }
}) {
  if (!item) return '';

  let details = [];
  try {
    details = JSON.parse(item.stall_details || '[]');
  } catch (e) {}

  const isFullPackage = item.selected_days?.toLowerCase().includes('wed') &&
                        item.selected_days?.toLowerCase().includes('sat') &&
                        item.selected_days?.toLowerCase().includes('sun');

  const elecRate = item.elec_unit !== undefined && item.elec_unit !== null
    ? parseNumber(item.elec_unit) * 10
    : 20;

  const dayGroups = { 3: [], 6: [], 0: [] };

  details.forEach((stallDetail) => {
    const stallName = stallDetail.name;
    const sMaster = stalls.find(s => s.name === stallName);
    if (!sMaster) return;

    const stallDays = Array.isArray(stallDetail.days) ? stallDetail.days : [];
    [3, 6, 0].forEach((dNum) => {
      if (stallDays.includes(dNum)) {
        const price = calculateStallDayPrice(sMaster, dNum, item.customer_type, isFullPackage);
        dayGroups[dNum].push({ name: stallName, price });
      }
    });
  });

  const now = new Date();
  const formattedTransaction = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

  const empCode = adminUser?.employee_id || adminUser?.name || 'lvt-admin';

  let invoiceMonth = customCounts?.month || formatBookingMonth(item.booking_month);
  if (invoiceMonth === '-') {
    const thaiMonth = monthNamesFull[now.getMonth()];
    const thaiYear = now.getFullYear() + 543;
    invoiceMonth = `${thaiMonth} ${thaiYear}`;
  }

  const activeDays = [];
  if (item.selected_days?.toLowerCase().includes('wed')) activeDays.push(3);
  if (item.selected_days?.toLowerCase().includes('sat')) activeDays.push(6);
  if (item.selected_days?.toLowerCase().includes('sun')) activeDays.push(0);

  const satCount = customCounts ? customCounts.satCount : getDayOccurrences(item.start_date, 6, activeDays);
  const sunCount = customCounts ? customCounts.sunCount : getDayOccurrences(item.start_date, 0, activeDays);
  const wedCount = customCounts ? customCounts.wedCount : getDayOccurrences(item.start_date, 3, activeDays);

  let dayDetailsHtml = '';
  const cleanStall = (name) => (name || '').replace(/[\[\]]/g, '').trim();

  if (satCount > 0 && dayGroups[6].length > 0) {
    const satStalls = dayGroups[6].map(x => cleanStall(x.name)).join(', ');
    const satStallPrice = dayGroups[6].reduce((sum, x) => sum + x.price, 0);
    const satTotal = (satStallPrice + elecRate) * satCount;
    dayDetailsHtml += `
      <tr>
        <td class="bold">วันเสาร์ ล็อค : ${satStalls}</td>
        <td class="val" style="text-align: right;">${formatPrice(satTotal)}</td>
      </tr>
      <tr class="calc-row">
        <td>(${formatPriceInt(satStallPrice)} x ${satCount}) + (${formatPriceInt(elecRate)} x ${satCount})</td>
        <td></td>
      </tr>
    `;
  }
  if (sunCount > 0 && dayGroups[0].length > 0) {
    const sunStalls = dayGroups[0].map(x => cleanStall(x.name)).join(', ');
    const sunStallPrice = dayGroups[0].reduce((sum, x) => sum + x.price, 0);
    const sunTotal = (sunStallPrice + elecRate) * sunCount;
    dayDetailsHtml += `
      <tr>
        <td class="bold">วันอาทิตย์ ล็อค : ${sunStalls}</td>
        <td class="val" style="text-align: right;">${formatPrice(sunTotal)}</td>
      </tr>
      <tr class="calc-row">
        <td>(${formatPriceInt(sunStallPrice)} x ${sunCount}) + (${formatPriceInt(elecRate)} x ${sunCount})</td>
        <td></td>
      </tr>
    `;
  }
  if (wedCount > 0 && dayGroups[3].length > 0) {
    const wedStalls = dayGroups[3].map(x => cleanStall(x.name)).join(', ');
    const wedStallPrice = dayGroups[3].reduce((sum, x) => sum + x.price, 0);
    const wedTotal = (wedStallPrice + elecRate) * wedCount;
    dayDetailsHtml += `
      <tr>
        <td class="bold">วันพุธ ล็อค : ${wedStalls}</td>
        <td class="val" style="text-align: right;">${formatPrice(wedTotal)}</td>
      </tr>
      <tr class="calc-row">
        <td>(${formatPriceInt(wedStallPrice)} x ${wedCount}) + (${formatPriceInt(elecRate)} x ${wedCount})</td>
        <td></td>
      </tr>
    `;
  }

  let paymentsHtml = '';
  let totalPaidFromPayments = 0;
  const txns = customCounts?.payments || (activeMonthlyTransactions?.length > 0 ? activeMonthlyTransactions : []);

  if (txns.length > 0) {
    txns.forEach(p => {
      const amt = parseNumber(p.total_amount || p.amount);
      totalPaidFromPayments += amt;
      const pDate = p.timestamp ? new Date(p.timestamp) : now;
      const pDateStr = pDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
      paymentsHtml += `
        <tr>
          <td>${pDateStr}</td>
          <td style="text-align: center;">${p.method || 'โอนจ่าย'}</td>
          <td style="text-align: right;" class="bold">${formatPrice(amt)}</td>
        </tr>
      `;
    });
  } else if (item.paid_amount > 0) {
    const todayStr = now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
    totalPaidFromPayments = parseNumber(item.paid_amount);
    paymentsHtml += `
      <tr>
        <td>${todayStr}</td>
        <td style="text-align: center;">โอนจ่าย</td>
        <td style="text-align: right;" class="bold">${formatPrice(totalPaidFromPayments)}</td>
      </tr>
    `;
  }

  const grandTotal = parseNumber(item.total_price);
  const percentage = grandTotal > 0 ? Math.round((totalPaidFromPayments / grandTotal) * 100) : 0;
  const remaining = grandTotal - totalPaidFromPayments;
  const txnNo = customCounts?.txnNo || item.receipt_no || `TXN-${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
  const productName = customCounts?.product || item.product || 'ของชำทั่วไป';

  return `
    <html>
      <head>
        <title>พิมพ์ตั๋ว/ใบเสร็จ (รายเดือน)</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Sarabun', sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            background: #fff;
            color: #000;
            font-size: 11pt;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .logo { width: 32mm; height: auto; margin: 0 auto 2mm auto; display: block; }
          .divider { border-top: 1.5px dashed #000; margin: 3mm 0; }
          .title { font-size: 13pt; font-weight: 800; margin: 2mm 0 1mm 0; }
          .subtitle { font-size: 9.5pt; font-weight: bold; color: #000; }
          .info-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          .info-table td { padding: 1.2mm 0; vertical-align: top; font-size: 10.5pt; }
          .info-table td.label { width: 32%; white-space: nowrap; }
          .info-table td.val { text-align: right; font-weight: bold; }
          .price-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          .price-table td { padding: 1.2mm 0; font-size: 10.5pt; }
          .price-table td.val { text-align: right; font-weight: bold; }
          .calc-row td { font-size: 9.5pt; color: #333; padding-top: 0 !important; padding-bottom: 2mm !important; }
          .payment-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          .payment-table th { border-bottom: 1px dashed #000; padding: 1.5mm 0; font-size: 10pt; font-weight: bold; }
          .payment-table td { padding: 1.5mm 0; font-size: 10pt; }
          .total-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          .total-table td { padding: 1.2mm 0; }
          .total-table td.label { text-align: right; font-size: 11pt; font-weight: bold; padding-right: 2mm; }
          .total-table td.val { text-align: right; font-size: 11.5pt; font-weight: bold; }
          .grand-total-row td { padding-top: 2mm; }
          .grand-total-row td.label { font-size: 11.5pt; font-weight: 800; }
          .grand-total-row td.val { font-size: 13pt; font-weight: 800; }
          .remaining-row td { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding-top: 2.5mm !important; padding-bottom: 2.5mm !important; }
          .remaining-row td.label { text-align: right; font-size: 11.5pt; font-weight: 800; padding-right: 2mm; }
          .remaining-row td.val { text-align: right; font-size: 13pt; font-weight: 800; }
          .info-table td.large-val { text-align: right; font-size: 12.5pt; font-weight: 800; }
          .footer { margin-top: 4mm; font-size: 9.5pt; text-align: center; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="center">
          <img class="logo" src="/logo.png" alt="Logo" />
          <div class="title">ตลาดนัดลาดสวายวินเทจ</div>
          <div class="subtitle">เลขที่ 52/34 หมู่ 5 ต.ลาดสวาย อ.ลำลูกกา จ.ปทุมธานี 12150</div>
          <div class="subtitle">โทร: 0-92-869-7774 , 0-92-869-7775</div>
        </div>
        <div class="divider"></div>
        <div class="center bold" style="font-size: 12pt; margin-bottom: 2mm;">ตั๋ว/ใบเสร็จ (รายเดือน)</div>
        <table class="info-table">
          <tr><td class="label">เลขที่ :</td><td style="text-align: right; font-family: monospace; font-size: 9.5pt;">${txnNo}</td></tr>
          <tr><td class="label">วันที่ทำรายการ :</td><td style="text-align: right;">${formattedTransaction}</td></tr>
          <tr><td class="label">รหัสพนักงาน :</td><td style="text-align: right; font-family: monospace; font-size: 9pt;">${empCode}</td></tr>
          <tr><td class="label">ประจำเดือน :</td><td class="large-val">${invoiceMonth}</td></tr>
          <tr><td class="label">ผู้จอง :</td><td class="large-val">${item.booker_name}</td></tr>
          <tr><td class="label">สินค้า :</td><td class="large-val">${productName}</td></tr>
        </table>
        <div class="divider"></div>
        <table class="price-table">${dayDetailsHtml}</table>
        <div class="divider"></div>
        <table class="payment-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 35%;">วันชำระ</th>
              <th style="text-align: center; width: 30%;">ช่องทางชำระ</th>
              <th style="text-align: right; width: 35%;">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>${paymentsHtml}</tbody>
        </table>
        <div class="divider"></div>
        <table class="total-table">
          <tr class="grand-total-row"><td class="label">รวมเป็นเงินทั้งสิ้น :</td><td class="val">${formatPrice(grandTotal)}</td></tr>
          <tr><td class="label" style="border-top: 1px dashed #000; padding-top: 1.5mm;">ชำระแล้วรวมทั้งสิ้น :</td><td class="val" style="border-top: 1px dashed #000; padding-top: 1.5mm;">${formatPrice(totalPaidFromPayments)}</td></tr>
          <tr><td class="label">คิดเป็นเปอร์เซ็นต์ :</td><td class="val">${percentage}%</td></tr>
          <tr class="remaining-row"><td class="label">ค้างชำระ/คงเหลือ :</td><td class="val">${formatPrice(remaining)}</td></tr>
        </table>
        <div class="divider"></div>
        <div class="footer">
          <div class="bold">สอบถามค่าล็อค ส่งสลิป ได้ที่</div>
          <div class="bold" style="margin-top: 1mm; font-size: 10.5pt;">@ladsawaivintage</div>
          <div style="font-size: 8pt; color: #555; margin-top: 3mm;">Power by PJMJK</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;
}

/**
 * Opens a print window and renders the thermal receipt HTML.
 */
export function printReceiptInWindow(htmlContent) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) {
    alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์ใบเสร็จ');
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
