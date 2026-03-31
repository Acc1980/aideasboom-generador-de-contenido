/**
 * sheetsSync.service.js
 * Lee los Google Sheets vinculados a los formularios y sincroniza
 * los datos con la base de datos local vía la API interna.
 */

const { google } = require('googleapis');
const path = require('path');
const logger = require('../config/logger');
const Client = require('../modules/clients/client.model');
const Strategy = require('../modules/strategy/strategy.model');

const CREDENTIALS_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../../credentials/google-service-account.json');

// Soporte para credenciales inline via env var
function getCredentialsOption() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return { credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) };
  }
  return { keyFile: CREDENTIALS_PATH };
}

// IDs de los sheets (se configuran en .env)
const SHEET_IDS = {
  clientes:   process.env.SHEET_CLIENTES_ID,
  anual:      process.env.SHEET_ESTRATEGIA_ANUAL_ID,
  trimestral: process.env.SHEET_ESTRATEGIA_TRIMESTRAL_ID,
  mensual:    process.env.SHEET_ESTRATEGIA_MENSUAL_ID,
};

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function getAuth() {
  return new google.auth.GoogleAuth({
    ...getCredentialsOption(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function getRows(sheetId, range = 'A1:Z1000') {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quita tildes
    .replace(/\s+/g, '_'));
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
    return obj;
  });
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Sincronizar clientes ─────────────────────────────────────────────
async function syncClientes() {
  if (!SHEET_IDS.clientes) return { skipped: true, reason: 'SHEET_CLIENTES_ID no configurado' };

  const rows = await getRows(SHEET_IDS.clientes);
  const records = rowsToObjects(rows);
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const r of records) {
    if (!r.nombre_marca) { results.skipped++; continue; }

    const slug = slugify(r.nombre_marca);
    const brandIdentity = {
      tone: r.tono_comunicacion || r.tono || '',
      personality: r.emocion_objetivo || '',
      emojisAllowed: (r.usar_emojis || '').toLowerCase() === 'si',
      forbiddenWords: r.palabras_prohibidas
        ? r.palabras_prohibidas.split(',').map(w => w.trim()).filter(Boolean)
        : [],
      baseHashtags: r.hashtags_base
        ? r.hashtags_base.split(',').map(h => h.trim()).filter(Boolean)
        : [],
      colors: {
        primary: r.color_principal || '',
        secondary: r.color_secundario || '',
        accent: r.color_acento || '',
      },
      typography: {
        titles: r.tipografia_titulos || '',
        body: r.tipografia_textos || '',
      },
    };

    const payload = {
      name: r.nombre_marca,
      slug,
      packageType: (r.paquete || 'basico').toLowerCase(),
      industry: r.tipo_marca || '',
      targetAudience: r.publico_objetivo || '',
      active: (r.estado_cliente || 'activo').toLowerCase() !== 'inactivo',
      brandIdentity,
    };

    try {
      const [client, created] = await Client.upsert(payload, { returning: true });
      if (created) results.created++;
      else results.updated++;
    } catch (err) {
      results.errors.push({ marca: r.nombre_marca, error: err.message });
    }
  }

  return results;
}

// ── Helper: obtener clientId por nombre ──────────────────────────────
async function findClientId(nombreMarca) {
  const slug = slugify(nombreMarca);
  const client = await Client.findOne({ where: { slug } });
  return client ? client.id : null;
}

// ── Sincronizar estrategia anual ─────────────────────────────────────
async function syncEstrategiaAnual() {
  if (!SHEET_IDS.anual) return { skipped: true, reason: 'SHEET_ESTRATEGIA_ANUAL_ID no configurado' };

  const rows = await getRows(SHEET_IDS.anual);
  const records = rowsToObjects(rows);
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };
  const currentYear = new Date().getFullYear();

  for (const r of records) {
    const marcaKey = Object.keys(r).find(k => k.includes('nombre') || k.includes('marca'));
    const nombreMarca = marcaKey ? r[marcaKey] : '';
    if (!nombreMarca) { results.skipped++; continue; }

    const clientId = await findClientId(nombreMarca);
    if (!clientId) {
      results.errors.push({ marca: nombreMarca, error: 'Cliente no encontrado en BD' });
      continue;
    }

    const ejeBase = r['cual_es_el_eje_base_del_negocio'] || r['eje_base'] || '';
    const strategyData = {
      focus: r['cual_es_el_foco_principal_de_comunicacion_este_ano'] || r['foco_principal'] || '',
      transversalMessage: r['mensaje_transversal_del_ano'] || r['mensaje_transversal'] || '',
      axes: [r['eje_1'], r['eje_2'], r['eje_3'], r['eje_4_(opcional)'] || r['eje_4']].filter(Boolean),
      baseAxis: ejeBase,
    };

    try {
      const [, created] = await Strategy.upsert({
        clientId,
        periodType: 'annual',
        year: currentYear,
        strategyData,
        conversionActive: false,
      }, { returning: true });
      if (created) results.created++;
      else results.updated++;
    } catch (err) {
      results.errors.push({ marca: nombreMarca, error: err.message });
    }
  }

  return results;
}

// ── Sincronizar estrategia trimestral ────────────────────────────────
async function syncEstrategiaTrimestral() {
  if (!SHEET_IDS.trimestral) return { skipped: true, reason: 'SHEET_ESTRATEGIA_TRIMESTRAL_ID no configurado' };

  const rows = await getRows(SHEET_IDS.trimestral);
  const records = rowsToObjects(rows);
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };
  const currentYear = new Date().getFullYear();

  for (const r of records) {
    const marcaKey = Object.keys(r).find(k => k.includes('nombre') || k.includes('marca'));
    const nombreMarca = marcaKey ? r[marcaKey] : '';
    if (!nombreMarca) { results.skipped++; continue; }

    const clientId = await findClientId(nombreMarca);
    if (!clientId) {
      results.errors.push({ marca: nombreMarca, error: 'Cliente no encontrado en BD' });
      continue;
    }

    const trimestreRaw = (r['trimestre_activo'] || r['trimesgtre_activo'] || 'T1').toUpperCase();
    const quarter = parseInt(trimestreRaw.replace('T', ''), 10) || 1;
    const conversionRaw = (r['existe_un_objetivo_de_conversion_este_trimestre'] || '').toLowerCase();
    const conversionActive = conversionRaw.includes('activo');

    const strategyData = {
      mainObjective: r['cual_es_el_objetivo_principal_del_trimestre'] || '',
      secondaryObjectives: r['cual_es_el_objetivo_secundario_(max_2)'] || r['objetivo_secundario'] || '',
      conversionType: r['si_hay_conversion_que_se_ofrece'] || '',
      emotions: r['emociones_o_estados_a_trabajar'] || '',
      formatDistribution: r['distribucion_de_formatos'] || '',
    };

    try {
      const [, created] = await Strategy.upsert({
        clientId,
        periodType: 'quarterly',
        year: currentYear,
        quarter,
        strategyData,
        conversionActive,
      }, { returning: true });
      if (created) results.created++;
      else results.updated++;
    } catch (err) {
      results.errors.push({ marca: nombreMarca, error: err.message });
    }
  }

  return results;
}

// ── Sincronizar estrategia mensual ───────────────────────────────────
async function syncEstrategiaMensual() {
  if (!SHEET_IDS.mensual) return { skipped: true, reason: 'SHEET_ESTRATEGIA_MENSUAL_ID no configurado' };

  const rows = await getRows(SHEET_IDS.mensual);
  const records = rowsToObjects(rows);
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };
  const currentYear = new Date().getFullYear();

  for (const r of records) {
    const marcaKey = Object.keys(r).find(k => k.includes('nombre') || k.includes('marca'));
    const nombreMarca = marcaKey ? r[marcaKey] : '';
    if (!nombreMarca) { results.skipped++; continue; }

    const clientId = await findClientId(nombreMarca);
    if (!clientId) {
      results.errors.push({ marca: nombreMarca, error: 'Cliente no encontrado en BD' });
      continue;
    }

    const mesRaw = (r['mes'] || '').toLowerCase();
    const month = MESES[mesRaw] || new Date().getMonth() + 1;

    const strategyData = {
      centralTheme: r['tema_central_del_mes'] || '',
      subthemes: [r['subtema_1'], r['subtema_2'], r['subtema_3'], r['subtema_4_(opcional)'] || r['subtema_4']].filter(Boolean),
      depthLevel: r['nivel_de_profundidad'] || 'media',
    };

    try {
      const [, created] = await Strategy.upsert({
        clientId,
        periodType: 'monthly',
        year: currentYear,
        month,
        strategyData,
      }, { returning: true });
      if (created) results.created++;
      else results.updated++;
    } catch (err) {
      results.errors.push({ marca: nombreMarca, error: err.message });
    }
  }

  return results;
}

// ── Sincronización completa ──────────────────────────────────────────
async function syncAll() {
  logger.info('Iniciando sincronización con Google Sheets...');
  const summary = {};

  try { summary.clientes = await syncClientes(); }
  catch (e) { summary.clientes = { error: e.message }; }

  try { summary.estrategiaAnual = await syncEstrategiaAnual(); }
  catch (e) { summary.estrategiaAnual = { error: e.message }; }

  try { summary.estrategiaTrimestral = await syncEstrategiaTrimestral(); }
  catch (e) { summary.estrategiaTrimestral = { error: e.message }; }

  try { summary.estrategiaMensual = await syncEstrategiaMensual(); }
  catch (e) { summary.estrategiaMensual = { error: e.message }; }

  logger.info('Sincronización completada', summary);
  return summary;
}

module.exports = { syncAll };
