import "../../Style/profile/setting.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ChevronLeft } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const [fullName, setFullName]               = useState("Jane Doe");
  const [phone, setPhone]                     = useState("+62 812 3456 7890");
  const [email]                               = useState("jane.doe@flowerplus.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactor, setTwoFactor]             = useState(false);

  const handleUpdateProfile = () => {
    alert("Profile updated successfully");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password does not match");
      return;
    }
    alert("Password changed successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="settings-page">

      {/* ── Header ── */}
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, security and preferences</p>
        </div>

        <button className="back-btn" onClick={handleBack}>
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      {/* ── Account Settings ── */}
      <div className="settings-card">
        <div className="card-title">
          <div className="card-title-icon">
            <User size={17} />
          </div>
          <div>
            <h3>Account Settings</h3>
            <span>Manage your personal information</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input value={email} disabled />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input value="Administrator - Read-only" disabled />
          </div>
        </div>

        <button className="primary-btn" onClick={handleUpdateProfile}>
          Update Profile
        </button>
      </div>

      {/* ── Security Settings ── */}
      <div className="settings-card">
        <div className="card-title">
          <div className="card-title-icon">
            <Lock size={17} />
          </div>
          <div>
            <h3>Security Settings</h3>
            <span>Keep your account safe</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group full">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Two-Factor */}
        <div className="twofactor">
          <div className="twofactor-text">
            <h4>Two-Factor Authentication</h4>
            <span>Adds an extra layer of security to your account</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={() => setTwoFactor(!twoFactor)}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="last-login">
          Last login: Today at 09:41 AM — Jakarta, Indonesia
        </div>

        <button className="primary-btn" onClick={handleChangePassword}>
          Change Password
        </button>
      </div>

      <div className="footer">
        FlowerPlus Admin Suite &nbsp;·&nbsp; © 2026
      </div>

    </div>
  );
};

export default Settings;