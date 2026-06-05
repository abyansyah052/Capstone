import { useState, useEffect } from "react";
import { Search, UserCheck, Trash2, UserX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // 'apex' | 'staff' | 'psikolog' | 'reguler'
  status: string; // 'active' | 'banned'
  created_at: string;
}

interface UserManagementProps {
  currentUser: { id: string; role: string; email: string };
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/users", {
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
      });
      const json = await res.json();
      if (json.ok) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    // Add additional prompt info for psychologist role setup
    let extraData = {};
    if (newRole === "psikolog") {
      const sipp = prompt("Masukkan No. SIPP Psikolog:");
      if (!sipp) return;
      const origin = prompt("Masukkan Kota Asal:");
      const age = prompt("Masukkan Usia:");
      const phone = prompt("Masukkan No. Telepon:");
      const address = prompt("Masukkan Alamat Praktik:");

      extraData = {
        sipp,
        origin: origin || "",
        age: Number(age) || 0,
        phone: phone || "",
        address: address || "",
      };
    }

    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify({ role: newRole, ...extraData }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage(`Role berhasil diubah menjadi ${newRole}`);
        fetchUsers();
      } else {
        alert(json.error || "Gagal mengubah role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status user ini menjadi ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/auth/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage(`Status user berhasil diubah menjadi ${newStatus}`);
        fetchUsers();
      } else {
        alert(json.error || "Gagal mengubah status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini secara permanen dari sistem?")) return;
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
          "x-user-email": currentUser.email,
        },
      });
      const json = await res.json();
      if (json.ok) {
        setMessage("User berhasil dihapus");
        fetchUsers();
      } else {
        alert(json.error || "Gagal menghapus user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    apex: users.filter((u) => u.role === "apex").length,
    staff: users.filter((u) => u.role === "staff").length,
    psikolog: users.filter((u) => u.role === "psikolog").length,
    reguler: users.filter((u) => u.role === "reguler").length,
  };

  return (
    <div className="p-6 max-w-[1400px] w-full mx-auto space-y-6">
      {/* Alert Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#01696f] text-white px-4 py-2.5 rounded-xl shadow-lg font-medium text-sm"
          >
            {message}
            <button onClick={() => setMessage("")} className="ml-3 font-bold opacity-80 hover:opacity-100">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management Console</h1>
        <p className="text-sm text-slate-500 mt-1">Mengelola akses akun, penugasan role, dan status keanggotaan pengguna.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Pengguna", value: stats.total, color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Apex Admin", value: stats.apex, color: "bg-red-50 text-red-700 border-red-100" },
          { label: "Staff Admins", value: stats.staff, color: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: "Psikolog", value: stats.psikolog, color: "bg-teal-50 text-teal-700 border-teal-100" },
          { label: "User Reguler", value: stats.reguler, color: "bg-slate-50 text-slate-700 border-slate-100" },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-xl border bg-white ${s.color} shadow-sm flex flex-col justify-between`}>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{s.label}</span>
            <span className="text-2xl font-bold mt-2">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#01696f]/50 focus:ring-2 focus:ring-[#01696f]/10 transition-all"
            />
          </div>
        </div>

        {/* User Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400">Nama</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400">Email</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400">Role Saat Ini</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400">Ubah Role</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-400 w-36">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">Memuat data pengguna...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">Tidak ada data pengguna yang sesuai</td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nama */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800 flex items-center gap-1.5">
                      {u.name} {isSelf && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">(Saya)</span>}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{u.email}</td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        u.role === "apex" ? "bg-red-100 text-red-800" :
                        u.role === "staff" ? "bg-amber-100 text-amber-800" :
                        u.role === "psikolog" ? "bg-teal-100 text-teal-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        u.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {u.status === "active" ? "Aktif" : "Diblokir"}
                      </span>
                    </td>

                    {/* Ubah Role Action */}
                    <td className="px-4 py-3.5">
                      <select
                        disabled={isSelf || (currentUser.role === "staff" && (u.role === "apex" || u.role === "staff"))}
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="text-xs border border-slate-200 bg-white rounded p-1 focus:outline-none focus:border-[#01696f]"
                      >
                        <option value="reguler">Reguler</option>
                        <option value="psikolog">Psikolog</option>
                        {currentUser.role === "apex" && <option value="staff">Staff</option>}
                        {currentUser.role === "apex" && <option value="apex">Apex Admin</option>}
                      </select>
                    </td>

                    {/* Ban / Delete Actions */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Ban / Unban (Apex Only) */}
                        {currentUser.role === "apex" && (
                          <button
                            disabled={isSelf}
                            onClick={() => handleUpdateStatus(u.id, u.status === "active" ? "banned" : "active")}
                            title={u.status === "active" ? "Blokir akun" : "Aktifkan akun kembali"}
                            className={`p-1.5 rounded transition-all ${
                              isSelf ? "text-slate-200 cursor-not-allowed" :
                              u.status === "active"
                                ? "text-amber-500 hover:bg-amber-50"
                                : "text-green-500 hover:bg-green-50"
                            }`}
                          >
                            {u.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        )}

                        {/* Delete User (Apex Only) */}
                        {currentUser.role === "apex" && (
                          <button
                            disabled={isSelf}
                            onClick={() => handleDeleteUser(u.id)}
                            title="Hapus user permanen"
                            className={`p-1.5 rounded ${
                              isSelf ? "text-slate-200 cursor-not-allowed" : "text-red-500 hover:bg-red-50"
                            }`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default UserManagement;
