import { useState, useEffect, useRef } from "react"
import {
  Camera, CheckCircle2, Calendar as CalendarIcon,
  ChevronDown, Plus, Search, Filter,
  ArrowLeft, Building2, X, Pencil, Trash2, Lock,
  AlertCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Batch = { id: string; name: string; company: string; color: string }

type Patient = {
  id: string
  name: string
  email: string
  idNumber: string
  age: number
  gender: string   // "M" | "F" | "O"
  phone: string
  registeredAt: string
  hasPhoto: boolean
  initials: string
  batchId: string  // "" = no batch
}

type FormData = {
  fullName: string
  dateOfBirth: string
  gender: string   // "male" | "female" | "other" — internal form value
  occupation: string
  phone: string
  email: string
  country: string
  province: string
  city: string
  fullAddress: string
  photo: string | null
  batchId: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

// ─── Master Data ───────────────────────────────────────────────────────────────

const BATCHES: Batch[] = [
  { id: "B001", name: "Batch Mandiri Q1 2025",   company: "PT Bank Mandiri",     color: "#1e40af" },
  { id: "B002", name: "Batch Telkom April 2025",  company: "PT Telkom Indonesia", color: "#0f766e" },
  { id: "B003", name: "Batch BCA Mei 2025",       company: "PT Bank BCA",         color: "#6d28d9" },
  { id: "B004", name: "Batch Individual",         company: "—",                   color: "#475569" },
] as const

const INIT_PATIENTS: Patient[] = [
  { id: "1", name: "Eleanor James",  email: "eleanor.j@example.com",   idNumber: "PT-8842-A", age: 42, gender: "F", phone: "(555) 123-4567",     registeredAt: "2023-10-01", hasPhoto: false, initials: "EJ", batchId: "B001" },
  { id: "2", name: "Marcus Chen",    email: "m.chen99@example.com",    idNumber: "PT-9105-C", age: 58, gender: "M", phone: "(555) 987-6543",     registeredAt: "2023-08-20", hasPhoto: true,  initials: "MC", batchId: "B002" },
  { id: "3", name: "Sarah Lin",      email: "slin_design@example.com", idNumber: "PT-4421-B", age: 29, gender: "F", phone: "(555) 333-2211",     registeredAt: "2023-07-15", hasPhoto: true,  initials: "SL", batchId: "B001" },
  { id: "4", name: "Budi Santoso",   email: "budi.s@example.com",      idNumber: "PT-6631-D", age: 35, gender: "M", phone: "+62 812 0011 2233", registeredAt: "2024-01-02", hasPhoto: false, initials: "BS", batchId: "B003" },
  { id: "5", name: "Rina Kartika",   email: "rina.k@example.com",      idNumber: "PT-7720-E", age: 27, gender: "F", phone: "+62 811 9988 7766", registeredAt: "2024-03-10", hasPhoto: false, initials: "RK", batchId: "B004" },
]

const BATCH_MAP = Object.fromEntries(BATCHES.map(b => [b.id, b]))

// ─── Helpers ───────────────────────────────────────────────────────────────────

const calcAge = (dob: string) =>
  Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))

const formatDate = (dob: string) =>
  new Date(dob).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

const formatRegistered = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

/** Convert form gender value ("male"/"female"/"other") → stored code ("M"/"F"/"O") */
const toGenderCode = (v: string): string => {
  if (v === "female") return "F"
  if (v === "male")   return "M"
  return "O"
}

/** Generate PT-XXXX-X style ID */
const generateId = (): string => {
  const num  = String(Math.floor(1000 + Math.random() * 9000))
  const char = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  return `PT-${num}-${char}`
}

/** Get initials from full name (up to 2 chars) */
const getInitials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase()

// ─── Validation ────────────────────────────────────────────────────────────────

function validateField(key: keyof FormData, value: string): string {
  switch (key) {
    case "fullName": {
      if (!value.trim()) return "Nama lengkap wajib diisi."
      if (value.trim().length < 2) return "Nama minimal 2 karakter."
      if (value.trim().length > 100) return "Nama maksimal 100 karakter."
      if (!/^[\p{L}\s'.,-]+$/u.test(value.trim()))
        return "Nama hanya boleh berisi huruf, spasi, dan tanda baca dasar."
      return ""
    }
    case "dateOfBirth": {
      if (!value) return "Tanggal lahir wajib diisi."
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) return "Format tanggal tidak valid."
      if (parsed > new Date()) return "Tanggal lahir tidak boleh di masa depan."
      const age = calcAge(value)
      if (age < 1)   return "Usia pasien kurang dari 1 tahun."
      if (age > 120) return "Tanggal lahir tidak masuk akal (usia > 120 tahun)."
      return ""
    }
    case "gender": {
      if (!value) return "Jenis kelamin wajib dipilih."
      return ""
    }
    case "phone": {
      if (!value.trim()) return "Nomor telepon wajib diisi."
      const digits = value.replace(/\D/g, "")
      if (digits.length < 7)  return "Nomor telepon minimal 7 digit."
      if (digits.length > 15) return "Nomor telepon maksimal 15 digit."
      if (!/^[0-9+\-\s().]+$/.test(value.trim()))
        return "Nomor telepon hanya boleh berisi angka, +, -, spasi, dan tanda kurung."
      return ""
    }
    case "email": {
      if (!value.trim()) return "" // opsional
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return "Format email tidak valid. Contoh: nama@domain.com"
      if (value.length > 254) return "Email terlalu panjang."
      return ""
    }
    case "occupation": {
      if (value.trim().length > 100) return "Pekerjaan/instansi maksimal 100 karakter."
      return ""
    }
    case "province": {
      if (!value.trim()) return ""
      if (!/^[\p{L}\s'.,-]+$/u.test(value.trim()))
        return "Provinsi hanya boleh berisi huruf dan spasi."
      if (value.trim().length > 60) return "Nama provinsi terlalu panjang."
      return ""
    }
    case "city": {
      if (!value.trim()) return "Kota wajib diisi."
      if (!/^[\p{L}\s'.,-]+$/u.test(value.trim()))
        return "Nama kota hanya boleh berisi huruf dan spasi."
      if (value.trim().length > 60) return "Nama kota terlalu panjang."
      return ""
    }
    case "fullAddress": {
      if (!value.trim()) return "Alamat lengkap wajib diisi."
      if (value.trim().length < 10) return "Alamat terlalu singkat, minimal 10 karakter."
      if (value.trim().length > 300) return "Alamat maksimal 300 karakter."
      return ""
    }
    default:
      return ""
  }
}

function validateAll(form: FormData): FormErrors {
  const keys: (keyof FormData)[] = [
    "fullName", "dateOfBirth", "gender", "phone",
    "email", "occupation", "province", "city", "fullAddress",
  ]
  const errs: FormErrors = {}
  for (const k of keys) {
    const msg = validateField(k, form[k] as string)
    if (msg) errs[k] = msg
  }
  return errs
}

// ─── Avatar color — unique per name ───────────────────────────────────────────

const AVATAR_PALETTE = [
  "#01696f", "#1e40af", "#6d28d9", "#be185d",
  "#b45309", "#15803d", "#0369a1", "#9f1239",
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

// ─── Gender cell — plain text, no background pill ─────────────────────────────

function GenderText({ gender }: { gender: string }) {
  const isFemale = gender === "F"
  return (
    <span className={`text-xs font-semibold ${isFemale ? "text-pink-600" : "text-sky-600"}`}>
      {isFemale ? "P" : "L"}
    </span>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

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

const disabledCls =
  "px-3.5 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"

// ─── Section Card ──────────────────────────────────────────────────────────────

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

// ─── Batch Badge with tooltip ──────────────────────────────────────────────────

function BatchBadge({ batchId }: { batchId: string }) {
  const batch = BATCH_MAP[batchId]
  const [show, setShow] = useState(false)
  if (!batch) return null
  return (
    <span className="relative inline-flex">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold text-white whitespace-nowrap cursor-default"
        style={{ backgroundColor: batch.color }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {batch.id}
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none"
          >
            <div
              className="px-2.5 py-1.5 rounded-lg shadow-lg text-white text-[11px] font-medium whitespace-nowrap"
              style={{ backgroundColor: batch.color }}
            >
              <p className="font-semibold leading-snug">{batch.name}</p>
              <p className="opacity-80 text-[10px]">{batch.company}</p>
              {/* caret */}
              <span
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${batch.color}` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// ─── Table column header ───────────────────────────────────────────────────────

function TH({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-400 ${className}`}>
      {children}
    </th>
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate = false, onChange, label }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void; label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <label className="flex items-center cursor-pointer" aria-label={label}>
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange}
        className="w-4 h-4 rounded border-slate-300 accent-[#01696f] cursor-pointer" />
    </label>
  )
}

// ─── Progress Bar — semantic color ────────────────────────────────────────────

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

// ─── Delete Modal — Vercel-style ───────────────────────────────────────────────

type DeleteModalProps = {
  targets: Patient[]
  onConfirm: () => void
  onCancel: () => void
}

function DeleteModal({ targets, onConfirm, onCancel }: DeleteModalProps) {
  const [input, setInput] = useState("")
  const isSingle = targets.length === 1
  const phrase = isSingle ? targets[0].name : String(targets.length)
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
              Hapus {isSingle ? "Peserta" : `${targets.length} Peserta`}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {isSingle ? (
                <><span className="font-semibold text-slate-800">{targets[0].name}</span> akan dihapus secara permanen dari sistem. Data tidak dapat dipulihkan kembali.</>
              ) : (
                <><span className="font-semibold text-slate-800">{targets.length} peserta</span> yang dipilih akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="delete-confirm" className="text-sm text-slate-600">
              {isSingle ? (
                <>Ketik nama <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{phrase}</span> untuk melanjutkan</>
              ) : (
                <>Ketik angka <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">{phrase}</span> untuk melanjutkan</>
              )}
            </label>
            <input
              id="delete-confirm"
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && valid) onConfirm() }}
              placeholder={isSingle ? `Ketik nama pasien…` : `Ketik ${phrase}`}
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
            Hapus {isSingle ? "Peserta" : `${targets.length} Peserta`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Filter Panel ──────────────────────────────────────────────────────────────

type SortOption = "newest" | "oldest" | "name_az" | "name_za"
type FilterState = { sort: SortOption; batchId: string }

function FilterPanel({ filter, onChange, onClose }: {
  filter: FilterState
  onChange: (f: FilterState) => void
  onClose: () => void
}) {
  const upd = (k: keyof FilterState, v: string) => onChange({ ...filter, [k]: v })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-full mt-2 z-30 w-64 bg-white rounded-xl border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.12)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <span className="text-[12px] font-semibold text-slate-600">Filter &amp; Urutkan</span>
        <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <X size={13} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 px-1">Urutkan</span>
          <div className="grid grid-cols-2 gap-1">
            {([
              { val: "newest",  label: "Terbaru" },
              { val: "oldest",  label: "Terlama" },
              { val: "name_az", label: "Nama A–Z" },
              { val: "name_za", label: "Nama Z–A" },
            ] as { val: SortOption; label: string }[]).map(o => (
              <button key={o.val} onClick={() => upd("sort", o.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter.sort === o.val
                    ? "bg-[#01696f] text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 px-1">Batch</span>
          <div className="flex flex-col gap-0.5">
            <button onClick={() => upd("batchId", "")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                filter.batchId === "" ? "bg-[#01696f] text-white" : "text-slate-600 hover:bg-slate-50"
              }`}>
              Semua Batch
            </button>
            {BATCHES.map(b => (
              <button key={b.id} onClick={() => upd("batchId", b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition-all ${
                  filter.batchId === b.id ? "bg-[#01696f] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}>
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                <span className="flex-1 truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {(filter.sort !== "newest" || filter.batchId !== "") && (
          <button onClick={() => onChange({ sort: "newest", batchId: "" })}
            className="text-[11px] text-[#01696f] hover:text-[#0c4e54] font-semibold transition-all self-start px-1">
            ↺ Atur ulang filter
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Registration Form ─────────────────────────────────────────────────────────

function RegistrationForm({ onBack, onRegistered }: {
  onBack: () => void
  onRegistered: (p: Patient) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    fullName: "", dateOfBirth: "", gender: "",
    occupation: "", phone: "", email: "",
    country: "", province: "", city: "", fullAddress: "",
    photo: null, batchId: ""
  })
  // touched: tracks which fields the user has interacted with
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [completeness, setCompleteness] = useState(0)
  // submitted flag: show all errors on submit attempt
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    // validate on change once touched
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
    const req = ["fullName", "dateOfBirth", "gender", "phone", "city", "fullAddress"]
    const filled = req.filter(k => form[k as keyof FormData]).length
    setCompleteness(Math.round((filled / req.length) * 100))
  }, [form])

  const age = form.dateOfBirth ? calcAge(form.dateOfBirth) : null
  const allErrors = validateAll(form)
  const hasErrors = Object.values(allErrors).some(Boolean)
  const isReadyToSubmit = completeness === 100 && !hasErrors

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(prev => ({ ...prev, photo: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const selectedBatch = BATCHES.find(b => b.id === form.batchId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    // validate all fields
    const errs = validateAll(form)
    setErrors(errs)
    if (Object.values(errs).some(Boolean) || !isReadyToSubmit) return

    const newPatient: Patient = {
      id:           String(Date.now()),
      name:         form.fullName,
      email:        form.email,
      idNumber:     generateId(),
      age:          age ?? 0,
      gender:       toGenderCode(form.gender),
      phone:        form.phone,
      registeredAt: new Date().toISOString().slice(0, 10),
      hasPhoto:     !!form.photo,
      initials:     getInitials(form.fullName),
      batchId:      form.batchId,
    }
    onRegistered(newPatient)
  }

  // Helper: get error only if field is touched or form submitted
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
          <h1 className="text-xl font-semibold text-slate-900">Registrasi Pasien Baru</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kolom bertanda <span className="text-red-500">*</span> wajib diisi.</p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-20"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ── Left column ── */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* Data Pribadi */}
          <SectionCard title="Data Pribadi">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" id="fullName" required error={err("fullName")}>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={e => set("fullName", e.target.value)}
                  onBlur={() => touch("fullName")}
                  placeholder="contoh: Budi Santoso"
                  className={err("fullName") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Tanggal Lahir" id="dob" required error={err("dateOfBirth")}>
                <div className="relative">
                  <input
                    id="dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => set("dateOfBirth", e.target.value)}
                    onBlur={() => touch("dateOfBirth")}
                    max={new Date().toISOString().split("T")[0]}
                    className={`${err("dateOfBirth") ? inputErrCls : inputCls} w-full pr-10`}
                  />
                  <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Usia" hint="Otomatis">
                <div className="relative flex items-center">
                  <input
                    disabled
                    value={age !== null ? `${age} tahun${form.dateOfBirth ? "  ·  " + formatDate(form.dateOfBirth) : ""}` : ""}
                    placeholder="Terhitung dari tanggal lahir"
                    className={`${disabledCls} w-full pr-9`}
                  />
                  <Lock size={12} className="absolute right-3 text-slate-300 pointer-events-none" />
                </div>
              </Field>
              <Field label="Jenis Kelamin" id="gender" required error={err("gender")}>
                <div className="relative">
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={e => set("gender", e.target.value)}
                    onBlur={() => touch("gender")}
                    className={`${err("gender") ? inputErrCls : inputCls} w-full appearance-none pr-9`}
                  >
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="female">Perempuan</option>
                    <option value="male">Laki-laki</option>
                    <option value="other">Lainnya</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Pekerjaan / Instansi" id="occupation" error={err("occupation")}>
                <input
                  id="occupation"
                  value={form.occupation}
                  onChange={e => set("occupation", e.target.value)}
                  onBlur={() => touch("occupation")}
                  placeholder="Jabatan, nama instansi"
                  maxLength={100}
                  className={err("occupation") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Batch */}
          <SectionCard
            title="Batch / Grup"
            badge={
              selectedBatch ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                  style={{ backgroundColor: selectedBatch.color }}>
                  <Building2 size={10} />
                  {selectedBatch.id}
                </span>
              ) : undefined
            }
          >
            <Field label="Pilih Batch" id="batchId">
              <div className="relative">
                <select id="batchId" value={form.batchId} onChange={e => set("batchId", e.target.value)}
                  className={`${inputCls} w-full appearance-none pr-9`}>
                  <option value="">— Pilih batch (opsional) —</option>
                  {BATCHES.map(b => (
                    <option key={b.id} value={b.id}>{b.name} · {b.company}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <AnimatePresence>
              {selectedBatch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border mt-1"
                    style={{ backgroundColor: selectedBatch.color + "10", borderColor: selectedBatch.color + "30" }}>
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: selectedBatch.color }} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedBatch.name}</p>
                      <p className="text-xs text-slate-500">{selectedBatch.company}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Kontak */}
          <SectionCard title="Informasi Kontak">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nomor Telepon" id="phone" required error={err("phone")}>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  onBlur={() => touch("phone")}
                  placeholder="+62 812 0000 0000"
                  className={err("phone") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Alamat Email" id="email" error={err("email")}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  onBlur={() => touch("email")}
                  placeholder="pasien@example.com"
                  className={err("email") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Alamat */}
          <SectionCard title="Alamat">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Negara" id="country">
                <div className="relative">
                  <select id="country" value={form.country} onChange={e => set("country", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="">Pilih negara</option>
                    <option value="ID">Indonesia</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapura</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Provinsi" id="province" error={err("province")}>
                <input
                  id="province"
                  value={form.province}
                  onChange={e => set("province", e.target.value)}
                  onBlur={() => touch("province")}
                  placeholder="contoh: Jawa Timur"
                  className={err("province") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Kota" id="city" required error={err("city")}>
                <input
                  id="city"
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  onBlur={() => touch("city")}
                  placeholder="contoh: Surabaya"
                  className={err("city") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
            </div>
            <Field label="Alamat Lengkap" id="fullAddress" required error={err("fullAddress")}>
              <textarea
                id="fullAddress"
                value={form.fullAddress}
                onChange={e => set("fullAddress", e.target.value)}
                onBlur={() => touch("fullAddress")}
                placeholder="Jl. Raya No. 123, Kec. …"
                rows={3}
                maxLength={300}
                className={`${err("fullAddress") ? inputErrCls : inputCls} w-full resize-none`}
              />
              <span className="text-[11px] text-slate-400 self-end">
                {form.fullAddress.length}/300
              </span>
            </Field>
          </SectionCard>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">

          {/* Photo upload */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Foto Pasien</p>
            </div>
            <div className="p-5 flex flex-col gap-3 items-center">
              <motion.div
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                onClick={() => fileRef.current?.click()}
                className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#01696f]/40 hover:bg-[#01696f]/[0.03] transition-all cursor-pointer overflow-hidden"
              >
                {form.photo ? (
                  <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Camera size={18} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Unggah Foto</span>
                  </div>
                )}
              </motion.div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <p className="text-[11px] text-slate-400 text-center">JPG, PNG · Maks. 5 MB<br />Opsional — untuk identifikasi internal</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Ringkasan</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-slate-500">Status</span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Draft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-slate-500">Tanggal</span>
                  <span className="text-[13px] font-medium text-slate-700">
                    {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                {selectedBatch && (
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-500">Batch</span>
                    <span className="text-xs font-semibold text-white px-2 py-0.5 rounded"
                      style={{ backgroundColor: selectedBatch.color }}>
                      {selectedBatch.id}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100" />
              <ProgressBar value={completeness} />

              {/* Error summary — shown only after submit attempt */}
              <AnimatePresence>
                {submitted && Object.values(errors).some(Boolean) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                      <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-600 font-medium leading-relaxed">
                        Terdapat {Object.values(errors).filter(Boolean).length} field yang perlu diperbaiki sebelum menyimpan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={!isReadyToSubmit}
              title={!isReadyToSubmit ? "Lengkapi semua kolom wajib terlebih dahulu" : undefined}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                isReadyToSubmit
                  ? "bg-[#16254c] text-white hover:bg-[#0f1a38] active:bg-[#0a1128] shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 size={15} />
              Selesaikan Registrasi
            </button>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all"
            >
              Simpan sebagai Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Root Export ───────────────────────────────────────────────────────────────

export function PatientRegistration() {
  const [view, setView] = useState<"list" | "form">("list")
  const [patients, setPatients] = useState<Patient[]>(INIT_PATIENTS)

  const handleRegistered = (p: Patient) => {
    setPatients(prev => [p, ...prev])
    setView("list")
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PatientDirectoryConnected
              patients={patients}
              setPatients={setPatients}
              onNew={() => setView("form")}
            />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <RegistrationForm onBack={() => setView("list")} onRegistered={handleRegistered} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PatientDirectoryConnected — receives shared state from root ───────────────

function PatientDirectoryConnected({
  patients, setPatients, onNew,
}: {
  patients: Patient[]
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  onNew: () => void
}) {
  const [search, setSearch]         = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter]         = useState<FilterState>({ sort: "newest", batchId: "" })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<Patient[] | null>(null)

  const activeFilters = (filter.sort !== "newest" ? 1 : 0) + (filter.batchId !== "" ? 1 : 0)

  const processed = patients
    .filter(p => {
      const q = search.toLowerCase()
      return (
        (p.name.toLowerCase().includes(q) || p.idNumber.toLowerCase().includes(q) || p.phone.includes(q)) &&
        (filter.batchId === "" || p.batchId === filter.batchId)
      )
    })
    .sort((a, b) => {
      if (filter.sort === "newest")  return +new Date(b.registeredAt) - +new Date(a.registeredAt)
      if (filter.sort === "oldest")  return +new Date(a.registeredAt) - +new Date(b.registeredAt)
      if (filter.sort === "name_az") return a.name.localeCompare(b.name)
      return b.name.localeCompare(a.name)
    })

  const processedIds = processed.map(p => p.id)
  const selectedInView = processedIds.filter(id => selectedIds.has(id))
  const allSelected = processedIds.length > 0 && selectedInView.length === processedIds.length
  const someSelected = selectedInView.length > 0 && !allSelected

  const toggleOne = (id: string) =>
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleAll = () => {
    if (allSelected) setSelectedIds(prev => { const s = new Set(prev); processedIds.forEach(id => s.delete(id)); return s })
    else setSelectedIds(prev => new Set([...prev, ...processedIds]))
  }

  const openDelete = (ids: string[]) =>
    setDeleteTargets(patients.filter(p => ids.includes(p.id)))

  const confirmDelete = () => {
    if (!deleteTargets) return
    const ids = deleteTargets.map(p => p.id)
    setPatients(prev => prev.filter(p => !ids.includes(p.id)))
    setSelectedIds(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s })
    setDeleteTargets(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Direktori Pasien</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients.length} peserta terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                showFilter || activeFilters > 0
                  ? "border-[#01696f]/40 bg-[#01696f]/[0.08] text-[#01696f]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#01696f]/25 hover:bg-[#01696f]/[0.04]"
              }`}
            >
              <Filter size={14} />
              Filter
              {activeFilters > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-[#01696f] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showFilter && (
                <FilterPanel filter={filter} onChange={setFilter} onClose={() => setShowFilter(false)} />
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:bg-[#0a1128] transition-all shadow-sm"
          >
            <Plus size={14} />
            Pasien Baru
          </button>
        </div>
      </div>

      <AnimatePresence>
        {filter.batchId !== "" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Menampilkan:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white"
              style={{ backgroundColor: BATCH_MAP[filter.batchId]?.color }}>
              {BATCH_MAP[filter.batchId]?.name}
              <button onClick={() => setFilter(f => ({ ...f, batchId: "" }))} className="opacity-70 hover:opacity-100 ml-0.5">
                <X size={11} />
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInView.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-slate-200 shadow-sm"
          >
            <span className="text-sm text-slate-700">
              <span className="font-semibold">{selectedInView.length}</span> peserta dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                Batalkan
              </button>
              <button
                onClick={() => openDelete(selectedInView)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 bg-white text-red-600 text-xs font-medium hover:bg-red-50 hover:border-red-300 active:bg-red-100 transition-all"
              >
                <Trash2 size={13} />
                Hapus {selectedInView.length} Peserta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, nomor ID, atau telepon…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/50 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <th className="pl-4 pr-2 py-3 w-10">
                <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} label="Pilih semua" />
              </th>
              <TH>Pasien</TH>
              <TH>No. ID</TH>
              <TH>Batch</TH>
              <TH>Usia</TH>
              <TH>Kelamin</TH>
              <TH>Telepon</TH>
              <TH>Terdaftar</TH>
              <TH className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processed.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center">
                  <Search size={28} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Tidak ada data yang sesuai</p>
                  <p className="text-xs text-slate-300 mt-1">Coba ubah kata kunci atau filter</p>
                </td>
              </tr>
            ) : processed.map(p => {
              const isSelected = selectedIds.has(p.id)
              const bgColor = avatarColor(p.name)
              return (
                <tr key={p.id} className={`transition-colors ${
                  isSelected ? "bg-[#01696f]/[0.03]" : "hover:bg-slate-50/60"
                }`}>
                  <td className="pl-4 pr-2 py-3.5 w-10">
                    <Checkbox checked={isSelected} onChange={() => toggleOne(p.id)} label={`Pilih ${p.name}`} />
                  </td>

                  {/* Pasien */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: bgColor }}
                      >
                        {p.initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 leading-snug">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* No. ID */}
                  <td className="px-3 py-3.5">
                    <span className="font-mono text-xs text-slate-500">{p.idNumber}</span>
                  </td>

                  {/* Batch */}
                  <td className="px-3 py-3.5">
                    <BatchBadge batchId={p.batchId} />
                  </td>

                  {/* Usia */}
                  <td className="px-3 py-3.5 tabular-nums text-xs text-slate-600">
                    {p.age} th
                  </td>

                  {/* Kelamin — plain text, no background */}
                  <td className="px-3 py-3.5">
                    <GenderText gender={p.gender} />
                  </td>

                  {/* Telepon */}
                  <td className="px-3 py-3.5 text-xs text-slate-600 tabular-nums">{p.phone}</td>

                  {/* Terdaftar */}
                  <td className="px-3 py-3.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {formatRegistered(p.registeredAt)}
                  </td>

                  {/* Aksi */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        title="Edit peserta"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 active:bg-slate-300 transition-all"
                        onClick={() => { /* TODO: open edit form */ }}
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        title="Hapus peserta"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
                        onClick={() => openDelete([p.id])}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs text-slate-400">
            Menampilkan <span className="font-medium text-slate-600">{processed.length}</span> dari <span className="font-medium text-slate-600">{patients.length}</span> peserta
          </p>
        </div>
      </div>

      <AnimatePresence>
        {deleteTargets !== null && (
          <DeleteModal
            targets={deleteTargets}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTargets(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
