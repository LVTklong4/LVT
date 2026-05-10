/**
 * ------------------------------------------------------------------
 * CONTROLLER: ACCOUNTING (DIRECT ACCESS VERSION)
 * แก้ปัญหาข้อมูลไม่มา: อ่านข้อมูลจาก Sheet โดยตรง 100% (ไม่ผ่าน Repo)
 * Update: Added PDF Generation & Closing History Fetch
 * FIX: Safe Data Serialization for google.script.run (Convert Date to String)
 * FIX: Embed Base64 Logo and enforce Google Fonts for PDF rendering
 * FIX: Day Lock System (ป้องกันการปิดยอดซ้ำ และส่งสถานะไปล็อกหน้าจอ)
 * ------------------------------------------------------------------
 */

const _ACC_FINANCE_ID = "1Xp-QrcyR-f5AnRcfOO7nb-sLoneqK31zI1daQgCmNrU";
const _ACC_EXPENSE_ID = "1ztblw2nOmvmh5wLcejaN8Zqvsw-UtGXk6K49uxQhm1Q";
const _ACC_OTHER_ID = "17SCdtDC6UwqKCHxZ1Xn7uLDFWysZZhBWssLYpq6ckvg";
const _ACC_REPORT_ID = "1wsgMndWCm7ADdm-77rcM9JpPhjxLz-Ct71nvobAkxpM";
const _ACC_DAILY_ID = "1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I";
const _ACC_MONTHLY_ID = "1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE";
const _ACC_SETUP_ID = "1ax7ZepRoNfh564sF6gcyCWcNW80kY04Phc1CjoaCfbo";
const _ACC_REPORT_FOLDER_ID = "1EfO8saTsutTFSJ9ZzEf4q5Rw9cCAIOpe"; // Folder for PDF

function getAccountingData(dateStr) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000); 
        
        let targetDateStr = "";
        if (dateStr && dateStr !== "NO_DATE") {
            targetDateStr = _accNormalizeDateDirect(dateStr);
        } else {
            targetDateStr = _accNormalizeDateDirect(new Date());
        }
        
        console.log("Fetching Accounting Direct for: " + targetDateStr);

        // --- NEW: ตรวจสอบว่าวันนี้ปิดยอดไปหรือยัง (Is Closed?) ---
        let isClosed = false;
        try {
            const ssRep = SpreadsheetApp.openById(_ACC_REPORT_ID);
            const sheetRep = ssRep.getSheetByName("Daily_Closing");
            if (sheetRep) {
                const repData = sheetRep.getDataRange().getValues();
                for (let i = 1; i < repData.length; i++) {
                    const rDate = _accNormalizeDateDirect(repData[i][0]);
                    if (rDate === targetDateStr) {
                        isClosed = true;
                        break;
                    }
                }
            }
        } catch(e) {
            console.error("Check Closed Status Error", e);
        }

        const accountingData = _readFinanceDirect(targetDateStr);
        const stalls = _fetchStallsDirect();
        const bookingsFormatted = _fetchBookingsDirect(targetDateStr);
        const monthlyStats = _fetchMonthlyDirect();

        return { 
            success: true, 
            date: targetDateStr,
            isClosed: isClosed, // <--- ส่งสถานะปิดยอดกลับไปล็อก UI
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
        lock.waitLock(30000);
        const ss = SpreadsheetApp.openById(_ACC_REPORT_ID);
        let sheet = ss.getSheetByName("Daily_Closing");
        
        if (!sheet) {
            sheet = ss.insertSheet("Daily_Closing");
            sheet.appendRow(["Date", "System Total", "System Cash", "System Transfer", "Actual Cash", "Diff", "Note", "Officer", "Timestamp", "Report URL"]);
        } else {
            // --- NEW: ดักจับการกดปิดยอดซ้ำซ้อนจากหลังบ้าน 100% ---
            const existingData = sheet.getDataRange().getValues();
            for (let i = 1; i < existingData.length; i++) {
                const rDate = _accNormalizeDateDirect(existingData[i][0]);
                if (rDate === data.date) {
                    return { success: false, message: "ไม่อนุญาตให้ทำรายการ: วันที่ " + data.date + " ถูกปิดยอดไปแล้ว!" };
                }
            }
        }

        let pdfUrl = "";

        if (data.htmlContent) {
            try {
                const folder = DriveApp.getFolderById(_ACC_REPORT_FOLDER_ID);
                let finalHtml = data.htmlContent;
                
                try {
                    const logoUrl = "https://img2.pic.in.th/pic/Profile-Alpha_0.png";
                    const logoBlob = UrlFetchApp.fetch(logoUrl).getBlob();
                    const base64Logo = "data:" + logoBlob.getContentType() + ";base64," + Utilities.base64Encode(logoBlob.getBytes());
                    finalHtml = finalHtml.replace(/https:\/\/img2\.pic\.in\.th\/pic\/Profile-Alpha_0\.png/g, base64Logo);
                } catch (imgErr) {
                    console.error("Image Convert Error", imgErr);
                }
                
                const fullHtml = `
                    <html>
                        <head>
                            <meta charset="UTF-8">
                            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
                                body { font-family: 'Sarabun', sans-serif; padding: 10px; background: white; margin: 0; color: #000; }
                                * { font-family: 'Sarabun', sans-serif !important; }
                            </style>
                        </head>
                        <body>
                            ${finalHtml}
                        </body>
                    </html>
                `;
                
                const blob = Utilities.newBlob(fullHtml, MimeType.HTML).getAs(MimeType.PDF);
                blob.setName(`DailyClosing_${data.date}_${new Date().getTime()}.pdf`);
                
                const file = folder.createFile(blob);
                pdfUrl = file.getUrl();
            } catch (pdfErr) {
                console.error("PDF Generate Error", pdfErr);
            }
        }

        const ts = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
        
        sheet.appendRow([data.date, data.systemTotal, data.systemCash, data.systemTransfer, data.cashInDrawer, data.diff, data.note, data.officer, ts, pdfUrl]);
        
        return { success: true, message: "บันทึกปิดยอดและสร้างเอกสารอ้างอิง (PDF) เรียบร้อย" };
    } catch (e) {
        return { success: false, message: "Save Closing Error: " + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function getClosingHistory() {
    try {
        const ss = SpreadsheetApp.openById(_ACC_REPORT_ID);
        const sheet = ss.getSheetByName("Daily_Closing");
        if (!sheet) return { success: true, data: [] };
        
        const data = sheet.getDataRange().getValues();
        const results = [];
        
        for(let i = data.length - 1; i >= 1; i--) {
            let tsStr = "";
            if (data[i][8] instanceof Date) {
                tsStr = Utilities.formatDate(data[i][8], "GMT+7", "yyyy-MM-dd HH:mm:ss");
            } else {
                tsStr = String(data[i][8] || "");
            }

            results.push({
                date: _accNormalizeDateDirect(data[i][0]),
                systemTotal: String(data[i][1] || "0"),
                systemCash: String(data[i][2] || "0"),
                actualCash: String(data[i][4] || "0"),
                diff: String(data[i][5] || "0"),
                officer: String(data[i][7] || ""),
                timestamp: tsStr,
                url: String(data[i][9] || "")
            });
        }
        
        return { success: true, data: results };
    } catch(e) {
        return { success: false, message: "Error fetching history: " + e.toString() };
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