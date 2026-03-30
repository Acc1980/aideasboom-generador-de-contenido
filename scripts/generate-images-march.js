require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Client = require('../src/modules/clients/client.model');
const imageGenerator = require('../src/services/imageGenerator.service');

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
    console.log('Pieces:', planning.pieces.length);
    console.log('Generating images...');

    const results = await imageGenerator.generateAllImages(planning.client, planning);

    console.log('\n=== IMAGENES GENERADAS ===');
    console.log('Output dir:', results.outputDir);
    console.log('Posts:', results.posts.length);
    console.log('Carousels:', results.carousels.length);
    console.log('Reel scripts:', results.reelScripts.length);

    for (const p of results.posts) {
      console.log('  Post ' + p.order + ': ' + p.title);
    }
    for (const c of results.carousels) {
      console.log('  Carrusel ' + c.order + ': ' + c.title + ' (' + c.files.length + ' slides)');
    }
    for (const r of results.reelScripts) {
      console.log('  Reel ' + r.order + ': ' + r.title);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
