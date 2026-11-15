import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  verifyLineSignature,
  replyLineMessage,
  buildFlexUnregistered,
  buildFlexContractSummary
} from '@/services/line/lineService';

// Disable Next.js body parser to get raw text for HMAC verification
export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature');

    // 1. Verify Signature
    if (!verifyLineSignature(rawBody, signature)) {
      console.warn('[LINE Webhook] Invalid Signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const events = body.events || [];

    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    const liffUrl = liffId ? `https://liff.line.me/${liffId}` : '';

    // 2. Process each incoming event
    for (const event of events) {
      const userId = event.source?.userId;
      const replyToken = event.replyToken;

      // Skip redelivery / dummy events from LINE Webhook verification tool
      if (!replyToken || replyToken === '00000000000000000000000000000000') {
        continue;
      }

      // Handle Follow / Unblock
      if (event.type === 'follow') {
        await replyLineMessage(replyToken, [
          {
            type: 'text',
            text: 'สวัสดีค่ะ 🙏 ตลาดนัดลาดสวายวินเทจ ยินดีให้บริการค่ะ\n\nสำหรับผู้ค้ารายเดือน สามารถกดปุ่มเมนูด้านล่าง หรือพิมพ์คำว่า "เช็คยอด" เพื่อตรวจสอบข้อมูลค่าเช่าได้ตลอด 24 ชม. ค่ะ'
          },
          buildFlexUnregistered(liffUrl)
        ]);
        continue;
      }

      // Handle Text Message
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim();
        const lower = text.toLowerCase();

        // Keyword Match: เช็คยอด / ยอดค้าง / ค่าเช่า
        const isCheckBalance = 
          text.includes('เช็คยอด') || 
          text.includes('ยอดเงิน') || 
          text.includes('ค่าเช่า') || 
          text.includes('ยอดค้าง') || 
          text.includes('สัญญา') || 
          text.includes('บิล') || 
          lower === 'check';

        // Keyword Match: ลงทะเบียน / ผูกบัญชี
        const isRegister = 
          text.includes('ลงทะเบียน') || 
          text.includes('ผูกบัญชี') || 
          text.includes('สมัคร');

        if (isRegister) {
          await replyLineMessage(replyToken, [buildFlexUnregistered(liffUrl)]);
          continue;
        }

        if (isCheckBalance) {
          // Look up user in line_users table
          let { data: lineUser, error: userError } = await supabase
            .from('line_users')
            .select('*')
            .eq('line_user_id', userId)
            .maybeSingle();

          if (!lineUser || userError) {
            // Unregistered: Prompt to bind phone number
            await replyLineMessage(replyToken, [buildFlexUnregistered(liffUrl)]);
            continue;
          }

          // Registered: Query monthly bookings for this phone number
          const cleanPhone = lineUser.phone.replace(/[^0-9]/g, '');
          const { data: bookings, error: bError } = await supabase
            .from('monthly_bookings')
            .select('*')
            .order('booking_month', { ascending: false });

          if (bError || !bookings) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: 'ขออภัยค่ะ ระบบกำลังดึงข้อมูลสัญญารายเดือน กรุณาลองใหม่อีกครั้งในอีกสักครู่ค่ะ'
              }
            ]);
            continue;
          }

          // Match phone number (supporting variations with/without dashes)
          const matchedContracts = bookings.filter(b => {
            if (!b.phone) return false;
            const bPhone = b.phone.replace(/[^0-9]/g, '');
            return bPhone === cleanPhone || bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone);
          });

          if (matchedContracts.length === 0) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: `เรียนคุณ ${lineUser.display_name || 'ผู้ค้า'} 🙏\n\nระบบผูกกับเบอร์โทร ${lineUser.phone} เรียบร้อยแล้ว แต่ไม่พบสัญญารายเดือนที่เปิดใช้งานอยู่ในขณะนี้\n\nหากท่านเพิ่งทำสัญญาใหม่ หรือต้องการเปลี่ยนเบอร์โทรศัพท์ กรุณาติดต่อเจ้าหน้าที่ตลาดได้เลยค่ะ`
              }
            ]);
            continue;
          }

          // Render contract summary Flex Message (up to 5 most recent contracts)
          const topContracts = matchedContracts.slice(0, 5);
          const customerName = topContracts[0]?.booker_name || topContracts[0]?.customer_name || lineUser.display_name;

          const flexMsg = buildFlexContractSummary({
            customerName,
            phone: lineUser.phone,
            contracts: topContracts,
            liffUrl
          });

          await replyLineMessage(replyToken, [flexMsg]);
          continue;
        }

        // Default Auto-Reply for other greetings or questions
        await replyLineMessage(replyToken, [
          {
            type: 'text',
            text: 'สวัสดีค่ะ ตลาดนัดลาดสวายวินเทจยินดีให้บริการค่ะ 🏪\n\nต้องการตรวจสอบข้อมูลหรือทำรายการใด สามารถเลือกกดจากเมนูด้านล่าง หรือพิมพ์ได้เลยค่ะ:\n• พิมพ์ "เช็คยอด" เพื่อดูยอดค่าเช่า\n• พิมพ์ "ลงทะเบียน" เพื่อผูกเบอร์โทรศัพท์\n\nหากต้องการสอบถามเรื่องอื่นๆ สามารถพิมพ์ข้อความทิ้งไว้ แอดมินจะรีบมาตอบกลับนะคะ 🙏'
          }
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[LINE Webhook Handler Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'LINE Official Account Webhook endpoint is running.',
    account: '@ladsawaivintage'
  });
}
