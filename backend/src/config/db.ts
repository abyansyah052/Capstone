import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

// PostgreSQL connection configuration
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || "postgres"}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || "asisya_db"}`;

const isProduction = process.env.NODE_ENV === "production";
const useSsl = isProduction || connectionString.includes("neon.tech");

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000, // Fail fast (5s) instead of hanging the serverless function
  idleTimeoutMillis: 10000, // Close idle clients fast in serverless environment
  max: 10, // Limit connections
});

// Prevent process crash on unexpected database client errors
pool.on("error", (err) => {
  console.error("[db] Unexpected error on idle client:", err);
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
        color VARCHAR(50) NOT NULL,
        deleted BOOLEAN DEFAULT FALSE
      );
    `);
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;");
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS logo TEXT;");
    await pool.query(
      "ALTER TABLE batches ADD COLUMN IF NOT EXISTS use_logo_in_report BOOLEAN DEFAULT FALSE;"
    );
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS logo_scale REAL DEFAULT 1.0;");

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
        patient_name VARCHAR(255),
        psychologist_id VARCHAR(255),
        date VARCHAR(50) NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        duration INTEGER DEFAULT 60,
        type VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        notify VARCHAR(50) DEFAULT 'none',
        notify_phone VARCHAR(50),
        notify_email VARCHAR(255),
        visible_to_regular BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(
      "ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_psychologist_id_fkey;"
    );
    await pool.query(
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255);"
    );
    await pool.query(
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;"
    );
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type VARCHAR(255);");
    await pool.query(
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notify VARCHAR(50) DEFAULT 'none';"
    );
    await pool.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notify_phone VARCHAR(50);");
    await pool.query(
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notify_email VARCHAR(255);"
    );

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

    // Create report_nodes table for file explorer database representation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_nodes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        kind VARCHAR(50) NOT NULL, -- 'folder' or 'file'
        parent_id VARCHAR(255) REFERENCES report_nodes(id) ON DELETE CASCADE,
        mime_type VARCHAR(100),
        size VARCHAR(50),
        file_content TEXT, -- JSON string for ReportForm or Base64 string for direct PDF upload
        created_at VARCHAR(50) NOT NULL
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

    // Seed default report nodes if empty
    const reportNodesCheck = await pool.query("SELECT COUNT(*) FROM report_nodes");
    if (parseInt(reportNodesCheck.rows[0].count) === 0) {
      // Root folders
      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ('f1', 'PT PLN (Persero)', 'folder', NULL, NULL, NULL, NULL, '2026-01-10')"
      );
      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ('f2', 'Kimia Farma', 'folder', NULL, NULL, NULL, NULL, '2026-02-01')"
      );
      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ('f3', 'Bank Mandiri', 'folder', NULL, NULL, NULL, NULL, '2026-03-05')"
      );

      // Nested folder
      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ('f1-1', 'Batch 2026', 'folder', 'f1', NULL, NULL, NULL, '2026-01-15')"
      );

      // Seed files (PDF reports with mock JSON content representing ReportForm)
      const mockForm1 = JSON.stringify({
        namaLengkap: "Andi Firmansyah",
        tempatLahir: "Jakarta",
        tanggalLahir: "1995-05-12",
        jenisKelamin: "Laki-laki",
        usia: "30",
        pendidikan: "S1 Teknik",
        anakKeberapa: "1",
        jumlahSaudara: "3",
        alamat: "Jl. Sudirman No. 10, Jakarta",
        permasalahan:
          "Mengalami stres kerja yang tinggi akibat beban proyek akhir tahun yang menumpuk.",
        prosesKonseling:
          "Dilakukan konseling kognitif perilaku (CBT) selama 3 sesi untuk mengelola stres dan mengatur waktu secara lebih adaptif.",
        diagnosisKlinis: "Z73.0 Burn-out (Kelelahan Kerja)",
        saranPengembangan:
          "Disarankan untuk melakukan regulasi emosi, relaksasi otot progresif, dan berdiskusi dengan atasan mengenai pendelegasian tugas.",
      });

      const mockForm2 = JSON.stringify({
        namaLengkap: "Siti Rahayu",
        tempatLahir: "Bandung",
        tanggalLahir: "1998-08-24",
        jenisKelamin: "Perempuan",
        usia: "27",
        pendidikan: "S1 Psikologi",
        anakKeberapa: "2",
        jumlahSaudara: "2",
        alamat: "Jl. Dipatiukur No. 45, Bandung",
        permasalahan: "Kecemasan berlebih saat menghadapi presentasi di depan direksi perusahaan.",
        prosesKonseling:
          "Dilakukan teknik restrukturisasi kognitif dan latihan pernapasan diafragma untuk mengontrol gejala fisik kecemasan.",
        diagnosisKlinis: "F41.9 Gangguan Kecemasan YTT",
        saranPengembangan:
          "Disarankan melakukan simulasi presentasi mandiri dan latihan mindfulness secara teratur sebelum sesi formal.",
      });

      const mockForm3 = JSON.stringify({
        namaLengkap: "Budi Santoso",
        tempatLahir: "Surabaya",
        tanggalLahir: "1992-11-03",
        jenisKelamin: "Laki-laki",
        usia: "33",
        pendidikan: "D3 Administrasi",
        anakKeberapa: "3",
        jumlahSaudara: "4",
        alamat: "Jl. Dharmahusada No. 12, Surabaya",
        permasalahan: "Kesulitan beradaptasi dengan sistem pelaporan digital baru di kantor.",
        prosesKonseling:
          "Dilakukan konseling suportif dan pelatihan asertif untuk membantu penyesuaian diri terhadap perubahan organisasional.",
        diagnosisKlinis: "F43.2 Gangguan Penyesuaian",
        saranPengembangan:
          "Disarankan mengikuti pendampingan teknis intensif dari rekan kerja senior (buddy system).",
      });

      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          "p1",
          "Laporan_Andi Firmansyah.pdf",
          "file",
          "f1-1",
          "application/pdf",
          "245 KB",
          mockForm1,
          "2026-02-03",
        ]
      );
      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          "p2",
          "Laporan_Siti Rahayu.pdf",
          "file",
          "f1-1",
          "application/pdf",
          "198 KB",
          mockForm2,
          "2026-02-05",
        ]
      );
      await pool.query(
        "INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          "p3",
          "Laporan_Budi Santoso.pdf",
          "file",
          "f2",
          "application/pdf",
          "312 KB",
          mockForm3,
          "2026-02-20",
        ]
      );

      console.log("[db] Seeded initial report bank directory nodes.");
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
