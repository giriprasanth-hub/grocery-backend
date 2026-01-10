const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * CREATE ORDER
 * ❌ NO STOCK REDUCTION HERE
 */
exports.createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items, totalAmount } = req.body;

    if (!customerName || !phone || !address || !items || !totalAmount) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    // 🔐 ATOMIC STOCK CHECK + RESERVE
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity }, // 🔥 ENSURES ENOUGH STOCK
        },
        {
          $inc: { stock: -item.quantity }, // 🔒 RESERVE STOCK
        },
        { new: true }
      );

      if (!updated) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}`,
        });
      }
    }

    // ✅ Create order AFTER stock is reserved
    const order = new Order({
      customerName,
      phone,
      address,
      items,
      totalAmount,
      status: 'Pending',
    });

    await order.save();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id,
    });
  } catch (error) {
    console.error(error);
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
 * ✅ Reduce stock ONLY on Delivered
 * ✅ Restore stock on Returned / Delivery Failed
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
      return res.status(400).json({
        message: 'Invalid status value',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    const previousStatus = order.status;

    // 🔒 Prevent duplicate delivery processing
    if (previousStatus === 'Delivered' && status === 'Delivered') {
      return res.status(400).json({
        message: 'Order already delivered',
      });
    }

    /**
     * 📦 REDUCE STOCK ONLY WHEN DELIVERED
     */
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    /**
     * 🔁 RESTORE STOCK ON RETURN / DELIVERY FAILED
     */
    if (
      ['Returned', 'Delivery Failed'].includes(status) &&
      previousStatus === 'Delivered'
    ) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
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

    const orders = await Order.find({ phone }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch order history',
    });
  }
};

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
    res.status(500).json({
      message: 'Failed to fetch orders by date',
    });
  }
};
