import { useState, useRef } from "react"
import {
  Folder, FolderOpen, FileText, Plus, Trash2, Upload,
  ChevronRight, Home, MoreVertical, FilePlus, FolderPlus, X, Download, Eye
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface FsFile {
  id: string
  kind: "file"
  name: string
  mimeType: "application/pdf"
  size: string
  createdAt: string
  dataUrl?: string
}

interface FsFolder {
  id: string
  kind: "folder"
  name: string
  createdAt: string
  children: FsNode[]
}

type FsNode = FsFolder | FsFile

interface ReportForm {
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: string
  usia: string
  pendidikan: string
  anakKeberapa: string
  jumlahSaudara: string
  alamat: string
  permasalahan: string
  prosesKonseling: string
  diagnosisKlinis: string
  saranPengembangan: string
}

const EMPTY_FORM: ReportForm = {
  namaLengkap: "", tempatLahir: "", tanggalLahir: "",
  jenisKelamin: "", usia: "", pendidikan: "",
  anakKeberapa: "", jumlahSaudara: "", alamat: "",
  permasalahan: "", prosesKonseling: "",
  diagnosisKlinis: "", saranPengembangan: "",
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INIT_TREE: FsNode[] = [
  {
    id: "f1", kind: "folder", name: "PT PLN (Persero)", createdAt: "2026-01-10",
    children: [
      { id: "f1-1", kind: "folder", name: "Batch 2026", createdAt: "2026-01-15", children: [
        { id: "p1", kind: "file", name: "Laporan_Andi Firmansyah.pdf", mimeType: "application/pdf", size: "245 KB", createdAt: "2026-02-03" },
        { id: "p2", kind: "file", name: "Laporan_Siti Rahayu.pdf", mimeType: "application/pdf", size: "198 KB", createdAt: "2026-02-05" },
      ]},
    ]
  },
  {
    id: "f2", kind: "folder", name: "Kimia Farma", createdAt: "2026-02-01",
    children: [
      { id: "p3", kind: "file", name: "Laporan_Budi Santoso.pdf", mimeType: "application/pdf", size: "312 KB", createdAt: "2026-02-20" },
    ]
  },
  {
    id: "f3", kind: "folder", name: "Bank Mandiri", createdAt: "2026-03-05",
    children: []
  },
]

// ─── Utilities ────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) }

function findFolder(nodes: FsNode[], path: string[]): FsFolder | null {
  if (path.length === 0) return null
  const node = nodes.find(n => n.id === path[0])
  if (!node || node.kind !== "folder") return null
  if (path.length === 1) return node
  return findFolder(node.children, path.slice(1))
}

function insertNode(nodes: FsNode[], path: string[], node: FsNode): FsNode[] {
  if (path.length === 0) return [...nodes, node]
  return nodes.map(n => {
    if (n.id !== path[0] || n.kind !== "folder") return n
    return { ...n, children: insertNode(n.children, path.slice(1), node) }
  })
}

function deleteNode(nodes: FsNode[], targetId: string): FsNode[] {
  return nodes
    .filter(n => n.id !== targetId)
    .map(n => n.kind === "folder" ? { ...n, children: deleteNode(n.children, targetId) } : n)
}

function getPathFolders(nodes: FsNode[], path: string[]): FsFolder[] {
  const result: FsFolder[] = []
  let current = nodes
  for (const id of path) {
    const node = current.find(n => n.id === id)
    if (!node || node.kind !== "folder") break
    result.push(node)
    current = node.children
  }
  return result
}

// ─── PDF Preview (in-app) ─────────────────────────────────────────────────────────

function ReportPreview({ form }: { form: ReportForm }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const row = (label: string, value: string) => (
    <tr className="border-b border-gray-200">
      <td className="py-1.5 pr-4 font-semibold text-[11px] text-gray-800 w-40 align-top">{label}</td>
      <td className="py-1.5 text-[11px] text-gray-700">{value || <span className="text-gray-300">—</span>}</td>
    </tr>
  )

  return (
    <div className="bg-white border border-gray-300 shadow-sm mx-auto" style={{ width: "595px", minHeight: "842px", fontFamily: "'Times New Roman', serif", padding: "48px 52px" }}>
      {/* Letterhead */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center">
          {/* Logo placeholder — leaf/plant mark */}
          <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 48 C22 48 4 36 4 20 C4 10 12 2 22 2 C32 2 40 10 40 20 C40 36 22 48 22 48Z" fill="#1a2a1a" />
            <path d="M22 48 C22 48 10 38 10 25 C10 18 15 13 22 13 C29 13 34 18 34 25 C34 38 22 48 22 48Z" fill="#3a5a2a" />
            <line x1="22" y1="48" x2="22" y2="30" stroke="#a8c89a" strokeWidth="1.5" />
          </svg>
          <p className="text-[9px] font-bold tracking-widest text-gray-700 mt-0.5">ASISYA</p>
          <p className="text-[7px] tracking-widest text-gray-500">CONSULTING</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[13px] font-bold tracking-widest text-gray-900">ASISYA PSYCHOLOGICAL CENTER</p>
          <p className="text-[10px] text-gray-600">Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya</p>
          <p className="text-[10px] text-gray-600">Tlp: 0813-3501-005</p>
          <p className="text-[10px] text-gray-600">Surabaya - Jawa Timur</p>
        </div>
      </div>
      <hr className="border-gray-800 mb-3" />

      <p className="text-center text-[12px] font-bold tracking-wider text-gray-900 mb-4">FORM KONSELING PSIKOLOGIS</p>

      {/* Biodata */}
      <p className="text-[12px] font-bold text-gray-900 mb-1">Biodata</p>
      <hr className="border-gray-400 mb-2" />
      <table className="w-full mb-4">
        <tbody>
          {row("Nama Lengkap:", form.namaLengkap)}
          {row("Tempat/Tanggal Lahir", `${form.tempatLahir}${form.tempatLahir && form.tanggalLahir ? " / " : ""}${form.tanggalLahir}`)}
          {row("Jenis Kelamin", form.jenisKelamin)}
          {row("Usia", form.usia ? `${form.usia} Tahun` : "")}
          {row("Pendidikan Terakhir", form.pendidikan)}
          {row("Anak Keberapa", form.anakKeberapa || form.jumlahSaudara ? `Anak ke ${form.anakKeberapa} dari ${form.jumlahSaudara} bersaudara` : "")}
          {row("Alamat", form.alamat)}
        </tbody>
      </table>

      {/* Permasalahan */}
      <p className="text-[12px] font-bold text-gray-900 mb-1">Permasalahan Saat Ini</p>
      <hr className="border-gray-400 mb-2" />
      <div className="border border-gray-300 rounded p-3 mb-4 min-h-[60px]">
        <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-relaxed">{form.permasalahan || <span className="text-gray-300">(Data deskripsi keluhan, gejala awal, dan permasalahan utama yang diinput oleh konselor/psikolog pada form digital akan terdokumentasi secara otomatis)</span>}</p>
      </div>

      {/* Proses Konseling */}
      <p className="text-[12px] font-bold text-gray-900 mb-1">Proses Konseling</p>
      <hr className="border-gray-400 mb-2" />
      <div className="border border-gray-300 rounded p-3 mb-4 min-h-[60px]">
        <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-relaxed">{form.prosesKonseling || <span className="text-gray-300">(Catatan perkembangan sesi konseling, dinamika psikologis, metode pendekatan intervensi yang diterapkan, serta respons klien sepanjang sesi akan terdokumentasi secara otomatis)</span>}</p>
      </div>

      {/* Diagnosis Klinis */}
      <p className="text-[12px] font-bold text-gray-900 mb-1">Diagnosis Klinis</p>
      <hr className="border-gray-400 mb-2" />
      <div className="border border-gray-300 rounded p-3 mb-4 min-h-[50px]">
        <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-relaxed">{form.diagnosisKlinis || <span className="text-gray-300">(Diagnosis klinis berdasarkan hasil asesmen psikologis)</span>}</p>
      </div>

      {/* Saran Pengembangan */}
      <p className="text-[12px] font-bold text-gray-900 mb-1">Saran Pengembangan dan Intervensi</p>
      <hr className="border-gray-400 mb-2" />
      <div className="border border-gray-300 rounded p-3 mb-4 min-h-[60px]">
        <p className="text-[10px] text-gray-700 whitespace-pre-wrap leading-relaxed">{form.saranPengembangan || <span className="text-gray-300">(Rekomendasi tindak lanjut, rencana intervensi klinis lanjutan, tugas mandiri untuk klien, atau saran pengembangan diri spesifik)</span>}</p>
      </div>

      {/* Footer */}
      <div className="mt-6 text-right">
        <p className="text-[10px] text-gray-600">Surabaya, {today}</p>
        <div className="mt-12">
          <p className="text-[10px] font-semibold text-gray-800">Psikolog / Konselor</p>
          <p className="text-[10px] text-gray-500">( _________________________ )</p>
        </div>
      </div>
    </div>
  )
}

// ─── Modals ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-[14px] font-semibold text-slate-900">{title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function NewFolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("")
  return (
    <Modal title="Folder Baru" onClose={onClose}>
      <div className="px-5 py-4 flex flex-col gap-4">
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onCreate(name.trim())}
          placeholder="Nama folder (contoh: PT PLN)"
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Batal</button>
        <button onClick={() => name.trim() && onCreate(name.trim())}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all">Buat</button>
      </div>
    </Modal>
  )
}

function ConfirmDeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal title="Hapus Item" onClose={onClose}>
      <div className="px-5 py-4">
        <p className="text-sm text-slate-600">Hapus <span className="font-semibold text-slate-900">{name}</span>? Tindakan ini tidak dapat dibatalkan.</p>
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Batal</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all">Hapus</button>
      </div>
    </Modal>
  )
}

// ─── Context Menu ────────────────────────────────────────────────────────────────

interface CtxMenu {
  nodeId: string
  nodeName: string
  nodeKind: "folder" | "file"
}

// ─── Report Creator (full-screen overlay) ─────────────────────────────────────────

function ReportCreator({ onClose, onSave }: { onClose: () => void; onSave: (name: string, form: ReportForm) => void }) {
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const set = (k: keyof ReportForm, v: string) => setForm(p => ({ ...p, [k]: v }))

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
  const labelCls = "text-[12px] font-medium text-slate-600 mb-1 block"
  const textareaCls = `${inputCls} resize-none leading-relaxed`

  const handleSave = () => {
    const name = form.namaLengkap.trim() || "Laporan Tanpa Nama"
    onSave(`Laporan_${name}.pdf`, form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Buat Laporan Psikologis</p>
            <p className="text-[11px] text-slate-400">Form akan otomatis mengisi preview di sebelah kanan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all flex items-center gap-2">
            <Download size={14} />
            Simpan ke Folder
          </button>
        </div>
      </div>

      {/* Body: form left + preview right */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: form */}
        <div className="w-[420px] flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-6 flex flex-col gap-5">

            {/* Bio data */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">👤</span>
                </div>
                <p className="text-[13px] font-semibold text-slate-700">Bio data</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Profil</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Lengkap</label>
                    <input value={form.namaLengkap} onChange={e => set("namaLengkap", e.target.value)}
                      placeholder="[Nama Lengkap Pasien/Klien]" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tempat Lahir</label>
                    <input value={form.tempatLahir} onChange={e => set("tempatLahir", e.target.value)}
                      placeholder="Kota Kelahiran" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Jenis Kelamin</label>
                    <select value={form.jenisKelamin} onChange={e => set("jenisKelamin", e.target.value)} className={inputCls}>
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Usia</label>
                    <input value={form.usia} onChange={e => set("usia", e.target.value)}
                      placeholder="[Usia] Tahun" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal Lahir</label>
                    <input type="date" value={form.tanggalLahir} onChange={e => set("tanggalLahir", e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Pendidikan Terakhir</label>
                    <input value={form.pendidikan} onChange={e => set("pendidikan", e.target.value)}
                      placeholder="[Pendidikan Terakhir Klien]" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Anak Ke-</label>
                    <input value={form.anakKeberapa} onChange={e => set("anakKeberapa", e.target.value)}
                      placeholder="ke [ ]" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Dari [ ] Bersaudara</label>
                    <input value={form.jumlahSaudara} onChange={e => set("jumlahSaudara", e.target.value)}
                      placeholder="[ ] saudara" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Alamat</label>
                    <textarea value={form.alamat} onChange={e => set("alamat", e.target.value)}
                      placeholder="[Alamat Lengkap Rumah/Domisili Klien]" rows={2} className={textareaCls} />
                  </div>
                </div>
              </div>
            </section>

            {/* Laporan */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">📋</span>
                </div>
                <p className="text-[13px] font-semibold text-slate-700">Laporan</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Permasalahan Saat Ini</label>
                  <textarea value={form.permasalahan} onChange={e => set("permasalahan", e.target.value)}
                    placeholder="(Data deskripsi keluhan, gejala awal, dan permasalahan utama yang diinput oleh konselor/psikolog pada form digital akan terdokumentasi secara otomatis)"
                    rows={4} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Proses Konseling</label>
                  <textarea value={form.prosesKonseling} onChange={e => set("prosesKonseling", e.target.value)}
                    placeholder="(Catatan perkembangan sesi konseling, dinamika psikologis, metode pendekatan intervensi yang diterapkan, serta respons klien sepanjang sesi akan terdokumentasi secara otomatis)"
                    rows={4} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Diagnosis Klinis</label>
                  <textarea value={form.diagnosisKlinis} onChange={e => set("diagnosisKlinis", e.target.value)}
                    placeholder="(Diagnosis klinis berdasarkan hasil asesmen psikologis)"
                    rows={3} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Saran Pengembangan dan Intervensi</label>
                  <textarea value={form.saranPengembangan} onChange={e => set("saranPengembangan", e.target.value)}
                    placeholder="(Rekomendasi tindak lanjut, rencana intervensi klinis lanjutan, tugas mandiri untuk klien, atau saran pengembangan diri spesifik)"
                    rows={4} className={textareaCls} />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right: live PDF preview */}
        <div className="flex-1 overflow-auto bg-slate-200 flex items-start justify-center p-8">
          <div style={{ transform: "scale(0.92)", transformOrigin: "top center" }}>
            <ReportPreview form={form} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── File / Folder row in grid ──────────────────────────────────────────────────────

function NodeCard({
  node, onOpen, onMenuOpen,
}: {
  node: FsNode
  onOpen: () => void
  onMenuOpen: (e: React.MouseEvent) => void
}) {
  const isFolder = node.kind === "folder"
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
      onDoubleClick={isFolder ? onOpen : undefined}
      onClick={!isFolder ? onOpen : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isFolder
          ? <Folder size={20} className="text-slate-400 flex-shrink-0" />
          : <FileText size={20} className="text-red-400 flex-shrink-0" />
        }
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{node.name}</p>
          <p className="text-[11px] text-slate-400">
            {isFolder
              ? `${(node as FsFolder).children.length} item • ${node.createdAt}`
              : `PDF • ${(node as FsFile).size} • ${node.createdAt}`
            }
          </p>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onMenuOpen(e) }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all flex-shrink-0"
        aria-label="Opsi"
      >
        <MoreVertical size={15} />
      </button>
    </motion.div>
  )
}

// ─── Floating context menu ───────────────────────────────────────────────────────────

function CtxMenuPanel({
  menu, pos, onClose, onDelete,
}: {
  menu: CtxMenu
  pos: { x: number; y: number }
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", top: pos.y, left: pos.x, zIndex: 50 }}
        className="bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-44 overflow-hidden"
      >
        <button onClick={() => { onDelete(); onClose() }}
          className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
          Hapus
        </button>
      </motion.div>
    </>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DoctorNotes() {
  const [tree, setTree] = useState<FsNode[]>(INIT_TREE)
  const [path, setPath] = useState<string[]>([])
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CtxMenu | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ menu: CtxMenu; pos: { x: number; y: number } } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // current directory nodes
  const currentNodes: FsNode[] =
    path.length === 0
      ? tree
      : findFolder(tree, path)?.children ?? []

  const breadcrumbs = getPathFolders(tree, path)

  // Actions
  const createFolder = (name: string) => {
    const node: FsFolder = { id: uid(), kind: "folder", name, createdAt: new Date().toLocaleDateString("id-ID"), children: [] }
    setTree(prev => insertNode(prev, path, node))
    setNewFolderOpen(false)
  }

  const deleteNode_ = (id: string) => {
    setTree(prev => deleteNode(prev, id))
    setDeleteTarget(null)
  }

  const handleUploadPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.type !== "application/pdf") return
      const node: FsFile = {
        id: uid(), kind: "file", name: file.name, mimeType: "application/pdf",
        size: `${Math.round(file.size / 1024)} KB`,
        createdAt: new Date().toLocaleDateString("id-ID"),
      }
      setTree(prev => insertNode(prev, path, node))
    })
    e.target.value = ""
  }

  const handleSaveReport = (name: string, form: ReportForm) => {
    const node: FsFile = {
      id: uid(), kind: "file", name, mimeType: "application/pdf",
      size: "—",
      createdAt: new Date().toLocaleDateString("id-ID"),
    }
    setTree(prev => insertNode(prev, path, node))
  }

  const openCtxMenu = (menu: CtxMenu, e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ menu, pos: { x: e.clientX, y: e.clientY } })
  }

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Psychologist Report Bank</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola laporan psikologis per perusahaan atau klien</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setNewFolderOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
            <FolderPlus size={15} className="text-slate-500" />
            Folder Baru
          </button>
          <button onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
            <FilePlus size={15} className="text-slate-500" />
            Buat Laporan
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
            <Upload size={15} className="text-slate-500" />
            Upload PDF
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={handleUploadPdf} />
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-slate-500 mb-4" aria-label="Lokasi folder">
          <button onClick={() => setPath([])}
            className="flex items-center gap-1.5 hover:text-slate-800 transition-colors">
            <Home size={13} />
            <span>Report Bank</span>
          </button>
          {breadcrumbs.map((folder, i) => (
            <>
              <ChevronRight key={`sep-${folder.id}`} size={13} className="text-slate-300" />
              <button key={folder.id}
                onClick={() => setPath(path.slice(0, i + 1))}
                className={`hover:text-slate-800 transition-colors ${
                  i === breadcrumbs.length - 1 ? "text-slate-900 font-medium" : ""
                }`}>
                {folder.name}
              </button>
            </>
          ))}
        </nav>

        {/* File grid */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {currentNodes.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-center">
              <FolderOpen size={36} className="text-slate-200" />
              <p className="text-sm font-medium text-slate-400">Folder ini masih kosong</p>
              <p className="text-xs text-slate-300">Buat folder baru, upload PDF, atau buat laporan</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <AnimatePresence>
                {currentNodes.map(node => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onOpen={() => node.kind === "folder" && setPath([...path, node.id])}
                    onMenuOpen={e => openCtxMenu({ nodeId: node.id, nodeName: node.name, nodeKind: node.kind }, e)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {newFolderOpen && <NewFolderModal onClose={() => setNewFolderOpen(false)} onCreate={createFolder} />}
        {deleteTarget && (
          <ConfirmDeleteModal
            name={deleteTarget.nodeName}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteNode_(deleteTarget.nodeId)}
          />
        )}
        {ctxMenu && (
          <CtxMenuPanel
            menu={ctxMenu.menu}
            pos={ctxMenu.pos}
            onClose={() => setCtxMenu(null)}
            onDelete={() => setDeleteTarget(ctxMenu.menu)}
          />
        )}
      </AnimatePresence>

      {/* Report Creator (full-screen) */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
            <ReportCreator onClose={() => setReportOpen(false)} onSave={handleSaveReport} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
