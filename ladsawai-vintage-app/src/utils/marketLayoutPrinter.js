import { dayNamesShort, monthNamesFull } from './thaiDateHelper';

export const printMarketLayoutA4 = ({ selectedDate, stalls = [], bookings = [], adminUser, showAlert }) => {
  try {
    const now = new Date();
    const formattedPrintTime = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });

    const empCode = adminUser?.employee_id || adminUser?.name || 'ตลาดนัดลาดสวายวินเทจ';

    // Format date for title e.g. "26/7/2569"
    const dObj = new Date(selectedDate);
    const dateFormattedShort = `${dObj.getDate()}/${dObj.getMonth() + 1}/${dObj.getFullYear() + 543}`;

    const maxCol = 20; // Expanded grid: removed 4 rightmost parking columns (col 21-24)
    const maxRow = 26;

    // Filter bookings for selectedDate
    const todayBookings = bookings.filter(b => b.date === selectedDate);

    // Collect unpaid bookings for bottom list
    const unpaidItems = [];

    // Helper to get booking for stall
    const getBookingForStall = (stall) => {
      if (!stall) return null;
      const matched = todayBookings.filter(b => {
        if (b.stall_name === stall.name) return true;
        if (!b.stall_name) return false;
        const list = b.stall_name.split(',').map(s => s.replace(/[\[\]]/g, '').trim());
        return list.includes(stall.name);
      });
      if (matched.length === 0) return null;
      return matched.sort((a, b) => (a.status === 'ลา' ? 1 : -1))[0];
    };

    // Pre-build cells matrix
    let cellsHTML = '';

    for (let r = 1; r <= maxRow; r++) {
      for (let c = 1; c <= maxCol; c++) {
        const stall = stalls.find(s => s.row === r && s.col === c);

        if (!stall) {
          const isInsideGrocery = r >= 1 && r <= 3 && c >= 13 && c <= 15;
          const isInsideBathroom = r >= 1 && r <= 3 && c >= 16 && c <= 20;
          const isInsideWater = r >= 23 && r <= 26 && c >= 2 && c <= 6;

          let bgStyle = 'background-color: #94a3b8; border: 1px solid #64748b;'; // default walkway gray
          let labelText = '';

          if (isInsideGrocery) {
            if (r === 1 && c === 13) labelText = '<span style="font-weight:900; font-size:7pt; color:#8B4513;">ร้านชำ</span>';
            bgStyle = 'background-color: #faf0e6; border: 1px dashed #8B4513;';
          } else if (isInsideWater) {
            if (r === 23 && c === 2) labelText = '<span style="font-weight:900; font-size:7pt; color:#854D0E;">ร้านน้ำ</span>';
            bgStyle = 'background-color: #fef9c3; border: 1px dashed #d97706;';
          } else if (isInsideBathroom) {
            if (r === 1 && c === 16) labelText = '<span style="font-weight:900; font-size:7pt; color:#475569;">ห้องน้ำ</span>';
            bgStyle = 'background-color: #e2e8f0; border: 1px solid #cbd5e1;';
          }

          cellsHTML += `
            <div style="grid-row: ${r}; grid-column: ${c}; ${bgStyle} border-radius: 2px; display: flex; align-items: center; justify-content: center; min-height: 20px;">
              ${labelText}
            </div>
          `;
          continue;
        }

        const booking = getBookingForStall(stall);
        const displayName = stall.name.replace(/[\[\]]/g, '');
        const isFood = stall.type.includes('อาหาร') || stall.name.startsWith('F');

        let cellBg = 'background-color: #b3e5fc; border: 1px solid #81d4fa; color: #01579b;'; // default vacant cloth
        let productText = '';

        if (stall.type === 'ทางเดิน') {
          cellBg = 'background-color: #94a3b8; border: 1px solid #64748b; opacity: 0.7;';
        } else if (stall.type === 'อื่นๆ') {
          cellBg = 'background-color: #cbd5e1; border: 1px solid #94a3b8;';
        } else if (stall.type === 'รายเดือน' || stall.type.includes('รายเดือน')) {
          if (booking) {
            if (booking.status === 'ลา') {
              cellBg = isFood 
                ? 'background-color: #dcedc8; border: 1px solid #aed581; color: #1b5e20;' 
                : 'background-color: #b3e5fc; border: 1px solid #81d4fa; color: #01579b;';
              productText = 'ว่าง (ลา)';
            } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
              // Paid = Soft Red (matching main map)
              cellBg = 'background-color: #ffcdd2; border: 1px solid #e57373; color: #b71c1c;';
              productText = booking.product || 'จองแล้ว';
            } else {
              // Unpaid = Warm Amber/Orange (matching main map)
              cellBg = 'background-color: #ffe0b2; border: 1.5px solid #ffb74d; color: #e65100;';
              productText = booking.product || 'ประจำ';
              unpaidItems.push(`[${displayName}] ${booking.product || booking.booker_name || 'ประจำ'}`);
            }
          } else {
            // Monthly stall = Lavender / Soft Purple (matching main map)
            cellBg = 'background-color: #d1c4e9; border: 1px solid #b39ddb; color: #4a148c;';
            productText = 'รายเดือน';
          }
        } else {
          // Daily Stall
          if (booking) {
            if (booking.status === 'ลา') {
              cellBg = isFood 
                ? 'background-color: #dcedc8; border: 1px solid #aed581; color: #1b5e20;' 
                : 'background-color: #b3e5fc; border: 1px solid #81d4fa; color: #01579b;';
              productText = 'ว่าง (ลา)';
            } else if (booking.status === 'ชำระแล้ว' || booking.status === 'ไม่ว่าง') {
              // Paid = Soft Red (matching main map)
              cellBg = 'background-color: #ffcdd2; border: 1px solid #e57373; color: #b71c1c;';
              productText = booking.product || booking.booker_name || 'จองแล้ว';
            } else {
              // Unpaid = Warm Amber/Orange (matching main map)
              cellBg = 'background-color: #ffe0b2; border: 1.5px solid #ffb74d; color: #e65100;';
              productText = booking.product || booking.booker_name || 'ค้างชำระ';
              unpaidItems.push(`[${displayName}] ${booking.product || booking.booker_name || 'ค้างชำระ'}`);
            }
          } else {
            // Vacant stall (Food = Green, Cloth = Blue)
            cellBg = isFood 
              ? 'background-color: #dcedc8; border: 1px solid #aed581; color: #1b5e20;' 
              : 'background-color: #b3e5fc; border: 1px solid #81d4fa; color: #01579b;';
            productText = '';
          }
        }

        cellsHTML += `
          <div style="grid-row: ${r}; grid-column: ${c}; ${cellBg} border-radius: 2px; padding: 1px 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 20px; overflow: hidden; text-align: center;">
            <div style="font-size: 7.5pt; font-weight: 900; line-height: 1.1; white-space: nowrap;">[${displayName}]</div>
            ${productText ? `<div style="font-size: 6.5pt; font-weight: 700; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; margin-top: 1px;">${productText}</div>` : ''}
          </div>
        `;
      }
    }

    // Join unpaid items with "  |  " for clear separation
    const unpaidText = unpaidItems.length > 0
      ? unpaidItems.join(' &nbsp;|&nbsp; ')
      : 'ไม่มีรายการค้างชำระประจำวัน';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ผัง ${dateFormattedShort} - ตลาดลาดสวายวินเทจ</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800;900&display=swap');
            
            @page {
              size: A4 landscape;
              margin: 4mm 5mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              font-family: 'Sarabun', sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
              background: #fff;
              font-size: 8pt;
              line-height: 1.2;
            }

            .page-container {
              width: 100%;
              max-height: 200mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }

            .header-box {
              margin-bottom: 4px;
            }

            .main-title {
              font-size: 14pt;
              font-weight: 900;
              color: #000;
              margin: 0;
              line-height: 1.1;
            }

            .sub-title {
              font-size: 8.5pt;
              font-weight: 700;
              color: #333;
              margin-top: 1px;
            }

            .grid-map {
              display: grid;
              grid-template-columns: repeat(${maxCol}, 1fr);
              grid-auto-rows: minmax(19px, auto);
              gap: 2.5px;
              background: #d7ccc8;
              border: 3px solid #5d4037;
              border-radius: 4px;
              padding: 3px;
              width: 100%;
            }

            .unpaid-section {
              margin-top: 6px;
              border-top: 1.5px solid #d97706;
              padding-top: 4px;
              font-size: 8.5pt;
              font-weight: 800;
              color: #c2410c;
              line-height: 1.4;
            }

            .footer-row {
              display: flex;
              justify-content: flex-end;
              margin-top: 8px;
              font-size: 8.5pt;
              font-weight: 800;
              color: #111;
            }

            @media print {
              html, body {
                height: 100%;
                overflow: hidden;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div>
              <div class="header-box">
                <h1 class="main-title">ผัง ${dateFormattedShort}</h1>
                <div class="sub-title">เวลาพิมพ์: ${formattedPrintTime} | ผู้พิมพ์: ${empCode} | ตลาดนัดลาดสวายวินเทจ</div>
              </div>

              <div class="grid-map">
                ${cellsHTML}
              </div>
            </div>

            <div>
              <div class="unpaid-section">
                <strong style="color: #9a3412;">ค้างชำระ (รายวัน/ประจำ):</strong> ${unpaidText}
              </div>

              <div class="footer-row">
                <div>ลงชื่อผู้ตรวจ: ...........................................................</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    // Create Blob URL & open window
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const printWin = window.open(blobUrl, '_blank', 'width=1200,height=850');
    if (!printWin) {
      if (showAlert) {
        showAlert("เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้เพื่อพิมพ์ผังตลาด", "แจ้งเตือน", true);
      }
    }
  } catch (e) {
    console.error("Error printing market layout:", e);
    if (showAlert) {
      showAlert("เกิดข้อผิดพลาดในการพิมพ์ผังตลาด: " + e.message, "ข้อผิดพลาด", true);
    }
  }
};
