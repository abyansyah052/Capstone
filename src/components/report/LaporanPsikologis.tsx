import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Folder, FolderOpen, FileText, Trash2, Upload,
  ChevronRight, ChevronLeft, Home, MoreVertical, FilePlus, FolderPlus, X,
  Search, SlidersHorizontal, ArrowUp, ArrowDown, PenLine,
  CheckSquare, Square, CheckCheck, Download, Eye,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Psychologist, Patient, FsFile, FsFolder, FsNode, ReportForm, Batch } from "../../types"
import { uid } from "../../lib/helpers"
import { ReportCreator } from "./ReportCreator"

type SortKey = "date-desc" | "date-asc" | "name-asc" | "name-desc"
type KindFilter = "all" | "folder" | "file"

function buildTree(flatNodes: any[]): FsNode[] {
  const map = new Map<string, any>();
  const roots: FsNode[] = [];
  
  flatNodes.forEach(node => {
    const cloned = { ...node, children: node.kind === "folder" ? [] : undefined };
    map.set(node.id, cloned);
  });
  
  flatNodes.forEach(node => {
    const cloned = map.get(node.id);
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent && parent.kind === "folder") {
        parent.children.push(cloned);
      } else {
        roots.push(cloned);
      }
    } else {
      roots.push(cloned);
    }
  });
  
  return roots;
}



function findFolder(nodes: FsNode[], path: string[]): FsFolder | null {
  if (path.length === 0) return null
  const node = nodes.find(n => n.id === path[0])
  if (!node || node.kind !== "folder") return null
  if (path.length === 1) return node
  return findFolder(node.children, path.slice(1))
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

function sortNodes(nodes: FsNode[], sort: SortKey): FsNode[] {
  return [...nodes].sort((a, b) => {
    if (sort === "date-desc") return b.createdAt.localeCompare(a.createdAt)
    if (sort === "date-asc")  return a.createdAt.localeCompare(b.createdAt)
    if (sort === "name-asc")  return a.name.localeCompare(b.name, "id")
    if (sort === "name-desc") return b.name.localeCompare(a.name, "id")
    return 0
  })
}

interface SearchHit {
  node: FsNode
  parentPath: string[]
}

function collectSubtree(nodes: FsNode[], parentPath: string[] = []): SearchHit[] {
  const result: SearchHit[] = []
  for (const node of nodes) {
    result.push({ node, parentPath })
    if (node.kind === "folder") {
      result.push(...collectSubtree(node.children, [...parentPath, node.id]))
    }
  }
  return result
}

function useKeyClose(onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose, enabled])
}

function Modal({
  title, onClose, children, danger = false,
}: {
  title: string; onClose: () => void; children: React.ReactNode; danger?: boolean
}) {
  useKeyClose(onClose)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-[0_24px_56px_rgba(15,23,42,0.14)] overflow-hidden"
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${ danger ? "border-red-100 bg-red-50/60" : "border-slate-100" }`}>
          <p className={`text-[14px] font-semibold ${ danger ? "text-red-700" : "text-slate-900" }`}>{title}</p>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Tutup">
            <X size={15} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function NewFolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const submit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
  }, [name, onCreate])

  return (
    <Modal title="Folder Baru" onClose={onClose}>
      <div className="px-5 py-4">
        <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Nama folder</label>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit() }}
          placeholder="Contoh: PT PLN (Persero)"
          maxLength={128}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all"
        />
        {name.length > 100 && (
          <p className="mt-1 text-[11px] text-slate-400">{name.length}/128</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all">Batal</button>
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="px-4 py-2 rounded-xl bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Buat Folder
        </button>
      </div>
    </Modal>
  )
}

function RenameModal({ initialName, nodeKind, onClose, onRename }: {
  initialName: string
  nodeKind: "folder" | "file"
  onClose: () => void
  onRename: (name: string) => void
}) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)
  const isDirty = name.trim() !== initialName.trim()

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    if (nodeKind === "file") {
      const dotIndex = initialName.lastIndexOf(".")
      el.setSelectionRange(0, dotIndex > 0 ? dotIndex : initialName.length)
    } else {
      el.select()
    }
  }, [nodeKind, initialName])

  const submit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === initialName) { onClose(); return }
    onRename(trimmed)
  }, [name, initialName, onClose, onRename])

  return (
    <Modal title={`Rename ${nodeKind === "folder" ? "Folder" : "File"}`} onClose={onClose}>
      <div className="px-5 py-4">
        <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Nama baru</label>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit() }}
          maxLength={128}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all"
        />
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all">Batal</button>
        <button
          onClick={submit}
          disabled={!name.trim() || !isDirty}
          className="px-4 py-2 rounded-xl bg-[#01696f] text-white text-sm font-medium hover:bg-[#0c4e54] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Simpan
        </button>
      </div>
    </Modal>
  )
}

function ConfirmDeleteModal({
  name, nodeKind, onClose, onConfirm,
}: {
  name: string; nodeKind: "folder" | "file"; onClose: () => void; onConfirm: () => void
}) {
  const label = nodeKind === "folder" ? "folder" : "file PDF"
  const warning = nodeKind === "folder"
    ? "Semua sub-folder dan file di dalamnya juga akan terhapus."
    : "File PDF ini akan dihapus secara permanen."
  return (
    <Modal title="Konfirmasi Hapus" onClose={onClose} danger>
      <div className="px-5 py-4 space-y-2">
        <p className="text-sm text-slate-700">
          Hapus {label}{" "}
          <span className="font-semibold text-slate-900 break-all">“{name}”</span>?
        </p>
        <p className="text-[12px] text-slate-400">{warning}</p>
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all">Batal</button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.97] transition-all"
        >
          Hapus Sekarang
        </button>
      </div>
    </Modal>
  )
}

function FilterPanel({
  sort, onSort, kindFilter, onKindFilter, onClose,
}: {
  sort: SortKey
  onSort: (s: SortKey) => void
  kindFilter: KindFilter
  onKindFilter: (k: KindFilter) => void
  onClose: () => void
}) {
  useKeyClose(onClose)
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "date-desc", label: "Terbaru" },
    { key: "date-asc",  label: "Terlama" },
    { key: "name-asc",  label: "Nama A → Z" },
    { key: "name-desc", label: "Nama Z → A" },
  ]
  const kindOptions: { key: KindFilter; label: string }[] = [
    { key: "all",    label: "Semua tipe" },
    { key: "folder", label: "Folder saja" },
    { key: "file",   label: "PDF saja" },
  ]
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-0 top-full mt-2 z-50 w-56 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_48px_rgba(15,23,42,0.13)] overflow-hidden"
      >
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Urutkan</p>
        </div>
        <div className="pb-1">
          {sortOptions.map(o => (
            <button key={o.key} onClick={() => onSort(o.key)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-3
                ${sort === o.key ? "text-[#01696f] font-semibold bg-[#01696f]/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <span>{o.label}</span>
              {sort === o.key && <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-[#01696f]" />}
            </button>
          ))}
        </div>
        <div className="mx-4 border-t border-slate-100" />
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Tipe</p>
        </div>
        <div className="pb-2">
          {kindOptions.map(o => (
            <button key={o.key} onClick={() => onKindFilter(o.key)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-3
                ${kindFilter === o.key ? "text-[#01696f] font-semibold bg-[#01696f]/[0.05]" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <span>{o.label}</span>
              {kindFilter === o.key && <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-[#01696f]" />}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )
}

interface CtxMenu {
  nodeId: string
  nodeName: string
  nodeKind: "folder" | "file"
}

function CtxMenuPanel({ pos, onClose, onDelete, onRename, nodeKind, nodeId, currentUser }: {
  pos: { x: number; y: number }
  onClose: () => void; onDelete: () => void; onRename: () => void
  nodeKind: "folder" | "file"
  nodeId: string
  currentUser: { id: string; name: string; email: string; role: string }
}) {
  useKeyClose(onClose)

  const isFile = nodeKind === "file"
  const panelWidth = 176
  const panelHeight = isFile ? 170 : 90
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const left = pos.x + panelWidth > vw ? pos.x - panelWidth : pos.x
  const top  = pos.y + panelHeight > vh ? pos.y - panelHeight : pos.y

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "fixed", top, left, zIndex: 50, width: panelWidth }}
        className="bg-white border border-slate-200 rounded-2xl shadow-[0_16px_40px_rgba(15,23,42,0.13)] py-1.5 overflow-hidden"
      >
        {isFile && (
          <>
            <button
              onClick={() => {
                const queryStr = `?userId=${currentUser.id}&role=${currentUser.role}&email=${currentUser.email}&name=${encodeURIComponent(currentUser.name || "User")}`;
                window.open(`/api/reports/${nodeId}/pdf${queryStr}`, "_blank");
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-[#01696f]/[0.05] hover:text-[#01696f] transition-colors"
            >
              <Eye size={15} className="flex-shrink-0" />
              <span>Preview PDF</span>
            </button>
            <button
              onClick={() => {
                const queryStr = `?userId=${currentUser.id}&role=${currentUser.role}&email=${currentUser.email}&name=${encodeURIComponent(currentUser.name || "User")}&download=true`;
                window.open(`/api/reports/${nodeId}/pdf${queryStr}`, "_blank");
                onClose();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-[#01696f]/[0.05] hover:text-[#01696f] transition-colors"
            >
              <Download size={15} className="flex-shrink-0" />
              <span>Download PDF</span>
            </button>
            <div className="mx-3 border-t border-slate-100" />
          </>
        )}
        <button
          onClick={() => { onRename(); onClose() }}
          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-[#01696f]/[0.05] hover:text-[#01696f] transition-colors"
        >
          <PenLine size={15} className="flex-shrink-0" />
          <span>Rename</span>
        </button>
        <div className="mx-3 border-t border-slate-100" />
        <button
          onClick={() => { onDelete(); onClose() }}
          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={15} className="flex-shrink-0" />
          <span>Hapus</span>
        </button>
      </motion.div>
    </>
  )
}

function NodeRow({
  node, onOpen, onMenuOpen, selectMode, selected, onToggleSelect, pathLabel, onPreview,
}: {
  node: FsNode
  onOpen: () => void
  onMenuOpen: (e: React.MouseEvent) => void
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  pathLabel?: string
  onPreview: () => void
}) {
  const isFolder = node.kind === "folder"

  return (
    <div
      className={[
        "group relative flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3.5",
        "transition-[border-color,box-shadow,transform,opacity] duration-150",
        "opacity-100 translate-y-0",
        selected
          ? "border-[#01696f]/40 bg-[#01696f]/[0.025] shadow-[0_0_0_2px_rgba(1,105,111,0.1)]"
          : "border-[#e2dfd9] hover:border-[#01696f]/20 hover:shadow-[0_4px_16px_rgba(1,105,111,0.07)]",
      ].join(" ")}
    >
      {/* Main clickable area */}
      <button
        onClick={selectMode ? onToggleSelect : () => {
          if (!isFolder) {
            onPreview();
          } else {
            onOpen();
          }
        }}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        aria-label={isFolder ? `Buka folder ${node.name}` : `File ${node.name}`}
      >
        {/* Icon or checkbox */}
        {selectMode ? (
          <div className={[
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all",
            selected ? "bg-[#01696f] text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200",
          ].join(" ")}>
            {selected
              ? <CheckSquare size={19} strokeWidth={2} />
              : <Square size={19} strokeWidth={1.8} />
            }
          </div>
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#01696f]/[0.07] text-[#01696f]">
            {isFolder
              ? <Folder size={20} strokeWidth={1.8} />
              : <FileText size={19} strokeWidth={1.8} />
            }
          </div>
        )}

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-slate-900 leading-snug">{node.name}</p>
          <p className="mt-0.5 text-[12px] text-slate-400 leading-none">
            {isFolder
              ? `${(node as FsFolder).children.length} item`
              : `PDF · ${(node as FsFile).size}`
            }
          </p>
          {pathLabel && (
            <p className="mt-0.5 text-[11px] text-[#01696f]/60 leading-none truncate">
              Folder: {pathLabel}
            </p>
          )}
        </div>
      </button>

      {/* Date */}
      <span className="hidden sm:block flex-shrink-0 text-[12px] text-slate-400 tabular-nums">
        {node.createdAt}
      </span>

      {/* Menu button */}
      {!selectMode && (
        <button
          onClick={e => { e.stopPropagation(); onMenuOpen(e) }}
          className="flex-shrink-0 rounded-full p-1.5 text-transparent group-hover:text-slate-400 focus:text-slate-500 hover:!text-slate-700 hover:bg-slate-100 transition-all"
          aria-label={`Opsi untuk ${node.name}`}
        >
          <MoreVertical size={17} />
        </button>
      )}
    </div>
  )
}

type LaporanPsikologisProps = {
  patients?: Patient[]
  psychologists?: Psychologist[]
  currentUser: { id: string; name: string; email: string; role: string; signature: string | null }
  batches?: Batch[]
}

export function LaporanPsikologis({ patients = [], psychologists = [], currentUser, batches = [] }: LaporanPsikologisProps) {
  const [tree, setTree]                   = useState<FsNode[]>([])
  const [path, setPath]                   = useState<string[]>([])
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameTarget, setRenameTarget]   = useState<CtxMenu | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<CtxMenu | null>(null)
  const [ctxMenu, setCtxMenu]             = useState<{ menu: CtxMenu; pos: { x: number; y: number } } | null>(null)
  const [reportOpen, setReportOpen]       = useState(false)
  const [search, setSearch]               = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sort, setSort]                   = useState<SortKey>("date-desc")
  const [kindFilter, setKindFilter]       = useState<KindFilter>("all")
  const [filterOpen, setFilterOpen]       = useState(false)
  const [selectMode, setSelectMode]       = useState(false)
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const authHeaders = {
    "x-user-id": currentUser.id,
    "x-user-role": currentUser.role,
    "x-user-email": currentUser.email,
    "x-user-name": currentUser.name || "User",
  };

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch("/api/reports", { headers: authHeaders });
      const json = await res.json();
      if (json.ok) {
        setTree(buildTree(json.data));
      }
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const currentNodes: FsNode[] =
    path.length === 0 ? tree : findFolder(tree, path)?.children ?? []

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(handle)
  }, [search])

  const isDeepSearch = debouncedSearch.trim() !== "" || kindFilter !== "all"

  const filteredNodes: FsNode[] = isDeepSearch
    ? sortNodes(
        collectSubtree(currentNodes, path)
          .filter(h => h.node.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
          .filter(h => kindFilter === "all" ? true : h.node.kind === kindFilter)
          .map(h => h.node),
        sort,
      )
    : sortNodes(
        currentNodes
          .filter(n => n.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
          .filter(n => kindFilter === "all" ? true : n.kind === kindFilter),
        sort,
      )

  const deepHits: SearchHit[] = isDeepSearch
    ? collectSubtree(currentNodes, path)
      .filter(h => h.node.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
        .filter(h => kindFilter === "all" ? true : h.node.kind === kindFilter)
    : []

  const breadcrumbs = getPathFolders(tree, path)
  const activeFilterCount = (sort !== "date-desc" ? 1 : 0) + (kindFilter !== "all" ? 1 : 0)
  const allSelected = filteredNodes.length > 0 && filteredNodes.every(n => selected.has(n.id))

  const createFolder = async (name: string) => {
    const nodeId = uid();
    const payload = {
      id: nodeId,
      name,
      kind: "folder",
      parentId: path[path.length - 1] || null,
      createdAt: new Date().toLocaleDateString("id-ID"),
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchNodes();
      }
    } catch (e) {
      console.error(e);
    }
    setNewFolderOpen(false);
  }

  const removeNode = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        fetchNodes();
      }
    } catch (e) {
      console.error(e);
    }
    setDeleteTarget(null);
  }

  const renameNode = async (id: string, nextName: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      if (res.ok) {
        fetchNodes();
      }
    } catch (e) {
      console.error(e);
    }
    setRenameTarget(null);
  }

  const removeBulk = async () => {
    try {
      const res = await fetch("/api/reports/bulk-delete", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        fetchNodes();
        setSelected(new Set());
        setSelectMode(false);
      }
    } catch (e) {
      console.error(e);
    }
    setBulkDeleteOpen(false);
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(filteredNodes.map(n => n.id)))
  }

  const handleUploadPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type !== "application/pdf") return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        const nodeId = uid();
        const payload = {
          id: nodeId,
          name: file.name,
          kind: "file",
          parentId: path[path.length - 1] || null,
          mimeType: "application/pdf",
          size: `${Math.round(file.size / 1024)} KB`,
          fileContent: base64Content,
          createdAt: new Date().toLocaleDateString("id-ID"),
        };
        try {
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            fetchNodes();
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  const handleSaveReport = async (name: string, form: ReportForm) => {
    const nodeId = uid();
    const payload = {
      id: nodeId,
      name: name.endsWith(".pdf") ? name : `${name}.pdf`,
      kind: "file",
      parentId: path[path.length - 1] || null,
      mimeType: "application/pdf",
      size: "—",
      fileContent: JSON.stringify(form),
      createdAt: new Date().toLocaleDateString("id-ID"),
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchNodes();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleBatchDownload = async () => {
    try {
      const res = await fetch("/api/reports/batch-download", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "counseling_reports_batch.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        exitSelectMode();
      } else {
        alert("Gagal melakukan batch download.");
      }
    } catch (e) {
      console.error(e);
      alert("Koneksi gagal.");
    }
  }

  const openCtxMenu = (menu: CtxMenu, e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ menu, pos: { x: e.clientX + 4, y: e.clientY + 4 } })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  return (
    <>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-[28px] leading-tight font-semibold tracking-[-0.02em] text-slate-900">
            Psychological Report Bank
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">Kelola laporan psikologis per perusahaan atau klien</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:scale-[0.97] transition-all shadow-sm"
          >
            <FilePlus size={15} />
            <span>Buat Laporan</span>
          </button>
          <button
            onClick={() => setNewFolderOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e0ddd7] bg-white text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-[#01696f]/25 active:scale-[0.97] transition-all"
          >
            <FolderPlus size={15} className="text-slate-400" />
            <span>Folder Baru</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e0ddd7] bg-white text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-[#01696f]/25 active:scale-[0.97] transition-all"
          >
            <Upload size={15} className="text-slate-400" />
            <span>Upload PDF</span>
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={handleUploadPdf} />
        </div>

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-0.5 text-sm text-slate-500 mb-5 min-w-0">
          {path.length > 0 && (
            <button
              onClick={() => setPath(path.slice(0, -1))}
              className="mr-2 flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#01696f] hover:border-[#01696f]/25 active:scale-[0.97] transition-all"
            >
              <ChevronLeft size={13} />
              <span>Kembali</span>
            </button>
          )}
          <button
            onClick={() => setPath([])}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 hover:text-[#01696f] transition-colors text-slate-500"
          >
            <Home size={13} />
            <span>Report Bank</span>
          </button>
          {breadcrumbs.map((folder, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={folder.id} className="flex items-center gap-0.5 min-w-0">
                <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />
                <button
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className={[
                    "px-2 py-1 rounded-lg transition-colors truncate max-w-[180px]",
                    isLast
                      ? "text-slate-900 font-semibold cursor-default"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#01696f]",
                  ].join(" ")}
                >
                  {folder.name}
                </button>
              </span>
            )
          })}
        </nav>

        {/* Search + Filter row */}
        <div className="mb-4 flex gap-2 items-center">
          <div className="flex h-11 flex-1 items-center rounded-full border border-[#d9d6d0] bg-white px-4 gap-2.5 transition-all focus-within:border-[#01696f]/40 focus-within:ring-2 focus-within:ring-[#01696f]/10">
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari laporan atau folder"
              className="h-full w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="flex-shrink-0 rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors" aria-label="Hapus pencarian">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={[
                "relative flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-medium transition-all",
                filterOpen || activeFilterCount > 0
                  ? "border-[#16254c]/40 bg-[#16254c]/[0.10] text-[#16254c]"
                  : "border-[#16254c]/20 bg-[#16254c]/[0.07] text-[#16254c] hover:bg-[#16254c]/[0.12] hover:border-[#16254c]/30",
              ].join(" ")}
              aria-label="Filter"
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center rounded-full bg-[#16254c] text-white text-[10px] font-bold leading-none" style={{ width: 18, height: 18 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {filterOpen && (
                <FilterPanel
                  sort={sort}
                  onSort={s => { setSort(s); setFilterOpen(false) }}
                  kindFilter={kindFilter}
                  onKindFilter={k => { setKindFilter(k); setFilterOpen(false) }}
                  onClose={() => setFilterOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            className={[
              "flex-shrink-0 h-11 px-4 rounded-full border text-sm font-medium transition-all",
              selectMode
                ? "border-[#16254c]/40 bg-[#16254c] text-white"
                : "border-[#16254c]/20 bg-[#16254c]/[0.07] text-[#16254c] hover:bg-[#16254c]/[0.12] hover:border-[#16254c]/30",
            ].join(" ")}
          >
            {selectMode ? "Selesai" : "Pilih"}
          </button>
        </div>

        {/* List header */}
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              {isDeepSearch ? "Hasil Pencarian" : "Isi folder"}
            </p>
            {selectMode && filteredNodes.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#01696f] hover:text-[#0c4e54] transition-colors"
              >
                <CheckCheck size={13} />
                {allSelected ? "Batal semua" : "Pilih semua"}
              </button>
            )}
          </div>
          <button
            onClick={() => setSort(s => s === "date-desc" ? "date-asc" : "date-desc")}
            className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-[#01696f] transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            <span>Tanggal</span>
            {sort === "date-desc" ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
          </button>
        </div>

        {/* Bulk delete bar */}
        <AnimatePresence>
          {selectMode && selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mb-2.5 flex items-center justify-between px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
                <p className="text-[13px] font-semibold text-red-700">{selected.size} item dipilih</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleBatchDownload}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#01696f] text-white text-sm font-semibold hover:bg-[#0c4e54] active:scale-[0.97] transition-all"
                  >
                    <Download size={14} />
                    Download ZIP
                  </button>
                  <button
                    onClick={() => setBulkDeleteOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.97] transition-all"
                  >
                    <Trash2 size={14} />
                    Hapus {selected.size} item
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node list */}
        <div className="space-y-2">
          {filteredNodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dedad4] bg-white py-14 text-center">
              <FolderOpen size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-[14px] font-medium text-slate-400">
                {debouncedSearch ? `Tidak ada hasil untuk “${debouncedSearch}”` : "Folder ini masih kosong"}
              </p>
              <p className="text-[12px] text-slate-300 mt-1">
                {debouncedSearch
                  ? "Coba kata kunci lain atau hapus filter"
                  : "Buat folder baru, upload PDF, atau buat laporan psikologis"}
              </p>
            </div>
          ) : (
            filteredNodes.map(node => (
              <NodeRow
                key={node.id}
                node={node}
                pathLabel={isDeepSearch
                  ? (() => {
                      const hit = deepHits.find(h => h.node.id === node.id)
                      if (!hit || hit.parentPath.length === 0) return undefined
                      return getPathFolders(tree, hit.parentPath).map(f => f.name).join(" / ")
                    })()
                  : undefined
                }
                onOpen={() => {
                  if (selectMode) return
                  if (isDeepSearch) {
                    const hit = deepHits.find(h => h.node.id === node.id)
                    if (hit) {
                      if (node.kind === "folder") {
                        setPath([...hit.parentPath, node.id])
                      } else {
                        setPath(hit.parentPath)
                      }
                      setSearch("")
                      setKindFilter("all")
                    }
                  } else {
                    if (node.kind === "folder") setPath([...path, node.id])
                  }
                }}
                onMenuOpen={e => openCtxMenu({ nodeId: node.id, nodeName: node.name, nodeKind: node.kind }, e)}
                selectMode={selectMode}
                selected={selected.has(node.id)}
                onToggleSelect={() => toggleSelect(node.id)}
                onPreview={() => {
                  const queryStr = `?userId=${currentUser.id}&role=${currentUser.role}&email=${currentUser.email}&name=${encodeURIComponent(currentUser.name || "User")}`;
                  window.open(`/api/reports/${node.id}/pdf${queryStr}`, "_blank");
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {newFolderOpen && (
          <NewFolderModal
            onClose={() => setNewFolderOpen(false)}
            onCreate={createFolder}
          />
        )}

        {renameTarget && (
          <RenameModal
            initialName={renameTarget.nodeName}
            nodeKind={renameTarget.nodeKind}
            onClose={() => setRenameTarget(null)}
            onRename={name => renameNode(renameTarget.nodeId, name)}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteModal
            name={deleteTarget.nodeName}
            nodeKind={deleteTarget.nodeKind}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => removeNode(deleteTarget.nodeId)}
          />
        )}

        {bulkDeleteOpen && (
          <Modal title={`Hapus ${selected.size} Item`} onClose={() => setBulkDeleteOpen(false)} danger>
            <div className="px-5 py-4 space-y-1.5">
              <p className="text-sm text-slate-700">
                Hapus{" "}
                <span className="font-semibold text-slate-900">{selected.size} item</span>{" "}
                yang dipilih?
              </p>
              <p className="text-[12px] text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setBulkDeleteOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all">Batal</button>
              <button onClick={removeBulk} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.97] transition-all">Hapus Sekarang</button>
            </div>
          </Modal>
        )}

        {ctxMenu && (
          <CtxMenuPanel
            pos={ctxMenu.pos}
            onClose={() => setCtxMenu(null)}
            onRename={() => setRenameTarget(ctxMenu.menu)}
            onDelete={() => setDeleteTarget(ctxMenu.menu)}
            nodeKind={ctxMenu.menu.nodeKind}
            nodeId={ctxMenu.menu.nodeId}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* Report Creator */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50"
          >
            <ReportCreator
              onClose={() => setReportOpen(false)}
              onSave={handleSaveReport}
              patients={patients}
              psychologists={psychologists}
              batches={batches}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
export default LaporanPsikologis;
