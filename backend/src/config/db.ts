import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL connection configuration
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'asisya_db'}`;

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Helper to query database
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Initialize database schema tables
export const initDb = async () => {
  try {
    console.log("[db] Initializing database tables...");

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) NOT NULL, -- 'apex', 'staff', 'psikolog', 'reguler'
        status VARCHAR(50) DEFAULT 'active', -- 'active', 'banned'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create batches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        color VARCHAR(50) NOT NULL
      );
    `);

    // Create psychologists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS psychologists (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        sipp VARCHAR(255),
        origin VARCHAR(255),
        age INTEGER,
        phone VARCHAR(50),
        address TEXT,
        signature TEXT, -- Base64 data URL
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create patients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        id_number VARCHAR(255) NOT NULL,
        age INTEGER,
        gender VARCHAR(10),
        phone VARCHAR(50),
        registered_at VARCHAR(50),
        initials VARCHAR(10),
        batch_id VARCHAR(255) REFERENCES batches(id) ON DELETE SET NULL,
        birth_place VARCHAR(255),
        education VARCHAR(255),
        sibling_order VARCHAR(255),
        total_siblings VARCHAR(255),
        date_of_birth VARCHAR(50),
        occupation VARCHAR(255),
        country VARCHAR(10),
        province VARCHAR(255),
        city VARCHAR(255),
        full_address TEXT,
        photo TEXT
      );
    `);

    // Create appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE CASCADE,
        psychologist_id VARCHAR(255) REFERENCES psychologists(id) ON DELETE SET NULL,
        date VARCHAR(50) NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        visible_to_regular BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create activity_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        email VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default batches if empty
    const batchCheck = await pool.query("SELECT COUNT(*) FROM batches");
    if (parseInt(batchCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO batches (id, name, company, color) VALUES
        ('B001', 'Batch Mandiri Q1 2025', 'PT Bank Mandiri', '#1e40af'),
        ('B002', 'Batch Telkom April 2025', 'PT Telkom Indonesia', '#0f766e'),
        ('B003', 'Batch BCA Mei 2025', 'PT Bank BCA', '#6d28d9'),
        ('B004', 'Batch Individual', '—', '#475569');
      `);
      console.log("[db] Inserted default batches.");
    }

    // Insert default seed users (hashed password 'password' is encrypted using simple hash or bcrypt)
    // For local testing, we can insert an apex user, staff user, and regular user
    const userCheck = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count) === 0) {
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash("password", 10);
      
      // Seed users
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, role, status) VALUES
        ('u-1', 'Apex Admin', 'apex@asisya.com', '${passwordHash}', 'apex', 'active'),
        ('u-2', 'Staff Utama', 'staff@asisya.com', '${passwordHash}', 'staff', 'active'),
        ('u-3', 'User Reguler', 'reguler@asisya.com', '${passwordHash}', 'reguler', 'active'),
        ('u-4', 'Dairy Team', 'Dairyteam@Gmail.com', '${passwordHash}', 'psikolog', 'active'),
        ('u-5', 'Dr. Sarah Wijaya, M.Psi.', 'sarah.w@asisya.com', '${passwordHash}', 'psikolog', 'active');
      `);

      // Seed psychologists matching the user IDs above
      await pool.query(`
        INSERT INTO psychologists (id, user_id, name, email, sipp, origin, age, phone, address, signature) VALUES
        ('psy-1', 'u-4', 'Dairy Team', 'Dairyteam@Gmail.com', 'SIPP/09/2026/01-DT', 'Surabaya', 28, '+62 812 3456 7890', 'Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya', NULL),
        ('psy-2', 'u-5', 'Dr. Sarah Wijaya, M.Psi.', 'sarah.w@asisya.com', 'SIPP/12/2024/02-SW', 'Jakarta', 35, '+62 811 9988 7766', 'Sudirman Central Business District Jakarta', NULL);
      `);

      console.log("[db] Seeded initial database users and psychologists.");
    }

    console.log("[db] Database initialization completed successfully.");
  } catch (error) {
    console.error("[db] Database initialization failed:", error);
  }
};

export const logActivity = async (
  userId: string | null,
  email: string | null,
  action: string,
  details: string
): Promise<void> => {
  try {
    await pool.query(
      "INSERT INTO activity_logs (user_id, email, action, details) VALUES ($1, $2, $3, $4)",
      [userId || "system", email || "system@asisya.com", action, details]
    );
    console.log(`[log] ${action} - ${email}: ${details}`);
  } catch (error) {
    console.error("[db] Failed to insert activity log:", error);
  }
};
