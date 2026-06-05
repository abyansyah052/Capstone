import { useState, useEffect } from "react"
import { Search, ChevronDown, X, Download, ChevronRight } from "lucide-react"
import { Psychologist, Patient, ReportForm, Batch } from "../../types"
import { ReportPreview } from "./ReportPreview"

const EMPTY_FORM: ReportForm = {
  namaLengkap: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  usia: "",
  pendidikan: "",
  anakKeberapa: "",
  jumlahSaudara: "",
  alamat: "",
  permasalahan: "",
  prosesKonseling: "",
  diagnosisKlinis: "",
  saranPengembangan: "",
  pasienKonseling: false,
  patientId: null,
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

type ReportCreatorProps = {
  onClose: () => void
  onSave: (name: string, form: ReportForm) => void
  patients?: Patient[]
  psychologists?: Psychologist[]
  batches?: Batch[]
}

export function ReportCreator({
  onClose,
  onSave,
  patients = [],
  psychologists = [],
  batches = [],
}: ReportCreatorProps) {
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const set = (k: keyof ReportForm, v: string) => setForm(p => ({ ...p, [k]: v }))
  useKeyClose(onClose)

  const [bioTab, setBioTab] = useState<"manual" | "database">("manual")
  const [importSearch, setImportSearch] = useState("")
  const [importBatchId, setImportBatchId] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(importSearch.toLowerCase())
    const matchesBatch = importBatchId === "" || p.batchId === importBatchId
    return matchesSearch && matchesBatch
  })

  const importPatient = (p: Patient) => {
    const genderLabel = p.gender === "F" ? "Perempuan" : p.gender === "M" ? "Laki-laki" : ""
    const dobISO = p.dateOfBirth ?? ""
    setForm(prev => ({
      ...prev,
      namaLengkap: p.name,
      tempatLahir: p.birthPlace ?? "",
      tanggalLahir: dobISO,
      jenisKelamin: genderLabel,
      usia: p.age ? String(p.age) : "",
      pendidikan: p.education ?? "",
      anakKeberapa: p.siblingOrder ?? "",
      jumlahSaudara: p.totalSiblings ?? "",
      alamat: p.fullAddress ?? p.city ?? "",
      pasienKonseling: prev.pasienKonseling,
      patientId: p.id,
    }))
    setImportSearch("")
    setSelectedPatientId(p.id)
  }

  const clearBiodata = () => {
    setForm(prev => ({
      ...prev,
      namaLengkap: "",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "",
      usia: "",
      pendidikan: "",
      anakKeberapa: "",
      jumlahSaudara: "",
      alamat: "",
      patientId: null,
    }))
    setSelectedPatientId(null)
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f] focus:ring-2 focus:ring-[#01696f]/10 transition-all"
  const labelCls = "text-[12px] font-medium text-slate-500 mb-1 block"
  const textareaCls = `${inputCls} resize-none leading-relaxed`

  const renderBiodataFields = (isDisabled: boolean) => (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelCls}>Nama Lengkap</label>
        <input disabled={isDisabled} value={form.namaLengkap} onChange={e => set("namaLengkap", e.target.value)} placeholder="[Nama Lengkap Pasien/Klien]" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Tempat Lahir</label>
        <input disabled={isDisabled} value={form.tempatLahir} onChange={e => set("tempatLahir", e.target.value)} placeholder="Kota" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Tanggal Lahir</label>
        <input disabled={isDisabled} type="date" value={form.tanggalLahir} onChange={e => set("tanggalLahir", e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Jenis Kelamin</label>
        <select disabled={isDisabled} value={form.jenisKelamin} onChange={e => set("jenisKelamin", e.target.value)} className={inputCls}>
          <option value="">Pilih</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Usia</label>
        <input disabled={isDisabled} value={form.usia} onChange={e => set("usia", e.target.value)} placeholder="Tahun" className={inputCls} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Pendidikan Terakhir</label>
        <input disabled={isDisabled} value={form.pendidikan} onChange={e => set("pendidikan", e.target.value)} placeholder="[Pendidikan Terakhir Klien]" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Anak Ke-</label>
        <input disabled={isDisabled} value={form.anakKeberapa} onChange={e => set("anakKeberapa", e.target.value)} placeholder="ke [ ]" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Dari [ ] Bersaudara</label>
        <input disabled={isDisabled} value={form.jumlahSaudara} onChange={e => set("jumlahSaudara", e.target.value)} placeholder="[ ] saudara" className={inputCls} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Alamat</label>
        <textarea disabled={isDisabled} value={form.alamat} onChange={e => set("alamat", e.target.value)} placeholder="[Alamat Lengkap]" rows={2} className={textareaCls} />
      </div>
      <div className="col-span-2 mt-1 py-1 px-3 border border-slate-100 rounded-lg bg-slate-50 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-700">Pasien Konseling (Riwayat Klinis)</span>
        <input
          type="checkbox"
          checked={!!form.pasienKonseling}
          onChange={e => setForm(p => ({ ...p, pasienKonseling: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-[#01696f] focus:ring-[#01696f]"
        />
      </div>
    </div>
  )

  const handleSave = () => {
    const name = form.namaLengkap.trim() || "Laporan Tanpa Nama"
    onSave(`Laporan_${name}.pdf`, form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f6f2] flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex-shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" aria-label="Tutup">
            <X size={17} />
          </button>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-900 truncate">Buat Laporan Psikologis</p>
            <p className="text-[11px] text-slate-400 hidden sm:block">Form akan otomatis mengisi preview di sebelah kanan</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onClose} className="hidden sm:flex px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">Batal</button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:scale-[0.97] transition-all shadow-sm"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Simpan ke Folder</span>
            <span className="sm:hidden">Simpan</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Form panel */}
        <div className="w-full lg:w-[420px] flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
          <div className="p-5 sm:p-6 flex flex-col gap-5">
            {/* Biodata */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#01696f]" />
                <p className="text-[13px] font-semibold text-slate-700">Bio data</p>
              </div>
              <div className="bg-[#01696f]/[0.045] rounded-2xl p-4 flex flex-col gap-3 border border-[#01696f]/[0.08]">
                {/* Tabs */}
                <div className="flex bg-slate-200/60 p-0.5 rounded-lg mb-2">
                  <button
                    type="button"
                    onClick={() => setBioTab("manual")}
                    className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      bioTab === "manual" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Isi Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioTab("database")}
                    className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      bioTab === "database" ? "bg-white text-[#01696f] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Cari di Database
                  </button>
                </div>

                {bioTab === "manual" ? (
                  renderBiodataFields(false)
                ) : selectedPatientId !== null ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-[#01696f]/10 px-3 py-2 rounded-xl">
                      <span className="text-[11px] text-[#01696f] font-semibold">Tersambung ke Database Pasien</span>
                      <button
                        type="button"
                        onClick={clearBiodata}
                        className="text-[10px] text-red-600 hover:text-red-700 font-bold transition-colors"
                      >
                        Putuskan &amp; Cari Lain
                      </button>
                    </div>
                    {renderBiodataFields(true)}
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-5 px-3 border border-dashed border-slate-200 rounded-xl bg-white">
                    <span className="text-[11px] text-slate-400 font-medium leading-relaxed block">Belum ada data pasien terdaftar di database. Silakan registrasi pasien terlebih dahulu.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={importSearch}
                          onChange={e => setImportSearch(e.target.value)}
                          placeholder="Cari nama..."
                          className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 focus:border-[#01696f] bg-white"
                        />
                      </div>
                      <div className="relative w-32 flex-shrink-0">
                        <select
                          value={importBatchId}
                          onChange={e => setImportBatchId(e.target.value)}
                          className="w-full pl-2.5 pr-6 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 focus:border-[#01696f] bg-white appearance-none text-slate-600 font-medium cursor-pointer"
                        >
                          <option value="">Semua Grup</option>
                          {batches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name.replace("Batch ", "")}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-60 border border-slate-100 rounded-xl bg-white divide-y divide-slate-50">
                      {filteredPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                          <p className="text-xs">Pasien tidak ditemukan</p>
                        </div>
                      ) : (
                        filteredPatients.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => importPatient(p)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: "#01696f" }}>
                              {p.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {p.age} th · {p.gender === "F" ? "Perempuan" : "Laki-laki"}
                                {p.city ? ` · ${p.city}` : ""}
                              </p>
                            </div>
                            <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Laporan */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#01696f]" />
                <p className="text-[13px] font-semibold text-slate-700">Laporan</p>
              </div>
              <div className="bg-[#01696f]/[0.045] rounded-2xl p-4 flex flex-col gap-3 border border-[#01696f]/[0.08]">
                <div>
                  <label className={labelCls}>Permasalahan Saat Ini</label>
                  <textarea value={form.permasalahan} onChange={e => set("permasalahan", e.target.value)} placeholder="(Deskripsi keluhan, gejala awal, dan permasalahan utama...)" rows={4} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Proses Konseling</label>
                  <textarea value={form.prosesKonseling} onChange={e => set("prosesKonseling", e.target.value)} placeholder="(Catatan perkembangan sesi konseling, dinamika psikologis...)" rows={4} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Diagnosis Klinis</label>
                  <textarea value={form.diagnosisKlinis} onChange={e => set("diagnosisKlinis", e.target.value)} placeholder="(Diagnosis klinis berdasarkan hasil asesmen psikologis)" rows={3} className={textareaCls} />
                </div>
                <div>
                  <label className={labelCls}>Saran Pengembangan dan Intervensi</label>
                  <textarea value={form.saranPengembangan} onChange={e => set("saranPengembangan", e.target.value)} placeholder="(Rekomendasi tindak lanjut, rencana intervensi lanjutan...)" rows={4} className={textareaCls} />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-auto bg-slate-300/80 flex items-start justify-center py-10 px-4 sm:px-8">
          <div style={{ transform: "scale(1)", transformOrigin: "top center", marginBottom: "80px" }}>
            <ReportPreview form={form} psychologists={psychologists} />
          </div>
        </div>
      </div>
    </div>
  )
}
export default ReportCreator;
