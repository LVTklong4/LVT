/**
 * ------------------------------------------------------------------
 * SyncJob.js
 * สคริปต์กลางสำหรับการซิงก์ข้อมูลคู่ขนานจาก Google Sheets ไปยัง Supabase (แนวทางที่ 1)
 * ปลอดภัย 100% ต่อสคริปต์จองและบริหารงานปัจจุบัน ไม่มีการแก้ไขฟังก์ชันเดิม
 * เพิ่มระบบล้างข้อมูลซ้ำ (Deduplication) เพื่อป้องกันข้อผิดพลาด ON CONFLICT DO UPDATE
 * ------------------------------------------------------------------
 */

const SUPABASE_PROJECT_ID = "vzdqdokpewvxeilggwjp";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw";

/**
 * ฟังก์ชันหลักที่ใช้ตั้งค่าใน Trigger เพื่อให้รันอัตโนมัติ (เช่น ทุก 10-15 นาที)
 */
function syncAllDataToSupabase() {
  Logger.log("เริ่มต้นกระบวนการซิงก์ข้อมูลไปยัง Supabase...");
  
  try {
    syncStalls();
    syncBookings();
    syncMonthlyBookings();
    syncTransactions();
    syncStorage();
    syncOtherIncome();
    syncExpenses();
    syncMembers();
    syncAdminRoles();
    
    Logger.log("การซิงก์ข้อมูลทั้งหมดเสร็จสมบูรณ์เรียบร้อย!");
  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดใหญ่ในกระบวนการซิงก์: " + error.toString());
  }
}

/**
 * ฟังก์ชันล้างข้อมูลไอดีซ้ำภายใน Payload (Deduplication)
 * ป้องกันไม่ให้ Postgres พยายามอัปเดตข้อมูลไอดีเดียวกันซ้ำสองรอบในการสั่งคำสั่งเดียว
 */
function removeDuplicates(payload, idKey = "id") {
  const seen = {};
  const uniquePayload = [];
  // วนลูปจากหลังมาหน้า เพื่อให้ได้ข้อมูลแถวล่าสุดของ Google Sheets หากมีไอดีซ้ำกัน
  for (let i = payload.length - 1; i >= 0; i--) {
    const item = payload[i];
    const id = String(item[idKey]).trim();
    if (id && id !== "" && !seen[id]) {
      seen[id] = true;
      uniquePayload.unshift(item); // แทรกกลับเข้าไปด้านหน้าเพื่อรักษาลำดับเดิม
    }
  }
  return uniquePayload;
}

/**
 * ฟังก์ชันส่งข้อมูลแบบ UPSERT ไปยัง Supabase REST API
 */
function sendToSupabase(tableName, payload) {
  if (!payload || payload.length === 0) return;
  
  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "resolution=merge-duplicates" // ทำการ UPSERT (อัปเดตข้อมูลทับเมื่อมี PK ชนกัน)
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  
  if (code >= 200 && code < 300) {
    Logger.log(`ซิงก์ตาราง ${tableName} สำเร็จ: ส่งข้อมูลจำนวน ${payload.length} รายการ`);
  } else {
    Logger.log(`เกิดข้อผิดพลาดในการซิงก์ตาราง ${tableName} (รหัสตอบกลับ: ${code}): ${response.getContentText()}`);
  }
}

/**
 * Helper แปลงค่าวันที่ให้อยู่ในฟอร์แมต YYYY-MM-DD สำหรับเซฟใน Postgres Date
 */
function formatPgDate(val) {
  if (!val) return null;
  try {
    if (val instanceof Date) {
      return Utilities.formatDate(val, "GMT+7", "yyyy-MM-dd");
    }
    const str = String(val).trim();
    if (str === "") return null;
    
    const dt = new Date(val);
    if (!isNaN(dt.getTime())) {
      return Utilities.formatDate(dt, "GMT+7", "yyyy-MM-dd");
    }
    
    // ตรวจสอบฟอร์แมต DD/MM/YYYY หรือ DD-MM-YYYY
    const matches = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (matches) {
      let d = parseInt(matches[1]);
      let m = parseInt(matches[2]);
      let y = parseInt(matches[3]);
      if (y > 2400) y -= 543; // แปลงพ.ศ. เป็น ค.ศ.
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Helper แปลงค่าวันเวลาให้อยู่ในรูปแบบ ISO สำหรับ Postgres Timestamp
 */
function formatPgTimestamp(val) {
  if (!val) return null;
  try {
    if (val instanceof Date) {
      return val.toISOString();
    }
    const str = String(val).trim();
    if (str === "") return null;
    
    const dt = new Date(val);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString();
    }
  } catch (e) {
    return null;
  }
  return null;
}

function parseNumber(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * 1. ซิงก์ข้อมูลผังตารางล็อค
 */
function syncStalls() {
  const ss = SpreadsheetApp.openById(SHEET_ID_SETUP);
  const sheet = ss.getSheetByName("Stalls");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = String(row[0]).trim();
    if (!name) continue;
    
    payload.push({
      name: name,
      row: parseInt(row[1]) || 0,
      col: parseInt(row[2]) || 0,
      type: String(row[3]).trim(),
      price_wed: parseNumber(row[4]),
      price_sat: parseNumber(row[5]),
      price_sun: parseNumber(row[6]),
      price_month: parseNumber(row[7])
    });
  }
  
  payload = removeDuplicates(payload, "name");
  sendToSupabase("stalls", payload);
}

/**
 * 2. ซิงก์ข้อมูลการจองรายวัน (Bookings)
 */
function syncBookings() {
  const ss = SpreadsheetApp.openById(SHEET_ID_DAILY);
  const sheet = ss.getSheetByName("Bookings");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    if (!id) continue;
    
    payload.push({
      id: id,
      date: formatPgDate(row[1]),
      stall_name: String(row[2]).trim(),
      booker_name: String(row[3]).trim(),
      product: String(row[4]).trim(),
      type: String(row[5]).trim(),
      elec_unit: parseNumber(row[6]),
      elec_price: parseNumber(row[7]),
      stall_price: parseNumber(row[8]),
      total_price: parseNumber(row[9]),
      payment_method: String(row[10]).trim(),
      status: String(row[11]).trim(),
      note: String(row[12]).trim(),
      master_id: String(row[14] || "").trim(),
      storage_fee: parseNumber(row[15])
    });
  }
  
  payload = removeDuplicates(payload, "id");
  
  // ซิงก์ทีละ 1,000 แถวเพื่อป้องกัน Request ขนาดใหญ่เกินไป
  const chunkSize = 1000;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    sendToSupabase("bookings", chunk);
  }
}

/**
 * 3. ซิงก์ข้อมูลการจองรายเดือน
 */
function syncMonthlyBookings() {
  const ss = SpreadsheetApp.openById(SHEET_ID_MONTHLY_EXTERNAL);
  const sheet = ss.getSheetByName("Monthly_Data");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    if (!id) continue;
    
    payload.push({
      id: id,
      timestamp: formatPgTimestamp(row[1]),
      start_date: formatPgDate(row[2]),
      booker_name: String(row[3]).trim(),
      stalls: String(row[4]).trim(),
      product: String(row[5]).trim(),
      status: String(row[6]).trim(),
      elec_unit: parseNumber(row[7]),
      total_price: parseNumber(row[8]),
      paid_amount: parseNumber(row[9]),
      note: String(row[10]).trim(),
      payment_method: String(row[11]).trim(),
      selected_days: String(row[12]).trim(),
      booking_month: String(row[13]).trim(),
      phone: String(row[14]).trim(),
      stall_details: String(row[15]).trim(),
      customer_type: String(row[16] || "Standard").trim(),
      storage_fee: parseNumber(row[17]),
      renewal_status: String(row[18] || "").trim()
    });
  }
  
  payload = removeDuplicates(payload, "id");
  
  const chunkSize = 1000;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    sendToSupabase("monthly_bookings", chunk);
  }
}

/**
 * 4. ซิงก์ประวัติธุรกรรมการเงิน
 */
function syncTransactions() {
  const ss = SpreadsheetApp.openById(SHEET_ID_FINANCE);
  const sheet = ss.getSheetByName("Transactions");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    if (!id) continue;
    
    payload.push({
      id: id,
      booking_ref: String(row[1]).trim(),
      date: formatPgDate(row[2]),
      category: String(row[3]).trim(),
      total_amount: parseNumber(row[4]),
      method: String(row[5]).trim(),
      note: String(row[6]).trim(),
      officer: String(row[7]).trim(),
      timestamp: formatPgTimestamp(row[8]),
      stall_amt: parseNumber(row[9]),
      elec_amt: parseNumber(row[10]),
      storage_amt: parseNumber(row[11]),
      bill_type: String(row[12] || "General").trim(),
      slip_url: String(row[13] || "").trim()
    });
  }
  
  payload = removeDuplicates(payload, "id");
  
  const chunkSize = 1000;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    sendToSupabase("transactions", chunk);
  }
}

/**
 * 5. ซิงก์ข้อมูลฝากของ (Storage)
 */
function syncStorage() {
  const ss = SpreadsheetApp.openById(SHEET_ID_STORAGE);
  const sheet = ss.getSheetByName("Storage_Data");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    if (!id) continue;
    
    payload.push({
      id: id,
      stall_name: String(row[1]).trim(),
      owner_name: String(row[2]).trim(),
      phone: String(row[3]).trim(),
      start_date: formatPgDate(row[4]),
      end_date: formatPgDate(row[5]),
      status: String(row[6]).trim(),
      note: String(row[7]).trim(),
      timestamp: formatPgTimestamp(row[8]),
      ref_booking_id: String(row[9] || "").trim()
    });
  }
  
  payload = removeDuplicates(payload, "id");
  sendToSupabase("storage", payload);
}

/**
 * 6. ซิงก์ตารางรายได้อื่นๆ
 */
function syncOtherIncome() {
  const ss = SpreadsheetApp.openById(SHEET_ID_OTHER_INCOME);
  const sheet = ss.getSheetByName("Other_Income");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    if (!id) continue;
    
    payload.push({
      id: id,
      date: formatPgDate(row[1]),
      category: String(row[2]).trim(),
      description: String(row[3]).trim(),
      amount: parseNumber(row[4]),
      method: String(row[5]).trim(),
      officer: String(row[6]).trim(),
      proof_url: String(row[7] || "").trim(),
      timestamp: formatPgTimestamp(row[8])
    });
  }
  
  payload = removeDuplicates(payload, "id");
  sendToSupabase("other_income", payload);
}

/**
 * 7. ซิงก์ตารางรายจ่าย
 */
function syncExpenses() {
  const ss = SpreadsheetApp.openById(SHEET_ID_EXPENSE);
  const sheet = ss.getSheetByName("Expenses");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    if (!id) continue;
    
    payload.push({
      id: id,
      date: formatPgDate(row[1]),
      category: String(row[2]).trim(),
      item: String(row[3]).trim(),
      amount: parseNumber(row[4]),
      method: String(row[5]).trim(),
      officer: String(row[6]).trim(),
      receipt_url: String(row[7] || "").trim(),
      timestamp: formatPgTimestamp(row[8])
    });
  }
  
  payload = removeDuplicates(payload, "id");
  sendToSupabase("expenses", payload);
}

/**
 * 8. ซิงก์สมาชิกไลน์ (LINE OA Members)
 */
function syncMembers() {
  const ss = SpreadsheetApp.openById(SHEET_ID_MEMBERS);
  const sheet = ss.getSheetByName("Members");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim(); // LineUserID
    if (!id) continue;
    
    payload.push({
      line_user_id: id,
      name: String(row[1]).trim(),
      picture_url: String(row[2] || "").trim(),
      shop_name: String(row[3] || "").trim(),
      phone: String(row[4] || "").trim(),
      status: String(row[5] || "Active").trim(),
      registered_date: formatPgTimestamp(row[6]),
      note: String(row[7] || "").trim()
    });
  }
  
  payload = removeDuplicates(payload, "line_user_id");
  sendToSupabase("members", payload);
}

/**
 * 9. ซิงก์ข้อมูลสิทธิ์ผู้ดูแลระบบ (Admin Roles)
 */
function syncAdminRoles() {
  const ss = SpreadsheetApp.openById(SHEET_ID_SETUP);
  const sheet = ss.getSheetByName("Role");
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  let payload = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = String(row[0]).trim().toLowerCase();
    if (!email) continue;
    
    payload.push({
      email: email,
      name: String(row[2]).trim(),
      role: String(row[3]).trim(),
      status: String(row[4]).trim(),
      employee_id: String(row[5] || "").trim() || null
    });
  }
  
  payload = removeDuplicates(payload, "email");
  sendToSupabase("admin_roles", payload);
}
