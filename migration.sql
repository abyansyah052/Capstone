-- --------------------------------------------------------
-- PostgreSQL Database Migration Schema & Seed Scripts
-- Internal Psychological Management System (IPMS)
-- --------------------------------------------------------

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL, -- 'apex', 'staff', 'psikolog', 'reguler'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'banned'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Batches / Company Table
CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  deleted BOOLEAN DEFAULT FALSE,
  logo TEXT, -- Base64 data URL
  use_logo_in_report BOOLEAN DEFAULT FALSE,
  logo_scale REAL DEFAULT 1.0
);

-- 3. Create Psychologists Table
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

-- 4. Create Patients Table
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
  photo TEXT -- Base64 data URL
);

-- 5. Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255),
  psychologist_id VARCHAR(255) REFERENCES psychologists(id) ON DELETE SET NULL,
  date VARCHAR(50) NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  duration INTEGER DEFAULT 60,
  type VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled'
  notify VARCHAR(50) DEFAULT 'none',
  notify_phone VARCHAR(50),
  notify_email VARCHAR(255),
  visible_to_regular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Report Nodes Table (Virtual File Explorer representation)
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

-- --------------------------------------------------------
-- SEED DATA
-- --------------------------------------------------------

-- Seed Default Batches
INSERT INTO batches (id, name, company, color, deleted, logo, use_logo_in_report, logo_scale) VALUES
('B001', 'Batch Mandiri Q1 2025', 'PT Bank Mandiri', '#1e40af', FALSE, NULL, FALSE, 1.0),
('B002', 'Batch Telkom April 2025', 'PT Telkom Indonesia', '#0f766e', FALSE, NULL, FALSE, 1.0),
('B003', 'Batch BCA Mei 2025', 'PT Bank BCA', '#6d28d9', FALSE, NULL, FALSE, 1.0),
('B004', 'Batch Individual', '—', '#475569', FALSE, NULL, FALSE, 1.0)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Users (Password Hash represents BCrypt for 'password')
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('u-1', 'Apex Admin', 'apex@asisya.com', '$2a$10$pL1m/rY3Gveo5.a/XF4KceA1K1X1L3Zq2n2q4n2q4n2q4n2q4n2q.', 'apex', 'active'),
('u-2', 'Staff Utama', 'staff@asisya.com', '$2a$10$pL1m/rY3Gveo5.a/XF4KceA1K1X1L3Zq2n2q4n2q4n2q4n2q4n2q.', 'staff', 'active'),
('u-3', 'User Reguler', 'reguler@asisya.com', '$2a$10$pL1m/rY3Gveo5.a/XF4KceA1K1X1L3Zq2n2q4n2q4n2q4n2q4n2q.', 'reguler', 'active'),
('u-4', 'Dairy Team', 'Dairyteam@Gmail.com', '$2a$10$pL1m/rY3Gveo5.a/XF4KceA1K1X1L3Zq2n2q4n2q4n2q4n2q4n2q.', 'psikolog', 'active'),
('u-5', 'Dr. Sarah Wijaya, M.Psi.', 'sarah.w@asisya.com', '$2a$10$pL1m/rY3Gveo5.a/XF4KceA1K1X1L3Zq2n2q4n2q4n2q4n2q4n2q.', 'psikolog', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Psychologists
INSERT INTO psychologists (id, user_id, name, email, sipp, origin, age, phone, address, signature) VALUES
('psy-1', 'u-4', 'Dairy Team', 'Dairyteam@Gmail.com', 'SIPP/09/2026/01-DT', 'Surabaya', 28, '+62 812 3456 7890', 'Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya', NULL),
('psy-2', 'u-5', 'Dr. Sarah Wijaya, M.Psi.', 'sarah.w@asisya.com', 'SIPP/12/2024/02-SW', 'Jakarta', 35, '+62 811 9988 7766', 'Sudirman Central Business District Jakarta', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Report Folder Nodes
INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES
('f1', 'PT PLN (Persero)', 'folder', NULL, NULL, NULL, NULL, '2026-01-10'),
('f2', 'Kimia Farma', 'folder', NULL, NULL, NULL, NULL, '2026-02-01'),
('f3', 'Bank Mandiri', 'folder', NULL, NULL, NULL, NULL, '2026-03-05'),
('f1-1', 'Batch 2026', 'folder', 'f1', NULL, NULL, NULL, '2026-01-15')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Report File Nodes (Form json fields)
INSERT INTO report_nodes (id, name, kind, parent_id, mime_type, size, file_content, created_at) VALUES
('p1', 'Laporan_Andi Firmansyah.pdf', 'file', 'f1-1', 'application/pdf', '245 KB', '{"namaLengkap":"Andi Firmansyah","tempatLahir":"Jakarta","tanggalLahir":"1995-05-12","jenisKelamin":"Laki-laki","usia":"30","pendidikan":"S1 Teknik","anakKeberapa":"1","jumlahSaudara":"3","alamat":"Jl. Sudirman No. 10, Jakarta","permasalahan":"Mengalami stres kerja yang tinggi akibat beban proyek akhir tahun yang menumpuk.","prosesKonseling":"Dilakukan konseling kognitif perilaku (CBT) selama 3 sesi untuk mengelola stres dan mengatur waktu secara lebih adaptif.","diagnosisKlinis":"Z73.0 Burn-out (Kelelahan Kerja)","saranPengembangan":"Disarankan untuk melakukan regulasi emosi, relaksasi otot progresif, dan berdiskusi dengan atasan mengenai pendelegasian tugas."}', '2026-02-03'),
('p2', 'Laporan_Siti Rahayu.pdf', 'file', 'f1-1', 'application/pdf', '198 KB', '{"namaLengkap":"Siti Rahayu","tempatLahir":"Bandung","tanggalLahir":"1998-08-24","jenisKelamin":"Perempuan","usia":"27","pendidikan":"S1 Psikologi","anakKeberapa":"2","jumlahSaudara":"2","alamat":"Jl. Dipatiukur No. 45, Bandung","permasalahan":"Kecemasan berlebih saat menghadapi presentasi di depan direksi perusahaan.","prosesKonseling":"Dilakukan teknik restrukturisasi kognitif dan latihan pernapasan diafragma untuk mengontrol gejala fisik kecemasan.","diagnosisKlinis":"F41.9 Gangguan Kecemasan YTT","saranPengembangan":"Disarankan melakukan simulasi presentasi mandiri dan latihan mindfulness secara teratur sebelum sesi formal."}', '2026-02-05'),
('p3', 'Laporan_Budi Santoso.pdf', 'file', 'f2', 'application/pdf', '312 KB', '{"namaLengkap":"Budi Santoso","tempatLahir":"Surabaya","tanggalLahir":"1992-11-03","jenisKelamin":"Laki-laki","usia":"33","pendidikan":"D3 Administrasi","anakKeberapa":"3","jumlahSaudara":"4","alamat":"Jl. Dharmahusada No. 12, Surabaya","permasalahan":"Kesulitan beradaptasi dengan sistem pelaporan digital baru di kantor.","prosesKonseling":"Dilakukan konseling suportif dan pelatihan asertif untuk membantu penyesuaian diri terhadap perubahan organisasional.","diagnosisKlinis":"F43.2 Gangguan Penyesuaian","saranPengembangan":"Disarankan mengikuti pendampingan teknis intensif dari rekan kerja senior (buddy system)."}', '2026-02-20')
ON CONFLICT (id) DO NOTHING;
