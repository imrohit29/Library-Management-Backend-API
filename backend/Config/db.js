const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    // Connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.end();

    console.log('Database ensured.');

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration to add column if it was missing 
    try {
      await pool.query('ALTER TABLE students ADD COLUMN student_id VARCHAR(50) UNIQUE AFTER id');
      await pool.query('UPDATE students SET student_id = CONCAT("STU-", LPAD(id, 4, "0")) WHERE student_id IS NULL');
    } catch(err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.error('Migration error:', err);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(100) NOT NULL,
        isbn VARCHAR(50) NOT NULL UNIQUE,
        total_copies INT NOT NULL DEFAULT 0,
        available_copies INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS issue_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        book_id INT NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE NULL,
        fine_amount INT DEFAULT 0,
        status ENUM('ISSUED', 'RETURNED') DEFAULT 'ISSUED',
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);

    console.log('Tables initialized successfully.');

    // Seed admin if not exists (username: admin, password: password123)
    const bcrypt = require('bcryptjs');
    const [admins] = await pool.query('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      const hash = await bcrypt.hash('password123', 10);
      await pool.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
      console.log('Default admin seeded (admin / password123).');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initDB();

module.exports = pool;
