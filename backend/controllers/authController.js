const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { EMAIL_REGEX } = require('../utils/validate');

// Every new user gets these categories automatically
const DEFAULT_CATEGORIES = [
  'Food', 'Transportation', 'Shopping', 'Education', 'Entertainment',
  'Healthcare', 'Bills & Utilities', 'Rent', 'Travel', 'Other',
];

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');

  const errors = [];
  if (name.length < 2 || name.length > 100) errors.push('Name must be 2 to 100 characters');
  if (!EMAIL_REGEX.test(email) || email.length > 150) errors.push('Enter a valid email address');
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push('Password must be at least 8 characters and contain a letter and a number');
  }
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

  // Prevent duplicate registration
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user and the default categories together (all or nothing)
  const conn = await pool.getConnection();
  let userId;
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    userId = result.insertId;
    await conn.query('INSERT INTO categories (user_id, category_name) VALUES ?', [
      DEFAULT_CATEGORIES.map((categoryName) => [userId, categoryName]),
    ]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err; // a duplicate-email race is turned into 409 by the error handler
  } finally {
    conn.release();
  }

  res.status(201).json({
    message: 'Registration successful',
    token: signToken(userId),
    user: { id: userId, name, email },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');

  if (!EMAIL_REGEX.test(email) || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, password FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  // Same message for "no such email" and "wrong password" so attackers learn nothing
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({
    message: 'Login successful',
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, getMe };
