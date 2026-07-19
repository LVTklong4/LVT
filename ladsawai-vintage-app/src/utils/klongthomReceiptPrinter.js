import { dayNamesShort, monthNamesFull } from './thaiDateHelper';

export const printBatchKlongThomTickets = (params, adminUser) => {
  const { ticketType, dateStr, price, startNo, endNo } = params;
  
  const start = parseInt(startNo) || 1;
  const end = parseInt(endNo) || 1;
  
  if (end < start) {
    alert("หมายเลขสิ้นสุดต้องมากกว่าหรือเท่ากับหมายเลขเริ่มต้น");
    return;
  }

  const d = new Date(dateStr);
  const thaiYear = d.getFullYear() + 543;
  const yy = String(thaiYear).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateCode = `${yy}${mm}${dd}`;

  const getThaiFormattedDateTime = (dateObj) => {
    const day = dateObj.getDate();
    const month = monthNamesFull[dateObj.getMonth()];
    const year = dateObj.getFullYear() + 543;
    const time = dateObj.toLocaleTimeString('th-TH', { hour12: false });
    return `${day} ${month} ${year} ${time}`;
  };

  const getThaiFormattedDateOnly = (dateObj) => {
    const day = dateObj.getDate();
    const month = monthNamesFull[dateObj.getMonth()];
    const year = dateObj.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const tradingDateFormatted = getThaiFormattedDateOnly(d);
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) {
    alert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อพิมพ์ตั๋ว');
    return;
  }

  // Generate list of tickets
  const ticketsHTML = [];
  const empCode = adminUser?.employee_id || adminUser?.name || 'lvt-admin';

  for (let i = start; i <= end; i++) {
    const serial = String(i).padStart(3, '0');
    const ticketNo = `${dateCode}-${serial}`;
    const now = new Date();
    const formattedPrintTime = getThaiFormattedDateTime(now);

    if (ticketType === 'main') {
      // คลองถม (หลัก) - Flat price ticket
      ticketsHTML.push(`
        <div class="ticket">
          <div class="center">
            <img class="logo" src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" />
            <div class="title">ตลาดนัดลาดสวายวินเทจ</div>
            
            <div class="thick-divider"></div>
            <div class="ticket-header-title">ตั๋ว/ใบเสร็จ (โซนคลองถม)</div>
            <div class="thick-divider"></div>
            
            <div class="subtitle" style="margin-top: 2.5mm;">เลขที่ตั๋ว</div>
            <div class="ticket-no-text">คลองถม ${ticketNo}</div>
          </div>
          
          <div class="dashed-divider"></div>
          
          <div class="price-row flex-row font-black">
            <span>ราคา :</span>
            <span style="font-size: 14pt; font-family: monospace;">${parseFloat(price).toLocaleString()}.-</span>
          </div>
          
          <div class="dashed-divider"></div>
          
          <div class="details">
            <div class="flex-row">
              <span class="lbl">วันที่พิมพ์ :</span>
              <span class="val">${formattedPrintTime}</span>
            </div>
            <div class="flex-row">
              <span class="lbl">ผู้ออกตั๋ว :</span>
              <span class="val font-mono">${empCode}</span>
            </div>
          </div>
          
          <div class="footer center">
            <div class="note">กรุณาแสดงตั๋วนี้เพื่อเป็นหลักฐานการชำระเงิน</div>
            <div class="power">Power by PJMJK</div>
          </div>
        </div>
      `);
    } else {
      // คลองถมทั่วไป (ราคาไม่คงที่) - Stub & Ticket with blank price
      ticketsHTML.push(`
        <div class="ticket">
          <!-- PART 1: ต้นขั้ว (STUB) -->
          <div class="stub-part">
            <div class="stub-header center">ต้นขั้ว - คลองถมทั่วไป</div>
            
            <div class="stub-content">
              <div class="stub-no bold center">คลองถมทั่วไป ${ticketNo}</div>
              <div class="flex-row" style="margin-top: 1.5mm;">
                <span>วันที่:</span>
                <span>${tradingDateFormatted}</span>
              </div>
              <div class="flex-row" style="margin-top: 1.5mm; font-size: 9pt;">
                <span>ราคา : ............................................ บาท</span>
              </div>
            </div>
          </div>
          
          <!-- CUT LINE (รอยปรุสำหรับฉีก) -->
          <div class="cut-line">--------------------------- รอยประสำหรับฉีก ---------------------------</div>
          
          <!-- PART 2: หางตั๋ว (RECEIPT) -->
          <div class="receipt-part">
            <div class="center">
              <img class="logo" src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" />
              <div class="title">ตลาดนัดลาดสวายวินเทจ</div>
              
              <div class="thick-divider"></div>
              <div class="ticket-header-title">ตั๋ว/ใบเสร็จ (โซนคลองถมทั่วไป)</div>
              <div class="thick-divider"></div>
              
              <div class="subtitle" style="margin-top: 2.5mm;">เลขที่ตั๋ว</div>
              <div class="ticket-no-text" style="font-size: 13.5pt; font-family: monospace;">
                คลองถมทั่วไป<br/>${ticketNo}
              </div>
            </div>
            
            <div class="dashed-divider"></div>
            
            <div class="price-row flex-row font-black">
              <span>ราคา :</span>
              <span style="font-size: 11pt;">............................................ บาท</span>
            </div>
            
            <div class="dashed-divider"></div>
            
            <div class="details">
              <div class="flex-row">
                <span class="lbl">เวลาพิมพ์ :</span>
                <span class="val">${formattedPrintTime}</span>
              </div>
              <div class="flex-row">
                <span class="lbl">ผู้ออกตั๋ว :</span>
                <span class="val font-mono">${empCode}</span>
              </div>
            </div>
            
            <div class="footer center">
              <div class="note">กรุณาแสดงตั๋วนี้เพื่อเป็นหลักฐานการชำระเงิน</div>
              <div class="power">Power by PJMJK</div>
            </div>
          </div>
        </div>
      `);
    }
  }

  const htmlContent = `
    <html>
      <head>
        <title>พิมพ์ตั๋วคลองถม</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800;950&display=swap');
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .ticket {
            page-break-after: always;
            box-sizing: border-box;
            width: 72mm;
            margin: 0 auto;
            padding: 4mm 1mm;
            font-family: 'Sarabun', sans-serif;
            font-size: 9.5pt;
            line-height: 1.4;
            color: #000;
          }
          .ticket, .ticket * {
            font-weight: 850 !important;
            color: #000 !important;
          }
          .ticket:last-child {
            page-break-after: avoid;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .logo {
            width: 15mm;
            height: 15mm;
            margin: 0 auto 1mm auto;
            display: block;
            object-fit: contain;
          }
          .thick-divider {
            border-top: 2px solid #000;
            margin: 1.2mm 0;
          }
          .dashed-divider {
            border-top: 1.2px dashed #000;
            margin: 2mm 0;
          }
          .title {
            font-size: 11pt;
            font-weight: 950;
            margin: 1mm 0;
          }
          .subtitle {
            font-size: 9.5pt;
            font-weight: 800;
            color: #000;
          }
          .ticket-header-title {
            font-size: 10.5pt;
            font-weight: 950;
            color: #000;
            padding: 0.2mm 0;
          }
          .ticket-no-text {
            font-size: 14pt;
            font-weight: 950;
            padding: 1mm 0;
            margin: 0.5mm 0 1.5mm 0;
          }
          .flex-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .price-row {
            font-size: 11pt;
            padding: 0.5mm 0;
          }
          .details {
            font-size: 8.5pt;
            margin: 1.5mm 0;
          }
          .details .lbl {
            color: #000;
          }
          .details .val {
            font-weight: 800;
          }
          .footer {
            margin-top: 3.5mm;
          }
          .footer .note {
            font-size: 8.5pt;
            font-weight: 800;
            margin-bottom: 1mm;
          }
          .footer .power {
            font-size: 7.5pt;
            color: #666;
            font-weight: normal;
          }
          
          /* Stub styles for general tickets */
          .stub-part {
            border: 1.2px solid #000;
            border-radius: 4px;
            overflow: hidden;
            background: #fff;
          }
          .stub-header {
            background: #d4d4d8;
            color: #000;
            padding: 1.2mm 0;
            font-size: 9.5pt;
            font-weight: 950;
            border-bottom: 1.2px solid #000;
          }
          .stub-content {
            padding: 2.2mm;
            font-size: 8.5pt;
          }
          .stub-no {
            font-size: 10.5pt;
            font-weight: 950;
          }
          .cut-line {
            border-top: 1.2px dashed #000;
            text-align: center;
            font-size: 6.5pt;
            color: #000;
            margin: 3.5mm 0;
            padding-top: 0.5mm;
          }
          .receipt-part {
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${ticketsHTML.join('')}
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
