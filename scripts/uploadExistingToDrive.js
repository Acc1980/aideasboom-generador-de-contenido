/**
 * Sube los PNGs locales ya generados a Drive y actualiza Content.imageUrl.
 * Uso: node scripts/uploadExistingToDrive.js [planningId]
 *   Si se omite planningId, procesa todas las plannings con imágenes locales.
 */
require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const { google } = require('googleapis');
const { sequelize } = require('../src/config/database');
const Planning = require('../src/modules/planning/planning.model');
const Client   = require('../src/modules/clients/client.model');
const Content  = require('../src/modules/content/content.model');

const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../credentials/google-service-account.json');
const TOKEN_PATH       = path.join(__dirname, '../credentials/gdrive-token.json');
const OAUTH_PATH       = path.join(__dirname, '../credentials/oauth2-client.json');
const ROOT_FOLDER_ID   = process.env.DRIVE_ROOT_FOLDER_ID;
const IMAGES_BASE      = path.join(__dirname, '../src/public/images');
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getAuth() {
  if (fs.existsSync(TOKEN_PATH) && fs.existsSync(OAUTH_PATH)) {
    const creds  = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
    const token  = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const { client_id, client_secret } = creds.installed || creds.web;
    const oAuth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3001/callback');
    oAuth2.setCredentials(token);
    return oAuth2;
  }
  return new google.auth.GoogleAuth({ keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'] });
}

async function getOrCreateFolder(drive, parentId, name) {
  const q = `name = ${JSON.stringify(name)} and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const res = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive',
    supportsAllDrives: true, includeItemsFromAllDrives: true });
  if (res.data.files.length > 0) return res.data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id', supportsAllDrives: true,
  });
  return created.data.id;
}

async function uploadFile(drive, folderId, filePath, fileName) {
  const existing = await drive.files.list({
    q: `name = ${JSON.stringify(fileName)} and '${folderId}' in parents and trashed = false`,
    fields: 'files(id)', supportsAllDrives: true, includeItemsFromAllDrives: true,
  });
  const media = { mimeType: 'image/png', body: fs.createReadStream(filePath) };
  if (existing.data.files.length > 0) {
    await drive.files.update({ fileId: existing.data.files[0].id, media, supportsAllDrives: true });
    return existing.data.files[0].id;
  }
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media, supportsAllDrives: true,
    fields: 'id',
  });
  return res.data.id;
}

(async () => {
  if (!ROOT_FOLDER_ID) { console.error('DRIVE_ROOT_FOLDER_ID no definido'); process.exit(1); }
  await sequelize.authenticate();

  const targetId = process.argv[2] || null;
  const where    = targetId ? { id: targetId } : {};
  const plannings = await Planning.findAll({
    where,
    include: [{ model: Client, as: 'client' }],
    order: [['year','ASC'],['month','ASC'],['week','ASC']],
  });

  const auth  = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  for (const p of plannings) {
    const localDir = path.join(IMAGES_BASE, p.id);
    if (!fs.existsSync(localDir)) {
      console.log(`  ⚡ S${p.week} ${p.month}/${p.year}: sin imágenes locales — omitido`);
      continue;
    }

    const files = fs.readdirSync(localDir).filter(f => f.endsWith('.png'));
    if (!files.length) continue;

    console.log(`\n▶ ${p.client.name} — S${p.week} ${MESES[p.month]} ${p.year}  (${p.id})`);

    // Crear estructura de carpetas en Drive
    const clientFolderId = await getOrCreateFolder(drive, ROOT_FOLDER_ID, p.client.name);
    const weekLabel      = `S${p.week} ${MESES[p.month]} ${p.year}`;
    const weekFolderId   = await getOrCreateFolder(drive, clientFolderId, weekLabel);

    // Compartir carpeta
    try {
      await drive.permissions.create({
        fileId: weekFolderId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      });
    } catch (_) {}

    // Subir cada archivo y actualizar BD
    let updatedContents = 0;
    for (const fileName of files.sort()) {
      const filePath  = path.join(localDir, fileName);
      const postMatch = fileName.match(/^post_(\d+)\.png$/);
      const carMatch  = fileName.match(/^carousel_(\d+)_s(\d+)\.png$/);

      // ── Verificar si ya tiene Drive URL (skip si ya fue subido) ────
      if (postMatch) {
        const order   = parseInt(postMatch[1], 10);
        const content = await Content.findOne({ where: { planning_id: p.id, format: 'post', order } });
        if (content?.imageUrl?.startsWith('https://drive.google.com')) {
          console.log(`  ✓ ${fileName}  ya en Drive — omitido`);
          continue;
        }
      } else if (carMatch) {
        const order    = parseInt(carMatch[1], 10);
        const slideNum = parseInt(carMatch[2], 10);
        const content  = await Content.findOne({ where: { planning_id: p.id, format: 'carrusel', order } });
        const slide    = content?.carouselSlides?.slides?.find(s => s.slide === slideNum);
        if (slide?.driveUrl?.startsWith('https://drive.google.com')) {
          console.log(`  ✓ ${fileName}  ya en Drive — omitido`);
          continue;
        }
      }

      // ── Subir a Drive ───────────────────────────────────────────────
      const fileId = await uploadFile(drive, weekFolderId, filePath, fileName);
      try {
        await drive.permissions.create({
          fileId,
          requestBody: { role: 'reader', type: 'anyone' },
        });
      } catch (_) {}

      const driveUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;
      console.log(`  ↑ ${fileName}  →  ${driveUrl.slice(0, 60)}...`);

      // ── Actualizar BD ───────────────────────────────────────────────
      if (postMatch) {
        const order = parseInt(postMatch[1], 10);
        await Content.update({ imageUrl: driveUrl },
          { where: { planning_id: p.id, format: 'post', order } });
        updatedContents++;
      } else if (carMatch) {
        const order    = parseInt(carMatch[1], 10);
        const slideNum = parseInt(carMatch[2], 10);
        const content  = await Content.findOne({ where: { planning_id: p.id, format: 'carrusel', order } });
        if (content) {
          if (slideNum === 1) await content.update({ imageUrl: driveUrl });
          if (content.carouselSlides?.slides) {
            const updated = { ...content.carouselSlides };
            updated.slides = updated.slides.map(s => ({
              ...s,
              driveUrl: s.slide === slideNum ? driveUrl : (s.driveUrl || null),
            }));
            await content.update({ carouselSlides: updated });
          }
          updatedContents++;
        }
      }
    }

    // Guardar URL de carpeta en planning
    const folderUrl = `https://drive.google.com/drive/folders/${weekFolderId}`;
    await p.update({ driveFolderUrl: folderUrl });
    console.log(`  ✓ ${updatedContents} contents actualizados. Carpeta: ${folderUrl}`);
  }

  await sequelize.close();
  console.log('\n✅ Listo. Ahora re-exporta el sheet.');
})();
