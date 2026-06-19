require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
const app = require('./app');

const PORT = parseInt(process.env.PORT || '3001');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(50) UNIQUE NOT NULL,
        long_url TEXT NOT NULL,
        remark VARCHAR(255),
        expires_at TIMESTAMP,
        max_clicks INTEGER DEFAULT NULL,
        click_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
        referer TEXT,
        user_agent TEXT,
        ip_address VARCHAR(50),
        clicked_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [adminUsername]
    );

    if (existingAdmin.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      await client.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        [adminUsername, passwordHash]
      );
      console.log(`默认管理员账号创建成功: ${adminUsername}`);
    }

    await client.query('COMMIT');
    console.log('数据库初始化完成');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('数据库初始化失败:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('服务器启动失败:', err);
    process.exit(1);
  }
}

startServer();
