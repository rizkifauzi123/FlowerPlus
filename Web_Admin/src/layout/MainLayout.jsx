import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../src/assets/components/Sidebar";
import Navbar from "../../src/assets/components/Navbar";
import IdleLogout from "../assets/utils/IdleLogout";
import "../../src/assets/Style/Layout.css";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleDesktop = () => {
    setCollapsed((prev) => !prev);
  };

  const handleToggleMobile = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <div className="app-layout">
       <IdleLogout timeout={3600000} /> 
      {/* 1jam */}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-wrapper ${collapsed ? "collapsed" : ""}`}>

        <Navbar
          onToggleDesktop={handleToggleDesktop}
          onToggleMobile={handleToggleMobile}
        />

        <div className="main-content">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default MainLayout;