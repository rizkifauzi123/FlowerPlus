import { createContext, useContext, useState, useMemo, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([
{ id:"INV-2025-026",invoiceNumber:"INV-2025-026",invoiceCode:"FP/BCA-PTMAJU/I/2025/0026",customer:"PT Maju Sentosa",bank:"BCA",amount:"Rp 450.000",due:"2025-01-10",date:"2025-01-10",kepada:"PT Maju Sentosa",branch:"Cabang Jakarta",items:[{desc:"Buket Mawar Premium",qty:3,price:150000}],status:"unpaid" },
{ id:"INV-2025-027",invoiceNumber:"INV-2025-027",invoiceCode:"FP/BNI-CVSINAR/II/2025/0027",customer:"CV Sinar Terang",bank:"BNI",amount:"Rp 600.000",due:"2025-02-15",date:"2025-02-15",kepada:"CV Sinar Terang",branch:"Cabang Bandung",items:[{desc:"Standing Flower",qty:1,price:600000}],status:"paid" },
{ id:"INV-2025-028",invoiceNumber:"INV-2025-028",invoiceCode:"FP/BRI-PTGLOBAL/III/2025/0028",customer:"PT Global Abadi",bank:"BRI",amount:"Rp 375.000",due:"2025-03-08",date:"2025-03-08",kepada:"PT Global Abadi",branch:"Cabang Surabaya",items:[{desc:"Buket Tulip",qty:3,price:125000}],status:"unpaid" },
{ id:"INV-2025-029",invoiceNumber:"INV-2025-029",invoiceCode:"FP/MANDIRI-PTALPHA/IV/2025/0029",customer:"PT Alpha Nusantara",bank:"Mandiri",amount:"Rp 900.000",due:"2025-04-12",date:"2025-04-12",kepada:"PT Alpha Nusantara",branch:"Cabang Medan",items:[{desc:"Dekorasi Event",qty:1,price:900000}],status:"unpaid" },
{ id:"INV-2025-030",invoiceNumber:"INV-2025-030",invoiceCode:"FP/BTN-CVSEJAHTERA/V/2025/0030",customer:"CV Sejahtera Baru",bank:"BTN",amount:"Rp 520.000",due:"2025-05-20",date:"2025-05-20",kepada:"CV Sejahtera Baru",branch:"Cabang Depok",items:[{desc:"Buket Anniversary",qty:2,price:260000}],status:"paid" },
{ id:"INV-2026-031",invoiceNumber:"INV-2026-031",invoiceCode:"FP/BCA-PTMAKMUR/VI/2026/0031",customer:"PT Makmur Jaya",bank:"BCA",amount:"Rp 780.000",due:"2026-06-11",date:"2026-06-11",kepada:"PT Makmur Jaya",branch:"Cabang Bekasi",items:[{desc:"Dekorasi Kantor",qty:2,price:390000}],status:"unpaid" },
{ id:"INV-2026-032",invoiceNumber:"INV-2026-032",invoiceCode:"FP/BNI-PTBERKAH/VII/2026/0032",customer:"PT Berkah Mandiri",bank:"BNI",amount:"Rp 240.000",due:"2026-07-19",date:"2026-07-19",kepada:"PT Berkah Mandiri",branch:"Cabang Bogor",items:[{desc:"Buket Baby Breath",qty:2,price:120000}],status:"paid" },
{ id:"INV-2026-033",invoiceNumber:"INV-2026-033",invoiceCode:"FP/BRI-PTFLORA/VIII/2026/0033",customer:"PT Flora Abadi",bank:"BRI",amount:"Rp 1.200.000",due:"2026-08-22",date:"2026-08-22",kepada:"PT Flora Abadi",branch:"Cabang Yogyakarta",items:[{desc:"Wedding Decoration",qty:1,price:1200000}],status:"unpaid" },
{ id:"INV-2026-034",invoiceNumber:"INV-2026-034",invoiceCode:"FP/MANDIRI-PTBINTANG/IX/2026/0034",customer:"PT Bintang Timur",bank:"Mandiri",amount:"Rp 310.000",due:"2026-09-05",date:"2026-09-05",kepada:"PT Bintang Timur",branch:"Cabang Semarang",items:[{desc:"Buket Mix Flower",qty:2,price:155000}],status:"unpaid" },
{ id:"INV-2026-035",invoiceNumber:"INV-2026-035",invoiceCode:"FP/BCA-CVANUGRAH/X/2026/0035",customer:"CV Anugrah Jaya",bank:"BCA",amount:"Rp 650.000",due:"2026-10-11",date:"2026-10-11",kepada:"CV Anugrah Jaya",branch:"Cabang Jakarta",items:[{desc:"Standing Flower Premium",qty:1,price:650000}],status:"paid" },
{ id:"INV-2026-036",invoiceNumber:"INV-2026-036",invoiceCode:"FP/BNI-PTMAKMUR/XI/2026/0036",customer:"PT Makmur Sentosa",bank:"BNI",amount:"Rp 480.000",due:"2026-11-19",date:"2026-11-19",kepada:"PT Makmur Sentosa",branch:"Cabang Surabaya",items:[{desc:"Dekorasi Meja",qty:4,price:120000}],status:"unpaid" },
{ id:"INV-2026-037",invoiceNumber:"INV-2026-037",invoiceCode:"FP/BRI-PTNUSA/XII/2026/0037",customer:"PT Nusantara Raya",bank:"BRI",amount:"Rp 890.000",due:"2026-12-02",date:"2026-12-02",kepada:"PT Nusantara Raya",branch:"Cabang Medan",items:[{desc:"Dekorasi Corporate",qty:1,price:890000}],status:"paid" },
{ id:"INV-2027-038",invoiceNumber:"INV-2027-038",invoiceCode:"FP/BTN-CVSINAR/I/2027/0038",customer:"CV Sinar Abadi",bank:"BTN",amount:"Rp 355.000",due:"2025-01-15",date:"2025-01-15",kepada:"CV Sinar Abadi",branch:"Cabang Bogor",items:[{desc:"Buket Anggrek",qty:1,price:355000}],status:"unpaid" },
{ id:"INV-2027-039",invoiceNumber:"INV-2027-039",invoiceCode:"FP/MANDIRI-PTCAHAYA/II/2027/0039",customer:"PT Cahaya Abadi",bank:"Mandiri",amount:"Rp 720.000",due:"2025-02-20",date:"2025-02-20",kepada:"PT Cahaya Abadi",branch:"Cabang Bandung",items:[{desc:"Standing Flower VIP",qty:1,price:720000}],status:"paid" },
{ id:"INV-2027-040",invoiceNumber:"INV-2027-040",invoiceCode:"FP/BCA-PTMEGA/III/2027/0040",customer:"PT Mega Jaya",bank:"BCA",amount:"Rp 500.000",due:"2026-03-18",date:"2026-03-18",kepada:"PT Mega Jaya",branch:"Cabang Depok",items:[{desc:"Dekorasi Mini Event",qty:2,price:250000}],status:"unpaid" },
{ id:"INV-2027-041",invoiceNumber:"INV-2027-041",invoiceCode:"FP/BNI-PTLINTAS/IV/2027/0041",customer:"PT Lintas Global",bank:"BNI",amount:"Rp 940.000",due:"2025-04-09",date:"2025-04-09",kepada:"PT Lintas Global",branch:"Cabang Jakarta",items:[{desc:"Grand Opening Decor",qty:1,price:940000}],status:"unpaid" },
{ id:"INV-2027-042",invoiceNumber:"INV-2027-042",invoiceCode:"FP/BRI-CVMAKMUR/V/2027/0042",customer:"CV Makmur Sentosa",bank:"BRI",amount:"Rp 260.000",due:"2025-05-14",date:"2025-05-14",kepada:"CV Makmur Sentosa",branch:"Cabang Surabaya",items:[{desc:"Buket Mix Pastel",qty:2,price:130000}],status:"paid" },
{ id:"INV-2027-043",invoiceNumber:"INV-2027-043",invoiceCode:"FP/MANDIRI-PTKARYA/VI/2027/0043",customer:"PT Karya Abadi",bank:"Mandiri",amount:"Rp 1.050.000",due:"2027-06-21",date:"2027-06-21",kepada:"PT Karya Abadi",branch:"Cabang Medan",items:[{desc:"Wedding Full Decor",qty:1,price:1050000}],status:"unpaid" },
{ id:"INV-2027-044",invoiceNumber:"INV-2027-044",invoiceCode:"FP/BCA-PTPRIMA/VII/2027/0044",customer:"PT Prima Jaya",bank:"BCA",amount:"Rp 415.000",due:"2025-07-08",date:"2025-07-08",kepada:"PT Prima Jaya",branch:"Cabang Bandung",items:[{desc:"Buket Anniversary",qty:1,price:415000}],status:"paid" },
{ id:"INV-2027-045",invoiceNumber:"INV-2027-045",invoiceCode:"FP/BNI-PTMAJU/VIII/2027/0045",customer:"PT Maju Abadi",bank:"BNI",amount:"Rp 330.000",due:"2024-08-13",date:"2024-08-13",kepada:"PT Maju Abadi",branch:"Cabang Bekasi",items:[{desc:"Buket Mawar Red",qty:2,price:165000}],status:"unpaid" },
{ id:"INV-2027-046",invoiceNumber:"INV-2027-046",invoiceCode:"FP/BRI-PTNUSA/IX/2027/0046",customer:"PT Nusantara Sejahtera",bank:"BRI",amount:"Rp 890.000",due:"2024-09-22",date:"2024-09-22",kepada:"PT Nusantara Sejahtera",branch:"Cabang Yogyakarta",items:[{desc:"Event Decoration",qty:1,price:890000}],status:"paid" },
{ id:"INV-2027-047",invoiceNumber:"INV-2027-047",invoiceCode:"FP/MANDIRI-CVBERKAH/X/2027/0047",customer:"CV Berkah Mandiri",bank:"Mandiri",amount:"Rp 470.000",due:"2024-10-10",date:"2024-10-10",kepada:"CV Berkah Mandiri",branch:"Cabang Depok",items:[{desc:"Buket Tulip Mix",qty:2,price:235000}],status:"unpaid" },
{ id:"INV-2027-048",invoiceNumber:"INV-2027-048",invoiceCode:"FP/BCA-PTSEJAHTERA/XI/2027/0048",customer:"PT Sejahtera Abadi",bank:"BCA",amount:"Rp 610.000",due:"2026-11-19",date:"2026-11-19",kepada:"PT Sejahtera Abadi",branch:"Cabang Jakarta",items:[{desc:"Standing Flower Classic",qty:1,price:610000}],status:"paid" },
{ id:"INV-2027-049",invoiceNumber:"INV-2027-049",invoiceCode:"FP/BNI-PTCAHAYA/XII/2027/0049",customer:"PT Cahaya Mandiri",bank:"BNI",amount:"Rp 555.000",due:"2026-12-05",date:"2026-12-05",kepada:"PT Cahaya Mandiri",branch:"Cabang Surabaya",items:[{desc:"Buket Lily White",qty:3,price:185000}],status:"unpaid" }
  ]);

  const admins = [
  {
    id: 1,
    name: "Nadira",
    role: "Admin",
    avatar: null
  },
  {
    id: 2,
    name: "Arvan",
    role: "Admin",
    avatar: null
  },
  {
    id: 3,
    name: "Reza",
    role: "Admin",
    avatar: null
  }
];

  const [searchQuery, setSearchQuery] = useState("");
  const [focusedInvoiceId, setFocusedInvoiceId] = useState(null); // ← BARU
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(
    savedUser || {
      name: "Nadira",
      role: "Admin",
      avatar: null
    }
  );

useEffect(() => {
  const { avatar, ...userWithoutAvatar } = user;
  localStorage.setItem("user", JSON.stringify(userWithoutAvatar));
}, [user]);

  /* =========================
     OVERDUE LOGIC
  ========================== */
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
        invoices,
        setInvoices,
        searchQuery,
        setSearchQuery,
        overdueCount,
        overdueInvoices,
        user,
        setUser,
        focusedInvoiceId,       // ← BARU
        setFocusedInvoiceId,    // ← BARU
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);