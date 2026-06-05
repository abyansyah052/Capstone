import React, { useState, useRef, useEffect, useMemo } from "react"
import {
  ChevronLeft, ChevronRight, Plus, X,
  AlertCircle, ChevronDown, FileText,
  CalendarCheck, Trash2, MessageCircle, Mail,
  Clock, Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled"
type NotifyChannel    = "none" | "whatsapp" | "email" | "both"

interface Doctor { id: string; name: string; specialty: string; color: string }

interface Appointment {
  id: string; patientId: string; patientName: string
  date: string; time: string; duration: number          // minutes
  doctorId: string; type: string; status: AppointmentStatus
  notes: string; notify: NotifyChannel
  notifyPhone: string; notifyEmail: string
}

interface NewApptForm {
  patientId: string; patientName: string; date: string
  time: string; duration: string; doctorId: string
  type: string; notes: string; notify: NotifyChannel
  notifyPhone: string; notifyEmail: string
}

type FormErrors = Partial<Record<keyof NewApptForm, string>>

const DOCTORS: Doctor[] = [
  { id: "D1", name: "dr. Anita Rahayu, Sp.PD",  specialty: "Penyakit Dalam",           color: "#0d9488" },
  { id: "D2", name: "dr. Budi Santoso, Sp.JP",  specialty: "Jantung & Pembuluh Darah", color: "#2563eb" },
  { id: "D3", name: "dr. Citra Dewi, Sp.A",     specialty: "Anak",                     color: "#db2777" },
  { id: "D4", name: "dr. Dimas Pratama, Sp.N",  specialty: "Neurologi",                color: "#7c3aed" },
]
const DOCTOR_MAP = Object.fromEntries(DOCTORS.map(d => [d.id, d]))

const APPOINTMENT_TYPES = [
  "Pemeriksaan Umum", "Kontrol & Tindak Lanjut",
  "Konsultasi", "Pemeriksaan Lab", "Vaksinasi", "Gawat Darurat",
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 64

function getToday() {
  return new Date().toISOString().split("T")[0]!
}

const INIT_APPOINTMENTS: Appointment[] = [
  {
    id: "1", patientId: "PT-8842-A", patientName: "Eleanor James",
    date: getToday(), time: "09:00", duration: 30, doctorId: "D1",
    type: "Pemeriksaan Umum", status: "confirmed",
    notes: "Kontrol tekanan darah rutin",
    notify: "whatsapp", notifyPhone: "+62 812 0011 2233", notifyEmail: "",
  },
  {
    id: "2", patientId: "PT-9105-C", patientName: "Marcus Chen",
    date: getToday(), time: "10:30", duration: 45, doctorId: "D2",
    type: "Kontrol & Tindak Lanjut", status: "scheduled",
    notes: "Evaluasi hasil EKG",
    notify: "both", notifyPhone: "+62 813 9988 7766", notifyEmail: "m.chen99@example.com",
  },
  {
    id: "3", patientId: "PT-4421-B", patientName: "Sarah Lin",
    date: getToday(), time: "13:00", duration: 30, doctorId: "D1",
    type: "Konsultasi", status: "completed",
    notes: "Diskusi hasil lab",
    notify: "email", notifyPhone: "", notifyEmail: "slin@example.com",
  },
  {
    id: "4", patientId: "PT-6631-D", patientName: "Budi Santoso",
    date: getToday(), time: "15:00", duration: 30, doctorId: "D3",
    type: "Vaksinasi", status: "cancelled",
    notes: "Pasien tidak hadir",
    notify: "none", notifyPhone: "", notifyEmail: "",
  },
  {
    id: "5", patientId: "PT-1102-A", patientName: "Rina Hartono",
    date: getToday(), time: "11:00", duration: 30, doctorId: "D4",
    type: "Konsultasi", status: "scheduled",
    notes: "",
    notify: "none", notifyPhone: "", notifyEmail: "",
  },
]

const STATUS_META: Record<AppointmentStatus, {
  label: string; dot: string; text: string; bg: string; border: string; gridBg: string
}> = {
  scheduled: {
    label: "Terjadwal",
    dot: "#3b82f6", text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", gridBg: "#dbeafe",
  },
  confirmed: {
    label: "Dikonfirmasi",
    dot: "#10b981", text: "#047857", bg: "#ecfdf5", border: "#a7f3d0", gridBg: "#d1fae5",
  },
  completed: {
    label: "Selesai",
    dot: "#94a3b8", text: "#475569", bg: "#f8fafc", border: "#e2e8f0", gridBg: "#f1f5f9",
  },
  cancelled: {
    label: "Dibatalkan",
    dot: "#f87171", text: "#b91c1c", bg: "#fff1f2", border: "#fecaca", gridBg: "#fee2e2",
  },
}

const fmtDateShort = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  })

const fmtDateLong = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const fmtWeekday = (iso: string) => {
  const day = new Date(iso + "T00:00:00").getDay()
  return WEEKDAY_SHORT[day]!
}

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]!
}

const startOfWeek = (iso: string) => {
  const d = new Date(iso + "T00:00:00")
  const day = d.getDay()
  const offset = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - offset)
  return d.toISOString().split("T")[0]!
}

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

interface LayoutCol { colIndex: number; colCount: number }
function computeLayout(apts: Appointment[]): Map<string, LayoutCol> {
  const result = new Map<string, LayoutCol>()
  const sorted = [...apts].sort((a, b) => {
    const diff = timeToMinutes(a.time) - timeToMinutes(b.time)
    return diff !== 0 ? diff : a.id.localeCompare(b.id)
  })

  const clusters: Appointment[][] = []
  for (const apt of sorted) {
    const aptStart = timeToMinutes(apt.time)
    let placed = false
    for (const cluster of clusters) {
      const clusterEnd = Math.max(...cluster.map(a => timeToMinutes(a.time) + a.duration))
      if (aptStart < clusterEnd) {
        cluster.push(apt)
        placed = true
        break
      }
    }
    if (!placed) clusters.push([apt])
  }

  for (const cluster of clusters) {
    const cols: Array<{ end: number; ids: string[] }> = []
    for (const apt of cluster) {
      const aptStart = timeToMinutes(apt.time)
      const aptEnd   = aptStart + apt.duration
      let assigned = false
      for (const col of cols) {
        if (aptStart >= col.end) {
          col.end = aptEnd
          col.ids.push(apt.id)
          assigned = true
          break
        }
      }
      if (!assigned) cols.push({ end: aptEnd, ids: [apt.id] })
    }
    cols.forEach((col, colIndex) => {
      col.ids.forEach(id => result.set(id, { colIndex, colCount: cols.length }))
    })
  }

  return result
}

function validateAppt(form: NewApptForm, today: string): FormErrors {
  const e: FormErrors = {}
  if (!form.patientId.trim())   e.patientId   = "ID pasien wajib diisi."
  if (!form.patientName.trim()) e.patientName = "Nama pasien wajib diisi."
  if (!form.date)               e.date        = "Tanggal wajib dipilih."
  else if (form.date < today)   e.date        = "Tanggal tidak boleh di masa lalu."
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

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-teal-500/50 " +
  "focus:ring-2 focus:ring-teal-500/10 transition-all"

const inputErrCls =
  "w-full px-3 py-2 rounded-md border border-red-300 bg-red-50/40 text-[13px] text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:border-red-400 " +
  "focus:ring-2 focus:ring-red-100 transition-all"

function Field({
  label, id, required, error, children,
}: {
  label: string; id?: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-medium text-slate-600">
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
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium overflow-hidden"
          >
            <AlertCircle size={9} className="flex-shrink-0" />{error}
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
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{ color: m.text, backgroundColor: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
  )
}

function MiniCalendar({
  selected, onSelect, appointments, today,
}: {
  selected: string
  onSelect: (d: string) => void
  appointments: Appointment[]
  today: string
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selected + "T00:00:00")
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    const d = new Date(selected + "T00:00:00")
    const newYear  = d.getFullYear()
    const newMonth = d.getMonth()
    setViewMonth(prev => {
      if (prev.year === newYear && prev.month === newMonth) return prev
      return { year: newYear, month: newMonth }
    })
  }, [selected])

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()
  const firstDay = new Date(viewMonth.year, viewMonth.month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const apptDays = new Set(
    appointments
      .filter(a => {
        const d = new Date(a.date + "T00:00:00")
        return d.getFullYear() === viewMonth.year && d.getMonth() === viewMonth.month
      })
      .map(a => new Date(a.date + "T00:00:00").getDate())
  )

  const DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1)
    .toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  const prevMonth = () => setViewMonth(v => {
    const d = new Date(v.year, v.month - 1, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const nextMonth = () => setViewMonth(v => {
    const d = new Date(v.year, v.month + 1, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[12px] font-semibold text-slate-700 capitalize">{monthLabel}</span>
        <div className="flex gap-0.5">
          <button onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronLeft size={12} />
          </button>
          <button onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const iso = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isSelected = iso === selected
          const isToday    = iso === today
          const hasDot     = apptDays.has(day)
          return (
            <button
              key={day}
              onClick={() => onSelect(iso)}
              className={[
                "relative w-full aspect-square flex items-center justify-center rounded-full",
                "text-[12px] font-medium transition-all",
                isSelected
                  ? "bg-teal-600 text-white"
                  : isToday
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              {day}
              {hasDot && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekStrip({
  selected, onSelect, appointments, today,
}: {
  selected: string
  onSelect: (d: string) => void
  appointments: Appointment[]
  today: string
}) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(selected)
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [selected])

  const countMap: Record<string, number> = {}
  appointments.forEach(a => { countMap[a.date] = (countMap[a.date] ?? 0) + 1 })

  return (
    <div className="flex items-stretch gap-0.5 bg-white border border-slate-200 rounded-xl p-1">
      {days.map(day => {
        const isSelected = day === selected
        const isToday    = day === today
        const count      = countMap[day] ?? 0
        const d          = new Date(day + "T00:00:00")
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            className={[
              "flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all",
              isSelected
                ? "bg-teal-600 text-white shadow-sm"
                : isToday
                ? "bg-teal-50 text-teal-700"
                : "hover:bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            <span className={[
              "text-[10px] font-semibold uppercase tracking-wide",
              isSelected ? "text-teal-100" : "text-slate-400",
            ].join(" ")}>
              {fmtWeekday(day)}
            </span>
            <span className={[
              "text-[14px] font-bold leading-none",
              isSelected ? "text-white" : isToday ? "text-teal-600" : "text-slate-800",
            ].join(" ")}>
              {d.getDate()}
            </span>
            {count > 0 && (
              <span className={[
                "text-[9px] font-semibold leading-none",
                isSelected ? "text-teal-200" : "text-teal-500",
              ].join(" ")}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function TimeGrid({
  appointments, date, today, onStatusChange, onDelete, onNewAtTime,
}: {
  appointments: Appointment[]
  date: string
  today: string
  onStatusChange: (id: string, s: AppointmentStatus) => void
  onDelete: (id: string) => void
  onNewAtTime: (time: string) => void
}) {
  const dayApts = appointments
    .filter(a => a.date === date)
    .sort((a, b) => a.time.localeCompare(b.time))

  const layoutMap = useMemo(() => computeLayout(dayApts), [dayApts])

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isToday = date === today
  const showNow = isToday
  const nowTop  = (nowMin / 60) * SLOT_HEIGHT

  const isEmpty = dayApts.length === 0
  const totalGridHeight = HOURS.length * SLOT_HEIGHT

  return (
    <div className="relative flex">
      <div className="flex-shrink-0 w-12">
        {HOURS.map(h => (
          <div key={h} style={{ height: SLOT_HEIGHT }}
            className="flex items-start justify-end pr-3 pt-1">
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 relative border-l border-slate-200">
        {HOURS.map((h, i) => (
          <div
            key={h}
            style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
            className="absolute left-0 right-0 border-t border-slate-100"
          >
            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-100" />
            <div
              className="absolute inset-0 hover:bg-teal-50/30 cursor-pointer transition-colors"
              onClick={() => onNewAtTime(`${String(h).padStart(2, "0")}:00`)}
              title={`Jadwalkan jam ${String(h).padStart(2, "0")}:00`}
            />
          </div>
        ))}

        {isEmpty && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ top: SLOT_HEIGHT * 6 }}
          >
            <Calendar size={28} className="text-slate-200" />
            <p className="text-[12px] text-slate-300 font-medium">Tidak ada janji di hari ini</p>
            <p className="text-[11px] text-slate-200">Klik area jam untuk menjadwalkan</p>
          </div>
        )}

        {showNow && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: nowTop }}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
            <div className="flex-1 h-px bg-red-400" />
          </div>
        )}

        {dayApts.map(apt => {
          const startMin = timeToMinutes(apt.time)
          const top    = (startMin / 60) * SLOT_HEIGHT
          const height = Math.max((apt.duration / 60) * SLOT_HEIGHT, 24)
          const doc    = DOCTOR_MAP[apt.doctorId]
          const m      = STATUS_META[apt.status]
          const isCancelled = apt.status === "cancelled"
          const layout = layoutMap.get(apt.id) ?? { colIndex: 0, colCount: 1 }

          return (
            <GridBlock
              key={apt.id}
              apt={apt}
              top={top}
              height={height}
              totalGridHeight={totalGridHeight}
              layout={layout}
              doc={doc}
              m={m}
              isCancelled={isCancelled}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          )
        })}
      </div>
    </div>
  )
}

function GridBlock({
  apt, top, height, totalGridHeight, layout, doc, m, isCancelled, onStatusChange, onDelete,
}: {
  apt: Appointment
  top: number; height: number
  totalGridHeight: number
  layout: { colIndex: number; colCount: number }
  doc: Doctor | undefined
  m: typeof STATUS_META[AppointmentStatus]
  isCancelled: boolean
  onStatusChange: (id: string, s: AppointmentStatus) => void
  onDelete: (id: string) => void
}) {
  const [detail, setDetail] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)

  const GAP = 3
  const colW  = 100 / layout.colCount
  const left  = `calc(${layout.colIndex * colW}% + ${GAP}px)`
  const width = `calc(${colW}% - ${GAP * 2}px)`

  const popupBelow = top + height < totalGridHeight * 0.6

  const nextStatus: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
    scheduled: "confirmed",
    confirmed: "completed",
  }
  const canAdvance = apt.status === "scheduled" || apt.status === "confirmed"
  const isSmall    = height <= 36

  return (
    <>
      <div
        ref={blockRef}
        className={[
          "absolute rounded-md cursor-pointer overflow-hidden",
          "border transition-all duration-150",
          isCancelled ? "opacity-40" : "hover:shadow-md hover:z-10",
        ].join(" ")}
        style={{
          top,
          height,
          left,
          width,
          backgroundColor: m.gridBg,
          borderColor: m.border,
          borderLeftWidth: 3,
          borderLeftColor: doc?.color ?? m.dot,
          zIndex: detail ? 15 : 5,
        }}
        onClick={() => setDetail(true)}
      >
        <div className="px-2 py-1 h-full flex flex-col justify-start gap-0.5">
          <p className={[
            "font-semibold leading-tight truncate",
            isSmall ? "text-[10px]" : "text-[11px]",
          ].join(" ")}
            style={{ color: m.text }}
          >
            {apt.patientName}
          </p>
          {!isSmall && (
            <p className="text-[10px] truncate" style={{ color: m.text, opacity: 0.7 }}>
              {apt.time} · {apt.type}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {detail && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setDetail(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: popupBelow ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: popupBelow ? -6 : 6 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-40 w-72 bg-white rounded-xl border border-slate-200
                shadow-[0_8px_32px_rgba(15,23,42,0.12)] overflow-hidden"
              style={
                popupBelow
                  ? { top: top + height + 6, left: 8 }
                  : { bottom: totalGridHeight - top + 6, left: 8 }
              }
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">{apt.patientName}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{apt.patientId}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusPill status={apt.status} />
                    <button
                      onClick={() => setDetail(false)}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-400
                        hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-[12px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock size={11} className="text-slate-400 flex-shrink-0" />
                    <span>{apt.time} · {apt.duration} menit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: doc?.color }} />
                    <span>{doc?.name} <span className="text-slate-400">— {doc?.specialty}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={11} className="text-slate-400 flex-shrink-0" />
                    <span>{apt.type}</span>
                  </div>
                  {apt.notes && (
                    <div className="flex items-start gap-2">
                      <FileText size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="italic text-slate-500">{apt.notes}</span>
                    </div>
                  )}
                  {apt.notify !== "none" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {(apt.notify === "whatsapp" || apt.notify === "both") && apt.notifyPhone && (
                        <span className="flex items-center gap-1">
                          <MessageCircle size={10} className="text-green-500" />
                          <span className="text-[11px]">{apt.notifyPhone}</span>
                        </span>
                      )}
                      {(apt.notify === "email" || apt.notify === "both") && apt.notifyEmail && (
                        <span className="flex items-center gap-1">
                          <Mail size={10} className="text-blue-400" />
                          <span className="text-[11px]">{apt.notifyEmail}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {canAdvance && (
                    <button
                      onClick={() => { onStatusChange(apt.id, nextStatus[apt.status]!); setDetail(false) }}
                      className="flex-1 py-1.5 rounded-md text-[12px] font-semibold
                        bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                    >
                      {apt.status === "scheduled" ? "Konfirmasi" : "Tandai Selesai"}
                    </button>
                  )}
                  {!isCancelled && (
                    <button
                      onClick={() => { onStatusChange(apt.id, "cancelled"); setDetail(false) }}
                      className="py-1.5 px-2.5 rounded-md text-[12px] font-medium
                        text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
                    >
                      Batalkan
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(apt.id); setDetail(false) }}
                    className="w-8 h-8 flex items-center justify-center rounded-md
                      text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function NewApptDrawer({
  defaultDate, defaultTime, today, onClose, onSave,
}: {
  defaultDate: string
  defaultTime?: string
  today: string
  onClose: () => void
  onSave: (apt: Appointment) => void
}) {
  const makeEmpty = (): NewApptForm => ({
    patientId: "", patientName: "", date: defaultDate,
    time: defaultTime ?? "", duration: "30", doctorId: "", type: "", notes: "",
    notify: "none", notifyPhone: "", notifyEmail: "",
  })

  const [form, setForm]       = useState<NewApptForm>(makeEmpty)
  const [errors, setErrors]   = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof NewApptForm, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setForm(prev => ({ ...prev, date: defaultDate }))
  }, [defaultDate])

  useEffect(() => {
    if (defaultTime) setForm(prev => ({ ...prev, time: defaultTime }))
  }, [defaultTime])

  const set = (k: keyof NewApptForm, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    if (touched[k] || submitted) {
      const e = validateAppt({ ...form, [k]: v }, today)
      setErrors(p => ({ ...p, [k]: e[k] }))
    }
  }
  const blur = (k: keyof NewApptForm) => {
    setTouched(p => ({ ...p, [k]: true }))
    setErrors(p => ({ ...p, [k]: validateAppt(form, today)[k] }))
  }
  const err = (k: keyof NewApptForm) =>
    (touched[k] || submitted) ? errors[k] : undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateAppt(form, today)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return
    onSave({
      id: String(Date.now()),
      patientId:   form.patientId.trim(),
      patientName: form.patientName.trim(),
      date: form.date, time: form.time,
      duration: parseInt(form.duration) || 30,
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

  const NOTIFY_OPTS: { val: NotifyChannel; label: string }[] = [
    { val: "none",     label: "Tidak" },
    { val: "whatsapp", label: "WA" },
    { val: "email",    label: "Email" },
    { val: "both",     label: "Keduanya" },
  ]

  const TIME_SLOTS: string[] = []
  for (let h = 0; h < 24; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`)
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`)
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
        <div>
          <p className="text-[13px] font-semibold text-slate-800">Jadwalkan Janji</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{fmtDateShort(form.date)}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center
            text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      </div>

      <form id="appt-form" onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 flex flex-col gap-4">
          <section className="flex flex-col gap-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pasien</p>
            <div className="grid grid-cols-2 gap-2">
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
          </section>

          <div className="h-px bg-slate-100" />

          <section className="flex flex-col gap-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jadwal</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tanggal" id="f-date" required error={err("date")}>
                <input id="f-date" type="date" value={form.date} min={today}
                  onChange={e => set("date", e.target.value)}
                  onBlur={() => blur("date")}
                  className={err("date") ? inputErrCls : inputCls} />
              </Field>
              <Field label="Waktu" id="f-time" required error={err("time")}>
                <div className="relative">
                  <select id="f-time" value={form.time}
                    onChange={e => set("time", e.target.value)}
                    onBlur={() => blur("time")}
                    className={`${err("time") ? inputErrCls : inputCls} appearance-none pr-7`}>
                    <option value="" disabled>Pilih</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Durasi" id="f-dur">
                <div className="relative">
                  <select id="f-dur" value={form.duration}
                    onChange={e => set("duration", e.target.value)}
                    className={`${inputCls} appearance-none pr-7`}>
                    {[15,30,45,60,90,120].map(n =>
                      <option key={n} value={n}>{n} menit</option>
                    )}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Dokter" id="f-doc" required error={err("doctorId")}>
                <div className="relative">
                  <select id="f-doc" value={form.doctorId}
                    onChange={e => set("doctorId", e.target.value)}
                    onBlur={() => blur("doctorId")}
                    className={`${err("doctorId") ? inputErrCls : inputCls} appearance-none pr-7`}>
                    <option value="" disabled>Pilih</option>
                    {DOCTORS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
            <Field label="Jenis Janji" id="f-type" required error={err("type")}>
              <div className="relative">
                <select id="f-type" value={form.type}
                  onChange={e => set("type", e.target.value)}
                  onBlur={() => blur("type")}
                  className={`${err("type") ? inputErrCls : inputCls} appearance-none pr-7`}>
                  <option value="" disabled>Pilih jenis</option>
                  {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="Catatan" id="f-notes">
              <textarea id="f-notes" value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Instruksi khusus, keluhan…"
                rows={2} maxLength={300}
                className={`${inputCls} resize-none`} />
            </Field>
          </section>

          <div className="h-px bg-slate-100" />

          <section className="flex flex-col gap-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notifikasi</p>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
              {NOTIFY_OPTS.map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => set("notify", opt.val)}
                  className={[
                    "flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all",
                    form.notify === opt.val
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-400 hover:text-slate-600",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {showWA && (
                <motion.div key="wa"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.14 }}
                  className="overflow-hidden"
                >
                  <Field label="Nomor WhatsApp" id="f-wa" required error={err("notifyPhone")}>
                    <div className="relative">
                      <MessageCircle size={11}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                      <input id="f-wa" type="tel" inputMode="tel"
                        value={form.notifyPhone}
                        onChange={e => set("notifyPhone", e.target.value)}
                        onBlur={() => blur("notifyPhone")}
                        placeholder="+62 812 0000 0000"
                        className={`${err("notifyPhone") ? inputErrCls : inputCls} pl-8`} />
                    </div>
                  </Field>
                </motion.div>
              )}
              {showEmail && (
                <motion.div key="em"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.14 }}
                  className="overflow-hidden"
                >
                  <Field label="Alamat Email" id="f-email" required error={err("notifyEmail")}>
                    <div className="relative">
                      <Mail size={11}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                      <input id="f-email" type="email" inputMode="email"
                        value={form.notifyEmail}
                        onChange={e => set("notifyEmail", e.target.value)}
                        onBlur={() => blur("notifyEmail")}
                        placeholder="pasien@example.com"
                        className={`${err("notifyEmail") ? inputErrCls : inputCls} pl-8`} />
                    </div>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </form>

      <div className="flex gap-2 px-4 py-3 border-t border-slate-100 flex-shrink-0">
        <button type="button" onClick={onClose}
          className="flex-1 py-2 rounded-lg border border-slate-200 text-[12px]
            font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Batal
        </button>
        <button
          type="submit"
          form="appt-form"
          className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-[12px]
            font-semibold flex items-center justify-center gap-1.5
            hover:bg-slate-800 active:bg-[#0a1128] transition-colors">
          <CalendarCheck size={12} /> Simpan
        </button>
      </div>
    </div>
  )
}

export function AppointmentScheduling() {
  const [today, setToday] = useState(getToday)
  useEffect(() => {
    const tick = () => {
      const t = getToday()
      setToday(prev => prev !== t ? t : prev)
    }
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const [appointments, setAppointments] = useState<Appointment[]>(INIT_APPOINTMENTS)
  const [selectedDate, setSelectedDate] = useState(today)
  const [showForm, setShowForm]         = useState(false)
  const [defaultTime, setDefaultTime]   = useState<string | undefined>()
  const [filterDoctor, setFilterDoctor] = useState("")

  const handleStatusChange = (id: string, status: AppointmentStatus) =>
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  const handleDelete = (id: string) =>
    setAppointments(prev => prev.filter(a => a.id !== id))
  const handleSave = (apt: Appointment) =>
    setAppointments(prev => [...prev, apt])

  const handleNewAtTime = (time: string) => {
    setDefaultTime(time)
    setShowForm(true)
  }

  const goToPrev = () => setSelectedDate(d => addDays(d, -1))
  const goToNext = () => setSelectedDate(d => addDays(d, 1))

  const dayApts      = appointments.filter(a => a.date === selectedDate)
  const filteredApts = filterDoctor
    ? dayApts.filter(a => a.doctorId === filterDoctor)
    : dayApts

  const counterLabel = filterDoctor
    ? `${filteredApts.length} dari ${dayApts.length} janji`
    : `${dayApts.length} janji`

  return (
    <div className="flex h-full min-h-screen bg-slate-50 overflow-hidden">
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 pt-5 pb-4">
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">
            Penjadwalan
          </p>
          <h1 className="text-[18px] font-bold text-slate-900 leading-none">Janji Temu</h1>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => { setDefaultTime(undefined); setShowForm(v => !v) }}
            className={[
              "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg",
              "text-[12px] font-semibold transition-all",
              showForm
                ? "bg-slate-100 text-slate-600 border border-slate-200"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
            ].join(" ")}
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? "Tutup Form" : "Jadwalkan Baru"}
          </button>
        </div>

        <div className="h-px bg-slate-100 mx-4" />

        <div className="px-4 py-4">
          <MiniCalendar
            selected={selectedDate}
            onSelect={setSelectedDate}
            appointments={appointments}
            today={today}
          />
        </div>

        <div className="h-px bg-slate-100 mx-4" />

        <div className="px-4 py-4 flex flex-col gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dokter</p>
          <button
            onClick={() => setFilterDoctor("")}
            className={[
              "text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors",
              !filterDoctor ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-50",
            ].join(" ")}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
            Semua Dokter
          </button>
          {DOCTORS.map(d => (
            <button
              key={d.id}
              onClick={() => setFilterDoctor(filterDoctor === d.id ? "" : d.id)}
              className={[
                "text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors",
                filterDoctor === d.id ? "bg-slate-100 font-medium text-slate-800" : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }} />
              <span className="truncate">{d.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CENTER: Calendar view ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(today)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200
                text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hari Ini
            </button>
            <div className="flex gap-0.5">
              <button
                onClick={goToPrev}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400
                  hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={goToNext}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400
                  hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <h2 className="text-[14px] font-semibold text-slate-800 capitalize">
              {fmtDateLong(selectedDate)}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            {dayApts.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium">
                {counterLabel}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border-b border-slate-200 px-5 py-2 flex-shrink-0">
          <WeekStrip
            selected={selectedDate}
            onSelect={setSelectedDate}
            appointments={appointments}
            today={today}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4">
            <TimeGrid
              appointments={filteredApts}
              date={selectedDate}
              today={today}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onNewAtTime={handleNewAtTime}
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT DRAWER ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="drawer"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 overflow-hidden border-l border-slate-200"
            style={{ minWidth: 0 }}
          >
            <div className="w-80 h-full">
              <NewApptDrawer
                defaultDate={selectedDate}
                defaultTime={defaultTime}
                today={today}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default AppointmentScheduling;
