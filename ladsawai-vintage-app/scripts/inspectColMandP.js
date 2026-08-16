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

function parseCsv(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
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

async function inspectColMandP() {
  const csv = await fetchCsvFollowRedirect(`https://docs.google.com/spreadsheets/d/${SHEET_ID_MONTHLY}/export?format=csv`);
  const rows = parseCsv(csv);
  console.log('Total rows:', rows.length);
  if (rows.length > 0) {
    console.log('Header columns:');
    rows[0].forEach((col, idx) => {
      const colLetter = String.fromCharCode(65 + idx);
      console.log(`  Col ${colLetter} [idx ${idx}]: ${col}`);
    });

    console.log('\nSample August Row 1:');
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][13]?.includes('2026-08') || rows[i][2]?.includes('2026-08')) {
        rows[i].forEach((val, idx) => {
          const colLetter = String.fromCharCode(65 + idx);
          console.log(`  Col ${colLetter} [idx ${idx}] (${rows[0][idx] || ''}): ${val}`);
        });
        break;
      }
    }
  }
}

inspectColMandP();
