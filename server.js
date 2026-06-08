require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const path       = require('path');
const { ensureFiles } = require('./db');

ensureFiles(); // Create data files if missing

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/admin',  require('./routes/admin'));
app.use('/api',    require('./routes/api'));

// ── HOME (public landing page) ────────────────────────────────────────────────
app.get('/', (req, res) => res.send(homePage()));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).send('<h2 style="font-family:sans-serif;color:#64748b;padding:40px">404 — Page not found</h2>'));

app.listen(PORT, () => {
  console.log(`\n🖨️  PrintShop Pro Server running on http://localhost:${PORT}`);
  console.log(`   Admin:    http://localhost:${PORT}/admin`);
  console.log(`   Portal:   http://localhost:${PORT}/api/portal`);
  console.log(`   API:      http://localhost:${PORT}/api/validate`);
  console.log(`\n   Default admin login:`);
  console.log(`   Username: admin`);
  console.log(`   Password: Admin@PrintShop2026\n`);
});

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════
function homePage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PrintShop Pro — AI-Powered Print Management</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
nav{background:#1e293b;border-bottom:1px solid #334155;padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:68px;position:sticky;top:0;z-index:10}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:#f1f5f9}
.logo span{font-size:28px}
.nav-links{display:flex;align-items:center;gap:20px}
.nav-links a{color:#94a3b8;text-decoration:none;font-size:14px;transition:color .2s}
.nav-links a:hover{color:#f1f5f9}
.nav-links .btn{background:#6366f1;color:#fff;padding:9px 20px;border-radius:8px;font-weight:600}
.nav-links .btn:hover{background:#4f46e5;color:#fff}
.hero{text-align:center;padding:80px 24px 60px}
.hero-badge{display:inline-block;background:#312e81;color:#a5b4fc;padding:6px 18px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:20px;letter-spacing:.05em}
.hero h1{font-size:52px;font-weight:800;line-height:1.15;color:#f1f5f9;margin-bottom:18px}
.hero h1 span{color:#6366f1}
.hero p{font-size:18px;color:#94a3b8;max-width:560px;margin:0 auto 36px;line-height:1.7}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:#6366f1;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;transition:background .2s}
.btn-primary:hover{background:#4f46e5}
.btn-outline{background:transparent;color:#e2e8f0;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;border:2px solid #334155;transition:all .2s}
.btn-outline:hover{border-color:#6366f1;color:#a5b4fc}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:0 auto 80px;padding:0 24px}
.feature{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:28px}
.feature-icon{font-size:32px;margin-bottom:14px}
.feature h3{font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:8px}
.feature p{color:#64748b;font-size:14px;line-height:1.65}
.plans{max-width:1100px;margin:0 auto 80px;padding:0 24px}
.plans-title{text-align:center;margin-bottom:40px}
.plans-title h2{font-size:36px;font-weight:800;color:#f1f5f9;margin-bottom:8px}
.plans-title p{color:#64748b;font-size:15px}
.plans-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.plan-card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:24px;text-align:center;transition:border-color .2s,transform .2s}
.plan-card:hover{border-color:#6366f1;transform:translateY(-3px)}
.plan-card.featured{border-color:#6366f1;background:#1a1f4e}
.plan-name{font-size:15px;font-weight:700;color:#f1f5f9;margin-bottom:6px}
.plan-price{font-size:28px;font-weight:800;color:#6366f1;margin-bottom:4px}
.plan-price small{font-size:14px;color:#64748b;font-weight:400}
.plan-printers{font-size:13px;color:#94a3b8;margin-bottom:14px}
.plan-tag-pill{background:#312e81;color:#a5b4fc;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin-bottom:10px;display:inline-block}
footer{text-align:center;padding:32px;color:#475569;font-size:13px;border-top:1px solid #1e293b}
footer a{color:#6366f1;text-decoration:none}
@media(max-width:768px){.plans-grid{grid-template-columns:1fr 1fr}.features{grid-template-columns:1fr}.hero h1{font-size:36px}}
@media(max-width:480px){.plans-grid{grid-template-columns:1fr}}
</style></head><body>
<nav>
  <div class="logo"><span>🖨️</span> PrintShop Pro</div>
  <div class="nav-links">
    <a href="#plans">Plans</a>
    <a href="#features">Features</a>
    <a href="/api/portal">Customer Login</a>
    <a href="/admin" class="btn">Admin →</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-badge">⚡ AI-Powered Print Management</div>
  <h1>Run Your Print Shop<br><span>Smarter & Faster</span></h1>
  <p>WhatsApp-based order automation, smart printer routing, billing — all managed with AI. Built for Indian print shops.</p>
  <div class="hero-actions">
    <a href="#plans" class="btn-primary">View Plans →</a>
    <a href="/api/portal" class="btn-outline">Check License</a>
  </div>
</section>

<div id="features" style="max-width:1100px;margin:0 auto 60px;padding:0 24px">
  <div style="text-align:center;margin-bottom:40px">
    <h2 style="font-size:32px;font-weight:800;color:#f1f5f9;margin-bottom:8px">Everything You Need</h2>
    <p style="color:#64748b;font-size:15px">One platform to manage your entire print shop</p>
  </div>
</div>

<div class="features" id="feat-grid">
  <div class="feature"><div class="feature-icon">💬</div><h3>WhatsApp Orders</h3><p>Customers send jobs via WhatsApp. AI reads, understands, and routes to the right printer automatically.</p></div>
  <div class="feature"><div class="feature-icon">🖨️</div><h3>Smart Printer Routing</h3><p>A4, A3, A2, A1, colour, B&W — automatically assigned based on job type and printer availability.</p></div>
  <div class="feature"><div class="feature-icon">💰</div><h3>Auto Billing</h3><p>Automatic price calculation, bill generation, and payment tracking for every job.</p></div>
  <div class="feature"><div class="feature-icon">📊</div><h3>Live Dashboard</h3><p>Track all jobs, queues, printer status and billing from one screen in real time.</p></div>
  <div class="feature"><div class="feature-icon">🔐</div><h3>License Protected</h3><p>Software validates your license online daily. Secure, tamper-proof, tied to your subscription.</p></div>
  <div class="feature"><div class="feature-icon">🇮🇳</div><h3>Made in India</h3><p>Built specifically for Indian print shops. WhatsApp-first, Hindi-friendly, UPI billing.</p></div>
</div>

<div class="plans" id="plans">
  <div class="plans-title">
    <h2>Simple, Honest Pricing</h2>
    <p>One-time yearly fee. No hidden charges. Renew when you want.</p>
  </div>
  <div class="plans-grid">
    <div class="plan-card">
      <div class="plan-tag-pill">SIMPLE</div>
      <div class="plan-name">Simple</div>
      <div class="plan-price">₹2,000<small>/yr</small></div>
      <div class="plan-printers">1 Printer</div>
    </div>
    <div class="plan-card">
      <div class="plan-tag-pill">BASIC</div>
      <div class="plan-name">Basic</div>
      <div class="plan-price">₹3,000<small>/yr</small></div>
      <div class="plan-printers">2 Printers</div>
    </div>
    <div class="plan-card featured">
      <div class="plan-tag-pill">STANDARD</div>
      <div class="plan-name">Standard</div>
      <div class="plan-price">₹5,000<small>/yr</small></div>
      <div class="plan-printers">4 Printers</div>
    </div>
    <div class="plan-card">
      <div class="plan-tag-pill">PRO</div>
      <div class="plan-name">Pro</div>
      <div class="plan-price">₹8,000<small>/yr</small></div>
      <div class="plan-printers">7 Printers</div>
    </div>
    <div class="plan-card">
      <div class="plan-tag-pill">ADVANCE</div>
      <div class="plan-name">Advance</div>
      <div class="plan-price" style="font-size:18px">Custom</div>
      <div class="plan-printers">Unlimited Printers</div>
    </div>
  </div>
  <p style="text-align:center;color:#475569;font-size:13px;margin-top:20px">All plans include 30-day, 90-day, 6-month, and 1-year durations. Contact for pricing.</p>
</div>

<footer>
  <p>© 2026 PrintShop Pro · <a href="/api/portal">Customer Portal</a> · <a href="/admin">Admin</a></p>
  <p style="margin-top:8px">Powered by AI · Built for Indian Print Shops</p>
</footer>
</body></html>`;
}
