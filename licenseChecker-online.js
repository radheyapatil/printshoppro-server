// ─── ONLINE LICENSE CHECKER ───────────────────────────────────────────────────
// Validates license key against printshoppro.store server
// Run this on startup — if invalid/expired, app shuts down
// ──────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const http = require('https');
const os   = require('os');

// ┌─ CONFIGURE THIS ────────────────────────────────────────────────────────────
const LICENSE_SERVER = 'https://printshoppro.store';   // Your domain
const LOCAL_KEY_FILE = path.join(__dirname, '.license'); // Where key is stored locally
// └─────────────────────────────────────────────────────────────────────────────

function showError(msg) {
  console.error('\n' + '═'.repeat(62));
  console.error('  PRINTSHOP PRO — LICENSE ERROR');
  console.error('═'.repeat(62));
  console.error(msg);
  console.error('═'.repeat(62) + '\n');
}

function showSuccess(info) {
  console.log('\n✅ License Valid');
  console.log(`   Shop:     ${info.shopName}`);
  console.log(`   Plan:     ${info.planName} (${info.printerLabel})`);
  console.log(`   Expires:  ${info.expiresAt} (${info.daysLeft} days left)`);
  if (info.warning) console.log(`   ${info.warning}`);
  console.log('');
}

function readLocalKey() {
  if (!fs.existsSync(LOCAL_KEY_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(LOCAL_KEY_FILE, 'utf8'));
    return data.key || null;
  } catch {
    return null;
  }
}

function validateOnline(key) {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify({ key });
    const url     = new URL('/api/validate', LICENSE_SERVER);
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout:  10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid server response')); }
      });
    });

    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Connection timeout')); });
    req.write(body);
    req.end();
  });
}

async function verifyLicense() {
  const key = readLocalKey();

  if (!key) {
    showError(
      '  LICENSE KEY NOT FOUND!\n\n' +
      '  To activate PrintShop Pro:\n' +
      '  1. Get your license key from your admin\n' +
      '  2. Create a file named .license in this folder:\n' +
      `     ${LOCAL_KEY_FILE}\n` +
      '  3. Content: { "key": "PSP-XXXX-XXXX-XXXX-XXXX" }\n\n' +
      '  Support: printshoppro.store'
    );
    process.exit(1);
  }

  console.log(`🔐 Verifying license with ${LICENSE_SERVER}...`);

  let result;
  try {
    result = await validateOnline(key);
  } catch (err) {
    // OFFLINE FALLBACK — allow 24 hours grace if server unreachable
    console.warn('⚠️  Could not reach license server. Running in offline grace mode.');
    console.warn('   Please ensure internet connection for full validation.\n');
    return { key, offline: true, printerLimit: 999 };
  }

  if (!result.valid) {
    showError(
      `  ${result.reason}\n\n` +
      `  License Key: ${key}\n\n` +
      '  To renew: printshoppro.store/api/portal\n' +
      '  Support:  printshoppro.store'
    );
    process.exit(1);
  }

  showSuccess(result);
  return result;
}

module.exports = { verifyLicense };
