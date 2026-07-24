const mongoose = require('mongoose');
const { Setting } = require('../database/db');

const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find({});
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const backupDatabase = async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backup = {};
    for (const coll of collections) {
      const docs = await mongoose.connection.db.collection(coll.name).find({}).toArray();
      backup[coll.name] = docs;
    }
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSettings, updateSetting, backupDatabase };
