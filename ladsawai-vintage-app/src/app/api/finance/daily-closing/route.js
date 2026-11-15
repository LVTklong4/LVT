import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const prevToDate = searchParams.get('prevToDate');

    const client = getSupabaseAdmin() || supabase;

    if (date) {
      const { data, error } = await client
        .from('daily_closings')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (prevToDate) {
      const { data, error } = await client
        .from('daily_closings')
        .select('*')
        .lt('date', prevToDate)
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;
      return NextResponse.json({ success: true, data: data?.[0] || null });
    }

    const { data, error } = await client
      .from('daily_closings')
      .select('date, status, closed_at')
      .order('date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Daily Closing GET Exception]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { closingObj } = body;

    if (!closingObj || !closingObj.date) {
      return NextResponse.json({ success: false, error: 'Missing closingObj or date' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();
    const client = adminClient || supabase;

    const { data, error } = await client
      .from('daily_closings')
      .upsert([closingObj], { onConflict: 'date' })
      .select();

    if (error) {
      console.error('[Daily Closing Upsert Error]', error);
      throw error;
    }

    return NextResponse.json({ success: true, data: data?.[0] || closingObj });
  } catch (err) {
    console.error('[Daily Closing POST Exception]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
