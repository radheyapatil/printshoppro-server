const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'PSP_JWT_Secret_2026_Change_In_Production!';

function adminAuth(req, res, next) {
  const token = req.cookies?.adminToken || req.headers['x-admin-token'];
  if (!token) {
    if (req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/admin/login');
  }
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    if (req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ error: 'Session expired' });
    }
    res.clearCookie('adminToken');
    res.redirect('/admin/login');
  }
}

module.exports = { adminAuth, JWT_SECRET };
