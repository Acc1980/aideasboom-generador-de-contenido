require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Content = require('../src/modules/content/content.model');
const Client = require('../src/modules/clients/client.model');
const planningGenerator = require('../src/services/planningGenerator.service');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Find March planning
    const planning = await Planning.findOne({
      where: { client_id: 'd02ea2e0-87e3-4c58-a340-4969976dc448', year: 2026, month: 3 },
      include: [{ association: 'client' }],
    });

    if (!planning) {
      console.log('No March planning found - generating fresh');
    } else {
      console.log('Found planning:', planning.id);

      // Delete contents
      const deleted = await Content.destroy({ where: { planning_id: planning.id } });
      console.log('Deleted contents:', deleted);

      // Delete planning
      await planning.destroy();
      console.log('Planning deleted');
    }

    // Get client
    const client = await Client.findByPk('d02ea2e0-87e3-4c58-a340-4969976dc448');
    if (!client) {
      console.log('Client not found');
      process.exit(1);
    }

    // Regenerate
    console.log('Generating new planning with updated prompt...');
    console.log('This will call OpenAI - please wait...');
    const newPlanning = await planningGenerator.generate(client, 2026, 3);

    const pieces = newPlanning.pieces || [];
    console.log('\n=== NUEVA PLANEACION MARZO ===');
    console.log('Planning ID:', newPlanning.id);
    console.log('Total pieces:', pieces.length);

    const formats = {};
    const stages = {};
    for (const p of pieces) {
      formats[p.format] = (formats[p.format] || 0) + 1;
      stages[p.funnelStage] = (stages[p.funnelStage] || 0) + 1;
    }
    console.log('Formats:', JSON.stringify(formats));
    console.log('Stages:', JSON.stringify(stages));
    console.log('');
    for (const p of pieces) {
      console.log(p.order + '. [' + p.format + '][' + p.funnelStage + '] ' + p.title);
      console.log('   Hook: ' + (p.hook || '').substring(0, 150));
      if (p.format === 'carrusel' && p.carouselSlides) {
        for (const s of p.carouselSlides) {
          console.log('   Slide ' + s.slide + ': ' + (s.body || '').substring(0, 100));
        }
      }
      console.log('');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
