import React, { useState } from "react"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Psychologist } from "../../types"
import { avatarColor, getInitials } from "../../lib/helpers"

function TH({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-400 ${className}`}>
      {children}
    </th>
  )
}

type PsychologistDirectoryProps = {
  psychologists: Psychologist[]
  onNew: () => void
  onEdit: (p: Psychologist) => void
  onDelete: (p: Psychologist) => void
}

export function PsychologistDirectory({
  psychologists,
  onNew,
  onEdit,
  onDelete,
}: PsychologistDirectoryProps) {
  const [search, setSearch] = useState("")

  const processed = psychologists.filter(p => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.sipp.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Database Psikolog</h1>
          <p className="text-sm text-slate-500 mt-0.5">{psychologists.length} psikolog terdaftar</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16254c] text-white text-sm font-medium hover:bg-[#0f1a38] active:bg-[#0a1128] transition-all shadow-sm"
        >
          <Plus size={14} />
          Psikolog Baru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, No. SIPP, asal kota…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/50 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <TH className="pl-5">Psikolog</TH>
              <TH>No. SIPP</TH>
              <TH>Asal / Kota</TH>
              <TH>Umur</TH>
              <TH>Kontak &amp; Email</TH>
              <TH>Tanda Tangan</TH>
              <TH className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processed.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Search size={28} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Tidak ada data yang sesuai</p>
                </td>
              </tr>
            ) : (
              processed.map(p => {
                const bgColor = avatarColor(p.name)
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Profil */}
                    <td className="pl-5 pr-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: bgColor }}
                        >
                          {getInitials(p.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 leading-snug">{p.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{p.address}</p>
                        </div>
                      </div>
                    </td>

                    {/* SIPP */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono text-xs text-[#01696f] font-semibold bg-[#01696f]/[0.06] px-2 py-0.5 rounded">
                        {p.sipp}
                      </span>
                    </td>

                    {/* Asal */}
                    <td className="px-3 py-3.5 text-xs text-slate-700 font-medium">
                      {p.origin}
                    </td>

                    {/* Usia */}
                    <td className="px-3 py-3.5 text-xs text-slate-600 tabular-nums">
                      {p.age} th
                    </td>

                    {/* Kontak */}
                    <td className="px-3 py-3.5">
                      <p className="text-xs text-slate-700 font-medium tabular-nums">{p.phone}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.email}</p>
                    </td>

                    {/* TTD */}
                    <td className="px-3 py-3.5">
                      {p.signature ? (
                        <div className="h-8 w-20 border border-slate-100 rounded-md bg-white p-0.5 overflow-hidden flex items-center justify-center">
                          <img src={p.signature} alt="TTD" className="h-full object-contain" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 italic">Belum diunggah</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          title="Edit psikolog"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                          onClick={() => onEdit(p)}
                        >
                          <Pencil size={11} />
                          Edit
                        </button>
                        <button
                          title="Hapus"
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          onClick={() => onDelete(p)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default PsychologistDirectory;
