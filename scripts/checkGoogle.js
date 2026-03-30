require('dotenv').config();
const fs = require('fs');

const keys = ['GOOGLE_SERVICE_ACCOUNT_PATH', 'SHEET_APROBACIONES_ID', 'DRIVE_ROOT_FOLDER_ID'];
keys.forEach(k => {
  const v = process.env[k];
  if (!v || v.includes('your_')) console.log('NO:', k);
  else console.log('OK:', k, '=', v.slice(0, 40));
});

const credPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
if (credPath) {
  try { fs.accessSync(credPath); console.log('OK: credenciales encontradas en', credPath); }
  catch { console.log('NO: archivo de credenciales no existe en', credPath); }
}
