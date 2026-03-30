/**
 * seed-ads-tracker.js
 *
 * Crea la pestaña "Ads — Lanzamiento RMP" en el Google Sheet de aprobaciones.
 * Tracker simple para llevar control de los Meta Ads del lanzamiento.
 *
 * Uso: node scripts/seed-ads-tracker.js
 */

require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../credentials/google-service-account.json');

const SHEET_ID = process.env.SHEET_APROBACIONES_ID;
const TAB_TITLE = 'Ads — Lanzamiento RMP';

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// ─── Colores ────────────────────────────────────────────────────────────────
const COLOR = {
  header:      { red: 0.10, green: 0.10, blue: 0.18 },   // negro azulado
  headerText:  { red: 1,    green: 1,    blue: 1    },
  faseS1:      { red: 0.82, green: 0.90, blue: 0.84 },   // verde suave  (Semana 1)
  faseS2:      { red: 0.98, green: 0.94, blue: 0.82 },   // amarillo suave (Semana 2)
  faseS3:      { red: 1.00, green: 0.87, blue: 0.82 },   // salmón suave  (Semana 3)
  separador:   { red: 0.93, green: 0.93, blue: 0.93 },   // gris claro
  estadoActivo:{ red: 0.83, green: 0.96, blue: 0.84 },   // verde claro
  metricHeader:{ red: 0.22, green: 0.27, blue: 0.42 },   // azul oscuro
};

// ─── Ads del lanzamiento ────────────────────────────────────────────────────
//
// Columnas:
// A: Fase | B: Creativo | C: Formato | D: Objetivo | E: Estado
// F: $/día | G: Gasto | H: Alcance | I: CTR | J: Resultado | K: Costo/resultado | L: Notas
//
// Las columnas G-K se llenan manualmente cada día desde Meta Ads Manager.

const ADS = [
  // ── SEMANA 1 ──────────────────────────────────────────────────────────────
  ['SEMANA 1', 'Imagen cover "3 bloqueos que te impiden ocupar tu lugar"', 'Imagen', 'Tráfico al Quiz', 'Activo', '$5-8', '', '', '', '', '', 'Solo la portada del carrusel. CTA → Quiz. Activo desde Mar 17 al mediodía'],
  ['SEMANA 1', 'Video Mónica — "5 señales de que estás en piloto automático"', 'Video', 'Alcance / Descubrimiento', 'Activo', '$5-8', '', '', '', '', '', 'Hook: "Si te identificaste con al menos 3... necesitas hacer este quiz." CTA → Quiz'],
  ['SEMANA 1', 'Video Mónica — "¿Sabías que 8 de cada 10 mujeres viven en piloto automático?"', 'Video', 'Tráfico al Quiz', 'Activo', '$5-8', '', '', '', '', '', 'CTA directo al quiz. Activo desde Mar 17 al mediodía'],
  // Fila separador vacía
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  // ── SEMANA 2 ──────────────────────────────────────────────────────────────
  ['SEMANA 2', 'Retargeting — Invitación Masterclass 24 marzo',        'Video',    'Registro Masterclass',  'Pendiente', '$7-10', '', '', '', '', '', 'Activar Mar 21-22. Audiencia: vieron 50%+ video S1'],
  ['SEMANA 2', 'Retargeting — Post-Masterclass apertura ventas',       'Carrusel', 'Conversión → Inscripción RMP', 'Pendiente', '$8-10', '', '', '', '', '', 'Activar Mar 25. Audiencia: asistieron masterclass'],
  // Fila separador vacía
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  // ── SEMANA 3 ──────────────────────────────────────────────────────────────
  ['SEMANA 3', 'Video testimonial — "Esto fue RMP"',                   'Video',    'Conversión → Inscripción RMP', 'Pendiente', '$10-12', '', '', '', '', '', 'Activar Mar 30. Audiencia caliente'],
  ['SEMANA 3', 'Carrusel "Lo que incluye RMP"',                        'Carrusel', 'Conversión → Inscripción RMP', 'Pendiente', '$10-12', '', '', '', '', '', 'Activar Mar 30. Retargeting agresivo'],
  ['SEMANA 3', 'Imagen urgencia — últimos cupos',                      'Imagen',   'Conversión → Inscripción RMP', 'Pendiente', '$12-15', '', '', '', '', '', 'Activar Abr 2-3. Audiencia: visitaron página de pago'],
];

const HEADERS = [
  'Fase', 'Creativo', 'Formato', 'Objetivo', 'Estado',
  '$/día', 'Gasto total', 'Alcance', 'CTR', 'Resultados', 'Costo/resultado', 'Notas',
];

// ─── Instrucciones del tracker ───────────────────────────────────────────────
// Se ponen arriba del todo como contexto rápido
const INSTRUCCIONES = [
  ['TRACKER DE META ADS — RECONOCIENDO MI PODER', '', '', '', '', '', '', '', '', '', '', ''],
  ['Actualizar columnas G-K cada 2-3 días desde Meta Ads Manager', '', '', '', '', '', '', '', '', '', '', ''],
  ['Estado: Activo = corriendo | Pausado = detenido | Pendiente = aún no activar', '', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', '', ''],
];

async function main() {
  if (!SHEET_ID) {
    console.error('❌ SHEET_APROBACIONES_ID no definido en .env');
    process.exit(1);
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // ── Verificar si la pestaña ya existe ──────────────────────────────────────
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets(properties)',
  });
  const existingSheets = meta.data.sheets || [];
  const existing = existingSheets.find(s => s.properties.title === TAB_TITLE);

  let sheetId;

  if (existing) {
    sheetId = existing.properties.sheetId;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `'${TAB_TITLE}'`,
    });
    console.log('♻️  Pestaña existente limpiada');
  } else {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: TAB_TITLE, index: 0 } } }],
      },
    });
    sheetId = addRes.data.replies[0].addSheet.properties.sheetId;
    console.log('✅ Pestaña creada');
  }

  // ── Escribir datos ─────────────────────────────────────────────────────────
  const allRows = [
    ...INSTRUCCIONES,
    HEADERS,
    ...ADS,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${TAB_TITLE}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: allRows },
  });

  // ── Formato ────────────────────────────────────────────────────────────────
  const INSTR_ROWS = INSTRUCCIONES.length;   // 4
  const HEADER_ROW = INSTR_ROWS;             // fila índice 4 (0-based)
  const DATA_START = HEADER_ROW + 1;         // índice 5

  // Índices de filas de datos con color de fase
  // Semana 1: rows 0-3 de ADS → DATA_START + 0..3
  // Separador: DATA_START + 4
  // Semana 2: DATA_START + 5..6
  // Separador: DATA_START + 7
  // Semana 3: DATA_START + 8..10

  const rowColorRequests = [];

  // Colorear por fase
  const faseColors = [
    { start: DATA_START,     end: DATA_START + 4,  color: COLOR.faseS1 },   // S1
    { start: DATA_START + 5, end: DATA_START + 7,  color: COLOR.faseS2 },   // S2
    { start: DATA_START + 8, end: DATA_START + 11, color: COLOR.faseS3 },   // S3
  ];

  for (const { start, end, color } of faseColors) {
    rowColorRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: start, endRowIndex: end, startColumnIndex: 0, endColumnIndex: 12 },
        cell: { userEnteredFormat: { backgroundColor: color } },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  }

  // Colorear separadores
  for (const sepRow of [DATA_START + 4, DATA_START + 7]) {
    rowColorRequests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: sepRow, endRowIndex: sepRow + 1, startColumnIndex: 0, endColumnIndex: 12 },
        cell: { userEnteredFormat: { backgroundColor: COLOR.separador } },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        // ── Título principal ────────────────────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: COLOR.header,
                textFormat: { bold: true, fontSize: 13, foregroundColor: COLOR.headerText },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // Fusionar título
        {
          mergeCells: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 12 },
            mergeType: 'MERGE_ALL',
          },
        },
        // ── Instrucciones (filas 1-3) ───────────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, endRowIndex: INSTR_ROWS },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.95, green: 0.95, blue: 0.98 },
                textFormat: { italic: true, fontSize: 10, foregroundColor: { red: 0.4, green: 0.4, blue: 0.5 } },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // ── Cabecera de columnas ────────────────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: HEADER_ROW, endRowIndex: HEADER_ROW + 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: COLOR.metricHeader,
                textFormat: { bold: true, foregroundColor: COLOR.headerText },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // ── Congelar filas de instrucciones + cabecera ──────────────────────
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: HEADER_ROW + 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        // ── Colores por fase ────────────────────────────────────────────────
        ...rowColorRequests,
        // ── Dropdown ESTADO (columna E = índice 4) ──────────────────────────
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: DATA_START, endRowIndex: DATA_START + 15, startColumnIndex: 4, endColumnIndex: 5 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'Activo' },
                  { userEnteredValue: 'Pausado' },
                  { userEnteredValue: 'Pendiente' },
                  { userEnteredValue: 'Terminado' },
                ],
              },
              showCustomUi: true,
              strict: true,
            },
          },
        },
        // ── Anchos de columna ───────────────────────────────────────────────
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0,  endIndex: 1  }, properties: { pixelSize: 90  }, fields: 'pixelSize' } }, // Fase
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1,  endIndex: 2  }, properties: { pixelSize: 280 }, fields: 'pixelSize' } }, // Creativo
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2,  endIndex: 3  }, properties: { pixelSize: 90  }, fields: 'pixelSize' } }, // Formato
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3,  endIndex: 4  }, properties: { pixelSize: 200 }, fields: 'pixelSize' } }, // Objetivo
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4,  endIndex: 5  }, properties: { pixelSize: 90  }, fields: 'pixelSize' } }, // Estado
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 5,  endIndex: 6  }, properties: { pixelSize: 80  }, fields: 'pixelSize' } }, // $/día
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6,  endIndex: 7  }, properties: { pixelSize: 90  }, fields: 'pixelSize' } }, // Gasto
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 7,  endIndex: 8  }, properties: { pixelSize: 90  }, fields: 'pixelSize' } }, // Alcance
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 8,  endIndex: 9  }, properties: { pixelSize: 70  }, fields: 'pixelSize' } }, // CTR
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 9,  endIndex: 10 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } }, // Resultados
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } }, // Costo/resultado
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 11, endIndex: 12 }, properties: { pixelSize: 280 }, fields: 'pixelSize' } }, // Notas
        // ── Wrap text en datos ──────────────────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: DATA_START },
            cell: { userEnteredFormat: { wrapStrategy: 'WRAP', verticalAlignment: 'MIDDLE' } },
            fields: 'userEnteredFormat(wrapStrategy,verticalAlignment)',
          },
        },
        // ── Centrar columnas de métricas ────────────────────────────────────
        {
          repeatCell: {
            range: { sheetId, startRowIndex: DATA_START, startColumnIndex: 4, endColumnIndex: 12 },
            cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
      ],
    },
  });

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sheetId}`;
  console.log(`\n✅ Tracker de Ads creado exitosamente`);
  console.log(`   → ${sheetUrl}\n`);
  console.log('Columnas a llenar desde Meta Ads Manager (cada 2-3 días):');
  console.log('  G: Gasto total | H: Alcance | I: CTR | J: Resultados | K: Costo/resultado\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
