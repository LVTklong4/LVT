const https = require('https');

const SHEET_ID_DAILY = '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I';

function fetchCsv(sheetId) {
  return new Promise((resolve, reject) => {
    https.get(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    });
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

async function deepInspectDaily() {
  const csv = await fetchCsv(SHEET_ID_DAILY);
  const rows = parseCsv(csv);
  console.log('Total rows in Daily Sheet:', rows.length);
  if (rows.length > 0) {
    console.log('Header columns:', rows[0]);
    console.log('Row 1:', rows[1]);
    console.log('Row 2:', rows[2]);
    
    // Sample 20 distinct dates from across the sheet
    const sampleDates = new Set();
    for (let i = 1; i < rows.length; i += Math.floor(rows.length / 30)) {
      sampleDates.add(rows[i][1]);
    }
    console.log('Sample dates throughout sheet:', Array.from(sampleDates));

    // Tail 5 rows
    console.log('Last 5 rows in Daily Sheet:');
    for (let i = Math.max(1, rows.length - 5); i < rows.length; i++) {
      console.log(rows[i]);
    }
  }
}

deepInspectDaily();
