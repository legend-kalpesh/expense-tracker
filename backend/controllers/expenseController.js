const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { isValidDate } = require('../utils/validate');

// Whitelist of allowed sort options (never put user text directly into SQL)
const SORT_OPTIONS = {
  date_desc: 'e.expense_date DESC, e.id DESC',
  date_asc: 'e.expense_date ASC, e.id ASC',
  amount_desc: 'e.amount DESC, e.id DESC',
  amount_asc: 'e.amount ASC, e.id ASC',
};

const formatExpense = (row) => ({ ...row, amount: Number(row.amount) });

// Validates the request body for create and update. Returns { errors, data }.
const validateExpenseBody = (body) => {
  const errors = [];
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const amount = Number(body.amount);
  const categoryId = Number(body.category_id);
  const expenseDate = body.expense_date;

  if (title.length < 1 || title.length > 150) errors.push('Title is required (max 150 characters)');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999.99) {
    errors.push('Amount must be a number greater than 0');
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) errors.push('Category is required');
  if (!isValidDate(expenseDate)) errors.push('Expense date must be a valid date (YYYY-MM-DD)');
  if (description.length > 1000) errors.push('Description can be at most 1000 characters');

  return {
    errors,
    data: {
      title,
      amount: Math.round(amount * 100) / 100,
      category_id: categoryId,
      expense_date: expenseDate,
      description: description || null,
    },
  };
};

// The category must belong to the logged-in user
const categoryBelongsToUser = async (categoryId, userId) => {
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [
    categoryId,
    userId,
  ]);
  return rows.length > 0;
};

const SELECT_EXPENSE = `
  SELECT e.id, e.title, e.amount, e.expense_date, e.description,
         e.category_id, c.category_name
  FROM expenses e
  JOIN categories c ON c.id = e.category_id`;

// POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
  const { errors, data } = validateExpenseBody(req.body);
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

  if (!(await categoryBelongsToUser(data.category_id, req.user.id))) {
    return res.status(400).json({ message: 'Selected category does not exist' });
  }

  const [result] = await pool.query(
    `INSERT INTO expenses (user_id, category_id, title, amount, expense_date, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, data.category_id, data.title, data.amount, data.expense_date, data.description]
  );

  const [rows] = await pool.query(`${SELECT_EXPENSE} WHERE e.id = ? AND e.user_id = ?`, [
    result.insertId,
    req.user.id,
  ]);
  res.status(201).json({ message: 'Expense added', expense: formatExpense(rows[0]) });
});

// GET /api/expenses?search=&category_id=&month=YYYY-MM&from=&to=&sort=
const getExpenses = asyncHandler(async (req, res) => {
  const { search, category_id, month, from, to, sort } = req.query;

  let sql = `${SELECT_EXPENSE} WHERE e.user_id = ?`;
  const params = [req.user.id]; // every query is scoped to the logged-in user

  if (search && String(search).trim()) {
    sql += ' AND e.title LIKE ?';
    params.push(`%${String(search).trim()}%`);
  }
  if (category_id) {
    if (!/^\d+$/.test(String(category_id))) return res.status(400).json({ message: 'Invalid category filter' });
    sql += ' AND e.category_id = ?';
    params.push(Number(category_id));
  }
  if (month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) {
      return res.status(400).json({ message: 'Month must be in YYYY-MM format' });
    }
    sql += " AND DATE_FORMAT(e.expense_date, '%Y-%m') = ?";
    params.push(month);
  }
  if (from) {
    if (!isValidDate(from)) return res.status(400).json({ message: 'Invalid "from" date' });
    sql += ' AND e.expense_date >= ?';
    params.push(from);
  }
  if (to) {
    if (!isValidDate(to)) return res.status(400).json({ message: 'Invalid "to" date' });
    sql += ' AND e.expense_date <= ?';
    params.push(to);
  }

  sql += ` ORDER BY ${SORT_OPTIONS[sort] || SORT_OPTIONS.date_desc}`;

  const [rows] = await pool.query(sql, params);
  const expenses = rows.map(formatExpense);
  const total = Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

  res.json({ count: expenses.length, total, expenses });
});

// GET /api/expenses/:id
const getExpenseById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT_EXPENSE} WHERE e.id = ? AND e.user_id = ?`, [
    req.params.id,
    req.user.id,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Expense not found' });
  res.json({ expense: formatExpense(rows[0]) });
});

// PUT /api/expenses/:id
const updateExpense = asyncHandler(async (req, res) => {
  const { errors, data } = validateExpenseBody(req.body);
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

  if (!(await categoryBelongsToUser(data.category_id, req.user.id))) {
    return res.status(400).json({ message: 'Selected category does not exist' });
  }

  const [result] = await pool.query(
    `UPDATE expenses
     SET category_id = ?, title = ?, amount = ?, expense_date = ?, description = ?
     WHERE id = ? AND user_id = ?`,
    [data.category_id, data.title, data.amount, data.expense_date, data.description, req.params.id, req.user.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Expense not found' });

  const [rows] = await pool.query(`${SELECT_EXPENSE} WHERE e.id = ? AND e.user_id = ?`, [
    req.params.id,
    req.user.id,
  ]);
  res.json({ message: 'Expense updated', expense: formatExpense(rows[0]) });
});

// DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
});

module.exports = { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense };
