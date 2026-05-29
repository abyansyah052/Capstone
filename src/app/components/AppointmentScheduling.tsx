import { useState, useRef, useEffect } from "react"
import {
  Calendar, Clock, User, Mail, MessageCircle,
  Plus, ChevronLeft, ChevronRight, X, CheckCircle2,
  AlertCircle, XCircle, ClockIcon, ChevronDown,
  Stethoscope, FileText, Bell, CalendarCheck,
  MoreHorizontal, Pencil, Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ──────────────────────────────────────────────────────────────────────

type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled"
type NotifyChannel    = "none" | "whatsapp" | "email" | "both"

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

// ─── Constants ──────────────────────────────────────────────────────────────────

const DOCTORS: Doctor[] = [
  { id: "D1", name: "dr. Anita Rahayu, Sp.PD",  specialty: "Penyakit Dalam",           color: "#01696f" },
  { id: "D2", name: "dr. Budi Santoso, Sp.JP",  specialty: "Jantung & Pembuluh Darah", color: "#1e40af" },
  { id: "D3", name: "dr. Citra Dewi, Sp.A",     specialty: "Anak",                     color: "#be185d" },
  { id: "D4", name: "dr. Dimas Pratama, Sp.N",  specialty: "Neurologi",                color: "#6d28d9" },
]
const DOCTOR_MAP = Object.fromEntries(DOCTORS.map(d => [d.id, d]))

const APPOINTMENT_TYPES = [
  "Pemeriksaan Umum", "Kontrol & Tindak Lanjut",
  "Konsultasi", "Pemeriksaan Lab", "Vaksinasi", "Gawat Darurat",
]

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30",
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
    notify: "email", notifyPhone: "", notifyEmail: "slin@example.com",
  },
  {
    id: "4", patientId: "PT-6631-D", patientName: "Budi Santoso",
    date: TODAY, time: "15:00", doctorId: "D3", type: "Vaksinasi",
    status: "cancelled", notes: "Pasien tidak hadir",
    notify: "none", notifyPhone: "", notifyEmail: "",
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmtDateShort = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })

const fmtDateLong = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

const STATUS_META: Record<AppointmentStatus, {
  label: string; dotColor: string; textColor: string; bgColor: string
}> = {
  scheduled: { label: "Terjadwal",    dotColor: "#3b82f6", textColor: "#1d4ed8", bgColor: "#eff6ff" },
  confirmed: { label: "Dikonfirmasi", dotColor: "#22c55e", textColor: "#15803d", bgColor: "#f0fdf4" },
  completed: { label: "Selesai",      dotColor: "#94a3b8", textColor: "#475569", bgColor: "#f8fafc" },
  cancelled: { label: "Dibatalkan",   dotColor: "#f87171", textColor: "#b91c1c", bgColor: "#fef2f2" },
}

// ─── Validation ─────────────────────────────────────────────────────────────────

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
      e.notifyPhone = "Nomor WhatsApp wajib diisi."
    else if (!/^[0-9+\-\s().]{7,20}$/.test(form.notifyPhone.trim()))
      e.notifyPhone = "Format nomor tidak valid."
  }
  if (form.notify === "email" || form.notify === "both") {
    if (!form.notifyEmail.trim())
      e.notifyEmail = "Alamat email wajib diisi."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.notifyEmail.trim()))
      e.notifyEmail = "Format email tidak valid."
  }
  return e
}

// ─── Shared input styles ─────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/60 " +
  "focus:ring-2 focus:ring-[#01696f]/10 transition-all"

const inputErrCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-red-300 bg-red-50/40 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-red-400 " +
  "focus:ring-2 focus:ring-red-100 transition-all"

// ─── Field wrapper ───────────────────────────────────────────────────────────────

function Field({
  label, id, required, error, children,
}: {
  label: string; id?: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-slate-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            key="e"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.13 }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium overflow-hidden"
          >
            <AlertCircle size={10} className="flex-shrink-0" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Status chip — minimal dot + label, no colored box ──────────────────────────

function StatusChip({ status }: { status: AppointmentStatus }) {
  const m = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
      style={{ color: m.textColor }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: m.dotColor }} />
      {m.label}
    </span>
  )
}

// ─── Notify line — compact inline, no badge box ──────────────────────────────────

function NotifyLine({ channel, phone, email }: {
  channel: NotifyChannel; phone: string; email: string
}) {
  if (channel === "none") return null
  return (
    <span className="inline-flex items-center gap-2.5 text-[11px] text-slate-400">
      {(channel === "whatsapp" || channel === "both") && phone && (
        <span className="flex items-center gap-1">
          <MessageCircle size={10} className="text-green-500" />{phone}
        </span>
      )}
      {(channel === "email" || channel === "both") && email && (
        <span className="flex items-center gap-1">
          <Mail size={10} className="text-blue-400" />{email}
        </span>
      )}
    </span>
  )
}

// ─── Date Navigator ──────────────────────────────────────────────────────────────

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Hari sebelumnya"
      >
        <ChevronLeft size={14} />
      </button>

      {/* invisible date input layered under the text label */}
      <div className="relative">
        <input
          type="date" value={date}
          onChange={e => onChange(e.target.value)}
          className="opacity-0 absolute inset-0 w-full cursor-pointer"
          aria-label="Pilih tanggal"
        />
        <span className="px-2.5 py-1 text-sm font-semibold text-slate-800 pointer-events-none whitespace-nowrap">
          {date === TODAY
            ? <><span className="text-[#01696f]">Hari ini</span>{" · "}{fmtDateShort(date)}</>
            : fmtDateLong(date)
          }
        </span>
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Hari berikutnya"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Appointment Card ────────────────────────────────────────────────────────────

function AppointmentCard({
  apt, onStatusChange, onDelete,
}: {
  apt: Appointment
  onStatusChange: (id: string, s: AppointmentStatus) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const doc = DOCTOR_MAP[apt.doctorId]

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const isCancelled = apt.status === "cancelled"
  const isCompleted = apt.status === "completed"
  const canAdvance  = apt.status === "scheduled" || apt.status === "confirmed"
  const nextStatus: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
    scheduled: "confirmed", confirmed: "completed",
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={[
        "group relative bg-white rounded-xl border transition-all duration-150",
        isCancelled
          ? "border-slate-100 opacity-50"
          : "border-slate-200 hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]",
      ].join(" ")}
    >
      {/* doctor color rail */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[2.5px] rounded-full"
        style={{ backgroundColor: doc?.color ?? "#cbd5e1" }}
      />

      <div className="pl-4 pr-3.5 py-3 flex items-start gap-4">

        {/* ── Time column ── */}
        <div className="flex-shrink-0 w-11 pt-0.5 text-center">
          <p className="text-[13px] font-bold tabular-nums text-slate-800 leading-none">{apt.time}</p>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">

          {/* Name + status */}
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-[13px] font-semibold text-slate-900 leading-tight">
              {apt.patientName}
            </span>
            <span className="font-mono text-[10px] text-slate-400 tracking-wide">{apt.patientId}</span>
            <StatusChip status={apt.status} />
          </div>

          {/* Doctor + type — one line, muted */}
          <p className="text-[12px] text-slate-500 leading-snug">
            {doc?.name ?? apt.doctorId}
            <span className="mx-1.5 text-slate-300">·</span>
            {apt.type}
          </p>

          {/* Notify + notes — only if present */}
          {(apt.notify !== "none" || apt.notes) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <NotifyLine channel={apt.notify} phone={apt.notifyPhone} email={apt.notifyEmail} />
              {apt.notes && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400 italic">
                  <FileText size={9} className="text-slate-300" />{apt.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canAdvance && (
            <button
              onClick={() => onStatusChange(apt.id, nextStatus[apt.status]!)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold
                border border-[#01696f]/25 text-[#01696f] bg-[#01696f]/[0.04]
                hover:bg-[#01696f]/[0.09] transition-colors whitespace-nowrap"
            >
              {apt.status === "scheduled" ? "Konfirmasi" : "Selesai"}
            </button>
          )}

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              className="w-7 h-7 rounded flex items-center justify-center
                text-slate-300 hover:text-slate-600 hover:bg-slate-100
                opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Opsi"
            >
              <MoreHorizontal size={14} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 z-20 w-36 bg-white
                    rounded-lg border border-slate-200
                    shadow-[0_4px_16px_rgba(15,23,42,0.1)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px]
                      font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil size={11} /> Edit Janji
                  </button>
                  {!isCancelled && (
                    <button
                      onClick={() => { setOpen(false); onStatusChange(apt.id, "cancelled") }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px]
                        font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={11} /> Batalkan
                    </button>
                  )}
                  <div className="h-px bg-slate-100 mx-2" />
                  <button
                    onClick={() => { setOpen(false); onDelete(apt.id) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px]
                      font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={11} /> Hapus
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── New Appointment Drawer ──────────────────────────────────────────────────────

function NewApptDrawer({
  defaultDate, onClose, onSave,
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
  const [form, setForm]       = useState<NewApptForm>(EMPTY)
  const [errors, setErrors]   = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof NewApptForm, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = (k: keyof NewApptForm, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (touched[k] || submitted) {
      const e = validateAppt({ ...form, [k]: v })
      setErrors(p => ({ ...p, [k]: e[k] }))
    }
  }
  const blur = (k: keyof NewApptForm) => {
    setTouched(p => ({ ...p, [k]: true }))
    setErrors(p => ({ ...p, [k]: validateAppt(form)[k] }))
  }
  const err = (k: keyof NewApptForm) =>
    (touched[k] || submitted) ? errors[k] : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateAppt(form)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    onSave({
      id: String(Date.now()),
      patientId:   form.patientId.trim(),
      patientName: form.patientName.trim(),
      date: form.date, time: form.time,
      doctorId: form.doctorId, type: form.type,
      status: "scheduled",
      notes: form.notes.trim(),
      notify: form.notify,
      notifyPhone: form.notifyPhone.trim(),
      notifyEmail: form.notifyEmail.trim(),
    })
    onClose()
  }

  const showWA    = form.notify === "whatsapp" || form.notify === "both"
  const showEmail = form.notify === "email"    || form.notify === "both"

  // Notify channel options — segmented, not card grid
  const NOTIFY_OPTS: { val: NotifyChannel; label: string }[] = [
    { val: "none",     label: "Tidak" },
    { val: "whatsapp", label: "WhatsApp" },
    { val: "email",    label: "Email" },
    { val: "both",     label: "Keduanya" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-xl border border-slate-200
        shadow-[0_4px_24px_rgba(15,23,42,0.07)] overflow-hidden"
    >
      {/* Header — plain, no bg fill */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
        <p className="text-[13px] font-semibold text-slate-800">Jadwalkan Janji Baru</p>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center
            text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={13} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate
        className="overflow-y-auto max-h-[calc(100vh-13rem)]">
        <div className="px-5 py-4 flex flex-col gap-5">

          {/* ── Pasien ── */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Pasien
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID Pasien" id="f-pid" required error={err("patientId")}>
                <input id="f-pid" value={form.patientId}
                  onChange={e => set("patientId", e.target.value)}
                  onBlur={() => blur("patientId")}
                  placeholder="PT-XXXX-X"
                  className={`${err("patientId") ? inputErrCls : inputCls} font-mono`} />
              </Field>
              <Field label="Nama" id="f-pname" required error={err("patientName")}>
                <input id="f-pname" value={form.patientName}
                  onChange={e => set("patientName", e.target.value)}
                  onBlur={() => blur("patientName")}
                  placeholder="Nama lengkap"
                  className={err("patientName") ? inputErrCls : inputCls} />
              </Field>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* ── Jadwal ── */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Jadwal
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal" id="f-date" required error={err("date")}>
                <input id="f-date" type="date" value={form.date} min={TODAY}
                  onChange={e => set("date", e.target.value)}
                  onBlur={() => blur("date")}
                  className={err("date") ? inputErrCls : inputCls} />
              </Field>
              <Field label="Waktu" id="f-time" required error={err("time")}>
                <div className="relative">
                  <select id="f-time" value={form.time}
                    onChange={e => set("time", e.target.value)}
                    onBlur={() => blur("time")}
                    className={`${err("time") ? inputErrCls : inputCls} appearance-none pr-8`}>
                    <option value="" disabled>Pilih waktu</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
            <Field label="Dokter" id="f-doc" required error={err("doctorId")}>
              <div className="relative">
                <select id="f-doc" value={form.doctorId}
                  onChange={e => set("doctorId", e.target.value)}
                  onBlur={() => blur("doctorId")}
                  className={`${err("doctorId") ? inputErrCls : inputCls} appearance-none pr-8`}>
                  <option value="" disabled>Pilih dokter</option>
                  {DOCTORS.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Jenis Janji" id="f-type" required error={err("type")}>
              <div className="relative">
                <select id="f-type" value={form.type}
                  onChange={e => set("type", e.target.value)}
                  onBlur={() => blur("type")}
                  className={`${err("type") ? inputErrCls : inputCls} appearance-none pr-8`}>
                  <option value="" disabled>Pilih jenis</option>
                  {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Catatan" id="f-notes">
              <textarea id="f-notes" value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Instruksi khusus, keluhan pasien…"
                rows={2} maxLength={300}
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="h-px bg-slate-100" />

          {/* ── Notifikasi — segmented control, not card grid ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Notifikasi
              </span>
              <span className="text-[11px] text-slate-400">
                WA API · Google Calendar (.ics)
              </span>
            </div>

            {/* Segmented control */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
              {NOTIFY_OPTS.map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => set("notify", opt.val)}
                  className={[
                    "flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all",
                    form.notify === opt.val
                      ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                      : "text-slate-400 hover:text-slate-600",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Conditional inputs — slide in inline, no cards */}
            <AnimatePresence>
              {showWA && (
                <motion.div key="wa"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <Field label="Nomor WhatsApp" id="f-wa" required error={err("notifyPhone")}>
                    <div className="relative">
                      <MessageCircle size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                      <input id="f-wa" type="tel" inputMode="tel"
                        value={form.notifyPhone}
                        onChange={e => set("notifyPhone", e.target.value)}
                        onBlur={() => blur("notifyPhone")}
                        placeholder="+62 812 0000 0000"
                        className={`${err("notifyPhone") ? inputErrCls : inputCls} pl-9`} />
                    </div>
                  </Field>
                </motion.div>
              )}
              {showEmail && (
                <motion.div key="em"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <Field label="Alamat Email" id="f-email" required error={err("notifyEmail")}>
                    <div className="relative">
                      <Mail size={12}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                      <input id="f-email" type="email" inputMode="email"
                        value={form.notifyEmail}
                        onChange={e => set("notifyEmail", e.target.value)}
                        onBlur={() => blur("notifyEmail")}
                        placeholder="pasien@example.com"
                        className={`${err("notifyEmail") ? inputErrCls : inputCls} pl-9`} />
                    </div>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-[13px]
              font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button type="submit"
            className="flex-1 py-2 rounded-lg bg-[#16254c] text-white text-[13px]
              font-semibold flex items-center justify-center gap-1.5
              hover:bg-[#0f1a38] active:bg-[#0a1128] transition-colors shadow-sm">
            <CalendarCheck size={13} /> Simpan
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Summary bar — replaces the 4-box KPI grid ──────────────────────────────────

function SummaryBar({ apts }: { apts: Appointment[] }) {
  const total = apts.length
  if (total === 0) return null

  const counts = { scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 } as
    Record<AppointmentStatus, number>
  apts.forEach(a => counts[a.status]++)

  const segments: { status: AppointmentStatus; pct: number }[] =
    (["confirmed","scheduled","completed","cancelled"] as AppointmentStatus[])
      .map(s => ({ status: s, pct: (counts[s] / total) * 100 }))
      .filter(s => s.pct > 0)

  return (
    <div className="flex items-center gap-4">
      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100 flex">
        {segments.map(({ status, pct }) => (
          <div key={status}
            style={{ width: `${pct}%`, backgroundColor: STATUS_META[status].dotColor }}
            className="transition-all duration-500" />
        ))}
      </div>

      {/* Legend — only non-zero */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {(["confirmed","scheduled","completed","cancelled"] as AppointmentStatus[])
          .filter(s => counts[s] > 0)
          .map(s => (
            <span key={s} className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: STATUS_META[s].dotColor }} />
              {counts[s]} {STATUS_META[s].label}
            </span>
          ))
        }
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────────

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
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-5">

      {/* ── Header — editorial, not admin panel ── */}
      <div className="flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold text-[#01696f] uppercase tracking-widest mb-1">
            Penjadwalan
          </p>
          <h1 className="text-[22px] font-bold text-slate-900 leading-none">
            Janji Temu
          </h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={[
            "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all",
            showForm
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-[#16254c] text-white hover:bg-[#0f1a38] active:bg-[#0a1128] shadow-sm",
          ].join(" ")}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Tutup" : "Jadwalkan Baru"}
        </button>
      </div>

      {/* ── Date navigator + summary bar ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <DateNav date={selectedDate} onChange={setSelectedDate} />
          <span className="text-[12px] text-slate-400">
            {dayApts.length} janji temu
          </span>
        </div>
        <SummaryBar apts={dayApts} />
      </div>

      {/* ── Main grid ── */}
      <div className={`grid gap-5 items-start ${
        showForm ? "grid-cols-1 lg:grid-cols-[1fr_380px]" : "grid-cols-1"
      }`}>

        {/* ── List ── */}
        <div className="flex flex-col gap-3">

          {/* Toolbar — tab-style filter + doctor select on same row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              {(["all","scheduled","confirmed","completed","cancelled"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={[
                    "px-3 py-1.5 text-[12px] font-medium transition-colors relative whitespace-nowrap",
                    filterStatus === s
                      ? "text-slate-900"
                      : "text-slate-400 hover:text-slate-600",
                  ].join(" ")}
                >
                  {s === "all" ? "Semua" : STATUS_META[s].label}
                  {filterStatus === s && (
                    <motion.span
                      layoutId="filter-underline"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#01696f]"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={filterDoctor}
                onChange={e => setFilterDoctor(e.target.value)}
                className="text-[12px] pl-3 pr-7 py-1.5 rounded-lg border border-slate-200
                  bg-white text-slate-600 focus:outline-none focus:border-[#01696f]/40
                  appearance-none transition-colors"
              >
                <option value="">Semua Dokter</option>
                {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                className="py-14 flex flex-col items-start gap-3
                  bg-white rounded-xl border border-slate-100 px-8"
              >
                <p className="text-[13px] font-medium text-slate-400">
                  {dayApts.length > 0
                    ? "Tidak ada janji dengan filter ini."
                    : `Tidak ada jadwal untuk ${fmtDateShort(selectedDate)}.`
                  }
                </p>
                {dayApts.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-[12px] font-semibold text-[#01696f] hover:underline
                      underline-offset-2 transition-colors"
                  >
                    Jadwalkan sekarang →
                  </button>
                )}
              </motion.div>
            ) : (
              filtered.map(apt => (
                <AppointmentCard
                  key={apt.id} apt={apt}
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
