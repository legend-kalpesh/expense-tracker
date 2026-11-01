// Protects routes: requires "Authorization: Bearer <token>" and loads req.user.
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized. Please log in.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Your session has expired. Please log in again.'
        : 'Invalid token. Please log in again.';
    return res.status(401).json({ message });
  }

  // Make sure the user still exists
  const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
  if (rows.length === 0) {
    return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
  }

  req.user = rows[0];
  next();
});

module.exports = { protect };
