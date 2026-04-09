const db = require('../database/db');
const path = require('path');
const fs = require('fs');

const getSettings = (req, res) => {
  try {
    const settings = db.all('SELECT * FROM settings');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSetting = (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const backupDatabase = (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../database/smz.db');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `smz-backup-${timestamp}.db`);

    fs.copyFileSync(dbPath, backupPath);
    
    res.download(backupPath, `smz-backup-${timestamp}.db`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  backupDatabase
};
