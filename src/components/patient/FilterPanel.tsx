import { motion } from "motion/react"
import { X } from "lucide-react"
import { Batch } from "../../types"

type SortOption = "newest" | "oldest" | "name_az" | "name_za"
export type FilterState = { sort: SortOption; batchId: string }

type FilterPanelProps = {
  filter: FilterState
  batches: readonly Batch[] | Batch[]
  onChange: (f: FilterState) => void
  onClose: () => void
}

export function FilterPanel({ filter, batches, onChange, onClose }: FilterPanelProps) {
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
            {batches.map(b => (
              <button key={b.id} onClick={() => upd("batchId", b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition-all ${
                  filter.batchId === b.id ? "bg-[#01696f] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}>
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                <span className="flex-1 truncate">{b.name}{b.deleted ? " (Nonaktif)" : ""}</span>
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
