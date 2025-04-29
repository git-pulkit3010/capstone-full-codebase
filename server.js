const express = require('express');
require('dotenv').config();
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log('Incoming Headers:', req.headers);
    console.log('Request Body:', req.body);
    next();
  });

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });  


// Verify table exists at startup
async function verifyTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS summaries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          text_hash VARCHAR(64) NOT NULL,
          summary_text TEXT NOT NULL,
          category VARCHAR(32) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY (text_hash, category)
        );
      `);
      console.log('✅ Verified table exists');
    } catch (err) {
      console.error('❌ Table verification failed:', err);
      process.exit(1);
    }
  }
  
  // Call it after pool creation
  verifyTable();
  

// Test database connection immediately
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connection successful');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// API endpoints with detailed logging
app.post('/api/store-summary', async (req, res) => {
    const { textHash, summary, category, url } = req.body;
    if (category === 'custom') {
      console.log('Skipping storage for custom inquiry');
      return res.json({ success: false, message: 'Custom inquiries are not stored' });
  }

  
    console.log('Attempting to insert summary:', { textHash, category, url });
  
    try {
      const [result] = await pool.query(
        'INSERT INTO summaries (text_hash, summary_text, category, url) VALUES (?, ?, ?, ?)',
        [textHash, summary, category, url]
      );
      
      console.log('✅ Successful insert, ID:', result.insertId);
      res.json({ 
        success: true,
        insertedId: result.insertId
      });
    } catch (err) {
      console.error('❌ Full error details:', {
        message: err.message,
        code: err.code,
        sql: err.sql
      });
      res.status(500).json({ 
        error: 'Database error',
        details: err.message
      });
    }
  });
  

// Add this temporary endpoint for testing
app.post('/api/test-insert', async (req, res) => {
  const testData = {
    text_hash: 'testhash123',
    summary_text: 'This is a test summary',
    category: 'test'
  };

  try {
    const [result] = await pool.query('INSERT INTO summaries SET ?', testData);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
// Add this endpoint to server.js (before the app.listen call)
app.post('/api/get-summary', async (req, res) => {
    console.log('Get summary request:', req.body);
    
    try {
      const [rows] = await pool.query(
        'SELECT summary_text FROM summaries WHERE text_hash = ? AND category = ?',
        [req.body.textHash, req.body.category]
      );
      
      console.log('Query results:', rows);
      res.json({ 
        success: true,
        summary: rows[0]?.summary_text 
      });
    } catch (err) {
      console.error('Database query error:', {
        message: err.message,
        code: err.code,
        sql: err.sql
      });
      res.status(500).json({ 
        error: 'Database error',
        details: err.message
      });
    }
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Test endpoint: POST http://localhost:${PORT}/api/test-insert`);
});