import "../../Style/Profile/Profile.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import {
  Mail, Hash, Building2, Calendar,
  Clock, ShieldCheck, LogOut, Pencil, ShieldAlert,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const handleBack = () => navigate(-1);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // batasi max 1MB
    if (file.size > 1024 * 1024) {
      alert("Image too large. Max size 1MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setUser(prev => ({
        ...prev,
        avatar: reader.result
      }));
    };

    reader.readAsDataURL(file);
  };

  const infoRows = [
    { icon: <Hash size={15} />,        label: "Employee ID",    value: "FP-00421"                },
    { icon: <Building2 size={15} />,   label: "Department",     value: "Operations"              },
    { icon: <Mail size={15} />,        label: "Email",          value: "jane.doe@flowerplus.com" },
    { icon: <Calendar size={15} />,    label: "Joined Date",    value: "March 12, 2024"          },
    { icon: <Clock size={15} />,       label: "Last Login",     value: "Today at 09:41 AM"       },
    {
      icon: <ShieldCheck size={15} />,
      label: "Account Status",
      value: "Active",
      valueClass: "active",
    },
  ];

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-header-text">
          <h1>My Profile</h1>
          <p>Manage your account details and security</p>
        </div>

        <button className="signout-btn" onClick={handleBack}>
          <LogOut size={15} /> Back
        </button>
      </div>

      <div className="profile-grid">

        {/* ── Left Card ── */}
        <div className="profile-card">
          <div className="avatar">
            {user.avatar
              ? <img src={user.avatar} alt="avatar" />
              : user.name.charAt(0)}
          </div>

          <h2>{user.name}</h2>

          <span className="role">
            <ShieldAlert size={13} /> {user.role}
          </span>

          <p className="email">jane.doe@flowerplus.com</p>

          <span className="status">Active Account</span>

          <div className="divider" />

          <label className="edit-btn">
            <Pencil size={14} />
            Edit Profile
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </label>
        </div>

        {/* ── Right Card ── */}
        <div className="account-card">
          <h3>Account Information</h3>

          {infoRows.map(({ icon, label, value, valueClass }) => (
            <div className="info-row" key={label}>
              <div className="info-left">
                <span className="info-icon">{icon}</span>
                {label}
              </div>
              <div className={`info-right${valueClass ? ` ${valueClass}` : ""}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="footer">
        FlowerPlus Admin Suite &nbsp;·&nbsp; © 2026
      </div>

    </div>
  );
};

export default Profile;