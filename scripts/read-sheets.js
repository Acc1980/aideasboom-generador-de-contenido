require('dotenv').config();
const { google } = require('googleapis');

const SPREADSHEET_ID = '1tmzIrO1C8JhpWK-oEFb1HVMXh8V-ZVmXztaoEntQJhA';

(async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });

    console.log('=== SPREADSHEET:', spreadsheet.data.properties.title, '===\n');

    for (const sheet of spreadsheet.data.sheets) {
      const title = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      console.log(`--- Tab: "${title}" (gid=${sheetId}) ---`);

      // Read first 15 rows to see structure
      try {
        const data = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${title}'!A1:O15`,
        });

        const rows = data.data.values || [];
        if (rows.length === 0) {
          console.log('  (empty)\n');
          continue;
        }

        // Print headers
        console.log('  Headers:', JSON.stringify(rows[0]));
        console.log('  Rows:', rows.length - 1);

        // Print first 3 data rows
        for (let i = 1; i < Math.min(rows.length, 4); i++) {
          console.log('  Row ' + i + ':', JSON.stringify(rows[i].map(v => v.length > 60 ? v.substring(0, 60) + '...' : v)));
        }
        console.log('');
      } catch (err) {
        console.log('  Error reading:', err.message, '\n');
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
