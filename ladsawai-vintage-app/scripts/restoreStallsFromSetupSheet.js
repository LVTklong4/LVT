const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHEET_ID_SETUP = '1ax7ZepRoNfh564sF6gcyCWcNW80kY04Phc1CjoaCfbo';

function parseCsvLine(line) {
  const res = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      res.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  res.push(cur);
  return res;
}

async function restoreStalls() {
  console.log('🔄 Fetching Stalls from Master Setup Sheet...');
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_SETUP}/gviz/tq?tqx=out:csv&sheet=Stalls`;
  const res = await fetch(url);
  const csvText = await res.text();
  const lines = csvText.split('\n');

  const stalls = [];
  const names = new Set();

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = parseCsvLine(lines[i]);
    const rawName = row[0] || '';
    const cleanName = rawName.replace(/[\[\]]/g, '').trim();
    if (!cleanName) continue;

    if (names.has(cleanName)) continue;
    names.add(cleanName);

    stalls.push({
      name: cleanName,
      row: parseInt(row[1]) || 0,
      col: parseInt(row[2]) || 0,
      type: String(row[3] || '').trim(),
      price_wed: parseFloat(row[4]) || 0,
      price_sat: parseFloat(row[5]) || 0,
      price_sun: parseFloat(row[6]) || 0,
      price_month: parseFloat(row[7]) || 0
    });
  }

  console.log(`🚀 Restoring ${stalls.length} stalls into Supabase table 'stalls'...`);

  for (let i = 0; i < stalls.length; i += 50) {
    const chunk = stalls.slice(i, i + 50);
    const { error } = await supabase.from('stalls').upsert(chunk);
    if (error) {
      console.error('Error upserting chunk:', error.message);
      throw error;
    }
  }

  const { count, error: countErr } = await supabase.from('stalls').select('*', { count: 'exact', head: true });
  if (countErr) throw countErr;
  console.log(`✅ Restoration Complete! Total stalls now in Supabase: ${count}`);
}

restoreStalls().catch(e => {
  console.error('❌ Failed to restore stalls:', e);
  process.exit(1);
});
