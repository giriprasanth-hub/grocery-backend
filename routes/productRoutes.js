const express = require('express');
const router = express.Router();

const {
  getProducts,
  addProduct,
  addBulkProducts,
  getLowStockCount,
  deleteProduct,
  updateProduct,
  getActiveProductsForCustomer
} = require('../controllers/productController');

// Routes
router.get('/', getProducts);
router.post('/', addProduct);
router.post('/bulk', addBulkProducts);
router.get('/low-stock/count', getLowStockCount);
router.delete('/:id', deleteProduct);
router.put('/:id', updateProduct);
router.get('/customer', getActiveProductsForCustomer);


module.exports = router;
