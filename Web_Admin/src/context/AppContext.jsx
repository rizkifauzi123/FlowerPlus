import { createContext, useContext, useState, useMemo, useEffect } from "react";

const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || '';

export const AppProvider = ({ children }) => {

  const [invoices, setInvoices] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [ptFilter, setPtFilter] = useState({
    status: "Semua Status",
    month:  "Semua Bulan",
    year:   "Semua Tahun",
    page:   1,
  });

  const [raFilter, setRaFilter] = useState({
    period:      "Semua Waktu",
    customStart: "",
    customEnd:   "",
    paperSize: "all",
  });

  const [dashFilter, setDashFilter] = useState({
    year: new Date().getFullYear(),
    paperSize: "all",
  });

  const savedUser = JSON.parse(localStorage.getItem("user"));

  const [user, setUser] = useState(
    savedUser || {
      id:    null,
      name:  "Admin",
      role:  "Admin",
      email: "",
      avatar: null,
    }
  );

  const [searchQuery, setSearchQuery]           = useState("");
  const [focusedInvoiceId, setFocusedInvoiceId] = useState(null);

  /* ============================
     FETCH INVOICES FROM API
  ============================ */
const refreshInvoices = async () => {
  try {
    const res = await fetch(`${API_URL}/api/invoices`);
    if (!res.ok) throw new Error("Fetch failed");

    const data = await res.json();

    // 🔥 pastikan selalu array
    let list = [];

    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data.data)) {
      list = data.data;
    } else {
      console.warn("Unexpected invoice format:", data);
      list = [];
    }

    // 🔥 sorting terbaru di atas
    const sorted = list.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB - dateA;
    });

    // ✅ TARO DI SINI
    console.log("Invoices updated:", sorted);

    setInvoices(sorted);

    return sorted;
  } catch (err) {
    console.error("Error fetching invoices:", err);
    throw err;
  }
};

  useEffect(() => {
    refreshInvoices();
  }, []);

  /* ============================
     FETCH ADMINS FROM API
  ============================ */
  useEffect(() => {
    fetch(`${API_URL}/api/users`)
      .then(res => res.json())
      .then(data => setAdmins(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  /* ============================
     FETCH USER FROM DB (jika ada id)
  ============================ */
  useEffect(() => {
    if (!user.id) return;

    fetch(`${API_URL}/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setUser(prev => ({
          ...prev,
          name:       data.name,
          email:      data.email,
          role:       data.role,
          avatar:     data.avatar,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }));
      })
      .catch(err => console.error("Error fetching user:", err));
  }, [user.id]);

  /* ============================
     SAVE USER TO LOCAL STORAGE
  ============================ */
  useEffect(() => {
    const { avatar, ...userWithoutAvatar } = user;
    localStorage.setItem("user", JSON.stringify(userWithoutAvatar));
  }, [user]);

  /* ============================
     OVERDUE LOGIC
  ============================ */
  const overdueInvoices = useMemo(() => {
    const today = new Date();
    return invoices.filter((inv) => {
      if (inv.status !== "unpaid" || !inv.date) return false;
      const due = new Date(inv.date);
      due.setDate(due.getDate() + 7);
      return today > due;
    });
  }, [invoices]);

  const overdueCount = overdueInvoices.length;

  return (
    <AppContext.Provider
      value={{
        admins,
        setAdmins,
        invoices,
        setInvoices,
        refreshInvoices,
        searchQuery,
        setSearchQuery,
        overdueCount,
        overdueInvoices,
        user,
        setUser,
        focusedInvoiceId,
        setFocusedInvoiceId,
        ptFilter,    setPtFilter,
        raFilter,    setRaFilter,
        dashFilter,  setDashFilter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
