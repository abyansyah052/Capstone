import { useState, useRef, useEffect } from "react";
import { Search, Filter, Plus, Trash2, X, Pencil, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Patient, Batch } from "../../types";
import { FilterState, FilterPanel } from "./FilterPanel";
import { DeleteModal } from "./DeleteModal";
import { avatarColor, formatRegistered } from "../../lib/helpers";
import * as XLSX from "xlsx";

// ─── Batch Map Helper ───
const buildBatchMap = (batches: readonly Batch[] | Batch[]) =>
  Object.fromEntries(batches.map((b) => [b.id, b]));

// Gender text renderer
function GenderText({ gender }: { gender: string }) {
  const isFemale = gender === "F";
  return (
    <span className={`text-xs font-semibold ${isFemale ? "text-pink-600" : "text-sky-600"}`}>
      {isFemale ? "P" : "L"}
    </span>
  );
}

// Batch Badge
function BatchBadge({ batchId, batchMap }: { batchId: string; batchMap: Record<string, Batch> }) {
  const batch = batchMap[batchId];
  const [show, setShow] = useState(false);
  if (!batch) return null;
  return (
    <span className="relative inline-flex">
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold text-white whitespace-nowrap cursor-default"
        style={{ backgroundColor: batch.color }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {batch.id}
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none"
          >
            <div
              className="px-2.5 py-1.5 rounded-lg shadow-lg text-white text-[11px] font-medium whitespace-nowrap"
              style={{ backgroundColor: batch.color }}
            >
              <p className="font-semibold leading-snug">{batch.name}</p>
              <p className="opacity-80 text-[10px]">{batch.company}</p>
              <span
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: `5px solid ${batch.color}`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Checkbox helper
function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className="flex items-center cursor-pointer" aria-label={label}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-slate-300 accent-[#01696f] cursor-pointer"
      />
    </label>
  );
}

function TH({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-400 ${className}`}>
      {children}
    </th>
  );
}

type PatientDirectoryProps = {
  patients: Patient[];
  batches: readonly Batch[] | Batch[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  onNew: () => void;
  onEdit: (p: Patient) => void;
  currentUser: { id: string; role: string; email: string };
};

export function PatientDirectory({
  patients,
  batches,
  setPatients,
  onNew,
  onEdit,
  currentUser,
}: PatientDirectoryProps) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ sort: "newest", batchId: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTargets, setDeleteTargets] = useState<Patient[] | null>(null);

  const batchMap = buildBatchMap(batches);
  const activeFilters = (filter.sort !== "newest" ? 1 : 0) + (filter.batchId !== "" ? 1 : 0);

  const processed = patients
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        (p.name.toLowerCase().includes(q) ||
          p.idNumber.toLowerCase().includes(q) ||
          p.phone.includes(q)) &&
        (filter.batchId === "" || p.batchId === filter.batchId)
      );
    })
    .sort((a, b) => {
      if (filter.sort === "newest") return +new Date(b.registeredAt) - +new Date(a.registeredAt);
      if (filter.sort === "oldest") return +new Date(a.registeredAt) - +new Date(b.registeredAt);
      if (filter.sort === "name_az") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  const processedIds = processed.map((p) => p.id);
  const selectedInView = processedIds.filter((id) => selectedIds.has(id));
  const allSelected = processedIds.length > 0 && selectedInView.length === processedIds.length;
  const someSelected = selectedInView.length > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleAll = () => {
    if (allSelected)
      setSelectedIds((prev) => {
        const s = new Set(prev);
        processedIds.forEach((id) => s.delete(id));
        return s;
      });
    else setSelectedIds((prev) => new Set([...prev, ...processedIds]));
  };

  const openDelete = (ids: string[]) =>
    setDeleteTargets(patients.filter((p) => ids.includes(p.id)));

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "preview" | "saving" | "done">("idle");

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setUploadStatus("preview");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("Excel sheet is empty");
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) throw new Error("Excel sheet is empty");
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length <= 1) {
          alert("Excel template kosong atau tidak memiliki baris data.");
          return;
        }

        const rows = jsonData.slice(1) as any[][];

        const mapped = rows.map((row, index) => {
          const name = String(row[0] || "").trim();
          const email = String(row[1] || "").trim();
          const idNumber = String(row[2] || "").trim();
          const age = Number(row[3]) || 0;
          const genderText = String(row[4] || "").trim();
          const phone = String(row[5] || "").trim();
          const batchId = String(row[6] || "").trim();
          const birthPlace = String(row[7] || "").trim();
          const education = String(row[8] || "").trim();
          const siblingOrder = String(row[9] || "").trim();
          const totalSiblings = String(row[10] || "").trim();
          const dateOfBirth = String(row[11] || "").trim();
          const occupation = String(row[12] || "").trim();
          const city = String(row[13] || "").trim();
          const fullAddress = String(row[14] || "").trim();

          const errors: string[] = [];
          if (!name) errors.push("Nama Lengkap wajib diisi.");
          if (!idNumber) errors.push("No. KTP/ID wajib diisi.");
          if (!phone) errors.push("No. HP wajib diisi.");
          if (!city) errors.push("Kota wajib diisi.");
          if (!fullAddress) errors.push("Alamat Lengkap wajib diisi.");
          if (!dateOfBirth) {
            errors.push("Tanggal Lahir wajib diisi.");
          }

          let mappedGender = "";
          if (genderText.toLowerCase().startsWith("l") || genderText.toLowerCase() === "m") {
            mappedGender = "Laki-laki";
          } else if (genderText.toLowerCase().startsWith("p") || genderText.toLowerCase() === "f") {
            mappedGender = "Perempuan";
          } else if (genderText) {
            mappedGender = genderText;
          } else {
            errors.push("Jenis Kelamin wajib diisi.");
          }

          if (batchId && !batches.some((b) => b.id === batchId)) {
            errors.push(`Batch ID '${batchId}' tidak terdaftar di sistem.`);
          }

          return {
            rowNum: index + 2,
            name,
            email,
            idNumber,
            age,
            gender: mappedGender,
            phone,
            batchId,
            birthPlace,
            education,
            siblingOrder,
            totalSiblings,
            dateOfBirth,
            occupation,
            city,
            fullAddress,
            errors,
            isValid: errors.length === 0,
          };
        });

        setParsedRows(mapped);
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file Excel. Harap periksa format file Anda.");
        setUploadStatus("idle");
        setExcelFile(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const headers = [
      "Nama Lengkap",
      "Email",
      "No. KTP/ID",
      "Usia",
      "Jenis Kelamin (L/P)",
      "No. HP",
      "ID Batch (e.g. B001)",
      "Tempat Lahir",
      "Pendidikan",
      "Anak Ke-",
      "Jumlah Saudara",
      "Tanggal Lahir (YYYY-MM-DD)",
      "Pekerjaan",
      "Kota",
      "Alamat Lengkap",
    ];

    const sampleRows = [
      [
        "Andi Firmansyah",
        "andi.f@example.com",
        "3578011212950002",
        "30",
        "L",
        "+6281234567890",
        "B001",
        "Jakarta",
        "S1",
        "1",
        "3",
        "1995-05-12",
        "Karyawan Swasta",
        "Surabaya",
        "Jl. Dharmahusada Indah No. 12",
      ],
      [
        "Siti Rahayu",
        "siti.r@example.com",
        "3578022408980003",
        "27",
        "P",
        "+6281399887766",
        "B002",
        "Bandung",
        "S1",
        "2",
        "2",
        "1998-08-24",
        "PNS",
        "Sidoarjo",
        "Jl. Raya Dipatiukur No. 45",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Peserta");
    XLSX.writeFile(workbook, "template_peserta.xlsx");
  };

  const saveAllUploaded = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert("Tidak ada baris data valid untuk disimpan.");
      return;
    }

    setUploadStatus("saving");

    let successCount = 0;
    let failCount = 0;
    const newPatientsList: Patient[] = [];

    for (const r of validRows) {
      try {
        const payload = {
          name: r.name,
          email: r.email,
          idNumber: r.idNumber,
          age: r.age,
          gender: r.gender,
          phone: r.phone,
          batchId: r.batchId || null,
          birthPlace: r.birthPlace,
          education: r.education,
          siblingOrder: r.siblingOrder,
          totalSiblings: r.totalSiblings,
          dateOfBirth: r.dateOfBirth,
          occupation: r.occupation,
          country: "ID",
          province: "",
          city: r.city,
          fullAddress: r.fullAddress,
          photo: null,
        };

        const res = await fetch("/api/patients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.ok) {
          successCount++;
          const pData = json.data;
          newPatientsList.push({
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
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    if (newPatientsList.length > 0) {
      setPatients((prev) => [...newPatientsList, ...prev]);
    }

    alert(
      `Proses selesai!\n- Berhasil mengimpor: ${successCount} peserta\n- Gagal: ${failCount} peserta`
    );
    setShowUploadModal(false);
    setUploadStatus("idle");
    setExcelFile(null);
    setParsedRows([]);
  };

  const confirmDelete = async () => {
    if (!deleteTargets) return;
    const ids = deleteTargets.map((p) => p.id);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/patients/${id}`, {
            method: "DELETE",
            headers: {
              "x-user-id": currentUser.id,
              "x-user-role": currentUser.role,
              "x-user-email": currentUser.email,
            },
          })
        )
      );
      setPatients((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelectedIds((prev) => {
        const s = new Set(prev);
        ids.forEach((id) => s.delete(id));
        return s;
      });
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus data pasien dari database.");
    }
    setDeleteTargets(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Direktori Pasien</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients.length} peserta terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                showFilter || activeFilters > 0
                  ? "border-[#01696f]/40 bg-[#01696f]/[0.08] text-[#01696f]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#01696f]/25 hover:bg-[#01696f]/[0.04]"
              }`}
            >
              <Filter size={14} />
              Filter
              {activeFilters > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-[#01696f] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showFilter && (
                <FilterPanel
                  filter={filter}
                  batches={batches}
                  onChange={setFilter}
                  onClose={() => setShowFilter(false)}
                />
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => {
              setShowUploadModal(true);
              setUploadStatus("idle");
              setExcelFile(null);
              setParsedRows([]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:border-[#01696f]/25 hover:bg-[#01696f]/[0.04] transition-all shadow-sm"
          >
            <Upload size={14} />
            Unggah Excel
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:bg-[#0a1128] transition-all shadow-sm"
          >
            <Plus size={14} />
            Pasien Baru
          </button>
        </div>
      </div>

      <AnimatePresence>
        {filter.batchId !== "" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-slate-400">Menampilkan:</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white"
              style={{ backgroundColor: batchMap[filter.batchId]?.color }}
            >
              {batchMap[filter.batchId]?.name}
              <button
                onClick={() => setFilter((f) => ({ ...f, batchId: "" }))}
                className="opacity-70 hover:opacity-100 ml-0.5"
              >
                <X size={11} />
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInView.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-slate-200 shadow-sm"
          >
            <span className="text-sm text-slate-700">
              <span className="font-semibold">{selectedInView.length}</span> peserta dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                Batalkan
              </button>
              <button
                onClick={() => openDelete(selectedInView)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 bg-white text-red-600 text-xs font-medium hover:bg-red-50 hover:border-red-300 active:bg-red-100 transition-all"
              >
                <Trash2 size={13} />
                Hapus {selectedInView.length} Peserta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, nomor ID, atau telepon…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/50 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <th className="pl-4 pr-2 py-3 w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                  label="Pilih semua"
                />
              </th>
              <TH>Pasien</TH>
              <TH>No. ID</TH>
              <TH>Batch</TH>
              <TH>Usia</TH>
              <TH>Kelamin</TH>
              <TH>Telepon</TH>
              <TH>Terdaftar</TH>
              <TH className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processed.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center">
                  <Search size={28} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Tidak ada data yang sesuai</p>
                  <p className="text-xs text-slate-300 mt-1">Coba ubah kata kunci atau filter</p>
                </td>
              </tr>
            ) : (
              processed.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const bgColor = avatarColor(p.name);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSelected ? "bg-[#01696f]/[0.03]" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="pl-4 pr-2 py-3.5 w-10">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleOne(p.id)}
                        label={`Pilih ${p.name}`}
                      />
                    </td>

                    {/* Pasien */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: bgColor }}
                        >
                          {p.initials}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 leading-snug">{p.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* No. ID */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono text-xs text-slate-500">{p.idNumber}</span>
                    </td>

                    {/* Batch */}
                    <td className="px-3 py-3.5">
                      <BatchBadge batchId={p.batchId} batchMap={batchMap} />
                    </td>

                    {/* Usia */}
                    <td className="px-3 py-3.5 tabular-nums text-xs text-slate-600">{p.age} th</td>

                    {/* Kelamin */}
                    <td className="px-3 py-3.5">
                      <GenderText gender={p.gender} />
                    </td>

                    {/* Telepon */}
                    <td className="px-3 py-3.5 text-xs text-slate-600 tabular-nums">{p.phone}</td>

                    {/* Terdaftar */}
                    <td className="px-3 py-3.5 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatRegistered(p.registeredAt)}
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          title="Edit peserta"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 active:bg-slate-300 transition-all"
                          onClick={() => onEdit(p)}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          title="Hapus peserta"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
                          onClick={() => openDelete([p.id])}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs text-slate-400">
            Menampilkan <span className="font-medium text-slate-600">{processed.length}</span> dari{" "}
            <span className="font-medium text-slate-600">{patients.length}</span> peserta
          </p>
        </div>
      </div>

      <AnimatePresence>
        {deleteTargets !== null && (
          <DeleteModal
            targets={deleteTargets}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTargets(null)}
          />
        )}
      </AnimatePresence>

      {/* Excel Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl w-full max-w-[850px] max-h-[85vh] shadow-2xl border border-slate-100 flex flex-col p-6 overflow-hidden relative"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  if (uploadStatus !== "saving") setShowUploadModal(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-xl font-bold"
              >
                &times;
              </button>

              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Upload className="text-[#01696f]" size={18} />
                <h2 className="text-base font-bold text-slate-800">
                  Unggah Peserta Secara Batch (Excel)
                </h2>
              </div>

              {uploadStatus === "idle" ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Upload className="text-slate-400" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Pilih berkas Excel untuk diunggah
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Gunakan template resmi kami agar format data dibaca dengan benar.
                    </p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Unduh Template Excel
                    </button>
                    <button
                      onClick={() => {
                        const el = document.getElementById("excel-file-input");
                        el?.click();
                      }}
                      className="px-4 py-2 bg-[#16254c] text-white rounded-xl text-xs font-semibold hover:bg-[#0f1a38] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Pilih Berkas
                    </button>
                  </div>
                  <input
                    id="excel-file-input"
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleExcelUpload}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#01696f] animate-pulse flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        File: {excelFile?.name} ({parsedRows.length} baris data ditemukan)
                      </p>
                    </div>
                    {uploadStatus === "preview" && (
                      <button
                        onClick={() => {
                          setExcelFile(null);
                          setParsedRows([]);
                          setUploadStatus("idle");
                        }}
                        className="text-[11px] font-semibold text-red-500 hover:underline"
                      >
                        Ganti File
                      </button>
                    )}
                  </div>

                  {/* Preview Table */}
                  <div className="flex-1 overflow-auto border border-slate-150 rounded-xl mb-4 bg-white">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                          <th className="px-4 py-2.5 w-12 text-center">Baris</th>
                          <th className="px-4 py-2.5">Nama Lengkap</th>
                          <th className="px-4 py-2.5">No. KTP/ID</th>
                          <th className="px-4 py-2.5">No. HP</th>
                          <th className="px-4 py-2.5">Batch ID</th>
                          <th className="px-4 py-2.5">Kota</th>
                          <th className="px-4 py-2.5">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="px-4 py-3 text-center text-slate-400 font-mono font-bold">
                              {r.rowNum}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {r.name || <span className="text-red-400 italic">Kosong</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono">
                              {r.idNumber || <span className="text-red-400 italic">Kosong</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {r.phone || <span className="text-red-400 italic">Kosong</span>}
                            </td>
                            <td className="px-4 py-3">
                              {r.batchId ? (
                                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 font-bold">
                                  {r.batchId}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {r.city || <span className="text-red-400 italic">Kosong</span>}
                            </td>
                            <td className="px-4 py-3">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                                  Valid
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-semibold text-red-700 cursor-help"
                                  title={r.errors.join("\n")}
                                >
                                  Error ({r.errors.length})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-shrink-0">
                    <p className="text-[11px] text-slate-500">
                      Total Valid:{" "}
                      <span className="font-semibold text-emerald-600">
                        {parsedRows.filter((r) => r.isValid).length}
                      </span>{" "}
                      · Total Error:{" "}
                      <span className="font-semibold text-red-500">
                        {parsedRows.filter((r) => !r.isValid).length}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={uploadStatus === "saving"}
                        onClick={() => setShowUploadModal(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={
                          uploadStatus === "saving" ||
                          parsedRows.filter((r) => r.isValid).length === 0
                        }
                        onClick={saveAllUploaded}
                        className="px-4 py-2 bg-[#01696f] text-white rounded-xl text-xs font-semibold hover:bg-[#0c4e54] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {uploadStatus === "saving"
                          ? "Menyimpan..."
                          : `Simpan ${parsedRows.filter((r) => r.isValid).length} Data Valid`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
