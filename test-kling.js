/**
 * Script de prueba: envía UN video a Kling y muestra la respuesta completa
 * para verificar el formato correcto de URLs de status/resultado.
 *
 * Uso: node test-kling.js
 */
const https = require('https');

const FAL_API_KEY = process.env.FAL_API_KEY || 'e8a4b8e6-0284-4ee0-8b8f-cb4ab58f8421:64eaaf1100b2701a9b6ef6402c59dc63';

function req(method, hostname, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(options, (res) => {
      let raw = '';
      console.log(`HTTP ${res.statusCode} ${method} https://${hostname}${path}`);
      res.on('data', c => raw += c);
      res.on('end', () => {
        console.log('Response body:', raw.slice(0, 500));
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  const prompt = 'Atleta de fútbol celebrando un gol, estadio lleno, momento épico, iluminación dramática';

  console.log('\n=== 1. SUBMIT VIDEO ===');
  const submit = await req('POST', 'queue.fal.run', '/fal-ai/kling-video/v1.6/pro/text-to-video', {
    prompt,
    duration: '5',
    aspect_ratio: '9:16',
  });
  console.log('Submit completo:', JSON.stringify(submit.body, null, 2));

  const requestId = submit.body?.request_id;
  if (!requestId) { console.log('ERROR: no se obtuvo request_id'); return; }

  console.log('\n=== 2. CHECK STATUS (espera 10s) ===');
  await new Promise(r => setTimeout(r, 10000));

  // URL correcta devuelta por fal.ai en el submit
  const s1 = await req('GET', 'queue.fal.run', `/fal-ai/kling-video/requests/${requestId}/status`);
  console.log('Status (URL correcta):', JSON.stringify(s1.body, null, 2));

  if (s1.body?.status === 'COMPLETED') {
    const s2 = await req('GET', 'queue.fal.run', `/fal-ai/kling-video/requests/${requestId}`);
    console.log('Result:', JSON.stringify(s2.body, null, 2));
  } else {
    console.log('Video aún en proceso, status:', s1.body?.status);
  }
}

main().catch(console.error);
