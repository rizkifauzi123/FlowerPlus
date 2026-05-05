import "../../Style/Autentikasi/Login.css";
import "../../Style/Autentikasi/ResetPassword.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import flowerIcon from "../../images/LogoFP.png";
import logo from "../../images/Login.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword]               = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [focused, setFocused]                 = useState({ pass: false, confirm: false });
  const [status, setStatus]                   = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg]               = useState("");
  const [mounted, setMounted]                 = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Redirect ke login kalau tidak ada token
  useEffect(() => {
    if (!token || !email) {
      navigate("/login");
    }
  }, [token, email, navigate]);

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!password || !passwordConfirm) {
      setErrorMsg("Semua field wajib diisi.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirm,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.message || "Gagal mereset password.");
        setStatus("idle");
        return;
      }

      setStatus("success");

      // Redirect ke login setelah 3 detik
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      console.error("Reset password error:", err);
      setErrorMsg("Tidak dapat terhubung ke server.");
      setStatus("idle");
    }
  };

  return (
    <div className={`login-container ${mounted ? "is-mounted" : ""}`}>

      {/* LEFT SIDE — sama dengan Login */}
      <div className="login-left">
        <img src={flowerIcon} className="bg-flower top"       alt="" />
        <img src={flowerIcon} className="bg-flower bottom"    alt="" />
        <img src={flowerIcon} className="bg-flower mid-left"  alt="" />
        <img src={flowerIcon} className="bg-flower mid-right" alt="" />
        <div className="left-shimmer" />
        <div className="brand">
          <div className="brand-logo-wrap">
            <img src={logo} className="brand-logo" alt="FlowerPlus" />
          </div>
          <div className="features">
            <span>Premium Florist</span>
            <span>Trusted Platform</span>
            <span>Admin Suite</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">

          {status !== "success" ? (
            <>
              <span className="portal">RESET PASSWORD</span>
              <h1>Buat Password Baru</h1>
              <p className="subtitle">Masukkan password baru untuk akun <strong>{email}</strong></p>

              <div className="divider small">
                <span />
                <img src={flowerIcon} alt="" />
                <span />
              </div>

              {/* PASSWORD BARU */}
              <label>Password Baru</label>
              <div className={`input-group ${focused.pass ? "ig-focused" : ""}`}>
                <Lock size={17} className="ig-icon" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused(s => ({ ...s, pass: true }))}
                  onBlur={() => setFocused(s => ({ ...s, pass: false }))}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* KONFIRMASI PASSWORD */}
              <label>Konfirmasi Password</label>
              <div className={`input-group ${focused.confirm ? "ig-focused" : ""}`}>
                <Lock size={17} className="ig-icon" />
                <input
                  type={showPassConfirm ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  onFocus={() => setFocused(s => ({ ...s, confirm: true }))}
                  onBlur={() => setFocused(s => ({ ...s, confirm: false }))}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassConfirm(p => !p)}
                  tabIndex={-1}
                >
                  {showPassConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* PASSWORD STRENGTH INDICATOR */}
              {password && (
                <div className="rp-strength">
                  <div className={`rp-strength-bar ${
                    password.length >= 12 ? "strong" :
                    password.length >= 8  ? "medium" : "weak"
                  }`} />
                  <span className={`rp-strength-label ${
                    password.length >= 12 ? "strong" :
                    password.length >= 8  ? "medium" : "weak"
                  }`}>
                    {password.length >= 12 ? "Kuat" :
                     password.length >= 8  ? "Cukup" : "Terlalu pendek"}
                  </span>
                </div>
              )}

              {/* ERROR */}
              {errorMsg && (
                <div className="login-error">{errorMsg}</div>
              )}

              <button
                className="login-btn"
                onClick={handleSubmit}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <span className="rp-spinner" />
                ) : (
                  <>
                    <span>Simpan Password Baru</span>
                    <ArrowRight size={16} className="btn-arrow" />
                  </>
                )}
                <div className="btn-sheen" />
              </button>

              <button
                className="rp-back"
                onClick={() => navigate("/login")}
              >
                Kembali ke Login
              </button>
            </>
          ) : (
            /* SUCCESS STATE */
            <div className="rp-success">
              <div className="rp-success-icon">
                <CheckCircle size={48} strokeWidth={1.5} />
              </div>
              <h1>Password Berhasil Diubah!</h1>
              <p>Password Anda telah berhasil diperbarui. Anda akan diarahkan ke halaman login dalam 3 detik...</p>
              <button
                className="login-btn"
                onClick={() => navigate("/login")}
                style={{ marginTop: 24 }}
              >
                <span>Login Sekarang</span>
                <ArrowRight size={16} className="btn-arrow" />
                <div className="btn-sheen" />
              </button>
            </div>
          )}

          <div className="footer">
            FlowerPlus Admin · Secure Login · 2026
          </div>

        </div>
      </div>

    </div>
  );
}