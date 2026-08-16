const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetAllData() {
  console.log('🚀 Starting system data cleanup...');

  const tablesToClear = [
    { name: 'bookings', col: 'id' },
    { name: 'monthly_bookings', col: 'id' },
    { name: 'transactions', col: 'id' },
    { name: 'storage', col: 'id' },
    { name: 'other_income', col: 'id' },
    { name: 'expenses', col: 'id' },
    { name: 'daily_closings', col: 'id' },
    { name: 'standby_waitlist', col: 'id' }
  ];

  for (const table of tablesToClear) {
    try {
      console.log(`🧹 Clearing table: ${table.name}...`);
      // Delete all records where col is not null
      const { error } = await supabase
        .from(table.name)
        .delete()
        .neq(table.col, '00000000-0000-0000-0000-000000000000');

      if (error) {
        const { error: err2 } = await supabase
          .from(table.name)
          .delete()
          .not(table.col, 'is', null);
        
        if (err2) {
          console.error(`⚠️ Error clearing ${table.name}:`, err2.message);
        } else {
          console.log(`✅ Cleared ${table.name} successfully`);
        }
      } else {
        console.log(`✅ Cleared ${table.name} successfully`);
      }
    } catch (e) {
      console.error(`❌ Exception on ${table.name}:`, e.message);
    }
  }

  console.log('\n📊 Verifying table row counts...');
  for (const table of tablesToClear) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❓ Table '${table.name}': Error checking count (${error.message})`);
    } else {
      console.log(`✨ Table '${table.name}': Remaining rows = ${count}`);
    }
  }

  // Check preserved tables
  const { count: stallsCount } = await supabase.from('stalls').select('*', { count: 'exact', head: true });
  console.log(`🔒 Preserved Table 'stalls': ${stallsCount} rows (Intact)`);

  const { count: adminCount } = await supabase.from('admin_roles').select('*', { count: 'exact', head: true });
  console.log(`🔒 Preserved Table 'admin_roles': ${adminCount} rows (Intact)`);

  console.log('\n🎉 System data reset completed successfully!');
}

resetAllData();
