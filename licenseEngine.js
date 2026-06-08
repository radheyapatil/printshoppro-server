const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// ── PLANS ────────────────────────────────────────────────────────────────────
const PLANS = {
  simple:   { name: 'Simple',   price: 2000,  printers: 1,         printerLabel: '1 Printer'       },
  basic:    { name: 'Basic',    price: 3000,  printers: 2,         printerLabel: '2 Printers'      },
  standard: { name: 'Standard', price: 5000,  printers: 4,         printerLabel: '4 Printers'      },
  pro:      { name: 'Pro',      price: 8000,  printers: 7,         printerLabel: '7 Printers'      },
  advance:  { name: 'Advance',  price: 0,     printers: Infinity,  printerLabel: 'Unlimited'       },
};

// ── DURATIONS ────────────────────────────────────────────────────────────────
const DURATIONS = {
  '30':  { label: '30 Days',  months: 1  },
  '90':  { label: '90 Days',  months: 3  },
  '180': { label: '6 Months', months: 6  },
  '365': { label: '1 Year',   months: 12 },
};

const SECRET = 'PrintShopPro@2026#Raviraj$OnlineSecretKey!';

// ── KEY GENERATION ────────────────────────────────────────────────────────────
function generateLicenseKey(shopName, plan, expiresAt, id) {
  const data = `${shopName}|${plan}|${expiresAt}|${id}|${SECRET}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
  return `PSP-${hash.slice(0,4)}-${hash.slice(4,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}`;
}

// ── EXPIRY CALCULATION ────────────────────────────────────────────────────────
function calcExpiry(durationDays) {
  const dur = DURATIONS[String(durationDays)];
  if (!dur) throw new Error('Invalid duration');
  const d = new Date();
  d.setMonth(d.getMonth() + dur.months);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── CREATE FULL LICENSE OBJECT ────────────────────────────────────────────────
function buildLicense({ shopName, customerName, customerPhone, plan, durationDays, customPrice }) {
  if (!PLANS[plan])          throw new Error('Invalid plan');
  if (!DURATIONS[String(durationDays)]) throw new Error('Invalid duration');

  const id        = uuidv4();
  const expiresAt = calcExpiry(durationDays);
  const key       = generateLicenseKey(shopName, plan, expiresAt, id);
  const planInfo  = PLANS[plan];
  const durInfo   = DURATIONS[String(durationDays)];

  return {
    id,
    key,
    shopName,
    customerName,
    customerPhone,
    plan,
    planName:     planInfo.name,
    planPrice:    customPrice != null ? customPrice : planInfo.price,
    printerLimit: planInfo.printers,
    printerLabel: planInfo.printerLabel,
    duration:     durationDays,
    durationLabel: durInfo.label,
    createdAt:    new Date().toISOString(),
    expiresAt,
    status:       'active',  // active | expired | revoked
  };
}

// ── VALIDATE LICENSE (called by local client & online dashboard) ──────────────
function validateLicense(licenseObj) {
  if (!licenseObj) return { valid: false, reason: 'License not found' };

  if (licenseObj.status === 'revoked')
    return { valid: false, reason: 'License has been revoked. Contact support.' };

  const now     = new Date();
  const expires = new Date(licenseObj.expiresAt);

  if (now > expires)
    return { valid: false, reason: `License expired on ${licenseObj.expiresAt}. Please renew.` };

  const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

  return {
    valid:     true,
    daysLeft,
    warning:   daysLeft <= 7 ? `⚠️ License expires in ${daysLeft} days!` : null,
    license:   licenseObj,
  };
}

// ── STATUS UPDATER (called by cron or on-read) ────────────────────────────────
function refreshStatus(licenseObj) {
  if (licenseObj.status === 'revoked') return licenseObj;
  const now     = new Date();
  const expires = new Date(licenseObj.expiresAt);
  if (now > expires && licenseObj.status !== 'expired') {
    return { ...licenseObj, status: 'expired' };
  }
  return licenseObj;
}

module.exports = { PLANS, DURATIONS, buildLicense, validateLicense, refreshStatus, generateLicenseKey };
