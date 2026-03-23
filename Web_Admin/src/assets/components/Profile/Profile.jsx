import "../../Style/Profile/Profile.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../../../context/AppContext";
import {
  Mail, Hash, Building2, Calendar,
  Clock, ShieldCheck, LogOut, Pencil, ShieldAlert, Trash2, // ← tambah Trash2
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const [saveMsg,        setSaveMsg]        = useState("");
  const [savingAvatar,   setSavingAvatar]   = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const handleBack = () => navigate(-1);

  /* ============================
     GANTI FOTO
  ============================ */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar. Maksimal 5MB.");
      return;
    }

    setSavingAvatar(true);

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("_method", "PUT");

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Avatar error:", text);
        alert("Gagal menyimpan foto");
        return;
      }

      const result = await response.json();

      setUser(prev => ({ ...prev, avatar: result.data.avatar }));
      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...saved, avatar: result.data.avatar }));

      setSaveMsg("Foto profil berhasil diperbarui!");
      setTimeout(() => setSaveMsg(""), 3000);

    } catch (err) {
      console.error("Avatar update error:", err);
      alert("Tidak dapat terhubung ke server");
    } finally {
      setSavingAvatar(false);
    }
  };

  /* ============================
     HAPUS FOTO
  ============================ */
  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;
    if (!window.confirm("Hapus foto profil?")) return;

    setRemovingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("remove_avatar", "true");

      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        alert("Gagal menghapus foto");
        return;
      }

      setUser(prev => ({ ...prev, avatar: null }));
      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...saved, avatar: null }));

      setSaveMsg("Foto profil berhasil dihapus!");
      setTimeout(() => setSaveMsg(""), 3000);

    } catch (err) {
      console.error("Remove avatar error:", err);
      alert("Tidak dapat terhubung ke server");
    } finally {
      setRemovingAvatar(false);
    }
  };

  /* ============================
     FORMAT DATE
  ============================ */
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  const infoRows = [
    {
      icon:  <Hash size={15} />,
      label: "User ID",
      value: user?.id ? `FP-${String(user.id).padStart(5, "0")}` : "-",
    },
    {
      icon:  <Building2 size={15} />,
      label: "Department",
      value: "Operations",
    },
    {
      icon:  <Mail size={15} />,
      label: "Email",
      value: user?.email || "-",
    },
    {
      icon:  <Calendar size={15} />,
      label: "Joined Date",
      value: formatDate(user?.created_at),
    },
    {
      icon:  <Clock size={15} />,
      label: "Last Updated",
      value: formatDate(user?.updated_at),
    },
    {
      icon:       <ShieldCheck size={15} />,
      label:      "Account Status",
      value:      "Active",
      valueClass: "active",
    },
  ];

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-header-text">
          <h1>My Profile</h1>
          <p>Informasi akun Anda yang terdaftar di sistem</p>
        </div>
        <button className="signout-btn" onClick={handleBack}>
          <LogOut size={15} /> Back
        </button>
      </div>

      {/* ── Success message ── */}
      {saveMsg && (
        <div className="profile-save-msg">
          <ShieldCheck size={14} /> {saveMsg}
        </div>
      )}

      <div className="profile-grid">

        {/* ── Left Card ── */}
        <div className="profile-card">
          <div className="avatar">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" />
              : user?.name?.charAt(0) || "A"}
          </div>

          <h2>{user?.name || "Admin"}</h2>

          <span className="role">
            <ShieldAlert size={13} /> {user?.role || "Admin"}
          </span>

          <p className="email">{user?.email || "-"}</p>

          <span className="status">Active Account</span>

          <div className="divider" />

          {/* Hanya foto yang bisa diganti */}
          <label className={`edit-btn ${savingAvatar ? "disabled" : ""}`}>
            <Pencil size={14} />
            {savingAvatar ? "Menyimpan..." : "Ganti Foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={savingAvatar}
              hidden
            />
          </label>

          {/* ✅ Tombol hapus — hanya muncul jika ada avatar */}
          {user?.avatar && (
            <button
              className={`remove-avatar-btn ${removingAvatar ? "disabled" : ""}`}
              onClick={handleRemoveAvatar}
              disabled={removingAvatar}
            >
              <Trash2 size={14} />
              {removingAvatar ? "Menghapus..." : "Hapus Foto"}
            </button>
          )}
        </div>

        {/* ── Right Card — READ ONLY ── */}
        <div className="account-card">
          <h3>Account Information</h3>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "16px" }}>
            Data akun dikelola oleh developer. Hubungi admin sistem untuk perubahan.
          </p>

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