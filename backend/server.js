require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/stamp-papers', require('./routes/stampPapers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/website', require('./routes/website'));
app.use('/api/services', require('./routes/services'));
app.use('/api/mobile-transactions', require('./routes/mobileTransactions'));
app.use('/api/recharges', require('./routes/recharges'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/website-content', require('./routes/websiteContent'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve website pages
app.use('/website', express.static(path.join(__dirname, '../frontend/website')));
app.get('/website/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/website/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

async function startServer() {
  try {
    await initDatabase();
    console.log('Database connected successfully');
    return await new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        resolve(server);
      });
      server.on('error', reject);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

if (require.main === module) {
  startServer().catch(() => process.exit(1));
}

module.exports = { app, startServer };
