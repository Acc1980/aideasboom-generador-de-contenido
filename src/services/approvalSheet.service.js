/**
 * approvalSheet.service.js
 * Escribe y lee pestañas dentro del sheet maestro "AIdeasBoom - Aprobaciones".
 * - exportToSheet: crea/reemplaza una pestaña para la planeación y la llena
 * - importFromSheet: lee comentarios y estados del cliente y actualiza la BD
 */

const { google } = require('googleapis');
const path = require('path');
const fs   = require('fs');
const logger = require('../config/logger');
const Content = require('../modules/content/content.model');
const Planning = require('../modules/planning/planning.model');
const Client = require('../modules/clients/client.model');

const { regenerateContentPiece } = require('./planningGenerator.service');

const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../../credentials/google-service-account.json');

const MASTER_SHEET_ID = process.env.SHEET_APROBACIONES_ID;

// Soporte para credenciales inline via env var (para despliegues en VPS)
function getCredentialsOption() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return { credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) };
  }
  return { keyFile: CREDENTIALS_PATH };
}

// Obtener email de la cuenta de servicio para protecciones
let SA_EMAIL = null;
try {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  SA_EMAIL = saJson.client_email;
} catch (_) {}

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getAuth() {
  return new google.auth.GoogleAuth({
    ...getCredentialsOption(),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

// Asegurar que el sheet maestro esté compartido
async function ensureSheetShared(auth) {
  if (!MASTER_SHEET_ID) return;

  const drive = google.drive({ version: 'v3', auth });

  // 1. Acceso público con link (cualquiera con el link puede editar)
  try {
    await drive.permissions.create({
      fileId: MASTER_SHEET_ID,
      requestBody: { role: 'writer', type: 'anyone' },
    });
    logger.info('Sheet compartido: cualquiera con el link puede editar');
  } catch (err) {
    // Ignorar si ya tiene el permiso
    if (!err.message?.includes('already has access')) {
      logger.warn('No se pudo compartir el sheet: ' + err.message);
    }
  }
}

// ── Exportar planeación a pestaña del sheet maestro ──────────────────
async function exportToSheet(planningId) {
  if (!MASTER_SHEET_ID) throw new Error('SHEET_APROBACIONES_ID no definido en .env');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Asegurar acceso compartido
  await ensureSheetShared(auth);

  // Cargar planeación con cliente y contenidos
  const planning = await Planning.findByPk(planningId, {
    include: [
      { model: Client, as: 'client' },
      { model: Content, as: 'contents', order: [['order', 'ASC']] },
    ],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const clientName = planning.client.name;
  const mesNombre  = MESES[planning.month];
  const tabTitle   = `${clientName} — S${planning.week || 1} ${mesNombre} ${planning.year}`;

  // ── Verificar si ya existe la pestaña ──────────────────────────────
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: MASTER_SHEET_ID,
    fields: 'sheets(properties,protectedRanges)',
  });
  const existingSheets = meta.data.sheets || [];
  const existing = existingSheets.find(s => s.properties.title === tabTitle);

  let sheetId;
  let oldProtectionDeletes = [];

  if (existing) {
    // Limpiar contenido anterior
    sheetId = existing.properties.sheetId;
    // Recopilar protecciones antiguas para eliminarlas
    oldProtectionDeletes = (existing.protectedRanges || [])
      .map(p => ({ deleteProtectedRange: { protectedRangeId: p.protectedRangeId } }));
    await sheets.spreadsheets.values.clear({
      spreadsheetId: MASTER_SHEET_ID,
      range: `'${tabTitle}'`,
    });
  } else {
    // Crear pestaña nueva
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MASTER_SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabTitle } } }],
      },
    });
    sheetId = addRes.data.replies[0].addSheet.properties.sheetId;
  }

  // ── Cabeceras ──────────────────────────────────────────────────────
  // Orden: # | Formato | ESTADO | COMENTARIOS | Copy | SLIDE 1-8 | (secundarias)
  const MAX_SLIDES = 8;
  const slideHeaders = Array.from({ length: MAX_SLIDES }, (_, i) => `SLIDE ${i + 1}`);
  const headers = [
    '#', 'Formato', 'ESTADO', 'COMENTARIOS DEL CLIENTE', 'PUBLICADO',
    'Copy',
    ...slideHeaders,
    'Etapa', 'Título', 'Hook', 'CTA',
    'Hashtags', 'Dirección Visual', 'Script / Slides',
  ];

  // ── Filas de contenido ─────────────────────────────────────────────
  const rows = planning.contents.map((c, i) => {
    const scriptText = c.script
      ? (c.script.scenes || []).map(s => `[Escena ${s.scene} · ${s.duration || ''}] ${s.description || ''}\n${s.text || ''}`).join('\n\n')
      : '';
    const slidesText = c.carouselSlides
      ? (c.carouselSlides.slides || []).map(s => `[${s.slide}] ${s.text || ''}`).join('\n')
      : '';

    // Imágenes: posts → slide 1; carruseles → un =IMAGE por slide
    const slideImages = [];
    if (c.format === 'post' && c.imageUrl?.startsWith('https://')) {
      slideImages.push(`=IMAGE("${c.imageUrl}", 1)`);
      for (let k = 1; k < MAX_SLIDES; k++) slideImages.push('');
    } else if (c.format === 'carrusel') {
      const slides = c.carouselSlides?.slides || [];
      for (let k = 0; k < MAX_SLIDES; k++) {
        const slide = slides[k];
        slideImages.push(slide?.driveUrl ? `=IMAGE("${slide.driveUrl}", 1)` : '');
      }
    } else if (c.format === 'reel') {
      slideImages.push('REEL — ver Script / Slides');
      for (let k = 1; k < MAX_SLIDES; k++) slideImages.push('');
    } else {
      for (let k = 0; k < MAX_SLIDES; k++) slideImages.push('');
    }

    return [
      i + 1,
      (c.format || '').toUpperCase(),
      c.approvalStatus === 'aprobado' ? 'Aprobado'
        : c.approvalStatus === 'cambios' ? 'Cambios'
        : c.approvalStatus === 'no_va'   ? 'No va'
        : 'Pendiente',
      c.clientComments || '',
      c.status === 'published' ? 'Sí' : 'No',
      c.copy || '',
      ...slideImages,
      (c.funnelStage || '').toUpperCase(),
      c.title || '',
      c.hook || '',
      c.cta || '',
      (c.hashtags || []).join(' '),
      c.visualDirection || '',
      scriptText || slidesText,
    ];
  });

  // ── Escribir datos ─────────────────────────────────────────────────
  await sheets.spreadsheets.values.update({
    spreadsheetId: MASTER_SHEET_ID,
    range: `'${tabTitle}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers, ...rows] },
  });

  // ── Formato ────────────────────────────────────────────────────────
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: MASTER_SHEET_ID,
    requestBody: {
      requests: [
        // Negrita y fondo oscuro en cabeceras
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.1, green: 0.1, blue: 0.18 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // Fondo verde claro en columna ESTADO (col C = índice 2)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 2, endColumnIndex: 3 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.85, green: 0.97, blue: 0.87 },
              },
            },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
        // Fondo amarillo claro en columna COMENTARIOS (col D = índice 3)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 3, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 0.98, blue: 0.8 },
              },
            },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
        // Fondo azul claro en columna PUBLICADO (col E = índice 4)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 4, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.82, green: 0.88, blue: 1 },
              },
            },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
        // Congelar primera fila
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        // Anchos de columna — # | Formato | ESTADO | COMENTARIOS | PUBLICADO | Copy | SLIDE 1-8 | ...
        // # (A=0)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 40 }, fields: 'pixelSize' } },
        // Formato (B=1)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        // ESTADO (C=2)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } },
        // COMENTARIOS (D=3)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
        // PUBLICADO (E=4)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        // Copy (F=5)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 300 }, fields: 'pixelSize' } },
        // SLIDE 1-8 (G=6 a N=13)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 14 }, properties: { pixelSize: 155 }, fields: 'pixelSize' } },
        // Etapa (O=14)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 14, endIndex: 15 }, properties: { pixelSize: 80 }, fields: 'pixelSize' } },
        // Título (P=15)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 15, endIndex: 16 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } },
        // Hook (Q=16)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 16, endIndex: 17 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
        // CTA (R=17)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 17, endIndex: 18 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } },
        // Hashtags (S=18)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 18, endIndex: 19 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } },
        // Dirección Visual (T=19)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 19, endIndex: 20 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
        // Script / Slides (U=20)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 20, endIndex: 21 }, properties: { pixelSize: 400 }, fields: 'pixelSize' } },
        // Altura de filas de datos (200px para mostrar las imágenes)
        { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 50 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } },
        // Validación dropdown en columna ESTADO (C = índice 2)
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 2, endColumnIndex: 3 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'Pendiente' },
                  { userEnteredValue: 'Aprobado' },
                  { userEnteredValue: 'Cambios' },
                  { userEnteredValue: 'No va' },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // Validación dropdown en columna PUBLICADO (E = índice 4)
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 4, endColumnIndex: 5 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'No' },
                  { userEnteredValue: 'Sí' },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // Wrap text en todas las celdas de datos
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1 },
            cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
            fields: 'userEnteredFormat.wrapStrategy',
          },
        },
        // Eliminar protecciones anteriores (si es re-exportación)
        ...oldProtectionDeletes,
      ],
    },
  });

  // URL directa a la pestaña
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${sheetId}`;

  // Guardar URL en la planeación
  await planning.update({ approvalSheetUrl: sheetUrl });

  logger.info(`Sheet de aprobación exportado: ${sheetUrl}`);
  return { sheetUrl, spreadsheetId: MASTER_SHEET_ID, sheetId };
}

// ── Importar aprobaciones desde la pestaña ───────────────────────────
async function importFromSheet(planningId) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const planning = await Planning.findByPk(planningId, {
    include: [
      { model: Client, as: 'client' },
      { model: Content, as: 'contents', order: [['order', 'ASC']] },
    ],
  });
  if (!planning) throw new Error('Planeación no encontrada');
  if (!planning.approvalSheetUrl) throw new Error('No hay sheet de aprobación para esta planeación. Expórtala primero.');

  const clientName = planning.client.name;
  const mesNombre  = MESES[planning.month];
  const tabTitle   = `${clientName} — S${planning.week || 1} ${mesNombre} ${planning.year}`;

  // Leer columnas C, D y E (ESTADO, COMENTARIOS, PUBLICADO), desde fila 2
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: `'${tabTitle}'!C2:E1000`,
  });
  const rows = res.data.values || [];

  const STATUS_MAP = {
    'aprobado':   'aprobado',
    'cambios':    'cambios',
    'modificar':  'cambios',
    'no va':      'no_va',
    'pendiente':  'pendiente',
    'pendiente revisión': 'pendiente',
  };

  const contents = planning.contents;
  let updated = 0;
  let regenerated = 0;
  const toRegenerate = [];

  for (let i = 0; i < contents.length; i++) {
    const row = rows[i] || [];
    const estadoRaw      = (row[0] || 'Pendiente').toLowerCase().trim();
    const comentarios    = (row[1] || '').trim();
    const publicadoRaw   = (row[2] || 'No').toLowerCase().trim();
    const approvalStatus = STATUS_MAP[estadoRaw] || 'pendiente';
    const status = publicadoRaw === 'sí' ? 'published' : (approvalStatus === 'aprobado' ? 'approved' : contents[i].status);

    await contents[i].update({ clientComments: comentarios, approvalStatus, status });
    updated++;

    // Marcar para regeneración automática si tiene feedback
    if (approvalStatus === 'cambios' && comentarios) {
      toRegenerate.push({ content: contents[i], feedback: comentarios });
    }
  }

  // Regenerar piezas con feedback usando OpenAI
  if (toRegenerate.length > 0) {
    logger.info(`Regenerando ${toRegenerate.length} pieza(s) con feedback del cliente...`);
    for (const { content, feedback } of toRegenerate) {
      try {
        await regenerateContentPiece(content.id, feedback);
        regenerated++;
        logger.info(`✓ Regenerada: ${content.title}`);
      } catch (err) {
        logger.error(`Error regenerando pieza ${content.id}: ${err.message}`);
      }
    }
    // Re-exportar el sheet con el contenido actualizado
    if (regenerated > 0) {
      logger.info('Re-exportando sheet con contenido regenerado...');
      await exportToSheet(planningId);
    }
  }

  logger.info(`Aprobaciones importadas: ${updated} piezas, ${regenerated} regeneradas`);
  return { updated, regenerated };
}

// ── Stories: Exportar al sheet maestro ───────────────────────────────
async function exportStoriesToSheet(planningId) {
  if (!MASTER_SHEET_ID) throw new Error('SHEET_APROBACIONES_ID no definido en .env');

  const Story = require('../modules/stories/story.model');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Asegurar acceso compartido
  await ensureSheetShared(auth);

  const planning = await Planning.findByPk(planningId, {
    include: [{ model: Client, as: 'client' }],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  // Query stories por separado con order correcto
  const allStories = await Story.findAll({
    where: { planning_id: planningId },
    order: [['day_of_week', 'ASC'], ['order', 'ASC']],
  });
  if (!allStories || allStories.length === 0) {
    throw new Error('No hay stories generadas para esta planeación. Genéralas primero.');
  }

  const clientName = planning.client.name;
  const mesNombre  = MESES[planning.month];
  const tabTitle   = `${clientName} — Stories S${planning.week || 1} ${mesNombre} ${planning.year}`;

  // Verificar si ya existe la pestaña
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: MASTER_SHEET_ID,
    fields: 'sheets(properties,protectedRanges)',
  });
  const existingSheets = meta.data.sheets || [];
  const existing = existingSheets.find(s => s.properties.title === tabTitle);

  let sheetId;
  let oldProtectionDeletes = [];

  if (existing) {
    sheetId = existing.properties.sheetId;
    oldProtectionDeletes = (existing.protectedRanges || [])
      .map(p => ({ deleteProtectedRange: { protectedRangeId: p.protectedRangeId } }));
    await sheets.spreadsheets.values.clear({
      spreadsheetId: MASTER_SHEET_ID,
      range: `'${tabTitle}'`,
    });
  } else {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: MASTER_SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabTitle } } }],
      },
    });
    sheetId = addRes.data.replies[0].addSheet.properties.sheetId;
  }

  // Cabeceras para stories
  const headers = [
    '#', 'Día', 'Orden', 'Tipo', '¿GRABAR?',
    'ESTADO', 'COMENTARIOS DEL CLIENTE', 'PUBLICADO',
    'Guion / Texto', 'Dirección Visual', 'CTA', 'Sticker', 'Imagen', 'Pieza relacionada',
  ];

  // Filas: ordenadas por día y orden, con separadores por día
  const rows = [];
  let currentDay = 0;
  let globalIndex = 0;
  const grabadaRowIndices = []; // Para resaltar filas grabadas

  for (const s of allStories) {
    // Separador visual cuando cambia el día
    if (s.dayOfWeek !== currentDay) {
      if (currentDay !== 0) {
        rows.push(Array(headers.length).fill('')); // fila vacía como separador
      }
      currentDay = s.dayOfWeek;
    }

    globalIndex++;
    const rowIndex = rows.length + 1; // +1 por cabecera
    if (s.isRecorded) grabadaRowIndices.push(rowIndex);

    // Imagen: si tiene imageUrl de Drive, mostrar con =IMAGE()
    let imagenCell = '';
    if (s.imageUrl && s.imageUrl.startsWith('http')) {
      imagenCell = `=IMAGE("${s.imageUrl}")`;
    }

    rows.push([
      globalIndex,
      s.dayLabel || `Día ${s.dayOfWeek}`,
      s.order,
      (s.storyType || '').replace(/_/g, ' ').toUpperCase(),
      s.isRecorded ? '🎥 SÍ — GRABAR' : 'Imagen/Texto',
      s.approvalStatus === 'aprobado' ? 'Aprobado'
        : s.approvalStatus === 'cambios' ? 'Cambios'
        : s.approvalStatus === 'no_va'   ? 'No va'
        : 'Pendiente',
      s.clientComments || '',
      s.status === 'published' ? 'Sí' : 'No',
      s.isRecorded ? (s.script || '') : (s.textContent || ''),
      s.visualDirection || '',
      s.cta || '',
      s.stickerSuggestion || '',
      imagenCell,
      '', // pieza relacionada se llena abajo
    ]);
  }

  // Resolver nombres de piezas relacionadas
  let rowIdx = 0;
  let dayTracker = 0;
  for (let i = 0; i < allStories.length; i++) {
    if (allStories[i].dayOfWeek !== dayTracker) {
      if (dayTracker !== 0) rowIdx++; // saltar fila separador
      dayTracker = allStories[i].dayOfWeek;
    }
    if (allStories[i].relatedContentId) {
      const related = await Content.findByPk(allStories[i].relatedContentId, { attributes: ['title', 'format'] });
      if (related) {
        rows[rowIdx][13] = `[${(related.format || '').toUpperCase()}] ${related.title}`;
      }
    }
    rowIdx++;
  }

  // Escribir datos
  await sheets.spreadsheets.values.update({
    spreadsheetId: MASTER_SHEET_ID,
    range: `'${tabTitle}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers, ...rows] },
  });

  // Columnas: F(ESTADO)=5, G(COMENTARIOS)=6, H(PUBLICADO)=7
  const ESTADO_COL = 5;
  const COMENTARIOS_COL = 6;
  const PUBLICADO_COL = 7;
  const IMAGEN_COL = 12;

  // Formato
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: MASTER_SHEET_ID,
    requestBody: {
      requests: [
        // Cabecera oscura
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.1, green: 0.1, blue: 0.18 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // Fondo verde en ESTADO (col F = índice 5)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: ESTADO_COL, endColumnIndex: ESTADO_COL + 1 },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.85, green: 0.97, blue: 0.87 } } },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
        // Fondo amarillo en COMENTARIOS (col G = índice 6)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: COMENTARIOS_COL, endColumnIndex: COMENTARIOS_COL + 1 },
            cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 0.98, blue: 0.8 } } },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
        // Fondo azul claro en PUBLICADO (col H = índice 7)
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: PUBLICADO_COL, endColumnIndex: PUBLICADO_COL + 1 },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.82, green: 0.88, blue: 1 } } },
            fields: 'userEnteredFormat.backgroundColor',
          },
        },
        // Congelar primera fila
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        // Anchos de columna
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 40 }, fields: 'pixelSize' } },   // #
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 90 }, fields: 'pixelSize' } },   // Día
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 55 }, fields: 'pixelSize' } },   // Orden
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 130 }, fields: 'pixelSize' } },  // Tipo
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 140 }, fields: 'pixelSize' } },  // ¿GRABAR?
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } },  // ESTADO
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },  // COMENTARIOS
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },  // PUBLICADO
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 }, properties: { pixelSize: 350 }, fields: 'pixelSize' } },  // Guion/Texto
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 9, endIndex: 10 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } },  // Dirección Visual
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } }, // CTA
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 11, endIndex: 12 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } }, // Sticker
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 12, endIndex: 13 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } }, // Imagen
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 13, endIndex: 14 }, properties: { pixelSize: 200 }, fields: 'pixelSize' } }, // Pieza relacionada
        // Altura de filas de datos (100px para que se vea la imagen)
        { updateDimensionProperties: { range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 100 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        // Resaltar filas de stories grabadas con fondo rosa claro
        ...grabadaRowIndices.map(ri => ({
          repeatCell: {
            range: { sheetId, startRowIndex: ri, endRowIndex: ri + 1, startColumnIndex: 0, endColumnIndex: 5 },
            cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 0.91, blue: 0.91 } } },
            fields: 'userEnteredFormat.backgroundColor',
          },
        })),
        // Dropdown en ESTADO
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: ESTADO_COL, endColumnIndex: ESTADO_COL + 1 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'Pendiente' },
                  { userEnteredValue: 'Aprobado' },
                  { userEnteredValue: 'Cambios' },
                  { userEnteredValue: 'No va' },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // Dropdown en PUBLICADO
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: PUBLICADO_COL, endColumnIndex: PUBLICADO_COL + 1 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'No' },
                  { userEnteredValue: 'Sí' },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // Wrap text
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1 },
            cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
            fields: 'userEnteredFormat.wrapStrategy',
          },
        },
        // Eliminar protecciones anteriores
        ...oldProtectionDeletes,
      ],
    },
  });

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/edit#gid=${sheetId}`;

  // Guardar URL en la planeación
  await planning.update({ storiesSheetUrl: sheetUrl });

  logger.info(`Sheet de stories exportado: ${sheetUrl}`);
  return { sheetUrl, spreadsheetId: MASTER_SHEET_ID, sheetId };
}

// ── Stories: Importar aprobaciones desde el sheet ────────────────────
async function importStoriesFromSheet(planningId) {
  const Story = require('../modules/stories/story.model');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const planning = await Planning.findByPk(planningId, {
    include: [{ model: Client, as: 'client' }],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  // Query stories por separado con order correcto
  const storiesList = await Story.findAll({
    where: { planning_id: planningId },
    order: [['day_of_week', 'ASC'], ['order', 'ASC']],
  });

  const clientName = planning.client.name;
  const mesNombre  = MESES[planning.month];
  const tabTitle   = `${clientName} — Stories S${planning.week || 1} ${mesNombre} ${planning.year}`;

  // Leer columnas F, G y H (ESTADO, COMENTARIOS, PUBLICADO para stories), desde fila 2
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: `'${tabTitle}'!F2:H500`,
  });
  const sheetRows = res.data.values || [];

  const STATUS_MAP = {
    'aprobado':  'aprobado',
    'cambios':   'cambios',
    'no va':     'no_va',
    'pendiente': 'pendiente',
  };

  let updated = 0;
  let sheetRowIdx = 0;
  let currentDay = 0;

  for (let i = 0; i < storiesList.length; i++) {
    // Saltar fila separadora cuando cambia el día
    if (storiesList[i].dayOfWeek !== currentDay) {
      if (currentDay !== 0) sheetRowIdx++; // fila vacía separadora
      currentDay = storiesList[i].dayOfWeek;
    }

    const row = sheetRows[sheetRowIdx] || [];
    const estadoRaw      = (row[0] || 'Pendiente').toLowerCase().trim();
    const comentarios    = (row[1] || '').trim();
    const publicadoRaw   = (row[2] || 'No').toLowerCase().trim();
    const approvalStatus = STATUS_MAP[estadoRaw] || 'pendiente';
    const status = publicadoRaw === 'sí' ? 'published' : (approvalStatus === 'aprobado' ? 'approved' : storiesList[i].status);

    await storiesList[i].update({ clientComments: comentarios, approvalStatus, status });
    updated++;
    sheetRowIdx++;
  }

  logger.info(`Aprobaciones de stories importadas: ${updated} stories actualizadas`);
  return { updated };
}

module.exports = { exportToSheet, importFromSheet, exportStoriesToSheet, importStoriesFromSheet };
