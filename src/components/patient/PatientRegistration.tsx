import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Patient, Batch } from "../../types"
import { PatientDirectory } from "./PatientDirectory"
import { RegistrationForm } from "./RegistrationForm"

export const BATCHES: readonly Batch[] = [
  { id: "B001", name: "Batch Mandiri Q1 2025",   company: "PT Bank Mandiri",     color: "#1e40af" },
  { id: "B002", name: "Batch Telkom April 2025",  company: "PT Telkom Indonesia", color: "#0f766e" },
  { id: "B003", name: "Batch BCA Mei 2025",       company: "PT Bank BCA",         color: "#6d28d9" },
  { id: "B004", name: "Batch Individual",         company: "—",                   color: "#475569" },
] as const

export const INIT_PATIENTS: Patient[] = [
  {
    id: "1",
    name: "Eleanor James",
    email: "eleanor.j@example.com",
    idNumber: "PT-8842-A",
    age: 42,
    gender: "F",
    phone: "(555) 123-4567",
    registeredAt: "2023-10-01",
    hasPhoto: false,
    initials: "EJ",
    batchId: "B001",
    birthPlace: "Jakarta",
    education: "S1",
    siblingOrder: "1",
    totalSiblings: "2",
    dateOfBirth: "1981-05-15",
    occupation: "Product Manager",
    country: "ID",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    fullAddress: "Jl. Kemang Raya No. 12"
  },
  {
    id: "2",
    name: "Marcus Chen",
    email: "m.chen99@example.com",
    idNumber: "PT-9105-C",
    age: 58,
    gender: "M",
    phone: "(555) 987-6543",
    registeredAt: "2023-08-20",
    hasPhoto: true,
    initials: "MC",
    batchId: "B002",
    birthPlace: "Bandung",
    education: "S2",
    siblingOrder: "2",
    totalSiblings: "3",
    dateOfBirth: "1965-11-22",
    occupation: "Software Architect",
    country: "ID",
    province: "Jawa Barat",
    city: "Bandung",
    fullAddress: "Jl. Dago No. 45"
  },
  {
    id: "3",
    name: "Sarah Lin",
    email: "slin_design@example.com",
    idNumber: "PT-4421-B",
    age: 29,
    gender: "F",
    phone: "(555) 333-2211",
    registeredAt: "2023-07-15",
    hasPhoto: true,
    initials: "SL",
    batchId: "B001",
    birthPlace: "Tangerang",
    education: "S1",
    siblingOrder: "1",
    totalSiblings: "1",
    dateOfBirth: "1994-03-08",
    occupation: "UX Designer",
    country: "ID",
    province: "Banten",
    city: "Tangerang",
    fullAddress: "Green Lake City Blok C"
  },
  {
    id: "4",
    name: "Budi Santoso",
    email: "budi.s@example.com",
    idNumber: "PT-6631-D",
    age: 35,
    gender: "M",
    phone: "+62 812 0011 2233",
    registeredAt: "2024-01-02",
    hasPhoto: false,
    initials: "BS",
    batchId: "B003",
    birthPlace: "Surabaya",
    education: "S1",
    siblingOrder: "2",
    totalSiblings: "4",
    dateOfBirth: "1989-12-01",
    occupation: "Wiraswasta",
    country: "ID",
    province: "Jawa Timur",
    city: "Surabaya",
    fullAddress: "Jl. Dharmahusada Indah Barat II/4"
  },
  {
    id: "5",
    name: "Rina Kartika",
    email: "rina.k@example.com",
    idNumber: "PT-7720-E",
    age: 27,
    gender: "F",
    phone: "+62 811 9988 7766",
    registeredAt: "2024-03-10",
    hasPhoto: false,
    initials: "RK",
    batchId: "B004",
    birthPlace: "Semarang",
    education: "SMA/SMK",
    siblingOrder: "3",
    totalSiblings: "3",
    dateOfBirth: "1997-07-19",
    occupation: "Pegawai Negeri Sipil",
    country: "ID",
    province: "Jawa Tengah",
    city: "Semarang",
    fullAddress: "Jl. Pandanaran No. 100"
  }
];

type PatientRegistrationProps = {
  patients: Patient[]
  onPatientsChange: React.Dispatch<React.SetStateAction<Patient[]>>
}

export function PatientRegistration({
  patients,
  onPatientsChange,
}: PatientRegistrationProps) {
  const [view, setView] = useState<"list" | "form">("list")
  const [editTarget, setEditTarget] = useState<Patient | null>(null)

  const handleSave = (p: Patient) => {
    onPatientsChange(prev => {
      const exists = prev.some(item => item.id === p.id)
      if (exists) {
        return prev.map(item => item.id === p.id ? p : item)
      } else {
        return [p, ...prev]
      }
    })
    setView("list")
    setEditTarget(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PatientDirectory
              patients={patients}
              batches={BATCHES}
              setPatients={onPatientsChange}
              onNew={() => { setEditTarget(null); setView("form") }}
              onEdit={(p) => { setEditTarget(p); setView("form") }}
            />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <RegistrationForm
              initialPatient={editTarget}
              batches={BATCHES}
              onBack={() => { setEditTarget(null); setView("list") }}
              onSave={handleSave}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default PatientRegistration;
