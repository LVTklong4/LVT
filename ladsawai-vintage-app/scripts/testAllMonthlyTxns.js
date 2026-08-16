const https = require('https');

const SHEET_IDS = {
  MONTHLY: '1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE',
  FINANCE: '1Xp-QrcyR-f5AnRcfOO7nb-sLoneqK31zI1daQgCmNrU'
};

function fetchCsvFollowRedirect(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      }).on('error', reject);
    };
    request(url);
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

async function testAllMonthlyTxns() {
  const monthlyCsv = await fetchCsvFollowRedirect(SHEET_IDS.MONTHLY);
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
  console.log(`Found ${augustBookingIds.size} August Monthly Booking IDs.`);

  const financeCsv = await fetchCsvFollowRedirect(SHEET_IDS.FINANCE);
  const financeRows = parseCsvAdvanced(financeCsv);

  let matchedTxns = 0;
  const matchedList = [];
  for (let i = 1; i < financeRows.length; i++) {
    const r = financeRows[i];
    const txnId = r[0] || '';
    const ref = r[1] || '';
    const date = r[2] || '';
    const isAugustDate = date.includes('2026-08') || date.includes('/08/2026') || date.includes('ส.ค.');

    // Match if ref belongs to August tenants OR transaction date is in August
    if (augustBookingIds.has(ref) || isAugustDate) {
      matchedTxns++;
      matchedList.push({
        id: txnId,
        ref: ref,
        date: date,
        amount: r[4],
        category: r[3]
      });
    }
  }

  console.log(`Total Relevant Transactions found: ${matchedTxns}`);
  console.log('Sample matches for Lakkhana (BK-2607-7327-74):', 
    matchedList.filter(t => t.ref === 'BK-2607-7327-74')
  );
}

testAllMonthlyTxns();
