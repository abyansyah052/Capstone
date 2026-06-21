import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Psychologist } from "../../types";

type DeleteModalProps = {
  target: Psychologist;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteModal({ target, onConfirm, onCancel }: DeleteModalProps) {
  const [input, setInput] = useState("");
  const phrase = target.name;
  const valid = input.trim() === phrase;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 id="delete-title" className="text-[15px] font-semibold text-slate-900">
              Hapus Psikolog
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-800">{target.name}</span> akan dihapus
              secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="delete-confirm" className="text-sm text-slate-600">
              Ketik nama psikolog{" "}
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                {phrase}
              </span>{" "}
              untuk melanjutkan
            </label>
            <input
              id="delete-confirm"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) onConfirm();
              }}
              placeholder="Ketik nama psikolog…"
              spellCheck={false}
              autoComplete="off"
              className={`px-3.5 py-2.5 rounded-lg border text-sm font-mono transition-all outline-none ${
                input.length > 0 && !valid
                  ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : valid
                    ? "border-green-400 bg-green-50/40 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    : "border-slate-200 bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              }`}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:bg-slate-100 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={!valid}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              valid
                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Trash2 size={14} />
            Hapus Psikolog
          </button>
        </div>
      </motion.div>
    </div>
  );
}
