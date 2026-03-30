/**
 * Script temporal: Corrige las driveUrl de carruseles en BD y re-exporta Sheets.
 * Las imágenes ya están en Drive, solo falta actualizar la BD con las URLs correctas.
 */
require('dotenv').config();

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Content = require('../src/modules/content/content.model');
const Planning = require('../src/modules/planning/planning.model');
const Client = require('../src/modules/clients/client.model');
const { exportToSheet } = require('../src/services/approvalSheet.service');

const TOKEN_PATH = path.join(__dirname, '../credentials/gdrive-token.json');
const OAUTH_PATH = path.join(__dirname, '../credentials/oauth2-client.json');
const SA_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../credentials/google-service-account.json');

function getDriveAuth() {
  if (fs.existsSync(TOKEN_PATH) && fs.existsSync(OAUTH_PATH)) {
    const creds = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const { client_id, client_secret } = creds.installed || creds.web;
    const oAuth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3001/callback');
    oAuth2.setCredentials(token);
    return oAuth2;
  }
  return new google.auth.GoogleAuth({
    keyFile: SA_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

const PLANNINGS = [
  { id: 'c68ffd49-54b1-4c8e-8d00-07f33865c6f4', label: 'S3 Febrero' },
  { id: '5c4ecd31-74a0-4dd1-9066-f1492b9819eb', label: 'S1 Marzo' },
  { id: 'e34ca4be-c6ca-494c-9467-d55b2e4c6685', label: 'S2 Marzo' },
];

async function fixPlanning(planningId, label) {
  console.log(`\n--- ${label} ---`);

  const planning = await Planning.findByPk(planningId, {
    include: [
      { model: Client, as: 'client' },
      { model: Content, as: 'contents', order: [['order', 'ASC']] },
    ],
  });
  if (!planning) { console.log('Planning no encontrado'); return; }

  const driveFolderUrl = planning.driveFolderUrl;
  if (!driveFolderUrl) { console.log('No tiene carpeta Drive'); return; }

  // Extraer folderId de la URL
  const folderId = driveFolderUrl.split('/folders/')[1];
  console.log('Carpeta Drive:', folderId);

  const auth = getDriveAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Listar todos los archivos en la carpeta
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const driveFiles = res.data.files || [];
  console.log(`Archivos en Drive: ${driveFiles.length}`);

  // Crear mapa: nombre → driveUrl
  const nameToUrl = {};
  for (const f of driveFiles) {
    nameToUrl[f.name] = `https://drive.google.com/uc?id=${f.id}&export=view`;
  }

  // Actualizar carruseles
  const carousels = planning.contents.filter(c => c.format === 'carrusel');
  let fixed = 0;

  for (const c of carousels) {
    if (!c.carouselSlides?.slides) continue;
    const updated = { ...c.carouselSlides };
    let changed = false;

    updated.slides = updated.slides.map(s => {
      const filename = `carousel_${c.order}_s${s.slide}.png`;
      const driveUrl = nameToUrl[filename];
      if (driveUrl) {
        changed = true;
        return { ...s, driveUrl };
      }
      return s;
    });

    if (changed) {
      // También actualizar imageUrl con la portada (slide 1)
      const coverFilename = `carousel_${c.order}_s1.png`;
      const coverUrl = nameToUrl[coverFilename];
      await c.update({
        carouselSlides: updated,
        ...(coverUrl ? { imageUrl: coverUrl } : {}),
      });
      fixed++;
      console.log(`  ✓ Carrusel orden=${c.order}: ${updated.slides.length} slides actualizados`);
    }
  }

  // También verificar posts
  const posts = planning.contents.filter(c => c.format === 'post');
  for (const p of posts) {
    const filename = `post_${p.order}.png`;
    const driveUrl = nameToUrl[filename];
    if (driveUrl && p.imageUrl !== driveUrl) {
      await p.update({ imageUrl: driveUrl });
      console.log(`  ✓ Post orden=${p.order}: imageUrl actualizado`);
    }
  }

  console.log(`Carruseles corregidos: ${fixed}`);

  // Re-exportar al Sheet
  console.log('Re-exportando al Sheet...');
  const sheetResult = await exportToSheet(planningId);
  console.log(`  → Sheet: ${sheetResult.sheetUrl}`);
}

(async () => {
  try {
    for (const p of PLANNINGS) {
      await fixPlanning(p.id, p.label);
    }
    console.log('\n=== CORRECCIÓN COMPLETADA ===');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
