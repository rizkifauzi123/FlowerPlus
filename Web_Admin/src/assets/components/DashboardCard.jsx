import { useState, useMemo, useRef, useEffect } from "react";
import {
  FileText,
  Wallet,
  CheckCircle,
  Users,
  Printer,
  Send,
  TrendingUp,
  ChevronDown,
  Calendar,
  Check,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import "../Style/DashboardCard.css";
import { useApp } from "../../context/AppContext";

// ─── Konstanta bulan & tahun ──────────────────────────────────────────────────

const BULAN = [
  { value: "01", label: "Januari"   },
  { value: "02", label: "Februari"  },
  { value: "03", label: "Maret"     },
  { value: "04", label: "April"     },
  { value: "05", label: "Mei"       },
  { value: "06", label: "Juni"      },
  { value: "07", label: "Juli"      },
  { value: "08", label: "Agustus"   },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober"   },
  { value: "11", label: "November"  },
  { value: "12", label: "Desember"  },
];

// ─── Dropdown kustom ──────────────────────────────────────────────────────────

const FilterDropdown = ({ value, options, onChange, placeholder, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="dash-filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`dash-filter-trigger ${open ? "open" : ""} ${value ? "active" : ""}`}
        onClick={() => setOpen(p => !p)}
      >
        {Icon && <Icon size={13} className="dash-filter-icon" />}
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={12} className={`dash-filter-chevron ${open ? "rotated" : ""}`} />
      </button>
      {open && (
        <div className="dash-filter-menu">
          <button
            type="button"
            className={`dash-filter-option ${!value ? "selected" : ""}`}
            onClick={() => { onChange(""); setOpen(false); }}
          >
            <span>{placeholder}</span>
            {!value && <Check size={12} className="dash-filter-check" />}
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`dash-filter-option ${value === opt.value ? "selected" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={12} className="dash-filter-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardCards = () => {
  const { invoices, user, dashFilter, setDashFilter } = useApp();
  const currentYear = new Date().getFullYear();
  const [activeIndex, setActiveIndex] = useState(null);

  const selectedYear    = dashFilter.year;
  const selectedPaper   = dashFilter.paperSize ?? "all";
  const setSelectedYear  = (v) => setDashFilter(prev => ({ ...prev, year: v }));
  const setSelectedPaper = (v) => setDashFilter(prev => ({ ...prev, paperSize: v }));

  // ─── State filter bulan & tahun card ─────────────────────────────────────
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState(String(currentYear));

  const tahunOptions = Array.from({ length: 6 }, (_, i) => ({
    value: String(currentYear + i),
    label: String(currentYear + i),
  }));

  const greetings = [
    "Semoga harimu menyenangkan dan penuh produktivitas ✨",
    "Tetap semangat mengelola invoice hari ini 💼",
    "Semoga semua transaksi berjalan lancar hari ini 🌸",
    "Mari kita buat hari ini penuh pencapaian 🚀",
    "Terima kasih sudah menjaga operasional FlowerPlus 🌷",
    "Semoga dashboard hari ini membawa kabar baik 📊"
  ];

  const randomGreeting = useMemo(
    () => greetings[Math.floor(Math.random() * greetings.length)],
    []
  );

  const hour = new Date().getHours();
  let timeGreeting = "Selamat datang";
  if (hour < 11)      timeGreeting = "Selamat pagi";
  else if (hour < 15) timeGreeting = "Selamat siang";
  else if (hour < 18) timeGreeting = "Selamat sore";
  else                timeGreeting = "Selamat malam";

  const onPieEnter = (_, index) => setActiveIndex(index);
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const parseAmount = (amount) => Number(amount || 0);

  const getComputedStatus = (inv) => {
    const today   = new Date();
    const dueDate = new Date(inv.date);
    dueDate.setDate(dueDate.getDate() + 7);
    if (inv.status === "paid") return "paid";
    if (today > dueDate)       return "overdue";
    return "unpaid";
  };

  /* ── Filter by paper size (tidak berubah) ── */
  const filteredInvoices = useMemo(() => {
    if (selectedPaper === "all") return invoices;
    return invoices.filter(inv => (inv.paper_size ?? "a4") === selectedPaper);
  }, [invoices, selectedPaper]);

  const a5Count = invoices.filter(inv => (inv.paper_size ?? "a4") === "a5").length;
  const a4Count = invoices.filter(inv => (inv.paper_size ?? "a4") === "a4").length;

  /* ── Filter tambahan: bulan & tahun untuk CARD stats ── */
  const filteredByPeriod = useMemo(() => {
    return filteredInvoices.filter(inv => {
      if (!inv.date) return false;
      const d = new Date(inv.date);
      const matchTahun = filterTahun ? String(d.getFullYear()) === filterTahun : true;
      const matchBulan = filterBulan ? String(d.getMonth() + 1).padStart(2, "0") === filterBulan : true;
      return matchTahun && matchBulan;
    });
  }, [filteredInvoices, filterBulan, filterTahun]);

  /* ── Label periode aktif ── */
  const periodeLabel = useMemo(() => {
    const bulanLabel = filterBulan ? BULAN.find(b => b.value === filterBulan)?.label : null;
    if (bulanLabel && filterTahun) return `${bulanLabel} ${filterTahun}`;
    if (bulanLabel) return bulanLabel;
    if (filterTahun) return `Tahun ${filterTahun}`;
    return "Semua Periode";
  }, [filterBulan, filterTahun]);

  /* ── Stat values ── */
  const totalInvoice = filteredByPeriod.length;

  const totalPaid = filteredByPeriod
    .filter(inv => getComputedStatus(inv) === "paid")
    .reduce((acc, inv) => acc + parseAmount(inv.amount), 0);

  const totalOutstanding = filteredByPeriod
    .filter(inv => getComputedStatus(inv) !== "paid")
    .reduce((acc, inv) => acc + parseAmount(inv.amount), 0);

  const totalKeseluruhan = filteredByPeriod.reduce(
    (acc, inv) => acc + parseAmount(inv.amount), 0
  );

  const totalCustomer = new Set(
    filteredByPeriod.map(inv => inv.kepada || inv.customer)
  ).size;

  const paidCount    = filteredByPeriod.filter(inv => getComputedStatus(inv) === "paid").length;
  const overdueCount = filteredByPeriod.filter(inv => getComputedStatus(inv) === "overdue").length;
  const unpaidCount  = filteredByPeriod.filter(inv => getComputedStatus(inv) === "unpaid").length;

  const paymentData = [
    { name: "Lunas",      value: paidCount,    color: "#3a87a8" },
    { name: "Belum Bayar",value: unpaidCount,  color: "#76c0cf" },
    { name: "Jatuh Tempo",value: overdueCount, color: "#0f2b46" },
  ];

  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  const revenueData = months.map((month, index) => {
    const total = filteredInvoices
      .filter(inv => {
        if (!inv.date) return false;
        const invDate = new Date(inv.date);
        return (
          invDate.getFullYear() === Number(selectedYear) &&
          invDate.getMonth()    === index &&
          getComputedStatus(inv) === "paid"
        );
      })
      .reduce((acc, inv) => acc + parseAmount(inv.amount), 0);
    return { month, value: total };
  });

  const formatYAxis = (value) => {
    if (value === 0) return "0";
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}Jt`;
    if (value >= 1_000)         return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}rb`;
    return String(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">Rp {payload[0].value.toLocaleString("id-ID")}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header-card">
        <h1>Ringkasan Dashboard</h1>
        <p>{timeGreeting}, <strong>{user?.name || "Admin"}</strong> 👋</p>
        <span className="dashboard-motivation">{randomGreeting}</span>
      </div>

      {/* PAPER SIZE TOGGLE */}
      <div className="dash-paper-toggle">
        <button
          className={`dash-paper-btn ${selectedPaper === "all" ? "active-all" : ""}`}
          onClick={() => setSelectedPaper("all")}
        >
          <FileText size={14} />
          <span>Semua Invoice</span>
          <span className="dash-paper-count">{invoices.length}</span>
        </button>
        <button
          className={`dash-paper-btn ${selectedPaper === "a5" ? "active-a5" : ""}`}
          onClick={() => setSelectedPaper("a5")}
        >
          <Printer size={14} />
          <span>A5 · Cetak</span>
          <span className="dash-paper-count a5">{a5Count}</span>
        </button>
        <button
          className={`dash-paper-btn ${selectedPaper === "a4" ? "active-a4" : ""}`}
          onClick={() => setSelectedPaper("a4")}
        >
          <Send size={14} />
          <span>A4 · PDF</span>
          <span className="dash-paper-count a4">{a4Count}</span>
        </button>
      </div>

      {/* ── FILTER PERIODE ── */}
      <div className="dash-period-filter">
        <div className="dash-period-left">
          <Calendar size={14} className="dash-period-icon" />
          <span className="dash-period-title">Periode</span>
          <span className="dash-period-label">{periodeLabel}</span>
        </div>
        <div className="dash-period-controls">
          <FilterDropdown
            value={filterBulan}
            options={BULAN}
            onChange={setFilterBulan}
            placeholder="Semua Bulan"
            icon={Calendar}
          />
          <FilterDropdown
            value={filterTahun}
            options={tahunOptions}
            onChange={setFilterTahun}
            placeholder="Semua Tahun"
          />
          {(filterBulan || filterTahun) && (
            <button
              className="dash-period-reset"
              onClick={() => { setFilterBulan(""); setFilterTahun(""); }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="dashboard-cards">

        {/* 1. Total Keseluruhan — full width */}
        <div className="card navy card-full">
          <div>
            <p className="card-title">Total Keseluruhan · {periodeLabel}</p>
            <h2>Rp {totalKeseluruhan.toLocaleString("id-ID")}</h2>
            <p className="card-subtitle">Seluruh nilai transaksi invoice</p>
          </div>
          <div className="card-icon navy-icon">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* 2. Total Invoice */}
        <div className="card light">
          <div>
            <p className="card-title">Total Invoice</p>
            <h2>{totalInvoice}</h2>
          </div>
          <div className="card-icon light-icon">
            <FileText size={20} />
          </div>
        </div>

        {/* 3. Belum Dibayar */}
        <div className="card dark">
          <div>
            <p className="card-title">Belum Dibayar</p>
            <h2>Rp {totalOutstanding.toLocaleString("id-ID")}</h2>
          </div>
          <div className="card-icon dark-icon">
            <Wallet size={20} />
          </div>
        </div>

        {/* 4. Sudah Dibayar */}
        <div className="card blue">
          <div>
            <p className="card-title">Sudah Dibayar</p>
            <h2>Rp {totalPaid.toLocaleString("id-ID")}</h2>
          </div>
          <div className="card-icon blue-icon">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* 5. Total Pelanggan */}
        <div className="card yellow">
          <div>
            <p className="card-title">Total Pelanggan</p>
            <h2>{totalCustomer}</h2>
          </div>
          <div className="card-icon yellow-icon">
            <Users size={20} />
          </div>
        </div>

      </div>

      {/* CHARTS */}
      <div className="charts-wrapper">

        {/* BAR CHART */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>
                Pendapatan Bulanan
                {selectedPaper !== "all" && (
                  <span className={`dash-chart-badge ${selectedPaper}`}>
                    {selectedPaper === "a5" ? "A5 · Cetak" : "A4 · Kirim"}
                  </span>
                )}
              </h3>
              <p>Ringkasan pendapatan yang sudah dibayar</p>
            </div>
            <select
              className="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {yearOptions.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={revenueData}
              margin={{ top: 4, right: 8, left: 10, bottom: 0 }}
              barCategoryGap="35%"
            >
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(15, 43, 70, 0.04)" }}
              />
              <Bar dataKey="value" fill="#1e4976" radius={[7, 7, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DONUT CHART */}
        <div className="chart-card small">
          <div className="chart-header">
            <div>
              <h3>
                Status Pembayaran
                {selectedPaper !== "all" && (
                  <span className={`dash-chart-badge ${selectedPaper}`}>
                    {selectedPaper === "a5" ? "A5" : "A4"}
                  </span>
                )}
              </h3>
              <p>Distribusi status invoice · {periodeLabel}</p>
            </div>
          </div>

          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={240} minHeight={240}>
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={paymentData}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                  activeIndex={activeIndex}
                  activeOuterRadius={105}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-center">
              <h2>{totalInvoice}</h2>
              <span>Total</span>
            </div>
          </div>

          <div className="legend">
            {paymentData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="dot" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className="legend-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardCards;