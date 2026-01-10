const express = require('express');
const router = express.Router();
const {
  getSalesSummary,
  getDailySalesReport,
} = require('../controllers/reportController');

router.get('/sales-summary', getSalesSummary);
router.get('/daily-sales', getDailySalesReport);

module.exports = router;



