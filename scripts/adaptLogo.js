/**
 * adaptLogo.js
 * Reemplaza el color verde antiguo (#8fa394) del logo de Moni
 * por el malva de su nueva paleta (#9c8aa5).
 * Usa Puppeteer + Canvas para manipulación pixel a pixel.
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../src/public/logos/d02ea2e0-87e3-4c58-a340-4969976dc448.png');
const OLD = { r: 0x8f, g: 0xa3, b: 0x94 }; // #8fa394 verde antiguo
const NEW = { r: 0x9c, g: 0x8a, b: 0xa5 }; // #9c8aa5 malva

(async () => {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('Logo no encontrado:', LOGO_PATH);
    process.exit(1);
  }

  const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setContent(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);

  const result = await page.evaluate(
    ({ b64, old_r, old_g, old_b, new_r, new_g, new_b, tol }) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('c');
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        let changed = 0;

        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a === 0) continue;                          // transparente
          const dr = d[i]     - old_r;
          const dg = d[i + 1] - old_g;
          const db = d[i + 2] - old_b;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          if (dist < tol) {
            // Preservar luminosidad relativa al mapear al nuevo color
            const ratio = 1 - dist / tol;
            d[i]     = Math.round(new_r * ratio + d[i]     * (1 - ratio));
            d[i + 1] = Math.round(new_g * ratio + d[i + 1] * (1 - ratio));
            d[i + 2] = Math.round(new_b * ratio + d[i + 2] * (1 - ratio));
            changed++;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), changed });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = 'data:image/png;base64,' + b64;
    }),
    { b64: logoBase64, old_r: OLD.r, old_g: OLD.g, old_b: OLD.b,
      new_r: NEW.r, new_g: NEW.g, new_b: NEW.b, tol: 40 }
  );

  await browser.close();

  console.log(`Píxeles modificados: ${result.changed}`);
  if (result.changed === 0) {
    console.log('⚠  No se encontraron píxeles del color antiguo (tolerancia 40). Revisa el logo manualmente.');
    process.exit(0);
  }

  const base64Data = result.dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.copyFileSync(LOGO_PATH, LOGO_PATH + '.bak');
  fs.writeFileSync(LOGO_PATH, Buffer.from(base64Data, 'base64'));

  console.log('✓ Logo actualizado: #8fa394 verde → #9c8aa5 malva');
  console.log('  Backup guardado en:', LOGO_PATH + '.bak');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
