/**
 * Script temporal: Genera imágenes, sube a Drive y exporta al Sheet
 * para las semanas indicadas.
 *
 * Uso: node scripts/gen-images-export.js
 */
require('dotenv').config();

const { generateImages } = require('../src/services/imageGenerator.service');
const { exportImagesToDrive } = require('../src/services/googleDrive.service');
const { exportToSheet } = require('../src/services/approvalSheet.service');
const Content = require('../src/modules/content/content.model');
const logger = require('../src/config/logger');

const PLANNINGS = [
  { id: 'c68ffd49-54b1-4c8e-8d00-07f33865c6f4', label: 'S3 Febrero' },
  { id: '5c4ecd31-74a0-4dd1-9066-f1492b9819eb', label: 'S1 Marzo' },
  { id: 'e34ca4be-c6ca-494c-9467-d55b2e4c6685', label: 'S2 Marzo' },
];

async function updateDriveUrls(generatedFiles, fileUrlMap) {
  // Misma lógica que planning.controller.js — agrupar carruseles por contentId
  const carouselGroups = {};

  for (const file of generatedFiles) {
    if (!file.id || file.format === 'reel') continue;
    const driveUrl = fileUrlMap[file.filePath];
    if (!driveUrl) continue;

    if (file.format === 'post') {
      await Content.update({ imageUrl: driveUrl }, { where: { id: file.id } });
    } else if (file.format === 'carrusel') {
      if (!carouselGroups[file.id]) carouselGroups[file.id] = {};
      carouselGroups[file.id][file.slideIndex] = driveUrl; // slideIndex es 1-based (slide.slide)
    }
  }

  // Guardar driveUrl en cada slide del JSON carouselSlides
  for (const [contentId, slideUrls] of Object.entries(carouselGroups)) {
    const content = await Content.findByPk(contentId);
    if (!content) continue;
    // Portada (slide 1) como imageUrl principal
    if (slideUrls[1]) await content.update({ imageUrl: slideUrls[1] });
    if (content.carouselSlides?.slides) {
      const updated = { ...content.carouselSlides };
      updated.slides = updated.slides.map(s => ({
        ...s,
        driveUrl: slideUrls[s.slide] || s.driveUrl || null,
      }));
      await content.update({ carouselSlides: updated });
    }
  }
}

async function processPlannings() {
  for (const p of PLANNINGS) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  ${p.label} (${p.id})`);
    console.log(`${'='.repeat(50)}`);

    // 1. Generar imágenes
    console.log('\n[1/3] Generando imágenes...');
    const imgResult = await generateImages(p.id);
    console.log(`  → ${imgResult.generatedFiles.length} archivos generados`);

    // 2. Subir a Drive
    console.log('[2/3] Subiendo a Google Drive...');
    const driveResult = await exportImagesToDrive(p.id, imgResult.generatedFiles);
    console.log(`  → Carpeta: ${driveResult.folderUrl}`);

    // Actualizar URLs en BD
    await updateDriveUrls(imgResult.generatedFiles, driveResult.fileUrlMap);
    console.log('  → URLs actualizadas en BD');

    // 3. Exportar al Sheet
    console.log('[3/3] Exportando al Sheet de aprobación...');
    const sheetResult = await exportToSheet(p.id);
    console.log(`  → Sheet: ${sheetResult.sheetUrl}`);

    console.log(`\n✓ ${p.label} completado`);
  }
}

processPlannings()
  .then(() => {
    console.log('\n\n=== TODAS LAS SEMANAS PROCESADAS ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR FATAL:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
