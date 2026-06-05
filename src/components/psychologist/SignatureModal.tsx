import { useRef, useState, useEffect } from "react";
import { PenTool, Trash2, CheckCircle2, X } from "lucide-react";
import { motion } from "motion/react";

interface SignatureModalProps {
  currentUser: { id: string; role: string; email: string; signature?: string | null };
  onSaveSuccess: (signatureBase64: string) => void;
  onClose?: () => void;
}

export function SignatureModal({ currentUser, onSaveSuccess, onClose }: SignatureModalProps) {
  const [isViewingPreview, setIsViewingPreview] = useState(!!currentUser.signature);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas context
  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return ctx;
  };

  useEffect(() => {
    if (!isViewingPreview && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1C243B";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [activeTab, isViewingPreview]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? (e.touches[0]?.clientX ?? 0) - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? (e.touches[0]?.clientY ?? 0) - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    // Prevent scrolling on mobile touch
    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? (e.touches[0]?.clientX ?? 0) - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? (e.touches[0]?.clientY ?? 0) - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadFile(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    let signatureData = "";

    if (activeTab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Check if canvas is empty
      const ctx = getContext();
      if (!ctx) return;
      
      signatureData = canvas.toDataURL("image/png");
    } else {
      if (!uploadFile) {
        alert("Pilih file tanda tangan terlebih dahulu.");
        return;
      }
      signatureData = uploadFile;
    }

    try {
      const res = await fetch("/api/auth/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify({ signature: signatureData }),
      });
      const json = await res.json();
      if (json.ok) {
        onSaveSuccess(signatureData);
      } else {
        alert(json.error || "Gagal menyimpan tanda tangan");
      }
    } catch (err) {
      console.error(err);
      alert("Koneksi gagal saat menyimpan tanda tangan.");
    }
  };

  const handleCancelEdit = () => {
    if (currentUser.signature) {
      setIsViewingPreview(true);
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_56px_rgba(15,23,42,0.14)] max-w-md w-full overflow-hidden"
      >
        {isViewingPreview && currentUser.signature ? (
          <>
            {/* Header Preview */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <PenTool className="text-[#01696f]" size={18} />
                <span className="text-sm font-bold text-slate-800">Tanda Tangan Digital Saat Ini</span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Tutup"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Content Preview */}
            <div className="p-5 space-y-4 flex flex-col items-center">
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Berikut adalah tanda tangan digital Anda yang saat ini digunakan pada Laporan Psikologis yang Anda terbitkan.
              </p>

              <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative h-48 flex items-center justify-center p-4">
                <img src={currentUser.signature} alt="Tanda Tangan Digital" className="max-h-full object-contain" />
              </div>
            </div>

            {/* Footer Preview */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all font-semibold"
                >
                  Tutup
                </button>
              )}
              <button
                onClick={() => setIsViewingPreview(false)}
                className="px-5 py-2.5 rounded-xl bg-[#16254c] text-white text-sm font-semibold hover:bg-[#0f1a38] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                Ubah Tanda Tangan
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header Edit */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <PenTool className="text-[#01696f]" size={18} />
                <span className="text-sm font-bold text-slate-800">Lengkapi Tanda Tangan Digital</span>
              </div>
              <button
                onClick={handleCancelEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content Edit */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Sebagai psikolog, Anda diwajibkan untuk mengunggah atau menggambar tanda tangan digital. Tanda tangan ini akan otomatis dicantumkan pada setiap Laporan Psikologis yang Anda terbitkan.
              </p>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("draw")}
                  className={`flex-1 pb-2 text-center transition-colors ${
                    activeTab === "draw" ? "border-b-2 border-[#01696f] text-[#01696f]" : "text-slate-400"
                  }`}
                >
                  Gambar Online
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 pb-2 text-center transition-colors ${
                    activeTab === "upload" ? "border-b-2 border-[#01696f] text-[#01696f]" : "text-slate-400"
                  }`}
                >
                  Unggah File Gambar
                </button>
              </div>

              {/* Render drawing pad */}
              {activeTab === "draw" ? (
                <div className="flex flex-col gap-2">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative h-48">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={192}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-full cursor-crosshair touch-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs font-medium text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={13} /> Hapus Coretan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 items-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:border-[#01696f]/40 hover:bg-[#01696f]/[0.03] transition-all cursor-pointer overflow-hidden p-2"
                  >
                    {uploadFile ? (
                      <img src={uploadFile} alt="preview" className="h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <PenTool size={20} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Pilih file gambar TTD</span>
                        <span className="text-[10px] text-slate-400">PNG / JPG (Transparan disukai)</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>

            {/* Footer Edit */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-[#16254c] text-white text-sm font-semibold hover:bg-[#0f1a38] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 size={15} /> Simpan Tanda Tangan
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
export default SignatureModal;
