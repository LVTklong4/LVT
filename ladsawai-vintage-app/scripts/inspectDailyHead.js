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
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    rows.push(lines[i]);
  }
  return rows;
}

async function inspectDailyHead() {
  const csv = await fetchCsv(SHEET_IDS.DAILY);
  const rows = parseCsv(csv);
  console.log('Daily Sheet Header & First 5 rows:\n', rows.slice(0, 5).join('\n'));
}

inspectDailyHead();
