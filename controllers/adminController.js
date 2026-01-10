const Order = require('../models/Order');

// 📊 SALES REPORT
exports.getSalesReport = async (req, res) => {
  try {
    const now = new Date();

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6
    );

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [daily, weekly, monthly] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: 'Delivered',
            createdAt: { $gte: startOfDay },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: 'Delivered',
            createdAt: { $gte: startOfWeek },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: 'Delivered',
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.json({
      daily: daily[0]?.total || 0,
      weekly: weekly[0]?.total || 0,
      monthly: monthly[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales report' });
  }
};
