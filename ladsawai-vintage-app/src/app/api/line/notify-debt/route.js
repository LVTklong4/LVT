import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pushLineMessage, buildFlexDebtReminder } from '@/services/line/lineService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { targets = [], customNote = '' } = body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาระบุรายชื่อผู้ค้าที่ต้องการส่งแจ้งเตือน'
      }, { status: 400 });
    }

    // 1. Fetch all registered line_users
    const { data: lineUsers, error: userError } = await supabase
      .from('line_users')
      .select('line_user_id, phone, display_name');

    if (userError) {
      console.error('[Notify Debt] Error fetching line_users:', userError);
      throw userError;
    }

    // Map phone -> lineUser
    const lineUserMap = new Map();
    (lineUsers || []).forEach(u => {
      const cleanPhone = (u.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone) {
        lineUserMap.set(cleanPhone, u);
      }
    });

    // 2. Group targets by phone
    const groupedByPhone = new Map();
    targets.forEach(t => {
      const cleanPhone = (t.phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone) return;

      if (!groupedByPhone.has(cleanPhone)) {
        groupedByPhone.set(cleanPhone, {
          phone: t.phone,
          customerName: t.customerName || t.bookerName || 'ผู้ค้า',
          items: []
        });
      }
      groupedByPhone.get(cleanPhone).items.push(t);
    });

    const results = [];
    let sentCount = 0;
    let unregisteredCount = 0;
    let failedCount = 0;

    // 3. Process each merchant
    for (const [cleanPhone, merchant] of groupedByPhone.entries()) {
      // Find matching LINE user
      let matchedLineUser = lineUserMap.get(cleanPhone);
      if (!matchedLineUser) {
        // Try loose matching (last 9 digits)
        for (const [regPhone, u] of lineUserMap.entries()) {
          if (regPhone.endsWith(cleanPhone) || cleanPhone.endsWith(regPhone)) {
            matchedLineUser = u;
            break;
          }
        }
      }

      if (!matchedLineUser) {
        unregisteredCount++;
        results.push({
          phone: merchant.phone,
          customerName: merchant.customerName,
          status: 'UNREGISTERED',
          message: 'ยังไม่ได้ผูกบัญชี LINE'
        });
        continue;
      }

      // Build Flex Message for debt reminder
      const flexMsg = buildFlexDebtReminder({
        customerName: merchant.customerName || matchedLineUser.display_name,
        phone: merchant.phone,
        contracts: merchant.items,
        customNote
      });

      // Send Push Message
      const sendRes = await pushLineMessage(matchedLineUser.line_user_id, flexMsg);

      if (sendRes.success) {
        sentCount++;
        results.push({
          phone: merchant.phone,
          customerName: merchant.customerName,
          status: 'SENT',
          lineUserId: matchedLineUser.line_user_id
        });
      } else {
        failedCount++;
        results.push({
          phone: merchant.phone,
          customerName: merchant.customerName,
          status: 'FAILED',
          error: sendRes.error || 'LINE Push Error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalTargets: groupedByPhone.size,
      sentCount,
      unregisteredCount,
      failedCount,
      results
    });
  } catch (err) {
    console.error('[Notify Debt Exception]', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
