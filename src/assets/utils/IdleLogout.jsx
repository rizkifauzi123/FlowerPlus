import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const IdleLogout = ({ timeout = 600000 }) => {
  // 600000 ms = 10 menit
  const navigate = useNavigate();

  useEffect(() => {

    let timer;

    const resetTimer = () => {

      clearTimeout(timer);

      timer = setTimeout(() => {
        localStorage.removeItem("isLoggedIn");
        alert("Session expired. Please login again.");
        navigate("/login");
      }, timeout);

    };

    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart"
    ];

    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };

  }, [navigate, timeout]);

  return null;
};

export default IdleLogout;