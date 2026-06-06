export type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E };

export type Batch = {
  id: string;
  name: string;
  company: string;
  color: string;
  deleted?: boolean;
  logo?: string | null;
  useLogoInReport?: boolean;
  logoScale?: number;
};

export type Patient = {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  age: number;
  gender: string; // "M" | "F" | "O"
  phone: string;
  registeredAt: string;
  hasPhoto: boolean;
  initials: string;
  batchId: string; // "" = no batch
  birthPlace: string;
  education: string;
  siblingOrder: string;
  totalSiblings: string;

  // Extra details for edit/persistence
  dateOfBirth?: string;
  occupation?: string;
  country?: string;
  province?: string;
  city?: string;
  fullAddress?: string;
  photo?: string | null;
};

export type FormData = {
  fullName: string;
  dateOfBirth: string;
  gender: string; // "male" | "female" | "other"
  occupation: string;
  phone: string;
  email: string;
  country: string;
  province: string;
  city: string;
  fullAddress: string;
  photo: string | null;
  batchId: string;
  birthPlace: string;
  education: string;
  siblingOrder: string;
  totalSiblings: string;
};

export type Psychologist = {
  id: string;
  name: string;
  origin: string;
  age: number;
  phone: string;
  address: string;
  email: string;
  sipp: string;
  signature: string | null; // Base64 data URL
};

export interface PatientRecord {
  id: string;
  name: string;
  gender: string;
  age: number;
  birthPlace?: string;
  dateOfBirth?: string; // ISO string
  education?: string;
  siblingOrder?: string;
  totalSiblings?: string;
  fullAddress?: string;
  city?: string;
  batchId?: string;
}

export type ReportForm = {
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  usia: string;
  pendidikan: string;
  anakKeberapa: string;
  jumlahSaudara: string;
  alamat: string;
  permasalahan: string;
  prosesKonseling: string;
  diagnosisKlinis: string;
  saranPengembangan: string;
  pasienKonseling?: boolean;
  patientId?: string | null;
};

export interface FsFile {
  id: string;
  kind: "file";
  name: string;
  mimeType: "application/pdf";
  size: string;
  createdAt: string;
}

export interface FsFolder {
  id: string;
  kind: "folder";
  name: string;
  createdAt: string;
  children: FsNode[];
}

export type FsNode = FsFolder | FsFile;

// Medical history schemas
export type RecordType = "kondisi" | "terapi" | "pemicu" | "obat";
export type RecordStatus = "Aktif" | "Selesai" | "Kronik";

export interface PsychRecord {
  id: string;
  type: RecordType;
  title: string;
  description: string;
  notes: string;
  status: RecordStatus;
  date: string;
}

export interface PsychPatient {
  id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  batchId: string;
  records: PsychRecord[];
}
