import crypto from 'crypto';
import { formatBookingMonth, monthNamesFull } from '@/utils/thaiDateHelper';

const LINE_API_URL = 'https://api.line.me/v2/bot';

/**
 * Verifies LINE Webhook HMAC-SHA256 signature
 */
export function verifyLineSignature(bodyText, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;

  const hash = crypto
    .createHmac('SHA256', secret)
    .update(bodyText)
    .digest('base64');

  return hash === signature;
}

/**
 * Replies to a user's message using LINE Reply API (Free - does not consume push quota!)
 */
export async function replyLineMessage(replyToken, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !replyToken) return { success: false, error: 'Missing token or replyToken' };

  const messageList = Array.isArray(messages) ? messages : [messages];

  try {
    const res = await fetch(`${LINE_API_URL}/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        replyToken,
        messages: messageList
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('[LINE Reply Error]', res.status, errJson);
      return { success: false, status: res.status, error: errJson };
    }

    return { success: true };
  } catch (err) {
    console.error('[LINE Reply Exception]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a direct message to a user using LINE Push Message API
 */
export async function pushLineMessage(toUserId, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !toUserId) return { success: false, error: 'Missing token or toUserId' };

  const messageList = Array.isArray(messages) ? messages : [messages];

  try {
    const res = await fetch(`${LINE_API_URL}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        to: toUserId,
        messages: messageList
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('[LINE Push Error]', res.status, errJson);
      return { success: false, status: res.status, error: errJson };
    }

    return { success: true };
  } catch (err) {
    console.error('[LINE Push Exception]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Formats Thai month string e.g. "2026-11" -> "พฤศจิกายน 2569"
 */
export function formatThaiMonth(yearMonthStr) {
  return yearMonthStr ? formatBookingMonth(yearMonthStr) : '';
}

export function getBookingMonthKey(value) {
  const formatted = formatBookingMonth(value);
  const match = formatted.match(/^(.+)\s+(\d{4})$/);
  if (!match) return '';

  const monthIndex = monthNamesFull.indexOf(match[1]);
  const year = Number(match[2]) - 543;
  if (monthIndex < 0 || !Number.isFinite(year)) return '';
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function getBangkokCurrentMonthKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(now);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  return `${year}-${month}`;
}

export function normalizeThaiPhoneNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('66') ? `0${digits.slice(2)}` : digits;
}

/**
 * Builds Flex Message for Unregistered Merchant
 */
export function buildFlexUnregistered(liffUrl) {
  const targetUrl = liffUrl || 'https://liff.line.me/2008895416-VNkDCPju';

  return {
    type: 'flex',
    altText: 'กรุณาลงทะเบียนผู้ค้ารายเดือน ตลาดนัดลาดสวายวินเทจ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#5D4037',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'ตลาดนัดลาดสวายวินเทจ',
            color: '#FFE082',
            weight: 'bold',
            size: 'xs'
          },
          {
            type: 'text',
            text: 'ยังไม่พบข้อมูลการผูกบัญชี',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'sm'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'สวัสดีค่ะ 🙏 บัญชี LINE นี้ยังไม่ได้ลงทะเบียนผูกกับข้อมูลร้านค้ารายเดือนในระบบ',
            wrap: true,
            size: 'sm',
            color: '#4A3B32'
          },
          {
            type: 'text',
            text: 'หากท่านเป็นผู้ค้ารายเดือนของตลาด กรุณากดปุ่มด้านล่างเพื่อกรอกเบอร์โทรศัพท์ที่เคยแจ้งไว้กับตลาดเพื่อเริ่มใช้งานค่ะ',
            wrap: true,
            size: 'xs',
            color: '#795548'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#8B4513',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📝 ผูกเบอร์โทรศัพท์ผู้ค้า',
              uri: targetUrl
            }
          }
        ]
      }
    }
  };
}

export function buildFlexAlreadyRegistered(customerName) {
  return {
    type: 'flex',
    altText: 'บัญชี LINE นี้ลงทะเบียนแล้ว',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'ข้อมูลตอบกลับจากระบบ',
            size: 'xxs',
            color: '#8D6E63'
          },
          {
            type: 'text',
            text: 'ท่านได้ลงทะเบียนแล้วค่ะ',
            weight: 'bold',
            size: 'lg',
            color: '#2E7D32',
            wrap: true
          },
          {
            type: 'text',
            text: `บัญชี LINE นี้ผูกกับข้อมูลของ${customerName ? `ร้าน ${customerName}` : 'ผู้ค้า'}เรียบร้อยแล้ว สามารถพิมพ์ "เช็คยอด" เพื่อตรวจสอบยอดค่าเช่าได้ค่ะ`,
            size: 'sm',
            color: '#4A3B32',
            wrap: true
          }
        ]
      }
    }
  };
}

/**
 * Builds Flex Message for Merchant Monthly Contracts & Balances
 */
export function buildFlexContractSummary({ customerName, phone, contracts = [], liffUrl }) {
  const targetUrl = liffUrl || 'https://liff.line.me/2008895416-VNkDCPju';
  const weekdayNames = { 0: 'วันอาทิตย์', 3: 'วันพุธ', 5: 'วันศุกร์', 6: 'วันเสาร์' };
  const currency = value => Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const formatReceiptDate = value => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', year: 'numeric'
      });
  };
  const bubbles = contracts.slice(0, 12).map(contract => {
    const total = Number(contract.total_price || 0);
    const paid = Number(contract.paid_amount || 0);
    const remaining = Math.max(0, total - paid);
    const paymentPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : null;
    const paidDate = formatReceiptDate(contract.timestamp || contract.start_date);
    const daysByWeekday = new Map();
    const stallNames = String(contract.stalls || '').split(',').map(name => name.replace(/[\[\]]/g, '').trim()).filter(Boolean);
    let stallDetails = [];
    try {
      stallDetails = Array.isArray(contract.stall_details)
        ? contract.stall_details
        : JSON.parse(contract.stall_details || '[]');
    } catch (e) {}

    stallDetails.forEach(detail => {
      (Array.isArray(detail.days) ? detail.days : []).forEach(weekday => {
        if (!weekdayNames[weekday]) return;
        if (!daysByWeekday.has(weekday)) daysByWeekday.set(weekday, new Set());
        daysByWeekday.get(weekday).add(String(detail.name || '').replace(/[\[\]]/g, '').trim());
      });
    });

    if (daysByWeekday.size === 0) {
      const selectedDays = String(contract.selected_days || '').toLowerCase();
      const selectedMap = [
        [3, /wed|พุธ/], [5, /fri|ศุกร์/], [6, /sat|เสาร์/], [0, /sun|อาทิตย์/]
      ];
      selectedMap.forEach(([weekday, pattern]) => {
        if (pattern.test(selectedDays)) daysByWeekday.set(weekday, new Set(stallNames));
      });
    }

    const scheduleRows = [...daysByWeekday.entries()]
      .sort((a, b) => [3, 5, 6, 0].indexOf(a[0]) - [3, 5, 6, 0].indexOf(b[0]))
      .map(([weekday, stalls]) => {
        return `${weekdayNames[weekday]} ล็อค ${[...stalls].filter(Boolean).join(', ') || stallNames.join(', ') || '-'}`;
      });

    const itemRows = [];
    scheduleRows.forEach(schedule => itemRows.push({ label: schedule, amount: null }));
    itemRows.push({ label: 'ยอดค่าเช่าตามสัญญารายเดือน', amount: total });

    const receiptLine = (label, value, options = {}) => ({
      type: 'box',
      layout: 'horizontal',
      margin: options.margin || 'xs',
      contents: [
        { type: 'text', text: label, size: options.size || 'xs', color: options.color || '#333333', flex: 7, wrap: true, weight: options.weight || 'regular' },
        { type: 'text', text: value, size: options.size || 'xs', color: options.valueColor || options.color || '#222222', flex: 4, align: 'end', weight: options.valueWeight || options.weight || 'regular', wrap: true }
      ]
    });

    const bodyContents = [
      { type: 'text', text: 'ข้อมูลตอบกลับจากระบบ', size: 'xxs', color: '#777777' },
      { type: 'text', text: 'ใบสรุปยอดค่าเช่ารายเดือน', size: 'md', weight: 'bold', color: '#222222', margin: 'xs' },
      receiptLine('เลขที่สัญญา :', contract.id || '-', { size: 'xxs' }),
      receiptLine('วันที่ทำรายการ :', paidDate, { size: 'xxs' }),
      receiptLine('ประจำเดือน :', formatThaiMonth(contract.booking_month), { weight: 'bold', valueWeight: 'bold' }),
      receiptLine('ผู้จอง :', contract.booker_name || customerName || '-', { valueColor: '#8B4513', valueWeight: 'bold' }),
      receiptLine(contract.customer_type === 'Room' ? 'ประเภท :' : 'สินค้า :', contract.customer_type === 'Room' ? 'ห้องเช่า/ห้องพัก' : contract.product || 'ของชำทั่วไป', { valueWeight: 'bold' }),
      ...(phone ? [receiptLine('เบอร์โทร :', `••••${phone.slice(-4)}`, { size: 'xxs' })] : []),
      { type: 'separator', margin: 'sm', color: '#B8BEC8' },
      ...itemRows.flatMap(item => [
        item.amount === null
          ? { type: 'text', text: item.label, size: 'xs', color: '#16803C', weight: 'bold', margin: 'sm', wrap: true }
          : receiptLine(item.label, currency(item.amount), { weight: 'bold' })
      ]),
      { type: 'separator', margin: 'sm', color: '#B8BEC8' },
      receiptLine('รวมเป็นเงินทั้งสิ้น :', currency(total), { weight: 'bold', valueWeight: 'bold', valueColor: '#243F8F' }),
      receiptLine('ชำระแล้วรวมทั้งสิ้น :', currency(paid), { weight: 'bold', valueWeight: 'bold', valueColor: '#16803C' }),
      receiptLine('คิดเป็นเปอร์เซ็นต์ :', paymentPercent === null ? 'ยังไม่มียอด' : `${paymentPercent}%`, { weight: 'bold', valueWeight: 'bold', valueColor: '#2457E5' }),
      receiptLine('ค้างชำระ/คงเหลือ :', currency(remaining), { weight: 'bold', valueWeight: 'bold', valueColor: remaining > 0 ? '#B42318' : '#16803C' }),
      ...(total <= 0 ? [{
        type: 'text',
        text: 'ยอดสัญญายังไม่ถูกบันทึก กรุณาติดต่อเจ้าหน้าที่ตลาดเพื่อตรวจสอบค่ะ',
        size: 'xxs',
        color: '#A15C00',
        wrap: true,
        margin: 'sm'
      }] : [])
    ];

    return {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'xs',
        paddingAll: '16px',
        contents: bodyContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: { type: 'uri', label: '🔄 ตรวจสอบข้อมูลผู้ค้า', uri: targetUrl }
        }]
      }
    };
  });

  return {
          type: 'flex',
    altText: `ใบสรุปยอดค่าเช่ารายเดือน ร้าน ${customerName || ''}`,
    contents: bubbles.length > 1 ? { type: 'carousel', contents: bubbles } : bubbles[0]
  };
}

/*
 * Builds Flex Message for Registration Confirmation
 */
export function buildFlexRegistrationSuccess({ customerName, phone }) {
  return {
    type: 'flex',
    altText: 'ลงทะเบียนผู้ค้ารายเดือนสำเร็จ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#2E7D32',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'ตลาดนัดลาดสวายวินเทจ',
            color: '#C8E6C9',
            weight: 'bold',
            size: 'xs'
          },
          {
            type: 'text',
            text: '✓ ผูกบัญชีร้านค้าสำเร็จ',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        contents: [
          {
            type: 'text',
            text: `ยินดีต้อนรับคุณ ${customerName || 'ผู้ค้า'}`,
            weight: 'bold',
            size: 'md',
            color: '#1B5E20'
          },
          {
            type: 'text',
            text: `ระบบได้ทำการผูกบัญชี LINE นี้เข้ากับเบอร์โทร ${phone} เรียบร้อยแล้ว`,
            size: 'xs',
            color: '#4A3B32',
            wrap: true
          },
          {
            type: 'text',
            text: 'ท่านสามารถพิมพ์คำว่า "เช็คยอด" ในแชทนี้เพื่อตรวจสอบยอดได้ค่ะ',
            size: 'xs',
            color: '#5D4037',
            wrap: true,
            margin: 'sm'
          }
        ]
      }
    }
  };
}

/**
 * Builds Flex Message for Debt / Payment Reminder
 */
export function buildFlexDebtReminder({ customerName, phone, contracts = [], customNote = '' }) {
  const totalBalance = contracts.reduce((sum, c) => {
    const total = parseFloat(c.total_price || c.totalPrice || 0);
    const paid = parseFloat(c.paid_amount || c.paidAmount || 0);
    return sum + Math.max(0, total - paid);
  }, 0);

  const contractItems = contracts.map(c => {
    const total = parseFloat(c.total_price || c.totalPrice || 0);
    const paid = parseFloat(c.paid_amount || c.paidAmount || 0);
    const remaining = Math.max(0, total - paid);
    const rawMonth = c.booking_month || c.bookingMonth || c.month || '';
    const monthText = rawMonth.includes('-') ? formatThaiMonth(rawMonth) : rawMonth;
    const stallText = c.stalls || c.displayStalls || '-';

    return {
      type: 'box',
      layout: 'horizontal',
      margin: 'xs',
      contents: [
        {
          type: 'text',
          text: `• แผง ${stallText} (${monthText})`,
          size: 'xs',
          color: '#5D4037',
          flex: 3
        },
        {
          type: 'text',
          text: `${remaining.toLocaleString()} บ.`,
          size: 'xs',
          weight: 'bold',
          color: '#C62828',
          align: 'end',
          flex: 2
        }
      ]
    };
  });

  return {
    type: 'flex',
    altText: `⚠️ แจ้งเตือนยอดค้างชำระค่าเช่ารายเดือน ร้าน ${customerName || ''}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#C62828',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'ตลาดนัดลาดสวายวินเทจ',
            color: '#FFCDD2',
            weight: 'bold',
            size: 'xs'
          },
          {
            type: 'text',
            text: '⚠️ แจ้งเตือนยอดค่าเช่าคงค้าง',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'xs'
          },
          {
            type: 'text',
            text: `ร้าน: ${customerName || '-'} (โทร: ${phone || '-'})`,
            color: '#FFEBEE',
            size: 'xs',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        contents: [
          {
            type: 'text',
            text: 'เรียน ผู้ค้ารายเดือนตลาดนัดลาดสวายวินเทจ',
            size: 'xs',
            weight: 'bold',
            color: '#4A3B32'
          },
          {
            type: 'text',
            text: 'ระบบขอเรียนแจ้งยอดค่าเช่ารายเดือนที่ยังมียอดคงค้างตามรายละเอียดดังนี้ค่ะ:',
            size: 'xs',
            color: '#5D4037',
            wrap: true
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FFEBEE',
            cornerRadius: 'md',
            paddingAll: '10px',
            margin: 'sm',
            contents: [
              ...contractItems,
              {
                type: 'separator',
                margin: 'sm',
                color: '#EF9A9A'
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'ยอดค้างชำระรวมทั้งสิ้น:',
                    size: 'sm',
                    weight: 'bold',
                    color: '#B71C1C'
                  },
                  {
                    type: 'text',
                    text: `${totalBalance.toLocaleString()} บาท`,
                    size: 'sm',
                    weight: 'bold',
                    align: 'end',
                    color: '#B71C1C'
                  }
                ]
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FFF8E1',
            cornerRadius: 'md',
            paddingAll: '10px',
            margin: 'sm',
            contents: [
              {
                type: 'text',
                text: '📌 วิธีการชำระเงิน',
                weight: 'bold',
                size: 'xs',
                color: '#8B4513'
              },
              {
                type: 'text',
                text: 'ท่านสามารถโอนชำระเงินและส่งสลิปยืนยันเข้ามาในห้องแชท LINE นี้ หรือชำระที่สำนักงานตลาดได้เลยค่ะ',
                size: 'xxs',
                color: '#6D4C41',
                margin: 'xs',
                wrap: true
              }
            ]
          }
        ]
      }
    }
  };
}
