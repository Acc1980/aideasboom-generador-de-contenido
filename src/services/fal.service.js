/**
 * Fal.ai Service – Video con Kling (queue) + Imagen con Flux (síncrono).
 */

const https = require('https');
const http  = require('http');

const FAL_API_KEY = process.env.FAL_API_KEY || 'e8a4b8e6-0284-4ee0-8b8f-cb4ab58f8421:64eaaf1100b2701a9b6ef6402c59dc63';
const FAL_ENDPOINT = 'queue.fal.run';
const FAL_PATH = '/fal-ai/kling-video/v1.6/pro/text-to-video';

function falRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: FAL_ENDPOINT,
      path,
      method,
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('Fal.ai parse error: ' + raw.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/**
 * Envía un prompt a fal.ai para generar un video.
 * @returns {string} request_id
 */
async function submitVideo(prompt, duration = 5) {
  const result = await falRequest('POST', FAL_PATH, {
    prompt,
    duration: String(duration),
    aspect_ratio: '9:16',
  });
  if (!result.request_id) throw new Error('Fal.ai no devolvió request_id: ' + JSON.stringify(result).slice(0, 200));
  return result.request_id;
}

/**
 * Consulta el estado de una generación de video.
 * @returns {{ status: string, videoUrl: string|null }}
 */
async function checkStatus(requestId) {
  const result = await falRequest('GET', `${FAL_PATH}/requests/${requestId}/status`);
  const status = result.status; // IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED
  const videoUrl = result?.output?.video?.url || result?.video?.url || null;
  return { status, videoUrl };
}

/**
 * Descarga una URL de imagen y la devuelve como data URL base64.
 */
function fetchAsDataUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const lib = imageUrl.startsWith('https') ? https : http;
    lib.get(imageUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchAsDataUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const mime = res.headers['content-type'] || 'image/jpeg';
        resolve(`data:${mime};base64,${buf.toString('base64')}`);
      });
    }).on('error', reject);
  });
}

/**
 * Genera una imagen con fal-ai/flux/schnell (síncrono, ~3s).
 * @param {string} prompt  - Descripción visual (del campo visualDirection del content)
 * @returns {string}       - Data URL base64 lista para embeber en HTML
 */
async function generateImage(prompt) {
  const safePrompt = `${prompt}. No text, no watermark, no logo, no words, photorealistic, professional photography`;

  const body = JSON.stringify({
    prompt: safePrompt,
    image_size: 'square_hd',
    num_images: 1,
    enable_safety_checker: false,
  });

  const data = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'fal.run',
      path: '/fal-ai/flux/schnell',
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('Flux parse error: ' + raw.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  const imageUrl = data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('Flux no devolvió imagen: ' + JSON.stringify(data).slice(0, 200));

  return fetchAsDataUrl(imageUrl);
}

module.exports = { submitVideo, checkStatus, generateImage };
