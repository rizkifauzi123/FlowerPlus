import { createContext, useContext, useState, useMemo, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [invoices, setInvoices] = useState([]);
  const [admins, setAdmins] = useState([]);

  /* ============================
     FILTER STATE — tidak reset saat pindah halaman
  ============================ */
  const [ptFilter, setPtFilter] = useState({
    status: "All Status",
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

  /* ============================
     USER STATE
  ============================ */
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
  const refreshInvoices = () => {
    fetch("http://127.0.0.1:8000/api/invoices")
      .then(res => res.json())
      .then(data => {
        // Sort by updated_at descending — invoice terbaru/teredit di atas
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at || 0);
          const dateB = new Date(b.updated_at || b.created_at || 0);
          return dateB - dateA;
        });
        setInvoices(sorted);
      })
      .catch(err => console.error("Error fetching invoices:", err));
  };

  useEffect(() => {
    refreshInvoices();
  }, []);

  /* ============================
     FETCH ADMINS FROM API
  ============================ */
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users")
      .then(res => res.json())
      .then(data => setAdmins(data))
      .catch(err => console.error("Error fetching users:", err));
  }, []);

  /* ============================
     FETCH USER FROM DB (jika ada id)
  ============================ */
  useEffect(() => {
    if (!user.id) return;

    fetch(`http://127.0.0.1:8000/api/users/${user.id}`)
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
        // ✅ filter state
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