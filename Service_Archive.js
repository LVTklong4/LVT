/**
 * ------------------------------------------------------------------
 * SERVICE: ARCHIVE
 * ระบบย้ายข้อมูลเก่าไปเก็บไว้ที่ชีต Archive (ลดขนาด Hot Data ให้โหลดเร็วขึ้น)
 * Update: แยก Sheet สำหรับเก็บข้อมูลบัญชี/การเงิน ที่เก่ากว่า 60 วันโดยเฉพาะ
 * ------------------------------------------------------------------
 */

// ไอดีไฟล์ Google Sheets สำหรับ Backup ข้อมูลบัญชี/การเงิน
const _ARCHIVE_FINANCE_ID = "1s7LwCaJg5EmbQR3K6MeV_tsEWdjHE-mKzbsvzZkhxBE";

const ServiceArchive = {
    runDailyArchive: function() {
        const lock = LockService.getScriptLock();
        try {
            // ล็อกการทำงาน 30 วินาที ป้องกันแอดมินหลายคนกดปุ่มพร้อมกัน
            lock.waitLock(30000); 
            
            const today = new Date();
            today.setHours(0,0,0,0);

            // 1. เก็บข้อมูล "ผังรายวัน" ที่เก่ากว่าวันนี้ (ไปลงไฟล์ Archive ผัง)
            let archivedBookings = this.archiveDailyBookings(today);

            // 2. เก็บข้อมูล "บัญชี/การเงิน" ที่เก่ากว่า 60 วัน (ไปลงไฟล์ Archive บัญชีเฉพาะ)
            const cutoffFinance = new Date(today);
            cutoffFinance.setDate(today.getDate() - 60);
            cutoffFinance.setHours(0,0,0,0);

            // ย้ายข้อมูลการเงินไปยัง _ARCHIVE_FINANCE_ID 
            let archivedTxns = this.archiveSheetData(SHEET_ID_FINANCE, "Transactions", _ARCHIVE_FINANCE_ID, "Archive_Transactions", 2, cutoffFinance); 
            let archivedIncomes = this.archiveSheetData(SHEET_ID_OTHER_INCOME, "Other_Income", _ARCHIVE_FINANCE_ID, "Archive_Other_Income", 1, cutoffFinance);
            let archivedExpenses = this.archiveSheetData(SHEET_ID_EXPENSE, "Expenses", _ARCHIVE_FINANCE_ID, "Archive_Expenses", 1, cutoffFinance);

            return `จัดการข้อมูลสำเร็จ:\n- ผังรายวัน: ย้าย ${archivedBookings} รายการ\n- บัญชีเก่า (>60 วัน): ย้าย ${archivedTxns + archivedIncomes + archivedExpenses} รายการ`;
            
        } catch (e) {
            throw new Error("Archive Error: " + e.toString());
        } finally {
            lock.releaseLock();
        }
    },

    archiveSheetData: function(sourceSsId, sourceSheetName, destSsId, destSheetName, dateColIndex, cutoffDate) {
        try {
            const srcSs = SpreadsheetApp.openById(sourceSsId);
            const srcSheet = srcSs.getSheetByName(sourceSheetName);
            if (!srcSheet) return 0;

            const destSs = SpreadsheetApp.openById(destSsId);
            let destSheet = destSs.getSheetByName(destSheetName);
            if (!destSheet) {
                destSheet = destSs.insertSheet(destSheetName);
                // ก็อปปี้ Header จากชีตต้นทางมาสร้างให้ชีตใหม่
                const header = srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues();
                destSheet.appendRow(header[0]);
            }

            const data = srcSheet.getDataRange().getValues();
            if (data.length <= 1) return 0;

            const rowsToArchive = [];
            const rowsToDelete = [];

            for (let i = 1; i < data.length; i++) {
                const rowDateRaw = data[i][dateColIndex];
                if (!rowDateRaw) continue;

                let rowDate = this.parseDateSafe(rowDateRaw);
                
                // ถ้าวันที่ในตาราง เก่ากว่า วันที่กำหนด (60 วัน) -> จับย้าย
                if (rowDate && rowDate.getTime() < cutoffDate.getTime()) {
                    rowsToArchive.push(data[i]);
                    rowsToDelete.push(i + 1); // +1 เพราะ array เริ่มที่ 0 แต่ชีตเริ่มที่ 1
                }
            }

            if (rowsToArchive.length > 0) {
                // 1. นำไปต่อท้ายในชีต Archive
                destSheet.getRange(destSheet.getLastRow() + 1, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
                // 2. ลบออกจากชีตต้นทางอย่างรวดเร็ว (ใช้ฟังก์ชัน Optimized จาก RepoDaily)
                RepoDaily.deleteRowsOptimized(srcSheet, rowsToDelete);
            }

            return rowsToArchive.length;
        } catch (e) {
            console.error("Archive Sheet Data Error (" + sourceSheetName + "):", e);
            return 0;
        }
    },

    archiveDailyBookings: function(todayObj) {
        try {
            const srcSs = SpreadsheetApp.openById(SHEET_ID_DAILY);
            const srcSheet = srcSs.getSheetByName("Bookings");
            if (!srcSheet) return 0;

            const destSs = SpreadsheetApp.openById(SHEET_ID_ARCHIVE);
            let destSheet = destSs.getSheetByName("Archive_Data");
            if (!destSheet) {
                 destSheet = destSs.insertSheet("Archive_Data");
                 const header = srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues();
                 destSheet.appendRow(header[0]);
            }

            const data = srcSheet.getDataRange().getValues();
            if (data.length <= 1) return 0;

            const rowsToArchive = [];
            const rowsToDelete = [];

            for (let i = 1; i < data.length; i++) {
                const rentType = data[i][5];
                // Archive เฉพาะรายวันเท่านั้น รายเดือนเก็บไว้เป็น Master
                if (rentType && String(rentType).trim() === 'รายเดือน') continue; 

                const rowDateRaw = data[i][1];
                let rowDate = this.parseDateSafe(rowDateRaw);
                
                if (rowDate && rowDate.getTime() < todayObj.getTime()) {
                    rowsToArchive.push(data[i]);
                    rowsToDelete.push(i + 1);
                }
            }

            if (rowsToArchive.length > 0) {
                destSheet.getRange(destSheet.getLastRow() + 1, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
                RepoDaily.deleteRowsOptimized(srcSheet, rowsToDelete);
            }
            return rowsToArchive.length;
        } catch(e) {
            console.error("Archive Daily Bookings Error:", e);
            return 0;
        }
    },

    parseDateSafe: function(val) {
        if (!val) return null;
        if (val instanceof Date) {
            const d = new Date(val);
            d.setHours(0,0,0,0);
            return d;
        }
        try {
            // รองรับทั้งฟอร์แมต 2026-05-10 และ 10/05/2569
            const str = String(val).split('T')[0];
            const parts = str.split(/[\/-]/);
            if (parts.length === 3) {
                let y, m, d;
                
                // สลับตำแหน่งระหว่าง DD/MM/YYYY กับ YYYY-MM-DD
                if (parts[0].length === 2 && parts[2].length >= 4) {
                     d = parseInt(parts[0]);
                     m = parseInt(parts[1]) - 1;
                     y = parseInt(parts[2]);
                } else {
                     y = parseInt(parts[0]);
                     m = parseInt(parts[1]) - 1;
                     d = parseInt(parts[2]);
                }

                if(y > 2400) y -= 543; // แปลง พ.ศ. เป็น ค.ศ.
                
                const dt = new Date(y, m, d);
                dt.setHours(0,0,0,0);
                return dt;
            }
            const dt = new Date(val);
            dt.setHours(0,0,0,0);
            return isNaN(dt.getTime()) ? null : dt;
        } catch (e) {
            return null;
        }
    }
};