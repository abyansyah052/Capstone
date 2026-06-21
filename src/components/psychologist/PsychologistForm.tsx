import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, PenTool, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Psychologist } from "../../types";

type FormData = {
  name: string;
  origin: string;
  age: string;
  phone: string;
  address: string;
  email: string;
  sipp: string;
  signature: string | null;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

// Validation helper
function validateField(key: keyof FormData, value: string): string {
  switch (key) {
    case "name": {
      if (!value.trim()) return "Nama lengkap wajib diisi.";
      if (value.trim().length < 2) return "Nama minimal 2 karakter.";
      if (value.trim().length > 100) return "Nama maksimal 100 karakter.";
      return "";
    }
    case "origin": {
      if (!value.trim()) return "Asal kota wajib diisi.";
      return "";
    }
    case "age": {
      if (!value) return "Umur wajib diisi.";
      const parsed = parseInt(value);
      if (isNaN(parsed) || parsed < 20 || parsed > 100)
        return "Umur harus di antara 20 - 100 tahun.";
      return "";
    }
    case "phone": {
      if (!value.trim()) return "Nomor telepon wajib diisi.";
      return "";
    }
    case "email": {
      if (!value.trim()) return "Email wajib diisi.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return "Format email tidak valid.";
      return "";
    }
    case "sipp": {
      if (!value.trim()) return "Nomor SIPP wajib diisi.";
      return "";
    }
    case "address": {
      if (!value.trim()) return "Alamat lengkap wajib diisi.";
      return "";
    }
    default:
      return "";
  }
}

function validateAll(form: FormData): FormErrors {
  const keys: (keyof FormData)[] = ["name", "origin", "age", "phone", "email", "sipp", "address"];
  const errs: FormErrors = {};
  for (const k of keys) {
    const msg = validateField(k, form[k] as string);
    if (msg) errs[k] = msg;
  }
  return errs;
}

// Styling Constants
const inputCls =
  "px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/60 " +
  "focus:ring-2 focus:ring-[#01696f]/10 transition-all";

const inputErrCls =
  "px-3.5 py-2.5 rounded-lg border border-red-300 bg-red-50/30 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-red-400 " +
  "focus:ring-2 focus:ring-red-100 transition-all";

function Field({
  label,
  id,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  id?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-auto text-[11px] font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium"
          >
            <AlertCircle size={11} className="flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[13px] font-semibold text-slate-700">{title}</p>
        {badge}
      </div>
      <div className="p-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? "#15803d" : value >= 40 ? "#b45309" : "#e11d48";

  const label =
    value >= 80 ? "Hampir selesai" : value >= 40 ? "Sebagian terisi" : "Perlu dilengkapi";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px] text-slate-500">Kelengkapan</span>
        <span className="text-[12px] font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px]" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

type PsychologistFormProps = {
  initialPsychologist?: Psychologist | null;
  currentUser?: { id: string; role: string; email: string } | null;
  onBack: () => void;
  onSave: (p: Psychologist, userId?: string) => void;
};

export function PsychologistForm({
  initialPsychologist = null,
  currentUser = null,
  onBack,
  onSave,
}: PsychologistFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: initialPsychologist?.name ?? "",
    origin: initialPsychologist?.origin ?? "",
    age: initialPsychologist?.age ? String(initialPsychologist.age) : "",
    phone: initialPsychologist?.phone ?? "",
    address: initialPsychologist?.address ?? "",
    email: initialPsychologist?.email ?? "",
    sipp: initialPsychologist?.sipp ?? "",
    signature: initialPsychologist?.signature ?? null,
  });

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [completeness, setCompleteness] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!initialPsychologist && currentUser) {
      const fetchUsers = async () => {
        try {
          const res = await fetch("/api/auth/users", {
            headers: {
              "x-user-id": currentUser.id,
              "x-user-role": currentUser.role,
              "x-user-email": currentUser.email,
            },
          });
          const json = await res.json();
          if (json.ok) {
            setUsers(json.data.filter((u: any) => u.role !== "psikolog"));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchUsers();
    }
  }, [initialPsychologist, currentUser]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user) {
      setForm((p) => ({
        ...p,
        name: user.name,
        email: user.email,
      }));
    }
  };

  const set = (key: keyof FormData, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (touched[key] || submitted) {
      const msg = validateField(key, val);
      setErrors((prev) => ({ ...prev, [key]: msg }));
    }
  };

  const touch = (key: keyof FormData) => {
    if (touched[key]) return;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const msg = validateField(key, form[key] as string);
    setErrors((prev) => ({ ...prev, [key]: msg }));
  };

  useEffect(() => {
    const req = ["name", "origin", "age", "phone", "email", "sipp", "address"];
    const filled = req.filter((k) => form[k as keyof FormData]).length;
    setCompleteness(Math.round((filled / req.length) * 100));
  }, [form]);

  const allErrors = validateAll(form);
  const hasErrors = Object.values(allErrors).some(Boolean);
  const isReadyToSubmit = completeness === 100 && !hasErrors;

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setForm((prev) => ({ ...prev, signature: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validateAll(form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean) || !isReadyToSubmit) return;

    const savedPsychologist: Psychologist = {
      id: initialPsychologist?.id ?? `psy-${Date.now()}`,
      name: form.name,
      origin: form.origin,
      age: parseInt(form.age) || 0,
      phone: form.phone,
      address: form.address,
      email: form.email,
      sipp: form.sipp,
      signature: form.signature,
    };
    onSave(savedPsychologist, selectedUserId || undefined);
  };

  const err = (key: keyof FormData) => (touched[key] || submitted ? errors[key] : undefined);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
          aria-label="Kembali"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {initialPsychologist ? "Edit Profil Psikolog" : "Registrasi Psikolog Baru"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kolom bertanda <span className="text-red-500">*</span> wajib diisi.
          </p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-20"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Left column */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Data Pribadi */}
          <SectionCard title="Data Pribadi">
            {!initialPsychologist && users.length > 0 && (
              <div className="mb-4">
                <Field label="Pilih Akun Terdaftar (Promosi ke Psikolog)" id="select-user">
                  <select
                    id="select-user"
                    value={selectedUserId}
                    onChange={(e) => handleSelectUser(e.target.value)}
                    className={`${inputCls} w-full`}
                  >
                    <option value="">-- Pilih Akun Terdaftar (Opsional) --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - Role: {u.role}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" id="name" required error={err("name")}>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => touch("name")}
                  placeholder="contoh: Dr. Abyansyah Dewanto, M.Psi."
                  className={err("name") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Asal / Kota" id="origin" required error={err("origin")}>
                <input
                  id="origin"
                  value={form.origin}
                  onChange={(e) => set("origin", e.target.value)}
                  onBlur={() => touch("origin")}
                  placeholder="contoh: Surabaya"
                  className={err("origin") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Umur" id="age" required error={err("age")}>
                <input
                  id="age"
                  type="number"
                  min={20}
                  max={100}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  onBlur={() => touch("age")}
                  placeholder="contoh: 35"
                  className={err("age") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Nomor Telepon" id="phone" required error={err("phone")}>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => touch("phone")}
                  placeholder="+62 812 0000 0000"
                  className={err("phone") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Alamat Email" id="email" required error={err("email")}>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => touch("email")}
                  placeholder="psikolog@asisya.com"
                  className={err("email") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Lisensi & Alamat */}
          <SectionCard title="SIPP & Alamat Kerja">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Nomor Lisensi SIPP" id="sipp" required error={err("sipp")}>
                  <input
                    id="sipp"
                    value={form.sipp}
                    onChange={(e) => set("sipp", e.target.value)}
                    onBlur={() => touch("sipp")}
                    placeholder="contoh: SIPP/09/2026/01-DT"
                    className={err("sipp") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Alamat Lengkap Kantor" id="address" required error={err("address")}>
                  <textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    onBlur={() => touch("address")}
                    placeholder="Jl. Raya No. 123, Ruko Grand City..."
                    rows={3}
                    className={
                      err("address")
                        ? `${inputErrCls} w-full resize-none`
                        : `${inputCls} w-full resize-none`
                    }
                  />
                </Field>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">
          {/* Tanda Tangan */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Tanda Tangan (TTD)</p>
            </div>
            <div className="p-5 flex flex-col gap-3 items-center">
              <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#01696f]/40 hover:bg-[#01696f]/[0.03] transition-all cursor-pointer overflow-hidden p-2"
              >
                {form.signature ? (
                  <img
                    src={form.signature}
                    alt="Tanda Tangan"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <PenTool size={18} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Unggah Gambar TTD
                    </span>
                  </div>
                )}
              </motion.div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSignatureUpload}
              />
              <p className="text-[11px] text-slate-400 text-center">
                PNG (Sangat disarankan transparent) · Maks. 2 MB
              </p>
            </div>
          </div>

          {/* Ringkasan & Submit */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Status Kelengkapan</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <ProgressBar value={completeness} />
              <div className="border-t border-slate-100" />
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={!isReadyToSubmit}
                  className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isReadyToSubmit
                      ? "bg-[#16254c] text-white hover:bg-[#0f1a38] active:bg-[#0a1128] shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={15} />
                  Simpan Profil
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
export default PsychologistForm;
