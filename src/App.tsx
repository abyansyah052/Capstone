import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./components/ui/sidebar"
import { Dashboard } from "./components/dashboard/Dashboard"
import { PatientRegistration, INIT_PATIENTS } from "./components/patient/PatientRegistration"
import { AppointmentScheduling } from "./components/appointment/AppointmentScheduling"
import { MedicalHistory } from "./components/history/MedicalHistory"
import { LaporanPsikologis } from "./components/report/LaporanPsikologis"
import { PsychologistDatabase, INIT_PSYCHOLOGISTS } from "./components/psychologist/PsychologistDatabase"
import { AccountMenu } from "./components/AccountMenu"
import { Patient, Psychologist } from "./types"
import { Home, Users, Calendar, FileText, Activity, GraduationCap } from "lucide-react"
import { LoginPage } from "./components/auth/LoginPage"

// Inner component so we can use useSidebar hook (must be inside SidebarProvider)
function AppInner() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [patients, setPatients] = useState<Patient[]>(INIT_PATIENTS)
  const [psychologists, setPsychologists] = useState<Psychologist[]>(INIT_PSYCHOLOGISTS)

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "patients", label: "Registrasi Pasien", icon: Users },
    { id: "psychologists", label: "Database Psikolog", icon: GraduationCap },
    { id: "history", label: "Riwayat Psikologis", icon: Activity },
    { id: "appointments", label: "Janji Temu", icon: Calendar },
    { id: "notes", label: "Laporan Psikologis", icon: FileText },
  ]

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard": return <Dashboard onNavigate={setActiveModule} />
      case "patients": return <PatientRegistration patients={patients} onPatientsChange={setPatients} />
      case "psychologists": return <PsychologistDatabase psychologists={psychologists} onPsychologistsChange={setPsychologists} />
      case "history": return <MedicalHistory />
      case "appointments": return <AppointmentScheduling />
      case "notes": return <LaporanPsikologis patients={patients} psychologists={psychologists} />
      default: return <Dashboard onNavigate={setActiveModule} />
    }
  }

  const getCurrentModuleTitle = () => {
    return navigationItems.find(item => item.id === activeModule)?.label ?? "Dashboard"
  }

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]

  const dayName = dayNames[currentTime.getDay()] ?? ""
  const date = currentTime.getDate()
  const month = monthNames[currentTime.getMonth()] ?? ""
  const year = currentTime.getFullYear()
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")
  const ampm = currentTime.getHours() >= 12 ? "PM" : "AM"
  const hour12 = (currentTime.getHours() % 12 || 12).toString().padStart(2, "0")

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar — Navy #1C243B */}
      <Sidebar style={{ backgroundColor: "#1C243B" }} className="border-r border-[#2d3a55]">
        <SidebarHeader className="px-4 pt-5 pb-4">
          {/* Logo — hidden when collapsed */}
          {!isCollapsed && (
            <img
              src="/SI Capstone 1 Group 2.svg"
              alt="Asisya IHMS"
              className="h-18 w-auto object-contain"
            />
          )}
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <nav className="flex flex-col gap-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium
                    transition-all duration-150 text-left
                    ${isActive
                      ? "bg-white/10 text-[#E5B55C] border-l-2 border-[#E5B55C] pl-[10px]"
                      : "text-white hover:text-white hover:bg-white/10 border-l-2 border-transparent pl-[10px]"
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-[#E5B55C]" : "text-white/80"}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>
        </SidebarContent>

        {/* ── Account profile at sidebar bottom ── */}
        <SidebarFooter
          className="px-3 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <AccountMenu collapsed={isCollapsed} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex-1">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-[#475569] hover:text-[#1C243B]" />
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="font-semibold text-[#111827]">{getCurrentModuleTitle()}</h1>
          </div>

          {/* Date + Time Card */}
          <div
            className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm"
            style={{ height: "46px" }}
          >
            {/* Tanggal */}
            <div className="flex flex-col items-center justify-center px-4">
              <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider leading-none mb-0.5">
                {dayName}
              </span>
              <span className="text-sm font-bold text-[#1C243B] leading-none">
                {date} {month} {year}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-300" />

            {/* Jam */}
            <div className="flex items-center gap-1.5 px-4">
              <span className="text-sm font-bold text-[#1C243B]">
                {hour12}:{minutes}
              </span>
              <span className="text-xs font-medium text-[#6B7280]">{ampm}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: "#F4F6F9" }}>
          {renderActiveModule()}
        </main>
      </SidebarInset>
    </div>
  )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <SidebarProvider>
      <AppInner />
    </SidebarProvider>
  );
}
