import { useState, useMemo, useEffect } from "react"
import { FileText, Search, X, ChevronRight, ChevronDown, Activity } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Patient, Batch } from "../../types"

const PREVIEW_LIMIT = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function BatchBadge({ batchId, batches, size = "sm" }: { batchId: string; batches: Batch[]; size?: "sm" | "xs" }) {
  const batch = batches.find(b => b.id === batchId)
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
  patient: any
  isActive: boolean
  batchColor: string
  q: string
  onSelect: () => void
}) {
  const initials = (patient.name || "").split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "??"
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
  patients, selectedId, onSelect, batches = [],
}: {
  patients: any[]
  selectedId: string | null
  onSelect: (id: string) => void
  batches: Batch[]
}) {
  const [q, setQ] = useState("")
  const [activeBatch, setActiveBatch] = useState<string>("all")
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)

  const toggleExpand = (batchId: string) =>
    setExpandedBatch(prev => (prev === batchId ? null : batchId))

  const groups = useMemo(() => {
    const filtered = patients.filter(p => {
      const matchQ = !q.trim() ||
        (p.name && p.name.toLowerCase().includes(q.toLowerCase())) ||
        (p.patientId && p.patientId.toLowerCase().includes(q.toLowerCase()))
      const matchBatch = activeBatch === "all" || p.batchId === activeBatch
      return matchQ && matchBatch
    })
    const map: Record<string, any[]> = {}
    for (const p of filtered) {
      const arr = map[p.batchId] ?? []
      arr.push(p)
      map[p.batchId] = arr
    }
    return batches
      .filter(b => map[b.id])
      .map(b => ({ batch: b, patients: map[b.id] ?? [] }))
  }, [patients, q, activeBatch, batches])

  const isSearching = q.trim().length > 0
  const total = patients.reduce((n, p) => n + p.records.length, 0)

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-800">Pasien</p>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {patients.length} &middot; {total} laporan
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text" value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cari nama..."
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
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              activeBatch === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            style={{ fontSize: "10px" }}
          >
            Semua
          </button>
          {batches.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBatch(activeBatch === b.id ? "all" : b.id)}
              title={`${b.name} · ${b.company}`}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                activeBatch === b.id ? "text-white" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: activeBatch === b.id ? b.color : b.color + "22",
                color: activeBatch === b.id ? "#fff" : b.color,
                fontSize: "10px"
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

function RecordCard({ record }: { record: any }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-[#01696f]/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-[#01696f]/10 text-[#01696f]">
            Sesi Konseling
          </span>
          <span className="text-[13px] font-semibold text-slate-800 truncate">{record.title}</span>
        </div>
        <span className="text-[11px] text-slate-400 tabular-nums">{record.date}</span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#01696f] mb-1.5">Permasalahan Saat Ini</p>
          <p className="text-[13px] text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">{record.permasalahan}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#01696f] mb-1.5">Proses Konseling</p>
          <p className="text-[13px] text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">{record.prosesKonseling}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#01696f] mb-1.5">Diagnosis Klinis</p>
          <p className="text-[13px] text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">{record.diagnosisKlinis}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#01696f] mb-1.5">Saran Pengembangan dan Intervensi</p>
          <p className="text-[13px] text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">{record.saranPengembangan}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Patient Detail Pane ──────────────────────────────────────────────────────

function PatientDetail({ patient, batches }: { patient: any; batches: Batch[] }) {
  return (
    <div className="h-full flex flex-col min-h-0 bg-white">
      {/* Detail Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-800 truncate">{patient.name}</h2>
            <BatchBadge batchId={patient.batchId} batches={batches} />
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-1">ID: {patient.patientId}</p>
        </div>
      </div>

      {/* Record list container */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-slate-50/60">
        {patient.records.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-2 text-center">
            <FileText size={28} className="text-slate-200" />
            <p className="text-[13px] font-medium text-slate-400">Tidak ada riwayat konseling yang dilakukan</p>
            <p className="text-[11px] text-slate-300 max-w-[32ch] leading-relaxed">
              Catatan akan otomatis muncul setelah Laporan Psikologis dengan checklist &ldquo;Pasien Konseling&rdquo; disimpan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {patient.records.map((r: any) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

type MedicalHistoryProps = {
  patients: Patient[]
  currentUser: { id: string; role: string; email: string }
  batches?: Batch[]
}

export function MedicalHistory({ patients = [], currentUser, batches = [] }: MedicalHistoryProps) {
  const [reports, setReports] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) return;
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports/counseling", {
          headers: {
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          }
        })
        const json = await res.json()
        if (json.ok) setReports(json.data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchReports()
  }, [currentUser])

  // Map database patients and reports to medical records structure
  const psychPatients = useMemo(() => {
    return patients.map(p => {
      const patientReports = reports.filter(r => {
        const isCounseling = r.form?.pasienKonseling === true
        const matchesId = r.form?.patientId === p.id
        const matchesName = r.form?.namaLengkap?.toLowerCase() === (p.name || "").toLowerCase()
        return isCounseling && (matchesId || (r.form?.patientId == null && matchesName))
      })

      const records = patientReports.map(r => ({
        id: r.id,
        title: r.name ? r.name.replace(".pdf", "").replace("Laporan_", "") : "—",
        date: r.createdAt || "—",
        permasalahan: r.form?.permasalahan || "—",
        prosesKonseling: r.form?.prosesKonseling || "—",
        diagnosisKlinis: r.form?.diagnosisKlinis || "—",
        saranPengembangan: r.form?.saranPengembangan || "—",
      }))

      return {
        id: p.id,
        patientId: p.idNumber || "",
        name: p.name || "Tanpa Nama",
        dateOfBirth: p.dateOfBirth || "",
        batchId: p.batchId || "",
        records,
      }
    })
  }, [patients, reports])

  const selectedPatient = selectedId ? psychPatients.find(p => p.id === selectedId) ?? null : null

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0 flex items-center gap-2">
        <Activity className="text-[#01696f]" size={20} />
        <div>
          <h1 className="text-[16px] font-bold text-slate-900 leading-none">Riwayat Psikologis</h1>
          <p className="text-[11px] text-slate-400 mt-1">Lacak dan tinjau riwayat klinis pasien yang terhubung dari Laporan Konseling.</p>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-72 shrink-0 flex flex-col min-h-0 bg-white">
          <PatientList
            patients={psychPatients}
            selectedId={selectedId}
            onSelect={id => setSelectedId(id)}
            batches={batches}
          />
        </div>

        <div className="flex-1 min-w-0 bg-slate-50">
          {!selectedPatient ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
              <FileText size={36} className="text-slate-200" />
              <p className="text-[14px] font-medium text-slate-400">Belum ada pasien dipilih</p>
              <p className="text-[12px] text-slate-300 max-w-[28ch]">
                Pilih pasien dari daftar di sebelah kiri untuk melihat riwayat klinisnya.
              </p>
            </div>
          ) : (
            <PatientDetail patient={selectedPatient} batches={batches} />
          )}
        </div>
      </div>
    </div>
  )
}
export default MedicalHistory;
