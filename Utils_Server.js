/**
 * ------------------------------------------------------------------
 * UTILITIES (SERVER)
 * ฟังก์ชันกลางสำหรับจัดการวันที่, ID และการแปลงข้อมูล
 * File: Utils_Server.gs
 * ------------------------------------------------------------------
 */

const Utils = {
  // สร้าง Booking ID ใหม่ (ลดโอกาสซ้ำด้วย Timestamp ละเอียด)
  generateBookingId: function() {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Format: BK-YYMMdd-HHmmss-Rand (Ex: BK-240209-134512-999)
    return `BK-${year}${month}${day}-${hour}${minute}${second}-${rand}`;
  },

  // สร้าง Payment ID ใหม่
  generatePaymentId: function() {
    return `PAY-${new Date().getTime()}`;
  },

  // จัดรูปแบบวันที่สำหรับเก็บลง Sheet (yyyy-MM-dd)
  formatDateForSheet: function(dateObj) {
    return Utilities.formatDate(new Date(dateObj), TIMEZONE, "yyyy-MM-dd");
  },

  // จัดรูปแบบเวลา (HH:mm:ss)
  formatTime: function(dateObj) {
    return Utilities.formatDate(new Date(dateObj), TIMEZONE, "HH:mm:ss");
  },

  // จัดรูปแบบ Timestamp (yyyy-MM-dd HH:mm:ss)
  getTimestamp: function() {
    return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  },
  
  // แปลง JSON string อย่างปลอดภัย
  parseJsonSafe: function(jsonStr, fallback = []) {
    try {
      return jsonStr ? JSON.parse(jsonStr) : fallback;
    } catch (e) {
      return fallback;
    }
  }
};