const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHEET_IDS = {
  MONTHLY: '1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE'
};

function fetchCsv(sheetId) {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      }).on('error', (err) => { reject(err); });
    };

    request(url);
  });
}

function parseCsv(csvText) {
  if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('html>')) {
    return { error: 'Sheet is private.' };
  }

  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return { rows: [] };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    const row = [];
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      const val = match[1] !== undefined ? match[1] : match[2];
      if (val !== undefined) row.push(val.trim());
    }
    if (row.length > 0) rows.push(row);
  }

  return { rows };
}

async function batchUpsert(tableName, items, batchSize = 200) {
  let count = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(batch);
    if (error) {
      console.warn(`⚠️ Batch upsert warning on ${tableName} (${i}-${i+batch.length}):`, error.message);
    } else {
      count += batch.length;
    }
  }
  return count;
}

function extractBookingMonth(row) {
  if (row[13] && row[13].trim() !== '') {
    const bm = row[13].trim();
    if (bm.match(/^\d{4}-\d{2}/)) return bm.substring(0, 7);
  }
  if (row[2] && row[2].trim() !== '') {
    const sd = row[2].trim();
    if (sd.match(/^\d{4}-\d{2}/)) return sd.substring(0, 7);
    if (sd.includes('/')) {
      const parts = sd.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`;
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
      }
    }
  }
  return new Date().toISOString().substring(0, 7);
}

// MIGRATE & TRANSFORM MONTHLY TENANTS WITH BOOKING_MONTH
async function migrateMonthlyTenants() {
  console.log('🚀 Transforming & Migrating Monthly Tenants with booking_month...');
  const csvText = await fetchCsv(SHEET_IDS.MONTHLY);
  const parsed = parseCsv(csvText);

  if (parsed.error) return;

  const itemsMap = new Map();
  for (const row of parsed.rows) {
    const id = row[0];
    if (!id || id === 'Booking ID') continue;

    const bookerName = row[3] || 'ไม่ระบุชื่อ';
    const totalPrice = parseFloat(row[8]) || 0;
    const paidAmount = parseFloat(row[9]) || 0;
    const bookingMonth = extractBookingMonth(row);

    itemsMap.set(id, {
      id: id,
      timestamp: row[1] || new Date().toISOString(),
      start_date: row[2] || '',
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
      booking_month: bookingMonth,       // POPULATING BOOKING_MONTH
      phone: row[14] || '',
      customer_type: row[16] || 'Standard'
    });
  }

  const uniqueItems = Array.from(itemsMap.values());
  const count = await batchUpsert('monthly_bookings', uniqueItems);
  console.log(`✅ Successfully updated ${count}/${uniqueItems.length} monthly tenants with booking_month!`);
}

async function main() {
  console.log('================= LVT MONTHLY BOOKING MONTH RE-SYNC =================');
  await migrateMonthlyTenants();
  console.log('====================================================================');
}

main();
