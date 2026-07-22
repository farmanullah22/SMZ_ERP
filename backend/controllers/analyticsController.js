const db = require('../database/db');

const getAnalyticsData = (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const dateFrom = startDate || '1970-01-01';
    const dateTo = endDate || today;

    function withSalesDate(sql) {
      return sql.replace('{{dateFilter}}', `DATE(sales.created_at) BETWEEN DATE('${dateFrom}') AND DATE('${dateTo}')`);
    }

    function withDate(sql) {
      return sql.replace('{{dateFilter}}', `DATE(created_at) BETWEEN DATE('${dateFrom}') AND DATE('${dateTo}')`);
    }

    // 1. Sales by category (for donut chart)
    const salesByCategory = db.all(withSalesDate(`
      SELECT c.name as category_name, COALESCE(SUM(si.subtotal), 0) as total
      FROM sale_items si
      JOIN sales ON si.sale_id = sales.id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE {{dateFilter}}
      GROUP BY c.id
      ORDER BY total DESC
    `));

    // 2. Payment method breakdown (for pie chart)
    const paymentMethods = db.all(withSalesDate(`
      SELECT COALESCE(payment_method, 'Other') as payment_method, COUNT(*) as count, SUM(total_amount) as total
      FROM sales
      WHERE {{dateFilter}}
      GROUP BY payment_method
      ORDER BY total DESC
    `));

    // 3. Time-series sales data (for line + bar charts)
    let groupBy;
    switch (period) {
      case 'daily':
        groupBy = "strftime('%Y-%m-%d', sales.created_at)";
        break;
      case 'weekly':
        groupBy = "strftime('%Y-W%W', sales.created_at)";
        break;
      default:
        groupBy = "strftime('%Y-%m', sales.created_at)";
    }

    const timeSeries = db.all(withSalesDate(`
      SELECT ${groupBy} as period,
        SUM(total_amount) as total_sales,
        SUM(total_profit) as total_profit,
        COUNT(*) as order_count
      FROM sales
      WHERE {{dateFilter}}
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `));

    // 4. Top products by sales
    const topProducts = db.all(withSalesDate(`
      SELECT si.product_name, SUM(si.quantity) as qty, SUM(si.subtotal) as total
      FROM sale_items si
      JOIN sales ON si.sale_id = sales.id
      WHERE {{dateFilter}}
      GROUP BY si.product_name
      ORDER BY total DESC
      LIMIT 10
    `));

    // 5. Day-of-week breakdown
    const dayOfWeek = db.all(withSalesDate(`
      SELECT CAST(strftime('%w', sales.created_at) AS INTEGER) as dow, SUM(total_amount) as total
      FROM sales
      WHERE {{dateFilter}}
      GROUP BY dow
      ORDER BY dow
    `));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayLabels = dayOfWeek.map(d => dayNames[d.dow]);
    const dayTotals = dayOfWeek.map(d => d.total || 0);

    // 6. Summary stats
    const summary = db.get(withSalesDate(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales,
        SUM(total_profit) as total_profit
      FROM sales
      WHERE {{dateFilter}}
    `));

    const purchaseTotal = db.get(withDate(`
      SELECT SUM(total_amount) as total FROM purchases
      WHERE {{dateFilter}}
    `));

    res.json({
      salesByCategory: salesByCategory.map(r => ({ label: r.category_name || 'Uncategorized', value: r.total || 0 })),
      paymentMethods: paymentMethods.map(r => ({ label: r.payment_method, value: r.total || 0, count: r.count || 0 })),
      timeSeries: timeSeries.map(r => ({ period: r.period, sales: r.total_sales || 0, profit: r.total_profit || 0, orders: r.order_count || 0 })),
      topProducts: topProducts.map(r => ({ name: r.product_name, quantity: r.qty || 0, total: r.total || 0 })),
      dayOfWeek: { labels: dayLabels.length ? dayLabels : dayNames, data: dayTotals.length ? dayTotals : [0, 0, 0, 0, 0, 0, 0] },
      summary: {
        totalOrders: summary?.total_orders || 0,
        totalSales: summary?.total_sales || 0,
        totalProfit: summary?.total_profit || 0,
        totalExpenses: purchaseTotal?.total || 0
      },
      period: { startDate: dateFrom, endDate: dateTo }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnalyticsData };
