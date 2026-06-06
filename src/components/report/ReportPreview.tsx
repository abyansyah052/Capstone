import { Psychologist, ReportForm, Patient, Batch } from "../../types"

type ReportPreviewProps = {
  form: ReportForm
  psychologists?: Psychologist[]
  currentUser?: { id: string; name: string; email: string; role: string; signature: string | null } | null
  patients?: Patient[]
  batches?: Batch[]
}

export function ReportPreview({
  form,
  psychologists = [],
  currentUser = null,
  patients = [],
  batches = []
}: ReportPreviewProps) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
  const activePsychologist = psychologists.find(
    p => p.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  )

  const psyName = activePsychologist?.name || currentUser?.name || "Psikolog / Konselor"
  const psySipp = activePsychologist?.sipp || ""
  const psySignature = activePsychologist?.signature || currentUser?.signature || null

  // Resolve the patient's batch to check logo printing preferences
  const patient = patients.find(p => p.id === form.patientId)
  const batch = patient ? batches.find(b => b.id === patient.batchId) : null
  const useLogoInReport = batch?.useLogoInReport ?? false
  const batchLogo = batch?.logo ?? null
  const logoScale = batch?.logoScale ?? 1.0
  const logoWidth = 64 * logoScale
  const logoHeight = 64 * logoScale

  const row = (label: string, value: string) => (
    <tr style={{ borderBottom: "1px solid #d1d5db" }}>
      <td style={{ padding: "5px 12px 5px 0", fontWeight: 700, fontSize: "11px", color: "#111827", width: "160px", verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ padding: "5px 0", fontSize: "11px", color: value ? "#1e3a5f" : "#9ca3af" }}>
        {value || "\u2014"}
      </td>
    </tr>
  )

  const sectionBox = (content: string | undefined, placeholder: string) => (
    <div style={{ border: "1px solid #374151", borderRadius: "4px", padding: "10px 12px", minHeight: "64px", marginBottom: "14px" }}>
      <p style={{ fontSize: "10px", color: content ? "#1e3a5f" : "#9ca3af", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
        {content || placeholder}
      </p>
    </div>
  )

  return (
    <div style={{
      background: "#ffffff", border: "1px solid #d1d5db",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)", width: "595px", minHeight: "842px",
      fontFamily: "'Times New Roman', 'Georgia', serif", padding: "52px 56px", color: "#111827",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
        <img src="/asisya-consulting.png" alt="Asisya Psychological Center"
          width={64} height={64}
          style={{ width: "64px", height: "64px", objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.1em", color: "#111827", margin: "0 0 2px" }}>
            ASISYA PSYCHOLOGICAL CENTER
          </p>
          <p style={{ fontSize: "10px", color: "#374151", margin: "0 0 1px" }}>Ruko Grand City Regency A7 - A8 Jl. Rungkut Madya</p>
          <p style={{ fontSize: "10px", color: "#374151", margin: 0 }}>Surabaya - Jawa Timur</p>
        </div>
        {useLogoInReport && batchLogo ? (
          <img src={batchLogo} alt="Batch Logo"
            width={logoWidth} height={logoHeight}
            style={{ width: `${logoWidth}px`, height: `${logoHeight}px`, objectFit: "contain", flexShrink: 0 }} />
        ) : (
          <div style={{ width: "64px", height: "64px", flexShrink: 0 }} />
        )}
      </div>
      <hr style={{ borderColor: "#111827", borderWidth: "1.5px", marginBottom: "10px" }} />
      <p style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#111827", marginBottom: "18px" }}>
        FORM KONSELING PSIKOLOGIS
      </p>

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Biodata</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px" }}>
        <tbody>
          {row("Nama Lengkap:", form.namaLengkap)}
          {row("Tempat/Tanggal Lahir", `${form.tempatLahir}${form.tempatLahir && form.tanggalLahir ? " / " : ""}${form.tanggalLahir}`)}
          {row("Jenis Kelamin", form.jenisKelamin)}
          {row("Usia", form.usia ? `${form.usia} Tahun` : "")}
          {row("Pendidikan Terakhir", form.pendidikan)}
          {row("Anak Keberapa", form.anakKeberapa || form.jumlahSaudara ? `Anak ke ${form.anakKeberapa} dari ${form.jumlahSaudara} bersaudara` : "")}
          {row("Alamat", form.alamat)}
        </tbody>
      </table>

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Permasalahan Saat Ini</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.permasalahan, "(Data deskripsi keluhan, gejala awal, dan permasalahan utama yang diinput oleh konselor/psikolog pada form digital akan terdokumentasi secara otomatis)")}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Proses Konseling</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.prosesKonseling, "(Catatan perkembangan sesi konseling, dinamika psikologis, metode pendekatan intervensi yang diterapkan, serta respons klien sepanjang sesi akan terdokumentasi secara otomatis)")}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Diagnosis Klinis</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.diagnosisKlinis, "(Diagnosis klinis berdasarkan hasil asesmen psikologis)")}

      <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Saran Pengembangan dan Intervensi</p>
      <hr style={{ borderColor: "#6b7280", marginBottom: "8px" }} />
      {sectionBox(form.saranPengembangan, "(Rekomendasi tindak lanjut, rencana intervensi klinis lanjutan, tugas mandiri untuk klien, atau saran pengembangan diri spesifik)")}

      <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <p style={{ fontSize: "10px", color: "#374151", margin: "0 0 8px" }}>Surabaya, {today}</p>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#111827", margin: "0 0 2px" }}>Psikolog / Konselor</p>
          {psySignature ? (
            <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src={psySignature} alt="Signature" style={{ height: "100%", objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ height: "40px" }} />
          )}
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#111827", margin: "2px 0 0" }}>
            ( {psyName} )
          </p>
          {psySipp ? (
            <p style={{ fontSize: "8px", color: "#6b7280", margin: "1px 0 0", fontStyle: "italic" }}>
              No. SIPP: {psySipp}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
export default ReportPreview;
