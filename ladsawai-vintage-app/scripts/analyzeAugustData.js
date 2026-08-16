const https = require('https');

const SHEET_IDS = {
  DAILY: '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I',
  MONTHLY: '1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE',
  FINANCE: '1Xp-QrcyR-f5AnRcfOO7nb-sLoneqK31zI1daQgCmNrU'
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

async function analyzeAugustData() {
  console.log('🔍 Starting Deep Dry-Run Analysis for August 2026 Data...');

  // 1. Analyze Monthly Sheet
  const monthlyCsv = await fetchCsv(SHEET_IDS.MONTHLY);
  const monthlyParsed = parseCsv(monthlyCsv);
  console.log(`\n--- 1. Monthly Sheet (Total rows: ${monthlyParsed.rows.length}) ---`);
  
  const augMonthlyRows = [];
  const monthlyIds = new Map();
  const monthlyDuplicateCount = { exact: 0, byId: 0, byNameAndStall: 0 };
  const stallNameMap = new Map();

  for (const row of monthlyParsed.rows) {
    const id = row[0];
    const startDate = row[2] || '';
    const bookerName = row[3] || '';
    const stalls = row[4] || '';
    const bookingMonth = row[13] || '';

    // Check if August (2026-08 or starting in 2026-08 or containing สิงหาคม)
    const isAugust = bookingMonth.includes('2026-08') || 
                     bookingMonth.includes('สิงหาคม') ||
                     startDate.includes('2026-08') || 
                     startDate.includes('08/2026') ||
                     startDate.includes('/08/26');

    if (isAugust) {
      augMonthlyRows.push(row);
      
      // Check ID duplicate
      if (monthlyIds.has(id)) {
        monthlyDuplicateCount.byId++;
      } else {
        monthlyIds.set(id, row);
      }

      // Check Booker + Stall duplicate
      const key = `${bookerName}_${stalls}`;
      if (stallNameMap.has(key)) {
        monthlyDuplicateCount.byNameAndStall++;
      } else {
        stallNameMap.set(key, true);
      }
    }
  }

  console.log(`✅ August Monthly Tenants found: ${augMonthlyRows.length} records`);
  console.log(`🔑 Unique August IDs: ${monthlyIds.size}`);
  console.log(`⚠️ Duplicate IDs in Sheet: ${monthlyDuplicateCount.byId}`);
  console.log(`⚠️ Duplicate Booker+Stall: ${monthlyDuplicateCount.byNameAndStall}`);

  // 2. Analyze Daily Sheet
  const dailyCsv = await fetchCsv(SHEET_IDS.DAILY);
  const dailyParsed = parseCsv(dailyCsv);
  console.log(`\n--- 2. Daily Sheet (Total rows: ${dailyParsed.rows.length}) ---`);
  
  const augDailyRows = [];
  const dailyIds = new Map();
  const dailyDuplicateCount = { byId: 0, byDateAndStall: 0 };
  const dailyStallDateMap = new Map();
  const distinctAugustDates = new Set();

  for (const row of dailyParsed.rows) {
    const id = row[0];
    const date = row[1] || '';
    const stallName = row[2] || '';
    const bookerName = row[3] || '';

    const isAugust = date.includes('2026-08') || date.includes('/08/2026') || date.includes('ส.ค.');
    if (isAugust) {
      augDailyRows.push(row);
      distinctAugustDates.add(date);

      if (dailyIds.has(id)) {
        dailyDuplicateCount.byId++;
      } else {
        dailyIds.set(id, row);
      }

      const key = `${date}_${stallName}`;
      if (dailyStallDateMap.has(key)) {
        dailyDuplicateCount.byDateAndStall++;
      } else {
        dailyStallDateMap.set(key, true);
      }
    }
  }

  console.log(`✅ August Daily Bookings found: ${augDailyRows.length} records`);
  console.log(`📅 Distinct August Dates:`, Array.from(distinctAugustDates));
  console.log(`🔑 Unique August Daily IDs: ${dailyIds.size}`);
  console.log(`⚠️ Duplicate IDs in Daily Sheet: ${dailyDuplicateCount.byId}`);
  console.log(`⚠️ Duplicate Date+Stall in Daily Sheet: ${dailyDuplicateCount.byDateAndStall}`);

  // 3. Analyze Finance Sheet
  const financeCsv = await fetchCsv(SHEET_IDS.FINANCE);
  const financeParsed = parseCsv(financeCsv);
  console.log(`\n--- 3. Finance Sheet (Total rows: ${financeParsed.rows.length}) ---`);

  const augFinanceRows = [];
  const financeIds = new Map();
  const financeDuplicateCount = { byId: 0 };

  for (const row of financeParsed.rows) {
    const id = row[0];
    const date = row[2] || '';

    const isAugust = date.includes('2026-08') || date.includes('/08/2026') || date.includes('ส.ค.');
    if (isAugust) {
      augFinanceRows.push(row);
      if (financeIds.has(id)) {
        financeDuplicateCount.byId++;
      } else {
        financeIds.set(id, row);
      }
    }
  }

  console.log(`✅ August Financial Transactions found: ${augFinanceRows.length} records`);
  console.log(`🔑 Unique August Txn IDs: ${financeIds.size}`);
  console.log(`⚠️ Duplicate IDs in Finance Sheet: ${financeDuplicateCount.byId}`);
}

analyzeAugustData();
