// ─── ACTIVATE LICENSE ON THIS PC ─────────────────────────────────────────────
// Run this ONCE when setting up PrintShop Pro on a new computer
// Usage: node activate.js
// It will ask for the license key, save it, and verify with the server
// ──────────────────────────────────────────────────────────────────────────────

const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const readline = require('readline');

const LICENSE_SERVER = 'https://printshoppro.store';
const KEY_FILE       = path.join(__dirname, '.license');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) { return new Promise(r => rl.question(q, r)); }

function validateOnline(key) {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify({ key });
    const url     = new URL('/api/validate', LICENSE_SERVER);
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout:  12000,
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Bad response')); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  PRINTSHOP PRO — LICENSE ACTIVATION');
  console.log('═'.repeat(60));
  console.log('  This will activate PrintShop Pro on this computer.');
  console.log('  Get your license key from your admin.');
  console.log('═'.repeat(60) + '\n');

  const key = (await ask('  Enter License Key (PSP-XXXX-XXXX-XXXX-XXXX): ')).trim().toUpperCase();

  if (!key.startsWith('PSP-')) {
    console.error('\n❌ Invalid key format. Should start with PSP-\n');
    rl.close(); process.exit(1);
  }

  console.log('\n  Verifying with server...');

  let result;
  try {
    result = await validateOnline(key);
  } catch (err) {
    console.error(`\n❌ Could not reach server: ${err.message}`);
    console.error('   Check your internet connection and try again.\n');
    rl.close(); process.exit(1);
  }

  if (!result.valid) {
    console.error(`\n❌ ${result.reason}\n`);
    rl.close(); process.exit(1);
  }

  // Save license file
  fs.writeFileSync(KEY_FILE, JSON.stringify({ key }, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ LICENSE ACTIVATED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log(`  Shop:     ${result.shopName}`);
  console.log(`  Plan:     ${result.planName} (${result.printerLabel})`);
  console.log(`  Expires:  ${result.expiresAt} (${result.daysLeft} days left)`);
  console.log(`  Key:      ${key}`);
  console.log('═'.repeat(60));
  console.log('\n  You can now start PrintShop Pro normally.\n');

  rl.close();
}

main().catch(err => { console.error('Error:', err.message); rl.close(); process.exit(1); });
