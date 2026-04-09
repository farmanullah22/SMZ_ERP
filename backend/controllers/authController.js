const db = require('../database/db');

const login = (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    const user = db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    
    addHistory('UPDATE', 'user', userId, `Password changed for user: ${user.username}`, null, { new: true });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsers = (req, res) => {
  try {
    const users = db.all('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existing = db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const result = db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
      [username, password, role || 'cashier']);
    
    res.status(201).json({ id: result.lastInsertRowid, username, role: role || 'cashier' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    const user = db.get('SELECT * FROM users WHERE id = ?', [parseInt(id)]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    db.run('DELETE FROM users WHERE id = ?', [parseInt(id)]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function addHistory(actionType, entityType, entityId, description, oldData, newData) {
  db.run(`
    INSERT INTO history (action_type, entity_type, entity_id, description)
    VALUES (?, ?, ?, ?)
  `, [actionType, entityType, entityId, description]);
}

module.exports = {
  login,
  changePassword,
  getUsers,
  createUser,
  deleteUser
};
