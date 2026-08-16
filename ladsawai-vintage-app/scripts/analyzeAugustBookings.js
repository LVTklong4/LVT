const https = require('https');

const SHEET_ID_DAILY = '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I';

function fetchCsvWithSheetName(sheetName) {
  return new Promise((resolve) => {
    https.get(`https://docs.google.com/spreadsheets/d/${SHEET_ID_DAILY}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    });
  });
}

function parseCsv(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
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
  return rows;
}

// Normalize date into YYYY-MM-DD
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

async function analyzeAugustBookings() {
  console.log('🔍 Analyzing August Bookings Tab...');
  const csv = await fetchCsvWithSheetName('Bookings');
  const rows = parseCsv(csv);

  const augustBookings = [];
  const datesSet = new Set();
  const idMap = new Map();
  let duplicateIds = 0;
  const dateStallMap = new Map();
  let duplicateDateStalls = 0;

  for (const row of rows) {
    const id = row[0];
    const rawDate = row[1];
    const normalizedDate = normalizeDate(rawDate);
    const stall = row[2];

    if (normalizedDate.startsWith('2026-08')) {
      augustBookings.push(row);
      datesSet.add(normalizedDate);

      if (idMap.has(id)) {
        duplicateIds++;
      } else {
        idMap.set(id, row);
      }

      const key = `${normalizedDate}_${stall}`;
      if (dateStallMap.has(key)) {
        duplicateDateStalls++;
      } else {
        dateStallMap.set(key, true);
      }
    }
  }

  console.log(`✅ Total August Bookings found: ${augustBookings.length} records`);
  console.log(`📅 Distinct August Dates (${datesSet.size} days):`, Array.from(datesSet).sort());
  console.log(`🔑 Unique August IDs: ${idMap.size}`);
  console.log(`⚠️ Duplicate IDs: ${duplicateIds}`);
  console.log(`⚠️ Duplicate Date+Stall: ${duplicateDateStalls}`);
  console.log('\nSample August Bookings:');
  for (let i = 0; i < Math.min(augustBookings.length, 3); i++) {
    console.log(augustBookings[i].slice(0, 12));
  }
}

analyzeAugustBookings();
