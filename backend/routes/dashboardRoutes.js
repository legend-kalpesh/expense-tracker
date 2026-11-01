const express = require('express');
const {
  getSummary, getMonthly, getCategoryBreakdown, setBudget,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.get('/categories', getCategoryBreakdown);
router.put('/budget', setBudget);

module.exports = router;
