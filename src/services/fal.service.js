/**
 * Fal.ai Service – Generación de video con Kling vía fal.ai queue API.
 */

const https = require('https');

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

module.exports = { submitVideo, checkStatus };
