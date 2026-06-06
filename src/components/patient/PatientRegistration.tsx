import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Modal, Button, Text, Group } from "@mantine/core"
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

  // Mantine Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error">("success")

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
        setModalType("success")
        setModalTitle(isEdit ? "Perubahan Disimpan" : "Registrasi Berhasil")
        setModalMessage(isEdit ? "Perubahan data pasien berhasil disimpan!" : "Registrasi data pasien baru berhasil!")
        setModalOpen(true)

        onPatientsChange(prev => {
          const mapPatient = (pData: any) => ({
            id: pData.id,
            name: pData.name,
            email: pData.email || "",
            idNumber: pData.id_number || pData.idNumber || "",
            age: Number(pData.age) || 0,
            gender: pData.gender || "",
            phone: pData.phone || "",
            registeredAt: pData.registered_at || pData.registeredAt || "",
            hasPhoto: !!pData.photo || !!pData.hasPhoto,
            initials: pData.initials || "",
            batchId: pData.batch_id || pData.batchId || "",
            birthPlace: pData.birth_place || pData.birthPlace || "",
            education: pData.education || "",
            siblingOrder: pData.sibling_order || pData.siblingOrder || "",
            totalSiblings: pData.total_siblings || pData.totalSiblings || "",
            dateOfBirth: pData.date_of_birth || pData.dateOfBirth || "",
            occupation: pData.occupation || "",
            country: pData.country || "",
            province: pData.province || "",
            city: pData.city || "",
            fullAddress: pData.full_address || pData.fullAddress || "",
            photo: pData.photo || null,
          });
          const mappedSaved = json.data ? mapPatient(json.data) : p;

          if (isEdit) {
            return prev.map(item => item.id === p.id ? mappedSaved : item)
          } else {
            return [mappedSaved, ...prev]
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
        setModalType("error")
        setModalTitle("Gagal Menyimpan")
        setModalMessage(json.error || "Gagal menyimpan data pasien.")
        setModalOpen(true)
      }
    } catch (e) {
      console.error(e)
      setModalType("error")
      setModalTitle("Koneksi Error")
      setModalMessage("Koneksi gagal saat menghubungi backend.")
      setModalOpen(true)
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

      {/* Success/Error Mantine Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        centered
        radius="lg"
        styles={{
          header: {
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "12px",
          },
          title: {
            fontWeight: 700,
            fontSize: "15px",
            color: modalType === "success" ? "#0f172a" : "#dc2626",
          },
          body: {
            paddingTop: "20px",
          }
        }}
      >
        <Text size="sm" c="dimmed" className="leading-relaxed mb-6">
          {modalMessage}
        </Text>
        <Group justify="end">
          <Button
            onClick={() => setModalOpen(false)}
            variant={modalType === "success" ? "filled" : "outline"}
            color={modalType === "success" ? "teal" : "red"}
            radius="md"
            styles={{
              root: {
                height: "36px",
                fontSize: "13px",
                fontWeight: 600,
                ...(modalType === "success" ? { backgroundColor: "#0f766e" } : {}),
                "&:hover": {
                  ...(modalType === "success" ? { backgroundColor: "#0d5c56" } : {}),
                }
              }
            }}
          >
            Selesai
          </Button>
        </Group>
      </Modal>
    </div>
  )
}
export default PatientRegistration;
