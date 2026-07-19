import { dayNamesShort, monthNamesFull } from './thaiDateHelper';

export const printOffGridReceipt = (bookingObj, adminUser) => {
  if (!bookingObj) return;

  const now = new Date();
  const formattedTransaction = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

  const empCode = adminUser?.employee_id || adminUser?.name || 'lvt-admin';

  const tradingDateObj = new Date(bookingObj.date);
  const dayName = dayNamesShort[tradingDateObj.getDay()] || '';
  const tradingDateFormatted = `${dayName} ที่ ${tradingDateObj.getDate()} ${monthNamesFull[tradingDateObj.getMonth()]} ${tradingDateObj.getFullYear() + 543}`;

  const cleanStallName = (name) => {
    if (!name) return '';
    return name.replace(/[\[\]]/g, '').trim();
  };

  const formattedStallName = cleanStallName(bookingObj.stall_name);
  const stallPriceVal = parseFloat(bookingObj.stall_price) || 0;
  const elecPriceVal = parseFloat(bookingObj.elec_price) || 0;
  const storageFeeVal = parseFloat(bookingObj.storage_fee) || 0;
  const totalAmountVal = stallPriceVal + elecPriceVal + storageFeeVal;

  const rawPayments = bookingObj.payment_method || '';
  const paymentLines = [];
  if (rawPayments.includes('+') || rawPayments.includes(':')) {
    rawPayments.split('+').forEach(p => {
      const parts = p.trim().split(':');
      if (parts.length >= 2) {
        paymentLines.push({ 
          method: parts[0].trim() === 'โอนเงิน' ? 'โอนจ่าย' : parts[0].trim(), 
          amount: parseFloat(parts[1]) || 0 
        });
      } else {
        paymentLines.push({ method: p.trim(), amount: totalAmountVal });
      }
    });
  } else {
    paymentLines.push({ 
      method: rawPayments === 'โอนเงิน' ? 'โอนจ่าย' : rawPayments || 'เงินสด', 
      amount: totalAmountVal 
    });
  }

  const totalPaidVal = paymentLines.reduce((sum, p) => sum + p.amount, 0);
  const changeVal = totalPaidVal > totalAmountVal ? (totalPaidVal - totalAmountVal) : 0;

  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) {
    alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์ตั๋ว');
    return;
  }

  const htmlContent = `
    <html>
      <head>
        <title>พิมพ์ตั๋วจองนอกผัง</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800;950&display=swap');
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Sarabun', sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            background: #fff;
            color: #000;
            font-size: 10pt;
            line-height: 1.4;
          }
          body, body * {
            font-weight: 850 !important;
            color: #000 !important;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .logo {
            width: 16mm;
            height: 16mm;
            margin: 0 auto 1.5mm auto;
            display: block;
            object-fit: contain;
          }
          .divider {
            border-top: 1.2px dashed #000;
            margin: 2.5mm 0;
          }
          .title {
            font-size: 11.5pt;
            font-weight: 800;
            margin: 1.5mm 0 0.5mm 0;
          }
          .subtitle {
            font-size: 8pt;
            font-weight: bold;
            color: #555;
          }
          .flex-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3.5px;
            font-size: 9.5pt;
          }
          .metadata {
            font-size: 8.5pt;
            color: #333;
            font-weight: bold;
          }
          .trade-details {
            font-size: 9.5pt;
          }
          .trade-details .val {
            font-weight: 800;
            color: #000;
          }
          .trade-details .red-val {
            font-weight: 800;
            color: #b91c1c;
          }
          .price-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5mm 0;
          }
          .price-table th {
            border-bottom: 1.2px dashed #000;
            padding: 1mm 0;
            font-size: 9pt;
            font-weight: bold;
            text-align: left;
          }
          .price-table td {
            padding: 1.2mm 0;
            font-size: 9.5pt;
            font-weight: bold;
          }
          .price-table td.val {
            text-align: right;
            font-family: monospace;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 11pt;
            font-weight: 900;
            margin-bottom: 4px;
          }
          .payment-breakdown {
            font-size: 8.5pt;
            color: #444;
            font-weight: bold;
            margin-top: 1.5mm;
          }
          .footer {
            margin-top: 4.5mm;
            font-size: 8.5pt;
            text-align: center;
            line-height: 1.4;
            font-weight: bold;
            color: #444;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <img class="logo" src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" />
          <div class="title">ตลาดลาดสวายวินเทจ</div>
          <div class="subtitle">Ladsawai Vintage Market</div>
          <div class="subtitle">บริการเช่าพื้นที่จองล็อค ตลาดนัดรายวัน (นอกผัง)</div>
          <div class="subtitle">โทร: 0-92-869-7774 , 0-92-869-7775</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="metadata">
          <div class="flex-row">
            <span>เลขที่เอกสาร:</span>
            <span style="font-family: monospace;">${bookingObj.id}</span>
          </div>
          <div class="flex-row">
            <span>ผู้ทำรายการ:</span>
            <span>${empCode}</span>
          </div>
          <div class="flex-row">
            <span>วันที่ทำรายการ:</span>
            <span style="font-family: monospace;">${formattedTransaction}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="trade-details">
          <div class="flex-row">
            <span style="color: #555;">วันที่ทำการค้า:</span>
            <span class="val">${tradingDateFormatted}</span>
          </div>
          <div class="flex-row">
            <span style="color: #555;">ล็อกที่เช่า (นอกผัง):</span>
            <span class="red-val">${formattedStallName}</span>
          </div>
          <div class="flex-row">
            <span style="color: #555;">ผู้ค้า:</span>
            <span class="val">${bookingObj.booker_name || '-'}</span>
          </div>
          <div class="flex-row">
            <span style="color: #555;">สินค้าที่ขาย:</span>
            <span class="val">${bookingObj.product || '-'}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <table class="price-table">
          <thead>
            <tr>
              <th style="text-align: left; color: #555;">รายการ</th>
              <th style="text-align: right; color: #555;">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ค่าเช่าล็อคนอกผัง</td>
              <td class="val">${stallPriceVal.toFixed(2)} บ.</td>
            </tr>
            ${elecPriceVal > 0 ? `
              <tr>
                <td>ค่าไฟ (${bookingObj.elec_unit || 0} หน่วย)</td>
                <td class="val">${elecPriceVal.toFixed(2)} บ.</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        <div class="total-row">
          <span>รวมเงินทั้งสิ้น:</span>
          <span style="font-family: monospace;">${totalAmountVal.toFixed(2)} บ.</span>
        </div>
        
        <div class="payment-breakdown">
          ${paymentLines.map(p => `
            <div class="flex-row">
              <span>ชำระด้วย [${p.method}]:</span>
              <span style="font-family: monospace;">${p.amount.toFixed(2)} บ.</span>
            </div>
          `).join('')}
          ${changeVal > 0 ? `
            <div class="flex-row" style="color: #b91c1c;">
              <span>เงินทอน:</span>
              <span style="font-family: monospace;">${changeVal.toFixed(2)} บ.</span>
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p style="margin: 0;">Line Official: @ladsawaivintage</p>
          <p style="margin: 1.5mm 0 0 0; color: #000; font-size: 9pt; font-weight: 800;">ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
          <p style="margin: 3.5mm 0 0 0; font-size: 7.5pt; color: #888; font-weight: normal;">Powered by PJMJK</p>
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

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
