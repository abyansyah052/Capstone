import { useState, useRef, useEffect } from "react"
import { FileText, Plus, Search, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ───────────────────────────────────────────────────────────────────

type RecordType   = "kondisi" | "terapi" | "pemicu" | "obat"
type RecordStatus = "Aktif" | "Selesai" | "Kronik"

interface PsychRecord {
  id: string
  type: RecordType
  title: string
  description: string
  notes: string
  status: RecordStatus
  date: string
}

interface PsychPatient {
  id: string
  patientId: string
  name: string
  dateOfBirth: string
  records: PsychRecord[]
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const PATIENTS: PsychPatient[] = [
  {
    id: "1",
    patientId: "MED-851234-567",
    name: "John Doe",
    dateOfBirth: "2001-01-01",
    records: [
      {
        id: "r1", type: "kondisi", status: "Aktif",
        title: "Gangguan Kecemasan Umum", date: "2024-03-01",
        description: "Pasien mengalami kecemasan berlebih yang mengganggu produktivitas kerja sehari-hari.",
        notes: "Pasien merespon baik terhadap teknik relaksasi pernapasan.",
      },
      {
        id: "r2", type: "terapi", status: "Aktif",
        title: "Terapi Perilaku Kognitif", date: "2024-03-08",
        description: "Sesi ke-1: Restrukturisasi kognitif dan identifikasi cognitive distortion.",
        notes: "Pasien diminta mengisi jurnal pikiran otomatis setiap malam.",
      },
      {
        id: "r3", type: "pemicu", status: "Selesai",
        title: "Serangan Panik", date: "2024-02-15",
        description: "Pemicu utama: Berada di ruang sempit dan keramaian intens (klaustrofobia).",
        notes: "Strategi grounding (5-4-3-2-1) telah diberikan jika pemicu muncul.",
      },
      {
        id: "r4", type: "obat", status: "Selesai",
        title: "Sertraline 50mg", date: "2024-01-20",
        description: "Diresepkan oleh dr. Anisa, Sp.KJ. Diminum 1x sehari pagi setelah makan.",
        notes: "Pantau efek samping: gangguan tidur dan mual di minggu pertama.",
      },
    ],
  },
  {
    id: "2",
    patientId: "MED-921125-890",
    name: "Sarah Wilson",
    dateOfBirth: "1992-11-22",
    records: [
      {
        id: "r5", type: "kondisi", status: "Kronik",
        title: "Depresi Mayor", date: "2023-09-10",
        description: "Episode depresi berulang dengan gejala anhedonia dan insomnia.",
        notes: "Perlu pemantauan lebih lanjut setiap 2 minggu.",
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<RecordType, string> = {
  kondisi: "Kondisi",
  terapi:  "Terapi",
  pemicu:  "Pemicu / Risiko",
  obat:    "Obat-Obatan",
}

// Subtle neutral-tinted badges — no multi-color pillbox
const TYPE_STYLE: Record<RecordType, string> = {
  kondisi: "bg-slate-100 text-slate-600",
  terapi:  "bg-teal-50   text-teal-700",
  pemicu:  "bg-amber-50  text-amber-700",
  obat:    "bg-slate-100 text-slate-600",
}

const STATUS_STYLE: Record<RecordStatus, { dot: string; text: string }> = {
  Aktif:   { dot: "bg-emerald-500", text: "text-emerald-700" },
  Selesai: { dot: "bg-slate-400",   text: "text-slate-500"   },
  Kronik:  { dot: "bg-orange-500",  text: "text-orange-700"  },
}

type TabKey = "semua" | RecordType

const TABS: { key: TabKey; label: string }[] = [
  { key: "semua",   label: "Semua" },
  { key: "kondisi", label: "Kondisi" },
  { key: "terapi",  label: "Terapi" },
  { key: "pemicu",  label: "Pemicu / Risiko" },
  { key: "obat",    label: "Obat-Obatan" },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-800 rounded-[2px]">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ─── Patient Search ───────────────────────────────────────────────────────────

function PatientSearch({
  patients,
  selectedId,
  onSelect,
}: {
  patients: PsychPatient[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [query, setQuery]   = useState("")
  const [open, setOpen]     = useState(false)
  const inputRef            = useRef<HTMLInputElement>(null)
  const containerRef        = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? patients.filter(
        p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.patientId.toLowerCase().includes(query.toLowerCase())
      )
    : patients

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (id: string) => {
    onSelect(id)
    setQuery("")
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border bg-white transition-all ${
        open ? "border-slate-400 ring-2 ring-slate-100" : "border-slate-200 hover:border-slate-300"
      }`}>
        <Search size={14} className="text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Cari nama atau ID pasien…"
          className="flex-1 min-w-0 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus() }}
            className="text-slate-300 hover:text-slate-500 flex-shrink-0 transition-colors"
            aria-label="Hapus pencarian"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-slate-400">Pasien tidak ditemukan.</p>
                <p className="text-xs text-slate-300 mt-0.5">Coba nama atau ID lain.</p>
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      p.id === selectedId ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-medium text-slate-800">
                      <Highlight text={p.name} query={query} />
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      <Highlight text={p.patientId} query={query} />
                    </p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: PsychRecord }) {
  const status = STATUS_STYLE[record.status]
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded ${TYPE_STYLE[record.type]}`}>
            {TYPE_LABEL[record.type]}
          </span>
          <span className="font-semibold text-slate-800 text-[14px] truncate">{record.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`text-[11px] font-medium ${status.text}`}>{record.status}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Deskripsi</p>
          <p className="text-sm text-slate-600 leading-relaxed">{record.description}</p>
        </div>
        {record.notes && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Catatan Klinis</p>
            <p className="text-sm text-slate-700 leading-relaxed">{record.notes}</p>
          </div>
        )}
        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-50">{formatDate(record.date)}</p>
      </div>
    </div>
  )
}

// ─── Add Record Modal ─────────────────────────────────────────────────────────

function AddRecordModal({ patientName, onClose, onAdd }: {
  patientName: string
  onClose: () => void
  onAdd: (r: Omit<PsychRecord, "id">) => void
}) {
  const [form, setForm] = useState({
    type:        "kondisi" as RecordType,
    title:       "",
    description: "",
    notes:       "",
    status:      "Aktif" as RecordStatus,
    date:        new Date().toISOString().split("T")[0],
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
    "placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/60 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
  const labelCls = "text-[13px] font-medium text-slate-700"

  const isValid = form.title.trim().length > 0

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-record-title">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 id="add-record-title" className="text-[15px] font-semibold text-slate-900">Tambah Catatan Riwayat</h2>
            <p className="text-sm text-slate-400 mt-0.5">{patientName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" aria-label="Tutup">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tipe Catatan</label>
              <select value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
                {(Object.keys(TYPE_LABEL) as RecordType[]).map(k => (
                  <option key={k} value={k}>{TYPE_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                {(["Aktif", "Selesai", "Kronik"] as RecordStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Judul <span className="text-red-500">*</span></label>
            <input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="contoh: Gangguan Kecemasan Umum"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Deskripsi</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Deskripsi singkat kondisi atau prosedur terapi…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Catatan Klinis</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Perkembangan, tindak lanjut, atau instruksi khusus…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tanggal Pencatatan</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => { if (isValid) { onAdd(form); onClose() } }}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isValid
                ? "bg-[#16254c] text-white hover:bg-[#0f1a38] active:bg-[#0a1128]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Simpan Catatan
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Patient Meta Panel ───────────────────────────────────────────────────────

function PatientMeta({ patient, onAdd }: { patient: PsychPatient; onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-semibold text-slate-800 leading-snug">{patient.name}</p>
        <p className="text-[11px] font-mono text-slate-500">{patient.patientId}</p>
        <p className="text-xs text-slate-500">Tgl. Lahir: {formatDate(patient.dateOfBirth)}</p>
        <p className="text-xs text-slate-500">
          Total catatan: <span className="font-semibold text-slate-700">{patient.records.length}</span>
        </p>
      </div>
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:bg-[#0a1128] transition-all"
      >
        <Plus size={14} />
        Tambah Catatan
      </button>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MedicalHistory() {
  const [patients, setPatients]   = useState<PsychPatient[]>(PATIENTS)
  // null = belum ada pasien yang dipilih
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("semua")
  const [showAdd, setShowAdd]     = useState(false)

  const patient = selectedId ? patients.find(p => p.id === selectedId) ?? null : null
  const records = patient?.records ?? []

  const byType = (t: RecordType) => records.filter(r => r.type === t)

  const handleAdd = (rec: Omit<PsychRecord, "id">) => {
    if (!selectedId) return
    const id = `r${Date.now()}`
    setPatients(prev => prev.map(p =>
      p.id === selectedId
        ? { ...p, records: [...p.records, { ...rec, id }] }
        : p
    ))
  }

  const handleSelectPatient = (id: string) => {
    setSelectedId(id)
    setActiveTab("semua")
  }

  const tabRecords: PsychRecord[] =
    activeTab === "semua"
      ? [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : byType(activeTab as RecordType)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Riwayat Psikologis</h1>
        <p className="text-sm text-slate-400 mt-0.5">Kelola dan tinjau catatan psikologis pasien.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Pilih Pasien</p>
              <p className="text-xs text-slate-400 mt-0.5">Cari nama atau nomor ID pasien.</p>
            </div>

            <PatientSearch
              patients={patients}
              selectedId={selectedId}
              onSelect={handleSelectPatient}
            />

            {/* Tampilkan info pasien hanya setelah dipilih */}
            {patient && (
              <PatientMeta patient={patient} onAdd={() => setShowAdd(true)} />
            )}
          </div>
        </div>

        {/* ── Main Panel ── */}
        <div className="lg:col-span-9">
          {/* Belum ada pasien dipilih */}
          {!patient ? (
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-24 gap-3">
              <FileText size={32} className="text-slate-200" />
              <p className="text-sm font-medium text-slate-400">Belum ada pasien dipilih</p>
              <p className="text-xs text-slate-300 max-w-[24ch] text-center">
                Cari dan pilih pasien di panel kiri untuk melihat riwayatnya.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Patient header — nama + ID saja, ringkas */}
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <p className="text-[15px] font-semibold text-slate-800">{patient.name}</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{patient.patientId}</p>
              </div>

              {/* Summary counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { label: "Kondisi",       count: byType("kondisi").length },
                  { label: "Terapi",        count: byType("terapi").length  },
                  { label: "Pemicu / Risiko", count: byType("pemicu").length  },
                  { label: "Obat-Obatan",   count: byType("obat").length    },
                ] as { label: string; count: number }[]).map(s => (
                  <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                    <p className="text-2xl font-semibold text-slate-800 tabular-nums">{s.count}</p>
                  </div>
                ))}
              </div>

              {/* Tabs + records */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-slate-100 px-2 pt-2 gap-0.5 overflow-x-auto">
                  {TABS.map(tab => {
                    const count =
                      tab.key === "semua"
                        ? records.length
                        : byType(tab.key as RecordType).length
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all ${
                          activeTab === tab.key
                            ? "text-slate-900 bg-slate-100"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${
                            activeTab === tab.key
                              ? "bg-slate-700 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {count}
                          </span>
                        )}
                        {activeTab === tab.key && (
                          <motion.div
                            layoutId="tab-indicator"
                            className="absolute bottom-0 left-3 right-3 h-0.5 bg-slate-700 rounded-full"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-3"
                    >
                      {tabRecords.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-2 text-center">
                          <FileText size={28} className="text-slate-200" />
                          <p className="text-sm font-medium text-slate-400">Belum ada catatan</p>
                          <p className="text-xs text-slate-300">Klik "Tambah Catatan" untuk menambahkan.</p>
                        </div>
                      ) : (
                        tabRecords.map(r => <RecordCard key={r.id} record={r} />)
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && patient && (
          <AddRecordModal
            patientName={patient.name}
            onClose={() => setShowAdd(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
