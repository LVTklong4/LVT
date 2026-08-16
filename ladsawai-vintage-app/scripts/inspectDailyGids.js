const https = require('https');

const SHEET_ID_DAILY = '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I';

function inspectSheetTabs() {
  https.get(`https://docs.google.com/spreadsheets/d/${SHEET_ID_DAILY}/htmlview`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('HTML size:', data.length);
      // Search for tab names and sheet ids (gid)
      const matches = data.match(/sheet-menu.*?<\/ul>/s) || data.match(/items:.*?\]/s) || data.match(/gid=(\d+)/g);
      console.log('Matches found:', matches ? matches.slice(0, 10) : 'None');
      
      const gids = Array.from(new Set((data.match(/gid=(\d+)/g) || [])));
      console.log('Distinct gids found in HTML:', gids);
    });
  });
}

inspectSheetTabs();
