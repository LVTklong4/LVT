const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHEET_IDS = {
  DAILY: '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I',
  MONTHLY: '1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE',
  FINANCE: '1Xp-QrcyR-f5AnRcfOO7nb-sLoneqK31zI1daQgCmNrU'
};

function fetchCsvFollowRedirect(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCsvFollowRedirect(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
}

function parseCsvAdvanced(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

function normalizePhone(phoneStr) {
  if (!phoneStr) return '';
  let clean = String(phoneStr).trim().replace(/[^0-9]/g, '');
  if (clean.length === 9 && !clean.startsWith('0')) return '0' + clean;
  if (clean.length === 8 && !clean.startsWith('0')) return '0' + clean;
  return clean || phoneStr;
}

async function batchUpsert(tableName, items, batchSize = 100) {
  let count = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(batch);
    if (error) {
      console.warn(`⚠️ Batch upsert error on ${tableName} (${i}-${i+batch.length}):`, error.message);
    } else {
      count += batch.length;
    }
  }
  return count;
}

async function updateMonthlyWithStallDetails() {
  console.log('\n🚀 Enriching monthly_bookings with Selected Days (Col M) and JSON (Col P)...');
  const csvText = await fetchCsvFollowRedirect(`https://docs.google.com/spreadsheets/d/${SHEET_IDS.MONTHLY}/export?format=csv`);
  const rows = parseCsvAdvanced(csvText);

  const itemsMap = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const id = row[0];
    if (!id || id === 'Booking ID') continue;

    const startDate = row[2] || '';
    const bookingMonthRaw = row[13] || '';
    const isAugust = bookingMonthRaw.includes('2026-08') || 
                     bookingMonthRaw.includes('สิงหาคม') ||
                     startDate.includes('2026-08') || 
                     startDate.includes('08/2026') ||
                     startDate.includes('/08/26');

    if (!isAugust) continue;

    const bookerName = row[3] || 'ไม่ระบุชื่อ';
    const totalPrice = parseFloat(row[8]) || 0;
    const paidAmount = parseFloat(row[9]) || 0;
    const phoneFormatted = normalizePhone(row[14]);
    const selectedDays = row[12] || '';
    const stallDetailsJson = row[15] || '[]';
    const customerType = row[16] || 'Standard';
    const storageFee = parseFloat(row[17]) || 0;

    itemsMap.set(id, {
      id: id,
      timestamp: new Date().toISOString(),
      start_date: startDate,
      booker_name: bookerName,
      customer_name: bookerName,
      stalls: row[4] || '',
      product: row[5] || '',
      status: row[6] || 'ค้างชำระ',
      elec_unit: parseFloat(row[7]) || 0,
      total_price: totalPrice,
      grand_total: totalPrice,
      paid_amount: paidAmount,
      total_paid: paidAmount,
      note: row[10] || '',
      payment_method: row[11] || '',
      selected_days: selectedDays,
      booking_month: '2026-08',
      phone: phoneFormatted,
      stall_details: stallDetailsJson,
      customer_type: customerType,
      storage_fee: storageFee
    });
  }

  const uniqueItems = Array.from(itemsMap.values());
  const count = await batchUpsert('monthly_bookings', uniqueItems);
  console.log(`✅ Successfully enriched all ${count}/${uniqueItems.length} August Monthly Tenants with Selected Days & JSON details!`);
}

updateMonthlyWithStallDetails();
