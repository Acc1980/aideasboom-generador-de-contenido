/**
 * Meta Service — Publicación automática en Instagram via Graph API.
 *
 * Soporta:
 *   - post      → imagen única
 *   - reel      → video vertical
 *   - carrusel  → hasta 10 imágenes
 *
 * Requiere en .env:
 *   META_IG_ACCOUNT_ID  — ID de la cuenta de Instagram Business
 *   META_SYSTEM_TOKEN   — Token de sistema (nunca expira)
 *   APP_URL             — URL pública del servidor (ej: https://sys-ab7f.lazonacampeon.com)
 */

const https = require('https');
const logger = require('../config/logger');

const IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID;
const ACCESS_TOKEN  = process.env.META_SYSTEM_TOKEN;
const APP_URL       = (process.env.APP_URL || 'https://sys-ab7f.lazonacampeon.com').replace(/\/$/, '');
const GRAPH_VERSION = 'v19.0';

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad HTTP para Graph API
// ─────────────────────────────────────────────────────────────────────────────

function graphRequest(method, path, params = {}) {
  return new Promise((resolve, reject) => {
    const allParams = { ...params, access_token: ACCESS_TOKEN };
    const query     = new URLSearchParams(allParams).toString();

    let reqPath, body;
    if (method === 'GET') {
      reqPath = `/${GRAPH_VERSION}${path}?${query}`;
      body    = null;
    } else {
      reqPath = `/${GRAPH_VERSION}${path}`;
      body    = query;
    }

    const options = {
      hostname: 'graph.facebook.com',
      path:     reqPath,
      method,
      headers:  {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.error) reject(new Error(`Meta API: ${data.error.message} (code ${data.error.code})`));
          else resolve(data);
        } catch (e) {
          reject(new Error('Meta parse error: ' + raw.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Construir caption completo (copy + hashtags)
// ─────────────────────────────────────────────────────────────────────────────

function buildCaption(content) {
  const parts = [];
  if (content.copy) parts.push(content.copy);
  // Solo agregar CTA si no está ya al final del copy
  if (content.cta && !content.copy?.trim().endsWith(content.cta.trim())) {
    parts.push(`\n${content.cta}`);
  }
  if (content.hashtags?.length) parts.push(`\n\n${content.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`);
  return parts.join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Publicar POST (imagen única)
// ─────────────────────────────────────────────────────────────────────────────

async function publishPost(content) {
  if (!content.imageUrl) throw new Error('El post no tiene imagen generada');

  const imageUrl = content.imageUrl.startsWith('http')
    ? content.imageUrl
    : `${APP_URL}${content.imageUrl}`;

  logger.info(`[meta] Publicando post "${content.title}" → ${imageUrl}`);

  // 1. Crear container
  const container = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption:   buildCaption(content),
  });

  // 2. Publicar
  const result = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });

  logger.info(`[meta] Post publicado → media_id: ${result.id}`);
  return result.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Publicar REEL (video vertical)
// ─────────────────────────────────────────────────────────────────────────────

async function publishReel(content) {
  if (!content.videoUrl) throw new Error('El reel no tiene video generado');

  const videoUrl = content.videoUrl.startsWith('http')
    ? content.videoUrl
    : `${APP_URL}${content.videoUrl}`;

  logger.info(`[meta] Publicando reel "${content.title}" → ${videoUrl}`);

  // 1. Crear container de video
  const container = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media`, {
    media_type:  'REELS',
    video_url:   videoUrl,
    caption:     buildCaption(content),
    share_to_feed: 'true',
  });

  // 2. Esperar a que Meta procese el video (polling cada 10s, max 3 min)
  logger.info(`[meta] Esperando procesamiento del video (container: ${container.id})...`);
  const creationId = await waitForVideoReady(container.id);

  // 3. Publicar (espera extra tras FINISHED para evitar error code 1)
  await new Promise((r) => setTimeout(r, 8000));
  const result = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: creationId,
  });

  logger.info(`[meta] Reel publicado → media_id: ${result.id}`);
  return result.id;
}

async function waitForVideoReady(containerId, maxWaitMs = 3 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 10000));
    const status = await graphRequest('GET', `/${containerId}`, {
      fields: 'status_code,status',
    });
    logger.info(`[meta] Video status: ${status.status_code}`);
    if (status.status_code === 'FINISHED') return containerId;
    if (status.status_code === 'ERROR') throw new Error(`Meta rechazó el video: ${status.status}`);
  }
  throw new Error('Timeout esperando procesamiento de video en Meta (>3 min)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Publicar CARRUSEL
// ─────────────────────────────────────────────────────────────────────────────

async function publishCarrusel(content, planningId) {
  // Reconstruir URLs de slides a partir del orden del contenido
  // Las imágenes se generan como: /images/{planningId}/carousel_{order}_s{n}.png
  const slides = content.carouselSlides?.slides || content.carouselSlides || [];
  if (!slides.length) throw new Error('El carrusel no tiene slides definidos');

  const slideUrls = slides.map((_, i) => {
    const filename = `carousel_${content.order}_s${i + 1}.png`;
    return `${APP_URL}/images/${planningId}/${filename}`;
  });

  logger.info(`[meta] Publicando carrusel "${content.title}" (${slideUrls.length} slides)`);

  // 1. Crear container para cada slide
  const itemIds = [];
  for (const url of slideUrls) {
    const item = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media`, {
      image_url:        url,
      is_carousel_item: 'true',
    });
    itemIds.push(item.id);
    logger.info(`[meta] Slide subida → ${item.id}`);
  }

  // 2. Crear container del carrusel
  const carousel = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media`, {
    media_type: 'CAROUSEL',
    children:   itemIds.join(','),
    caption:    buildCaption(content),
  });

  // 3. Publicar
  const result = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: carousel.id,
  });

  logger.info(`[meta] Carrusel publicado → media_id: ${result.id}`);
  return result.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Publicar STORY (imagen)
// ─────────────────────────────────────────────────────────────────────────────

async function publishStory(story) {
  if (!story.imageUrl) throw new Error('La story no tiene imagen generada');

  const imageUrl = story.imageUrl.startsWith('http')
    ? story.imageUrl
    : `${APP_URL}${story.imageUrl}`;

  logger.info(`[meta] Publicando story tipo "${story.storyType}" → ${imageUrl}`);

  const container = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media`, {
    image_url:  imageUrl,
    media_type: 'STORIES',
  });

  const result = await graphRequest('POST', `/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });

  logger.info(`[meta] Story publicada → media_id: ${result.id}`);
  return result.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Función principal — detecta el formato y publica
// ─────────────────────────────────────────────────────────────────────────────

async function publishContent(content, planningId) {
  if (!IG_ACCOUNT_ID) throw new Error('META_IG_ACCOUNT_ID no está configurada en .env');
  if (!ACCESS_TOKEN)  throw new Error('META_SYSTEM_TOKEN no está configurada en .env');

  switch (content.format) {
    case 'post':     return publishPost(content);
    case 'reel':     return publishReel(content);
    case 'carrusel': return publishCarrusel(content, planningId);
    default: throw new Error(`Formato no soportado para publicación: ${content.format}`);
  }
}

module.exports = { publishContent, publishStory };
