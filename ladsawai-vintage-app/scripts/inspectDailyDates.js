const https = require('https');

const SHEET_IDS = {
  DAILY: '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I'
};

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

async function inspectDailyDates() {
  const csv = await fetchCsv(SHEET_IDS.DAILY);
  const rows = parseCsv(csv);
  const dateCounts = {};
  for (const r of rows) {
    const d = r[1] || 'EMPTY';
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  }
  console.log('Sample Recent Dates in Daily Sheet:', Object.entries(dateCounts).slice(-20));
}

inspectDailyDates();
