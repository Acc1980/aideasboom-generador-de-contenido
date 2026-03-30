/**
 * Lista las pestañas del sheet de aprobaciones y los plannings reales en la BD.
 * Uso: node scripts/listSheetTabs.js
 */
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Client = require('../src/modules/clients/client.model');

const SHEET_ID = process.env.SHEET_APROBACIONES_ID;
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../credentials/google-service-account.json');

(async () => {
  await sequelize.authenticate();

  // ── Plannings reales en la BD ────────────────────────────────
  const plannings = await Planning.findAll({
    include: [{ model: Client, as: 'client' }],
    order: [['year','ASC'],['month','ASC'],['week','ASC']],
  });

  console.log('\n=== PLANNINGS EN LA BASE DE DATOS ===');
  const realTabs = new Set();
  for (const p of plannings) {
    const tab = `${p.client.name} — S${p.week || 1} ${MESES[p.month]} ${p.year}`;
    realTabs.add(tab);
    const hasSheet = p.approvalSheetUrl ? '✓ sheet' : '✗ sin sheet';
    const hasDrive = p.driveFolderUrl   ? '✓ drive' : '✗ sin drive';
    console.log(`  [${hasSheet}] [${hasDrive}] "${tab}"  (id: ${p.id})`);
  }

  // ── Pestañas actuales en el sheet ────────────────────────────
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('\n=== PESTAÑAS EN EL SHEET DE APROBACIONES ===');
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const tabs = meta.data.sheets || [];
    for (const t of tabs) {
      const name = t.properties.title;
      const isReal = realTabs.has(name);
      console.log(`  ${isReal ? '✓ real' : '✗ PRUEBA'} → "${name}"`);
    }
  } catch (err) {
    console.error('No se pudo conectar al sheet:', err.message);
    console.error('Asegúrate de compartir el sheet con: aideasboom-sheets@aideasboom.iam.gserviceaccount.com');
  }

  await sequelize.close();
})();
