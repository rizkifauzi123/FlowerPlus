import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const IdleLogout = ({ timeout = 3600000 }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.removeItem("isLoggedIn"); // ✅ ganti localStorage
        navigate("/login", { replace: true });   // ✅ tambah replace
        // hapus alert() — tidak profesional
      }, timeout);
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [navigate, timeout]);

  return null;
};

export default IdleLogout;