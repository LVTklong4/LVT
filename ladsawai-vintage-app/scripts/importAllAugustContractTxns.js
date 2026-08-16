const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vzdqdokpewvxeilggwjp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHFkb2twZXd2eGVpbGdnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDAxNDYsImV4cCI6MjA5NjkxNjE0Nn0.gfuav4op1NeTnDtFATFyT063L4fQfEkg6C_oFQKJvfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHEET_IDS = {
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

async function batchUpsert(tableName, items, batchSize = 100) {
  let count = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(batch);
    if (error) {
      console.warn(`⚠️ Batch upsert error on ${tableName}:`, error.message);
    } else {
      count += batch.length;
    }
  }
  return count;
}

async function importAllAugustRelatedTransactions() {
  console.log('🚀 1. Fetching August Tenant IDs...');
  const monthlyCsv = await fetchCsvFollowRedirect(`https://docs.google.com/spreadsheets/d/${SHEET_IDS.MONTHLY}/export?format=csv`);
  const monthlyRows = parseCsvAdvanced(monthlyCsv);

  const augustBookingIds = new Set();
  for (let i = 1; i < monthlyRows.length; i++) {
    const r = monthlyRows[i];
    const monthCol = r[13] || '';
    const startDate = r[2] || '';
    const isAugust = monthCol.includes('2026-08') || monthCol.includes('สิงหาคม') || startDate.includes('2026-08');
    if (isAugust && r[0]) {
      augustBookingIds.add(r[0]);
    }
  }
  console.log(`Found ${augustBookingIds.size} August Monthly Tenant IDs.`);

  console.log('\n🚀 2. Fetching Finance_Data transactions...');
  const financeCsv = await fetchCsvFollowRedirect(`https://docs.google.com/spreadsheets/d/${SHEET_IDS.FINANCE}/export?format=csv`);
  const financeRows = parseCsvAdvanced(financeCsv);

  const itemsMap = new Map();
  for (let i = 1; i < financeRows.length; i++) {
    const row = financeRows[i];
    const id = row[0];
    if (!id || id === 'Txn ID') continue;

    const ref = row[1] || '';
    const date = row[2] || '';
    const isAugustDate = date.includes('2026-08') || date.includes('/08/2026') || date.includes('ส.ค.');

    // Include if transaction is tied to an August contract OR occurred in August 2026
    if (augustBookingIds.has(ref) || isAugustDate) {
      const totalAmount = parseFloat(row[4]) || 0;
      const stallAmt = parseFloat(row[8]) || 0;
      const elecAmt = parseFloat(row[9]) || 0;
      const storageAmt = parseFloat(row[10]) || 0;
      const note = row[6] || '';
      const officer = row[7] || 'System';

      itemsMap.set(id, {
        id: id,
        booking_ref: ref,
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
  }

  const uniqueItems = Array.from(itemsMap.values());
  const count = await batchUpsert('transactions', uniqueItems, 100);
  console.log(`✅ Successfully upserted ${count}/${uniqueItems.length} Complete August Related Transactions!`);

  // Verify Khun Lakkhana
  const { data: lakkhanaTxns } = await supabase
    .from('transactions')
    .select('*')
    .eq('booking_ref', 'BK-2607-7327-74')
    .order('date', { ascending: true });

  console.log('\n🔍 Verification: Khun Lakkhana Transactions in Supabase:', lakkhanaTxns);
}

importAllAugustRelatedTransactions();
