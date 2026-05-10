/**
 * ------------------------------------------------------------------
 * CONTROLLER: KHLONG THOM
 * จัดการการส่งยอดตั๋วคลองถมและค่าไฟคลองถม เข้าสู่ระบบบัญชี (รายรับอื่นๆ)
 * ------------------------------------------------------------------
 */

function submitKhlongThomRevenue(formData) {
    const lock = LockService.getScriptLock();
    try {
        // ล็อกระบบป้องกันการกดซ้อนเบิ้ล 5 วินาที
        lock.waitLock(5000);
        
        const results = [];
        const officer = formData.officer || "System";
        const date = formData.date;
        
        const categoryName = (formData.ticketType === 'General') ? "ค่าจอดรถคลองถมทั่วไป" : "ค่าจอดรถคลองถม";

        const cashAmount = parseFloat(formData.cashAmount || 0);
        const transferAmount = parseFloat(formData.transferAmount || 0);
        const elecCash = parseFloat(formData.elecCash || 0);
        const elecTransfer = parseFloat(formData.elecTransfer || 0);

        // 1. บันทึกยอดค่าตั๋ว (เงินสด)
        if (cashAmount > 0) {
            const cashId = RepoOtherIncome.addIncome({
                date: date,
                category: categoryName,
                description: formData.cashDesc || `ส่งยอดตั๋วคลองถม (เงินสด)`,
                amount: cashAmount,
                method: "Cash",
                officer: officer,
                proofUrl: "" 
            });
            results.push(cashId);
        }

        // 2. บันทึกยอดค่าตั๋ว (โอน)
        if (transferAmount > 0) {
            const transferId = RepoOtherIncome.addIncome({
                date: date,
                category: categoryName,
                description: formData.transferDesc || `ส่งยอดตั๋วคลองถม (โอนจ่าย)`,
                amount: transferAmount,
                method: "Transfer",
                officer: officer,
                proofUrl: "" 
            });
            results.push(transferId);
        }

        // 3. บันทึกยอดค่าไฟ (เงินสด)
        if (elecCash > 0) {
            const elecCashId = RepoOtherIncome.addIncome({
                date: date,
                category: "ค่าไฟคลองถม",
                description: `เก็บค่าไฟ${categoryName.replace('ค่าจอดรถ', '')} (เงินสด)`,
                amount: elecCash,
                method: "Cash",
                officer: officer,
                proofUrl: "" 
            });
            results.push(elecCashId);
        }

        // 4. บันทึกยอดค่าไฟ (โอน)
        if (elecTransfer > 0) {
            const elecTransferId = RepoOtherIncome.addIncome({
                date: date,
                category: "ค่าไฟคลองถม",
                description: `เก็บค่าไฟ${categoryName.replace('ค่าจอดรถ', '')} (โอนจ่าย)`,
                amount: elecTransfer,
                method: "Transfer",
                officer: officer,
                proofUrl: "" 
            });
            results.push(elecTransferId);
        }

        if (results.length === 0) {
             return { success: false, message: "ไม่มีจำนวนยอดเงินที่จะบันทึก" };
        }

        return { success: true, message: `บันทึกยอดตั๋วและค่าไฟเข้าบัญชีเรียบร้อย` };

    } catch(e) {
        return { success: false, message: "เกิดข้อผิดพลาด: " + e.toString() };
    } finally {
        lock.releaseLock();
    }
}