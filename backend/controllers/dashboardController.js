const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// Returns ['2026-01', ..., '2026-12'] : the last 12 months ending with the current month
const lastTwelveMonthKeys = () => {
  const keys = [];
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
};

// GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [totals] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_expenses,
            COUNT(*) AS total_transactions,
            COALESCE(SUM(CASE WHEN DATE_FORMAT(expense_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
                              THEN amount ELSE 0 END), 0) AS current_month_expenses
     FROM expenses WHERE user_id = ?`,
    [userId]
  );

  const [top] = await pool.query(
    `SELECT c.category_name, SUM(e.amount) AS total
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = ?
     GROUP BY c.id, c.category_name
     ORDER BY total DESC LIMIT 1`,
    [userId]
  );

  const [recent] = await pool.query(
    `SELECT e.id, e.title, e.amount, e.expense_date, c.category_name
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = ?
     ORDER BY e.expense_date DESC, e.id DESC LIMIT 5`,
    [userId]
  );

  const [budgetRows] = await pool.query('SELECT monthly_budget FROM users WHERE id = ?', [userId]);

  res.json({
    total_expenses: round2(totals[0].total_expenses),
    current_month_expenses: round2(totals[0].current_month_expenses),
    total_transactions: Number(totals[0].total_transactions),
    top_category: top.length ? { name: top[0].category_name, total: round2(top[0].total) } : null,
    monthly_budget: round2(budgetRows[0].monthly_budget),
    recent_transactions: recent.map((r) => ({ ...r, amount: Number(r.amount) })),
  });
});

// GET /api/dashboard/monthly  -> last 12 months (months with no spending are 0)
const getMonthly = asyncHandler(async (req, res) => {
  const keys = lastTwelveMonthKeys();

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month,
            SUM(amount) AS total, COUNT(*) AS transactions
     FROM expenses
     WHERE user_id = ? AND expense_date >= ?
     GROUP BY month`,
    [req.user.id, `${keys[0]}-01`]
  );

  const byMonth = Object.fromEntries(rows.map((r) => [r.month, r]));
  const months = keys.map((key) => ({
    month: key,
    total: byMonth[key] ? round2(byMonth[key].total) : 0,
    transactions: byMonth[key] ? Number(byMonth[key].transactions) : 0,
  }));

  // Highest spending month (only if there is any spending at all)
  const highest = months.reduce((best, m) => (m.total > best.total ? m : best), months[0]);

  res.json({ months, highest_month: highest.total > 0 ? highest : null });
});

// GET /api/dashboard/categories -> spending per category with percentages
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.category_name AS name, SUM(e.amount) AS total, COUNT(e.id) AS transactions
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = ?
     GROUP BY c.id, c.category_name
     ORDER BY total DESC`,
    [req.user.id]
  );

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);
  const categories = rows.map((r) => ({
    id: r.id,
    name: r.name,
    total: round2(r.total),
    transactions: Number(r.transactions),
    percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 1000) / 10 : 0,
  }));

  res.json({
    grand_total: round2(grandTotal),
    highest_category: categories.length ? categories[0] : null,
    categories,
  });
});

// PUT /api/dashboard/budget  { monthly_budget: 15000 }  (0 removes the budget)
const setBudget = asyncHandler(async (req, res) => {
  const budget = Number(req.body.monthly_budget);
  if (!Number.isFinite(budget) || budget < 0 || budget > 9999999999) {
    return res.status(400).json({ message: 'Budget must be a number, 0 or greater' });
  }
  await pool.query('UPDATE users SET monthly_budget = ? WHERE id = ?', [round2(budget), req.user.id]);
  res.json({ message: 'Budget saved', monthly_budget: round2(budget) });
});

module.exports = { getSummary, getMonthly, getCategoryBreakdown, setBudget };
