import crypto from 'crypto';

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
  if (!yearMonthStr) return '';
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiYear = parseInt(yearStr, 10) + 543;
  return `${monthNames[monthIdx] || yearMonthStr} ${thaiYear}`;
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

/**
 * Builds Flex Message for Merchant Monthly Contracts & Balances
 */
export function buildFlexContractSummary({ customerName, phone, contracts = [], liffUrl }) {
  const targetUrl = liffUrl || 'https://liff.line.me/2008895416-VNkDCPju';
  const totalBalance = contracts.reduce((sum, c) => {
    const total = parseFloat(c.total_price || 0);
    const paid = parseFloat(c.paid_amount || 0);
    return sum + Math.max(0, total - paid);
  }, 0);

  const contractBoxes = contracts.map((c, idx) => {
    const total = parseFloat(c.total_price || 0);
    const paid = parseFloat(c.paid_amount || 0);
    const remaining = Math.max(0, total - paid);
    const isPaid = remaining <= 0;

    return {
      type: 'box',
      layout: 'vertical',
      backgroundColor: idx % 2 === 0 ? '#FAF0E6' : '#FFFFFF',
      cornerRadius: 'md',
      paddingAll: '10px',
      margin: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `แผง ${c.stalls || '-'}`,
              weight: 'bold',
              size: 'sm',
              color: '#5D4037'
            },
            {
              type: 'text',
              text: isPaid ? 'ชำระแล้ว' : `ค้างชำระ ${remaining.toLocaleString()} บ.`,
              align: 'end',
              weight: 'bold',
              size: 'xs',
              color: isPaid ? '#2E7D32' : '#C62828'
            }
          ]
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'xs',
          contents: [
            {
              type: 'text',
              text: `รอบเดือน: ${formatThaiMonth(c.booking_month)}`,
              size: 'xxs',
              color: '#8D6E63'
            },
            {
              type: 'text',
              text: `ยอดเต็ม: ${total.toLocaleString()} บ. (จ่ายแล้ว ${paid.toLocaleString()} บ.)`,
              align: 'end',
              size: 'xxs',
              color: '#8D6E63'
            }
          ]
        }
      ]
    };
  });

  return {
    type: 'flex',
    altText: `สรุปยอดค่าเช่ารายเดือน ร้าน ${customerName || ''}`,
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
            text: 'สรุปยอดค่าเช่ารายเดือน',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            margin: 'xs'
          },
          {
            type: 'text',
            text: `ร้าน: ${customerName || '-'} (โทร: ${phone || '-'})`,
            color: '#D7CCC8',
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
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'สถานะยอดชำระรวม:',
                size: 'sm',
                weight: 'bold',
                color: '#4A3B32'
              },
              {
                type: 'text',
                text: totalBalance > 0 ? `ค้างชำระ ${totalBalance.toLocaleString()} บาท` : 'ชำระครบถ้วนแล้ว ✓',
                align: 'end',
                weight: 'bold',
                size: 'sm',
                color: totalBalance > 0 ? '#C62828' : '#2E7D32'
              }
            ]
          },
          {
            type: 'separator',
            margin: 'sm',
            color: '#D7CCC8'
          },
          ...contractBoxes,
          ...(totalBalance > 0 ? [
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#FFF8E1',
              cornerRadius: 'md',
              paddingAll: '10px',
              margin: 'md',
              contents: [
                {
                  type: 'text',
                  text: '📌 ข้อมูลการโอนชำระเงิน',
                  weight: 'bold',
                  size: 'xs',
                  color: '#8B4513'
                },
                {
                  type: 'text',
                  text: 'กรุณาชำระเงินและส่งสลิปยืนยันในห้องแชทนี้ได้เลยค่ะ',
                  size: 'xxs',
                  color: '#6D4C41',
                  margin: 'xs'
                }
              ]
            }
          ] : [])
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'xs',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🔄 ตรวจสอบข้อมูลผู้ค้า',
              uri: targetUrl
            }
          }
        ]
      }
    }
  };
}

/**
 * Builds Flex Message for Registration Confirmation
 */
export function buildFlexRegistrationSuccess({ customerName, phone, contractsCount = 0 }) {
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
            text: `พบข้อมูลสัญญาในระบบทั้งหมด ${contractsCount} รายการ ท่านสามารถพิมพ์คำว่า "เช็คยอด" ในแชทนี้ได้ตลอด 24 ชั่วโมงค่ะ`,
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
