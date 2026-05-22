import { useState } from "react"
import { FileText, Plus, ChevronDown, Brain } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ──────────────────────────────────────────────────────────────────

type RecordType = "kondisi" | "terapi" | "pemicu" | "obat"
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

// ─── Seed Data ───────────────────────────────────────────────────────────────

const PATIENTS: PsychPatient[] = [
  {
    id: "1",
    patientId: "MED-851234-567",
    name: "John",
    dateOfBirth: "2001-01-01",
    records: [
      {
        id: "r1", type: "kondisi", status: "Aktif",
        title: "Gangguan Kecemasan Umum", date: "2024-03-01",
        description: "Pasien mengalami kecemasan berlebih yang mengganggu produktivitas kerja sehari-hari",
        notes: "Pasien merespon baik terhadap teknik relaksasi pernapasan",
      },
      {
        id: "r2", type: "terapi", status: "Aktif",
        title: "Terapi Perilaku Kognitif", date: "2024-03-08",
        description: "Sesi ke-1: Restrukturisasi Kognitif dan identifikasi cognitive distortion",
        notes: "Pasien diminta mengisi jurnal pikiran otomatis setiap malam",
      },
      {
        id: "r3", type: "pemicu", status: "Selesai",
        title: "Serangan Panik", date: "2024-02-15",
        description: "Pemicu utama: Berada di ruang sempit dan keramaian intens (Klaustrofobia)",
        notes: "Pasien telah diberikan strategi grounding (5-4-3-2-1) jika pemicu muncul",
      },
      {
        id: "r4", type: "obat", status: "Selesai",
        title: "Obat", date: "2024-01-20",
        description: "Obat",
        notes: "Obat",
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
        description: "Episode depresi berulang dengan gejala anhedonia dan insomnia",
        notes: "Butuh pemantauan lebih lanjut setiap 2 minggu",
      },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<RecordType, string> = {
  kondisi: "Kondisi",
  terapi:  "Terapi",
  pemicu:  "Pemicu/Resiko",
  obat:    "Obat-Obatan",
}

const TYPE_STYLE: Record<RecordType, string> = {
  kondisi: "bg-blue-50 text-blue-700 border border-blue-100",
  terapi:  "bg-teal-50 text-teal-700 border border-teal-100",
  pemicu:  "bg-amber-50 text-amber-700 border border-amber-100",
  obat:    "bg-purple-50 text-purple-700 border border-purple-100",
}

const STATUS_STYLE: Record<RecordStatus, string> = {
  Aktif:   "bg-emerald-50 text-emerald-700 border border-emerald-100",
  Selesai: "bg-slate-100 text-slate-500 border border-slate-200",
  Kronik:  "bg-orange-50 text-orange-700 border border-orange-100",
}

type TabKey = "ringkasan" | RecordType

const TABS: { key: TabKey; label: string }[] = [
  { key: "ringkasan", label: "Ringkasan" },
  { key: "kondisi",   label: "Kondisi" },
  { key: "terapi",    label: "Terapi" },
  { key: "pemicu",    label: "Pemicu/Resiko" },
  { key: "obat",      label: "Obat-Obatan" },
]

// ─── Record Card ─────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: PsychRecord }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* header row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${TYPE_STYLE[record.type]}`}>
            {TYPE_LABEL[record.type]}
          </span>
          <span className="font-semibold text-slate-800 text-[15px] truncate">{record.title}</span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ml-3 ${STATUS_STYLE[record.status]}`}>
          {record.status}
        </span>
      </div>
      {/* description */}
      <div className="px-5 py-3 border-b border-slate-50">
        <p className="text-sm text-slate-500 leading-relaxed">{record.description}</p>
      </div>
      {/* notes */}
      <div className="px-5 py-3">
        <p className="text-sm text-slate-700 leading-relaxed">{record.notes}</p>
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
    type: "kondisi" as RecordType,
    title: "", description: "", notes: "",
    status: "Aktif" as RecordStatus,
    date: new Date().toISOString().split("T")[0],
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
  const labelCls = "text-[13px] font-medium text-slate-600"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
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
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">Tambah Riwayat</h2>
          <p className="text-sm text-slate-400 mt-0.5">{patientName}</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tipe</label>
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
            <label className={labelCls}>Judul</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="contoh: Gangguan Kecemasan Umum" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Deskripsi</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Deskripsi singkat kondisi atau terapi…" rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Catatan</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Catatan klinis, perkembangan, atau tindak lanjut…" rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tanggal</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button
            onClick={() => { if (form.title.trim()) { onAdd(form); onClose() } }}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all">
            Simpan
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MedicalHistory() {
  const [patients, setPatients] = useState<PsychPatient[]>(PATIENTS)
  const [selectedId, setSelectedId] = useState("1")
  const [activeTab, setActiveTab] = useState<TabKey>("ringkasan")
  const [showAdd, setShowAdd] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const patient = patients.find(p => p.id === selectedId)!
  const records = patient.records

  const byType = (t: RecordType) => records.filter(r => r.type === t)

  const summaryCards = [
    { label: "Kondisi", count: byType("kondisi").length },
    { label: "Terapi",  count: byType("terapi").length  },
    { label: "Pemicu/Resiko", count: byType("pemicu").length },
    { label: "Obat-Obatan", count: byType("obat").length },
  ]

  const handleAdd = (rec: Omit<PsychRecord, "id">) => {
    const id = `r${Date.now()}`
    setPatients(prev => prev.map(p =>
      p.id === selectedId
        ? { ...p, records: [...p.records, { ...rec, id }] }
        : p
    ))
  }

  const tabRecords: PsychRecord[] =
    activeTab === "ringkasan"
      ? [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : byType(activeTab as RecordType)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Riwayat Psikologis</h1>
        <p className="text-sm text-slate-400 mt-0.5">Pengelolaan riwayat psikologis pasien</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">Pilih Pasien</p>
              <p className="text-xs text-slate-400 mt-0.5">Pilih pasien untuk melihat riwayat psikologis</p>
            </div>

            {/* Custom dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:border-slate-300 transition-all focus:outline-none"
              >
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">{patient.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{patient.patientId}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                  >
                    {patients.map(p => (
                      <button key={p.id} onClick={() => { setSelectedId(p.id); setDropdownOpen(false); setActiveTab("ringkasan") }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${p.id === selectedId ? "bg-slate-50" : "hover:bg-slate-50"}`}>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.patientId}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Patient meta */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="text-sm">
                <span className="text-amber-600 font-medium">ID Pasien:</span>
                <span className="ml-1 font-mono text-slate-700 text-xs">{patient.patientId}</span>
              </div>
              <div className="text-sm text-slate-600">
                Tanggal Lahir: {new Date(patient.dateOfBirth).toLocaleDateString("id-ID")}
              </div>
              <div className="text-sm text-slate-600">Total Riwayat</div>
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 active:bg-slate-950 transition-all"
            >
              <Plus size={15} />
              Tambah Riwayat
            </button>
          </div>
        </div>

        {/* ── Main Panel ── */}
        <div className="lg:col-span-9 flex flex-col gap-5">

          {/* Panel header */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-3">
            <Brain size={18} className="text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[15px] font-semibold text-slate-800">{patient.name} – Riwayat Psikologis</p>
              <p className="text-xs text-slate-400 mt-0.5">Riwayat psikologis pasien</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100 px-2 pt-2 gap-0.5 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "text-slate-900 bg-slate-100"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div layoutId="tab-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-slate-700 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Summary cards — only on Ringkasan */}
              {activeTab === "ringkasan" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {summaryCards.map(s => (
                    <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                      <p className="text-2xl font-semibold text-slate-800">{s.count}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Section header */}
              <div>
                <p className="text-[15px] font-semibold text-slate-800">
                  {activeTab === "ringkasan" ? "Riwayat Psikologis Terkini" : TYPE_LABEL[activeTab as RecordType]}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTab === "ringkasan" ? "Lorem Ipsum" : `${tabRecords.length} catatan`}
                </p>
              </div>

              {/* Record list */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3"
                >
                  {tabRecords.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-2 text-center">
                      <FileText size={32} className="text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">Belum ada catatan</p>
                      <p className="text-xs text-slate-300">Klik "+ Tambah Riwayat" untuk menambahkan</p>
                    </div>
                  ) : tabRecords.map(r => <RecordCard key={r.id} record={r} />)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
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
