const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * CREATE ORDER
 * ✅ REDUCE STOCK HERE (ATOMICALLY)
 * ✅ HANDLES VARIANTS CORRECTLY
 */
exports.createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items, totalAmount, paymentMethod } = req.body;

    if (!customerName || !phone || !address || !items || !totalAmount) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    // 🔐 ATOMIC STOCK CHECK + RESERVE FOR VARIANTS
    for (const item of items) {
      // Find the Product AND the specific Variant with enough stock
      const updated = await Product.findOneAndUpdate(
        {
          _id: item.productId, 
          "variants._id": item.variantId, // 🎯 Target specific variant
          "variants.stock": { $gte: item.quantity } // 🔥 Check VARIANT stock
        },
        {
          $inc: { "variants.$.stock": -item.quantity } // 🔒 Reduce VARIANT stock
        },
        { new: true }
      );

      if (!updated) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name} (${item.weight})`,
        });
      }
    }

    // ✅ Create order with Payment Method
    const order = new Order({
      customerName,
      phone,
      address,
      items, // Contains variantId from Flutter
      totalAmount,
      paymentMethod: paymentMethod || 'COD', // 💳 Save Payment Method
      status: 'Pending',
    });

    await order.save();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id,
    });
  } catch (error) {
    console.error("Order Create Error:", error);
    res.status(500).json({
      message: 'Failed to place order',
    });
  }
};


/**
 * GET ALL ORDERS (ADMIN)
 */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};


/**
 * UPDATE ORDER STATUS (ADMIN)
 * ✅ Restore stock on Returned / Delivery Failed / Cancelled
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Pending',
      'Preparing',
      'Packed',
      'Delivered',
      'Returned',
      'Delivery Failed',
      'Cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;

    // 🔒 Prevent duplicate delivery processing
    if (previousStatus === 'Delivered' && status === 'Delivered') {
      return res.status(400).json({ message: 'Order already delivered' });
    }

    // ❌ REMOVED "Reduce stock on Delivered" block. 
    // REASON: We already reduced it in createOrder. Doing it here would double-count.

    /**
     * 🔁 RESTORE STOCK ON FAILURE / CANCELLATION
     * (Returned, Delivery Failed, or Cancelled)
     */
    const failureStatuses = ['Returned', 'Delivery Failed', 'Cancelled'];
    
    // If moving TO a failure status, FROM a non-failure status -> Restore Stock
    if (failureStatuses.includes(status) && !failureStatuses.includes(previousStatus)) {
      console.log(`Restoring stock for Order ${orderId}`);
      
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          { 
            _id: item.productId, 
            "variants._id": item.variantId 
          },
          { 
            $inc: { "variants.$.stock": item.quantity } // ➕ Give stock back
          }
        );
      }
    }

    order.status = status;
    await order.save();

    res.json({
      message: 'Order status updated successfully',
      status: order.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update order status',
    });
  }
};


/**
 * GET ORDERS BY PHONE (CUSTOMER)
 */
exports.getOrdersByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const orders = await Order.find({ phone }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order history' });
  }
};


/**
 * GET ORDERS BY DATE (ADMIN REPORT)
 */
exports.getOrdersByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const from = new Date(date);
    from.setHours(0, 0, 0, 0);

    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: from, $lte: to },
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders by date' });
  }
};