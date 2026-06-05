export interface Batch {
  id: string;
  name: string;
  company: string;
  color: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  idNumber: string;
  age: number;
  gender: string;
  phone: string;
  registeredAt: string;
  hasPhoto: boolean;
  initials: string;
  batchId: string;
  birthPlace: string;
  education: string;
  siblingOrder: string;
  totalSiblings: string;
  dateOfBirth?: string;
  occupation?: string;
  country?: string;
  province?: string;
  city?: string;
  fullAddress?: string;
  photo?: string | null;
}

export interface Psychologist {
  id: string;
  name: string;
  origin: string;
  age: number;
  phone: string;
  address: string;
  email: string;
  sipp: string;
  signature: string | null; // Base64 data URL
}

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
