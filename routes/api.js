const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { validateLicense, refreshStatus } = require('../licenseEngine');

// ── VALIDATE LICENSE (called by local printshop app on startup) ───────────────
// POST /api/validate
// Body: { key: "PSP-XXXX-XXXX-XXXX-XXXX" }
router.post('/validate', express.json(), (req, res) => {
  const { key } = req.body;
  if (!key) return res.json({ valid: false, reason: 'No license key provided' });

  const license = db.getLicenseByKey(key.trim().toUpperCase());
  if (!license) return res.json({ valid: false, reason: 'License key not found. Contact support.' });

  const updated = refreshStatus(license);
  if (updated.status !== license.status) db.updateLicense(license.id, { status: updated.status });

  const result = validateLicense(updated);
  if (!result.valid) return res.json({ valid: false, reason: result.reason });

  res.json({
    valid:        true,
    shopName:     updated.shopName,
    plan:         updated.plan,
    planName:     updated.planName,
    printerLimit: updated.printerLimit === Infinity ? 999 : updated.printerLimit,
    printerLabel: updated.printerLabel,
    expiresAt:    updated.expiresAt,
    daysLeft:     result.daysLeft,
    warning:      result.warning,
  });
});

// ── CUSTOMER PORTAL — enter key to see dashboard link ────────────────────────
router.get('/portal', (req, res) => {
  res.send(portalPage());
});

router.post('/portal/check', express.json(), express.urlencoded({ extended: true }), (req, res) => {
  const key = (req.body.key || '').trim().toUpperCase();
  if (!key) return res.send(portalPage('Please enter your license key.', null, ''));

  const license = db.getLicenseByKey(key);
  if (!license) return res.send(portalPage('❌ License key not found. Please check and try again.', null, key));

  const updated = refreshStatus(license);
  const result  = validateLicense(updated);

  if (!result.valid) return res.send(portalPage(`❌ ${result.reason}`, null, key));

  res.send(portalPage(null, { ...updated, daysLeft: result.daysLeft, warning: result.warning }, key));
});

// ── JSON version for AJAX use ─────────────────────────────────────────────────
router.post('/portal/check-json', express.json(), (req, res) => {
  const key     = (req.body.key || '').trim().toUpperCase();
  const license = db.getLicenseByKey(key);
  if (!license) return res.json({ valid: false, reason: 'License key not found.' });

  const updated = refreshStatus(license);
  const result  = validateLicense(updated);
  if (!result.valid) return res.json({ valid: false, reason: result.reason });

  res.json({ valid: true, license: { ...updated, daysLeft: result.daysLeft, warning: result.warning } });
});

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER PORTAL PAGE
// ══════════════════════════════════════════════════════════════════════════════
function portalPage(error, license, prefillKey = '') {
  const licenseCard = license ? `
    <div class="lic-card">
      <div class="lic-header">
        <div class="lic-shop">${esc(license.shopName)}</div>
        <div class="lic-badge ${license.daysLeft <= 7 ? 'warn' : 'ok'}">
          ${license.daysLeft <= 7 ? '⚠️' : '✅'} ${license.daysLeft} days left
        </div>
      </div>
      <div class="lic-grid">
        <div class="lic-item"><div class="lic-label">Plan</div><div class="lic-val">${esc(license.planName)}</div></div>
        <div class="lic-item"><div class="lic-label">Printers</div><div class="lic-val">${esc(license.printerLabel)}</div></div>
        <div class="lic-item"><div class="lic-label">Valid Until</div><div class="lic-val">${license.expiresAt}</div></div>
        <div class="lic-item"><div class="lic-label">Shop</div><div class="lic-val">${esc(license.shopName)}</div></div>
      </div>
      ${license.warning ? `<div class="warn-bar">${license.warning} Contact support to renew.</div>` : ''}
      <div class="lic-note">
        🖥️ Your PrintShop Pro software is running on your PC.<br>
        The dashboard is accessible at <strong>http://localhost:3001</strong> on your computer.
      </div>
    </div>` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PrintShop Pro — Customer Portal</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;min-height:100vh;display:flex;flex-direction:column}
nav{background:#1e293b;border-bottom:1px solid #334155;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:60px;flex-shrink:0}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;color:#f1f5f9}
.logo span{font-size:24px}
nav a{color:#94a3b8;font-size:13px;text-decoration:none;transition:color .2s}
nav a:hover{color:#f1f5f9}
main{flex:1;display:flex;align-items:center;justify-content:center;padding:32px 16px}
.container{width:100%;max-width:520px}
.hero{text-align:center;margin-bottom:32px}
.hero h1{font-size:28px;font-weight:700;color:#f1f5f9;margin-bottom:8px}
.hero p{color:#64748b;font-size:15px}
.card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px}
label{display:block;color:#94a3b8;font-size:13px;margin-bottom:8px}
input{width:100%;padding:13px 16px;background:#0f172a;border:1px solid #334155;border-radius:10px;color:#f1f5f9;font-size:15px;font-family:monospace;letter-spacing:1px;outline:none;transition:border-color .2s;text-transform:uppercase}
input:focus{border-color:#6366f1}
input::placeholder{text-transform:none;letter-spacing:0;color:#475569}
button{width:100%;margin-top:16px;padding:14px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s}
button:hover{background:#4f46e5}
.err{background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;padding:12px 16px;border-radius:8px;font-size:13px;margin-top:16px}
.lic-card{background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:24px;margin-top:24px}
.lic-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.lic-shop{font-size:18px;font-weight:700;color:#f1f5f9}
.lic-badge{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600}
.lic-badge.ok{background:#14532d;color:#86efac}
.lic-badge.warn{background:#78350f;color:#fde68a}
.lic-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.lic-label{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.lic-val{color:#e2e8f0;font-size:14px;font-weight:500}
.warn-bar{background:#78350f;color:#fde68a;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px}
.lic-note{background:#1e293b;border-radius:8px;padding:12px 16px;font-size:13px;color:#64748b;line-height:1.6}
</style></head><body>
<nav>
  <div class="logo"><span>🖨️</span> PrintShop Pro</div>
  <a href="/">← Back to Home</a>
</nav>
<main>
  <div class="container">
    <div class="hero">
      <h1>Customer Portal</h1>
      <p>Enter your license key to check your subscription status</p>
    </div>
    <div class="card">
      <form method="POST" action="/api/portal/check">
        <label>License Key</label>
        <input name="key" type="text" placeholder="PSP-XXXX-XXXX-XXXX-XXXX" value="${esc(prefillKey)}" required>
        ${error ? `<div class="err">${error}</div>` : ''}
        <button type="submit">Check License →</button>
      </form>
      ${licenseCard}
    </div>
  </div>
</main>
</body></html>`;
}

function esc(s) { return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

module.exports = router;
