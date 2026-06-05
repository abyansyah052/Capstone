import { useState, useEffect, useRef } from "react"
import {
  Camera, CheckCircle2, ChevronDown, Plus, Search, Filter,
  ArrowLeft, Building2, X, Pencil, Trash2, Lock,
  AlertCircle, ShieldCheck, Award, PenTool
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Psychologist = {
  id: string
  name: string
  origin: string
  age: number
  phone: string
  address: string
  email: string
  sipp: string
  signature: string | null // base64 data URL
}

type FormData = {
  name: string
  origin: string
  age: string
  phone: string
  address: string
  email: string
  sipp: string
  signature: string | null
}

type FormErrors = Partial<Record<keyof FormData, string>>

// ─── Master Data ───────────────────────────────────────────────────────────────

export const INIT_PSYCHOLOGISTS: Psychologist[] = [
  {
    id: "psy-1",
    name: "Dairy Team",
    origin: "Surabaya",
    age: 28,
    phone: "+62 812 3456 7890",
    address: "Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya",
    email: "Dairyteam@Gmail.com",
    sipp: "SIPP/09/2026/01-DT",
    signature: null,
  },
  {
    id: "psy-2",
    name: "Dr. Sarah Wijaya, M.Psi.",
    origin: "Jakarta",
    age: 35,
    phone: "+62 811 9988 7766",
    address: "Sudirman Central Business District Jakarta",
    email: "sarah.w@asisya.com",
    sipp: "SIPP/12/2024/02-SW",
    signature: null,
  }
]

// ─── Validation ────────────────────────────────────────────────────────────────

function validateField(key: keyof FormData, value: string): string {
  switch (key) {
    case "name": {
      if (!value.trim()) return "Nama lengkap wajib diisi."
      if (value.trim().length < 2) return "Nama minimal 2 karakter."
      if (value.trim().length > 100) return "Nama maksimal 100 karakter."
      return ""
    }
    case "origin": {
      if (!value.trim()) return "Asal kota wajib diisi."
      return ""
    }
    case "age": {
      if (!value) return "Umur wajib diisi."
      const parsed = parseInt(value)
      if (isNaN(parsed) || parsed < 20 || parsed > 100) return "Umur harus di antara 20 - 100 tahun."
      return ""
    }
    case "phone": {
      if (!value.trim()) return "Nomor telepon wajib diisi."
      return ""
    }
    case "email": {
      if (!value.trim()) return "Email wajib diisi."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return "Format email tidak valid."
      return ""
    }
    case "sipp": {
      if (!value.trim()) return "Nomor SIPP wajib diisi."
      return ""
    }
    case "address": {
      if (!value.trim()) return "Alamat lengkap wajib diisi."
      return ""
    }
    default:
      return ""
  }
}

function validateAll(form: FormData): FormErrors {
  const keys: (keyof FormData)[] = [
    "name", "origin", "age", "phone", "email", "sipp", "address"
  ]
  const errs: FormErrors = {}
  for (const k of keys) {
    const msg = validateField(k, form[k] as string)
    if (msg) errs[k] = msg
  }
  return errs
}

// ─── Avatar color ──────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "#01696f", "#1e40af", "#6d28d9", "#be185d",
  "#b45309", "#15803d", "#0369a1", "#9f1239",
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

// ─── Helper Atoms ─────────────────────────────────────────────────────────────

function Field({ label, id, required, hint, error, children }: {
  label: string; id?: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
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
  )
}

const inputCls =
  "px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/60 " +
  "focus:ring-2 focus:ring-[#01696f]/10 transition-all"

const inputErrCls =
  "px-3.5 py-2.5 rounded-lg border border-red-300 bg-red-50/30 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-red-400 " +
  "focus:ring-2 focus:ring-red-100 transition-all"

function SectionCard({ title, badge, children }: {
  title: string; badge?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[13px] font-semibold text-slate-700">{title}</p>
        {badge}
      </div>
      <div className="p-5 flex flex-col gap-5">
        {children}
      </div>
    </div>
  )
}

function TH({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-400 ${className}`}>
      {children}
    </th>
  )
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "#15803d" :
    value >= 40 ? "#b45309" :
    "#e11d48"

  const label =
    value >= 80 ? "Hampir selesai" :
    value >= 40 ? "Sebagian terisi" :
    "Perlu dilengkapi"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px] text-slate-500">Kelengkapan</span>
        <span className="text-[12px] font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px]" style={{ color }}>{label}</p>
    </div>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

type DeleteModalProps = {
  target: Psychologist
  onConfirm: () => void
  onCancel: () => void
}

function DeleteModal({ target, onConfirm, onCancel }: DeleteModalProps) {
  const [input, setInput] = useState("")
  const phrase = target.name
  const valid = input.trim() === phrase

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 id="delete-title" className="text-[15px] font-semibold text-slate-900">
              Hapus Psikolog
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-800">{target.name}</span> akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="delete-confirm" className="text-sm text-slate-600">
              Ketik nama psikolog <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{phrase}</span> untuk melanjutkan
            </label>
            <input
              id="delete-confirm"
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && valid) onConfirm() }}
              placeholder="Ketik nama psikolog…"
              spellCheck={false}
              autoComplete="off"
              className={`px-3.5 py-2.5 rounded-lg border text-sm font-mono transition-all outline-none ${
                input.length > 0 && !valid
                  ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : valid
                  ? "border-green-400 bg-green-50/40 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  : "border-slate-200 bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              }`}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:bg-slate-100 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!valid}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              valid
                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Trash2 size={14} />
            Hapus Psikolog
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Registration/Editing Form ────────────────────────────────────────────────

function PsychologistForm({
  initialPsychologist,
  onBack,
  onSave,
}: {
  initialPsychologist?: Psychologist | null
  onBack: () => void
  onSave: (p: Psychologist) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState<FormData>({
    name: initialPsychologist?.name ?? "",
    origin: initialPsychologist?.origin ?? "",
    age: initialPsychologist?.age ? String(initialPsychologist.age) : "",
    phone: initialPsychologist?.phone ?? "",
    address: initialPsychologist?.address ?? "",
    email: initialPsychologist?.email ?? "",
    sipp: initialPsychologist?.sipp ?? "",
    signature: initialPsychologist?.signature ?? null,
  })

  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [completeness, setCompleteness] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (touched[key] || submitted) {
      const msg = validateField(key, val)
      setErrors(prev => ({ ...prev, [key]: msg }))
    }
  }

  const touch = (key: keyof FormData) => {
    if (touched[key]) return
    setTouched(prev => ({ ...prev, [key]: true }))
    const msg = validateField(key, form[key] as string)
    setErrors(prev => ({ ...prev, [key]: msg }))
  }

  useEffect(() => {
    const req = ["name", "origin", "age", "phone", "email", "sipp", "address"]
    const filled = req.filter(k => form[k as keyof FormData]).length
    setCompleteness(Math.round((filled / req.length) * 100))
  }, [form])

  const allErrors = validateAll(form)
  const hasErrors = Object.values(allErrors).some(Boolean)
  const isReadyToSubmit = completeness === 100 && !hasErrors

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(prev => ({ ...prev, signature: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateAll(form)
    setErrors(errs)
    if (Object.values(errs).some(Boolean) || !isReadyToSubmit) return

    const savedPsychologist: Psychologist = {
      id:        initialPsychologist?.id ?? `psy-${Date.now()}`,
      name:      form.name,
      origin:    form.origin,
      age:       parseInt(form.age) || 0,
      phone:     form.phone,
      address:   form.address,
      email:     form.email,
      sipp:      form.sipp,
      signature: form.signature,
    }
    onSave(savedPsychologist)
  }

  const err = (key: keyof FormData) =>
    (touched[key] || submitted) ? errors[key] : undefined

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
          <p className="text-sm text-slate-500 mt-0.5">Kolom bertanda <span className="text-red-500">*</span> wajib diisi.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" id="name" required error={err("name")}>
                <input
                  id="name"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  onBlur={() => touch("name")}
                  placeholder="contoh: Dr. Abyansyah Dewanto, M.Psi."
                  className={err("name") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Asal / Kota" id="origin" required error={err("origin")}>
                <input
                  id="origin"
                  value={form.origin}
                  onChange={e => set("origin", e.target.value)}
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
                  onChange={e => set("age", e.target.value)}
                  onBlur={() => touch("age")}
                  placeholder="contoh: 35"
                  className={err("age") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Nomor Telepon" id="phone" required error={err("phone")}>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
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
                  onChange={e => set("email", e.target.value)}
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
                    onChange={e => set("sipp", e.target.value)}
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
                    onChange={e => set("address", e.target.value)}
                    onBlur={() => touch("address")}
                    placeholder="Jl. Raya No. 123, Ruko Grand City..."
                    rows={3}
                    className={err("address") ? `${inputErrCls} w-full resize-none` : `${inputCls} w-full resize-none`}
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
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#01696f]/40 hover:bg-[#01696f]/[0.03] transition-all cursor-pointer overflow-hidden p-2"
              >
                {form.signature ? (
                  <img src={form.signature} alt="Tanda Tangan" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <PenTool size={18} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Unggah Gambar TTD</span>
                  </div>
                )}
              </motion.div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
              <p className="text-[11px] text-slate-400 text-center">PNG (Sangat disarankan transparent) · Maks. 2 MB</p>
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
  )
}

// ─── Directory Connected View ─────────────────────────────────────────────────

function PsychologistDirectory({
  psychologists,
  onNew,
  onEdit,
  onDelete,
}: {
  psychologists: Psychologist[]
  onNew: () => void
  onEdit: (p: Psychologist) => void
  onDelete: (p: Psychologist) => void
}) {
  const [search, setSearch] = useState("")

  const processed = psychologists.filter(p => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.sipp.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Database Psikolog</h1>
          <p className="text-sm text-slate-500 mt-0.5">{psychologists.length} psikolog terdaftar</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:bg-[#0a1128] transition-all shadow-sm"
        >
          <Plus size={14} />
          Psikolog Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, No. SIPP, asal kota…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/50 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <TH className="pl-5">Psikolog</TH>
              <TH>No. SIPP</TH>
              <TH>Asal / Kota</TH>
              <TH>Umur</TH>
              <TH>Kontak &amp; Email</TH>
              <TH>Tanda Tangan</TH>
              <TH className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Search size={28} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Tidak ada data yang sesuai</p>
                </td>
              </tr>
            ) : processed.map(p => {
              const bgColor = avatarColor(p.name)
              return (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Profil */}
                  <td className="pl-5 pr-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: bgColor }}
                      >
                        {p.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 leading-snug">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{p.address}</p>
                      </div>
                    </div>
                  </td>

                  {/* SIPP */}
                  <td className="px-3 py-3.5">
                    <span className="font-mono text-xs text-[#01696f] font-semibold bg-[#01696f]/[0.06] px-2 py-0.5 rounded">
                      {p.sipp}
                    </span>
                  </td>

                  {/* Asal */}
                  <td className="px-3 py-3.5 text-xs text-slate-700 font-medium">
                    {p.origin}
                  </td>

                  {/* Usia */}
                  <td className="px-3 py-3.5 text-xs text-slate-600 tabular-nums">
                    {p.age} th
                  </td>

                  {/* Kontak */}
                  <td className="px-3 py-3.5">
                    <p className="text-xs text-slate-700 font-medium tabular-nums">{p.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.email}</p>
                  </td>

                  {/* TTD */}
                  <td className="px-3 py-3.5">
                    {p.signature ? (
                      <div className="h-8 w-20 border border-slate-100 rounded-md bg-white p-0.5 overflow-hidden flex items-center justify-center">
                        <img src={p.signature} alt="TTD" className="h-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 italic">Belum diunggah</span>
                    )}
                  </td>

                  {/* Aksi */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        title="Edit psikolog"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                        onClick={() => onEdit(p)}
                      >
                        <Pencil size={11} />
                        Edit
                      </button>
                      <button
                        title="Hapus"
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Root Component ─────────────────────────────────────────────────────

export function PsychologistDatabase({
  psychologists,
  onPsychologistsChange,
}: {
  psychologists: Psychologist[]
  onPsychologistsChange: React.Dispatch<React.SetStateAction<Psychologist[]>>
}) {
  const [view, setView] = useState<"list" | "form">("list")
  const [editTarget, setEditTarget] = useState<Psychologist | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Psychologist | null>(null)

  const handleSave = (saved: Psychologist) => {
    onPsychologistsChange(prev => {
      const exists = prev.some(p => p.id === saved.id)
      if (exists) {
        return prev.map(p => p.id === saved.id ? saved : p)
      } else {
        return [saved, ...prev]
      }
    })
    setView("list")
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    onPsychologistsChange(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PsychologistDirectory
              psychologists={psychologists}
              onNew={() => { setEditTarget(null); setView("form") }}
              onEdit={(p) => { setEditTarget(p); setView("form") }}
              onDelete={setDeleteTarget}
            />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PsychologistForm
              initialPsychologist={editTarget}
              onBack={() => { setEditTarget(null); setView("list") }}
              onSave={handleSave}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            target={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
