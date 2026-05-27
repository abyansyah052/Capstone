import { useState, useRef } from "react"
import {
  Folder, FolderOpen, FileText, Trash2, Upload,
  ChevronRight, Home, MoreVertical, FilePlus, FolderPlus, X, Download,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FsFile {
  id: string
  kind: "file"
  name: string
  mimeType: "application/pdf"
  size: string
  createdAt: string
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
      {
        id: "f1-1", kind: "folder", name: "Batch 2026", createdAt: "2026-01-15", children: [
          { id: "p1", kind: "file", name: "Laporan_Andi Firmansyah.pdf", mimeType: "application/pdf", size: "245 KB", createdAt: "2026-02-03" },
          { id: "p2", kind: "file", name: "Laporan_Siti Rahayu.pdf", mimeType: "application/pdf", size: "198 KB", createdAt: "2026-02-05" },
        ]
      },
    ]
  },
  {
    id: "f2", kind: "folder", name: "Kimia Farma", createdAt: "2026-02-01",
    children: [
      { id: "p3", kind: "file", name: "Laporan_Budi Santoso.pdf", mimeType: "application/pdf", size: "312 KB", createdAt: "2026-02-20" },
    ]
  },
  { id: "f3", kind: "folder", name: "Bank Mandiri", createdAt: "2026-03-05", children: [] },
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

function deleteNodeFromTree(nodes: FsNode[], targetId: string): FsNode[] {
  return nodes
    .filter(n => n.id !== targetId)
    .map(n => n.kind === "folder" ? { ...n, children: deleteNodeFromTree(n.children, targetId) } : n)
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

// ─── PDF Preview ──────────────────────────────────────────────────────────────
// Colors: black (#111827) and dark navy (#1e3a5f) only — no other hues

function ReportPreview({ form }: { form: ReportForm }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const row = (label: string, value: string) => (
    <tr style={{ borderBottom: "1px solid #d1d5db" }}>
      <td style={{ padding: "5px 12px 5px 0", fontWeight: 700, fontSize: "11px", color: "#111827", width: "160px", verticalAlign: "top" }}>{label}</td>
      <td style={{ padding: "5px 0", fontSize: "11px", color: value ? "#1e3a5f" : "#9ca3af" }}>{value || "—"}</td>
    </tr>
  )

  const sectionBox = (content: string | undefined, placeholder: string) => (
    <div style={{ border: "1px solid #374151", borderRadius: "4px", padding: "10px 12px", minHeight: "64px", marginBottom: "14px" }}>
      <p style={{ fontSize: "10px", color: content ? "#1e3a5f" : "#9ca3af", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
        {content || placeholder}
      </p>
    </div>
  )

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #d1d5db",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      width: "595px",
      minHeight: "842px",
      fontFamily: "'Times New Roman', 'Georgia', serif",
      padding: "52px 56px",
      color: "#111827",
    }}>
      {/* Letterhead */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
        {/* Asisya logo — use the actual navbar SVG asset */}
        <img
          src="/asisya-consulting.png"
          alt="Asisya Psychological Center"
          style={{ width: "64px", height: "64px", objectFit: "contain", flexShrink: 0 }}
        />
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", color: "#111827", margin: "0 0 2px" }}>
            ASISYA PSYCHOLOGICAL CENTER
          </p>
          <p style={{ fontSize: "10px", color: "#374151", margin: "0 0 1px" }}>Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya</p>
          <p style={{ fontSize: "10px", color: "#374151", margin: "0 0 1px" }}>Tlp: 0813-3501-005</p>
          <p style={{ fontSize: "10px", color: "#374151", margin: 0 }}>Surabaya - Jawa Timur</p>
        </div>
      </div>

      <hr style={{ borderColor: "#111827", borderWidth: "1.5px", marginBottom: "10px" }} />
      <p style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#111827", marginBottom: "18px" }}>
        FORM KONSELING PSIKOLOGIS
      </p>

      {/* Biodata */}
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Biodata</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
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

      {/* Sections */}
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Permasalahan Saat Ini</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.permasalahan, "(Data deskripsi keluhan, gejala awal, dan permasalahan utama yang diinput oleh konselor/psikolog pada form digital akan terdokumentasi secara otomatis)")}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Proses Konseling</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.prosesKonseling, "(Catatan perkembangan sesi konseling, dinamika psikologis, metode pendekatan intervensi yang diterapkan, serta respons klien sepanjang sesi akan terdokumentasi secara otomatis)")}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Diagnosis Klinis</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.diagnosisKlinis, "(Diagnosis klinis berdasarkan hasil asesmen psikologis)")}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Saran Pengembangan dan Intervensi</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.saranPengembangan, "(Rekomendasi tindak lanjut, rencana intervensi klinis lanjutan, tugas mandiri untuk klien, atau saran pengembangan diri spesifik)")}

      {/* Signature */}
      <div style={{ marginTop: "24px", textAlign: "right" }}>
        <p style={{ fontSize: "10px", color: "#374151" }}>Surabaya, {today}</p>
        <div style={{ marginTop: "48px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#111827" }}>Psikolog / Konselor</p>
          <p style={{ fontSize: "10px", color: "#6b7280" }}>( _________________________ )</p>
        </div>
      </div>
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

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
      <div className="px-5 py-4">
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onCreate(name.trim())}
          placeholder="Nama folder (contoh: PT PLN)"
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all" />
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Batal</button>
        <button onClick={() => name.trim() && onCreate(name.trim())}
          className="px-4 py-2 rounded-lg bg-[#01696f] text-white text-sm font-medium hover:bg-[#0c4e54] transition-all">Buat</button>
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

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface CtxMenu {
  nodeId: string
  nodeName: string
  nodeKind: "folder" | "file"
}

function CtxMenuPanel({ menu, pos, onClose, onDelete }: {
  menu: CtxMenu; pos: { x: number; y: number }; onClose: () => void; onDelete: () => void
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

// ─── Report Creator ───────────────────────────────────────────────────────────

function ReportCreator({ onClose, onSave }: { onClose: () => void; onSave: (name: string, form: ReportForm) => void }) {
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const set = (k: keyof ReportForm, v: string) => setForm(p => ({ ...p, [k]: v }))

  // GSM-aligned input styles: teal focus ring matching --color-primary
  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all"
  const labelCls = "text-[12px] font-medium text-slate-600 mb-1 block"
  const textareaCls = `${inputCls} resize-none leading-relaxed`

  const handleSave = () => {
    const name = form.namaLengkap.trim() || "Laporan Tanpa Nama"
    onSave(`Laporan_${name}.pdf`, form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f6f2] flex flex-col overflow-hidden">
      {/* Top bar — GSM surface/border tokens */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Buat Laporan Psikologis</p>
            <p className="text-[11px] text-slate-400">Form akan otomatis mengisi preview di sebelah kanan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[#01696f] text-white text-sm font-medium hover:bg-[#0c4e54] transition-all flex items-center gap-2">
            <Download size={14} />
            Simpan ke Folder
          </button>
        </div>
      </div>

      {/* Split: form left / PDF preview right */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: form panel */}
        <div className="w-[400px] flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-6 flex flex-col gap-5">

            {/* Bio data section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#01696f]" />
                <p className="text-[13px] font-semibold text-slate-700">Bio data</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Profil</p>
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
                      placeholder="Usia" className={inputCls} />
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

            {/* Laporan section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#01696f]" />
                <p className="text-[13px] font-semibold text-slate-700">Laporan</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Permasalahan Saat Ini</label>
                  <textarea value={form.permasalahan} onChange={e => set("permasalahan", e.target.value)}
                    placeholder="(Data deskripsi keluhan, gejala awal, dan permasalahan utama...)"
                    rows={4} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Proses Konseling</label>
                  <textarea value={form.prosesKonseling} onChange={e => set("prosesKonseling", e.target.value)}
                    placeholder="(Catatan perkembangan sesi konseling, dinamika psikologis...)"
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
                    placeholder="(Rekomendasi tindak lanjut, rencana intervensi klinis lanjutan...)"
                    rows={4} className={textareaCls} />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right: live PDF preview — zoomed in so it's readable */}
        <div className="flex-1 overflow-auto bg-slate-300 flex items-start justify-center py-10 px-6">
          <div style={{ transform: "scale(1.05)", transformOrigin: "top center", marginBottom: "80px" }}>
            <ReportPreview form={form} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Node Card ────────────────────────────────────────────────────────────────

function NodeCard({ node, onOpen, onMenuOpen }: {
  node: FsNode; onOpen: () => void; onMenuOpen: (e: React.MouseEvent) => void
}) {
  const isFolder = node.kind === "folder"
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-[#01696f]/30 hover:shadow-sm transition-all cursor-pointer"
      onDoubleClick={isFolder ? onOpen : undefined}
      onClick={!isFolder ? onOpen : undefined}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isFolder
          ? <Folder size={20} className="text-[#01696f] flex-shrink-0" />
          : <FileText size={20} className="text-slate-400 flex-shrink-0" />
        }
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{node.name}</p>
          <p className="text-[11px] text-slate-400">
            {isFolder
              ? `${(node as FsFolder).children.length} item · ${node.createdAt}`
              : `PDF · ${(node as FsFile).size} · ${node.createdAt}`
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

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DoctorNotes() {
  const [tree, setTree] = useState<FsNode[]>(INIT_TREE)
  const [path, setPath] = useState<string[]>([])
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CtxMenu | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ menu: CtxMenu; pos: { x: number; y: number } } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentNodes: FsNode[] =
    path.length === 0 ? tree : findFolder(tree, path)?.children ?? []

  const breadcrumbs = getPathFolders(tree, path)

  const createFolder = (name: string) => {
    const node: FsFolder = { id: uid(), kind: "folder", name, createdAt: new Date().toLocaleDateString("id-ID"), children: [] }
    setTree(prev => insertNode(prev, path, node))
    setNewFolderOpen(false)
  }

  const removeNode = (id: string) => {
    setTree(prev => deleteNodeFromTree(prev, id))
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

  const handleSaveReport = (name: string, _form: ReportForm) => {
    const node: FsFile = {
      id: uid(), kind: "file", name, mimeType: "application/pdf",
      size: "—", createdAt: new Date().toLocaleDateString("id-ID"),
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
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Psychologist Report Bank</h1>
          <p className="text-sm text-slate-400 mt-0.5">Kelola laporan psikologis per perusahaan atau klien</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setNewFolderOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
            <FolderPlus size={15} className="text-slate-500" />
            Folder Baru
          </button>
          <button onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#01696f] text-white text-sm font-medium hover:bg-[#0c4e54] transition-all">
            <FilePlus size={15} />
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
        <nav className="flex items-center gap-1 text-sm text-slate-500 mb-4">
          <button onClick={() => setPath([])} className="flex items-center gap-1.5 hover:text-[#01696f] transition-colors">
            <Home size={13} />
            <span>Report Bank</span>
          </button>
          {breadcrumbs.map((folder, i) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronRight size={13} className="text-slate-300" />
              <button
                onClick={() => setPath(path.slice(0, i + 1))}
                className={`hover:text-[#01696f] transition-colors ${i === breadcrumbs.length - 1 ? "text-slate-900 font-medium" : ""}`}>
                {folder.name}
              </button>
            </span>
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
            onConfirm={() => removeNode(deleteTarget.nodeId)}
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

      {/* Report Creator full-screen */}
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
