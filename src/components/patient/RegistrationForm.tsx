import React, { useState, useEffect, useRef } from "react"
import {
  Camera, CheckCircle2, Calendar as CalendarIcon,
  ChevronDown, ArrowLeft, Building2, Lock, AlertCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Patient, Batch, FormData } from "../../types"
import {
  calcAge, formatDate, toGenderCode, fromGenderCode,
  generateId, getInitials,
} from "../../lib/helpers"

type FormErrors = Partial<Record<keyof FormData, string>>

// Validation helper
function validateField(key: keyof FormData, value: string): string {
  switch (key) {
    case "fullName": {
      if (!value.trim()) return "Nama lengkap wajib diisi."
      if (value.trim().length < 2) return "Nama minimal 2 karakter."
      if (value.trim().length > 100) return "Nama maksimal 100 karakter."
      if (!/^[\p{L}\s'.,-]+$/u.test(value.trim()))
        return "Nama hanya boleh berisi huruf, spasi, dan tanda baca dasar."
      return ""
    }
    case "dateOfBirth": {
      if (!value) return "Tanggal lahir wajib diisi."
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) return "Format tanggal tidak valid."
      if (parsed > new Date()) return "Tanggal lahir tidak boleh di masa depan."
      const age = calcAge(value)
      if (age < 1)   return "Usia pasien kurang dari 1 tahun."
      if (age > 120) return "Tanggal lahir tidak masuk akal (usia > 120 tahun)."
      return ""
    }
    case "gender": {
      if (!value) return "Jenis kelamin wajib dipilih."
      return ""
    }
    case "phone": {
      if (!value.trim()) return "Nomor telepon wajib diisi."
      if (/[A-Za-z]/.test(value)) return "Nomor telepon tidak boleh berisi huruf."
      const digits = value.replace(/\D/g, "")
      if (digits.length < 7)  return "Nomor telepon minimal 7 digit."
      if (digits.length > 15) return "Nomor telepon maksimal 15 digit."
      if (!/^[0-9+\-\s().]+$/.test(value.trim()))
        return "Nomor telepon hanya boleh berisi angka, +, -, spasi, dan tanda kurung."
      return ""
    }
    case "email": {
      if (!value.trim()) return "" // opsional
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return "Format email tidak valid. Contoh: nama@domain.com"
      if (value.length > 254) return "Email terlalu panjang."
      return ""
    }
    case "occupation": {
      if (value.trim().length > 100) return "Pekerjaan/instansi maksimal 100 karakter."
      return ""
    }
    case "province": {
      if (!value.trim()) return ""
      if (!/^[\p{L}\s'.,-]+$/u.test(value.trim()))
        return "Provinsi hanya boleh berisi huruf dan spasi."
      if (value.trim().length > 60) return "Nama provinsi terlalu panjang."
      return ""
    }
    case "city": {
      if (!value.trim()) return "Kota wajib diisi."
      if (!/^[\p{L}\s'.,-]+$/u.test(value.trim()))
        return "Nama kota hanya boleh berisi huruf dan spasi."
      if (value.trim().length > 60) return "Nama kota terlalu panjang."
      return ""
    }
    case "fullAddress": {
      if (!value.trim()) return "Alamat lengkap wajib diisi."
      if (value.trim().length < 10) return "Alamat terlalu singkat, minimal 10 karakter."
      if (value.trim().length > 300) return "Alamat maksimal 300 karakter."
      return ""
    }
    default:
      return ""
  }
}

function validateAll(form: FormData): FormErrors {
  const keys: (keyof FormData)[] = [
    "fullName", "dateOfBirth", "gender", "phone",
    "email", "occupation", "province", "city", "fullAddress",
  ]
  const errs: FormErrors = {}
  for (const k of keys) {
    const msg = validateField(k, form[k] as string)
    if (msg) errs[k] = msg
  }
  return errs
}

// Styles
const inputCls =
  "px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/60 " +
  "focus:ring-2 focus:ring-[#01696f]/10 transition-all"

const inputErrCls =
  "px-3.5 py-2.5 rounded-lg border border-red-300 bg-red-50/30 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-red-400 " +
  "focus:ring-2 focus:ring-red-100 transition-all"

const disabledCls =
  "px-3.5 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"

function Field({ label, id, required, hint, error, children }: {
  label: string; id?: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-auto text-[11px] font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium"
          >
            <AlertCircle size={11} className="flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionCard({ title, badge, children }: {
  title: string; badge?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[13px] font-semibold text-slate-700">{title}</p>
        {badge}
      </div>
      <div className="p-5 flex flex-col gap-5">
        {children}
      </div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "#15803d" :
    value >= 40 ? "#b45309" :
    "#e11d48"

  const label =
    value >= 80 ? "Hampir selesai" :
    value >= 40 ? "Sebagian terisi" :
    "Perlu dilengkapi"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px] text-slate-500">Kelengkapan</span>
        <span className="text-[12px] font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px]" style={{ color }}>{label}</p>
    </div>
  )
}

type RegistrationFormProps = {
  initialPatient?: Patient | null
  batches: readonly Batch[] | Batch[]
  hideBack?: boolean
  onBack: () => void
  onSave: (p: Patient) => void
}

export function RegistrationForm({
  initialPatient = null,
  batches,
  hideBack = false,
  onBack,
  onSave,
}: RegistrationFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState<FormData>({
    fullName: initialPatient?.name ?? "",
    dateOfBirth: initialPatient?.dateOfBirth ?? "",
    gender: initialPatient ? fromGenderCode(initialPatient.gender) : "",
    occupation: initialPatient?.occupation ?? "",
    phone: initialPatient?.phone ?? "",
    email: initialPatient?.email ?? "",
    country: initialPatient?.country ?? "",
    province: initialPatient?.province ?? "",
    city: initialPatient?.city ?? "",
    fullAddress: initialPatient?.fullAddress ?? "",
    photo: initialPatient?.photo ?? null,
    batchId: initialPatient?.batchId ?? "",
    birthPlace: initialPatient?.birthPlace ?? "",
    education: initialPatient?.education ?? "",
    siblingOrder: initialPatient?.siblingOrder ?? "",
    totalSiblings: initialPatient?.totalSiblings ?? "",
  })

  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [completeness, setCompleteness] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (touched[key] || submitted) {
      const msg = validateField(key, val)
      setErrors(prev => ({ ...prev, [key]: msg }))
    }
  }

  const touch = (key: keyof FormData) => {
    if (touched[key]) return
    setTouched(prev => ({ ...prev, [key]: true }))
    const msg = validateField(key, form[key] as string)
    setErrors(prev => ({ ...prev, [key]: msg }))
  }

  useEffect(() => {
    const req = ["fullName", "dateOfBirth", "gender", "phone", "city", "fullAddress"]
    const filled = req.filter(k => form[k as keyof FormData]).length
    setCompleteness(Math.round((filled / req.length) * 100))
  }, [form])

  const age = form.dateOfBirth ? calcAge(form.dateOfBirth) : null

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(prev => ({ ...prev, photo: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const selectedBatch = batches.find(b => b.id === form.batchId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateAll(form)
    setErrors(errs)
    
    const allKeys: (keyof FormData)[] = [
      "fullName", "dateOfBirth", "gender", "phone",
      "email", "occupation", "province", "city", "fullAddress",
    ]
    
    // Force all fields to be touched to show visual red indicators
    const allTouched: Partial<Record<keyof FormData, boolean>> = {}
    allKeys.forEach(k => { allTouched[k] = true })
    setTouched(allTouched)

    // Check for missing required fields
    const missingFields: string[] = []
    if (!form.fullName.trim()) missingFields.push("Nama Lengkap")
    if (!form.dateOfBirth) missingFields.push("Tanggal Lahir")
    if (!form.gender) missingFields.push("Jenis Kelamin")
    if (!form.phone.trim()) missingFields.push("Nomor Telepon")
    if (!form.city.trim()) missingFields.push("Kota")
    if (!form.fullAddress.trim()) missingFields.push("Alamat Lengkap")

    if (missingFields.length > 0) {
      alert(`Kolom berikut wajib diisi:\n- ${missingFields.join("\n- ")}`);
      
      const keyMap: Record<string, keyof FormData> = {
        "Nama Lengkap": "fullName",
        "Tanggal Lahir": "dateOfBirth",
        "Jenis Kelamin": "gender",
        "Nomor Telepon": "phone",
        "Kota": "city",
        "Alamat Lengkap": "fullAddress"
      }
      const firstMissing = missingFields[0]
      const firstMissingKey = firstMissing ? keyMap[firstMissing] : undefined
      if (firstMissingKey) {
        const domId = firstMissingKey === "dateOfBirth" ? "dob" : firstMissingKey;
        const el = document.getElementById(domId)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          el.focus()
        }
      }
      return
    }

    // Check for validation errors on filled fields
    const invalidFields: string[] = []
    const labelMap: Record<keyof FormData, string> = {
      fullName: "Nama Lengkap",
      dateOfBirth: "Tanggal Lahir",
      gender: "Jenis Kelamin",
      phone: "Nomor Telepon",
      email: "Alamat Email",
      occupation: "Pekerjaan / Instansi",
      province: "Provinsi",
      city: "Kota",
      fullAddress: "Alamat Lengkap",
      country: "Negara",
      photo: "Foto",
      batchId: "Batch ID",
      birthPlace: "Tempat Lahir",
      education: "Pendidikan",
      siblingOrder: "Anak Ke-",
      totalSiblings: "Jumlah Saudara"
    }

    allKeys.forEach(k => {
      if (errs[k]) {
        invalidFields.push(labelMap[k] || String(k))
      }
    })

    if (invalidFields.length > 0) {
      const firstInvalidKey = allKeys.find(k => errs[k])
      if (firstInvalidKey && errs[firstInvalidKey]) {
        alert(`Data tidak valid pada kolom ${labelMap[firstInvalidKey] || String(firstInvalidKey)}:\n${errs[firstInvalidKey]}`)
        const domId = firstInvalidKey === "dateOfBirth" ? "dob" : firstInvalidKey;
        const el = document.getElementById(domId)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          el.focus()
        }
      }
      return
    }

    const savedPatient: Patient = {
      id:           initialPatient?.id ?? String(Date.now()),
      name:         form.fullName,
      email:        form.email,
      idNumber:     initialPatient?.idNumber ?? generateId(),
      age:          age ?? 0,
      gender:       toGenderCode(form.gender),
      phone:        form.phone,
      registeredAt: initialPatient?.registeredAt ?? new Date().toISOString().slice(0, 10),
      hasPhoto:     !!form.photo,
      initials:     getInitials(form.fullName),
      batchId:      form.batchId,
      birthPlace:    form.birthPlace,
      education:     form.education,
      siblingOrder:  form.siblingOrder,
      totalSiblings: form.totalSiblings,
      
      dateOfBirth:  form.dateOfBirth,
      occupation:   form.occupation,
      country:      form.country,
      province:     form.province,
      city:         form.city,
      fullAddress:  form.fullAddress,
      photo:        form.photo,
    }
    onSave(savedPatient)
  }

  const err = (key: keyof FormData) =>
    (touched[key] || submitted) ? errors[key] : undefined

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        {!hideBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
            aria-label="Kembali"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {initialPatient ? "Edit Data Pasien" : "Registrasi Pasien Baru"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Kolom bertanda <span className="text-red-500">*</span> wajib diisi.</p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-20"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Left column */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* Data Pribadi */}
          <SectionCard title="Data Pribadi">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" id="fullName" required error={err("fullName")}>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={e => set("fullName", e.target.value)}
                  onBlur={() => touch("fullName")}
                  placeholder="contoh: Budi Santoso"
                  className={err("fullName") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Tanggal Lahir" id="dob" required error={err("dateOfBirth")}>
                <div className="relative">
                  <input
                    id="dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => set("dateOfBirth", e.target.value)}
                    onBlur={() => touch("dateOfBirth")}
                    max={new Date().toISOString().split("T")[0]}
                    className={`${err("dateOfBirth") ? inputErrCls : inputCls} w-full pr-10`}
                  />
                  <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Usia" hint="Otomatis">
                <div className="relative flex items-center">
                  <input
                    disabled
                    value={age !== null ? `${age} tahun${form.dateOfBirth ? "  ·  " + formatDate(form.dateOfBirth) : ""}` : ""}
                    placeholder="Terhitung dari tanggal lahir"
                    className={`${disabledCls} w-full pr-9`}
                  />
                  <Lock size={12} className="absolute right-3 text-slate-300 pointer-events-none" />
                </div>
              </Field>
              <Field label="Jenis Kelamin" id="gender" required error={err("gender")}>
                <div className="relative">
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={e => set("gender", e.target.value)}
                    onBlur={() => touch("gender")}
                    className={`${err("gender") ? inputErrCls : inputCls} w-full appearance-none pr-9`}
                  >
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="female">Perempuan</option>
                    <option value="male">Laki-laki</option>
                    <option value="other">Lainnya</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Pekerjaan / Instansi" id="occupation" error={err("occupation")}>
                <input
                  id="occupation"
                  value={form.occupation}
                  onChange={e => set("occupation", e.target.value)}
                  onBlur={() => touch("occupation")}
                  placeholder="Jabatan, nama instansi"
                  maxLength={100}
                  className={err("occupation") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Tempat Lahir" id="birthPlace">
                <input
                  id="birthPlace"
                  value={form.birthPlace}
                  onChange={e => set("birthPlace", e.target.value)}
                  placeholder="contoh: Surabaya"
                  maxLength={60}
                  className={`${inputCls} w-full`}
                />
              </Field>
              <Field label="Pendidikan Terakhir" id="education">
                <div className="relative">
                  <select
                    id="education"
                    value={form.education}
                    onChange={e => set("education", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}
                  >
                    <option value="">Pilih pendidikan</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1 / D4</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Anak Ke-" id="siblingOrder">
                <input
                  id="siblingOrder"
                  type="number"
                  min={1}
                  value={form.siblingOrder}
                  onChange={e => set("siblingOrder", e.target.value)}
                  placeholder="contoh: 2"
                  className={`${inputCls} w-full`}
                />
              </Field>
              <Field label="Dari [ ] Bersaudara" id="totalSiblings">
                <input
                  id="totalSiblings"
                  type="number"
                  min={1}
                  value={form.totalSiblings}
                  onChange={e => set("totalSiblings", e.target.value)}
                  placeholder="contoh: 3"
                  className={`${inputCls} w-full`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Batch */}
          <SectionCard
            title="Batch / Grup"
            badge={
              selectedBatch ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                  style={{ backgroundColor: selectedBatch.color }}>
                  <Building2 size={10} />
                  {selectedBatch.id}
                </span>
              ) : undefined
            }
          >
            <Field label="Pilih Batch" id="batchId">
              <div className="relative">
                <select id="batchId" value={form.batchId} onChange={e => set("batchId", e.target.value)}
                  className={`${inputCls} w-full appearance-none pr-9`}>
                  <option value="">— Pilih batch (opsional) —</option>
                  {batches.filter(b => !b.deleted || b.id === form.batchId).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.company} {b.deleted ? " (Nonaktif)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <AnimatePresence>
              {selectedBatch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border mt-1"
                    style={{ backgroundColor: selectedBatch.color + "10", borderColor: selectedBatch.color + "30" }}>
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: selectedBatch.color }} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedBatch.name}</p>
                      <p className="text-xs text-slate-500">{selectedBatch.company}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* Kontak */}
          <SectionCard title="Informasi Kontak">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nomor Telepon" id="phone" required error={err("phone")}>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  onBlur={() => touch("phone")}
                  placeholder="+62 812 0000 0000"
                  className={err("phone") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Alamat Email" id="email" error={err("email")}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  onBlur={() => touch("email")}
                  placeholder="pasien@example.com"
                  className={err("email") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Alamat */}
          <SectionCard title="Alamat">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Negara" id="country">
                <div className="relative">
                  <select id="country" value={form.country} onChange={e => set("country", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="">Pilih negara</option>
                    <option value="ID">Indonesia</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapura</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Provinsi" id="province" error={err("province")}>
                <input
                  id="province"
                  value={form.province}
                  onChange={e => set("province", e.target.value)}
                  onBlur={() => touch("province")}
                  placeholder="contoh: Jawa Timur"
                  className={err("province") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
              <Field label="Kota" id="city" required error={err("city")}>
                <input
                  id="city"
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  onBlur={() => touch("city")}
                  placeholder="contoh: Surabaya"
                  className={err("city") ? `${inputErrCls} w-full` : `${inputCls} w-full`}
                />
              </Field>
            </div>
            <Field label="Alamat Lengkap" id="fullAddress" required error={err("fullAddress")}>
              <textarea
                id="fullAddress"
                value={form.fullAddress}
                onChange={e => set("fullAddress", e.target.value)}
                onBlur={() => touch("fullAddress")}
                placeholder="Jl. Raya No. 123, Kec. …"
                rows={3}
                maxLength={300}
                className={`${err("fullAddress") ? inputErrCls : inputCls} w-full resize-none`}
              />
              <span className="text-[11px] text-slate-400 self-end">
                {form.fullAddress.length}/300
              </span>
            </Field>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">

          {/* Photo upload */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Foto Pasien</p>
            </div>
            <div className="p-5 flex flex-col gap-3 items-center">
              <motion.div
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                onClick={() => fileRef.current?.click()}
                className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#01696f]/40 hover:bg-[#01696f]/[0.03] transition-all cursor-pointer overflow-hidden"
              >
                {form.photo ? (
                  <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Camera size={18} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Unggah Foto</span>
                  </div>
                )}
              </motion.div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <p className="text-[11px] text-slate-400 text-center">JPG, PNG · Maks. 5 MB<br />Opsional — untuk identifikasi internal</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Ringkasan</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-slate-500">Status</span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Draft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-slate-500">Tanggal</span>
                  <span className="text-[13px] font-medium text-slate-700">
                    {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                {selectedBatch && (
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-slate-500">Batch</span>
                    <span className="text-xs font-semibold text-white px-2 py-0.5 rounded"
                      style={{ backgroundColor: selectedBatch.color }}>
                      {selectedBatch.id}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100" />
              <ProgressBar value={completeness} />

              {/* Error summary */}
              <AnimatePresence>
                {submitted && Object.values(errors).some(Boolean) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                      <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-600 font-medium leading-relaxed">
                        Terdapat {Object.values(errors).filter(Boolean).length} field yang perlu diperbaiki sebelum menyimpan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-[#16254c] text-white hover:bg-[#0f1a38] active:bg-[#0a1128] shadow-sm"
            >
              <CheckCircle2 size={15} />
              {initialPatient ? "Simpan Perubahan" : "Selesaikan Registrasi"}
            </button>
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all"
            >
              Simpan sebagai Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
