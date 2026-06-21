import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./components/ui/sidebar";
import { Dashboard } from "./components/dashboard/Dashboard";
import { PatientRegistration } from "./components/patient/PatientRegistration";
import { AppointmentScheduling } from "./components/appointment/AppointmentScheduling";
import { MedicalHistory } from "./components/history/MedicalHistory";
import { LaporanPsikologis } from "./components/report/LaporanPsikologis";
import { PsychologistDatabase } from "./components/psychologist/PsychologistDatabase";
import { AccountMenu } from "./components/AccountMenu";
import { UserManagement } from "./components/apex/UserManagement";
import { ActivityLogs } from "./components/apex/ActivityLogs";
import { SignatureModal } from "./components/psychologist/SignatureModal";
import { BatchManagement } from "./components/staff/BatchManagement";
import { Patient, Psychologist, Batch } from "./types";
import {
  Home,
  Users,
  Calendar,
  FileText,
  Activity,
  GraduationCap,
  Shield,
  History,
  Building2,
} from "lucide-react";
import { LoginPage } from "./components/auth/LoginPage";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string; // 'apex' | 'staff' | 'psikolog' | 'reguler'
  signature: string | null;
  status?: string;
}

// Inner component so we can use useSidebar hook (must be inside SidebarProvider)
function AppInner({
  currentUser,
  onLogout,
  onUpdateUser,
}: {
  currentUser: UserSession;
  onLogout: () => void;
  onUpdateUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
}) {
  const [activeModule, setActiveModule] = useState("dashboard");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Dynamic navigation items based on user role
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      roles: ["apex", "staff", "psikolog", "reguler"],
    },
    { id: "user_management", label: "User Management", icon: Shield, roles: ["apex"] },
    { id: "activity_logs", label: "Activity Logs", icon: History, roles: ["apex"] },
    { id: "patients", label: "Registrasi Pasien", icon: Users, roles: ["staff", "psikolog"] },
    { id: "batches", label: "Grup Batch", icon: Building2, roles: ["staff"] },
    { id: "psychologists", label: "Database Psikolog", icon: GraduationCap, roles: ["staff"] },
    { id: "history", label: "Riwayat Psikologis", icon: Activity, roles: ["staff", "psikolog"] },
    {
      id: "appointments",
      label: "Janji Temu",
      icon: Calendar,
      roles: ["staff", "psikolog", "reguler"],
    },
    { id: "notes", label: "Laporan Psikologis", icon: FileText, roles: ["psikolog"] },
  ].filter((item) => item.roles.includes(currentUser.role));

  // Auto-redirect if module not allowed for current role
  useEffect(() => {
    const isAllowed = navigationItems.some((item) => item.id === activeModule);
    if (!isAllowed) {
      setActiveModule("dashboard");
    }
  }, [currentUser, activeModule]);

  // Fetch initial collections for staff
  const fetchCollections = async () => {
    try {
      if (
        currentUser.role === "staff" ||
        currentUser.role === "psikolog" ||
        currentUser.role === "apex"
      ) {
        // Patients
        const resPat = await fetch("/api/patients", {
          headers: {
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
        });
        const jsonPat = await resPat.json();
        if (jsonPat.ok) {
          const mapped = (jsonPat.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email || "",
            idNumber: p.id_number || p.idNumber || "",
            age: Number(p.age) || 0,
            gender: p.gender || "",
            phone: p.phone || "",
            registeredAt: p.registered_at || p.registeredAt || "",
            hasPhoto: !!p.photo || !!p.hasPhoto,
            initials: p.initials || "",
            batchId: p.batch_id || p.batchId || "",
            birthPlace: p.birth_place || p.birthPlace || "",
            education: p.education || "",
            siblingOrder: p.sibling_order || p.siblingOrder || "",
            totalSiblings: p.total_siblings || p.totalSiblings || "",
            dateOfBirth: p.date_of_birth || p.dateOfBirth || "",
            occupation: p.occupation || "",
            country: p.country || "",
            province: p.province || "",
            city: p.city || "",
            fullAddress: p.full_address || p.fullAddress || "",
            photo: p.photo || null,
          }));
          setPatients(mapped);
        }

        // Psychologists
        const resPsy = await fetch("/api/psychologists", {
          headers: {
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
        });
        const jsonPsy = await resPsy.json();
        if (jsonPsy.ok) setPsychologists(jsonPsy.data);

        // Batches
        const resBat = await fetch("/api/batches", {
          headers: {
            "x-user-id": currentUser.id,
            "x-user-role": currentUser.role,
            "x-user-email": currentUser.email,
          },
        });
        const jsonBat = await resBat.json();
        if (jsonBat.ok) setBatches(jsonBat.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [currentUser]);

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveModule} currentUser={currentUser} />;
      case "user_management":
        return <UserManagement currentUser={currentUser} />;
      case "activity_logs":
        return <ActivityLogs currentUser={currentUser} />;
      case "patients":
        return (
          <PatientRegistration
            patients={patients}
            onPatientsChange={setPatients}
            batches={batches}
            currentUser={currentUser}
          />
        );
      case "batches":
        return (
          <BatchManagement
            batches={batches}
            onBatchesChange={setBatches}
            currentUser={currentUser}
          />
        );
      case "psychologists":
        return (
          <PsychologistDatabase
            psychologists={psychologists}
            onPsychologistsChange={setPsychologists}
            currentUser={currentUser}
          />
        );
      case "history":
        return <MedicalHistory patients={patients} currentUser={currentUser} batches={batches} />;
      case "appointments":
        return <AppointmentScheduling psychologists={psychologists} currentUser={currentUser} />;
      case "notes":
        return (
          <LaporanPsikologis
            patients={patients}
            psychologists={psychologists}
            batches={batches}
            currentUser={currentUser}
          />
        );
      default:
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUser.role} />;
    }
  };

  const getCurrentModuleTitle = () => {
    return navigationItems.find((item) => item.id === activeModule)?.label ?? "Dashboard";
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const dayName = dayNames[currentTime.getDay()] ?? "";
  const date = currentTime.getDate();
  const month = monthNames[currentTime.getMonth()] ?? "";
  const year = currentTime.getFullYear();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const ampm = currentTime.getHours() >= 12 ? "PM" : "AM";
  const hour12 = (currentTime.getHours() % 12 || 12).toString().padStart(2, "0");

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar — Navy #1C243B */}
      <Sidebar style={{ backgroundColor: "#1C243B" }} className="border-r border-[#2d3a55]">
        <SidebarHeader className="px-4 pt-5 pb-4">
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
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium
                    transition-all duration-150 text-left
                    ${
                      isActive
                        ? "bg-white/10 text-[#E5B55C] border-l-2 border-[#E5B55C] pl-[10px]"
                        : "text-white hover:text-white hover:bg-white/10 border-l-2 border-transparent pl-[10px]"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-[#E5B55C]" : "text-white/80"}`}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </SidebarContent>

        <SidebarFooter
          className="px-3 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <AccountMenu
            collapsed={isCollapsed}
            currentUser={currentUser}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
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
            <div className="flex flex-col items-center justify-center px-4">
              <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider leading-none mb-0.5">
                {dayName}
              </span>
              <span className="text-sm font-bold text-[#1C243B] leading-none">
                {date} {month} {year}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-300" />
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

      {/* Signature Pad Popup Modal for Psychologists with missing signature */}
      <AnimatePresence>
        {currentUser.role === "psikolog" && currentUser.signature === null && (
          <SignatureModal
            currentUser={currentUser}
            onSaveSuccess={(sigData) => {
              onUpdateUser((prev) => (prev ? { ...prev, signature: sigData } : null));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <SidebarProvider>
      <AppInner currentUser={currentUser} onLogout={handleLogout} onUpdateUser={setCurrentUser} />
    </SidebarProvider>
  );
}
