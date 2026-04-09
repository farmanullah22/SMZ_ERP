const db = require('./backend/database/db');

async function test() {
  await db.initDatabase();
  
  console.log('Testing db.run...');
  const result = db.run('INSERT INTO customers (name) VALUES (?)', ['Test Customer']);
  console.log('Result:', result);
  
  console.log('Checking customer...');
  const customer = db.get('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid]);
  console.log('Customer:', customer);
}

test().catch(console.error);
