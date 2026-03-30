require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Content  = require('../src/modules/content/content.model');
const Client   = require('../src/modules/clients/client.model');

(async () => {
  await sequelize.authenticate();
  const client = await Client.findOne({ where: { name: 'Moni Grizales' } });
  const targets = [
    { year: 2026, month: 2, week: 4 },
    { year: 2026, month: 3, week: 1 },
    { year: 2026, month: 3, week: 2 },
    { year: 2026, month: 3, week: 3 },
  ];
  for (const t of targets) {
    const p = await Planning.findOne({ where: { clientId: client.id, ...t } });
    if (!p) { console.log('No encontrado:', JSON.stringify(t)); continue; }
    const del = await Content.destroy({ where: { planningId: p.id } });
    await p.destroy();
    console.log('✓ Borrado:', JSON.stringify(t), '->', del, 'contents');
  }
  console.log('\nListo.');
  await sequelize.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
