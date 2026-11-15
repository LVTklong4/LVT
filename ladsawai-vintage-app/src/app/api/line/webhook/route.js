import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  verifyLineSignature,
  replyLineMessage,
  buildFlexAlreadyRegistered,
  buildFlexUnregistered,
  buildFlexContractSummary,
  getBookingMonthKey,
  getBangkokCurrentMonthKey,
  normalizeThaiPhoneNumber
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

    const liffId = '2008895416-VNkDCPju';
    const liffUrl = `https://liff.line.me/${liffId}`;
    const supabaseAdmin = getSupabaseAdmin();

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
          if (!supabaseAdmin) {
            await replyLineMessage(replyToken, [{
              type: 'text',
              text: 'ระบบกำลังปรับปรุงการเชื่อมต่อ กรุณาลองใหม่ภายหลังค่ะ'
            }]);
            continue;
          }

          const { data: lineUser, error: userError } = await supabaseAdmin
            .from('line_users')
            .select('display_name')
            .eq('line_user_id', userId)
            .maybeSingle();

          if (userError) {
            console.error('[LINE Webhook] Error checking registration:', userError);
            await replyLineMessage(replyToken, [{
              type: 'text',
              text: 'ขออภัยค่ะ ระบบตรวจสอบข้อมูลไม่สำเร็จ กรุณาลองใหม่ภายหลังค่ะ'
            }]);
            continue;
          }

          await replyLineMessage(replyToken, [
            lineUser ? buildFlexAlreadyRegistered(lineUser.display_name) : buildFlexUnregistered(liffUrl)
          ]);
          continue;
        }

        if (isCheckBalance) {
          if (!supabaseAdmin) {
            console.error('[LINE Webhook] SUPABASE_SERVICE_ROLE_KEY is not configured.');
            await replyLineMessage(replyToken, [{
              type: 'text',
              text: 'ระบบกำลังปรับปรุงการเชื่อมต่อ กรุณาลองใหม่ภายหลังค่ะ'
            }]);
            continue;
          }

          // Look up user in line_users table
          const { data: lineUser, error: userError } = await supabaseAdmin
            .from('line_users')
            .select('*')
            .eq('line_user_id', userId)
            .maybeSingle();

          if (userError) {
            console.error('[LINE Webhook] Error reading linked account:', userError);
            await replyLineMessage(replyToken, [{
              type: 'text',
              text: 'ขออภัยค่ะ ระบบตรวจสอบข้อมูลไม่สำเร็จ กรุณาลองใหม่ภายหลังค่ะ'
            }]);
            continue;
          }

          if (!lineUser) {
            // Unregistered: Prompt to bind phone number
            await replyLineMessage(replyToken, [buildFlexUnregistered(liffUrl)]);
            continue;
          }

          // Registered: Query monthly bookings for this phone number
          const cleanPhone = normalizeThaiPhoneNumber(lineUser.phone);
          const { data: bookings, error: bError } = await supabaseAdmin
            .from('monthly_bookings')
            .select('id, booker_name, phone, stalls, booking_month, total_price, paid_amount, status, customer_type');

          if (bError || !bookings) {
            console.error('[LINE Webhook] Error reading monthly contracts:', bError);
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
            return normalizeThaiPhoneNumber(b.phone) === cleanPhone;
          });

          const currentMonthKey = getBangkokCurrentMonthKey();
          const relevantContracts = matchedContracts
            .filter(contract => {
              if (contract.status === 'ยกเลิก' || contract.customer_type === 'Regular') return false;

              const total = Number(contract.total_price || 0);
              const paid = Number(contract.paid_amount || 0);
              const remaining = Math.max(0, total - paid);
              const monthKey = getBookingMonthKey(contract.booking_month);
              return remaining > 0 || (monthKey && monthKey >= currentMonthKey);
            })
            .sort((a, b) => getBookingMonthKey(b.booking_month).localeCompare(getBookingMonthKey(a.booking_month)));

          if (relevantContracts.length === 0) {
            await replyLineMessage(replyToken, [
              {
                type: 'text',
                text: `เรียนคุณ ${lineUser.display_name || 'ผู้ค้า'} 🙏\n\nบัญชีของท่านลงทะเบียนแล้ว แต่ยังไม่พบสัญญารายเดือนที่เปิดใช้งานหรือมียอดค้างชำระค่ะ หากข้อมูลไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่ตลาด`
              }
            ]);
            continue;
          }

          // Render current contracts and outstanding prior months in newest-first order.
          const customerName = relevantContracts[0]?.booker_name || lineUser.display_name;

          const flexMsg = buildFlexContractSummary({
            customerName,
            phone: lineUser.phone,
            contracts: relevantContracts,
            liffUrl
          });

          await replyLineMessage(replyToken, [flexMsg]);
          continue;
        }

        // Ignore other messages so free-form customer messages are not auto-replied to.
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
