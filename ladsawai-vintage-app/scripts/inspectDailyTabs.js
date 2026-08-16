const https = require('https');

const SHEET_ID_DAILY = '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I';
const GIDS = ['1450875977', '1975045928', '1963285831', '384144667', '1185408381', '0'];

function fetchCsvWithGid(gid) {
  return new Promise((resolve) => {
    https.get(`https://docs.google.com/spreadsheets/d/${SHEET_ID_DAILY}/export?format=csv&gid=${gid}`, (res) => {
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
  return { totalLines: lines.length, sample: rows };
}

async function inspectAllDailyTabs() {
  for (const gid of GIDS) {
    const csv = await fetchCsvWithGid(gid);
    const parsed = parseCsv(csv);
    console.log(`\n=== GID: ${gid} (Total rows: ${parsed.totalLines}) ===`);
    if (parsed.sample.length > 0) {
      console.log('Header:', parsed.sample[0]);
      if (parsed.sample.length > 1) {
        console.log('Row 1:', parsed.sample[1]);
      }
    }
  }
}

inspectAllDailyTabs();
