const express = require('express');
const {
  createCategory, getCategories, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { validateIdParam } = require('../utils/validate');

const router = express.Router();
router.use(protect);
router.param('id', validateIdParam);

router.route('/').post(createCategory).get(getCategories);
router.route('/:id').put(updateCategory).delete(deleteCategory);

module.exports = router;
