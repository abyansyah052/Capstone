import { useState, useEffect, useRef } from "react"
import {
  Camera, CheckCircle2, Calendar as CalendarIcon,
  ChevronDown, Plus, Search, MoreVertical, Filter,
  ArrowLeft, User
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

// ─── Types ───────────────────────────────────────────────────────────────────

type Patient = {
  id: string
  name: string
  email: string
  idNumber: string
  age: number
  gender: string
  phone: string
  lastVisit: string
  hasPhoto: boolean
  initials: string
}

type FormData = {
  fullName: string
  dateOfBirth: string
  gender: string
  occupation: string
  phone: string
  email: string
  country: string
  province: string
  city: string
  fullAddress: string
  photo: string | null
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PATIENTS: Patient[] = [
  { id: "1", name: "Eleanor James", email: "eleanor.j@example.com", idNumber: "PT-8842-A", age: 42, gender: "F", phone: "(555) 123-4567", lastVisit: "Oct 12, 2023", hasPhoto: false, initials: "EJ" },
  { id: "2", name: "Marcus Chen", email: "m.chen99@example.com", idNumber: "PT-9105-C", age: 58, gender: "M", phone: "(555) 987-6543", lastVisit: "Sep 04, 2023", hasPhoto: true, initials: "MC" },
  { id: "3", name: "Sarah Lin", email: "slin_design@example.com", idNumber: "PT-4421-B", age: 29, gender: "F", phone: "(555) 333-2211", lastVisit: "Aug 19, 2023", hasPhoto: true, initials: "SL" },
]

const FILTER_TABS = ["All Patients", "Recently Added", "Require Follow-up"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcAge = (dob: string): number => {
  if (!dob) return 0
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

const formatDate = (dob: string): string => {
  if (!dob) return ""
  return new Date(dob).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Input component ─────────────────────────────────────────────────────────

function Field({
  label, id, required, children
}: { label: string; id?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b]/10 transition-all"
const disabledCls = "px-3.5 py-2.5 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 italic cursor-not-allowed"

// ─── Patient Directory ────────────────────────────────────────────────────────

function PatientDirectory({ onNew }: { onNew: () => void }) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("All Patients")

  const filtered = MOCK_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.idNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and view registered patient records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={15} />
            Filter
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-semibold hover:bg-[#1a3a6b]/90 transition-all shadow-md shadow-[#1a3a6b]/20"
          >
            <Plus size={15} />
            New Patient
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients by name, ID, or phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#1a3a6b]/50 focus:ring-2 focus:ring-[#1a3a6b]/8 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#1a3a6b] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Patient Details", "ID Number", "Age/Gender", "Contact", "Last Visit", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      p.hasPhoto ? "bg-slate-600" : "bg-[#1a3a6b]"
                    }`}>
                      {p.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-slate-600 text-xs">{p.idNumber}</td>
                <td className="px-5 py-4 text-slate-600">{p.age} • {p.gender}</td>
                <td className="px-5 py-4 text-slate-600">{p.phone}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.lastVisit.includes("Oct") ? "bg-[#1a3a6b]" : "bg-slate-300"}`} />
                    <span className="text-slate-600">{p.lastVisit}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">Showing 1 to {filtered.length} of 124 entries</p>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all text-xs">‹</button>
            {[1, 2, 3].map(n => (
              <button key={n} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${n === 1 ? "bg-[#1a3a6b] text-white" : "text-slate-500 hover:bg-slate-200"}`}>
                {n}
              </button>
            ))}
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all text-xs">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Registration Form ────────────────────────────────────────────────────────

function RegistrationForm({ onBack }: { onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    fullName: "", dateOfBirth: "", gender: "",
    occupation: "", phone: "", email: "",
    country: "", province: "", city: "", fullAddress: "",
    photo: null
  })
  const [completeness, setCompleteness] = useState(0)

  const set = (key: keyof FormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    const required = ["fullName", "dateOfBirth", "gender", "phone", "city", "fullAddress"]
    const filled = required.filter(k => form[k as keyof FormData]).length
    setCompleteness(Math.round((filled / required.length) * 100))
  }, [form])

  const age = form.dateOfBirth ? calcAge(form.dateOfBirth) : null

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set("photo", ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Patient Registration</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the patient's information. Fields marked * are required.</p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20" onSubmit={e => e.preventDefault()}>
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Personal Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name" id="fullName" required>
                <input id="fullName" value={form.fullName} onChange={e => set("fullName", e.target.value)}
                  placeholder="e.g. Budi Santoso" className={inputCls} />
              </Field>

              <Field label="Date of Birth" id="dob" required>
                <div className="relative">
                  <input id="dob" type="date" value={form.dateOfBirth}
                    onChange={e => set("dateOfBirth", e.target.value)}
                    className={`${inputCls} w-full pr-10`} />
                  <CalendarIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Age">
                <div className="flex items-center gap-2">
                  <input disabled value={age !== null ? `${age} years old` : ""} placeholder="Auto-calculated"
                    className={`${disabledCls} flex-1`} />
                  {age !== null && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(form.dateOfBirth)}</span>
                  )}
                </div>
              </Field>

              <Field label="Gender" id="gender" required>
                <div className="relative">
                  <select id="gender" value={form.gender} onChange={e => set("gender", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="" disabled>Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Occupation / Employer" id="occupation">
                <input id="occupation" value={form.occupation} onChange={e => set("occupation", e.target.value)}
                  placeholder="Job title, Company name" className={`${inputCls} md:col-span-2`} />
              </Field>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Phone Number" id="phone" required>
                <input id="phone" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+62 812 0000 0000" className={inputCls} />
              </Field>
              <Field label="Email Address" id="email">
                <input id="email" type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="pasien@example.com" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Country" id="country">
                <div className="relative">
                  <select id="country" value={form.country} onChange={e => set("country", e.target.value)}
                    className={`${inputCls} w-full appearance-none pr-9`}>
                    <option value="">Select country</option>
                    <option value="ID">Indonesia</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="Province" id="province">
                <input id="province" value={form.province} onChange={e => set("province", e.target.value)}
                  placeholder="e.g. Jawa Timur" className={inputCls} />
              </Field>
              <Field label="City" id="city" required>
                <input id="city" value={form.city} onChange={e => set("city", e.target.value)}
                  placeholder="e.g. Surabaya" className={inputCls} />
              </Field>
            </div>
            <Field label="Full Address" id="fullAddress" required>
              <textarea id="fullAddress" value={form.fullAddress} onChange={e => set("fullAddress", e.target.value)}
                placeholder="Jl. Raya No. 123, Kec. ..." rows={3}
                className={`${inputCls} resize-none`} />
            </Field>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-6">

          {/* Photo Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Patient Photo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Optional. For internal identification only.</p>
            </div>
            <div className="flex justify-center py-2">
              <motion.div
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => fileRef.current?.click()}
                className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#1a3a6b]/40 hover:bg-slate-100/50 transition-all cursor-pointer overflow-hidden relative"
              >
                {form.photo ? (
                  <img src={form.photo} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <Camera size={20} className="text-[#1a3a6b]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Upload Photo</span>
                  </div>
                )}
              </motion.div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
          </div>

          {/* Registration Summary */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold text-[#1a3a6b] uppercase tracking-widest">Registration Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-tight">Draft</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-bold text-slate-700 text-xs">
                  {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Completeness</span>
                  <span className="font-bold text-slate-600">{completeness}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#1a3a6b] rounded-full"
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button type="submit"
              className="w-full py-3.5 rounded-xl bg-[#1a3a6b] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1a3a6b]/90 transition-all shadow-lg shadow-[#1a3a6b]/20 active:scale-[0.99]">
              <CheckCircle2 size={16} />
              Complete Registration
            </button>
            <button type="button"
              className="w-full py-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all active:scale-[0.99]">
              Save as Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PatientRegistration() {
  const [view, setView] = useState<"list" | "form">("list")

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            <PatientDirectory onNew={() => setView("form")} />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            <RegistrationForm onBack={() => setView("list")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
