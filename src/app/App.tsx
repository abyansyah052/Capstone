import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from "./components/ui/sidebar"
import { Dashboard } from "./components/Dashboard"
import { PatientRegistration } from "./components/PatientRegistration"
import { AppointmentScheduling } from "./components/AppointmentScheduling"
import { MedicalHistory } from "./components/MedicalHistory"
import { LabResults } from "./components/LabResults"
import { DoctorNotes } from "./components/DoctorNotes"
import { Home, Users, Calendar, FileText, TestTube, Stethoscope } from "lucide-react"

export default function App() {
  const [activeModule, setActiveModule] = useState("dashboard")

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "patients", label: "Patient Registration", icon: Users },
    { id: "history", label: "Medical History", icon: FileText },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "lab-results", label: "Lab Results", icon: TestTube },
    { id: "notes", label: "Doctor Notes", icon: Stethoscope },
  ]

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard": return <Dashboard onNavigate={setActiveModule} />
      case "patients": return <PatientRegistration />
      case "history": return <MedicalHistory />
      case "appointments": return <AppointmentScheduling />
      case "lab-results": return <LabResults />
      case "notes": return <DoctorNotes />
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

  const dayName = dayNames[currentTime.getDay()]
  const date = currentTime.getDate()
  const month = monthNames[currentTime.getMonth()]
  const year = currentTime.getFullYear()

  const hours = currentTime.getHours().toString().padStart(2, "0")
  const minutes = currentTime.getMinutes().toString().padStart(2, "0")
  const seconds = currentTime.getSeconds().toString().padStart(2, "0")
  const ampm = currentTime.getHours() >= 12 ? "PM" : "AM"
  const hour12 = (currentTime.getHours() % 12 || 12).toString().padStart(2, "0")


  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar — Navy #1C243B */}
        <Sidebar style={{ backgroundColor: "#1C243B" }} className="border-r border-[#2d3a55]">
          <SidebarHeader className="border-b border-[#2d3a55] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5B55C] shadow-lg">
                <Stethoscope className="h-5 w-5 text-[#1C243B]" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Asisya IHMS</h2>
                <p className="text-xs text-[#E5B55C]">Healthcare Management</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 py-6">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeModule === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    style={isActive ? {
                      backgroundColor: "#243050",
                      color: "#E5B55C",
                      borderLeft: "3px solid #E5B55C"
                    } : {
                      color: "#94a3b8",
                    }}
                    className={`w-full justify-start gap-3 h-11 transition-all duration-200 rounded-lg ${
                      !isActive ? "hover:bg-[#243050] hover:text-white" : ""
                    }`}
                    onClick={() => setActiveModule(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </SidebarContent>
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

              {/* Line pemisah */}
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

          {/* Main Content — Abu-abu #F4F6F9 */}
          <main className="flex-1 overflow-auto" style={{ backgroundColor: "#F4F6F9" }}>
            {renderActiveModule()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}