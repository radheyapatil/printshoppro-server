# PrintShop Pro — Complete Setup Guide
## printshoppro.store

---

## WHAT YOU HAVE

```
printshoppro-server/
├── server.js              ← Main server (start this)
├── db.js                  ← Data storage (JSON files)
├── licenseEngine.js       ← License generation + validation
├── activate.js            ← Run on customer PC to activate
├── licenseChecker-online.js ← Drop into your printshop-v4 app
├── routes/
│   ├── admin.js           ← Admin panel (login, generate keys, manage)
│   └── api.js             ← Public API (validate, customer portal)
├── middleware/auth.js      ← Session protection
├── data/                  ← Auto-created: licenses.json, admin.json
├── .env.example           ← Copy to .env and fill in
└── package.json
```

---

## STEP 1 — DEPLOY SERVER ONLINE

### Option A: Railway (Recommended — Free tier available)

1. Go to **railway.app** → New Project → Deploy from GitHub
2. Upload this `printshoppro-server` folder to a GitHub repo
3. Railway auto-detects Node.js and runs `npm start`
4. Add environment variables in Railway dashboard:
   ```
   JWT_SECRET=your_long_random_secret_here
   DOMAIN=https://printshoppro.store
   ```
5. Railway gives you a URL like `printshoppro-server.railway.app`

### Option B: Render (Also free)

1. Go to **render.com** → New Web Service
2. Connect your GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables same as above

### Option C: Any VPS (DigitalOcean, Hostinger, etc.)

```bash
# On your VPS
git clone <your-repo> printshoppro
cd printshoppro
npm install
cp .env.example .env
nano .env   # fill in JWT_SECRET

# Run with PM2 (keeps it alive)
npm install -g pm2
pm2 start server.js --name printshoppro
pm2 startup
pm2 save
```

---

## STEP 2 — POINT YOUR DOMAIN

In your domain registrar (GoDaddy / Namecheap / etc.) for **printshoppro.store**:

### If using Railway/Render:
1. Add a **CNAME record**:
   - Name: `@` (or `www`)
   - Value: `your-app.railway.app` (or render URL)
2. In Railway/Render: add custom domain `printshoppro.store`
3. SSL is automatic ✅

### If using VPS:
1. Add **A record**:
   - Name: `@`
   - Value: Your VPS IP address
2. Install SSL with Certbot:
   ```bash
   apt install certbot nginx
   certbot --nginx -d printshoppro.store
   ```

---

## STEP 3 — ADMIN LOGIN

Once deployed, go to:
```
https://printshoppro.store/admin
```

**Default credentials:**
- Username: `admin`
- Password: `Admin@PrintShop2026`

⚠️ **Change the password immediately** after first login (button in top nav).

---

## STEP 4 — GENERATE A LICENSE FOR A CUSTOMER

1. Login to **printshoppro.store/admin**
2. Fill in:
   - Shop Name (e.g. "Raviraj Print House")
   - Customer Name & Phone
   - Plan: Simple / Basic / Standard / Pro / Advance
   - Duration: 30 Days / 90 Days / 6 Months / 1 Year
3. Click **Generate License**
4. Copy the key (PSP-XXXX-XXXX-XXXX-XXXX)
5. Send it to the customer via WhatsApp

---

## STEP 5 — ACTIVATE ON CUSTOMER PC

Give the customer their files (printshop-v4 folder) + the key.

**On their PC, run once:**
```bash
node activate.js
```
Enter the PSP key when prompted. This creates `.license` file.

Then start normally:
```bash
node agent.js   (or whatever your start command is)
```

---

## STEP 6 — UPDATE YOUR LOCAL APP (printshop-v4)

Replace the old `licenseChecker.js` with `licenseChecker-online.js`:

```bash
# In printshop-v4 folder:
cp licenseChecker.js licenseChecker-offline-backup.js
cp /path/to/licenseChecker-online.js licenseChecker.js
```

The new checker:
- Pings `printshoppro.store/api/validate` on startup
- If valid → app runs normally with printer limit enforced
- If expired/revoked → app shuts down with clear message
- If no internet → 24hr grace period (won't shut down immediately)

---

## PLANS & PRICING

| Plan     | Price   | Printers   |
|----------|---------|------------|
| Simple   | ₹2,000  | 1 Printer  |
| Basic    | ₹3,000  | 2 Printers |
| Standard | ₹5,000  | 4 Printers |
| Pro      | ₹8,000  | 7 Printers |
| Advance  | Custom  | Unlimited  |

**Durations:** 30 Days / 90 Days / 6 Months / 1 Year

---

## PAGES AVAILABLE

| URL                              | Description                        |
|----------------------------------|------------------------------------|
| printshoppro.store/              | Public landing page with plans     |
| printshoppro.store/admin         | Admin login & dashboard            |
| printshoppro.store/admin/logout  | Logout admin                       |
| printshoppro.store/api/portal    | Customer license check page        |
| printshoppro.store/api/validate  | API endpoint (used by local app)   |

---

## ADMIN FEATURES

- ✅ Generate license keys (any plan + duration)
- ✅ View all licenses with status (active/expired/revoked)
- ✅ Search & filter licenses
- ✅ Extend any license by 30/90/180/365 days
- ✅ Revoke license (instant lockout)
- ✅ Delete license records
- ✅ Expiry alerts (7-day warning banner)
- ✅ Change admin password
- ✅ Stats dashboard (active / expired / revoked / expiring soon)

---

## DATA STORAGE

Licenses are stored in `data/licenses.json` on your server.

**Backup regularly:**
```bash
cp data/licenses.json data/licenses-backup-$(date +%Y%m%d).json
```

For production, you can upgrade to SQLite or MongoDB later — the `db.js` module makes this easy to swap.

---

## SUPPORT / TROUBLESHOOTING

**Server won't start:**
- Run `npm install` first
- Check `.env` file exists (copy from `.env.example`)

**License not validating:**
- Check internet on customer PC
- Verify key was copied exactly (PSP-XXXX-XXXX-XXXX-XXXX)
- Check admin panel — is the license showing as active?

**Domain not working:**
- DNS changes take 24-48 hours to propagate
- Test with the Railway/Render URL first

---

*PrintShop Pro · printshoppro.store · Built for Indian Print Shops*
