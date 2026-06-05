import React, { useState } from "react"
import { Building2, Plus, Trash2, Check, AlertCircle } from "lucide-react"
import { Batch } from "../../types"
import { motion, AnimatePresence } from "motion/react"

interface BatchManagementProps {
  batches: Batch[]
  onBatchesChange: React.Dispatch<React.SetStateAction<Batch[]>>
  currentUser: { id: string; role: string; email: string }
}

const PRESET_COLORS = [
  "#1e40af", // Navy Blue
  "#0f766e", // Deep Teal
  "#6d28d9", // Purple
  "#475569", // Cool Slate
  "#be185d", // Rose
  "#15803d", // Forest Green
  "#b45309", // Warm Orange
  "#0284c7", // Light Sky Blue
]

export function BatchManagement({
  batches,
  onBatchesChange,
  currentUser,
}: BatchManagementProps) {
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0]!)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const cleanId = id.trim().toUpperCase()
    const cleanName = name.trim()
    const cleanCompany = company.trim()

    if (!cleanId || !cleanName || !cleanCompany) {
      setError("Semua kolom formulir wajib diisi.")
      return
    }

    if (!/^B\d+$/.test(cleanId)) {
      setError("Format ID Batch tidak valid. Harus diawali huruf 'B' diikuti angka (contoh: B005).")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify({
          id: cleanId,
          name: cleanName,
          company: cleanCompany,
          color,
        }),
      })

      const json = await res.json()
      setIsSubmitting(false)

      if (json.ok) {
        setSuccess(`Batch ${cleanId} berhasil ditambahkan!`)
        onBatchesChange(prev => {
          // If reactivated existing, replace it, otherwise append
          const exists = prev.some(b => b.id === cleanId)
          if (exists) {
            return prev.map(b => b.id === cleanId ? json.data : b)
          } else {
            return [...prev, json.data]
          }
        })
        setId("")
        setName("")
        setCompany("")
      } else {
        setError(json.error || "Gagal membuat batch baru.")
      }
    } catch (err) {
      setIsSubmitting(false)
      setError("Koneksi ke server gagal. Harap coba lagi.")
    }
  }

  const handleDelete = async (batchId: string) => {
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
      })

      const json = await res.json()
      if (json.ok) {
        setSuccess(`Batch ${batchId} berhasil dihapus.`)
        onBatchesChange(prev => prev.map(b => b.id === batchId ? { ...b, deleted: true } : b))
        setDeleteConfirmId(null)
      } else {
        setError(json.error || "Gagal menghapus batch.")
      }
    } catch (err) {
      setError("Gagal terhubung ke server saat menghapus batch.")
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all"
  const labelCls = "text-[12px] font-semibold text-slate-600 mb-1.5 block"

  return (
    <div className="p-6 max-w-[1400px] w-full mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Building2 className="text-[#01696f]" size={20} />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Manajemen Batch / Perusahaan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola data batch yang terhubung ke data registrasi pasien dan penyusunan laporan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Add Batch */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Tambah Batch Baru</h2>

          {/* Feedback messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
                <Check size={14} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className={labelCls}>ID Batch</label>
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Contoh: B005"
              maxLength={10}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Nama Batch</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Batch Mandiri Q3 2026"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Perusahaan</label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Contoh: PT Bank Mandiri"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Warna Label</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform duration-150 hover:scale-110 active:scale-95 shadow-sm"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#16254c] text-white text-sm font-semibold hover:bg-[#0f1a38] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            <Plus size={15} />
            {isSubmitting ? "Menyimpan..." : "Tambah Batch"}
          </button>
        </form>

        {/* List of Batches */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 px-5 py-4 bg-slate-50/60">Daftar Batch Terdaftar</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="px-5 py-3.5 w-24">ID</th>
                  <th className="px-5 py-3.5">Nama Batch</th>
                  <th className="px-5 py-3.5">Perusahaan</th>
                  <th className="px-5 py-3.5 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {batches.filter(b => !b.deleted).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      Belum ada batch terdaftar. Silakan tambahkan melalui form di sebelah kiri.
                    </td>
                  </tr>
                ) : (
                  batches.filter(b => !b.deleted).map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold text-white whitespace-nowrap block text-center"
                          style={{ backgroundColor: b.color }}
                        >
                          {b.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{b.name}</td>
                      <td className="px-5 py-4 text-slate-500">{b.company}</td>
                      <td className="px-5 py-4 text-right">
                        {deleteConfirmId === b.id ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-colors shadow-sm"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Batch"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
export default BatchManagement;
