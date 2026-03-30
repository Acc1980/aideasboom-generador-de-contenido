require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Content = require('../src/modules/content/content.model');
const Planning = require('../src/modules/planning/planning.model');
const Client = require('../src/modules/clients/client.model');

(async () => {
  await sequelize.authenticate();

  // Mostrar todas las planeaciones con sus carruseles
  const plannings = await Planning.findAll({
    include: [{ model: Client, as: 'client', attributes: ['name'] }],
    order: [['created_at', 'DESC']],
  });

  for (const p of plannings) {
    const carruseles = await Content.findAll({
      where: { planningId: p.id, format: 'carrusel' },
      attributes: ['id', 'title', 'carousel_slides'],
    });
    console.log(`\n[${p.client.name}] ${p.year}-${String(p.month).padStart(2,'0')} S${p.week} — id: ${p.id}`);
    console.log(`  Carruseles: ${carruseles.length}`);
    for (const c of carruseles) {
      const slides = c.carouselSlides?.slides?.length || 0;
      console.log(`    - "${c.title}" → ${slides} slide(s)`);
    }
  }

  await sequelize.close();
})().catch(e => { console.error(e.message); process.exit(1); });
