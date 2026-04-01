import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../Style/Navbar.css";
import {
  Bell, ChevronDown, Menu,
  LogOut, AlertCircle, ArrowRight, Pencil, ShieldCheck
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const Portal = ({ children }) =>
  createPortal(children, document.body);

const LogoutModal = ({ onCancel, onConfirm }) => (
  <Portal>
    <div
      className="logout-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="logout-modal">
        <div className="logout-modal-visual">
          <span className="lo-ring-inner r2" />
          <span className="lo-ring-inner r3" />
          <div className="logout-modal-icon">
            <LogOut size={26} />
          </div>
        </div>
        <div className="logout-modal-body">
          <h3>Confirm Logout</h3>
          <p>
            Are you sure you want to logout from{" "}
            <strong>FlowerPlus</strong>?{" "}
            You'll need to sign in again to continue.
          </p>
          <div className="logout-actions">
            <button className="logout-cancel" onClick={onCancel}>Cancel</button>
            <button className="logout-confirm" onClick={onConfirm}>Yes, Logout</button>
          </div>
        </div>
      </div>
    </div>
  </Portal>
);

const LogoutLoading = () => (
  <Portal>
    <div className="logout-loading">
      <div className="logout-spinner" />
      <p>Logging out…</p>
    </div>
  </Portal>
);

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
    invoices,         // ← ambil semua invoices dari context
    user,
    admins,
    setFocusedInvoiceId
  } = useApp();

  // Invoice yang belum dibayar (belum diceklis) dan TIDAK kadaluarsa
  const overdueIds     = new Set(overdueInvoices.map(inv => inv.id));
  const unpaidInvoices = (invoices || []).filter(
    inv => !inv.isPaid && !overdueIds.has(inv.id)
  );

  // Gabungkan: overdue duluan, lalu unpaid
  const allNotifInvoices = [
    ...overdueInvoices.map(inv => ({ ...inv, _status: "overdue" })),
    ...unpaidInvoices.map(inv => ({ ...inv, _status: "unpaid" })),
  ];

  const totalNotifCount = allNotifInvoices.length;

  const otherAdmins = admins.filter(a => a.name !== user?.name);
  const extraCount  = otherAdmins.length - 2;

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            {extraCount > 0 && (
              <div className="nb-admin-more">+{extraCount}</div>
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
              {totalNotifCount > 0 && (
                <span className="nb-badge">{totalNotifCount > 9 ? "9+" : totalNotifCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="nb-notif-panel">
                <div className="nb-panel-header">
                  <div className="nb-panel-title">
                    <AlertCircle size={14} />
                    <span>Invoice Perlu Perhatian</span>
                  </div>
                  {totalNotifCount > 0 && (
                    <span className="nb-count-pill">{totalNotifCount}</span>
                  )}
                </div>

                <div className="nb-notif-body">
                  {allNotifInvoices.length === 0 ? (
                    <div className="nb-notif-empty">
                      <span className="nb-empty-icon">🎉</span>
                      <span>Semua invoice lunas!</span>
                    </div>
                  ) : (
                    allNotifInvoices.map((inv) => (
                      <div key={inv.id} className="nb-notif-item">
                        <div className={`nb-notif-dot ${inv._status === "overdue" ? "nb-notif-dot--overdue" : "nb-notif-dot--unpaid"}`} />
                        <div className="nb-notif-info">
                          <span className="nb-notif-name">{inv.customer}</span>
                          <span className="nb-notif-meta">
                            <span className="nb-notif-num">{inv.invoiceNumber}</span>
                            {inv._status === "overdue" ? (
                              <span className="nb-notif-late nb-notif-late--overdue">
                                · Terlambat {getDaysLate(inv)} hari
                              </span>
                            ) : (
                              <span className="nb-notif-late nb-notif-late--unpaid">
                                · Belum dibayar
                              </span>
                            )}
                          </span>
                        </div>
                        <button className="nb-notif-cta" onClick={() => handleViewInvoice(inv)}>
                          Lihat
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {allNotifInvoices.length > 0 && (
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
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" />
                  : user?.name?.charAt(0) || "A"}
              </div>
              <div className="nb-user-text">
                <span className="nb-name">{user?.name  || "Admin"}</span>
                <span className="nb-role">{user?.role  || "Admin"}</span>
              </div>
              <ChevronDown size={13} className={`nb-chevron ${userOpen ? "rotated" : ""}`} />
            </button>

            {userOpen && (
              <div className="nb-profile-card">
                <div className="nb-profile-card-arrow" />
                <div className="nb-pc-header">
                  <div className="nb-pc-avatar-wrap">
                    <div className="nb-pc-avatar">
                      {user?.avatar
                        ? <img src={user.avatar} alt="avatar" />
                        : user?.name?.charAt(0) || "A"}
                    </div>
                    <span className="nb-pc-online-dot" />
                  </div>
                  <div className="nb-pc-info">
                    <span className="nb-pc-name">{user?.name  || "Admin"}</span>
                    <span className="nb-pc-role">
                      <ShieldCheck size={12} />
                      {user?.role || "Admin"}
                    </span>
                    <span className="nb-pc-email">{user?.email || "admin@flowerplus.com"}</span>
                  </div>
                </div>
                <div className="nb-pc-status-row">
                  <span className="nb-pc-status-badge">
                    <span className="nb-pc-status-dot" />
                    Active Account
                  </span>
                </div>
                <div className="nb-pc-divider" />
                <button
                  className="nb-pc-edit-btn"
                  onClick={() => { navigate("/profile"); setUserOpen(false); }}
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
                <div className="nb-pc-divider" />
                <button
                  className="nb-pc-logout-btn"
                  onClick={() => { setUserOpen(false); setLogoutConfirm(true); }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

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