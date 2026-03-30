/**
 * Borra todos los plannings y contenidos de la BD para empezar de cero.
 * Uso: node scripts/resetPlannings.js
 *
 * Opciones:
 *   --client "Nombre"   Borrar solo los de un cliente específico
 *   --all               Borrar TODO (sin preguntar)
 */
require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Content = require('../src/modules/content/content.model');
const Client = require('../src/modules/clients/client.model');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../src/public/images');

(async () => {
  await sequelize.authenticate();

  const clientName = process.argv.find((a, i) => process.argv[i - 1] === '--client');

  let where = {};
  if (clientName) {
    const client = await Client.findOne({ where: { name: clientName } });
    if (!client) {
      console.error(`❌ Cliente "${clientName}" no encontrado`);
      process.exit(1);
    }
    where = { client_id: client.id };
    console.log(`\n🗑  Borrando plannings de: ${client.name}`);
  } else {
    console.log('\n🗑  Borrando TODOS los plannings y contenidos...');
  }

  // Obtener IDs de plannings para borrar carpetas de imágenes
  const plannings = await Planning.findAll({ where, attributes: ['id'] });
  const planningIds = plannings.map(p => p.id);

  // Borrar contenidos
  const deletedContent = await Content.destroy({
    where: planningIds.length ? { planningId: planningIds } : {},
  });
  console.log(`  ✓ ${deletedContent} contenidos eliminados`);

  // Borrar plannings
  const deletedPlannings = await Planning.destroy({ where });
  console.log(`  ✓ ${deletedPlannings} plannings eliminados`);

  // Borrar carpetas de imágenes locales
  let deletedFolders = 0;
  for (const pid of planningIds) {
    const dir = path.join(IMAGES_DIR, pid);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
      deletedFolders++;
    }
  }
  console.log(`  ✓ ${deletedFolders} carpetas de imágenes eliminadas`);

  console.log('\n✅ Listo. Puedes generar planeaciones nuevas desde la app.\n');
  await sequelize.close();
})();
