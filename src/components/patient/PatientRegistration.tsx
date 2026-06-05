import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Patient, Batch } from "../../types"
import { PatientDirectory } from "./PatientDirectory"
import { RegistrationForm } from "./RegistrationForm"

export const BATCHES: readonly Batch[] = []

type PatientRegistrationProps = {
  patients: Patient[]
  onPatientsChange: React.Dispatch<React.SetStateAction<Patient[]>>
  currentUser: { id: string; role: string; email: string }
  batches: Batch[]
}

export function PatientRegistration({
  patients,
  onPatientsChange,
  currentUser,
  batches,
}: PatientRegistrationProps) {
  const isPsychologist = currentUser.role === "psikolog"
  const [view, setView] = useState<"list" | "form">(isPsychologist ? "form" : "list")
  const [editTarget, setEditTarget] = useState<Patient | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)

  const handleSave = async (p: Patient) => {
    const isEdit = !!editTarget
    const url = isEdit ? `/api/patients/${p.id}` : "/api/patients"
    const method = isEdit ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify(p),
      })
      const json = await res.json()
      if (json.ok) {
        alert(isEdit ? "Perubahan data pasien berhasil disimpan!" : "Registrasi data pasien baru berhasil!");
        onPatientsChange(prev => {
          if (isEdit) {
            return prev.map(item => item.id === p.id ? json.data || p : item)
          } else {
            return [json.data || p, ...prev]
          }
        })
        if (isPsychologist) {
          setFormResetKey(prev => prev + 1)
          setView("form")
          setEditTarget(null)
        } else {
          setView("list")
          setEditTarget(null)
        }
      } else {
        alert(json.error || "Gagal menyimpan data data pasien.")
      }
    } catch (e) {
      console.error(e)
      alert("Koneksi gagal saat menghubungi backend.")
    }
  }

  return (
    <div className="p-6 max-w-[1400px] w-full mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PatientDirectory
              patients={patients}
              batches={batches}
              setPatients={onPatientsChange}
              currentUser={currentUser}
              onNew={() => { setEditTarget(null); setView("form") }}
              onEdit={(p) => { setEditTarget(p); setView("form") }}
            />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <RegistrationForm
              key={editTarget ? editTarget.id : `new-${formResetKey}`}
              initialPatient={editTarget}
              batches={batches}
              hideBack={isPsychologist}
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
