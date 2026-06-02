import { useState, useRef, useEffect, forwardRef } from "react"
import { createPortal } from "react-dom"
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Lock,
  Pen,
  X,
  Eye,
  EyeOff,
  Mail,
  Check,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalView =
  | "account-settings"
  | "rename"
  | "change-password"
  | "password-email-sent"
  | null

interface AccountMenuProps {
  /** Jika true = sidebar sedang collapsed → tampilkan floating pop di kiri bawah */
  collapsed?: boolean
}

// ─── Static mock data ─────────────────────────────────────────────────────────
const MOCK_USER = {
  name: "Dairy Team",
  email: "Dairyteam@Gmail.com",
  initials: "DT",
}

// ─── Shared avatar ────────────────────────────────────────────────────────────
function Avatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-7 h-7 text-[11px]", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" }
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-[#2d3a55] border border-white/20 flex items-center justify-center flex-shrink-0`}
    >
      <User className="text-white/70" style={{ width: size === "sm" ? 13 : size === "md" ? 16 : 18, height: size === "sm" ? 13 : size === "md" ? 16 : 18 }} />
    </div>
  )
}

// ─── Dropdown menu ────────────────────────────────────────────────────────────
const DropdownMenu = forwardRef<HTMLDivElement, { onClose: () => void; onOpenModal: (v: ModalView) => void }>(
  ({ onClose, onOpenModal }, ref) => (
    <div
      ref={ref}
      className="z-50 w-52 rounded-xl overflow-hidden"
      style={{
        background: "#26324D",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      {/* User identity row */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-white/10">
        <p className="text-[13px] font-semibold text-white leading-tight truncate">{MOCK_USER.name}</p>
        <p className="text-[11px] text-white/45 mt-0.5 truncate">{MOCK_USER.email}</p>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        <button
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-white/80 hover:bg-white/8 hover:text-white transition-colors duration-100 text-left"
          onClick={() => { onOpenModal("account-settings"); onClose() }}
        >
          <Settings className="w-3.5 h-3.5 flex-shrink-0 text-white/50" />
          Account Settings
        </button>

        <div className="my-1 mx-3 h-px bg-white/10" />

        <button
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-100 text-left"
          onClick={() => { alert("Logout triggered"); onClose() }}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </div>
  ),
)
DropdownMenu.displayName = "DropdownMenu"

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
      <h2 className="text-[15px] font-semibold text-[#111827]">{title}</h2>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Account Settings modal ───────────────────────────────────────────────────
function AccountSettingsModal({ onClose, onNav }: { onClose: () => void; onNav: (v: ModalView) => void }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Account Settings" onClose={onClose} />
      <div className="px-6 py-5">
        {/* Profile summary */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-5">
          <div className="w-11 h-11 rounded-full bg-[#1C243B] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white/70" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#111827] truncate">{MOCK_USER.name}</p>
            <p className="text-[12px] text-slate-500 truncate">{MOCK_USER.email}</p>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group text-left"
            onClick={() => onNav("rename")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1C243B]/8 flex items-center justify-center">
                <Pen className="w-3.5 h-3.5 text-[#1C243B]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#111827]">Rename Account</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Change your display name</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>

          <button
            className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group text-left"
            onClick={() => onNav("change-password")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1C243B]/8 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-[#1C243B]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#111827]">Change Password</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Confirmation sent to your email</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Rename modal ─────────────────────────────────────────────────────────────
function RenameModal({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const [value, setValue] = useState(MOCK_USER.name)
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Rename Account" onClose={onClose} />
      <div className="px-6 py-5">
        <p className="text-[12px] text-slate-500 mb-4">This name will appear across the application.</p>
        <div className="mb-5">
          <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Display Name</label>
          <input
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-[#1C243B] focus:outline-none text-[13px] text-[#111827] transition-colors"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={40}
            autoFocus
          />
          <p className="text-[11px] text-slate-400 mt-1 text-right">{value.length}/40</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-colors"
            style={{ background: "#1C243B" }}
            onClick={onClose}
            disabled={!value.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Change Password modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose, onBack, onSent }: { onClose: () => void; onBack: () => void; onSent: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const mismatch = confirm.length > 0 && next !== confirm

  const EyeToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" tabIndex={-1} onClick={toggle} className="text-slate-400 hover:text-slate-600">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  const Field = ({
    label, value, onChange, show, toggle, placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; toggle: () => void; placeholder?: string
  }) => (
    <div className="mb-4">
      <label className="block text-[12px] font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center rounded-lg border border-slate-200 focus-within:border-[#1C243B] overflow-hidden transition-colors">
        <input
          type={show ? "text" : "password"}
          className="flex-1 px-3.5 py-2.5 text-[13px] text-[#111827] bg-transparent outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <div className="px-3">
          <EyeToggle show={show} toggle={toggle} />
        </div>
      </div>
    </div>
  )

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Change Password" onClose={onClose} />
      <div className="px-6 py-5">
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-blue-50 border border-blue-100 mb-5">
          <Mail className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            After submitting, a confirmation link will be sent to <span className="font-semibold">{MOCK_USER.email}</span>. You must confirm via email before the change takes effect.
          </p>
        </div>

        <Field label="Current Password" value={current} onChange={setCurrent} show={showCurrent} toggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" />
        <Field label="New Password" value={next} onChange={setNext} show={showNew} toggle={() => setShowNew(p => !p)} placeholder="Min. 8 characters" />

        <div className="mb-5">
          <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Confirm New Password</label>
          <div className={`flex items-center rounded-lg border ${mismatch ? "border-red-400" : "border-slate-200 focus-within:border-[#1C243B]"} overflow-hidden transition-colors`}>
            <input
              type={showConfirm ? "text" : "password"}
              className="flex-1 px-3.5 py-2.5 text-[13px] text-[#111827] bg-transparent outline-none"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
            />
            <div className="px-3">
              <EyeToggle show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
            </div>
          </div>
          {mismatch && <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>}
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-40"
            style={{ background: "#1C243B" }}
            disabled={!current || !next || !confirm || mismatch}
            onClick={onSent}
          >
            Send Confirmation
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Email sent modal ─────────────────────────────────────────────────────────
function EmailSentModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="px-6 pt-8 pb-7 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-green-500" />
        </div>
        <h2 className="text-[15px] font-semibold text-[#111827] mb-2">Confirmation Email Sent</h2>
        <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed">
          We've sent a confirmation link to <span className="font-medium text-[#111827]">{MOCK_USER.email}</span>. Please check your inbox and click the link to complete the password change.
        </p>
        <button
          className="mt-6 w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition-colors"
          style={{ background: "#1C243B" }}
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </Modal>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function AccountMenu({ collapsed = false }: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<ModalView>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  const closeAll = () => { setMenuOpen(false); setModal(null) }

  useEffect(() => {
    if (!menuOpen || !triggerRef.current || !menuRef.current) return

    const updatePosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect()
      const menuRect = menuRef.current?.getBoundingClientRect()
      if (!triggerRect || !menuRect) return

      const frameLeft = 0
      const frameRight = window.innerWidth
      const frameTop = 0
      const frameBottom = window.innerHeight
      const targetLeft = triggerRect.right - menuRect.width
      const left = Math.min(
        Math.max(frameLeft + 8, targetLeft),
        Math.max(frameLeft + 8, frameRight - menuRect.width - 8),
      )
      const top = Math.min(
        Math.max(frameTop + 8, triggerRect.top - menuRect.height - 6),
        Math.max(frameTop + 8, frameBottom - menuRect.height - 8),
      )

      setMenuPosition({ top, left })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [menuOpen])

  // ── Collapsed mode: small floating pop at bottom-left ──────────────────────
  if (collapsed) {
    const collapsedTrigger = (
      <>
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen((p) => !p)}
          className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[#23304A] px-3 py-2 shadow-md hover:bg-[#2B3A57] transition-colors"
          aria-label="Account menu"
          style={{ position: "fixed", bottom: 16, left: 12, zIndex: 60 }}
        >
          <Avatar size="sm" />
          <div className="text-left">
            <p className="text-[12px] font-semibold text-white leading-tight">{MOCK_USER.name}</p>
            <p className="text-[10px] text-white/45 leading-tight">{MOCK_USER.email}</p>
          </div>
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, zIndex: 70 }}
          >
            <DropdownMenu onClose={() => setMenuOpen(false)} onOpenModal={setModal} />
          </div>
        )}
      </>
    )

    return (
      <>
        {createPortal(collapsedTrigger, document.body)}

        {modal === "account-settings" && <AccountSettingsModal onClose={closeAll} onNav={setModal} />}
        {modal === "rename" && <RenameModal onClose={closeAll} onBack={() => setModal("account-settings")} />}
        {modal === "change-password" && <ChangePasswordModal onClose={closeAll} onBack={() => setModal("account-settings")} onSent={() => setModal("password-email-sent")} />}
        {modal === "password-email-sent" && <EmailSentModal onClose={closeAll} />}
      </>
    )
  }

  // ── Expanded mode: full profile row at sidebar bottom ──────────────────────
  return (
    <>
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen((p) => !p)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors duration-150 text-left ${
            menuOpen ? "bg-white/10" : "hover:bg-white/8"
          }`}
        >
          <Avatar size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">{MOCK_USER.name}</p>
            <p className="text-[11px] text-white/45 truncate mt-0.5 leading-tight">{MOCK_USER.email}</p>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform duration-200 ${
              menuOpen ? "rotate-180" : "rotate-0"
            }`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, zIndex: 70 }}
          >
            <DropdownMenu onClose={() => setMenuOpen(false)} onOpenModal={setModal} />
          </div>
        )}
      </div>

      {modal === "account-settings" && <AccountSettingsModal onClose={closeAll} onNav={setModal} />}
      {modal === "rename" && <RenameModal onClose={closeAll} onBack={() => setModal("account-settings")} />}
      {modal === "change-password" && <ChangePasswordModal onClose={closeAll} onBack={() => setModal("account-settings")} onSent={() => setModal("password-email-sent")} />}
      {modal === "password-email-sent" && <EmailSentModal onClose={closeAll} />}
    </>
  )
}
