const express = require('express');
const {
  createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { validateIdParam } = require('../utils/validate');

const router = express.Router();
router.use(protect); // every expense route requires login
router.param('id', validateIdParam);

router.route('/').post(createExpense).get(getExpenses);
router.route('/:id').get(getExpenseById).put(updateExpense).delete(deleteExpense);

module.exports = router;
