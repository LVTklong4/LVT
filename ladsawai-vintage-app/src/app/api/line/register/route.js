import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pushLineMessage, buildFlexRegistrationSuccess } from '@/services/line/lineService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { lineUserId, phone, displayName, pictureUrl } = body;

    if (!lineUserId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุ LINE User ID' }, { status: 400 });
    }

    if (!phone || phone.trim().length < 9) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง' }, { status: 400 });
    }

    const cleanInputPhone = phone.replace(/[^0-9]/g, '');

    // 1. Verify that this phone number exists in monthly_bookings
    const { data: bookings, error: bError } = await supabase
      .from('monthly_bookings')
      .select('id, booker_name, phone, stalls, booking_month, total_price, paid_amount')
      .order('booking_month', { ascending: false });

    if (bError) throw bError;

    const matched = (bookings || []).filter(b => {
      if (!b.phone) return false;
      const bPhone = b.phone.replace(/[^0-9]/g, '');
      return bPhone === cleanInputPhone || bPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(bPhone);
    });

    if (matched.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'not_found',
        message: 'ไม่พบข้อมูลสัญญารายเดือนที่ตรงกับเบอร์โทรศัพท์นี้ กรุณาตรวจสอบเบอร์ที่เคยแจ้งไว้กับตลาด หรือติดต่อเจ้าหน้าที่ค่ะ'
      }, { status: 404 });
    }

    const primaryContract = matched[0];
    const customerName = primaryContract.booker_name || primaryContract.customer_name || displayName || 'ผู้ค้า';

    // 2. Upsert into line_users table
    const { error: upsertError } = await supabase
      .from('line_users')
      .upsert({
        line_user_id: lineUserId,
        phone: cleanInputPhone,
        display_name: displayName || customerName,
        picture_url: pictureUrl || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'line_user_id' });

    if (upsertError) {
      console.error('[LINE Register] Database Upsert Error:', upsertError);
      throw upsertError;
    }

    // 3. Send direct push confirmation message into LINE chat
    const flexSuccess = buildFlexRegistrationSuccess({
      customerName,
      phone: cleanInputPhone,
      contractsCount: matched.length
    });

    await pushLineMessage(lineUserId, [flexSuccess]);

    return NextResponse.json({
      success: true,
      message: 'ผูกบัญชีร้านค้าสำเร็จ',
      customerName,
      contractsCount: matched.length
    });
  } catch (err) {
    console.error('[LINE Register Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
