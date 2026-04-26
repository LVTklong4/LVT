/**
 * ------------------------------------------------------------------
 * CONTROLLER: ACCOUNTING (DIRECT ACCESS VERSION)
 * แก้ปัญหาข้อมูลไม่มา: อ่านข้อมูลจาก Sheet โดยตรง 100% (ไม่ผ่าน Repo)
 * Update: Added Breakdown Columns (J,K,L,M) reading
 * FIX 3: Exclude 'ส่วนลด' from Income/Cash Flow calculation
 * FIX: Increased Lock wait time from 5000ms to 30000ms
 * ------------------------------------------------------------------
 */

const _ACC_FINANCE_ID = "1Xp-QrcyR-f5AnRcfOO7nb-sLoneqK31zI1daQgCmNrU";
const _ACC_EXPENSE_ID = "1ztblw2nOmvmh5wLcejaN8Zqvsw-UtGXk6K49uxQhm1Q";
const _ACC_OTHER_ID = "17SCdtDC6UwqKCHxZ1Xn7uLDFWysZZhBWssLYpq6ckvg";
const _ACC_REPORT_ID = "1wsgMndWCm7ADdm-77rcM9JpPhjxLz-Ct71nvobAkxpM";
const _ACC_DAILY_ID = "1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I";
const _ACC_MONTHLY_ID = "1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE";
const _ACC_SETUP_ID = "1ax7ZepRoNfh564sF6gcyCWcNW80kY04Phc1CjoaCfbo";

function getAccountingData(dateStr) {
  const lock = LockService.getScriptLock();
  try {
      // --- FIX: ขยายเวลาล็อกเป็น 30 วินาที ป้องกัน Error ---
      lock.waitLock(30000); 
      
      let targetDateStr = "";
      if (dateStr && dateStr !== "NO_DATE") {
          targetDateStr = _accNormalizeDateDirect(dateStr);
      } else {
          targetDateStr = _accNormalizeDateDirect(new Date());
      }
      
      console.log("Fetching Accounting Direct for: " + targetDateStr);

      const accountingData = _readFinanceDirect(targetDateStr);
      const stalls = _fetchStallsDirect();
      const bookingsFormatted = _fetchBookingsDirect(targetDateStr);
      const monthlyStats = _fetchMonthlyDirect();

      return { 
          success: true, 
          date: targetDateStr,
          accounting: accountingData,
          stalls: stalls,
          bookings: bookingsFormatted,
          monthlyStats: monthlyStats
      };

  } catch (e) {
      console.error(e);
      return { success: false, message: "Accounting Error: " + e.toString() };
  } finally {
      lock.releaseLock();
  }
}

function saveDailyClosing(data) {
    const lock = LockService.getScriptLock();
    try {
        // --- FIX: ขยายเวลาล็อกเป็น 30 วินาที ---
        lock.waitLock(30000);
        const ss = SpreadsheetApp.openById(_ACC_REPORT_ID);
        let sheet = ss.getSheetByName("Daily_Closing");
        if (!sheet) {
            sheet = ss.insertSheet("Daily_Closing");
            sheet.appendRow(["Date", "System Total", "System Cash", "System Transfer", "Actual Cash", "Diff", "Note", "Officer", "Timestamp"]);
        }
        
        const ts = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
        sheet.appendRow([data.date, data.systemTotal, data.systemCash, data.systemTransfer, data.cashInDrawer, data.diff, data.note, data.officer, ts]);
        
        return { success: true, message: "บันทึกปิดยอดเรียบร้อย" };
    } catch (e) {
        return { success: false, message: "Save Closing Error: " + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function _accNormalizeDateDirect(val) {
    if (!val) return "";
    try {
        if (val instanceof Date) return Utilities.formatDate(val, "GMT+7", "yyyy-MM-dd");
        let s = String(val).trim();
        if (s.includes('T')) s = s.split('T')[0];
        if (s.match(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/)) {
            const parts = s.split(/[\/-]/);
            let d = parseInt(parts[0]); let m = parseInt(parts[1]); let y = parseInt(parts[2]);
            if (y > 2400) y -= 543;
            return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        }
        return s;
    } catch (e) { return ""; }
}

function _readFinanceDirect(targetDateStr) {
    let result = {
        incomes: [],
        expenses: [],
        summary: { totalIncome: 0, totalExpense: 0, netProfit: 0, cashIn: 0, transferIn: 0, cashOut: 0, transferOut: 0, netCash: 0 }
    };
    
    try {
        const ss = SpreadsheetApp.openById(_ACC_FINANCE_ID);
        const sheet = ss.getSheetByName("Transactions");
        if (sheet) {
            const data = sheet.getDataRange().getValues();
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const rowDate = _accNormalizeDateDirect(row[2]);
                
                if (rowDate === targetDateStr) {
                    const amt = parseFloat(row[4] || 0); 
                    const method = row[5]; 
                    
                    if (method === 'ส่วนลด' || method === 'Discount') continue;
                    
                    const breakdown = {
                        stall: parseFloat(row[9] || 0),
                        elec: parseFloat(row[10] || 0),
                        storage: parseFloat(row[11] || 0)
                    };
                    const billType = row[12];
                    
                    result.incomes.push({ 
                        ref: row[1], 
                        category: row[3], 
                        desc: row[6], 
                        amount: amt,
                        method: method,
                        billType: billType,
                        breakdown: breakdown
                    });
                    
                    result.summary.totalIncome += amt;
                    if (method === 'Cash' || method === 'เงินสด') result.summary.cashIn += amt; 
                    else result.summary.transferIn += amt;
                }
            }
        }
    } catch(e) { console.error("Txn Read Error", e); }

    try {
        const ss = SpreadsheetApp.openById(_ACC_OTHER_ID);
        const sheet = ss.getSheetByName("Other_Income");
        if (sheet) {
            const data = sheet.getDataRange().getValues();
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const rowDate = _accNormalizeDateDirect(row[1]);
                
                if (rowDate === targetDateStr) {
                    const amt = parseFloat(row[4] || 0);
                    const method = row[5];
                    
                    if (method === 'ส่วนลด' || method === 'Discount') continue;
                    
                    result.incomes.push({
                        ref: '',
                        category: row[2],
                        desc: row[3],
                        amount: amt,
                        method: method,
                        type: 'Manual',
                        breakdown: { stall:0, elec:0, storage:0 }
                    });
                    
                    result.summary.totalIncome += amt;
                    if (method === 'Cash' || method === 'เงินสด') result.summary.cashIn += amt; 
                    else result.summary.transferIn += amt;
                }
            }
        }
    } catch(e) { console.error("Other Inc Read Error", e); }

    try {
        const ss = SpreadsheetApp.openById(_ACC_EXPENSE_ID);
        const sheet = ss.getSheetByName("Expenses");
        if (sheet) {
            const data = sheet.getDataRange().getValues();
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const rowDate = _accNormalizeDateDirect(row[1]);
                
                if (rowDate === targetDateStr) {
                    const amt = parseFloat(row[4] || 0);
                    const method = row[5];
                    
                    result.expenses.push({
                        category: row[2],
                        item: row[3],
                        amount: amt,
                        method: method,
                        officer: row[6]
                    });
                    
                    result.summary.totalExpense += amt;
                    if (method === 'Cash' || method === 'เงินสด') result.summary.cashOut += amt; 
                    else result.summary.transferOut += amt;
                }
            }
        }
    } catch(e) { console.error("Exp Read Error", e); }
    
    result.summary.netProfit = result.summary.totalIncome - result.summary.totalExpense;
    result.summary.netCash = result.summary.cashIn - result.summary.cashOut;
    
    return result;
}

function _fetchStallsDirect() {
    try {
        const ss = SpreadsheetApp.openById(_ACC_SETUP_ID);
        const sheet = ss.getSheetByName("Stalls");
        const data = sheet.getDataRange().getValues();
        data.shift(); 
        return data.map(row => ({
            name: String(row[0]), 
            type: String(row[3])
        }));
    } catch(e) { return []; }
}

function _fetchBookingsDirect(targetDateStr) {
    try {
        const ss = SpreadsheetApp.openById(_ACC_DAILY_ID);
        const sheet = ss.getSheetByName("Bookings");
        const data = sheet.getDataRange().getValues();
        const results = [];
        
        for(let i=1; i<data.length; i++) {
            const row = data[i];
            results.push({
                id: String(row[0]),
                stallName: String(row[2]),
                type: String(row[5]),
                masterId: String(row[14])
            });
        }
        return results;
    } catch(e) { return []; }
}

function _fetchMonthlyDirect() {
    try {
        const ss = SpreadsheetApp.openById(_ACC_MONTHLY_ID);
        const sheet = ss.getSheetByName("Monthly_Data");
        const data = sheet.getDataRange().getValues();
        data.shift(); 
        return data.map(r => ({
            id: String(r[0]),
            stalls: String(r[4])
        }));
    } catch(e) { return []; }
}