const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrdersByPhone,
  getOrdersByDate 
} = require('../controllers/orderController');



// Routes
router.post('/', createOrder);
router.get('/', getOrders);
router.put('/:orderId/status', updateOrderStatus);
router.get('/customer/:phone', getOrdersByPhone);
router.get('/date/:date', getOrdersByDate);



module.exports = router;
