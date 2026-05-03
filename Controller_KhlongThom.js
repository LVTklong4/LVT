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
        const pricePerTicket = parseFloat(formData.pricePerTicket || 0);
        
        // กำหนดหมวดหมู่บัญชีตามประเภทที่เลือกหน้าบ้าน
        const categoryName = (formData.ticketType === 'General') ? "ค่าจอดรถคลองถมทั่วไป" : "ค่าจอดรถคลองถม";
        const typeLabel = (formData.ticketType === 'General') ? "คลองถมทั่วไป" : "คลองถม";

        // 1. บันทึกยอดค่าตั๋ว (เงินสด)
        if (formData.cashCount > 0) {
            const cashAmount = formData.cashCount * pricePerTicket;
            const cashId = RepoOtherIncome.addIncome({
                date: date,
                category: categoryName,
                description: `ขายตั๋ว${typeLabel} ${formData.cashCount} คัน (เงินสด)`,
                amount: cashAmount,
                method: "Cash",
                officer: officer,
                proofUrl: "" 
            });
            results.push(cashId);
        }

        // 2. บันทึกยอดค่าตั๋ว (โอน)
        if (formData.transferCount > 0) {
            const transferAmount = formData.transferCount * pricePerTicket;
            const transferId = RepoOtherIncome.addIncome({
                date: date,
                category: categoryName,
                description: `ขายตั๋ว${typeLabel} ${formData.transferCount} คัน (โอนจ่าย)`,
                amount: transferAmount,
                method: "Transfer",
                officer: officer,
                proofUrl: "" 
            });
            results.push(transferId);
        }

        // 3. บันทึกยอดค่าไฟ (เงินสด)
        if (formData.elecCash > 0) {
            const elecCashId = RepoOtherIncome.addIncome({
                date: date,
                category: "ค่าไฟคลองถม",
                description: `เก็บค่าไฟ${typeLabel} (เงินสด)`,
                amount: formData.elecCash,
                method: "Cash",
                officer: officer,
                proofUrl: "" 
            });
            results.push(elecCashId);
        }

        // 4. บันทึกยอดค่าไฟ (โอน)
        if (formData.elecTransfer > 0) {
            const elecTransferId = RepoOtherIncome.addIncome({
                date: date,
                category: "ค่าไฟคลองถม",
                description: `เก็บค่าไฟ${typeLabel} (โอนจ่าย)`,
                amount: formData.elecTransfer,
                method: "Transfer",
                officer: officer,
                proofUrl: "" 
            });
            results.push(elecTransferId);
        }

        if (results.length === 0) {
             return { success: false, message: "ไม่มีจำนวนยอดเงินที่จะบันทึก" };
        }

        return { success: true, message: `บันทึกยอดตั๋วและค่าไฟ (${typeLabel}) เข้าบัญชีเรียบร้อย` };

    } catch(e) {
        return { success: false, message: "เกิดข้อผิดพลาด: " + e.toString() };
    } finally {
        lock.releaseLock();
    }
}