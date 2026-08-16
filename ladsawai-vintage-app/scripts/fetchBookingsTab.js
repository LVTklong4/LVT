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

async function testFetchDailyBookings() {
  const csv = await fetchCsvWithSheetName('Bookings');
  console.log('CSV length for sheet Bookings:', csv.length);
  const lines = csv.split('\n').filter(l => l.trim() !== '');
  console.log('Total rows in Bookings tab:', lines.length);
  if (lines.length > 0) {
    console.log('Header:', lines[0]);
    console.log('Row 1:', lines[1]);
    console.log('Last Row:', lines[lines.length - 1]);
  }
}

testFetchDailyBookings();
