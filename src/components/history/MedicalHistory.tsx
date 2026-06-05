import { useState, useMemo } from "react"
import { FileText, Plus, Search, X, ChevronRight, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { PsychPatient, PsychRecord, RecordType, RecordStatus } from "../../types"
import { BATCHES } from "../patient/PatientRegistration"

const BATCH_MAP = Object.fromEntries(BATCHES.map(b => [b.id, b]))

const PREVIEW_LIMIT = 3

// ─── Seed Data ────────────────────────────────────────────────────────────────

const PATIENTS: PsychPatient[] = [
  {
    id: "1", patientId: "MED-851234-567", name: "Eleanor James",
    dateOfBirth: "1981-10-01", batchId: "B001",
    records: [
      { id: "r1", type: "kondisi", status: "Aktif",   title: "Gangguan Kecemasan Umum",  date: "2024-03-01", description: "Pasien mengalami kecemasan berlebih yang mengganggu produktivitas kerja sehari-hari.", notes: "Pasien merespon baik terhadap teknik relaksasi pernapasan." },
      { id: "r2", type: "terapi",  status: "Aktif",   title: "Terapi Perilaku Kognitif", date: "2024-03-08", description: "Sesi ke-1: Restrukturisasi kognitif dan identifikasi cognitive distortion.", notes: "Pasien diminta mengisi jurnal pikiran otomatis setiap malam." },
      { id: "r3", type: "pemicu",  status: "Selesai", title: "Serangan Panik",            date: "2024-02-15", description: "Pemicu utama: Berada di ruang sempit dan keramaian intens (klaustrofobia).", notes: "Strategi grounding (5-4-3-2-1) telah diberikan." },
      { id: "r4", type: "obat",    status: "Selesai", title: "Sertraline 50mg",           date: "2024-01-20", description: "Diresepkan oleh dr. Anisa, Sp.KJ. Diminum 1x sehari pagi setelah makan.", notes: "Pantau efek samping: gangguan tidur dan mual di minggu pertama." },
    ],
  },
  {
    id: "2", patientId: "MED-921125-890", name: "Marcus Chen",
    dateOfBirth: "1992-11-22", batchId: "B002",
    records: [
      { id: "r5", type: "kondisi", status: "Kronik", title: "Depresi Mayor", date: "2023-09-10", description: "Episode depresi berulang dengan gejala anhedonia dan insomnia.", notes: "Perlu pemantauan lebih lanjut setiap 2 minggu." },
    ],
  },
  {
    id: "3", patientId: "MED-870305-112", name: "Budi Santoso",
    dateOfBirth: "1987-03-05", batchId: "B001",
    records: [
      { id: "r6", type: "kondisi", status: "Aktif",   title: "PTSD Pasca Kecelakaan", date: "2024-01-10", description: "Trauma akibat kecelakaan lalu lintas pada Desember 2023.", notes: "" },
      { id: "r7", type: "terapi",  status: "Aktif",   title: "EMDR Session 1",        date: "2024-01-18", description: "Sesi EMDR pertama untuk pemrosesan memori traumatik.", notes: "Pasien menunjukkan respons awal yang positif." },
    ],
  },
  {
    id: "4", patientId: "MED-990812-334", name: "Rina Kartika",
    dateOfBirth: "1999-08-12", batchId: "B003",
    records: [],
  },
  {
    id: "5", patientId: "MED-960215-556", name: "Sarah Lin",
    dateOfBirth: "1996-02-15", batchId: "B002",
    records: [
      { id: "r8", type: "terapi",  status: "Aktif",   title: "CBT Sesi ke-3",         date: "2024-04-02", description: "Fokus pada identifikasi pola pikir negatif berulang.", notes: "" },
    ],
  },
  {
    id: "6", patientId: "MED-880720-778", name: "Ahmad Fauzi",
    dateOfBirth: "1988-07-20", batchId: "B004",
    records: [
      { id: "r9", type: "obat",    status: "Aktif",   title: "Fluoxetine 20mg",        date: "2024-02-01", description: "Diresepkan untuk episode depresi ringan-sedang.", notes: "Evaluasi ulang setelah 4 minggu pemakaian." },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<RecordType, { label: string; cls: string }> = {
  kondisi: { label: "Kondisi",         cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  terapi:  { label: "Terapi",          cls: "bg-teal-50   text-teal-700   ring-1 ring-teal-200/60" },
  pemicu:  { label: "Pemicu / Risiko", cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200/60" },
  obat:    { label: "Obat-Obatan",     cls: "bg-slate-100 text-slate-600  ring-1 ring-slate-200" },
}

const STATUS_META: Record<RecordStatus, { dot: string; label: string }> = {
  Aktif:   { dot: "bg-emerald-500", label: "text-emerald-700" },
  Selesai: { dot: "bg-slate-400",   label: "text-slate-500"   },
  Kronik:  { dot: "bg-orange-500",  label: "text-orange-700"  },
}

type TabKey = "semua" | RecordType

const TABS: { key: TabKey; label: string }[] = [
  { key: "semua",   label: "Semua" },
  { key: "kondisi", label: "Kondisi" },
  { key: "terapi",  label: "Terapi" },
  { key: "pemicu",  label: "Pemicu / Risiko" },
  { key: "obat",    label: "Obat-Obatan" },
]

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

const calcAge = (dob: string) => {
  const d = new Date(dob), now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

function Hl({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-amber-100 text-amber-800 rounded-[2px] not-italic">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

// ─── Batch Badge ──────────────────────────────────────────────────────────────

function BatchBadge({ batchId, size = "sm" }: { batchId: string; size?: "sm" | "xs" }) {
  const batch = BATCH_MAP[batchId]
  if (!batch) return <span className="text-[11px] text-slate-400">—</span>
  return (
    <span
      className={`inline-flex items-center font-semibold text-white rounded whitespace-nowrap ${
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ backgroundColor: batch.color }}
      title={`${batch.name} · ${batch.company}`}
    >
      {batch.id}
    </span>
  )
}

// ─── Patient Row ──────────────────────────────────────────────────────────────

function PatientRow({
  patient, isActive, batchColor, q, onSelect,
}: {
  patient: PsychPatient
  isActive: boolean
  batchColor: string
  q: string
  onSelect: () => void
}) {
  const initials = patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-2 ${
        isActive ? "bg-[#eef1f8] border-[#16254c]" : "border-transparent hover:bg-slate-50"
      }`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 text-white"
        style={{ backgroundColor: isActive ? "#16254c" : batchColor }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate ${
          isActive ? "text-[#16254c]" : "text-slate-800"
        }`}>
          <Hl text={patient.name} q={q} />
        </p>
        <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
          <Hl text={patient.patientId} q={q} />
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {patient.records.length > 0 && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${
            isActive ? "bg-[#16254c]/10 text-[#16254c]" : "bg-slate-100 text-slate-500"
          }`}>
            {patient.records.length}
          </span>
        )}
        <ChevronRight size={11} className={isActive ? "text-[#16254c]" : "text-slate-300"} />
      </div>
    </motion.button>
  )
}

// ─── Patient List Sidebar ─────────────────────────────────────────────────────

function PatientList({
  patients, selectedId, onSelect,
}: {
  patients: PsychPatient[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [q, setQ] = useState("")
  const [activeBatch, setActiveBatch] = useState<string>("all")
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)

  const toggleExpand = (batchId: string) =>
    setExpandedBatch(prev => (prev === batchId ? null : batchId))

  const groups = useMemo(() => {
    const filtered = patients.filter(p => {
      const matchQ = !q.trim() ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.patientId.toLowerCase().includes(q.toLowerCase())
      const matchBatch = activeBatch === "all" || p.batchId === activeBatch
      return matchQ && matchBatch
    })
    const map: Record<string, PsychPatient[]> = {}
    for (const p of filtered) {
      const arr = map[p.batchId] ?? []
      arr.push(p)
      map[p.batchId] = arr
    }
    return BATCHES
      .filter(b => map[b.id])
      .map(b => ({ batch: b, patients: map[b.id] ?? [] }))
  }, [patients, q, activeBatch])

  const isSearching = q.trim().length > 0
  const total = patients.reduce((n, p) => n + p.records.length, 0)

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-800">Pasien</p>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {patients.length} &middot; {total} catatan
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text" value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Nama atau ID…"
            className="flex-1 min-w-0 text-[13px] text-slate-700 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-slate-300 hover:text-slate-500 transition-colors" aria-label="Hapus">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveBatch("all")}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              activeBatch === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Semua
          </button>
          {BATCHES.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBatch(activeBatch === b.id ? "all" : b.id)}
              title={`${b.name} · ${b.company}`}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                activeBatch === b.id ? "text-white" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: activeBatch === b.id ? b.color : b.color + "22",
                color: activeBatch === b.id ? "#fff" : b.color,
              }}
            >
              {b.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-[13px] text-slate-400">Tidak ada hasil</p>
          </div>
        ) : (
          groups.map(({ batch, patients: pts }) => {
            const isExpanded = isSearching || expandedBatch === batch.id
            const visible    = isExpanded ? pts : pts.slice(0, PREVIEW_LIMIT)
            const hiddenCount = pts.length - PREVIEW_LIMIT

            return (
              <div key={batch.id}>
                <div className="sticky top-0 z-10 px-4 py-1.5 bg-white border-y border-slate-100 flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: batch.color }}
                  />
                  <p className="text-[11px] font-semibold text-slate-500 truncate flex-1">{batch.name}</p>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{pts.length}</span>
                </div>

                <AnimatePresence initial={false}>
                  {visible.map(p => (
                    <PatientRow
                      key={p.id}
                      patient={p}
                      isActive={p.id === selectedId}
                      batchColor={batch.color}
                      q={q}
                      onSelect={() => onSelect(p.id)}
                    />
                  ))}
                </AnimatePresence>

                {!isSearching && hiddenCount > 0 && (
                  <motion.button
                    layout
                    onClick={() => toggleExpand(batch.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-colors"
                    style={{ color: batch.color }}
                    whileHover={{ opacity: 0.8 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown size={11} className="rotate-180" />
                        Sembunyikan
                      </>
                    ) : (
                      <>
                        <ChevronDown size={11} />
                        Lihat {hiddenCount} lainnya
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function RecordCard({ record }: { record: PsychRecord }) {
  const sm = STATUS_META[record.status]
  const tm = TYPE_META[record.type]
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded ${tm.cls}`}>
            {tm.label}
          </span>
          <span className="text-[13px] font-semibold text-slate-800 truncate">{record.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm.dot}`} />
          <span className={`text-[11px] font-medium ${sm.label}`}>{record.status}</span>
        </div>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Deskripsi</p>
          <p className="text-[13px] text-slate-700 leading-relaxed">{record.description}</p>
        </div>
        {record.notes && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Catatan Klinis</p>
            <p className="text-[13px] text-slate-700 leading-relaxed">{record.notes}</p>
          </div>
        )}
        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 tabular-nums">{fmt(record.date)}</p>
      </div>
    </div>
  )
}

// ─── Add Record Modal ─────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-[#16254c]/40 focus:ring-2 focus:ring-[#16254c]/8 transition-all"

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
    date:        new Date().toISOString().split("T")[0]!,
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const isValid = form.title.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 id="modal-title" className="text-[14px] font-semibold text-slate-900">Tambah Catatan Riwayat</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">{patientName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all" aria-label="Tutup">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700">Tipe Catatan</label>
              <select value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
                {(Object.keys(TYPE_META) as RecordType[]).map(k => (
                  <option key={k} value={k}>{TYPE_META[k].label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                {(["Aktif", "Selesai", "Kronik"] as RecordStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700">Judul <span className="text-red-500">*</span></label>
            <input autoFocus value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="contoh: Gangguan Kecemasan Umum" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700">Deskripsi</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Deskripsi singkat kondisi atau prosedur…" rows={3}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700">Catatan Klinis</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Perkembangan, tindak lanjut, atau instruksi khusus…" rows={3}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-slate-700">Tanggal Pencatatan</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button
            onClick={() => { if (isValid) { onAdd(form); onClose() } }}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              isValid ? "bg-[#16254c] text-white hover:bg-[#0f1a38]" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}>
            Simpan Catatan
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Patient Detail Panel ─────────────────────────────────────────────────────

function PatientDetail({ patient, onAdd }: { patient: PsychPatient; onAdd: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>("semua")
  const byType = (t: RecordType) => patient.records.filter(r => r.type === t)
  const batch = BATCH_MAP[patient.batchId]

  const tabRecords: PsychRecord[] =
    activeTab === "semua"
      ? [...patient.records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : byType(activeTab as RecordType)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full text-white flex items-center justify-center text-[12px] font-semibold shrink-0"
            style={{ backgroundColor: batch?.color ?? "#16254c" }}
          >
            {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-slate-900 truncate">{patient.name}</p>
              <BatchBadge batchId={patient.batchId} size="xs" />
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[11px] font-mono text-slate-400">{patient.patientId}</p>
              <span className="text-slate-300">&middot;</span>
              <p className="text-[11px] text-slate-400">
                {fmt(patient.dateOfBirth)} &middot; {calcAge(patient.dateOfBirth)} tahun
              </p>
              {batch && (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <p className="text-[11px] text-slate-500">{batch.name}</p>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16254c] text-white text-[12px] font-medium hover:bg-[#0f1a38] transition-all shrink-0"
        >
          <Plus size={13} />
          Tambah Catatan
        </button>
      </div>

      <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-5 shrink-0 overflow-x-auto">
        {TABS.filter(t => t.key !== "semua").map(t => {
          const cnt = byType(t.key as RecordType).length
          return (
            <div key={t.key} className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-slate-500">{t.label}</span>
              <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{cnt}</span>
            </div>
          )
        })}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-4 border-l border-slate-200">
          <span className="text-[11px] text-slate-500">Total</span>
          <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{patient.records.length}</span>
        </div>
      </div>

      <div className="px-6 flex gap-0 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
        {TABS.map(tab => {
          const cnt = tab.key === "semua" ? patient.records.length : byType(tab.key as RecordType).length
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                active ? "text-[#16254c]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {cnt > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                  active ? "bg-[#16254c]/10 text-[#16254c]" : "bg-slate-100 text-slate-500"
                }`}>
                  {cnt}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="tab-bar"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16254c] rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="flex flex-col gap-3"
          >
            {tabRecords.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-2 text-center">
                <FileText size={28} className="text-slate-200" />
                <p className="text-[13px] font-medium text-slate-400">Belum ada catatan</p>
                <p className="text-[12px] text-slate-300">Klik &ldquo;Tambah Catatan&rdquo; untuk menambahkan.</p>
              </div>
            ) : (
              tabRecords.map(r => <RecordCard key={r.id} record={r} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MedicalHistory() {
  const [patients, setPatients] = useState<PsychPatient[]>(PATIENTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const patient = selectedId ? patients.find(p => p.id === selectedId) ?? null : null

  const handleAdd = (rec: Omit<PsychRecord, "id">) => {
    if (!selectedId) return
    setPatients(prev => prev.map(p =>
      p.id === selectedId
        ? { ...p, records: [...p.records, { ...rec, id: `r${Date.now()}` }] }
        : p
    ))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-[16px] font-semibold text-slate-900">Riwayat Psikologis</h1>
        <p className="text-[12px] text-slate-400 mt-0.5">Kelola dan tinjau catatan klinis pasien.</p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-72 shrink-0 flex flex-col min-h-0">
          <PatientList
            patients={patients}
            selectedId={selectedId}
            onSelect={id => setSelectedId(id)}
          />
        </div>

        <div className="flex-1 min-w-0 bg-slate-50">
          {!patient ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
              <FileText size={36} className="text-slate-200" />
              <p className="text-[14px] font-medium text-slate-400">Belum ada pasien dipilih</p>
              <p className="text-[12px] text-slate-300 max-w-[28ch]">
                Pilih pasien dari daftar di sebelah kiri untuk melihat riwayat klinisnya.
              </p>
            </div>
          ) : (
            <PatientDetail patient={patient} onAdd={() => setShowAdd(true)} />
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
export default MedicalHistory;
