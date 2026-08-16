const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectBookings() {
  const { data, count, error } = await supabase.from('bookings').select('*', { count: 'exact' });
  console.log('Total bookings in Supabase:', count);
  if (data && data.length > 0) {
    const dates = Array.from(new Set(data.map(b => b.date)));
    console.log('Sample distinct dates in bookings table:', dates.slice(0, 15));
    console.log('Sample booking record:', data[0]);
  }
}

inspectBookings();
