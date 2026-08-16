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

function fetchCsv(sheetId, sheetName = null) {
  return new Promise((resolve, reject) => {
    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    if (sheetName) {
      url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    }

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

function normalizePhone(phoneStr) {
  if (!phoneStr) return '';
  let clean = String(phoneStr).trim().replace(/[^0-9]/g, '');
  if (clean.length === 9 && !clean.startsWith('0')) return '0' + clean;
  if (clean.length === 8 && !clean.startsWith('0')) return '0' + clean;
  return clean || phoneStr;
}

function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return dateStr;
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

async function clearExistingData() {
  console.log('🧹 1. Clearing existing tables in Supabase (Clean Reset)...');
  await supabase.from('transactions').delete().neq('id', 'DUMMY_RESET');
  await supabase.from('bookings').delete().neq('id', 'DUMMY_RESET');
  await supabase.from('monthly_bookings').delete().neq('id', 'DUMMY_RESET');
  console.log('✅ Cleared all 3 tables.');
}

async function migrateAugustMonthly() {
  console.log('\n🚀 2. Migrating August 2026 Monthly Tenants (monthly_bookings)...');
  const csvText = await fetchCsv(SHEET_IDS.MONTHLY);
  const parsed = parseCsv(csvText);

  if (parsed.error) return 0;

  const itemsMap = new Map();
  for (const row of parsed.rows) {
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
      booking_month: '2026-08',
      phone: phoneFormatted,
      customer_type: row[16] || 'Standard'
    });
  }

  const uniqueItems = Array.from(itemsMap.values());
  const count = await batchUpsert('monthly_bookings', uniqueItems);
  console.log(`✅ Migrated ${count}/${uniqueItems.length} August Monthly Tenants.`);
  return count;
}

async function migrateAugustDaily() {
  console.log('\n🚀 3. Migrating August 2026 Daily Bookings (bookings)...');
  const csvText = await fetchCsv(SHEET_IDS.DAILY, 'Bookings');
  const parsed = parseCsv(csvText);

  if (parsed.error) return 0;

  // Deduplicate by Date + StallName to get the absolute latest status per stall
  const itemsMap = new Map();
  let rowIdx = 0;
  for (const row of parsed.rows) {
    const rawDate = row[1] || '';
    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate.startsWith('2026-08')) continue;

    rowIdx++;
    const masterId = row[0] || '';
    const stallName = row[2] || '';
    const bookerName = row[3] || 'ไม่ระบุชื่อ';
    const product = row[4] || '';
    const type = row[5] || 'รายวัน';
    const elecUnit = parseFloat(row[6]) || 0;
    const elecPrice = parseFloat(row[7]) || 0;
    const stallPrice = parseFloat(row[8]) || 0;
    const totalPrice = parseFloat(row[9]) || 0;
    const paymentMethod = row[10] || 'Cash';
    const status = row[11] || 'ชำระแล้ว';
    const note = row[12] || '';
    const storageFee = parseFloat(row[15]) || 0;

    const key = `${normalizedDate}_${stallName}`;
    const cleanStall = stallName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanDate = normalizedDate.replace(/-/g, '');
    const uniqueId = `BK-${cleanDate}-${cleanStall || 'S'}-${rowIdx}`;

    itemsMap.set(key, {
      id: uniqueId,
      date: normalizedDate,
      stall_name: stallName,
      stall_id: stallName,
      booker_name: bookerName,
      customer_name: bookerName,
      product: product,
      type: type,
      elec_unit: elecUnit,
      elec_price: elecPrice,
      stall_price: stallPrice,
      total_price: totalPrice,
      price: totalPrice,
      payment_method: paymentMethod,
      status: status,
      note: note,
      master_id: masterId,
      storage_fee: storageFee
    });
  }

  // Ensure unique ID array
  const idSeen = new Set();
  const uniqueItems = [];
  for (const item of itemsMap.values()) {
    if (!idSeen.has(item.id)) {
      idSeen.add(item.id);
      uniqueItems.push(item);
    }
  }

  const count = await batchUpsert('bookings', uniqueItems, 100);
  console.log(`✅ Migrated ${count}/${uniqueItems.length} August Daily Bookings.`);
  return count;
}

async function migrateAugustFinance() {
  console.log('\n🚀 4. Migrating August 2026 Financial Transactions (transactions)...');
  const csvText = await fetchCsv(SHEET_IDS.FINANCE);
  const parsed = parseCsv(csvText);

  if (parsed.error) return 0;

  const itemsMap = new Map();
  for (const row of parsed.rows) {
    const id = row[0];
    if (!id || id === 'Txn ID') continue;

    const date = row[2] || '';
    const isAugust = date.includes('2026-08') || date.includes('/08/2026') || date.includes('ส.ค.');
    if (!isAugust) continue;

    const totalAmount = parseFloat(row[4]) || 0;
    const stallAmt = parseFloat(row[8]) || 0;
    const elecAmt = parseFloat(row[9]) || 0;
    const storageAmt = parseFloat(row[10]) || 0;
    const note = row[6] || '';
    const officer = row[7] || 'Admin';

    itemsMap.set(id, {
      id: id,
      booking_ref: row[1] || '',
      date: date,
      category: row[3] || 'รายรับ',
      total_amount: totalAmount,
      method: row[5] || 'Cash',
      note: note,
      description: note,
      officer: officer,
      timestamp: new Date().toISOString(),
      stall_amt: stallAmt,
      elec_amt: elecAmt,
      storage_amt: storageAmt,
      bill_type: row[11] || '',
      slip_url: row[12] || ''
    });
  }

  const uniqueItems = Array.from(itemsMap.values());
  const count = await batchUpsert('transactions', uniqueItems, 100);
  console.log(`✅ Migrated ${count}/${uniqueItems.length} August Financial Transactions.`);
  return count;
}

async function main() {
  console.log('================= LVT AUGUST 2026 COMPLETE MIGRATION =================');
  await clearExistingData();
  const monthlyCount = await migrateAugustMonthly();
  const dailyCount = await migrateAugustDaily();
  const financeCount = await migrateAugustFinance();
  console.log('======================================================================');
  console.log(`🎉 Total Migrated: ${monthlyCount} Tenants, ${dailyCount} Daily Bookings, ${financeCount} Transactions!`);
}

main();
