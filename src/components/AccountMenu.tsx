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

// ─── Palette tokens (mirrored from App.tsx sidebar) ──────────────────────────
const C = {
  navy900: "#1C243B",
  navy800: "#212C47",
  navy700: "#26324D",
  navy600: "#2d3a55",
  navy500: "#3a4a6a",
  gold:    "#E5B55C",
  goldDim: "rgba(229,181,92,0.15)",
  white80: "rgba(255,255,255,0.80)",
  white45: "rgba(255,255,255,0.45)",
  white20: "rgba(255,255,255,0.20)",
  white10: "rgba(255,255,255,0.10)",
  white08: "rgba(255,255,255,0.08)",
  modalBg:     "#ffffff",
  surface:     "#F4F6F9",
  surfaceMd:   "#EEF1F6",
  border:      "#DDE2EC",
  borderFocus: "#1C243B",
  textPrimary: "#111827",
  textMuted:   "#6B7280",
  textFaint:   "#9CA3AF",
  red:    "rgba(239,68,68,0.85)",
  redBg:  "rgba(239,68,68,0.08)",
  blueBanner: "#EFF6FF",
  blueBannerBorder: "#BFDBFE",
  blueText: "#1D4ED8",
  green:  "#16A34A",
  greenBg:"#F0FDF4",
}

type ModalView =
  | "account-settings"
  | "rename"
  | "change-password"
  | "password-email-sent"
  | null

interface AccountMenuProps {
  collapsed?: boolean;
  currentUser?: { id: string; name: string; email: string; role: string; signature: string | null } | null;
  onLogout?: () => void;
}

const MOCK_USER = {
  name: "Dairy Team",
  email: "Dairyteam@Gmail.com",
  initials: "DT",
}

function Avatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = { sm: 28, md: 36, lg: 44 }[size]
  const iconDim = { sm: 13, md: 16, lg: 19 }[size]
  return (
    <div
      style={{
        width: dim, height: dim,
        borderRadius: "50%",
        background: C.navy600,
        border: `1.5px solid ${C.white20}`,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <User style={{ width: iconDim, height: iconDim, color: C.white45 }} />
    </div>
  )
}

const DropdownMenu = forwardRef<
  HTMLDivElement,
  { onClose: () => void; onOpenModal: (v: ModalView) => void; currentUser: any; onLogout: () => void }
>(({ onClose, onOpenModal, currentUser, onLogout }, ref) => (
  <div
    ref={ref}
    style={{
      width: 212,
      borderRadius: 12,
      overflow: "hidden",
      background: C.navy800,
      border: `1px solid ${C.navy600}`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.40), 0 2px 6px rgba(0,0,0,0.25)",
    }}
  >
    <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${C.white10}` }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {currentUser?.name || MOCK_USER.name}
      </p>
      <p style={{ fontSize: 11, color: C.white45, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {currentUser?.email || MOCK_USER.email}
      </p>
    </div>

    <div style={{ padding: "6px 0" }}>
      <MenuBtn
        icon={<Settings style={{ width: 14, height: 14, color: C.white45 }} />}
        label="Account Settings"
        onClick={() => { onOpenModal("account-settings"); onClose() }}
      />

      <div style={{ margin: "4px 12px", height: 1, background: C.white10 }} />

      <MenuBtn
        icon={<LogOut style={{ width: 14, height: 14, color: C.red }} />}
        label="Log Out"
        danger
        onClick={() => { onLogout(); onClose() }}
      />
    </div>
  </div>
))
DropdownMenu.displayName = "DropdownMenu"

function MenuBtn({
  icon, label, danger, onClick,
}: {
  icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px",
        background: hovered
          ? danger ? C.redBg : C.white08
          : "transparent",
        border: "none", cursor: "pointer",
        fontSize: 13,
        color: danger
          ? hovered ? C.red : "rgba(239,68,68,0.70)"
          : hovered ? "#fff" : C.white80,
        transition: "background 120ms, color 120ms",
        textAlign: "left",
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "100%", maxWidth: 440, margin: "0 16px",
          borderRadius: 16, overflow: "hidden",
          background: C.modalBg,
          boxShadow: "0 20px 60px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 22px 14px",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{title}</h2>
      <button
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClose}
        style={{
          width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: hov ? C.surfaceMd : "transparent",
          color: hov ? C.textMuted : C.textFaint,
          transition: "background 120ms, color 120ms",
        }}
      >
        <X style={{ width: 15, height: 15 }} />
      </button>
    </div>
  )
}

function AccountSettingsModal({ onClose, onNav }: { onClose: () => void; onNav: (v: ModalView) => void }) {
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Account Settings" onClose={onClose} />
      <div style={{ padding: "18px 22px 22px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px",
          borderRadius: 10,
          background: C.surface,
          border: `1px solid ${C.border}`,
          marginBottom: 16,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: C.navy900,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <User style={{ width: 18, height: 18, color: C.white45 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
              {MOCK_USER.name}
            </p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {MOCK_USER.email}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SettingsRow
            icon={<Pen style={{ width: 14, height: 14, color: C.navy900 }} />}
            label="Rename Account"
            sub="Change your display name"
            onClick={() => onNav("rename")}
          />
          <SettingsRow
            icon={<Lock style={{ width: 14, height: 14, color: C.navy900 }} />}
            label="Change Password"
            sub="Confirmation sent to your email"
            onClick={() => onNav("change-password")}
          />
        </div>
      </div>
    </Modal>
  )
}

function SettingsRow({
  icon, label, sub, onClick,
}: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${hov ? C.navy600 : C.border}`,
        background: hov ? C.surface : C.modalBg,
        cursor: "pointer",
        transition: "border-color 140ms, background 140ms",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.surfaceMd,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0 }}>{label}</p>
          <p style={{ fontSize: 11, color: C.textFaint, margin: "2px 0 0" }}>{sub}</p>
        </div>
      </div>
      <ChevronRight style={{ width: 15, height: 15, color: hov ? C.textMuted : C.textFaint, flexShrink: 0 }} />
    </button>
  )
}

function RenameModal({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const [value, setValue] = useState(MOCK_USER.name)
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Rename Account" onClose={onClose} />
      <div style={{ padding: "18px 22px 22px" }}>
        <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
          This name will appear across the application.
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textMuted, marginBottom: 6 }}>
            Display Name
          </label>
          <input
            style={{
              width: "100%", padding: "9px 13px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13, color: C.textPrimary,
              outline: "none", boxSizing: "border-box",
              transition: "border-color 120ms",
            }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={40}
            autoFocus
          />
          <p style={{ fontSize: 11, color: C.textFaint, textAlign: "right", marginTop: 4 }}>{value.length}/40</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn label="Back" onClick={onBack} />
          <PrimaryBtn label="Save Changes" onClick={onClickSaveChanges} disabled={!value.trim()} />
        </div>
      </div>
    </Modal>
  )

  function onClickSaveChanges() {
    onClose()
  }
}

function ChangePasswordModal({
  onClose, onBack, onSent,
}: { onClose: () => void; onBack: () => void; onSent: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const mismatch = confirm.length > 0 && next !== confirm

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Change Password" onClose={onClose} />
      <div style={{ padding: "18px 22px 22px" }}>
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 13px", borderRadius: 8,
          background: C.blueBanner,
          border: `1px solid ${C.blueBannerBorder}`,
          marginBottom: 18,
        }}>
          <Mail style={{ width: 14, height: 14, color: C.blueText, marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: C.blueText, lineHeight: 1.5, margin: 0 }}>
            After submitting, a confirmation link will be sent to{" "}
            <span style={{ fontWeight: 600 }}>{MOCK_USER.email}</span>.
            You must confirm via email before the change takes effect.
          </p>
        </div>

        <PwField label="Current Password" value={current} onChange={setCurrent} show={showCurrent} toggle={() => setShowCurrent(p => !p)} placeholder="Enter current password" />
        <PwField label="New Password" value={next} onChange={setNext} show={showNew} toggle={() => setShowNew(p => !p)} placeholder="Min. 8 characters" />

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textMuted, marginBottom: 6 }}>
            Confirm New Password
          </label>
          <div style={{
            display: "flex", alignItems: "center",
            borderRadius: 8,
            border: `1px solid ${mismatch ? "#F87171" : C.border}`,
            overflow: "hidden", transition: "border-color 120ms",
          }}>
            <input
              type={showConfirm ? "text" : "password"}
              style={{ flex: 1, padding: "9px 13px", fontSize: 13, color: C.textPrimary, background: "transparent", border: "none", outline: "none" }}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm(p => !p)}
              style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: C.textFaint }}
            >
              {showConfirm ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          </div>
          {mismatch && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Passwords do not match</p>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn label="Back" onClick={onBack} />
          <PrimaryBtn
            label="Send Confirmation"
            onClick={onSent}
            disabled={!current || !next || !confirm || mismatch}
          />
        </div>
      </div>
    </Modal>
  )
}

function PwField({
  label, value, onChange, show, toggle, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  show: boolean; toggle: () => void; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textMuted, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center",
        borderRadius: 8,
        border: `1px solid ${focused ? C.borderFocus : C.border}`,
        overflow: "hidden", transition: "border-color 120ms",
      }}>
        <input
          type={show ? "text" : "password"}
          style={{ flex: 1, padding: "9px 13px", fontSize: 13, color: C.textPrimary, background: "transparent", border: "none", outline: "none" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={toggle}
          style={{ padding: "0 12px", background: "none", border: "none", cursor: "pointer", color: C.textFaint }}
        >
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </div>
  )
}

function EmailSentModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "32px 24px 28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: C.greenBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <Check style={{ width: 26, height: 26, color: C.green }} />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>
          Confirmation Email Sent
        </h2>
        <p style={{ fontSize: 13, color: C.textMuted, maxWidth: 300, lineHeight: 1.6 }}>
          We've sent a confirmation link to{" "}
          <span style={{ fontWeight: 500, color: C.textPrimary }}>{MOCK_USER.email}</span>.
          Please check your inbox and click the link to complete the password change.
        </p>
        <PrimaryBtn label="Got it" onClick={onClose} style={{ marginTop: 24, width: "100%" }} />
      </div>
    </Modal>
  )
}

function PrimaryBtn({
  label, onClick, disabled, style: extraStyle,
}: {
  label: string; onClick: () => void; disabled?: boolean; style?: React.CSSProperties
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: extraStyle?.width ? undefined : 1,
        padding: "10px 0",
        borderRadius: 8, border: "none",
        fontSize: 13, fontWeight: 500, color: "#fff",
        background: disabled ? "#9CA3AF" : hov ? "#151c2e" : C.navy900,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 140ms",
        ...extraStyle,
      }}
    >
      {label}
    </button>
  )
}

function GhostBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        flex: 1, padding: "10px 0",
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        fontSize: 13, fontWeight: 500,
        color: hov ? C.textPrimary : C.textMuted,
        background: hov ? C.surface : C.modalBg,
        cursor: "pointer",
        transition: "background 140ms, color 140ms",
      }}
    >
      {label}
    </button>
  )
}

export function AccountMenu({
  collapsed = false,
  currentUser = null,
  onLogout = () => {}
}: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<ModalView>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  const closeAll = () => { setMenuOpen(false); setModal(null) }

  useEffect(() => {
    if (!menuOpen || !triggerRef.current || !menuRef.current) return
    const updatePosition = () => {
      const t = triggerRef.current?.getBoundingClientRect()
      const m = menuRef.current?.getBoundingClientRect()
      if (!t || !m) return
      const left = Math.min(Math.max(8, t.right - m.width), window.innerWidth - m.width - 8)
      const top = Math.min(Math.max(8, t.top - m.height - 6), window.innerHeight - m.height - 8)
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

  const Modals = (
    <>
      {modal === "account-settings" && <AccountSettingsModal onClose={closeAll} onNav={setModal} />}
      {modal === "rename" && <RenameModal onClose={closeAll} onBack={() => setModal("account-settings")} />}
      {modal === "change-password" && <ChangePasswordModal onClose={closeAll} onBack={() => setModal("account-settings")} onSent={() => setModal("password-email-sent")} />}
      {modal === "password-email-sent" && <EmailSentModal onClose={closeAll} />}
    </>
  )

  if (collapsed) {
    return (
      <>
        {createPortal(
          <>
            <button
              ref={triggerRef}
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Account menu"
              style={{
                position: "fixed", bottom: 16, left: 10, zIndex: 60,
                display: "flex", alignItems: "center", gap: 10,
                padding: "4px",
                borderRadius: 40,
                background: menuOpen ? C.navy700 : C.navy800,
                border: `1px solid ${C.navy600}`,
                boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                cursor: "pointer",
                transition: "background 140ms",
              }}
            >
              <Avatar size="sm" />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: "1.3", margin: 0 }}>
                  {currentUser?.name || MOCK_USER.name}
                </p>
                <p style={{ fontSize: 10, color: C.white45, lineHeight: "1.3", margin: 0 }}>
                  {currentUser?.email || MOCK_USER.email}
                </p>
              </div>
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, zIndex: 70 }}
              >
                <DropdownMenu
                  onClose={() => setMenuOpen(false)}
                  onOpenModal={setModal}
                  currentUser={currentUser}
                  onLogout={onLogout}
                />
              </div>
            )}
          </>,
          document.body,
        )}
        {Modals}
      </>
    )
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        <button
          ref={triggerRef}
          onClick={() => setMenuOpen(p => !p)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px",
            borderRadius: 8, border: "none",
            background: menuOpen ? C.white10 : "transparent",
            cursor: "pointer",
            transition: "background 140ms",
            textAlign: "left",
          }}
          onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.background = C.white08 }}
          onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = "transparent" }}
        >
          <Avatar size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, lineHeight: "1.3" }}>
              {currentUser?.name || MOCK_USER.name}
            </p>
            <p style={{ fontSize: 11, color: C.white45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0", lineHeight: "1.3" }}>
              {currentUser?.email || MOCK_USER.email}
            </p>
          </div>
          <svg
            style={{
              width: 14, height: 14, color: C.white45, flexShrink: 0,
              transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms",
            }}
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
            <DropdownMenu
              onClose={() => setMenuOpen(false)}
              onOpenModal={setModal}
              currentUser={currentUser}
              onLogout={onLogout}
            />
          </div>
        )}
      </div>
      {Modals}
    </>
  )
}
export default AccountMenu;
