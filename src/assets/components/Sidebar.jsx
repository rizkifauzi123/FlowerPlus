import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  Bell,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import "../Style/Sidebar.css";
import logo from "../images/LogoFP.png";

/* ─────────────────────────────────────────
   Portal wrapper — renders into document.body
   escaping sidebar's stacking context
───────────────────────────────────────── */
const Portal = ({ children }) => createPortal(children, document.body);

/* ─────────────────────────────────────────
   Logout Confirm Modal
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
   Sidebar
───────────────────────────────────────── */
const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate  = useNavigate();

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  /* auto-close sidebar on route change (mobile only) */
  useEffect(() => {
    if (window.innerWidth <= 767 && mobileOpen) {
      onCloseMobile();
    }
  }, [location.pathname]);

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

  return (
    <>
      {/* OVERLAY (mobile only) */}
      {mobileOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={onCloseMobile}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar 
          ${collapsed ? "collapsed" : ""} 
          ${mobileOpen ? "mobile-open" : ""}
        `}
      >
        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <img src={logo} alt="Flower Plus Logo" className="brand-logo-img" />
          </div>

          {!collapsed && (
            <div className="brand-text">
              <h2>Flower Plus</h2>
              <span>Financial Management</span>
            </div>
          )}
        </div>

        {/* MENU */}
        <ul className="sidebar-menu">

          <li>
            <NavLink to="/dashboard" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <LayoutDashboard size={18} />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </li>

          <li>
            <NavLink to="/invoice" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <FileText size={18} />
              {!collapsed && <span>Invoice Management</span>}
            </NavLink>
          </li>

          <li>
            <NavLink to="/payment" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <CreditCard size={18} />
              {!collapsed && <span>Payment Tracker</span>}
            </NavLink>
          </li>

          {/* <li>
            <NavLink to="/customer" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <Users size={18} />
              {!collapsed && <span>Customer</span>}
            </NavLink>
          </li> */}

          {/* <li>
            <NavLink to="/loyalty" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <Bell size={18} />
              {!collapsed && <span>Loyalty Reminder</span>}
            </NavLink>
          </li> */}

          <li>
            <NavLink to="/reports" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <BarChart3 size={18} />
              {!collapsed && <span>Reports</span>}
            </NavLink>
          </li>

          <li>
            <NavLink to="/settings" className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }>
              <Settings size={18} />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </li>

        </ul>

        {/* FOOTER */}
        <div className="sidebar-footer">

          <div className="version-box">
            {!collapsed && (
              <>
                <p>Version 1.0.0</p>
                <span>© 2024 Flower Plus</span>
              </>
            )}
          </div>

          <button
            className="logout-sidebar-btn"
            onClick={() => setLogoutConfirm(true)}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>

        </div>
      </aside>

      {/* ── Portaled modals (attached to document.body) ── */}
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

export default Sidebar;