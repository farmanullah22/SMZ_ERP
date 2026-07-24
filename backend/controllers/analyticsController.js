const { Sale, SaleItem, Purchase, Product, Category } = require('../database/db');

const getAnalyticsData = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const dateFrom = startDate || '1970-01-01';
    const dateTo = endDate || today;

    const dateFilter = {
      created_at: { $gte: new Date(dateFrom), $lte: new Date(dateTo + 'T23:59:59.999Z') }
    };

    // 1. Sales by category
    const salesByCategory = await SaleItem.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: 'sale',
          foreignField: '_id',
          as: 'saleData'
        }
      },
      { $unwind: '$saleData' },
      { $match: { 'saleData.created_at': dateFilter.created_at } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productData.category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryData._id',
          category_name: { $first: { $ifNull: ['$categoryData.name', 'Uncategorized'] } },
          total: { $sum: '$subtotal' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 2. Payment method breakdown
    const paymentMethods = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $ifNull: ['$payment_method', 'Other'] },
          count: { $sum: 1 },
          total: { $sum: '$total_amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 3. Time-series sales data
    let groupFormat;
    switch (period) {
      case 'daily':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: '%Y-W%V', date: '$created_at' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$created_at' } };
    }

    const timeSeries = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupFormat,
          total_sales: { $sum: '$total_amount' },
          total_profit: { $sum: '$total_profit' },
          order_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Top products
    const topProducts = await SaleItem.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: 'sale',
          foreignField: '_id',
          as: 'saleData'
        }
      },
      { $unwind: '$saleData' },
      { $match: { 'saleData.created_at': dateFilter.created_at } },
      {
        $group: {
          _id: '$product_name',
          qty: { $sum: '$quantity' },
          total: { $sum: '$subtotal' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // 5. Day-of-week breakdown
    const dayOfWeek = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dayOfWeek: '$created_at' },
          total: { $sum: '$total_amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = {};
    dayOfWeek.forEach(d => { dayMap[d._id - 1] = d.total; });
    const dayLabels = dayNames;
    const dayTotals = dayNames.map((_, i) => dayMap[i] || 0);

    // 6. Summary
    const summary = await Sale.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total_orders: { $sum: 1 }, total_sales: { $sum: '$total_amount' }, total_profit: { $sum: '$total_profit' } } }
    ]);

    const purchaseTotal = await Purchase.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    res.json({
      salesByCategory: salesByCategory.map(r => ({ label: r.category_name, value: r.total || 0 })),
      paymentMethods: paymentMethods.map(r => ({ label: r._id, value: r.total || 0, count: r.count || 0 })),
      timeSeries: timeSeries.map(r => ({ period: r._id, sales: r.total_sales || 0, profit: r.total_profit || 0, orders: r.order_count || 0 })),
      topProducts: topProducts.map(r => ({ name: r._id, quantity: r.qty || 0, total: r.total || 0 })),
      dayOfWeek: { labels: dayLabels, data: dayTotals },
      summary: {
        totalOrders: summary[0]?.total_orders || 0,
        totalSales: summary[0]?.total_sales || 0,
        totalProfit: summary[0]?.total_profit || 0,
        totalExpenses: purchaseTotal[0]?.total || 0
      },
      period: { startDate: dateFrom, endDate: dateTo }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnalyticsData };
