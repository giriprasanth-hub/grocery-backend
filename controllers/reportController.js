const Order = require('../models/Order');

exports.getSalesSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const daily = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const weekly = await Order.aggregate([
      { $match: { createdAt: { $gte: weekStart }, status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const monthly = await Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      daily: daily[0]?.total || 0,
      weekly: weekly[0]?.total || 0,
      monthly: monthly[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Sales report failed' });
  }
};

exports.getDailySalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
          status: 'Delivered',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch sales report',
    });
  }
};



