require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Client = require('../src/modules/clients/client.model');
const sheetsService = require('../src/services/googleSheets.service');

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1tmzIrO1C8JhpWK-oEFb1HVMXh8V-ZVmXztaoEntQJhA';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const planning = await Planning.findOne({
      where: { client_id: 'd02ea2e0-87e3-4c58-a340-4969976dc448', year: 2026, month: 3 },
      include: [{ association: 'client' }],
    });

    if (!planning) {
      console.log('No March planning found');
      process.exit(1);
    }

    console.log('Planning:', planning.id);
    console.log('Exporting ideas to Google Sheets...');

    const url = await sheetsService.exportIdeasSheet(
      planning.client,
      planning,
      planning.pieces,
      SPREADSHEET_URL
    );

    console.log('Ideas sheet exported:', url);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
