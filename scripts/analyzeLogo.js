require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../src/public/logos/d02ea2e0-87e3-4c58-a340-4969976dc448.png');
const b64 = fs.readFileSync(LOGO_PATH).toString('base64');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');

  const info = await page.evaluate((b64) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.getElementById('c');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const hist = {};
      let total = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i+3] < 50) continue;
        total++;
        // bucket to nearest 8
        const r = Math.round(d[i]/8)*8;
        const g = Math.round(d[i+1]/8)*8;
        const bv = Math.round(d[i+2]/8)*8;
        const key = r + ',' + g + ',' + bv;
        hist[key] = (hist[key]||0) + 1;
      }
      const sorted = Object.entries(hist).sort((a,b)=>b[1]-a[1]).slice(0,30);
      res({ w: c.width, h: c.height, total, top: sorted });
    };
    img.onerror = () => rej(new Error('fail'));
    img.src = 'data:image/png;base64,' + b64;
  }), b64);

  await browser.close();
  console.log(`Dimensiones: ${info.w}x${info.h}, píxeles opacos: ${info.total}`);
  console.log('Top 30 colores (buckets de 8):');
  info.top.forEach(([k, n]) => {
    const [r, g, b] = k.split(',').map(Number);
    const hex = '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
    console.log(`  ${hex}  ${n} px`);
  });
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
