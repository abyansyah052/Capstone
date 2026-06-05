import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Psychologist } from "../../types"
import { PsychologistDirectory } from "./PsychologistDirectory"
import { PsychologistForm } from "./PsychologistForm"
import { DeleteModal } from "./DeleteModal"

export const INIT_PSYCHOLOGISTS: Psychologist[] = [
  {
    id: "psy-1",
    name: "Dairy Team",
    origin: "Surabaya",
    age: 28,
    phone: "+62 812 3456 7890",
    address: "Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya",
    email: "Dairyteam@Gmail.com",
    sipp: "SIPP/09/2026/01-DT",
    signature: null,
  },
  {
    id: "psy-2",
    name: "Dr. Sarah Wijaya, M.Psi.",
    origin: "Jakarta",
    age: 35,
    phone: "+62 811 9988 7766",
    address: "Sudirman Central Business District Jakarta",
    email: "sarah.w@asisya.com",
    sipp: "SIPP/12/2024/02-SW",
    signature: null,
  }
]

type PsychologistDatabaseProps = {
  psychologists: Psychologist[]
  onPsychologistsChange: React.Dispatch<React.SetStateAction<Psychologist[]>>
}

export function PsychologistDatabase({
  psychologists,
  onPsychologistsChange,
}: PsychologistDatabaseProps) {
  const [view, setView] = useState<"list" | "form">("list")
  const [editTarget, setEditTarget] = useState<Psychologist | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Psychologist | null>(null)

  const handleSave = (saved: Psychologist) => {
    onPsychologistsChange(prev => {
      const exists = prev.some(p => p.id === saved.id)
      if (exists) {
        return prev.map(p => p.id === saved.id ? saved : p)
      } else {
        return [saved, ...prev]
      }
    })
    setView("list")
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    onPsychologistsChange(prev => prev.filter(p => p.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PsychologistDirectory
              psychologists={psychologists}
              onNew={() => { setEditTarget(null); setView("form") }}
              onEdit={(p) => { setEditTarget(p); setView("form") }}
              onDelete={setDeleteTarget}
            />
          </motion.div>
        ) : (
          <motion.div key="form"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}>
            <PsychologistForm
              initialPsychologist={editTarget}
              onBack={() => { setEditTarget(null); setView("list") }}
              onSave={handleSave}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            target={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
export default PsychologistDatabase;
