const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { isPositiveInt } = require('../utils/validate');

const validateName = (raw) => {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 50) return { error: 'Category name is required (max 50 characters)' };
  return { name };
};

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, error } = validateName(req.body.category_name);
  if (error) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query(
      'INSERT INTO categories (user_id, category_name) VALUES (?, ?)',
      [req.user.id, name]
    );
    res.status(201).json({
      message: 'Category added',
      category: { id: result.insertId, category_name: name, expense_count: 0, total_spent: 0 },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You already have a category with this name' });
    }
    throw err;
  }
});

// GET /api/categories  (includes how many expenses each category has)
const getCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.category_name,
            COUNT(e.id) AS expense_count,
            COALESCE(SUM(e.amount), 0) AS total_spent
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = c.user_id
     WHERE c.user_id = ?
     GROUP BY c.id, c.category_name
     ORDER BY c.category_name`,
    [req.user.id]
  );
  res.json({
    categories: rows.map((r) => ({
      ...r,
      expense_count: Number(r.expense_count),
      total_spent: Number(r.total_spent),
    })),
  });
});

// PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { name, error } = validateName(req.body.category_name);
  if (error) return res.status(400).json({ message: error });

  const [owned] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [
    req.params.id,
    req.user.id,
  ]);
  if (!owned.length) return res.status(404).json({ message: 'Category not found' });

  try {
    await pool.query('UPDATE categories SET category_name = ? WHERE id = ? AND user_id = ?', [
      name,
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: 'Category updated', category: { id: Number(req.params.id), category_name: name } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You already have a category with this name' });
    }
    throw err;
  }
});

// DELETE /api/categories/:id[?reassign_to=<otherCategoryId>]
// Safe delete: if the category still has expenses we refuse (409) unless the client
// explicitly says which category the expenses should be moved to.
const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const userId = req.user.id;

  const [owned] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [
    categoryId,
    userId,
  ]);
  if (!owned.length) return res.status(404).json({ message: 'Category not found' });

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS expense_count FROM expenses WHERE category_id = ? AND user_id = ?',
    [categoryId, userId]
  );
  const expenseCount = Number(countRows[0].expense_count);
  const { reassign_to: reassignTo } = req.query;

  // Case 1: no expenses -> simple delete
  if (expenseCount === 0) {
    await pool.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
    return res.json({ message: 'Category deleted' });
  }

  // Case 2: has expenses and no target chosen -> refuse and explain
  if (!reassignTo) {
    return res.status(409).json({
      code: 'CATEGORY_HAS_EXPENSES',
      expenseCount,
      message: `This category has ${expenseCount} expense(s). Choose another category to move them to before deleting.`,
    });
  }

  // Case 3: move the expenses, then delete (inside one transaction)
  if (!isPositiveInt(reassignTo) || Number(reassignTo) === categoryId) {
    return res.status(400).json({ message: 'Choose a different category to move the expenses to' });
  }
  const [target] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [
    Number(reassignTo),
    userId,
  ]);
  if (!target.length) return res.status(400).json({ message: 'Target category does not exist' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE expenses SET category_id = ? WHERE category_id = ? AND user_id = ?', [
      Number(reassignTo),
      categoryId,
      userId,
    ]);
    await conn.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.json({ message: `Category deleted. ${expenseCount} expense(s) were moved to the chosen category.` });
});

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
