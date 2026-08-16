const https = require('https');

const SHEET_ID_MONTHLY = '1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE';

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

// Robust CSV Parser handling multi-line quoted JSON and nested commas
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

async function testParseMonthly() {
  const csv = await fetchCsvFollowRedirect(`https://docs.google.com/spreadsheets/d/${SHEET_ID_MONTHLY}/export?format=csv`);
  const rows = parseCsvAdvanced(csv);
  console.log('Total Advanced Parsed Rows:', rows.length);

  let augustCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const monthCol = r[13] || '';
    const startDate = r[2] || '';
    const isAugust = monthCol.includes('2026-08') || monthCol.includes('สิงหาคม') || startDate.includes('2026-08');

    if (isAugust) {
      augustCount++;
      if (augustCount <= 3) {
        console.log(`\n--- August Tenant #${augustCount} (${r[3]}) ---`);
        console.log('ID:', r[0]);
        console.log('Select Day (Col M):', r[12]);
        console.log('Json (Col P):', r[15]);
      }
    }
  }
  console.log(`\nTotal August Tenants found: ${augustCount}`);
}

testParseMonthly();
