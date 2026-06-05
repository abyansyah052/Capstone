import { useState, useEffect } from "react";
import { Search, RotateCw, History, ShieldAlert, Key, UserPlus, Database, Calendar, Edit, FileText } from "lucide-react";
import { motion } from "motion/react";

interface Log {
  id: number;
  user_id: string;
  email: string;
  action: string;
  details: string;
  created_at: string;
}

interface ActivityLogsProps {
  currentUser: { id: string; role: string; email: string };
}

// Map action strings to styling and icons
const getActionMeta = (action: string) => {
  switch (action) {
    case "USER_LOGIN":
    case "USER_GOOGLE_LOGIN":
      return { icon: Key, color: "bg-blue-50 text-blue-700 border-blue-100", label: "Login" };
    case "USER_REGISTER":
    case "USER_GOOGLE_REGISTER":
      return { icon: UserPlus, color: "bg-indigo-50 text-indigo-700 border-indigo-100", label: "Registrasi" };
    case "USER_ROLE_PROMOTION":
      return { icon: ShieldAlert, color: "bg-purple-50 text-purple-700 border-purple-100", label: "Promosi Role" };
    case "USER_BANNED":
    case "USER_DELETED":
      return { icon: ShieldAlert, color: "bg-red-50 text-red-700 border-red-100", label: "Moderasi" };
    case "PATIENT_CREATE":
      return { icon: Database, color: "bg-green-50 text-green-700 border-green-100", label: "Buat Pasien" };
    case "PATIENT_UPDATE":
    case "PATIENT_DELETE":
      return { icon: Edit, color: "bg-yellow-50 text-yellow-700 border-yellow-100", label: "Edit Pasien" };
    case "APPOINTMENT_SCHEDULE":
      return { icon: Calendar, color: "bg-teal-50 text-teal-700 border-teal-100", label: "Janji Temu" };
    case "PSYCHOLOGIST_SIGNATURE_UPDATE":
      return { icon: FileText, color: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Tanda Tangan" };
    default:
      return { icon: History, color: "bg-slate-50 text-slate-700 border-slate-100", label: "Sistem" };
  }
};

export function ActivityLogs({ currentUser }: ActivityLogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/logs", {
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
      });
      const json = await res.json();
      if (json.ok) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  const formatLogTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (err) {
      return dateStr;
    }
  };

  return (
    <div className="p-6 max-w-[1400px] w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="text-[#01696f]" /> System Activity Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Audit log aktivitas pengguna, modifikasi data, login, dan promosi sistem.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-55 disabled:cursor-not-allowed shadow-sm"
        >
          <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
          Segarkan
        </button>
      </div>

      {/* Control panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari log berdasarkan email, tipe aksi, atau detail data..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/50 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
          />
        </div>
      </div>

      {/* Logs Feed Timeline */}
      <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
        {isLoading && logs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-medium ml-[-1.5rem] pl-0">Memuat log sistem...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-medium ml-[-1.5rem] pl-0">Tidak ada log aktivitas ditemukan.</div>
        ) : (
          filteredLogs.map((log) => {
            const meta = getActionMeta(log.action);
            const Icon = meta.icon;

            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                key={log.id}
                className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Timeline node dot indicator */}
                <div
                  className={`absolute left-[-2rem] top-[1.2rem] translate-x-[-1px] w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${meta.color}`}
                >
                  <Icon size={12} />
                </div>

                {/* Log Description */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">{log.email}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{log.details}</p>
                </div>

                {/* Timestamp & Meta */}
                <div className="flex flex-col md:items-end justify-center text-xs text-slate-400 flex-shrink-0 font-medium">
                  <span>{formatLogTime(log.created_at)}</span>
                  <span className="font-mono text-[10px] opacity-75 mt-0.5">UID: {log.user_id}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default ActivityLogs;
