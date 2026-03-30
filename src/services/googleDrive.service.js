/**
 * Google Drive Service
 *
 * Sube las imágenes generadas a una carpeta de Google Drive por cliente/semana.
 * Estructura de carpetas:
 *   AIdeasBoom (raíz, configurable con DRIVE_ROOT_FOLDER_ID)
 *   └── {ClientName}
 *       └── S{week} {Mes} {year}
 *           ├── post_1.png
 *           ├── carousel_2_s1.png
 *           └── ...
 *
 * IMPORTANTE: DRIVE_ROOT_FOLDER_ID debe apuntar a una carpeta dentro de un
 * Shared Drive (Drive compartido), ya que las Service Accounts no tienen
 * cuota de almacenamiento propia en My Drive.
 *
 * La carpeta de la semana se comparte con "anyone with link can view"
 * y la URL se guarda en planning.drive_folder_url.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const Planning = require('../modules/planning/planning.model');
const Client = require('../modules/clients/client.model');

const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../../credentials/google-service-account.json');

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TOKEN_PATH  = path.join(__dirname, '../../credentials/gdrive-token.json');
const OAUTH_PATH  = path.join(__dirname, '../../credentials/oauth2-client.json');

/**
 * Retorna el cliente de autenticación para Drive.
 * Prioridad:
 *   1. OAuth2 con token de usuario (credentials/gdrive-token.json) → funciona con Gmail gratuito
 *   2. Service Account → requiere Shared Drive (Google Workspace)
 */
function getAuth() {
  if (fs.existsSync(TOKEN_PATH) && fs.existsSync(OAUTH_PATH)) {
    const creds  = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
    const token  = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const { client_id, client_secret } = creds.installed || creds.web;
    const oAuth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3001/callback');
    oAuth2.setCredentials(token);
    return oAuth2;
  }
  return new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

/**
 * Busca una carpeta por nombre dentro de un parent; la crea si no existe.
 * Soporta Shared Drives con supportsAllDrives: true.
 * @returns {string} ID de la carpeta
 */
async function getOrCreateFolder(drive, parentId, name) {
  const q = [
    `name = ${JSON.stringify(name)}`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `'${parentId}' in parents`,
    `trashed = false`,
  ].join(' and ');

  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });
  return created.data.id;
}

/**
 * Sube un archivo PNG a la carpeta indicada.
 * Si ya existe un archivo con el mismo nombre, lo reemplaza.
 * @returns {string} ID del archivo subido
 */
async function uploadFile(drive, folderId, filePath, fileName) {
  // Buscar si ya existe
  const existing = await drive.files.list({
    q: `name = ${JSON.stringify(fileName)} and '${folderId}' in parents and trashed = false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const media = {
    mimeType: 'image/png',
    body: fs.createReadStream(filePath),
  };

  if (existing.data.files.length > 0) {
    // Actualizar contenido
    await drive.files.update({
      fileId: existing.data.files[0].id,
      media,
      supportsAllDrives: true,
    });
    return existing.data.files[0].id;
  }

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media,
    fields: 'id',
    supportsAllDrives: true,
  });
  return res.data.id;
}

/**
 * Exporta las imágenes generadas de una planeación a Google Drive.
 *
 * @param {string} planningId
 * @param {Array}  generatedFiles  - [{ filePath, imageUrl, format, slideIndex? }]
 * @returns {{ folderUrl: string, folderId: string, fileUrlMap: object }}
 */
async function exportImagesToDrive(planningId, generatedFiles) {
  const rootFolderId = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error('DRIVE_ROOT_FOLDER_ID no definido en .env');

  const planning = await Planning.findByPk(planningId, {
    include: [{ model: Client, as: 'client' }],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const clientName  = planning.client.name;
  const weekLabel   = `S${planning.week} ${MESES[planning.month]} ${planning.year}`;

  // ── Estructura: Root → ClientName → "S1 Febrero 2026" ────────────────
  const clientFolderId = await getOrCreateFolder(drive, rootFolderId, clientName);
  const weekFolderId   = await getOrCreateFolder(drive, clientFolderId, weekLabel);

  logger.info(`Drive: subiendo ${generatedFiles.length} imágenes a "${clientName} / ${weekLabel}"...`);

  const fileUrlMap = {};
  for (const file of generatedFiles) {
    const fileName = path.basename(file.filePath);
    const fileId = await uploadFile(drive, weekFolderId, file.filePath, fileName);
    // Compartir el archivo individualmente (para que =IMAGE() funcione en Sheets)
    try {
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      });
    } catch (_) {}
    fileUrlMap[file.filePath] = `https://drive.google.com/uc?id=${fileId}&export=view`;
    logger.info(`  ↑ ${fileName}`);
  }

  // ── Compartir la carpeta de la semana (anyone with link = reader) ──────
  try {
    await drive.permissions.create({
      fileId: weekFolderId,
      requestBody: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    });
  } catch (err) {
    logger.warn('No se pudo establecer permiso público en carpeta: ' + err.message);
  }

  const folderUrl = `https://drive.google.com/drive/folders/${weekFolderId}`;

  // Guardar URL en la planeación
  await planning.update({ driveFolderUrl: folderUrl });

  logger.info(`Drive: carpeta lista → ${folderUrl}`);
  return { folderUrl, folderId: weekFolderId, fileUrlMap };
}

module.exports = { exportImagesToDrive };
