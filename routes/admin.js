const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const db       = require('../db');
const { buildLicense, validateLicense, refreshStatus, PLANS, DURATIONS } = require('../licenseEngine');
const { adminAuth, JWT_SECRET } = require('../middleware/auth');

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.cookies?.adminToken) {
    try { jwt.verify(req.cookies.adminToken, JWT_SECRET); return res.redirect('/admin'); } catch {}
  }
  res.send(loginPage());
});

router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password } = req.body;
  const admin = db.readAdmin();
  if (username !== admin.username || !bcrypt.compareSync(password, admin.password)) {
    return res.send(loginPage('❌ Invalid username or password'));
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('adminToken', token, { httpOnly: true, maxAge: 12 * 3600 * 1000 });
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/login');
});

// ── ALL ROUTES BELOW REQUIRE AUTH ─────────────────────────────────────────────
router.use(adminAuth);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const all      = db.getAllLicenses().map(refreshStatus);
  const active   = all.filter(l => l.status === 'active').length;
  const expired  = all.filter(l => l.status === 'expired').length;
  const revoked  = all.filter(l => l.status === 'revoked').length;
  const expiring = all.filter(l => {
    if (l.status !== 'active') return false;
    const days = Math.ceil((new Date(l.expiresAt) - new Date()) / 86400000);
    return days <= 7;
  });
  res.send(adminDashboard({ all, active, expired, revoked, expiring }));
});

// ── CREATE LICENSE ─────────────────────────────────────────────────────────────
router.post('/license/create', express.json(), (req, res) => {
  try {
    const { shopName, customerName, customerPhone, plan, durationDays, customPrice } = req.body;
    if (!shopName || !plan || !durationDays) return res.json({ error: 'Missing fields' });
    const license = buildLicense({ shopName, customerName, customerPhone, plan, durationDays: parseInt(durationDays), customPrice: customPrice ? parseInt(customPrice) : null });
    db.createLicense(license);
    res.json({ success: true, license });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── GET ALL LICENSES (JSON) ───────────────────────────────────────────────────
router.get('/licenses', (req, res) => {
  const all = db.getAllLicenses().map(refreshStatus);
  res.json(all);
});

// ── REVOKE LICENSE ────────────────────────────────────────────────────────────
router.post('/license/:id/revoke', express.json(), (req, res) => {
  const updated = db.updateLicense(req.params.id, { status: 'revoked' });
  updated ? res.json({ success: true }) : res.json({ error: 'Not found' });
});

// ── EXTEND LICENSE ────────────────────────────────────────────────────────────
router.post('/license/:id/extend', express.json(), (req, res) => {
  const { days } = req.body;
  const license  = db.getLicenseById(req.params.id);
  if (!license) return res.json({ error: 'Not found' });

  const base      = new Date(license.expiresAt) > new Date() ? new Date(license.expiresAt) : new Date();
  const newExpiry = new Date(base);
  newExpiry.setDate(newExpiry.getDate() + parseInt(days));
  const expiresAt = newExpiry.toISOString().split('T')[0];
  const updated   = db.updateLicense(req.params.id, { expiresAt, status: 'active' });
  updated ? res.json({ success: true, expiresAt }) : res.json({ error: 'Not found' });
});

// ── DELETE LICENSE ────────────────────────────────────────────────────────────
router.post('/license/:id/delete', express.json(), (req, res) => {
  db.deleteLicense(req.params.id) ? res.json({ success: true }) : res.json({ error: 'Not found' });
});

// ── CHANGE ADMIN PASSWORD ─────────────────────────────────────────────────────
router.post('/change-password', express.json(), (req, res) => {
  const { current, newPass } = req.body;
  const admin = db.readAdmin();
  if (!bcrypt.compareSync(current, admin.password)) return res.json({ error: 'Current password wrong' });
  db.writeAdmin({ ...admin, password: bcrypt.hashSync(newPass, 10) });
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

function loginPage(error = '') {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PrintShop Pro — Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:40px;width:100%;max-width:400px}
.logo{text-align:center;margin-bottom:28px}
.logo-icon{font-size:40px;margin-bottom:8px}
.logo h1{color:#f1f5f9;font-size:22px;font-weight:700}
.logo p{color:#94a3b8;font-size:13px;margin-top:4px}
label{display:block;color:#94a3b8;font-size:13px;margin-bottom:6px;margin-top:16px}
input{width:100%;padding:12px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:14px;outline:none;transition:border-color .2s}
input:focus{border-color:#6366f1}
button{width:100%;margin-top:24px;padding:13px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s}
button:hover{background:#4f46e5}
.err{background:#7f1d1d;color:#fca5a5;padding:10px 14px;border-radius:8px;font-size:13px;margin-top:14px;text-align:center}
</style></head><body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">🖨️</div>
    <h1>PrintShop Pro</h1>
    <p>Admin Panel</p>
  </div>
  <form method="POST" action="/admin/login">
    <label>Username</label>
    <input name="username" type="text" placeholder="admin" autocomplete="username" required>
    <label>Password</label>
    <input name="password" type="password" placeholder="••••••••" autocomplete="current-password" required>
    ${error ? `<div class="err">${error}</div>` : ''}
    <button type="submit">Sign In →</button>
  </form>
</div>
</body></html>`;
}

function adminDashboard({ all, active, expired, revoked, expiring }) {
  const plansInfo = Object.entries(PLANS).map(([k,v]) => `<option value="${k}">₹${v.price>0?v.price.toLocaleString():'Custom'} · ${v.name} (${v.printerLabel})</option>`).join('');
  const durInfo   = Object.entries(DURATIONS).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');

  const rows = all.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(l => {
    const daysLeft = Math.ceil((new Date(l.expiresAt) - new Date()) / 86400000);
    const badge    = l.status === 'active'  ? `<span class="badge green">${daysLeft > 0 ? daysLeft+'d left' : 'Active'}</span>`
                   : l.status === 'expired' ? `<span class="badge red">Expired</span>`
                   : `<span class="badge gray">Revoked</span>`;
    const warn     = l.status === 'active' && daysLeft <= 7 ? '⚠️ ' : '';
    return `<tr>
      <td>${warn}<strong>${esc(l.shopName)}</strong><br><small style="color:#94a3b8">${esc(l.customerName||'')} ${esc(l.customerPhone||'')}</small></td>
      <td><span class="plan-tag">${l.planName}</span></td>
      <td style="font-family:monospace;font-size:12px">${l.key}</td>
      <td>${l.expiresAt}</td>
      <td>${badge}</td>
      <td class="actions">
        <button class="btn-sm blue" onclick="copyKey('${l.key}')">Copy Key</button>
        ${l.status!=='revoked'?`<button class="btn-sm orange" onclick="extendLicense('${l.id}')">Extend</button>`:''}
        ${l.status!=='revoked'?`<button class="btn-sm red" onclick="revokeLicense('${l.id}','${esc(l.shopName)}')">Revoke</button>`:''}
        <button class="btn-sm gray" onclick="deleteLicense('${l.id}','${esc(l.shopName)}')">Delete</button>
      </td>
    </tr>`;
  }).join('');

  const expiringAlert = expiring.length ? `
    <div class="alert-bar">⚠️ ${expiring.length} license${expiring.length>1?'s':''} expiring within 7 days: 
    ${expiring.map(l=>`<strong>${esc(l.shopName)}</strong> (${Math.ceil((new Date(l.expiresAt)-new Date())/86400000)}d)`).join(', ')}</div>` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — PrintShop Pro</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
nav{background:#1e293b;border-bottom:1px solid #334155;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:60px}
nav .logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;color:#f1f5f9}
nav .logo span{font-size:24px}
nav .nav-right{display:flex;align-items:center;gap:16px}
nav .nav-btn{padding:7px 16px;border-radius:8px;border:1px solid #334155;background:transparent;color:#94a3b8;font-size:13px;cursor:pointer;transition:all .2s}
nav .nav-btn:hover{background:#334155;color:#f1f5f9}
nav .nav-btn.primary{background:#6366f1;border-color:#6366f1;color:#fff}
nav .nav-btn.primary:hover{background:#4f46e5}
main{max-width:1400px;margin:0 auto;padding:24px}
.alert-bar{background:#78350f;border:1px solid #92400e;color:#fde68a;padding:12px 18px;border-radius:10px;margin-bottom:20px;font-size:14px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.stat{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px 24px}
.stat .num{font-size:32px;font-weight:700;margin-bottom:4px}
.stat .lbl{color:#64748b;font-size:13px}
.stat.green .num{color:#34d399}
.stat.red .num{color:#f87171}
.stat.gray .num{color:#94a3b8}
.stat.orange .num{color:#fb923c}
.section{background:#1e293b;border:1px solid #334155;border-radius:12px;margin-bottom:20px}
.section-header{padding:18px 24px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between}
.section-header h2{font-size:16px;font-weight:600;color:#f1f5f9}
.section-body{padding:24px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-grid.three{grid-template-columns:1fr 1fr 1fr}
.form-group label{display:block;color:#94a3b8;font-size:12px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.form-group input,.form-group select{width:100%;padding:10px 13px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:14px;outline:none;transition:border-color .2s}
.form-group input:focus,.form-group select:focus{border-color:#6366f1}
.form-group select option{background:#1e293b}
.btn{padding:11px 22px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
.btn.primary{background:#6366f1;color:#fff}.btn.primary:hover{background:#4f46e5}
.btn.success{background:#059669;color:#fff}.btn.success:hover{background:#047857}
.preview-box{background:#0f172a;border:1px solid #334155;border-radius:10px;padding:16px;margin-top:16px;display:none}
.preview-box.show{display:block}
.key-display{font-family:monospace;font-size:20px;color:#a78bfa;letter-spacing:2px;word-break:break-all}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 14px;color:#64748b;border-bottom:2px solid #334155;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
td{padding:12px 14px;border-bottom:1px solid #1e293b;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover{background:#172033}
.badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.badge.green{background:#14532d;color:#86efac}.badge.red{background:#7f1d1d;color:#fca5a5}.badge.gray{background:#1e293b;color:#94a3b8}
.plan-tag{background:#312e81;color:#a5b4fc;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.actions{display:flex;gap:6px;flex-wrap:wrap}
.btn-sm{padding:5px 10px;border-radius:6px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:background .2s}
.btn-sm.blue{background:#1d4ed8;color:#fff}.btn-sm.blue:hover{background:#1e40af}
.btn-sm.orange{background:#92400e;color:#fde68a}.btn-sm.orange:hover{background:#78350f}
.btn-sm.red{background:#7f1d1d;color:#fca5a5}.btn-sm.red:hover{background:#991b1b}
.btn-sm.gray{background:#374151;color:#9ca3af}.btn-sm.gray:hover{background:#4b5563}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;align-items:center;justify-content:center}
.modal.open{display:flex}
.modal-box{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;width:100%;max-width:420px}
.modal-box h3{font-size:18px;color:#f1f5f9;margin-bottom:16px}
.modal-box p{color:#94a3b8;font-size:14px;margin-bottom:20px}
.modal-actions{display:flex;gap:10px;justify-content:flex-end}
.toast{position:fixed;bottom:24px;right:24px;background:#1e293b;border:1px solid #334155;color:#f1f5f9;padding:12px 20px;border-radius:10px;font-size:14px;z-index:200;transform:translateY(80px);opacity:0;transition:all .3s}
.toast.show{transform:translateY(0);opacity:1}
.search-bar{margin-bottom:16px}
.search-bar input{width:100%;padding:10px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:14px;outline:none}
.search-bar input:focus{border-color:#6366f1}
</style></head><body>

<nav>
  <div class="logo"><span>🖨️</span> PrintShop Pro <small style="color:#6366f1;font-size:13px;margin-left:8px">Admin</small></div>
  <div class="nav-right">
    <button class="nav-btn" onclick="showPwdModal()">🔐 Change Password</button>
    <button class="nav-btn" onclick="location.href='/admin/logout'">Sign Out</button>
  </div>
</nav>

<main>
  ${expiringAlert}

  <div class="stats">
    <div class="stat green"><div class="num">${active}</div><div class="lbl">Active Licenses</div></div>
    <div class="stat red"><div class="num">${expired}</div><div class="lbl">Expired</div></div>
    <div class="stat gray"><div class="num">${revoked}</div><div class="lbl">Revoked</div></div>
    <div class="stat orange"><div class="num">${expiring.length}</div><div class="lbl">Expiring in 7 days</div></div>
  </div>

  <!-- CREATE LICENSE -->
  <div class="section">
    <div class="section-header">
      <h2>✨ Generate New License</h2>
    </div>
    <div class="section-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Shop Name *</label>
          <input id="shopName" type="text" placeholder="e.g. Raviraj Print House">
        </div>
        <div class="form-group">
          <label>Customer Name</label>
          <input id="customerName" type="text" placeholder="Customer's name">
        </div>
        <div class="form-group">
          <label>Customer Phone</label>
          <input id="customerPhone" type="text" placeholder="91XXXXXXXXXX">
        </div>
        <div class="form-group">
          <label>Plan *</label>
          <select id="plan" onchange="updatePrice()">
            <option value="">— Select Plan —</option>
            ${plansInfo}
          </select>
        </div>
        <div class="form-group">
          <label>Duration *</label>
          <select id="duration">
            <option value="">— Select Duration —</option>
            ${durInfo}
          </select>
        </div>
        <div class="form-group">
          <label>Custom Price (₹) <small style="color:#64748b">optional</small></label>
          <input id="customPrice" type="number" placeholder="Leave blank for default">
        </div>
      </div>
      <div style="margin-top:18px;display:flex;gap:12px;align-items:center">
        <button class="btn primary" onclick="generateLicense()">⚡ Generate License</button>
        <span id="genStatus" style="color:#94a3b8;font-size:13px"></span>
      </div>
      <div class="preview-box" id="preview">
        <div style="color:#94a3b8;font-size:12px;margin-bottom:8px">GENERATED LICENSE KEY</div>
        <div class="key-display" id="previewKey"></div>
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;font-size:13px;color:#64748b">
          <span id="previewDetails"></span>
        </div>
        <button class="btn success" style="margin-top:14px" onclick="copyKey(document.getElementById('previewKey').textContent)">📋 Copy Key</button>
      </div>
    </div>
  </div>

  <!-- LICENSE LIST -->
  <div class="section">
    <div class="section-header">
      <h2>📋 All Licenses (${all.length})</h2>
      <button class="nav-btn" onclick="loadLicenses()">🔄 Refresh</button>
    </div>
    <div class="section-body">
      <div class="search-bar"><input id="searchInput" oninput="filterTable()" placeholder="🔍 Search by shop, plan, key..."></div>
      <div style="overflow-x:auto">
        <table id="licTable">
          <thead><tr>
            <th>Shop / Customer</th><th>Plan</th><th>License Key</th><th>Expires</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody id="licBody">${rows}</tbody>
        </table>
      </div>
    </div>
  </div>
</main>

<!-- MODALS -->
<div class="modal" id="confirmModal">
  <div class="modal-box">
    <h3 id="confirmTitle">Confirm Action</h3>
    <p id="confirmMsg"></p>
    <div class="modal-actions">
      <button class="btn" style="background:#374151;color:#9ca3af" onclick="closeModal('confirmModal')">Cancel</button>
      <button class="btn" id="confirmBtn">Confirm</button>
    </div>
  </div>
</div>

<div class="modal" id="extendModal">
  <div class="modal-box">
    <h3>Extend License</h3>
    <p id="extendShop" style="color:#a78bfa;margin-bottom:16px"></p>
    <div class="form-group">
      <label>Add Days</label>
      <select id="extendDays">
        <option value="30">+ 30 Days</option>
        <option value="90">+ 90 Days</option>
        <option value="180">+ 6 Months</option>
        <option value="365">+ 1 Year</option>
      </select>
    </div>
    <div class="modal-actions" style="margin-top:20px">
      <button class="btn" style="background:#374151;color:#9ca3af" onclick="closeModal('extendModal')">Cancel</button>
      <button class="btn primary" id="extendBtn">Extend →</button>
    </div>
  </div>
</div>

<div class="modal" id="pwdModal">
  <div class="modal-box">
    <h3>Change Password</h3>
    <div class="form-group" style="margin-top:12px">
      <label>Current Password</label>
      <input id="pwdCurrent" type="password">
    </div>
    <div class="form-group">
      <label>New Password</label>
      <input id="pwdNew" type="password">
    </div>
    <div class="modal-actions" style="margin-top:20px">
      <button class="btn" style="background:#374151;color:#9ca3af" onclick="closeModal('pwdModal')">Cancel</button>
      <button class="btn primary" onclick="changePassword()">Update</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const allRows = ${JSON.stringify(all)};

function toast(msg, good=true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = good ? '#059669' : '#dc2626';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3000);
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function openModal(id){ document.getElementById(id).classList.add('open'); }

function copyKey(key) {
  navigator.clipboard.writeText(key).then(()=>toast('✅ License key copied!'));
}

async function generateLicense() {
  const shopName     = document.getElementById('shopName').value.trim();
  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone= document.getElementById('customerPhone').value.trim();
  const plan         = document.getElementById('plan').value;
  const durationDays = document.getElementById('duration').value;
  const customPrice  = document.getElementById('customPrice').value;

  if (!shopName || !plan || !durationDays) { toast('⚠️ Fill Shop Name, Plan, Duration', false); return; }

  document.getElementById('genStatus').textContent = 'Generating...';
  const r = await fetch('/admin/license/create', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ shopName, customerName, customerPhone, plan, durationDays: parseInt(durationDays), customPrice: customPrice||null })
  });
  const d = await r.json();
  document.getElementById('genStatus').textContent = '';

  if (d.error) { toast('❌ '+d.error, false); return; }
  const l = d.license;
  document.getElementById('previewKey').textContent = l.key;
  document.getElementById('previewDetails').innerHTML =
    \`<strong>\${l.planName}</strong> · \${l.durationLabel} · Expires: <strong>\${l.expiresAt}</strong> · Max printers: <strong>\${l.printerLabel}</strong>\`;
  document.getElementById('preview').classList.add('show');
  toast('✅ License created!');
  setTimeout(loadLicenses, 500);
}

function revokeLicense(id, shop) {
  document.getElementById('confirmTitle').textContent = 'Revoke License';
  document.getElementById('confirmMsg').textContent = \`Revoke license for "\${shop}"? The customer will lose access immediately.\`;
  const btn = document.getElementById('confirmBtn');
  btn.className='btn'; btn.style.cssText='background:#dc2626;color:#fff';
  btn.textContent='Revoke';
  btn.onclick = async ()=>{
    const r = await fetch(\`/admin/license/\${id}/revoke\`,{method:'POST',headers:{'Content-Type':'application/json'}});
    const d = await r.json();
    closeModal('confirmModal');
    d.success ? (toast('✅ License revoked'),loadLicenses()) : toast('❌ '+d.error,false);
  };
  openModal('confirmModal');
}

function deleteLicense(id, shop) {
  document.getElementById('confirmTitle').textContent = 'Delete License';
  document.getElementById('confirmMsg').textContent = \`Permanently delete license for "\${shop}"? This cannot be undone.\`;
  const btn = document.getElementById('confirmBtn');
  btn.className='btn'; btn.style.cssText='background:#dc2626;color:#fff';
  btn.textContent='Delete';
  btn.onclick = async ()=>{
    const r = await fetch(\`/admin/license/\${id}/delete\`,{method:'POST',headers:{'Content-Type':'application/json'}});
    const d = await r.json();
    closeModal('confirmModal');
    d.success ? (toast('✅ License deleted'),loadLicenses()) : toast('❌ '+d.error,false);
  };
  openModal('confirmModal');
}

let currentExtendId = null;
function extendLicense(id) {
  currentExtendId = id;
  const lic = allRows.find(l=>l.id===id);
  document.getElementById('extendShop').textContent = lic ? lic.shopName : id;
  openModal('extendModal');
  document.getElementById('extendBtn').onclick = async ()=>{
    const days = document.getElementById('extendDays').value;
    const r = await fetch(\`/admin/license/\${id}/extend\`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({days})});
    const d = await r.json();
    closeModal('extendModal');
    d.success ? (toast(\`✅ Extended to \${d.expiresAt}\`),loadLicenses()) : toast('❌ '+d.error,false);
  };
}

async function loadLicenses() {
  const r = await fetch('/admin/licenses');
  const data = await r.json();
  const body = document.getElementById('licBody');
  body.innerHTML = data.map(l=>{
    const daysLeft = Math.ceil((new Date(l.expiresAt)-new Date())/86400000);
    const badge = l.status==='active' ? \`<span class="badge green">\${daysLeft>0?daysLeft+'d left':'Active'}</span>\`
                : l.status==='expired' ? \`<span class="badge red">Expired</span>\`
                : \`<span class="badge gray">Revoked</span>\`;
    const warn = l.status==='active'&&daysLeft<=7?'⚠️ ':'';
    return \`<tr>
      <td>\${warn}<strong>\${l.shopName}</strong><br><small style="color:#94a3b8">\${l.customerName||''} \${l.customerPhone||''}</small></td>
      <td><span class="plan-tag">\${l.planName}</span></td>
      <td style="font-family:monospace;font-size:12px">\${l.key}</td>
      <td>\${l.expiresAt}</td>
      <td>\${badge}</td>
      <td class="actions">
        <button class="btn-sm blue" onclick="copyKey('\${l.key}')">Copy Key</button>
        \${l.status!=='revoked'?\`<button class="btn-sm orange" onclick="extendLicense('\${l.id}')">Extend</button>\`:''}
        \${l.status!=='revoked'?\`<button class="btn-sm red" onclick="revokeLicense('\${l.id}','\${l.shopName}')">Revoke</button>\`:''}
        <button class="btn-sm gray" onclick="deleteLicense('\${l.id}','\${l.shopName}')">Delete</button>
      </td>
    </tr>\`;
  }).join('');
  filterTable();
}

function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#licBody tr').forEach(row=>{
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function showPwdModal(){ openModal('pwdModal'); }
async function changePassword() {
  const current = document.getElementById('pwdCurrent').value;
  const newPass  = document.getElementById('pwdNew').value;
  if (!current||!newPass) { toast('Fill both fields',false); return; }
  const r = await fetch('/admin/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current,newPass})});
  const d = await r.json();
  closeModal('pwdModal');
  d.success ? toast('✅ Password updated') : toast('❌ '+d.error,false);
}

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')}));

function updatePrice() {
  const sel = document.getElementById('plan');
  const opt = sel.options[sel.selectedIndex];
  // price shown in option text already
}
</script>
</body></html>`;
}

function esc(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

module.exports = router;
