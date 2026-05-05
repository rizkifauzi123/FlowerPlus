import "../../Style/Autentikasi/Login.css";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import logo       from "../../images/Login.png";
import flowerIcon from "../../images/LogoFP.png";

/* ─────────────────────────────────────
   Login Loading Screen (portaled)
───────────────────────────────────── */
const LoginLoading = () =>
  createPortal(
    <div className="ll-overlay">
      <div className="ll-inner">
        <div className="ll-spinner">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="ll-petal" style={{ "--i": i }} />
          ))}
          <div className="ll-logo-wrap">
            <img src={flowerIcon} alt="FlowerPlus" className="ll-logo" />
          </div>
        </div>
        <div className="ll-bar-track">
          <div className="ll-bar-fill" />
        </div>
        <p className="ll-caption">Signing you in…</p>
      </div>
    </div>,
    document.body
  );

  /* ─────────────────────────────────────
   Forgot Password Modal
───────────────────────────────────── */
function ForgotPassword({ onClose }) {
  const [email, setEmail]       = useState("");
  const [focused, setFocused]   = useState(false);
  const [status, setStatus]     = useState("idle"); // idle | loading | success | error
  const [message, setMessage]   = useState("");
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const handleSubmit = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Email wajib diisi.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`https://api.flowerplusofficial.com/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(result.message || "Gagal mengirim email reset.");
        return;
      }

      setStatus("success");
      setMessage(result.message || "Link reset password telah dikirim ke email Anda.");
    } catch (err) {
      console.error("Forgot password error:", err);
      setStatus("error");
      setMessage("Tidak dapat terhubung ke server.");
    }
  };

  return createPortal(
    <div className={`fp-backdrop ${visible ? "fp-visible" : ""}`} onClick={handleClose}>
      <div
        className={`fp-modal ${visible ? "fp-modal-in" : ""}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="fp-header">
          <button className="fp-close" onClick={handleClose}>✕</button>
        </div>

        <h2 className="fp-title">Reset Password</h2>
        <p className="fp-desc">
          Masukkan email akun Anda. Kami akan mengirimkan link untuk mereset password.
        </p>

        {status !== "success" ? (
          <>
            <label className="fp-label">Email Address</label>
            <div className={`fp-input-group ${focused ? "fp-focused" : ""}`}>
              <Mail size={16} className="fp-ig-icon" />
              <input
                type="email"
                placeholder="admin@flowerplus.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {status === "error" && (
              <div className="fp-error">{message}</div>
            )}

            <button
              className="fp-btn"
              onClick={handleSubmit}
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <span className="fp-btn-spinner" />
              ) : (
                <>
                  <span>Kirim Link Reset</span>
                  <ArrowRight size={15} className="fp-btn-arrow" />
                </>
              )}
              <div className="btn-sheen" />
            </button>
          </>
        ) : (
          <div className="fp-success">
            <div className="fp-success-icon">✓</div>
            <p>{message}</p>
            <button className="fp-back-btn" onClick={handleClose}>
              Kembali ke Login
            </button>
          </div>
        )}

        <button className="fp-cancel" onClick={handleClose}>
          Batal, kembali ke login
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────
   Main Login Component
───────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [focused,  setFocused]  = useState({ email: false, pass: false });
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  //state untuk lupa password
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  /* ============================
     HANDLE LOGIN
  ============================ */
  const handleLogin = async () => {
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Email dan password wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept":        "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMsg(result.message || "Login gagal");
        setLoading(false);
        return;
      }

      // ✅ Simpan user ke localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(result.data));

      setTimeout(() => {
        navigate("/dashboard");
      }, 2400);

    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Tidak dapat terhubung ke server");
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`login-container ${mounted ? "is-mounted" : ""}`}>

        {/* ════════════════════════
            LEFT SIDE
        ════════════════════════ */}
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
            <div className="divider" />
            <div className="features">
              <span>Premium Florist</span>
              <span>Trusted Platform</span>
              <span>Admin Suite</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════
            RIGHT SIDE
        ════════════════════════ */}
        <div className="login-right">
          <div className="login-card">

            <span className="portal">ADMIN PORTAL</span>
            <h1>Welcome back</h1>
            <p className="subtitle">Sign in to your FlowerPlus dashboard</p>

            <div className="divider small">
              <span />
              <img src={flowerIcon} alt="" />
              <span />
            </div>

            {/* EMAIL */}
            <label>Email Address</label>
            <div className={`input-group ${focused.email ? "ig-focused" : ""}`}>
              <Mail size={17} className="ig-icon" />
              <input
                type="email"
                placeholder="admin@flowerplus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(s => ({ ...s, email: true }))}
                onBlur={() => setFocused(s => ({ ...s, email: false }))}
              />
            </div>

            {/* PASSWORD */}
            <div className="password-row">
              <label>Password</label>
              <button type="button" className="forgot-link" onClick={() => setShowForgot(true)}>
                Forgot password?
              </button>
            </div>
            <div className={`input-group ${focused.pass ? "ig-focused" : ""}`}>
              <Lock size={17} className="ig-icon" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* ERROR MESSAGE */}
            {errorMsg && (
              <div className="login-error">
                {errorMsg}
              </div>
            )}

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              <span>Sign In</span>
              <ArrowRight size={16} className="btn-arrow" />
              <div className="btn-sheen" />
            </button>

            <div className="footer">
              FlowerPlus Admin · Secure Login · 2026
            </div>

          </div>
        </div>

      </div>

      {loading && <LoginLoading />}
      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
    </>
  );
}