import { Users, Calendar, ClipboardList, Activity, FileText } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import bannerImg from "../../assets/Psikolog Asisya Web Design.png"

interface DashboardProps {
  onNavigate: (module: string) => void
}

const scorecards = [
  {
    label: "Total Pasien",
    value: "1,125",
    icon: Users,
  },
  {
    label: "Janji Temu Hari Ini",
    value: "26",
    icon: Calendar,
  },
  {
    label: "Janji Temu Internal",
    value: "18",
    icon: ClipboardList,
  },
]

const modules = [
  {
    id: "patients",
    label: "Registrasi Pasien",
    description: "Registrasi pasien baru dan atur detail personal",
    icon: Users,
  },
  {
    id: "history",
    label: "Riwayat Psikologis",
    description: "Lihat riwayat psikologis pasien",
    icon: Activity,
  },
  {
    id: "appointments",
    label: "Janji Temu",
    description: "Jadwalkan atau atur janji temu dengan pasien",
    icon: Calendar,
  },
  {
    id: "notes",
    label: "Laporan Psikologis",
    description: "Lihat dan perbarui laporan psikologis pasien",
    icon: FileText,
  },
]

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="p-6 space-y-6">

      {/* Banner Selamat Datang */}
      <div
        className="relative rounded-2xl overflow-hidden h-52"
        style={{ backgroundColor: "#1C243B" }}
      >
        {/* Foto placeholder — psychologist consulting */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${bannerImg})`,
            backgroundSize: "65%",        // ← zoom out: turunkan %, zoom in: naikkan
            backgroundPosition: "left 30%",  // ← geser: "left", "20% center", dst
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Gradient overlay kanan */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, transparent 30%, #1C243B 65%)",
          }}
        />

        {/* Teks kanan */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-center px-10 max-w-lg">
          <h2 className="text-white font-semibold text-xl mb-2">
            Selamat Datang di Asisya Consulting IPMS
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            IPMS adalah Internal Psychological management system untuk mengatur informasi pasien, janji temu, dan
            data psikologis dengan aman dan mudah.
          </p>
        </div>
      </div>

      {/* Scorecard Row */}
      <div className="grid grid-cols-3 gap-4">
        {scorecards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">{card.label}</p>
                  <p className="text-3xl font-semibold text-[#111827]">{card.value}</p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#E6F0FD" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#475569" }} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modul */}
      <div>
        <h3 className="text-base font-medium text-[#111827] mb-3">Modul</h3>
        <div className="grid grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Card
                key={mod.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => onNavigate(mod.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: "#E6F0FD" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#475569" }} />
                    </div>
                    <span className="font-medium text-[#111827]">{mod.label}</span>
                  </div>
                  <p className="text-sm text-[#6B7280]">{mod.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

    </div>
  )
}
export default Dashboard;
