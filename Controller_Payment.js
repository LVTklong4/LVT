/**
 * ------------------------------------------------------------------
 * CONTROLLER: PAYMENT OPERATIONS
 * ฟังก์ชันสำหรับการจัดการการเงินและการชำระเงิน
 * FIX: Update saveMonthlyPayment/updatePaymentTransaction to handle custom dates correctly
 * FIX 3: Added support for 'Discount' (ส่วนลด) category and method
 * ------------------------------------------------------------------
 */

function saveMonthlyPayment(paymentData) {
    if (paymentData.paymentId) { return updatePaymentTransaction(paymentData); }
    const paymentId = Utils.generatePaymentId();
    const now = new Date();
    let slipUrl = "";
    if (paymentData.slipFile) {
         try {
            const folder = DriveApp.getFolderById(SLIP_FOLDER_ID);
            const decoded = Utilities.base64Decode(paymentData.slipFile.split(',')[1]);
            const blob = Utilities.newBlob(decoded, paymentData.slipType, `Slip_${paymentData.bookingId}_${paymentId}`);
            slipUrl = folder.createFile(blob).getUrl();
         } catch(e) { console.error(e); }
    }
    
    const recordDate = paymentData.date ? paymentData.date : Utils.formatDateForSheet(now);
    
    const breakdown = {
        stall: parseFloat(paymentData.amount),
        elec: 0,
        storage: 0
    };
    
    // FIX 3: Map Discount properly
    let dbMethod = paymentData.method;
    let category = "ชำระเพิ่มเติม";
    if (paymentData.method === 'Discount') {
        dbMethod = "ส่วนลด";
        category = "ปรับปรุงยอด/ให้ส่วนลด";
    }

    RepoTransaction.addTransaction(
        paymentData.bookingId, 
        category, 
        paymentData.amount, 
        dbMethod, 
        paymentData.note, 
        "System", 
        breakdown, 
        "Monthly Rent", 
        slipUrl,
        recordDate
    );

    const totalPaid = RepoTransaction.getTotalPaid(paymentData.bookingId);
    RepoMonthly.updateTotalPaidValue(paymentData.bookingId, totalPaid);
    
    return { success: true, message: "บันทึกเรียบร้อย" };
}

function updatePaymentTransaction(paymentData) {
    const recordDate = paymentData.date ? paymentData.date : null;
    
    // FIX 3: Map Discount properly
    let dbMethod = paymentData.method;
    if (paymentData.method === 'Discount') dbMethod = "ส่วนลด";
    
    const success = RepoTransaction.updateTransaction(
        paymentData.paymentId, 
        paymentData.amount, 
        dbMethod, 
        paymentData.note,
        recordDate
    );
    
    if (success) {
        const totalPaid = RepoTransaction.getTotalPaid(paymentData.bookingId);
        RepoMonthly.updateTotalPaidValue(paymentData.bookingId, totalPaid);
        return { success: true, message: "แก้ไขเรียบร้อย" };
    }
    return { success: false, message: "ไม่พบรายการ" };
}

function deletePaymentTransaction(paymentId, bookingId) {
    const success = RepoTransaction.deleteTransaction(paymentId);
    if (success) {
        const totalPaid = RepoTransaction.getTotalPaid(bookingId);
        RepoMonthly.updateTotalPaidValue(bookingId, totalPaid);
        return { success: true, message: "ลบเรียบร้อย" };
    }
    return { success: false, message: "ไม่พบรายการ" };
}

function getPaymentHistory(bookingId) {
    const transactions = RepoTransaction.getTransactionsByBookingId(bookingId);
    return { success: true, data: transactions };
}