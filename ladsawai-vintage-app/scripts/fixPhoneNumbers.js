const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function normalizePhone(phoneStr) {
  if (!phoneStr) return '';
  let clean = String(phoneStr).trim().replace(/[^0-9]/g, '');
  if (clean.length === 9 && !clean.startsWith('0')) {
    return '0' + clean;
  }
  if (clean.length === 8 && !clean.startsWith('0')) {
    return '0' + clean;
  }
  return clean || phoneStr;
}

async function fixPhoneNumbers() {
  console.log('🚀 Starting Fast Batch Phone Number Fix in Supabase...');

  const { data, error } = await supabase
    .from('monthly_bookings')
    .select('*');

  if (error) {
    console.error('❌ Error fetching monthly bookings:', error.message);
    return;
  }

  const updates = [];
  for (const item of data) {
    if (!item.phone) continue;
    const formatted = normalizePhone(item.phone);
    if (formatted !== item.phone) {
      updates.push({
        ...item,
        phone: formatted
      });
    }
  }

  console.log(`🔧 Needs phone prefix fix: ${updates.length}/${data.length} records.`);

  const batchSize = 100;
  let updatedCount = 0;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { error: err } = await supabase.from('monthly_bookings').upsert(batch);
    if (!err) {
      updatedCount += batch.length;
    } else {
      console.error('Batch error:', err.message);
    }
  }

  console.log(`✅ Successfully fixed ${updatedCount} phone numbers in Supabase!`);
}

fixPhoneNumbers();
