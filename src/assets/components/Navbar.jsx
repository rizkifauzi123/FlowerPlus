import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../Style/Navbar.css";
import {
  Bell, ChevronDown, Menu,
  User, Settings, LogOut, AlertCircle, ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";

/* ─────────────────────────────────────────
   Portal wrapper — renders children into
   document.body, escaping any sticky/transform
   ancestor that would break fixed positioning
───────────────────────────────────────── */
const Portal = ({ children }) =>
  createPortal(children, document.body);

/* ─────────────────────────────────────────
   Logout Modal (pure presentational)
───────────────────────────────────────── */
const LogoutModal = ({ onCancel, onConfirm }) => (
  <Portal>
    <div
      className="logout-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="logout-modal">

        {/* Visual header */}
        <div className="logout-modal-visual">
          <span className="lo-ring-inner r2" />
          <span className="lo-ring-inner r3" />
          <div className="logout-modal-icon">
            <LogOut size={26} />
          </div>
        </div>

        {/* Body */}
        <div className="logout-modal-body">
          <h3>Confirm Logout</h3>
          <p>
            Are you sure you want to logout from{" "}
            <strong>FlowerPlus</strong>?{" "}
            You'll need to sign in again to continue.
          </p>
          <div className="logout-actions">
            <button className="logout-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="logout-confirm" onClick={onConfirm}>
              Yes, Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  </Portal>
);

/* ─────────────────────────────────────────
   Loading Screen
───────────────────────────────────────── */
const LogoutLoading = () => (
  <Portal>
    <div className="logout-loading">
      <div className="logout-spinner" />
      <p>Logging out…</p>
    </div>
  </Portal>
);

/* ─────────────────────────────────────────
   Navbar
───────────────────────────────────────── */
const Navbar = ({ onToggleDesktop, onToggleMobile }) => {
  const [userOpen, setUserOpen]           = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const notifRef = useRef(null);
  const userRef  = useRef(null);
  const navigate = useNavigate();

  const {
    overdueCount,
    overdueInvoices,
    user,
    admins,
    setFocusedInvoiceId
  } = useApp();

  const otherAdmins = admins.filter(a => a.name !== user.name);

  const visibleAdmins = otherAdmins.slice(0, 2);
  const extraCount = otherAdmins.length - 2;

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* lock body scroll when modal is open */
  useEffect(() => {
    document.body.style.overflow = logoutConfirm ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [logoutConfirm]);

  const handleLogout = () => {
    setLogoutConfirm(false);
    setLogoutLoading(true);
    setTimeout(() => {
      localStorage.removeItem("isLoggedIn");
      navigate("/login", { replace: true });
    }, 1500);
  };

  const getDaysLate = (inv) => {
    const due = new Date(inv.date);
    due.setDate(due.getDate() + 7);
    return Math.floor((new Date() - due) / (1000 * 60 * 60 * 24));
  };

  const handleViewInvoice = (inv) => {
    setFocusedInvoiceId(inv.id);
    navigate("/payment");
    setNotifOpen(false);
  };

  return (
    <>
      <header className="navbar">

        {/* LEFT */}
        <div className="navbar-left">
          <button className="navbar-toggle desktop-toggle" onClick={onToggleDesktop} title="Toggle Sidebar">
            ⬅
          </button>
          <button className="navbar-toggle mobile-toggle" onClick={onToggleMobile} title="Open Menu">
            <Menu size={17} />
          </button>
        </div>

        {/* RIGHT */}
        <div className="navbar-right">

          <div className="nb-admins-online">

            {visibleAdmins.map((admin, i) => (
              <div key={i} className="nb-admin-avatar">
                {admin.avatar
                  ? <img src={admin.avatar} alt={admin.name} />
                  : admin.name.charAt(0)}
              </div>
            ))}

            {extraCount > 0 && (
              <div className="nb-admin-more">
                +{extraCount}
              </div>
            )}

          </div>

          {/* NOTIFICATION */}
          <div className="nb-notif-wrap" ref={notifRef}>
            <button
              className={`nb-icon-btn ${notifOpen ? "active" : ""}`}
              onClick={() => { setNotifOpen(p => !p); setUserOpen(false); }}
              title="Notifikasi"
            >
              <Bell size={18} />
              {overdueCount > 0 && (
                <span className="nb-badge">{overdueCount > 9 ? "9+" : overdueCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="nb-notif-panel">
                <div className="nb-panel-header">
                  <div className="nb-panel-title">
                    <AlertCircle size={14} />
                    <span>Overdue Invoices</span>
                  </div>
                  {overdueCount > 0 && (
                    <span className="nb-count-pill">{overdueCount}</span>
                  )}
                </div>

                <div className="nb-notif-body">
                  {overdueInvoices.length === 0 ? (
                    <div className="nb-notif-empty">
                      <span className="nb-empty-icon">🎉</span>
                      <span>Semua invoice lunas!</span>
                    </div>
                  ) : (
                    overdueInvoices.map((inv) => (
                      <div key={inv.id} className="nb-notif-item">
                        <div className="nb-notif-dot" />
                        <div className="nb-notif-info">
                          <span className="nb-notif-name">{inv.customer}</span>
                          <span className="nb-notif-meta">
                            <span className="nb-notif-num">{inv.invoiceNumber}</span>
                            <span className="nb-notif-late">· Terlambat {getDaysLate(inv)} hari</span>
                          </span>
                        </div>
                        <button className="nb-notif-cta" onClick={() => handleViewInvoice(inv)}>
                          Lihat
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {overdueInvoices.length > 0 && (
                  <div className="nb-panel-footer">
                    <button
                      className="nb-view-all"
                      onClick={() => { navigate("/payment"); setNotifOpen(false); }}
                    >
                      Lihat Semua <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="nb-divider" />

          {/* USER */}
          <div className="nb-user-wrap" ref={userRef}>
            <button
              className={`nb-user-trigger ${userOpen ? "active" : ""}`}
              onClick={() => { setUserOpen(p => !p); setNotifOpen(false); }}
            >
              <div className="nb-avatar">
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" />
                  : user.name.charAt(0)}
              </div>
              <div className="nb-user-text">
                <span className="nb-name">{user.name}</span>
                <span className="nb-role">{user.role}</span>
              </div>
              <ChevronDown size={13} className={`nb-chevron ${userOpen ? "rotated" : ""}`} />
            </button>

            {userOpen && (
              <div className="nb-user-menu">
                <div className="nb-user-menu-head">
                  <div className="nb-menu-avatar">
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" />
                      : user.name.charAt(0)}
                  </div>
                  <div>
                    <span className="nb-menu-name">{user.name}</span>
                    <span className="nb-menu-role">{user.role}</span>
                  </div>
                </div>
                <div className="nb-menu-divider" />
                <button
                  className="nb-menu-item"
                  onClick={() => {
                    navigate("/profile");
                    setUserOpen(false);
                  }}
                >
                  <User size={14} /> Profile
                </button>
                <button
                  className="nb-menu-item"
                  onClick={() => {
                    navigate("/settings");
                    setUserOpen(false);
                  }}
                >
                  <Settings size={14} /> Settings
                </button>
                <div className="nb-menu-divider" />
                <button
                  className="nb-menu-item nb-logout"
                  onClick={() => { setUserOpen(false); setLogoutConfirm(true); }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Portaled modals (outside navbar, attached to body) ── */}
      {logoutConfirm && (
        <LogoutModal
          onCancel={() => setLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}

      {logoutLoading && <LogoutLoading />}
    </>
  );
};

export default Navbar;