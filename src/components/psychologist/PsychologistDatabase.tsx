import { useState, useEffect } from "react"
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
  currentUser?: { id: string; role: string; email: string } | null
}

export function PsychologistDatabase({
  psychologists,
  onPsychologistsChange,
  currentUser = null
}: PsychologistDatabaseProps) {
  const [view, setView] = useState<"list" | "form">("list")
  const [editTarget, setEditTarget] = useState<Psychologist | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Psychologist | null>(null)

  const fetchPsychologists = async () => {
    if (!currentUser) return
    try {
      const res = await fetch("/api/psychologists", {
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        }
      })
      const json = await res.json()
      if (json.ok) {
        onPsychologistsChange(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPsychologists()
  }, [currentUser])

  const handleSave = async (saved: Psychologist, promoteUserId?: string) => {
    if (!currentUser) return
    try {
      if (promoteUserId) {
        // Promotion flow
        const res = await fetch(`/api/auth/users/${promoteUserId}/role`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
          body: JSON.stringify({
            role: "psikolog",
            sipp: saved.sipp,
            origin: saved.origin,
            age: saved.age,
            phone: saved.phone,
            address: saved.address,
          }),
        })
        const json = await res.json()
        if (json.ok) {
          fetchPsychologists()
          setView("list")
          setEditTarget(null)
        } else {
          alert(json.error || "Gagal mempromosikan user menjadi psikolog")
        }
      } else {
        const isEdit = psychologists.some(p => p.id === saved.id)
        const res = await fetch(isEdit ? `/api/psychologists/${saved.id}` : "/api/psychologists", {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
          body: JSON.stringify(saved),
        })
        const json = await res.json()
        if (json.ok) {
          fetchPsychologists()
          setView("list")
          setEditTarget(null)
        } else {
          alert(json.error || "Gagal menyimpan data psikolog")
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentUser) return
    try {
      const res = await fetch(`/api/psychologists/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        }
      })
      const json = await res.json()
      if (json.ok) {
        fetchPsychologists()
        setDeleteTarget(null)
      } else {
        alert(json.error || "Gagal menghapus data psikolog")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-6 max-w-[1400px] w-full mx-auto">
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
              currentUser={currentUser}
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
