import { useState, useRef, useEffect } from "react"
import {
  Calendar, Clock, User, Phone, Mail, MessageCircle,
  Plus, ChevronLeft, ChevronRight, X, CheckCircle2,
  AlertCircle, XCircle, ClockIcon, ChevronDown,
  Stethoscope, FileText, Bell, CalendarCheck, ArrowLeft,
  MoreHorizontal, Pencil, Trash2, Send,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled"
type NotifyChannel    = "whatsapp" | "email" | "both" | "none"

interface Doctor {
  id: string
  name: string
  specialty: string
  color: string
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  doctorId: string
  type: string
  status: AppointmentStatus
  notes: string
  notify: NotifyChannel
  notifyPhone: string
  notifyEmail: string
}

interface NewApptForm {
  patientId: string
  patientName: string
  date: string
  time: string
  doctorId: string
  type: string
  notes: string
  notify: NotifyChannel
  notifyPhone: string
  notifyEmail: string
}

type FormErrors = Partial<Record<keyof NewApptForm, string>>

// ─── Constants ─────────────────────────────────────────────────────────────────

const DOCTORS: Doctor[] = [
  { id: "D1", name: "dr. Anita Rahayu, Sp.PD",   specialty: "Penyakit Dalam",  color: "#01696f" },
  { id: "D2", name: "dr. Budi Santoso, Sp.JP",   specialty: "Jantung & Pembuluh Darah", color: "#1e40af" },
  { id: "D3", name: "dr. Citra Dewi, Sp.A",      specialty: "Anak",            color: "#be185d" },
  { id: "D4", name: "dr. Dimas Pratama, Sp.N",   specialty: "Neurologi",       color: "#6d28d9" },
]

const DOCTOR_MAP = Object.fromEntries(DOCTORS.map(d => [d.id, d]))

const APPOINTMENT_TYPES = [
  "Pemeriksaan Umum",
  "Kontrol & Tindak Lanjut",
  "Konsultasi",
  "Pemeriksaan Lab",
  "Vaksinasi",
  "Gawat Darurat",
]

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
]

const TODAY = new Date().toISOString().split("T")[0]

const INIT_APPOINTMENTS: Appointment[] = [
  {
    id: "1", patientId: "PT-8842-A", patientName: "Eleanor James",
    date: TODAY, time: "09:00", doctorId: "D1", type: "Pemeriksaan Umum",
    status: "confirmed", notes: "Kontrol tekanan darah rutin",
    notify: "whatsapp", notifyPhone: "+62 812 0011 2233", notifyEmail: "",
  },
  {
    id: "2", patientId: "PT-9105-C", patientName: "Marcus Chen",
    date: TODAY, time: "10:30", doctorId: "D2", type: "Kontrol & Tindak Lanjut",
    status: "scheduled", notes: "Evaluasi hasil EKG",
    notify: "both", notifyPhone: "+62 813 9988 7766", notifyEmail: "m.chen99@example.com",
  },
  {
    id: "3", patientId: "PT-4421-B", patientName: "Sarah Lin",
    date: TODAY, time: "13:00", doctorId: "D1", type: "Konsultasi",
    status: "completed", notes: "Diskusi hasil lab",
    notify: "email", notifyPhone: "", notifyEmail: "slin_design@example.com",
  },
  {
    id: "4", patientId: "PT-6631-D", patientName: "Budi Santoso",
    date: TODAY, time: "15:00", doctorId: "D3", type: "Vaksinasi",
    status: "cancelled", notes: "Pasien tidak hadir",
    notify: "none", notifyPhone: "", notifyEmail: "",
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

const fmtDateShort = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

const STATUS_META: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  scheduled:  { label: "Terjadwal",   color: "#1e40af", bg: "#eff6ff", icon: <ClockIcon size={11} /> },
  confirmed:  { label: "Dikonfirmasi",color: "#15803d", bg: "#f0fdf4", icon: <CheckCircle2 size={11} /> },
  completed:  { label: "Selesai",     color: "#475569", bg: "#f1f5f9", icon: <CheckCircle2 size={11} /> },
  cancelled:  { label: "Dibatalkan",  color: "#b91c1c", bg: "#fef2f2", icon: <XCircle size={11} /> },
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateAppt(form: NewApptForm): FormErrors {
  const e: FormErrors = {}
  if (!form.patientId.trim())   e.patientId   = "ID pasien wajib diisi."
  if (!form.patientName.trim()) e.patientName = "Nama pasien wajib diisi."
  if (!form.date)               e.date        = "Tanggal wajib dipilih."
  else if (form.date < TODAY)   e.date        = "Tanggal tidak boleh di masa lalu."
  if (!form.time)               e.time        = "Waktu wajib dipilih."
  if (!form.doctorId)           e.doctorId    = "Dokter wajib dipilih."
  if (!form.type)               e.type        = "Jenis janji wajib dipilih."

  if (form.notify === "whatsapp" || form.notify === "both") {
    if (!form.notifyPhone.trim())
      e.notifyPhone = "Nomor WhatsApp wajib diisi untuk notifikasi WA."
    else if (!/^[0-9+\-\s().]{7,20}$/.test(form.notifyPhone.trim()))
      e.notifyPhone = "Format nomor tidak valid."
  }
  if (form.notify === "email" || form.notify === "both") {
    if (!form.notifyEmail.trim())
      e.notifyEmail = "Alamat email wajib diisi untuk notifikasi email."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.notifyEmail.trim()))
      e.notifyEmail = "Format email tidak valid."
  }
  return e
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/60 " +
  "focus:ring-2 focus:ring-[#01696f]/10 transition-all"

const inputErrCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-red-300 bg-red-50/30 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-red-400 " +
  "focus:ring-2 focus:ring-red-100 transition-all"

function Field({
  label, id, required, error, hint, children,
}: {
  label: string; id?: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium overflow-hidden"
          >
            <AlertCircle size={11} className="flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatusPill({ status }: { status: AppointmentStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      {m.icon}
      {m.label}
    </span>
  )
}

function NotifyBadge({ channel }: { channel: NotifyChannel }) {
  if (channel === "none") return null
  const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    whatsapp: { label: "WhatsApp", icon: <MessageCircle size={10} />, color: "#15803d" },
    email:    { label: "Email",    icon: <Mail size={10} />,          color: "#1e40af" },
    both:     { label: "WA + Email", icon: <Bell size={10} />,        color: "#6d28d9" },
  }
  const m = map[channel]
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
      style={{ backgroundColor: m.color }}>
      {m.icon} {m.label}
    </span>
  )
}

// ─── Date Navigator ────────────────────────────────────────────────────────────

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"
        aria-label="Hari sebelumnya"
      >
        <ChevronLeft size={15} />
      </button>
      <div className="relative">
        <input
          type="date"
          value={date}
          onChange={e => onChange(e.target.value)}
          className="opacity-0 absolute inset-0 w-full cursor-pointer"
          aria-label="Pilih tanggal"
        />
        <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap pointer-events-none">
          {date === TODAY ? "Hari ini · " : ""}{fmtDateShort(date)}
        </span>
      </div>
      <button
        onClick={() => onChange(addDays(date, 1))}
        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"
        aria-label="Hari berikutnya"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

// ─── Appointment Card ──────────────────────────────────────────────────────────

function AppointmentCard({
  apt,
  onStatusChange,
  onDelete,
}: {
  apt: Appointment
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const doctor = DOCTOR_MAP[apt.doctorId]

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const nextStatus: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
    scheduled: "confirmed",
    confirmed: "completed",
  }

  const next = nextStatus[apt.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-white rounded-xl border overflow-hidden transition-all ${
        apt.status === "cancelled" ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {/* Time stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: doctor?.color ?? "#94a3b8" }}
      />

      <div className="pl-4 pr-4 py-3.5">
        {/* Row 1 — time · status · actions */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Clock size={13} className="text-slate-400" />
              <span className="text-sm font-semibold tabular-nums">{apt.time}</span>
            </div>
            <StatusPill status={apt.status} />
            <NotifyBadge channel={apt.notify} />
          </div>

          <div className="flex items-center gap-1.5">
            {next && (
              <button
                onClick={() => onStatusChange(apt.id, next)}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#01696f]/30 text-[#01696f] bg-[#01696f]/[0.05] hover:bg-[#01696f]/[0.1] transition-all"
              >
                {next === "confirmed" ? "Konfirmasi" : "Tandai Selesai"}
              </button>
            )}

            {/* Overflow menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                aria-label="Opsi lainnya"
              >
                <MoreHorizontal size={15} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => { setMenuOpen(false) /* TODO: edit */ }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <Pencil size={12} /> Edit Janji
                    </button>
                    {apt.status !== "cancelled" && (
                      <button
                        onClick={() => { setMenuOpen(false); onStatusChange(apt.id, "cancelled") }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-all"
                      >
                        <XCircle size={12} /> Batalkan
                      </button>
                    )}
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(apt.id) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Row 2 — patient info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <User size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-800">{apt.patientName}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 ml-[18px]">{apt.patientId}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <Stethoscope size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-600 font-medium">{doctor?.name ?? apt.doctorId}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-[18px]">
              <span className="text-[11px] text-slate-400">{apt.type}</span>
            </div>
          </div>
        </div>

        {/* Row 3 — notification targets */}
        {apt.notify !== "none" && (
          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
            {(apt.notify === "whatsapp" || apt.notify === "both") && apt.notifyPhone && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <MessageCircle size={11} className="text-green-600" />
                {apt.notifyPhone}
              </span>
            )}
            {(apt.notify === "email" || apt.notify === "both") && apt.notifyEmail && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Mail size={11} className="text-blue-600" />
                {apt.notifyEmail}
              </span>
            )}
          </div>
        )}

        {/* Row 4 — notes */}
        {apt.notes && (
          <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-slate-100">
            <FileText size={11} className="text-slate-300 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-500 leading-relaxed">{apt.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── New Appointment Drawer ────────────────────────────────────────────────────

function NewApptDrawer({
  defaultDate,
  onClose,
  onSave,
}: {
  defaultDate: string
  onClose: () => void
  onSave: (apt: Appointment) => void
}) {
  const EMPTY: NewApptForm = {
    patientId: "", patientName: "", date: defaultDate,
    time: "", doctorId: "", type: "", notes: "",
    notify: "whatsapp", notifyPhone: "", notifyEmail: "",
  }
  const [form, setForm] = useState<NewApptForm>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof NewApptForm, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = (k: keyof NewApptForm, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (touched[k] || submitted) {
      const errs = validateAppt({ ...form, [k]: v })
      setErrors(p => ({ ...p, [k]: errs[k] }))
    }
  }

  const touch = (k: keyof NewApptForm) => {
    setTouched(p => ({ ...p, [k]: true }))
    const errs = validateAppt(form)
    setErrors(p => ({ ...p, [k]: errs[k] }))
  }

  const err = (k: keyof NewApptForm) => (touched[k] || submitted) ? errors[k] : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateAppt(form)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const apt: Appointment = {
      id: String(Date.now()),
      patientId:   form.patientId.trim(),
      patientName: form.patientName.trim(),
      date:        form.date,
      time:        form.time,
      doctorId:    form.doctorId,
      type:        form.type,
      status:      "scheduled",
      notes:       form.notes.trim(),
      notify:      form.notify,
      notifyPhone: form.notifyPhone.trim(),
      notifyEmail: form.notifyEmail.trim(),
    }
    onSave(apt)
    onClose()
  }

  const showWA    = form.notify === "whatsapp" || form.notify === "both"
  const showEmail = form.notify === "email"    || form.notify === "both"

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.08)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <CalendarCheck size={16} className="text-[#01696f]" />
          <p className="text-[13px] font-semibold text-slate-800">Jadwalkan Janji Baru</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          aria-label="Tutup"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="overflow-y-auto max-h-[calc(100vh-14rem)]">
        <div className="p-5 flex flex-col gap-5">

          {/* ── Informasi Pasien ── */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Informasi Pasien</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID Pasien" id="appt-pid" required error={err("patientId")}>
                <input
                  id="appt-pid"
                  value={form.patientId}
                  onChange={e => set("patientId", e.target.value)}
                  onBlur={() => touch("patientId")}
                  placeholder="PT-XXXX-X"
                  className={`${err("patientId") ? inputErrCls : inputCls} font-mono`}
                />
              </Field>
              <Field label="Nama Pasien" id="appt-pname" required error={err("patientName")}>
                <input
                  id="appt-pname"
                  value={form.patientName}
                  onChange={e => set("patientName", e.target.value)}
                  onBlur={() => touch("patientName")}
                  placeholder="Nama lengkap"
                  className={err("patientName") ? inputErrCls : inputCls}
                />
              </Field>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* ── Jadwal ── */}
          <section className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Jadwal</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal" id="appt-date" required error={err("date")}>
                <div className="relative">
                  <input
                    id="appt-date"
                    type="date"
                    value={form.date}
                    min={TODAY}
                    onChange={e => set("date", e.target.value)}
                    onBlur={() => touch("date")}
                    className={`${err("date") ? inputErrCls : inputCls} pr-9`}
                  />
                  <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Waktu" id="appt-time" required error={err("time")}>
                <div className="relative">
                  <select
                    id="appt-time"
                    value={form.time}
                    onChange={e => set("time", e.target.value)}
                    onBlur={() => touch("time")}
                    className={`${err("time") ? inputErrCls : inputCls} appearance-none pr-9`}
                  >
                    <option value="" disabled>Pilih waktu</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
            <Field label="Dokter" id="appt-doctor" required error={err("doctorId")}>
              <div className="relative">
                <select
                  id="appt-doctor"
                  value={form.doctorId}
                  onChange={e => set("doctorId", e.target.value)}
                  onBlur={() => touch("doctorId")}
                  className={`${err("doctorId") ? inputErrCls : inputCls} appearance-none pr-9`}
                >
                  <option value="" disabled>Pilih dokter</option>
                  {DOCTORS.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Jenis Janji Temu" id="appt-type" required error={err("type")}>
              <div className="relative">
                <select
                  id="appt-type"
                  value={form.type}
                  onChange={e => set("type", e.target.value)}
                  onBlur={() => touch("type")}
                  className={`${err("type") ? inputErrCls : inputCls} appearance-none pr-9`}
                >
                  <option value="" disabled>Pilih jenis</option>
                  {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Catatan" id="appt-notes">
              <textarea
                id="appt-notes"
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Instruksi khusus, keluhan pasien, dll."
                rows={2}
                maxLength={300}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </section>

          <div className="border-t border-slate-100" />

          {/* ── Notifikasi ── */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-[#01696f]" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Notifikasi Pasien</p>
            </div>
            <p className="text-[12px] text-slate-500 -mt-2">
              Kirim konfirmasi janji temu otomatis via WhatsApp atau undangan Google Calendar via email.
            </p>

            {/* Channel selector */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: "none",     label: "Tidak Ada",  icon: <X size={13} />,              desc: "Tanpa notifikasi" },
                { val: "whatsapp", label: "WhatsApp",   icon: <MessageCircle size={13} />,  desc: "Pesan WA otomatis" },
                { val: "email",    label: "Email",      icon: <Mail size={13} />,           desc: "Undangan Google Calendar" },
                { val: "both",     label: "Keduanya",   icon: <Bell size={13} />,           desc: "WA + Email" },
              ] as { val: NotifyChannel; label: string; icon: React.ReactNode; desc: string }[]).map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => set("notify", opt.val)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    form.notify === opt.val
                      ? "border-[#01696f]/50 bg-[#01696f]/[0.06] text-[#01696f]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={form.notify === opt.val ? "text-[#01696f]" : "text-slate-400"}>{opt.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold leading-none mb-0.5">{opt.label}</p>
                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Conditional fields */}
            <AnimatePresence>
              {showWA && (
                <motion.div
                  key="wa"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden"
                >
                  <Field label="Nomor WhatsApp" id="appt-wa" required error={err("notifyPhone")}>
                    <div className="relative">
                      <MessageCircle size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none" />
                      <input
                        id="appt-wa"
                        type="tel"
                        inputMode="tel"
                        value={form.notifyPhone}
                        onChange={e => set("notifyPhone", e.target.value)}
                        onBlur={() => touch("notifyPhone")}
                        placeholder="+62 812 0000 0000"
                        className={`${err("notifyPhone") ? inputErrCls : inputCls} pl-9`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Konfirmasi janji temu akan dikirim ke nomor ini via WhatsApp API.
                    </p>
                  </Field>
                </motion.div>
              )}
              {showEmail && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden"
                >
                  <Field label="Alamat Email" id="appt-email" required error={err("notifyEmail")}>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                      <input
                        id="appt-email"
                        type="email"
                        inputMode="email"
                        value={form.notifyEmail}
                        onChange={e => set("notifyEmail", e.target.value)}
                        onBlur={() => touch("notifyEmail")}
                        placeholder="pasien@example.com"
                        className={`${err("notifyEmail") ? inputErrCls : inputCls} pl-9`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Undangan Google Calendar (.ics) akan dikirim ke alamat email ini.
                    </p>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-2 px-5 py-4 bg-white border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-lg bg-[#16254c] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#0f1a38] active:bg-[#0a1128] transition-all shadow-sm"
          >
            <CalendarCheck size={14} />
            Simpan Janji
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Stats Row ──────────────────────────────────────────────────────────────────

function StatsRow({ apts }: { apts: Appointment[] }) {
  const counts: Record<AppointmentStatus, number> = {
    scheduled: 0, confirmed: 0, completed: 0, cancelled: 0,
  }
  apts.forEach(a => counts[a.status]++)

  const stats = [
    { label: "Terjadwal",    value: counts.scheduled,  color: "#1e40af", bg: "#eff6ff" },
    { label: "Dikonfirmasi", value: counts.confirmed,  color: "#15803d", bg: "#f0fdf4" },
    { label: "Selesai",      value: counts.completed,  color: "#475569", bg: "#f1f5f9" },
    { label: "Dibatalkan",   value: counts.cancelled,  color: "#b91c1c", bg: "#fef2f2" },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label}
          className="flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <span className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
          <span className="text-[11px] text-slate-500">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function AppointmentScheduling() {
  const [appointments, setAppointments] = useState<Appointment[]>(INIT_APPOINTMENTS)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [showForm, setShowForm]         = useState(false)
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all")
  const [filterDoctor, setFilterDoctor] = useState("")

  const dayApts = appointments.filter(a => a.date === selectedDate)

  const filtered = dayApts
    .filter(a => filterStatus === "all" || a.status === filterStatus)
    .filter(a => !filterDoctor || a.doctorId === filterDoctor)
    .sort((a, b) => a.time.localeCompare(b.time))

  const handleStatusChange = (id: string, status: AppointmentStatus) =>
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))

  const handleDelete = (id: string) =>
    setAppointments(prev => prev.filter(a => a.id !== id))

  const handleSave = (apt: Appointment) =>
    setAppointments(prev => [...prev, apt])

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Jadwal Janji Temu</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola, konfirmasi, dan pantau janji temu pasien.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
            showForm
              ? "bg-slate-100 text-slate-700 border border-slate-200"
              : "bg-[#16254c] text-white hover:bg-[#0f1a38] active:bg-[#0a1128]"
          }`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Tutup Form" : "Jadwalkan Baru"}
        </button>
      </div>

      {/* ── Date nav + stats ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <DateNav date={selectedDate} onChange={setSelectedDate} />
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{dayApts.length}</span> janji hari ini
          </span>
        </div>
        <StatsRow apts={dayApts} />
      </div>

      {/* ── Main grid ── */}
      <div className={`grid gap-5 items-start ${showForm ? "grid-cols-1 lg:grid-cols-[1fr_400px]" : "grid-cols-1"}`}>

        {/* ── Appointment list ── */}
        <div className="flex flex-col gap-4">

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-slate-400 font-medium">Filter:</span>
            {(["all", "scheduled", "confirmed", "completed", "cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filterStatus === s
                    ? "bg-[#01696f] text-white border-[#01696f]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {s === "all" ? "Semua" : STATUS_META[s].label}
              </button>
            ))}
            <div className="ml-auto">
              <div className="relative">
                <select
                  value={filterDoctor}
                  onChange={e => setFilterDoctor(e.target.value)}
                  className="text-xs pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#01696f]/50 appearance-none transition-all"
                >
                  <option value="">Semua Dokter</option>
                  {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Cards */}
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Calendar size={22} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">Tidak ada janji temu</p>
                <p className="text-xs text-slate-400 mt-1">
                  {dayApts.length > 0 ? "Coba ubah filter." : `Belum ada jadwal untuk ${fmtDateShort(selectedDate)}.`}
                </p>
                {dayApts.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16254c] text-white text-xs font-medium hover:bg-[#0f1a38] transition-all"
                  >
                    <Plus size={12} /> Jadwalkan Sekarang
                  </button>
                )}
              </motion.div>
            ) : (
              filtered.map(apt => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* ── Drawer ── */}
        <AnimatePresence>
          {showForm && (
            <NewApptDrawer
              key="drawer"
              defaultDate={selectedDate}
              onClose={() => setShowForm(false)}
              onSave={handleSave}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
