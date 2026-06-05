import { useState, useRef, useEffect } from "react"
import { Search, Filter, Plus, Trash2, X, Pencil } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Patient, Batch } from "../../types"
import { FilterState, FilterPanel } from "./FilterPanel"
import { DeleteModal } from "./DeleteModal"
import { avatarColor, formatRegistered } from "../../lib/helpers"

// ─── Batch Map Helper ───
const buildBatchMap = (batches: readonly Batch[] | Batch[]) =>
  Object.fromEntries(batches.map(b => [b.id, b]))

// Gender text renderer
function GenderText({ gender }: { gender: string }) {
  const isFemale = gender === "F"
  return (
    <span className={`text-xs font-semibold ${isFemale ? "text-pink-600" : "text-sky-600"}`}>
      {isFemale ? "P" : "L"}
    </span>
  )
}

// Batch Badge
function BatchBadge({ batchId, batchMap }: { batchId: string; batchMap: Record<string, Batch> }) {
  const batch = batchMap[batchId]
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

// Checkbox helper
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

function TH({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-400 ${className}`}>
      {children}
    </th>
  )
}

type PatientDirectoryProps = {
  patients: Patient[]
  batches: readonly Batch[] | Batch[]
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  onNew: () => void
  onEdit: (p: Patient) => void
}

export function PatientDirectory({
  patients,
  batches,
  setPatients,
  onNew,
  onEdit,
}: PatientDirectoryProps) {
  const [search, setSearch]         = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter]         = useState<FilterState>({ sort: "newest", batchId: "" })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<Patient[] | null>(null)

  const batchMap = buildBatchMap(batches)
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
                <FilterPanel filter={filter} batches={batches} onChange={setFilter} onClose={() => setShowFilter(false)} />
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
              style={{ backgroundColor: batchMap[filter.batchId]?.color }}>
              {batchMap[filter.batchId]?.name}
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
                    <BatchBadge batchId={p.batchId} batchMap={batchMap} />
                  </td>

                  {/* Usia */}
                  <td className="px-3 py-3.5 tabular-nums text-xs text-slate-600">
                    {p.age} th
                  </td>

                  {/* Kelamin */}
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
                        onClick={() => onEdit(p)}
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
