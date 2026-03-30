/**
 * Autorización OAuth2 para Google Drive (una sola vez).
 * Guarda el refresh token en credentials/gdrive-token.json.
 *
 * Prerequisito: credentials/oauth2-client.json descargado de Google Cloud Console
 *   (APIs & Services → Credentials → Create OAuth 2.0 Client ID → Desktop app)
 *
 * Uso: node scripts/authorizeGdrive.js
 */

const { google } = require('googleapis');
const http       = require('http');
const url        = require('url');
const { exec }   = require('child_process');
const fs         = require('fs');
const path       = require('path');

const CLIENT_PATH = path.join(__dirname, '../credentials/oauth2-client.json');
const TOKEN_PATH  = path.join(__dirname, '../credentials/gdrive-token.json');

if (!fs.existsSync(CLIENT_PATH)) {
  console.error('❌ No se encontró credentials/oauth2-client.json');
  console.error('   Descárgalo desde Google Cloud Console → APIs & Services → Credentials');
  process.exit(1);
}

const creds        = JSON.parse(fs.readFileSync(CLIENT_PATH, 'utf8'));
const { client_id, client_secret } = creds.installed || creds.web;
const REDIRECT_URI = 'http://localhost:3001/callback';

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive'],
  prompt: 'consent',
});

console.log('\n📂 Autorizando acceso a Google Drive...');
console.log('   Si el navegador no abre, copia esta URL:\n');
console.log('  ', authUrl, '\n');

// Abrir navegador
const open = process.platform === 'win32' ? `start ""` : 'open';
exec(`${open} "${authUrl}"`);

// Servidor temporal para capturar el callback
const server = http.createServer(async (req, res) => {
  try {
    const qs = url.parse(req.url, true).query;
    if (!qs.code) {
      res.end('Sin código. Intenta de nuevo.');
      return;
    }
    res.end('<h2 style="font-family:sans-serif">✅ Autorizado. Puedes cerrar esta pestaña.</h2>');
    server.close();

    const { tokens } = await oAuth2Client.getToken(qs.code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Token guardado en credentials/gdrive-token.json');
    console.log('   Ahora ejecuta: node scripts/uploadExistingToDrive.js');
    process.exit(0);
  } catch (err) {
    console.error('Error al obtener token:', err.message);
    res.end('Error: ' + err.message);
    server.close();
    process.exit(1);
  }
}).listen(3001, () => {
  console.log('   Esperando autorización en http://localhost:3001 ...');
});
