export const calcAge = (dob: string): number => {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const formatDate = (dob: string): string => {
  if (!dob) return "";
  return new Date(dob).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatRegistered = (iso: string): string => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Convert form gender value ("male"/"female"/"other") → stored code ("M"/"F"/"O") */
export const toGenderCode = (v: string): string => {
  if (v === "female") return "F";
  if (v === "male") return "M";
  return "O";
};

/** Convert stored code ("M"/"F"/"O") → form gender value ("male"/"female"/"other") */
export const fromGenderCode = (g: string): string => {
  if (g === "F") return "female";
  if (g === "M") return "male";
  return "other";
};

/** Generate PT-XXXX-X style ID */
export const generateId = (): string => {
  const num = String(Math.floor(1000 + Math.random() * 9000));
  const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `PT-${num}-${char}`;
};

/** Get initials from full name (up to 2 chars) */
export const getInitials = (name: string): string => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const AVATAR_PALETTE = [
  "#01696f",
  "#1e40af",
  "#6d28d9",
  "#be185d",
  "#b45309",
  "#15803d",
  "#0369a1",
  "#9f1239",
];

export const avatarColor = (name: string): string => {
  if (!name) return AVATAR_PALETTE[0]!;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!;
};

/** Unique short ID generator for Explorer tree node */
export const uid = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
