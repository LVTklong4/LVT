/**
 * LVT Market Management System - Data Archiving Engine
 * Google Apps Script Webhook Endpoint
 * Target Google Drive Folder ID: 1kmBElcZAAX0UbQ61cI3fbgbJHHzi6eXu
 * 
 * Instructions:
 * 1. Open https://script.google.com/
 * 2. Click "New project"
 * 3. Paste this code into Code.gs
 * 4. Click "Deploy" -> "New deployment"
 * 5. Select type: "Web app"
 * 6. Set Description: "LVT Archiving Engine"
 * 7. Set Execute as: "Me"
 * 8. Set Who has access: "Anyone" (ทุกคนที่มีลิงก์)
 * 9. Click "Deploy" and copy the Web app URL to the LVT Settings Modal.
 */

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const folderId = postData.folderId || '1kmBElcZAAX0UbQ61cI3fbgbJHHzi6eXu';
    const monthStr = postData.monthStr || '2026-07';
    const monthThai = postData.monthThai || 'กรกฎาคม 2569';
    const dailyBookings = postData.dailyBookings || [];
    const monthlyBookings = postData.monthlyBookings || [];
    const transactions = postData.transactions || [];

    // Get Target Google Drive Folder
    const folder = DriveApp.getFolderById(folderId);

    // Create New Google Spreadsheet
    const fileName = `LVT_Archive_${monthStr} (${monthThai})`;
    const spreadsheet = SpreadsheetApp.create(fileName);
    const fileId = spreadsheet.getId();

    // Move file to target folder
    const file = DriveApp.getFileById(fileId);
    file.moveTo(folder);

    // 1. Tab 1: Daily Bookings
    const sheetDaily = spreadsheet.getActiveSheet();
    sheetDaily.setName('Daily_Bookings');
    sheetDaily.setTabColor('#3B82F6'); // Blue
    
    const dailyHeaders = [
      'รหัสการจอง (ID)', 'วันที่ (Date)', 'รหัสล็อค (Stall)', 'ชื่อผู้ค้า (Booker Name)',
      'ประเภทสินค้า (Product)', 'ประเภทสัญญา (Type)', 'จำนวนไฟ (Units)', 'ค่าไฟ (Elec Price)',
      'ค่าล็อค (Stall Price)', 'ค่าฝากของ (Storage)', 'ยอดรวม (Total Price)',
      'วิธีชำระ (Payment Method)', 'สถานะ (Status)', 'รหัสสัญญาแม่ (Master ID)', 'หมายเหตุ (Note)'
    ];
    sheetDaily.appendRow(dailyHeaders);
    sheetDaily.getRange(1, 1, 1, dailyHeaders.length)
      .setBackground('#1E3A8A')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    if (dailyBookings.length > 0) {
      const dailyRows = dailyBookings.map(b => [
        b.id || '',
        b.date || '',
        b.stall_name || b.stall_id || '',
        b.booker_name || b.customer_name || '',
        b.product || '',
        b.type || '',
        Number(b.elec_unit || 0),
        Number(b.elec_price || 0),
        Number(b.stall_price || 0),
        Number(b.storage_fee || 0),
        Number(b.total_price || b.price || 0),
        b.payment_method || '',
        b.status || '',
        b.master_id || '',
        b.note || ''
      ]);
      sheetDaily.getRange(2, 1, dailyRows.length, dailyHeaders.length).setValues(dailyRows);
    }
    sheetDaily.autoResizeColumns(1, dailyHeaders.length);

    // 2. Tab 2: Monthly Contracts
    const sheetMonthly = spreadsheet.insertSheet('Monthly_Contracts');
    sheetMonthly.setTabColor('#8B5CF6'); // Purple
    const monthlyHeaders = [
      'รหัสสัญญา (ID)', 'ชื่อผู้ค้า (Booker Name)', 'ประเภทลูกค้า (Customer Type)',
      'เบอร์โทร (Phone)', 'สินค้า (Product)', 'รายการล็อค (Stalls)', 'วันลงขาย (Selected Days)',
      'ยอดค่าเช่า (Total Price)', 'ชำระแล้ว (Paid Amount)', 'สถานะ (Status)',
      'ค่าฝากของ (Storage)', 'จำนวนไฟ (Elec Units)', 'หมายเหตุ (Note)', 'รอบเดือนสัญญา (Month)'
    ];
    sheetMonthly.appendRow(monthlyHeaders);
    sheetMonthly.getRange(1, 1, 1, monthlyHeaders.length)
      .setBackground('#4C1D95')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    if (monthlyBookings.length > 0) {
      const monthlyRows = monthlyBookings.map(m => [
        m.id || '',
        m.booker_name || m.customer_name || '',
        m.customer_type || 'Standard',
        m.phone || '',
        m.product || '',
        m.stalls || '',
        m.selected_days || '',
        Number(m.total_price || 0),
        Number(m.paid_amount || 0),
        m.status || '',
        Number(m.storage_fee || 0),
        Number(m.elec_unit || 0),
        m.note || '',
        m.booking_month || m.start_date || ''
      ]);
      sheetMonthly.getRange(2, 1, monthlyRows.length, monthlyHeaders.length).setValues(monthlyRows);
    }
    sheetMonthly.autoResizeColumns(1, monthlyHeaders.length);

    // 3. Tab 3: Financial Transactions
    const sheetTxn = spreadsheet.insertSheet('Financial_Transactions');
    sheetTxn.setTabColor('#10B981'); // Emerald
    const txnHeaders = [
      'รหัสธุรกรรม (ID)', 'วันที่ (Date)', 'ประเภท (Type)', 'หมวดหมู่ (Category)',
      'รายการ/รายละเอียด (Description)', 'จำนวนเงิน (Amount)', 'วิธีชำระ (Payment Method)',
      'ผู้บันทึก (Officer)', 'อ้างอิงการจอง (Booking Ref)', 'เวลาบันทึก (Timestamp)'
    ];
    sheetTxn.appendRow(txnHeaders);
    sheetTxn.getRange(1, 1, 1, txnHeaders.length)
      .setBackground('#064E3B')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    if (transactions.length > 0) {
      const txnRows = transactions.map(t => [
        t.id || '',
        t.date || '',
        t.type || '',
        t.category || '',
        t.description || t.item || t.note || '',
        Number(t.amount || t.total_amount || 0),
        t.payment_method || t.method || '',
        t.officer || '',
        t.booking_ref || '',
        t.timestamp || t.created_at || ''
      ]);
      sheetTxn.getRange(2, 1, txnRows.length, txnHeaders.length).setValues(txnRows);
    }
    sheetTxn.autoResizeColumns(1, txnHeaders.length);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      fileName: fileName,
      fileUrl: spreadsheet.getUrl(),
      dailyCount: dailyBookings.length,
      monthlyCount: monthlyBookings.length,
      txnCount: transactions.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("LVT Market Archiving Webhook is Active and Ready!");
}
