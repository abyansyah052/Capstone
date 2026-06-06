import React, { useState } from "react"
import { Building2, Plus, Trash2, Check, AlertCircle, Pencil, X } from "lucide-react"
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
  
  // Logo upload and scale states
  const [logo, setLogo] = useState<string | null>(null)
  const [useLogoInReport, setUseLogoInReport] = useState(false)
  const [logoScale, setLogoScale] = useState(1.0)
  
  // Custom Rectangular Cropper states
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 120, h: 120 })
  const [dragMode, setDragMode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })
  const [imageAspect, setImageAspect] = useState(1)

  const [editingBatchId, setEditingBatchId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Sizing of cropping workspace container
  const containerW = 300
  const containerH = 250
  
  let imgW = containerW
  let imgH = containerW / imageAspect
  if (imgH > containerH) {
    imgH = containerH
    imgW = containerH * imageAspect
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("")
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran logo maksimal adalah 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setRawImage(dataUrl)

      // Fit the image to container and initialize the crop box to cover 80%
      const img = new Image()
      img.src = dataUrl
      img.onload = () => {
        const aspect = img.width / img.height
        setImageAspect(aspect)

        let initialW = containerW
        let initialH = containerW / aspect
        if (initialH > containerH) {
          initialH = containerH
          initialW = containerH * aspect
        }

        const cropW = initialW * 0.8
        const cropH = initialH * 0.8
        setCropBox({
          x: (initialW - cropW) / 2,
          y: (initialH - cropH) / 2,
          w: cropW,
          h: cropH
        })
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle Drag & Resize events for Custom Crop box
  const handleMouseDown = (e: React.MouseEvent, mode: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragMode(mode)
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
      cropW: cropBox.w,
      cropH: cropBox.h
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragMode) return
    e.preventDefault()

    const dx = e.clientX - dragStart.mouseX
    const dy = e.clientY - dragStart.mouseY

    if (dragMode === "move") {
      const nextX = Math.max(0, Math.min(imgW - dragStart.cropW, dragStart.cropX + dx))
      const nextY = Math.max(0, Math.min(imgH - dragStart.cropH, dragStart.cropY + dy))
      setCropBox(p => ({ ...p, x: nextX, y: nextY }))
    } else if (dragMode === "resize-br") {
      const nextW = Math.max(20, Math.min(imgW - dragStart.cropX, dragStart.cropW + dx))
      const nextH = Math.max(20, Math.min(imgH - dragStart.cropY, dragStart.cropH + dy))
      setCropBox(p => ({ ...p, w: nextW, h: nextH }))
    } else if (dragMode === "resize-tl") {
      const maxX = dragStart.cropX + dragStart.cropW - 20
      const nextX = Math.max(0, Math.min(maxX, dragStart.cropX + dx))
      const nextW = dragStart.cropW + (dragStart.cropX - nextX)
      const maxY = dragStart.cropY + dragStart.cropH - 20
      const nextY = Math.max(0, Math.min(maxY, dragStart.cropY + dy))
      const nextH = dragStart.cropH + (dragStart.cropY - nextY)
      setCropBox({ x: nextX, y: nextY, w: nextW, h: nextH })
    } else if (dragMode === "resize-tr") {
      const nextW = Math.max(20, Math.min(imgW - dragStart.cropX, dragStart.cropW + dx))
      const maxY = dragStart.cropY + dragStart.cropH - 20
      const nextY = Math.max(0, Math.min(maxY, dragStart.cropY + dy))
      const nextH = dragStart.cropH + (dragStart.cropY - nextY)
      setCropBox({ x: dragStart.cropX, y: nextY, w: nextW, h: nextH })
    } else if (dragMode === "resize-bl") {
      const maxX = dragStart.cropX + dragStart.cropW - 20
      const nextX = Math.max(0, Math.min(maxX, dragStart.cropX + dx))
      const nextW = dragStart.cropW + (dragStart.cropX - nextX)
      const nextH = Math.max(20, Math.min(imgH - dragStart.cropY, dragStart.cropH + dy))
      setCropBox({ x: nextX, y: dragStart.cropY, w: nextW, h: nextH })
    }
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
    setDragMode(null)
  }

  const handleApplyCrop = () => {
    if (!rawImage) return
    const img = new Image()
    img.src = rawImage
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Translate coordinates from screen workspace space to original high-res space
      const scaleX = img.width / imgW
      const scaleY = img.height / imgH

      const sourceX = cropBox.x * scaleX
      const sourceY = cropBox.y * scaleY
      const sourceW = cropBox.w * scaleX
      const sourceH = cropBox.h * scaleY

      canvas.width = sourceW
      canvas.height = sourceH

      ctx.clearRect(0, 0, sourceW, sourceH)
      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH)

      const croppedBase64 = canvas.toDataURL("image/png")
      setLogo(croppedBase64)
      setRawImage(null)
    }
  }

  const handleStartEdit = (b: Batch) => {
    setError("")
    setSuccess("")
    setEditingBatchId(b.id)
    setId(b.id)
    setName(b.name)
    setCompany(b.company)
    setColor(b.color)
    setLogo(b.logo ?? null)
    setUseLogoInReport(b.useLogoInReport ?? false)
    setLogoScale(b.logoScale ?? 1.0)
    setRawImage(null)
  }

  const handleCancelEdit = () => {
    setEditingBatchId(null)
    setId("")
    setName("")
    setCompany("")
    setColor(PRESET_COLORS[0]!)
    setLogo(null)
    setUseLogoInReport(false)
    setLogoScale(1.0)
    setRawImage(null)
    setError("")
    setSuccess("")
  }

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
      if (editingBatchId) {
        // Edit Mode
        const res = await fetch(`/api/batches/${editingBatchId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
          body: JSON.stringify({
            name: cleanName,
            company: cleanCompany,
            color,
            logo,
            useLogoInReport,
            logoScale,
          }),
        })

        const json = await res.json()
        setIsSubmitting(false)

        if (json.ok) {
          setSuccess(`Batch ${editingBatchId} berhasil diperbarui!`)
          onBatchesChange(prev => prev.map(b => b.id === editingBatchId ? json.data : b))
          handleCancelEdit()
        } else {
          setError(json.error || "Gagal memperbarui batch.")
        }
      } else {
        // Create Mode
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
            logo,
            useLogoInReport,
            logoScale,
          }),
        })

        const json = await res.json()
        setIsSubmitting(false)

        if (json.ok) {
          setSuccess(`Batch ${cleanId} berhasil ditambahkan!`)
          onBatchesChange(prev => {
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
          setLogo(null)
          setUseLogoInReport(false)
          setLogoScale(1.0)
        } else {
          setError(json.error || "Gagal membuat batch baru.")
        }
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
        if (editingBatchId === batchId) {
          handleCancelEdit()
        }
      } else {
        setError(json.error || "Gagal menghapus batch.")
      }
    } catch (err) {
      setError("Gagal terhubung ke server saat menghapus batch.")
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all disabled:bg-slate-100 disabled:text-slate-400"
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
        {/* Form Add/Edit Batch */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">
              {editingBatchId ? `Edit Batch: ${editingBatchId}` : "Tambah Batch Baru"}
            </h2>
            {editingBatchId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer animate-none"
                title="Batal Edit"
              >
                <X size={15} />
              </button>
            )}
          </div>

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
              disabled={!!editingBatchId}
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

          {/* Custom Rectangular Logo Cropper */}
          <div>
            <label className={labelCls}>Logo Perusahaan (Opsional)</label>
            {rawImage ? (
              <div className="flex flex-col gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <p className="text-[11px] font-semibold text-slate-700">Geser dan tarik sudut-sudut kotak untuk memotong logo:</p>
                <div
                  className="mx-auto overflow-hidden relative bg-slate-900 border border-slate-300 rounded-xl select-none"
                  style={{
                    width: `${imgW}px`,
                    height: `${imgH}px`,
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                >
                  {/* Fitted Image background */}
                  <img
                    src={rawImage}
                    alt="Cropping Logo"
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Darkened Overlays surrounding cropBox */}
                  <div className="absolute bg-black/60 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: `${cropBox.y}px` }} />
                  <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${cropBox.y + cropBox.h}px`, left: 0, right: 0, bottom: 0 }} />
                  <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${cropBox.y}px`, left: 0, width: `${cropBox.x}px`, height: `${cropBox.h}px` }} />
                  <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${cropBox.y}px`, left: `${cropBox.x + cropBox.w}px`, right: 0, height: `${cropBox.h}px` }} />

                  {/* Draggable/Resizable Crop Box overlay */}
                  <div
                    className="absolute border-2 border-dashed border-white cursor-move"
                    style={{
                      left: `${cropBox.x}px`,
                      top: `${cropBox.y}px`,
                      width: `${cropBox.w}px`,
                      height: `${cropBox.h}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, "move")}
                  >
                    {/* Grid lines */}
                    <div className="absolute left-0 right-0 border-b border-white/30 pointer-events-none" style={{ top: "33.33%" }} />
                    <div className="absolute left-0 right-0 border-b border-white/30 pointer-events-none" style={{ top: "66.66%" }} />
                    <div className="absolute top-0 bottom-0 border-r border-white/30 pointer-events-none" style={{ left: "33.33%" }} />
                    <div className="absolute top-0 bottom-0 border-r border-white/30 pointer-events-none" style={{ left: "66.66%" }} />

                    {/* Corner Resize Handles */}
                    <div
                      className="absolute w-3.5 h-3.5 bg-white border border-slate-600 rounded-sm cursor-nwse-resize -left-1.5 -top-1.5 z-20"
                      onMouseDown={(e) => handleMouseDown(e, "resize-tl")}
                    />
                    <div
                      className="absolute w-3.5 h-3.5 bg-white border border-slate-600 rounded-sm cursor-nesw-resize -right-1.5 -top-1.5 z-20"
                      onMouseDown={(e) => handleMouseDown(e, "resize-tr")}
                    />
                    <div
                      className="absolute w-3.5 h-3.5 bg-white border border-slate-600 rounded-sm cursor-nesw-resize -left-1.5 -bottom-1.5 z-20"
                      onMouseDown={(e) => handleMouseDown(e, "resize-bl")}
                    />
                    <div
                      className="absolute w-3.5 h-3.5 bg-white border border-slate-600 rounded-sm cursor-nwse-resize -right-1.5 -bottom-1.5 z-20"
                      onMouseDown={(e) => handleMouseDown(e, "resize-br")}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRawImage(null)
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCrop}
                    className="flex-1 py-1.5 rounded-lg bg-[#01696f] text-white text-xs font-semibold hover:bg-[#015256] transition-colors cursor-pointer"
                  >
                    Potong &amp; Terapkan
                  </button>
                </div>
              </div>
            ) : logo ? (
              <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <img src={logo} alt="Logo Preview" className="w-12 h-12 object-contain bg-white rounded border border-slate-100 p-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 truncate">Logo terunggah</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 hover:border-[#01696f]/40 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-xs text-slate-500 font-medium">Klik untuk upload logo perusahaan</p>
                <p className="text-[10px] text-slate-400 mt-1">Maks. 2MB (format gambar)</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 py-2 px-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
            <input
              type="checkbox"
              id="useLogoInReport"
              checked={useLogoInReport}
              onChange={e => setUseLogoInReport(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#01696f] focus:ring-[#01696f] cursor-pointer"
            />
            <label htmlFor="useLogoInReport" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Gunakan Logo di Laporan
            </label>
          </div>

          {/* Real-time Header Preview & Scale Slider */}
          {useLogoInReport && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-[12px] font-bold text-slate-700">Preview Header Laporan</h3>
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm overflow-hidden select-none" style={{ width: "100%", fontFamily: "'Times New Roman', 'Georgia', serif" }}>
                <div className="flex items-center gap-3" style={{ fontSize: "9px" }}>
                  <img
                    src="/asisya-consulting.png"
                    alt="Asisya Left Logo"
                    className="w-10 h-10 object-contain shrink-0"
                  />
                  <div className="flex-1 text-center shrink-0">
                    <p className="font-bold text-[9px] tracking-wider text-slate-800 m-0">ASISYA PSYCHOLOGICAL CENTER</p>
                    <p className="text-[6px] text-slate-500 m-0 mt-0.5 leading-none">Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya</p>
                    <p className="text-[6px] text-slate-500 m-0 mt-0.5 leading-none">Surabaya - Jawa Timur</p>
                  </div>
                  {logo ? (
                    <img
                      src={logo}
                      alt="Batch Right Logo"
                      className="object-contain shrink-0"
                      style={{
                        width: `${40 * logoScale}px`,
                        height: `${40 * logoScale}px`
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 shrink-0 border border-dashed border-slate-300 rounded flex items-center justify-center text-[7px] text-slate-400">No Logo</div>
                  )}
                </div>
                <hr className="border-t border-slate-800 mt-2 mb-0" style={{ borderWidth: "1px" }} />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Kecil (0.5x)</span>
                  <span>Ukuran ({Math.round(logoScale * 100)}%)</span>
                  <span>Besar (1.5x)</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={logoScale}
                  onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#01696f]"
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Warna Label</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform duration-150 hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {editingBatchId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#16254c] text-white text-sm font-semibold hover:bg-[#0f1a38] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {!editingBatchId && <Plus size={15} />}
              {isSubmitting ? "Menyimpan..." : editingBatchId ? "Simpan Perubahan" : "Tambah Batch"}
            </button>
          </div>
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
                  <th className="px-5 py-3.5 text-right w-36">Aksi</th>
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {b.logo && (
                            <img
                              src={b.logo}
                              alt={`${b.name} logo`}
                              className="w-8 h-8 object-contain rounded border border-slate-200 p-0.5 bg-white shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{b.name}</p>
                            {b.useLogoInReport && (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700">
                                <Check size={10} /> Logo Aktif di Laporan
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{b.company}</td>
                      <td className="px-5 py-4 text-right">
                        {deleteConfirmId === b.id ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-colors shadow-sm cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(b)}
                              className="p-1.5 text-slate-400 hover:text-[#01696f] hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Batch"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(b.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Hapus Batch"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
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
