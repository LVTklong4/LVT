import { dayNamesShort, monthNamesFull } from './thaiDateHelper';

export const printMarketLayoutA4 = ({ selectedDate, stalls = [], bookings = [], adminUser, showAlert }) => {
  try {
    const now = new Date();
    const formattedPrintTime = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';

    const empCode = adminUser?.employee_id || adminUser?.name || 'lvt-admin';

    // Format selectedDate into Thai full date
    const dObj = new Date(selectedDate);
    const dayName = dayNamesShort[dObj.getDay()] || '';
    const dateFormatted = `วัน${dayName}ที่ ${dObj.getDate()} ${monthNamesFull[dObj.getMonth()]} พ.ศ. ${dObj.getFullYear() + 543}`;

    // Filter bookings for selectedDate
    const todayBookings = bookings.filter(b => b.date === selectedDate);
    const offGridBookings = todayBookings.filter(b => b.type === 'นอกผัง');

    // Helper to find booking for a stall
    const getBookingForStall = (stall) => {
      if (!stall) return null;
      return todayBookings.find(b => {
        if (b.stall_name === stall.name) return true;
        if (!b.stall_name) return false;
        const list = b.stall_name.split(',').map(s => s.replace(/[\[\]]/g, '').trim());
        return list.includes(stall.name);
      });
    };

    // Calculate Summary Stats
    let paidCount = 0;
    let unpaidCount = 0;
    let vacantCount = 0;
    let leaveCount = 0;

    const stallDataMap = stalls.map(s => {
      const b = getBookingForStall(s);
      let status = 'vacant'; // vacant, paid, unpaid, leave
      if (b) {
        if (b.status === 'ลา') {
          status = 'leave';
          leaveCount++;
          vacantCount++;
        } else if (b.status === 'ชำระแล้ว' || b.status === 'ไม่ว่าง') {
          status = 'paid';
          paidCount++;
        } else {
          status = 'unpaid';
          unpaidCount++;
        }
      } else {
        vacantCount++;
      }
      return { stall: s, booking: b, status };
    });

    const totalStalls = stalls.length;

    // Group stalls by Zone
    const zones = {};
    stallDataMap.forEach(item => {
      const name = item.stall.name || '';
      let zoneKey = 'อื่นๆ';
      if (name.startsWith('F')) zoneKey = 'โซน F (อาหาร)';
      else if (name.startsWith('A')) zoneKey = 'โซน A';
      else if (name.startsWith('B')) zoneKey = 'โซน B';
      else if (name.startsWith('C')) zoneKey = 'โซน C';
      else if (name.startsWith('D')) zoneKey = 'โซน D';
      else if (name.startsWith('E')) zoneKey = 'โซน E';
      else if (item.stall.zone) zoneKey = `โซน ${item.stall.zone}`;

      if (!zones[zoneKey]) zones[zoneKey] = [];
      zones[zoneKey].push(item);
    });

    // Custom order for zones
    const zoneOrder = ['โซน F (อาหาร)', 'โซน A', 'โซน B', 'โซน C', 'โซน D', 'โซน E'];
    const sortedZoneKeys = Object.keys(zones).sort((a, b) => {
      const idxA = zoneOrder.indexOf(a);
      const idxB = zoneOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Construct A4 Landscape Print HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ผังตรวจการจองรายวัน (A4) - ${selectedDate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800;900&display=swap');
            
            @page {
              size: A4 landscape;
              margin: 5mm 6mm;
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
              color: #111;
              background: #fff;
              font-size: 8pt;
              line-height: 1.2;
            }

            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #8B4513;
              padding-bottom: 4px;
              margin-bottom: 6px;
            }

            .header-title-box h1 {
              font-size: 13pt;
              font-weight: 900;
              color: #8B4513;
              margin: 0 0 2px 0;
            }

            .header-title-box .subtitle {
              font-size: 9pt;
              font-weight: 700;
              color: #444;
            }

            .header-meta {
              text-align: right;
              font-size: 8pt;
              font-weight: 700;
              color: #555;
            }

            .summary-bar {
              display: flex;
              gap: 12px;
              background: #FDFBF7;
              border: 1px solid #D7CCC8;
              border-radius: 4px;
              padding: 4px 8px;
              margin-bottom: 6px;
              font-size: 8.5pt;
              font-weight: 800;
            }

            .summary-item {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .badge-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              display: inline-block;
            }

            .dot-paid { background-color: #16a34a; }
            .dot-unpaid { background-color: #d97706; }
            .dot-vacant { background-color: #9ca3af; }
            .dot-offgrid { background-color: #9333ea; }

            .zones-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }

            .zone-card {
              flex: 1 1 calc(50% - 4px);
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 4px;
              background: #fff;
              page-break-inside: avoid;
            }

            .zone-card-full {
              flex: 1 1 100%;
            }

            .zone-header {
              font-size: 9.5pt;
              font-weight: 900;
              color: #5D4037;
              background: #F5EBE6;
              padding: 2px 6px;
              border-radius: 3px;
              margin-bottom: 4px;
              display: flex;
              justify-content: space-between;
            }

            .stalls-matrix {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
              gap: 3px;
            }

            .stall-cell {
              border: 1px solid #e5e7eb;
              border-radius: 3px;
              padding: 2px 4px;
              min-height: 28px;
              display: flex;
              flex-col: column;
              justify-content: space-between;
              background: #fafafa;
            }

            .stall-cell.status-paid {
              background-color: #f0fdf4 !important;
              border-color: #bbf7d0 !important;
            }

            .stall-cell.status-unpaid {
              background-color: #fffbeb !important;
              border-color: #fde68a !important;
            }

            .stall-cell.status-vacant {
              background-color: #ffffff !important;
              border-color: #e5e7eb !important;
            }

            .stall-cell.status-offgrid {
              background-color: #faf5ff !important;
              border-color: #e9d5ff !important;
            }

            .stall-name {
              font-weight: 900;
              font-size: 8.5pt;
              color: #111;
              display: flex;
              justify-content: space-between;
            }

            .stall-tag {
              font-size: 6.5pt;
              font-weight: 800;
              padding: 0.5px 3px;
              border-radius: 2px;
            }

            .tag-paid { background: #dcfce7; color: #15803d; }
            .tag-unpaid { background: #fef3c7; color: #b45309; }
            .tag-vacant { background: #f3f4f6; color: #6b7280; }
            .tag-offgrid { background: #f3e8ff; color: #7e22ce; }

            .booker-name {
              font-size: 7.5pt;
              font-weight: 700;
              color: #1f2937;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-top: 1px;
            }

            .product-desc {
              font-size: 6.5pt;
              color: #6b7280;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .footer-note {
              margin-top: 4px;
              text-align: center;
              font-size: 7pt;
              color: #777;
              border-top: 1px dashed #ccc;
              padding-top: 2px;
            }

            @media print {
              html, body {
                height: 99%;
                overflow: hidden;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header-container">
            <div class="header-title-box">
              <h1>ตลาดลาดสวายวินเทจ — ผังตรวจการจองรายวัน (A4)</h1>
              <div class="subtitle">ประจำ ${dateFormatted}</div>
            </div>
            <div class="header-meta">
              <div>เจ้าหน้าที่ตรวจผัง: <strong>${empCode}</strong></div>
              <div>เวลาพิมพ์: <strong>${formattedPrintTime}</strong></div>
            </div>
          </div>

          <!-- Summary Bar -->
          <div class="summary-bar">
            <div class="summary-item">
              <span>ล็อคในผังทั้งหมด:</span> <strong>${totalStalls}</strong>
            </div>
            <div class="summary-item">
              <span class="badge-dot dot-paid"></span>
              <span>ชำระแล้ว:</span> <strong>${paidCount}</strong>
            </div>
            <div class="summary-item">
              <span class="badge-dot dot-unpaid"></span>
              <span>ค้างชำระ:</span> <strong>${unpaidCount}</strong>
            </div>
            <div class="summary-item">
              <span class="badge-dot dot-vacant"></span>
              <span>ว่าง:</span> <strong>${vacantCount}</strong>
            </div>
            <div class="summary-item">
              <span class="badge-dot dot-offgrid"></span>
              <span>จองนอกผัง:</span> <strong>${offGridBookings.length}</strong>
            </div>
          </div>

          <!-- Zones Grid -->
          <div class="zones-grid">
            ${sortedZoneKeys.map(zKey => {
              const zoneStalls = zones[zKey];
              const zoneVacant = zoneStalls.filter(i => i.status === 'vacant' || i.status === 'leave').length;
              const zonePaid = zoneStalls.filter(i => i.status === 'paid').length;
              
              return `
                <div class="zone-card">
                  <div class="zone-header">
                    <span>${zKey} (${zoneStalls.length} ล็อค)</span>
                    <span style="font-size: 7.5pt; font-weight: 700; color: #666;">
                      ชำระแล้ว: ${zonePaid} | ว่าง: ${zoneVacant}
                    </span>
                  </div>
                  <div class="stalls-matrix">
                    ${zoneStalls.map(item => {
                      const stallName = item.stall.name;
                      const booker = item.booking?.booker_name || '';
                      const product = item.booking?.product || '';
                      const st = item.status;
                      
                      let tagClass = 'tag-vacant';
                      let tagLabel = 'ว่าง';
                      if (st === 'paid') { tagClass = 'tag-paid'; tagLabel = 'ชำระแล้ว'; }
                      else if (st === 'unpaid') { tagClass = 'tag-unpaid'; tagLabel = 'ค้าง'; }
                      else if (st === 'leave') { tagClass = 'tag-vacant'; tagLabel = 'ลา/ว่าง'; }

                      return `
                        <div class="stall-cell status-${st}">
                          <div class="stall-name">
                            <span>${stallName}</span>
                            <span class="stall-tag ${tagClass}">${tagLabel}</span>
                          </div>
                          ${booker ? `<div class="booker-name">${booker}</div>` : `<div class="booker-name" style="color: #9ca3af;">-</div>`}
                          ${product ? `<div class="product-desc">${product}</div>` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Off-Grid Section -->
            ${offGridBookings.length > 0 ? `
              <div class="zone-card zone-card-full">
                <div class="zone-header" style="background: #f3e8ff; color: #6b21a8;">
                  <span>รายการจองนอกผัง (${offGridBookings.length} รายการ)</span>
                  <span style="font-size: 7.5pt; font-weight: 700;">ชำระแล้วทั้งหมด</span>
                </div>
                <div class="stalls-matrix">
                  ${offGridBookings.map(b => `
                    <div class="stall-cell status-offgrid">
                      <div class="stall-name">
                        <span style="color: #7e22ce;">${b.stall_name}</span>
                        <span class="stall-tag tag-offgrid">นอกผัง</span>
                      </div>
                      <div class="booker-name">${b.booker_name || '-'}</div>
                      ${b.product ? `<div class="product-desc">${b.product}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer-note">
            เอกสารอ้างอิงสำหรับเจ้าหน้าที่ตรวจผังตลาดนัดรายวัน ตลาดลาดสวายวินเทจ | ออกเอกสารโดยระบบบริหารจัดการตลาด LVT
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

    const printWin = window.open(blobUrl, '_blank', 'width=1100,height=800');
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
