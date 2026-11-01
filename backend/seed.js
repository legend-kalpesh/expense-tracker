// Safe sample-data script. Creates ONE demo user (demo@example.com) with sample expenses.
// It never deletes anything, and does nothing if the demo user already exists.
// Run:  npm run seed      Login afterwards with demo@example.com / Demo@1234
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'Demo@1234';
const CATEGORIES = [
  'Food', 'Transportation', 'Shopping', 'Education', 'Entertainment',
  'Healthcare', 'Bills & Utilities', 'Rent', 'Travel', 'Other',
];

// [title, category, base amount, day of month]
const TEMPLATE = [
  ['Monthly rent', 'Rent', 8000, 1],
  ['Groceries', 'Food', 1800, 3],
  ['Electricity bill', 'Bills & Utilities', 950, 5],
  ['Bus pass', 'Transportation', 600, 6],
  ['Online course', 'Education', 1200, 9],
  ['Movie night', 'Entertainment', 450, 12],
  ['New shoes', 'Shopping', 2200, 15],
  ['Pharmacy', 'Healthcare', 380, 18],
  ['Dinner with friends', 'Food', 700, 21],
  ['Weekend trip', 'Travel', 1500, 24],
];

const pad = (n) => String(n).padStart(2, '0');

(async () => {
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);
    if (existing.length) {
      console.log('Demo user already exists. Nothing to do.');
      return;
    }

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
    const [user] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
      'Demo User', DEMO_EMAIL, hashed,
    ]);
    const userId = user.insertId;

    await pool.query('INSERT INTO categories (user_id, category_name) VALUES ?', [
      CATEGORIES.map((c) => [userId, c]),
    ]);
    const [cats] = await pool.query('SELECT id, category_name FROM categories WHERE user_id = ?', [userId]);
    const idByName = Object.fromEntries(cats.map((c) => [c.category_name, c.id]));

    const today = new Date();
    const rows = [];
    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
      TEMPLATE.forEach(([title, category, base, day], index) => {
        // current month: only dates up to today; other months: up to the 28th
        const maxDay = monthsAgo === 0 ? today.getDate() : 28;
        if (day > maxDay) return;
        const amount = base + ((monthsAgo * 37 + index * 53) % 250); // small repeatable variation
        rows.push([
          userId, idByName[category], title, amount,
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`, 'Sample data',
        ]);
      });
    }
    await pool.query(
      'INSERT INTO expenses (user_id, category_id, title, amount, expense_date, description) VALUES ?',
      [rows]
    );

    console.log(`Created demo user and ${rows.length} sample expenses.`);
    console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
