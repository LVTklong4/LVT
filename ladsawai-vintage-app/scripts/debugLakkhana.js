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

async function debugLakkhana() {
  console.log('🔍 Investigating "ลักขณา" in Monthly_Data...');
  const monthlyCsv = await fetchCsvFollowRedirect(SHEET_IDS.MONTHLY);
  const monthlyRows = parseCsvAdvanced(monthlyCsv);

  const matchedMonthly = [];
  for (let i = 1; i < monthlyRows.length; i++) {
    const r = monthlyRows[i];
    const name = r[3] || '';
    const prod = r[5] || '';
    if (name.includes('ลักขณา') || prod.includes('ทาโกะ')) {
      matchedMonthly.push(r);
      console.log(`\nFound in Monthly_Data (Row ${i}):`);
      console.log(`  ID (Col A): ${r[0]}`);
      console.log(`  Name (Col D): ${r[3]}`);
      console.log(`  Product (Col F): ${r[5]}`);
      console.log(`  Total Price (Col I): ${r[8]}`);
      console.log(`  Paid Amount (Col J): ${r[9]}`);
      console.log(`  Month (Col N): ${r[13]}`);
      console.log(`  Tel (Col O): ${r[14]}`);
    }
  }

  console.log('\n🔍 Investigating "ลักขณา" and Booking IDs in Finance_Data...');
  const financeCsv = await fetchCsvFollowRedirect(SHEET_IDS.FINANCE);
  const financeRows = parseCsvAdvanced(financeCsv);

  console.log(`Total Finance Rows: ${financeRows.length}`);
  console.log('Finance Headers:', financeRows[0].join(' | '));

  let financeMatchCount = 0;
  for (let i = 1; i < financeRows.length; i++) {
    const r = financeRows[i];
    const txnId = r[0] || '';
    const ref = r[1] || '';
    const date = r[2] || '';
    const category = r[3] || '';
    const amount = r[4] || '';
    const note = r[6] || '';
    const officer = r[7] || '';

    const isMatch = matchedMonthly.some(m => m[0] === ref) || 
                    note.includes('ลักขณา') || 
                    note.includes('ทาโกะ');

    if (isMatch) {
      financeMatchCount++;
      console.log(`\nMatched Finance Row (Row ${i}):`);
      console.log(`  Txn ID: ${txnId}`);
      console.log(`  Booking Ref (Col B): ${ref}`);
      console.log(`  Date (Col C): ${date}`);
      console.log(`  Category (Col D): ${category}`);
      console.log(`  Amount (Col E): ${amount}`);
      console.log(`  Note (Col G): ${note}`);
      console.log(`  Officer: ${officer}`);
    }
  }

  if (financeMatchCount === 0) {
    console.log('\n⚠️ No transaction matched directly by booking_ref or note. Checking all August transactions:');
    let augCount = 0;
    for (let i = 1; i < financeRows.length; i++) {
      const r = financeRows[i];
      if (r[2]?.includes('2026-08') || r[2]?.includes('08/2026') || r[2]?.includes('ส.ค.')) {
        augCount++;
      }
    }
    console.log(`Total August Transactions in Finance_Data: ${augCount}`);
  }
}

debugLakkhana();
