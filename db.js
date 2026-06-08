const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, 'data');
const LIC_FILE   = path.join(DATA_DIR, 'licenses.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LIC_FILE))   fs.writeFileSync(LIC_FILE,   JSON.stringify([], null, 2));
  if (!fs.existsSync(ADMIN_FILE)) {
    // Default admin — password is changed on first login
    const bcrypt = require('bcryptjs');
    const hash   = bcrypt.hashSync('Admin@PrintShop2026', 10);
    fs.writeFileSync(ADMIN_FILE, JSON.stringify({ username: 'admin', password: hash }, null, 2));
  }
}

function readLicenses() {
  ensureFiles();
  return JSON.parse(fs.readFileSync(LIC_FILE, 'utf8'));
}

function writeLicenses(data) {
  fs.writeFileSync(LIC_FILE, JSON.stringify(data, null, 2));
}

function readAdmin() {
  ensureFiles();
  return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
}

function writeAdmin(data) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2));
}

// ── LICENSE CRUD ─────────────────────────────────────────────────────────────

function getAllLicenses() {
  return readLicenses();
}

function getLicenseByKey(key) {
  return readLicenses().find(l => l.key === key) || null;
}

function getLicenseById(id) {
  return readLicenses().find(l => l.id === id) || null;
}

function createLicense(license) {
  const licenses = readLicenses();
  licenses.push(license);
  writeLicenses(licenses);
  return license;
}

function updateLicense(id, updates) {
  const licenses = readLicenses();
  const idx      = licenses.findIndex(l => l.id === id);
  if (idx === -1) return null;
  licenses[idx]  = { ...licenses[idx], ...updates, updatedAt: new Date().toISOString() };
  writeLicenses(licenses);
  return licenses[idx];
}

function deleteLicense(id) {
  const licenses = readLicenses();
  const idx      = licenses.findIndex(l => l.id === id);
  if (idx === -1) return false;
  licenses.splice(idx, 1);
  writeLicenses(licenses);
  return true;
}

module.exports = {
  getAllLicenses, getLicenseByKey, getLicenseById,
  createLicense, updateLicense, deleteLicense,
  readAdmin, writeAdmin, ensureFiles,
};
