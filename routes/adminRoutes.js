const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');


router.get('/sales-report', adminController.getSalesReport);

module.exports = router;
