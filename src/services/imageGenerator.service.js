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
    ? `background:url('${bgDataUrl}') center 15%/cover no-repeat`
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
      rgba(0,0,0,0.25) 0%,
      rgba(0,0,0,0.55) 45%,
      rgba(0,0,0,0.78) 100%
    )}
  .bottom-cover{position:absolute;bottom:0;left:0;right:0;height:140px;
    background:${primary};opacity:0.92;z-index:0}
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
  <div class="bottom-cover"></div>
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
      ? `background:url('${bgDataUrl}') center 15%/cover no-repeat`
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
  .bottom-cover{position:absolute;bottom:0;left:0;right:0;height:140px;
    background:${primary};opacity:0.92;z-index:0}
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
  <div class="bottom-cover"></div>
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
      ? `background:url('${bgDataUrl}') center 15%/cover no-repeat`
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
  .bottom-cover{position:absolute;bottom:0;left:0;right:0;height:140px;
    background:${primary};opacity:0.92;z-index:0}
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
  <div class="bottom-cover"></div>
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

  // Los reels NO generan imagen — el cliente los graba
  const pieces = planning.contents.filter(p => p.format !== 'reel');
  logger.info(`Generando imágenes para planning ${planningId} → ${pieces.length} piezas (reels excluidos)`);

  // Rotación de deportes para que las fotos varíen entre piezas
  const SPORTS_ROTATION = [
    'jugador de fútbol en acción, estadio lleno, celebración de gol',
    'jugador de baloncesto saltando a encestar, cancha profesional, NBA style',
    'atleta corriendo en pista de atletismo, sprint final, estadio olímpico',
    'tenista golpeando la pelota, cancha profesional, acción dinámica',
    'boxeador en el ring, guantes rojos, iluminación dramática de ring',
    'ciclista en velocidad, competencia profesional, primer plano',
    'nadador en competencia, piscina olímpica, salpicaduras de agua',
    'voleibolista rematando, red de voleibol, estadio de competencia',
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
        const visualHint = piece.visualDirection || piece.title;
        const sport = sportFor(pieceIdx);
        const imagePrompt = `Fotografía deportiva profesional, ${sport}, iluminación dramática, cinematic. Contexto adicional: ${visualHint}. Estilo editorial, realista, sin arte abstracto`;
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
        const visualHint = piece.visualDirection || piece.title;
        const sport = sportFor(pieceIdx);
        const imagePrompt = `Fotografía deportiva profesional, ${sport}, iluminación dramática, cinematic. Contexto adicional: ${visualHint}. Estilo editorial, realista, sin arte abstracto`;
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
  const primary    = bi.primaryColor || '#9c8aa5';
  const accent     = bi.accentColor  || '#5e4b63';
  const textColor  = bi.textColor    || '#3a3a3a';
  const lightColor = bi.lightColor   || '#eae3dc';
  const titleFont  = bi.titleFont    || 'Georgia';
  const bodyFont   = bi.bodyFont     || 'Arial';
  const titleFF    = ff(titleFont, 'serif');
  const bodyFF     = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc    = logoToDataUrl(client.logoUrl);
  const mainText   = story.textContent || '';
  const fontSize   = hookFontSize(mainText, 64, 36);
  const textHtml   = esc(mainText).replace(/\n/g, '<br>');
  const ctaHtml    = story.cta ? esc(story.cta) : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${lightColor};font-family:${bodyFF};color:${textColor};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:120px 80px;position:relative}
  .accent-bar{position:absolute;left:0;top:0;bottom:0;width:6px;background:${accent}}
  .accent-circle{position:absolute;width:400px;height:400px;border-radius:50%;
    border:1.5px solid ${primary};opacity:0.08;top:180px;right:-100px}
  .accent-circle-2{position:absolute;width:280px;height:280px;border-radius:50%;
    border:1px solid ${accent};opacity:0.06;bottom:280px;left:-80px}
  .logo{position:absolute;top:80px;left:50%;transform:translateX(-50%);
    max-width:200px;max-height:80px;object-fit:contain;opacity:0.85}
  .divider{width:60px;height:3px;background:${accent};margin-bottom:48px;border-radius:2px}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-style:italic;font-weight:700;
    line-height:1.5;color:${primary};text-align:center;max-width:900px;margin-bottom:48px}
  .divider-b{width:60px;height:3px;background:${accent};margin-bottom:40px;border-radius:2px}
  .cta-text{font-family:${bodyFF};font-size:24px;font-weight:600;color:${accent};
    text-align:center;letter-spacing:0.5px;opacity:0.9}
  .story-label{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);
    font-family:${bodyFF};font-size:14px;letter-spacing:3px;text-transform:uppercase;
    opacity:0.25;color:${textColor}}
</style></head><body>
  <div class="accent-bar"></div>
  <div class="accent-circle"></div>
  <div class="accent-circle-2"></div>
  ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
  <div class="divider"></div>
  <div class="main-text">${textHtml}</div>
  <div class="divider-b"></div>
  ${ctaHtml ? `<div class="cta-text">${ctaHtml}</div>` : ''}
  <div class="story-label">${esc(story.storyType).replace(/_/g, ' ')}</div>
</body></html>`;
}

// ── STORY INTERACTIVE (encuesta, pregunta, slider_emocional, quiz) ──────────
function buildStoryInteractiveHTML(story, client) {
  const bi = client.brandIdentity || {};
  const primary    = bi.primaryColor || '#9c8aa5';
  const accent     = bi.accentColor  || '#5e4b63';
  const lightColor = bi.lightColor   || '#eae3dc';
  const titleFont  = bi.titleFont    || 'Georgia';
  const bodyFont   = bi.bodyFont     || 'Arial';
  const titleFF    = ff(titleFont, 'serif');
  const bodyFF     = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc    = logoToDataUrl(client.logoUrl);
  const mainText   = story.textContent || '';
  const fontSize   = hookFontSize(mainText, 56, 34);
  const textHtml   = esc(mainText).replace(/\n/g, '<br>');
  const stickerLabels = {
    encuesta: 'Encuesta', pregunta: 'Caja de preguntas',
    slider_emocional: 'Slider', quiz: 'Quiz',
  };
  const stickerLabel = stickerLabels[story.storyType] || '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${primary};font-family:${bodyFF};color:${lightColor};
    display:flex;flex-direction:column;padding:0;position:relative}
  .top-zone{flex:0 0 60%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:100px 80px 40px;position:relative}
  .bottom-zone{flex:0 0 40%;display:flex;flex-direction:column;
    align-items:center;justify-content:flex-start;padding:20px 80px}
  .accent-bar{position:absolute;right:0;top:0;bottom:0;width:6px;background:${accent}}
  .accent-dots{position:absolute;top:60px;right:60px;display:flex;gap:8px}
  .accent-dot{width:10px;height:10px;border-radius:50%;background:${lightColor};opacity:0.15}
  .logo{max-width:160px;max-height:64px;object-fit:contain;margin-bottom:48px;opacity:0.8}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-style:italic;font-weight:700;
    line-height:1.5;color:${lightColor};text-align:center;max-width:880px}
  .divider{width:80px;height:3px;background:${accent};margin:40px auto 0;border-radius:2px}
  .sticker-zone{font-family:${bodyFF};font-size:18px;font-weight:600;letter-spacing:2px;
    text-transform:uppercase;color:${lightColor};border:2px dashed ${lightColor};
    border-radius:16px;padding:24px 40px;opacity:0.15}
</style></head><body>
  <div class="accent-bar"></div>
  <div class="top-zone">
    <div class="accent-dots"><div class="accent-dot"></div><div class="accent-dot"></div><div class="accent-dot"></div></div>
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div class="main-text">${textHtml}</div>
    <div class="divider"></div>
  </div>
  <div class="bottom-zone">
    <div class="sticker-zone">${esc(stickerLabel)}</div>
  </div>
</body></html>`;
}

// ── STORY CTA (cta_directa) ─────────────────────────────────────────────────
function buildStoryCtaHTML(story, client) {
  const bi = client.brandIdentity || {};
  const primary    = bi.primaryColor || '#9c8aa5';
  const accent     = bi.accentColor  || '#5e4b63';
  const lightColor = bi.lightColor   || '#eae3dc';
  const titleFont  = bi.titleFont    || 'Georgia';
  const bodyFont   = bi.bodyFont     || 'Arial';
  const titleFF    = ff(titleFont, 'serif');
  const bodyFF     = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc    = logoToDataUrl(client.logoUrl);
  const mainText   = story.textContent || '';
  const fontSize   = hookFontSize(mainText, 58, 34);
  const textHtml   = esc(mainText).replace(/\n/g, '<br>');
  const ctaHtml    = esc(story.cta || 'Toca aquí');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${accent};font-family:${bodyFF};color:${lightColor};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:140px 80px;position:relative}
  .bg-gradient{position:absolute;inset:0;
    background:linear-gradient(170deg, ${accent} 0%, ${primary} 100%);opacity:0.3}
  .line-top{position:absolute;top:0;left:0;right:0;height:8px;background:${lightColor};opacity:0.1}
  .line-bottom{position:absolute;bottom:0;left:0;right:0;height:8px;background:${lightColor};opacity:0.1}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;width:100%}
  .logo{max-width:180px;max-height:72px;object-fit:contain;margin-bottom:80px;opacity:0.9}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-style:italic;font-weight:700;
    line-height:1.5;color:${lightColor};text-align:center;max-width:880px;margin-bottom:64px}
  .cta-btn{background:${lightColor};color:${accent};padding:28px 72px;border-radius:60px;
    font-family:${bodyFF};font-size:28px;font-weight:700;letter-spacing:0.5px;text-align:center;
    box-shadow:0 8px 32px rgba(0,0,0,0.15)}
  .swipe{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);
    font-family:${bodyFF};font-size:16px;letter-spacing:3px;text-transform:uppercase;
    opacity:0.3;color:${lightColor}}
</style></head><body>
  <div class="bg-gradient"></div>
  <div class="line-top"></div>
  <div class="line-bottom"></div>
  <div class="content">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div class="main-text">${textHtml}</div>
    <div class="cta-btn">${ctaHtml}</div>
  </div>
  <div class="swipe">Desliza hacia arriba</div>
</body></html>`;
}

// ── STORY COUNTDOWN ─────────────────────────────────────────────────────────
function buildStoryCountdownHTML(story, client) {
  const bi = client.brandIdentity || {};
  const primary    = bi.primaryColor || '#9c8aa5';
  const accent     = bi.accentColor  || '#5e4b63';
  const textColor  = bi.textColor    || '#3a3a3a';
  const lightColor = bi.lightColor   || '#eae3dc';
  const titleFont  = bi.titleFont    || 'Georgia';
  const bodyFont   = bi.bodyFont     || 'Arial';
  const titleFF    = ff(titleFont, 'serif');
  const bodyFF     = ff(bodyFont, 'sans');
  const fontsImport = buildFontsImport(titleFont, bodyFont);
  const logoSrc    = logoToDataUrl(client.logoUrl);
  const mainText   = story.textContent || '';
  const fontSize   = hookFontSize(mainText, 52, 32);
  const textHtml   = esc(mainText).replace(/\n/g, '<br>');
  const ctaHtml    = story.cta ? esc(story.cta) : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${fontsImport}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:${lightColor};font-family:${bodyFF};color:${textColor};
    display:flex;flex-direction:column;padding:0;position:relative}
  .accent-bar{position:absolute;left:0;top:0;bottom:0;width:6px;background:${primary}}
  .accent-bar-r{position:absolute;right:0;top:0;bottom:0;width:6px;background:${primary}}
  .top-zone{flex:0 0 45%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:100px 80px 20px}
  .mid-zone{flex:0 0 30%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:20px 80px}
  .bot-zone{flex:0 0 25%;display:flex;flex-direction:column;
    align-items:center;justify-content:center;padding:20px 80px 80px}
  .logo{max-width:180px;max-height:72px;object-fit:contain;margin-bottom:48px;opacity:0.85}
  .main-text{font-family:${titleFF};font-size:${fontSize}px;font-style:italic;font-weight:700;
    line-height:1.5;color:${primary};text-align:center;max-width:880px}
  .divider{width:60px;height:3px;background:${accent};margin:32px auto;border-radius:2px}
  .countdown-ph{font-family:${bodyFF};font-size:16px;letter-spacing:2px;text-transform:uppercase;
    color:${textColor};border:2px dashed ${primary};border-radius:16px;padding:32px 48px;
    opacity:0.15;text-align:center}
  .cta-text{font-family:${bodyFF};font-size:24px;font-weight:600;color:${accent};text-align:center}
</style></head><body>
  <div class="accent-bar"></div>
  <div class="accent-bar-r"></div>
  <div class="top-zone">
    ${logoSrc ? `<img class="logo" src="${logoSrc}">` : ''}
    <div class="main-text">${textHtml}</div>
  </div>
  <div class="mid-zone">
    <div class="divider"></div>
    <div class="countdown-ph">Countdown sticker</div>
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
