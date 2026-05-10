import { useState, useEffect, useRef } from "react"
import {
  Camera, CheckCircle2, Calendar as CalendarIcon,
  ChevronDown, Plus, Search, MoreVertical, Filter,
  ArrowLeft, Building2, X
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Batch = { id: string; name: string; company: string; color: string }

type Patient = {
  id: string
  name: string
  email: string
  idNumber: string
  age: number
  gender: string
  phone: string
  lastVisit: string
  registeredAt: string   // ISO date string for sorting
  hasPhoto: boolean
  initials: string
  batchId: string
}

type FormData = {
  fullName: string
  dateOfBirth: string
  gender: string
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const BATCHES: Batch[] = [
  { id: "B001", name: "Batch Mandiri Q1 2025",   company: "PT Bank Mandiri",    color: "#1a3a6b" },
  { id: "B002", name: "Batch Telkom April 2025",  company: "PT Telkom Indonesia", color: "#0f766e" },
  { id: "B003", name: "Batch BCA Mei 2025",       company: "PT Bank BCA",        color: "#7c3aed" },
  { id: "B004", name: "Batch Individual",         company: "—",                  color: "#64748b" },
]

const MOCK_PATIENTS: Patient[] = [
  { id: "1", name: "Eleanor James",  email: "eleanor.j@example.com",  idNumber: "PT-8842-A", age: 42, gender: "F", phone: "(555) 123-4567", lastVisit: "Oct 12, 2023", registeredAt: "2023-10-01", hasPhoto: false, initials: "EJ", batchId: "B001" },
  { id: "2", name: "Marcus Chen",    email: "m.chen99@example.com",   idNumber: "PT-9105-C", age: 58, gender: "M", phone: "(555) 987-6543", lastVisit: "Sep 04, 2023", registeredAt: "2023-08-20", hasPhoto: true,  initials: "MC", batchId: "B002" },
  { id: "3", name: "Sarah Lin",      email: "slin_design@example.com",idNumber: "PT-4421-B", age: 29, gender: "F", phone: "(555) 333-2211", lastVisit: "Aug 19, 2023", registeredAt: "2023-07-15", hasPhoto: true,  initials: "SL", batchId: "B001" },
  { id: "4", name: "Budi Santoso",   email: "budi.s@example.com",     idNumber: "PT-6631-D", age: 35, gender: "M", phone: "+62 812 0011 2233", lastVisit: "Jan 05, 2024", registeredAt: "2024-01-02", hasPhoto: false, initials: "BS", batchId: "B003" },
  { id: "5", name: "Rina Kartika",   email: "rina.k@example.com",     idNumber: "PT-7720-E", age: 27, gender: "F", phone: "+62 811 9988 7766", lastVisit: "Mar 22, 2024", registeredAt: "2024-03-10", hasPhoto: false, initials: "RK", batchId: "B004" },
]

const BATCH_COLORS: Record<string, string> = Object.fromEntries(BATCHES.map(b => [b.id, b.color]))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcAge = (dob: string) => {
  if (!dob) return 0
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

const formatDate = (dob: string) => {
  if (!dob) return ""
  return new Date(dob).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Shared field wrapper ─────────────────────────────────────────────────────

function Field({ label, id, required, children }: {
  label: string; id?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
const disabledCls = "px-3.5 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 italic cursor-not-allowed"

// ─── Batch Badge ──────────────────────────────────────────────────────────────

function BatchBadge({ batchId }: { batchId: string }) {
  const batch = BATCHES.find(b => b.id === batchId)
  if (!batch) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap"
      style={{ backgroundColor: batch.color }}
    >
      <Building2 size={9} />
      {batch.id}
    </span>
  )
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

type SortOption = "newest" | "oldest" | "name_az" | "name_za"
type FilterState = { sort: SortOption; batchId: string }

function FilterPanel({
  filter, onChange, onClose
}: {
  filter: FilterState
  onChange: (f: FilterState) => void
  onClose: () => void
}) {
  const update = (key: keyof FilterState, val: string) =>
    onChange({ ...filter, [key]: val })

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 z-30 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Filter & Urutkan</span>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <X size={14} />
        </button>
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urutkan</span>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { val: "newest",  label: "Terbaru" },
            { val: "oldest",  label: "Terlama" },
            { val: "name_az", label: "Nama A–Z" },
            { val: "name_za", label: "Nama Z–A" },
          ] as { val: SortOption; label: string }[]).map(opt => (
            <button
              key={opt.val}
              onClick={() => update("sort", opt.val)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter.sort === opt.val
                  ? "bg-[#1a3a6b] text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Batch / Perusahaan</span>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => update("batchId", "")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
              filter.batchId === "" ? "bg-[#1a3a6b] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Semua Batch
          </button>
          {BATCHES.map(b => (
            <button
              key={b.id}
              onClick={() => update("batchId", b.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all flex items-center justify-between ${
                filter.batchId === b.id ? "text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
              style={filter.batchId === b.id ? { backgroundColor: b.color } : {}}
            >
              <span>{b.name}</span>
              <span className={`text-[10px] ${
                filter.batchId === b.id ? "text-white/70" : "text-slate-400"
              }`}>{b.company}</span>
            </button>
          ))}
        </div>
      </div>

      {(filter.sort !== "newest" || filter.batchId !== "") && (
        <button
          onClick={() => onChange({ sort: "newest", batchId: "" })}
          className="text-xs text-slate-400 hover:text-[#1a3a6b] font-semibold transition-all self-start"
        >
          Atur ulang filter
        </button>
      )}
    </motion.div>
  )
}

// ─── Patient Directory ────────────────────────────────────────────────────────

function PatientDirectory({ onNew }: { onNew: () => void }) {
  const [search, setSearch]         = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter]         = useState<FilterState>({ sort: "newest", batchId: "" })

  const activeFilters = (filter.sort !== "newest" ? 1 : 0) + (filter.batchId !== "" ? 1 : 0)

  const processed = MOCK_PATIENTS
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.idNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search)
      const matchBatch = filter.batchId === "" || p.batchId === filter.batchId
      return matchSearch && matchBatch
    })
    .sort((a, b) => {
      if (filter.sort === "newest")  return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
      if (filter.sort === "oldest")  return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
      if (filter.sort === "name_az") return a.name.localeCompare(b.name)
      if (filter.sort === "name_za") return b.name.localeCompare(a.name)
      return 0
    })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Direktori Pasien</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola dan lihat data pasien yang terdaftar.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                activeFilters > 0
                  ? "border-[#1a3a6b] bg-[#1a3a6b]/5 text-[#1a3a6b]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter size={15} />
              Filter
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1a3a6b] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showFilter && (
                <FilterPanel
                  filter={filter}
                  onChange={setFilter}
                  onClose={() => setShowFilter(false)}
                />
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-semibold hover:bg-[#1a3a6b]/90 transition-all shadow-md shadow-[#1a3a6b]/20"
          >
            <Plus size={15} />
            Pasien Baru
          </button>
        </div>
      </div>

      {/* Active filter pill */}
      <AnimatePresence>
        {filter.batchId !== "" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-slate-500">Menampilkan:</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: BATCH_COLORS[filter.batchId] }}
            >
              <Building2 size={11} />
              {BATCHES.find(b => b.id === filter.batchId)?.name}
              <button onClick={() => setFilter(f => ({ ...f, batchId: "" }))} className="ml-0.5 opacity-70 hover:opacity-100">
                <X size={11} />
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari pasien berdasarkan nama, ID, atau telepon..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#1a3a6b]/50 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Detail Pasien", "Nomor ID", "Batch", "Usia/Jenis Kelamin", "Kontak", "Kunjungan Terakhir", "Aksi"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                  Tidak ada pasien yang sesuai filter.
                </td>
              </tr>
            ) : processed.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-[#1a3a6b]">
                      {p.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-slate-600 text-xs">{p.idNumber}</td>
                <td className="px-4 py-4"><BatchBadge batchId={p.batchId} /></td>
                <td className="px-4 py-4 text-slate-600">{p.age} • {p.gender}</td>
                <td className="px-4 py-4 text-slate-600">{p.phone}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-slate-600">{p.lastVisit}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">Menampilkan {processed.length} dari {MOCK_PATIENTS.length} data</p>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all text-xs">‹</button>
            {[1, 2, 3].map(n => (
              <button key={n} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${n === 1 ? "bg-[#1a3a6b] text-white" : "text-slate-500 hover:bg-slate-200"}`}>{n}</button>
            ))}
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all text-xs">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Registration Form ────────────────────────────────────────────────────────

function RegistrationForm({ onBack }: { onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    fullName: "", dateOfBirth: "", gender: "",
    occupation: "", phone: "", email: "",
    country: "", province: "", city: "", fullAddress: "",
    photo: null, batchId: ""
  })
  const [completeness, setCompleteness] = useState(0)

  const set = (key: keyof FormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    const required = ["fullName", "dateOfBirth", "gender", "phone", "city", "fullAddress"]
    const filled = required.filter(k => form[k as keyof FormData]).length
    setCompleteness(Math.round((filled / required.length) * 100))
  }, [form])

  const age = form.dateOfBirth ? calcAge(form.dateOfBirth) : null

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set("photo", ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const selectedBatch = BATCHES.find(b => b.id === form.batchId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registrasi Pasien Baru</h1>
          <p className="text-sm text-slate-500 mt-0.5">Isi data pasien. Kolom bertanda * wajib diisi.</p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20" onSubmit={e => e.preventDefault()}>
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Personal Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Data Pribadi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nama Lengkap" id="fullName" required>
                <input id="fullName" value={form.fullName} onChange={e => set("fullName", e.target.value)}
                  placeholder="contoh: Budi Santoso" className={inputCls} />
              </Field>

              <Field label="Tanggal Lahir" id="dob" required>
                <div className="relative">
                  <input id="dob" type="date" value={form.dateOfBirth}
                    onChange={e => set("dateOfBirth", e.target.value)}
                    className={`${inputCls} w-full pr-10`} />
                  <CalendarIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Usia">
                <div className="flex items-center gap-2">
                  <input disabled value={age !== null ? `${age} tahun` : ""} placeholder="Terhitung otomatis"
                    className={`${disabledCls} flex-1`} />
                  {age !== null && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(form.dateOfBirth)}</span>
                  )}
                </div>
              </Field>

              <Field label="Jenis Kelamin" id="gender" required>
                <div className="relative">
                  <select id="gender" value={form.gender} onChange={e => set("gender", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="female">Perempuan</option>
                    <option value="male">Laki-laki</option>
                    <option value="other">Lainnya</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Pekerjaan / Instansi" id="occupation">
                <input id="occupation" value={form.occupation} onChange={e => set("occupation", e.target.value)}
                  placeholder="Jabatan, Nama instansi" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Batch */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Batch / Grup</h3>
              {selectedBatch && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: selectedBatch.color }}
                >
                  <Building2 size={10} />
                  {selectedBatch.id} — {selectedBatch.company}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-5">
              <Field label="Batch" id="batchId">
                <div className="relative">
                  <select id="batchId" value={form.batchId} onChange={e => set("batchId", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="">— Pilih batch (opsional) —</option>
                    {BATCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.company})</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              {selectedBatch && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Building2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: selectedBatch.color }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{selectedBatch.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Perusahaan: {selectedBatch.company}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Informasi Kontak</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nomor Telepon" id="phone" required>
                <input id="phone" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+62 812 0000 0000" className={inputCls} />
              </Field>
              <Field label="Alamat Email" id="email">
                <input id="email" type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="pasien@example.com" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Alamat</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Negara" id="country">
                <div className="relative">
                  <select id="country" value={form.country} onChange={e => set("country", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="">Pilih negara</option>
                    <option value="ID">Indonesia</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Provinsi" id="province">
                <input id="province" value={form.province} onChange={e => set("province", e.target.value)}
                  placeholder="contoh: Jawa Timur" className={inputCls} />
              </Field>
              <Field label="Kota" id="city" required>
                <input id="city" value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="contoh: Surabaya" className={inputCls} />
              </Field>
            </div>
            <Field label="Alamat Lengkap" id="fullAddress" required>
              <textarea id="fullAddress" value={form.fullAddress} onChange={e => set("fullAddress", e.target.value)}
                placeholder="Jl. Raya No. 123, Kec. ..." rows={3}
                className={`${inputCls} resize-none`} />
            </Field>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">

          {/* Photo Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Foto Pasien</h3>
              <p className="text-xs text-slate-400 mt-0.5">Opsional. Hanya untuk identifikasi internal.</p>
            </div>
            <div className="flex justify-center py-2">
              <motion.div
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => fileRef.current?.click()}
                className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#1a3a6b]/40 hover:bg-slate-100/50 transition-all cursor-pointer overflow-hidden"
              >
                {form.photo ? (
                  <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <Camera size={20} className="text-[#1a3a6b]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Unggah Foto</span>
                  </div>
                )}
              </motion.div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
          </div>

          {/* Registration Summary */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-[#1a3a6b] uppercase tracking-widest">Ringkasan Registrasi</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="text-slate-700 text-[10px] font-bold uppercase">Draft</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tanggal</span>
                <span className="font-bold text-slate-700 text-xs">
                  {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              {selectedBatch && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Batch</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: selectedBatch.color }}
                  >
                    {selectedBatch.id}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Kelengkapan</span>
                  <span className="font-bold text-slate-600">{completeness}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#1a3a6b] rounded-full"
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button type="submit"
              className="w-full py-3.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1a3a6b]/90 transition-all shadow-lg shadow-[#1a3a6b]/20 active:scale-[0.99]">
              <CheckCircle2 size={16} />
              Selesaikan Registrasi
            </button>
            <button type="button"
              className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all active:scale-[0.99]">
              Simpan sebagai Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PatientRegistration() {
  const [view, setView] = useState<"list" | "form">("list")

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            <PatientDirectory onNew={() => setView("form")} />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            <RegistrationForm onBack={() => setView("list")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
