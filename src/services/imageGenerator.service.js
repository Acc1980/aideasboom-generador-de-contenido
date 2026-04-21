/**
 * Image Generator Service
 *
 * Genera imágenes PNG de las piezas de contenido usando Puppeteer.
 * Formatos generados:
 *   - post     → 1080×1080
 *   - carrusel → 1080×1080 por slide (todos los slides)
 *
 * NOTA: Los reels NO se generan como imagen — el cliente los graba.
 *
 * Las imágenes se guardan en src/public/images/<planningId>/
 * y se actualiza el campo image_url de cada Content.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const Content = require('../modules/content/content.model');
const Planning = require('../modules/planning/planning.model');
const Client = require('../modules/clients/client.model');
const logger = require('../config/logger');

const OUTPUT_BASE = path.join(__dirname, '../public/images');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convierte el logo local a data URL base64 para embeber en el HTML */
function logoToDataUrl(logoUrl) {
  if (!logoUrl) return null;
  const localPath = path.join(__dirname, '../public', logoUrl.replace(/^\//, ''));
  if (!fs.existsSync(localPath)) return null;
  const ext = path.extname(localPath).slice(1).toLowerCase();
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' }[ext] || 'image/png';
  const data = fs.readFileSync(localPath).toString('base64');
  return `data:${mime};base64,${data}`;
}

/**
 * Determina si un color hex es claro (para elegir texto oscuro/claro encima).
 * Retorna true si la luminancia percibida > 0.5
 */
function isLightColor(hex) {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.5;
}

/** Ajusta tamaño de fuente según longitud del texto */
function hookFontSize(text, maxPx, minPx) {
  const len = (text || '').length;
  if (len > 160) return minPx;
  if (len > 100) return Math.round(minPx + (maxPx - minPx) * 0.4);
  if (len > 60)  return Math.round(minPx + (maxPx - minPx) * 0.7);
  return maxPx;
}

/**
 * Genera el bloque @import de Google Fonts.
 * Solo incluye fuentes que NO sean del sistema (Georgia, Arial, etc.)
 */
function buildFontsImport(titleFont, bodyFont) {
  const sysfonts = ['Georgia', 'Arial', 'Helvetica', 'Times New Roman', 'Verdana', 'Trebuchet MS'];
  const parts = [];
  if (titleFont && !sysfonts.includes(titleFont)) {
    parts.push(`family=${titleFont.replace(/ /g, '+')}:ital,wght@0,400;0,600;0,700;1,400`);
  }
  if (bodyFont && !sysfonts.includes(bodyFont) && bodyFont !== titleFont) {
    parts.push(`family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600;700`);
  }
  if (parts.length === 0) return '';
  return `@import url('https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap');`;
}

/** Construye stack CSS de fuente con fallback */
function ff(fontName, type) {
  const sysfonts = ['Georgia', 'Arial', 'Helvetica', 'Times New Roman', 'Verdana'];
  if (!fontName || sysfonts.includes(fontName)) {
    return type === 'serif' ? "Georgia, 'Times New Roman', serif" : "Arial, sans-serif";
  }
  const fallback = type === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif';
  return `'${fontName}', ${fallback}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLA POST (1080×1080)
// Fondo: foto AI a pantalla completa + overlay oscuro de marca.
// Texto: Logo + Hook hero + CTA sobre la foto.
// ─────────────────────────────────────────────────────────────────────────────
function buildPostHTML(piece, client, bgDataUrl) {
  const bi = client.brandIdentity || {};
  const primary    = bi.primaryColor || '#1a1a2e';
  const accent     = bi.accentColor  || '#c88d74';
  const lightColor = bi.lightColor   || '#f0ede8';
  const titleFont  = bi.titleFont    || 'Georgia';
  const bodyFont   = bi.bodyFont     || 'Arial';
  const titleFF    = ff(titleFont, 'serif');
  const bodyFF     = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc    = logoToDataUrl(client.logoUrl);
  const fontSize   = hookFontSize(piece.hook, 82, 56);
  const hookHtml   = esc(piece.hook || piece.title || '').replace(/\n/g, '<br>');

  const bgStyle = bgDataUrl
    ? `background:url('${bgDataUrl}') center/cover no-repeat`
    : `background:${primary}`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1080px;overflow:hidden}
  body{${bgStyle};font-family:${bodyFF};position:relative;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:80px 90px}
  .overlay{position:absolute;inset:0;
    background:linear-gradient(
      to bottom,
      rgba(0,0,0,0.15) 0%,
      rgba(0,0,0,0.45) 50%,
      rgba(0,0,0,0.65) 100%
    )}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;
    align-items:center;width:100%}
  .logo-wrap{position:absolute;top:48px;left:60px;z-index:2;
    display:inline-flex;align-items:center;gap:14px;
    background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);
    padding:12px 20px;border-radius:12px}
  .logo{max-width:72px;max-height:72px;object-fit:contain;display:block}
  .logo-name{font-family:${bodyFF};font-size:22px;font-weight:700;
    color:${accent};letter-spacing:2px;text-transform:uppercase;white-space:nowrap}
  .hook-wrap{text-align:center;margin-bottom:44px;max-width:900px}
  .hook{
    font-family:${titleFF};font-size:${fontSize}px;
    font-style:italic;font-weight:700;line-height:1.3;
    color:#fff;text-shadow:0 3px 16px rgba(0,0,0,0.7);
  }
  .divider{width:280px;height:3px;background:${accent};
    margin:0 auto 48px;border-radius:2px}
  .cta{
    background:${accent};color:${isLightColor(accent) ? primary : '#fff'};
    padding:22px 60px;border-radius:50px;
    font-family:${bodyFF};font-size:28px;font-weight:700;
    letter-spacing:0.5px;text-align:center;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
  }
</style></head>
<body>
  <div class="overlay"></div>
  <div class="logo-wrap">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <span class="logo-name">${esc(client.name || 'La Zona Campeón')}</span>
  </div>
  <div class="content">
    <div class="hook-wrap"><span class="hook">${hookHtml}</span></div>
    <div class="divider"></div>
    <div class="cta">${esc(piece.cta)}</div>
  </div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLA CAROUSEL SLIDE (1080×1080)
// Portada y cierre: foto AI + overlay oscuro.
// Slides del centro: alternan primaryColor / accentColor (ritmo visual).
// ─────────────────────────────────────────────────────────────────────────────
function buildCarouselSlideHTML(slide, piece, client, totalSlides, bgDataUrl) {
  const bi = client.brandIdentity || {};
  const primary    = bi.primaryColor || '#0f172a';
  const accent     = bi.accentColor  || '#a78bfa';
  const textColor  = bi.textColor    || '#2c2c2c';
  const lightColor = bi.lightColor   || '#f8fafc';
  const titleFont  = bi.titleFont    || 'Georgia';
  const bodyFont   = bi.bodyFont     || 'Arial';
  const titleFF    = ff(titleFont, 'serif');
  const bodyFF     = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc    = logoToDataUrl(client.logoUrl);

  const isFirst = slide.slide === 1;
  const isLast  = slide.slide === totalSlides;
  const isPhoto = (isFirst || isLast) && bgDataUrl;

  // Paleta manual La Zona Campeón: azul oscuro + 2 beiges derivados del dorado
  const MID_LIGHT1 = '#faf2e4'; // crema muy suave (gold muy claro)
  const MID_LIGHT2 = '#f0e2c4'; // beige cálido (gold medio-claro)

  // Rotación de 3 colores: dark → crema → beige → dark → ...
  const midIndex = slide.slide - 2; // 0-based para slides del centro
  const rotation = ((midIndex % 3) + 3) % 3;
  let midBg, midFg, midSepColor, midIsLight;
  if (rotation === 0) {
    midBg = primary;    midFg = accent;   midSepColor = accent;   midIsLight = false;
  } else if (rotation === 1) {
    midBg = MID_LIGHT1; midFg = primary;  midSepColor = primary;  midIsLight = true;
  } else {
    midBg = MID_LIGHT2; midFg = primary;  midSepColor = primary;  midIsLight = true;
  }

  // Puntos de progreso
  const dotColor = isPhoto ? '#fff' : (midIsLight ? primary : accent);
  const dots = Array.from({ length: totalSlides }, (_, i) => {
    const active = i + 1 === slide.slide;
    return `<div style="width:${active ? 20 : 7}px;height:7px;border-radius:4px;background:${dotColor};opacity:${active ? 0.9 : 0.25}"></div>`;
  }).join('');

  const titleHtml = esc(slide.title || '').replace(/\n/g, '<br>');
  const bodyHtml  = esc(slide.text  || '').replace(/\n/g, '<br>');

  // Logo horizontal reutilizable para slides con foto (fondo oscuro)
  const logoBlockPhoto = logoSrc ? `
    <div style="position:absolute;top:50px;left:60px;z-index:2;display:inline-flex;align-items:center;gap:12px;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:12px 20px;border-radius:12px">
      <img src="${logoSrc}" style="max-width:60px;max-height:60px;object-fit:contain;display:block">
      <span style="font-family:${bodyFF};font-size:20px;font-weight:700;color:${accent};letter-spacing:2px;text-transform:uppercase;white-space:nowrap">${esc(client.name || '')}</span>
    </div>` : '';

  if (isFirst) {
    const fSize = hookFontSize(slide.title, 86, 56);
    const bgStyle = bgDataUrl
      ? `background:url('${bgDataUrl}') center/cover no-repeat`
      : `background:${primary}`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1080px;overflow:hidden}
  body{${bgStyle};font-family:${bodyFF};position:relative;
    display:flex;flex-direction:column;align-items:center;justify-content:center;padding:90px}
  .overlay{position:absolute;inset:0;background:linear-gradient(
    to bottom,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.6) 50%,rgba(0,0,0,0.82) 100%)}
  .slide-num{position:absolute;top:50px;right:60px;z-index:2;
    font-family:${bodyFF};font-size:18px;letter-spacing:2px;opacity:.5;color:#fff}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
  .title{font-size:${fSize}px;line-height:1.2;text-align:center;font-family:${titleFF};
    font-style:italic;font-weight:700;max-width:860px;margin-bottom:40px;color:#fff;
    text-shadow:0 3px 16px rgba(0,0,0,0.7)}
  .bar{width:80px;height:3px;background:${accent};border-radius:2px;margin:0 auto 32px}
  .swipe{position:absolute;bottom:56px;right:60px;z-index:2;
    font-family:${bodyFF};font-size:18px;letter-spacing:3px;opacity:.6;color:#fff}
  .dots{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);z-index:2;
    display:flex;gap:6px;align-items:center}
</style></head>
<body>
  <div class="overlay"></div>
  ${logoBlockPhoto}
  <span class="slide-num">1 / ${totalSlides}</span>
  <div class="content">
    <h1 class="title">${titleHtml}</h1>
    <div class="bar"></div>
  </div>
  <span class="swipe">Desliza →</span>
  <div class="dots">${dots}</div>
</body></html>`;
  }

  if (isLast) {
    const ctaText = (piece.cta || '').trim().toLowerCase();
    let cierreBody = (slide.text || '').trim();
    if (ctaText) {
      const ctaNorm = ctaText.replace(/[^\w\sáéíóúñü]/gi, '').trim();
      const sentences = cierreBody.split(/(?<=[.!?])\s+/);
      cierreBody = sentences.filter(s => {
        const sNorm = s.toLowerCase().replace(/[^\w\sáéíóúñü]/gi, '').trim();
        return !sNorm.includes(ctaNorm) && !ctaNorm.includes(sNorm);
      }).join(' ').trim();
    }
    const cierreBodyHtml = esc(cierreBody).replace(/\n/g, '<br>');
    const bgStyle = bgDataUrl
      ? `background:url('${bgDataUrl}') center/cover no-repeat`
      : `background:${primary}`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1080px;overflow:hidden}
  body{${bgStyle};font-family:${bodyFF};position:relative;
    display:flex;flex-direction:column;align-items:center;justify-content:center;padding:90px}
  .overlay{position:absolute;inset:0;background:linear-gradient(
    to bottom,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.65) 50%,rgba(0,0,0,0.87) 100%)}
  .slide-num{position:absolute;top:50px;right:60px;z-index:2;
    font-family:${bodyFF};font-size:16px;letter-spacing:2px;opacity:.5;color:#fff}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
  .body-text{font-family:${bodyFF};font-size:38px;font-weight:700;line-height:1.5;
    text-align:center;max-width:820px;color:#fff;opacity:.9;margin-bottom:52px;
    text-shadow:0 2px 10px rgba(0,0,0,0.6)}
  .cta-btn{background:${accent};color:${isLightColor(accent) ? primary : '#fff'};padding:24px 60px;
    border-radius:50px;font-family:${bodyFF};font-size:28px;
    font-weight:700;letter-spacing:0.5px;text-align:center;
    box-shadow:0 4px 20px rgba(0,0,0,0.4)}
  .dots{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);z-index:2;
    display:flex;gap:6px;align-items:center}
</style></head>
<body>
  <div class="overlay"></div>
  ${logoBlockPhoto}
  <span class="slide-num">${slide.slide} / ${totalSlides}</span>
  <div class="content">
    ${cierreBodyHtml ? `<p class="body-text">${cierreBodyHtml}</p>` : ''}
    <div class="cta-btn">${esc(piece.cta)}</div>
  </div>
  <div class="dots">${dots}</div>
</body></html>`;
  }

  // ── SLIDES DE CONTENIDO (centro) — alternan primary / accent ─────────────
  const tSize = hookFontSize(slide.title, 62, 46);
  const bSize = slide.text && slide.text.length > 200 ? 38 : 44;
  // En fondo oscuro: pastilla dorada. En fondo claro: pastilla oscura suave.
  const wrapBg   = !midIsLight
    ? `background:${accent};padding:10px 16px;border-radius:10px`
    : `background:rgba(44,47,58,0.08);padding:10px 16px;border-radius:10px`;
  const nameColor = primary;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1080px;overflow:hidden}
  body{background:${midBg};font-family:${bodyFF};color:${midFg};
    display:flex;flex-direction:column;justify-content:space-between;
    padding:64px 80px;position:relative}
  .top{display:flex;justify-content:space-between;align-items:center}
  .logo-wrap{${wrapBg};display:inline-flex;align-items:center;gap:12px}
  .logo-sm{max-width:60px;max-height:60px;object-fit:contain;display:block}
  .logo-name{font-family:${bodyFF};font-size:20px;font-weight:700;color:${nameColor};letter-spacing:2px;text-transform:uppercase;white-space:nowrap}
  .slide-num{font-family:${bodyFF};font-size:16px;letter-spacing:2px;opacity:.4;color:${midFg}}
  .sep{width:56px;height:3px;background:${midSepColor};margin:28px 0;border-radius:2px}
  .title{font-size:${tSize}px;line-height:1.25;font-weight:700;font-family:${titleFF};
    color:${midFg};max-width:900px}
  .body-text{font-size:${bSize}px;line-height:1.7;color:${midFg};
    opacity:.85;max-width:900px;flex:1;padding-top:20px;font-family:${bodyFF}}
  .dots{display:flex;gap:6px;align-items:center;padding-top:16px}
</style></head>
<body>
  <div class="top">
    ${logoSrc
      ? `<div class="logo-wrap"><img class="logo-sm" src="${logoSrc}"><span class="logo-name">${esc(client.name || '')}</span></div>`
      : `<span style="opacity:.3;font-size:14px;letter-spacing:2px;font-family:${bodyFF}">${esc(client.name)}</span>`
    }
    <span class="slide-num">${slide.slide} / ${totalSlides}</span>
  </div>
  <div>
    <div class="sep"></div>
    <h2 class="title">${titleHtml}</h2>
    <p class="body-text">${bodyHtml}</p>
  </div>
  <div class="dots">${dots}</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
async function generateImages(planningId) {
  const { generateImage } = require('./fal.service');

  const planning = await Planning.findByPk(planningId, {
    include: [
      { model: Client, as: 'client' },
      { model: Content, as: 'contents', order: [['order', 'ASC']] },
    ],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const client = planning.client;
  const outputDir = path.join(OUTPUT_BASE, planningId);
  ensureDir(outputDir);

  // Posts y carruseles: solo los aprobados
  const pieces = planning.contents.filter(p => p.format !== 'reel' && p.approvalStatus === 'aprobado');
  logger.info(`Generando imágenes para planning ${planningId} → ${pieces.length} piezas (reels excluidos)`);

  // Rotación de deportes para que las fotos varíen entre piezas
  const SPORTS_ROTATION = [
    'young Latino male soccer player in action, full stadium, goal celebration, cinematic lighting',
    'young Latina female basketball player jumping to score, professional court, dynamic action',
    'Latino male athlete sprinting on athletics track, Olympic stadium, final sprint, dramatic light',
    'Latina female tennis player hitting the ball, professional court, dynamic action, crowd background',
    'young Latino male soccer player focused before a penalty kick, stadium lights, intense atmosphere',
    'Latina female volleyball player spiking, volleyball net, competition stadium, action shot',
    'Latino male swimmer competing, Olympic pool, water splashes, underwater lighting',
    'young Latina female athlete warming up on field, golden hour light, training environment',
    'Latino male soccer player in locker room, pre-match focus, team jersey, dramatic lighting',
    'Latina female runner crossing finish line, athletics track, arms raised, victory moment',
    'Latino male basketball player dribbling under pressure, crowded gym, sweat and focus',
    'young Latina female soccer player celebrating a goal, teammates hugging, stadium atmosphere',
  ];
  const sportFor = (idx) => SPORTS_ROTATION[idx % SPORTS_ROTATION.length];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const generatedFiles = [];

  try {
    const page = await browser.newPage();

    for (let pieceIdx = 0; pieceIdx < pieces.length; pieceIdx++) {
      const piece = pieces[pieceIdx];
      if (piece.format === 'post') {
        // ── Foto AI de fondo ──────────────────────────────────────────────
        const sport = sportFor(pieceIdx);
        const imagePrompt = `Fotografía deportiva profesional, ${sport}, iluminación dramática, cinematic. Estilo editorial, realista, sin texto ni logos`;
        let bgDataUrl = null;
        try {
          logger.info(`  → Generando fondo AI para post "${piece.title}"...`);
          bgDataUrl = await generateImage(imagePrompt);
        } catch (e) {
          logger.warn(`  ⚠ Fal.ai falló para post ${piece.id}: ${e.message} — usando fondo de color`);
        }

        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
        await page.setContent(buildPostHTML(piece, client, bgDataUrl), { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => document.fonts.ready);
        const filename = `post_${piece.order}.png`;
        const filePath = path.join(outputDir, filename);
        await page.screenshot({ path: filePath, type: 'png' });
        const imageUrl = `/images/${planningId}/${filename}`;
        await piece.update({ imageUrl });
        generatedFiles.push({ id: piece.id, format: 'post', imageUrl, filePath });
        logger.info(`  ✓ ${filename}`);

      } else if (piece.format === 'carrusel') {
        const slides = piece.carouselSlides?.slides || [];
        if (slides.length === 0) {
          logger.warn(`  ⚠ carrusel orden=${piece.order} sin slides — omitido`);
          continue;
        }
        logger.info(`  → carrusel orden=${piece.order}: ${slides.length} slides`);

        // ── Una sola foto AI para portada y cierre ────────────────────────
        const sport = sportFor(pieceIdx);
        const imagePrompt = `Fotografía deportiva profesional, ${sport}, iluminación dramática, cinematic. Estilo editorial, realista, sin texto ni logos`;
        let bgDataUrl = null;
        try {
          logger.info(`    → Generando fondo AI para carrusel "${piece.title}"...`);
          bgDataUrl = await generateImage(imagePrompt);
        } catch (e) {
          logger.warn(`    ⚠ Fal.ai falló para carrusel ${piece.id}: ${e.message} — portada/cierre con color`);
        }

        let firstImageUrl = null;
        for (const slide of slides) {
          const isPhotoSlide = slide.slide === 1 || slide.slide === slides.length;
          await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
          await page.setContent(
            buildCarouselSlideHTML(slide, piece, client, slides.length, isPhotoSlide ? bgDataUrl : null),
            { waitUntil: 'domcontentloaded' },
          );
          await page.evaluate(() => document.fonts.ready);
          const filename = `carousel_${piece.order}_s${slide.slide}.png`;
          const filePath = path.join(outputDir, filename);
          await page.screenshot({ path: filePath, type: 'png' });
          const imageUrl = `/images/${planningId}/${filename}`;
          if (!firstImageUrl) firstImageUrl = imageUrl;
          generatedFiles.push({ id: piece.id, format: 'carrusel', slideIndex: slide.slide, imageUrl, filePath });
          logger.info(`    ✓ ${filename}`);
        }
        if (firstImageUrl) await piece.update({ imageUrl: firstImageUrl });
      }
    }

    await page.close();
  } finally {
    await browser.close();
  }

  logger.info(`Total generado: ${generatedFiles.length} archivos en ${outputDir}`);

  return { generatedFiles, outputDir };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORIES – PLANTILLAS (1080×1920, formato vertical 9:16)
// ─────────────────────────────────────────────────────────────────────────────

const STORY_TEMPLATE_MAP = {
  teaser: 'text', texto_reflexion: 'text', dato_curioso: 'text', tip_experto: 'text',
  encuesta: 'interactive', pregunta: 'interactive', slider_emocional: 'interactive', quiz: 'interactive',
  cta_directa: 'cta',
  countdown: 'countdown',
};

// ── STORY TEXT (teaser, texto_reflexion, dato_curioso, tip_experto) ──────────
function buildStoryTextHTML(story, client) {
  const bi = client.brandIdentity || {};
  const dark   = bi.darkColor    || '#0f1923';
  const accent = bi.accentColor  || '#c8aa32';
  const light  = '#ffffff';
  const titleFont = bi.titleFont || 'Georgia';
  const bodyFont  = bi.bodyFont  || 'Arial';
  const titleFF   = ff(titleFont, 'serif');
  const bodyFF    = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc = logoToDataUrl(client.logoUrl);
  const mainText = story.textContent || '';
  const fontSize = hookFontSize(mainText, 72, 40);
  const textHtml = esc(mainText).replace(/\n/g, '<br>');
  const ctaHtml  = story.cta ? esc(story.cta) : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${dark};font-family:${bodyFF};color:${light};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:140px 90px;position:relative}
  .bg-glow{position:absolute;width:800px;height:800px;border-radius:50%;
    background:radial-gradient(circle, ${accent}18 0%, transparent 70%);
    top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
  .corner-tl{position:absolute;top:0;left:0;width:180px;height:180px;
    border-top:3px solid ${accent};border-left:3px solid ${accent};opacity:0.5}
  .corner-br{position:absolute;bottom:0;right:0;width:180px;height:180px;
    border-bottom:3px solid ${accent};border-right:3px solid ${accent};opacity:0.5}
  .logo{position:absolute;top:90px;left:50%;transform:translateX(-50%);
    max-width:220px;max-height:88px;object-fit:contain;opacity:0.9}
  .divider{width:80px;height:3px;background:${accent};margin-bottom:60px;border-radius:2px}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-weight:800;
    line-height:1.4;color:${light};text-align:center;max-width:900px;margin-bottom:60px;
    text-shadow:0 2px 20px rgba(0,0,0,0.5)}
  .accent-word{color:${accent}}
  .divider-b{width:80px;height:3px;background:${accent};margin-bottom:40px;border-radius:2px}
  .cta-text{font-family:${bodyFF};font-size:28px;font-weight:700;color:${accent};
    text-align:center;letter-spacing:1px;text-transform:uppercase}
</style></head><body>
  <div class="bg-glow"></div>
  <div class="corner-tl"></div>
  <div class="corner-br"></div>
  ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
  <div class="divider"></div>
  <div class="main-text">${textHtml}</div>
  <div class="divider-b"></div>
  ${ctaHtml ? `<div class="cta-text">${ctaHtml}</div>` : ''}
</body></html>`;
}

// ── STORY INTERACTIVE (encuesta, pregunta, slider_emocional, quiz) ──────────
function buildStoryInteractiveHTML(story, client) {
  const bi = client.brandIdentity || {};
  const dark   = bi.darkColor   || '#0f1923';
  const accent = bi.accentColor || '#c8aa32';
  const light  = '#ffffff';
  const titleFont = bi.titleFont || 'Georgia';
  const bodyFont  = bi.bodyFont  || 'Arial';
  const titleFF   = ff(titleFont, 'serif');
  const bodyFF    = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc  = logoToDataUrl(client.logoUrl);
  const mainText = story.textContent || '';
  const fontSize = hookFontSize(mainText, 64, 36);
  const textHtml = esc(mainText).replace(/\n/g, '<br>');
  const stickerLabels = {
    encuesta: '¿SÍ o NO?', pregunta: 'Respóndeme', slider_emocional: 'Desliza', quiz: 'Quiz',
  };
  const stickerLabel = stickerLabels[story.storyType] || 'Responde';
  const stickerHint = story.stickerSuggestion ? esc(story.stickerSuggestion) : stickerLabel;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${dark};font-family:${bodyFF};color:${light};
    display:flex;flex-direction:column;padding:0;position:relative}
  .bg-stripe{position:absolute;top:0;left:0;right:0;height:8px;background:${accent}}
  .bg-stripe-b{position:absolute;bottom:0;left:0;right:0;height:8px;background:${accent}}
  .top-zone{flex:0 0 62%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:120px 90px 40px;position:relative}
  .bottom-zone{flex:0 0 38%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:20px 90px 120px}
  .logo{max-width:200px;max-height:80px;object-fit:contain;margin-bottom:56px;opacity:0.9}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-weight:800;
    line-height:1.4;color:${light};text-align:center;max-width:880px;
    text-shadow:0 2px 20px rgba(0,0,0,0.5)}
  .divider{width:80px;height:3px;background:${accent};margin:40px auto 0;border-radius:2px}
  .sticker-zone{background:${accent};color:${dark};border-radius:20px;
    padding:36px 60px;text-align:center;max-width:820px;width:100%}
  .sticker-label{font-family:${bodyFF};font-size:20px;font-weight:700;letter-spacing:3px;
    text-transform:uppercase;margin-bottom:12px;opacity:0.7}
  .sticker-text{font-family:${titleFF};font-size:32px;font-weight:800;line-height:1.3}
</style></head><body>
  <div class="bg-stripe"></div>
  <div class="bg-stripe-b"></div>
  <div class="top-zone">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div class="main-text">${textHtml}</div>
    <div class="divider"></div>
  </div>
  <div class="bottom-zone">
    <div class="sticker-zone">
      <div class="sticker-label">${esc(stickerLabel)}</div>
      <div class="sticker-text">${stickerHint}</div>
    </div>
  </div>
</body></html>`;
}

// ── STORY CTA (cta_directa) ─────────────────────────────────────────────────
function buildStoryCtaHTML(story, client) {
  const bi = client.brandIdentity || {};
  const dark   = bi.darkColor   || '#0f1923';
  const accent = bi.accentColor || '#c8aa32';
  const light  = '#ffffff';
  const titleFont = bi.titleFont || 'Georgia';
  const bodyFont  = bi.bodyFont  || 'Arial';
  const titleFF   = ff(titleFont, 'serif');
  const bodyFF    = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc  = logoToDataUrl(client.logoUrl);
  const mainText = story.textContent || '';
  const fontSize = hookFontSize(mainText, 66, 38);
  const textHtml = esc(mainText).replace(/\n/g, '<br>');
  const ctaHtml  = esc(story.cta || 'Link en mi bio →');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:linear-gradient(160deg, ${dark} 0%, #1a2a1a 100%);
    font-family:${bodyFF};color:${light};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:140px 90px;position:relative}
  .glow{position:absolute;width:900px;height:900px;border-radius:50%;
    background:radial-gradient(circle, ${accent}22 0%, transparent 65%);
    top:50%;left:50%;transform:translate(-50%,-50%)}
  .corner-tl{position:absolute;top:0;left:0;width:200px;height:200px;
    border-top:4px solid ${accent};border-left:4px solid ${accent}}
  .corner-br{position:absolute;bottom:0;right:0;width:200px;height:200px;
    border-bottom:4px solid ${accent};border-right:4px solid ${accent}}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;
    align-items:center;width:100%;gap:0}
  .logo{max-width:220px;max-height:88px;object-fit:contain;margin-bottom:80px;opacity:0.95}
  .label{font-family:${bodyFF};font-size:18px;font-weight:700;letter-spacing:4px;
    text-transform:uppercase;color:${accent};margin-bottom:40px}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-weight:800;
    line-height:1.4;color:${light};text-align:center;max-width:880px;margin-bottom:80px;
    text-shadow:0 2px 30px rgba(0,0,0,0.6)}
  .cta-btn{background:${accent};color:${dark};padding:32px 80px;border-radius:8px;
    font-family:${bodyFF};font-size:30px;font-weight:900;letter-spacing:1px;
    text-align:center;text-transform:uppercase;
    box-shadow:0 8px 40px ${accent}55}
</style></head><body>
  <div class="glow"></div>
  <div class="corner-tl"></div>
  <div class="corner-br"></div>
  <div class="content">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div class="label">Acción</div>
    <div class="main-text">${textHtml}</div>
    <div class="cta-btn">${ctaHtml}</div>
  </div>
</body></html>`;
}

// ── STORY COUNTDOWN ─────────────────────────────────────────────────────────
function buildStoryCountdownHTML(story, client) {
  const bi = client.brandIdentity || {};
  const dark   = bi.darkColor   || '#0f1923';
  const accent = bi.accentColor || '#c8aa32';
  const light  = '#ffffff';
  const titleFont = bi.titleFont || 'Georgia';
  const bodyFont  = bi.bodyFont  || 'Arial';
  const titleFF   = ff(titleFont, 'serif');
  const bodyFF    = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc  = logoToDataUrl(client.logoUrl);
  const mainText = story.textContent || '';
  const fontSize = hookFontSize(mainText, 60, 36);
  const textHtml = esc(mainText).replace(/\n/g, '<br>');
  const ctaHtml  = story.cta ? esc(story.cta) : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${dark};font-family:${bodyFF};color:${light};
    display:flex;flex-direction:column;padding:0;position:relative}
  .bar-top{position:absolute;top:0;left:0;right:0;height:10px;background:${accent}}
  .bar-bot{position:absolute;bottom:0;left:0;right:0;height:10px;background:${accent}}
  .top-zone{flex:0 0 50%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:130px 90px 30px}
  .mid-zone{flex:0 0 28%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:20px 90px}
  .bot-zone{flex:0 0 22%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:20px 90px 100px}
  .logo{max-width:200px;max-height:80px;object-fit:contain;margin-bottom:56px;opacity:0.9}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-weight:800;
    line-height:1.4;color:${light};text-align:center;max-width:880px;
    text-shadow:0 2px 20px rgba(0,0,0,0.5)}
  .divider{width:80px;height:3px;background:${accent};margin:32px auto;border-radius:2px}
  .countdown-ph{font-family:${bodyFF};font-size:22px;font-weight:700;letter-spacing:3px;
    text-transform:uppercase;color:${dark};background:${accent};border-radius:16px;
    padding:36px 64px;text-align:center}
  .cta-text{font-family:${bodyFF};font-size:28px;font-weight:700;color:${accent};
    text-align:center;letter-spacing:1px}
</style></head><body>
  <div class="bar-top"></div>
  <div class="bar-bot"></div>
  <div class="top-zone">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div class="main-text">${textHtml}</div>
  </div>
  <div class="mid-zone">
    <div class="divider"></div>
    <div class="countdown-ph">⏱ Countdown sticker aquí</div>
  </div>
  <div class="bot-zone">
    ${ctaHtml ? `<div class="cta-text">${ctaHtml}</div>` : ''}
  </div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL PARA STORIES
// ─────────────────────────────────────────────────────────────────────────────
async function generateStoryImages(planningId) {
  const planning = await Planning.findByPk(planningId, {
    include: [{ model: Client, as: 'client' }],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const Story = require('../modules/stories/story.model');

  const stories = await Story.findAll({
    where: { planning_id: planningId },
    order: [['day_of_week', 'ASC'], ['order', 'ASC']],
  });

  const client = planning.client;
  const outputDir = path.join(OUTPUT_BASE, `${planningId}_stories`);
  ensureDir(outputDir);

  // Solo stories NO grabadas generan imagen
  const imageable = stories.filter(s => !s.isRecorded);
  logger.info(`Generando imágenes de stories para planning ${planningId} — ${imageable.length} stories (grabadas excluidas)`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const generatedFiles = [];

  try {
    const page = await browser.newPage();

    for (const story of imageable) {
      const templateType = STORY_TEMPLATE_MAP[story.storyType] || 'text';
      let html;

      switch (templateType) {
        case 'interactive': html = buildStoryInteractiveHTML(story, client); break;
        case 'cta':         html = buildStoryCtaHTML(story, client); break;
        case 'countdown':   html = buildStoryCountdownHTML(story, client); break;
        default:            html = buildStoryTextHTML(story, client); break;
      }

      await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);

      const filename = `story_d${story.dayOfWeek}_${story.order}.png`;
      const filePath = path.join(outputDir, filename);
      await page.screenshot({ path: filePath, type: 'png' });

      const imageUrl = `/images/${planningId}_stories/${filename}`;
      await story.update({ imageUrl });

      generatedFiles.push({ id: story.id, format: 'story', imageUrl, filePath });
      logger.info(`  ✓ ${filename} (${story.storyType} → ${templateType})`);
    }

    await page.close();
  } finally {
    await browser.close();
  }

  logger.info(`Total: ${generatedFiles.length} imágenes de stories en ${outputDir}`);
  return { generatedFiles, outputDir };
}

module.exports = { generateImages, generateStoryImages };
