/**
 * Muestra el imageUrl de cada Content para las plannings de un cliente.
 * Uso: node scripts/checkImageUrls.js "Moni"
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const { sequelize } = require('../src/config/database');
const Client   = require('../src/modules/clients/client.model');
const Planning = require('../src/modules/planning/planning.model');
const Content  = require('../src/modules/content/content.model');

const nombre = process.argv[2] || '';

(async () => {
  await sequelize.authenticate();

  const clientes = await Client.findAll({
    where: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('name')),
      { [Sequelize.Op.like]: `%${nombre.toLowerCase()}%` }
    ),
  });

  if (!clientes.length) { console.log('No se encontró cliente con ese nombre'); process.exit(0); }

  for (const c of clientes) {
    console.log(`\n=== ${c.name} ===`);
    const plannings = await Planning.findAll({
      where: { client_id: c.id },
      order: [['year','ASC'],['month','ASC'],['week','ASC']],
    });

    for (const p of plannings) {
      console.log(`\n  S${p.week} ${p.month}/${p.year}  (${p.id})`);
      const contents = await Content.findAll({
        where: { planning_id: p.id },
        order: [['order','ASC']],
        attributes: ['id','format','title','image_url'],
      });
      for (const ct of contents) {
        const url = ct.imageUrl || ct.image_url || '—';
        const tipo = url.startsWith('https://drive') ? '✓ Drive'
                   : url.startsWith('https://')     ? '? otro https'
                   : url.startsWith('/images/')     ? '✗ local'
                   : '✗ vacío';
        console.log(`    [${(ct.format||'').padEnd(8)}] ${tipo}  ${url.slice(0,70)}`);
      }
    }
  }

  await sequelize.close();
})();
