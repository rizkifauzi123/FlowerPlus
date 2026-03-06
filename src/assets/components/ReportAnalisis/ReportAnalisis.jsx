import { useMemo, useState, useRef } from "react";
import {
  TrendingUp,
  Wallet,
  FileText,
  Users,
  Download,
  ChevronDown,
  Check,
  CalendarRange,
  X,
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
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import { useApp } from "../../../context/AppContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../../Style/ReportAnalisis/ReportAnalisis.css";

/* ======================== CONSTANTS ======================== */

const currentYear = new Date().getFullYear();

const periods = [
  "1 Bulan Terakhir",
  "3 Bulan Terakhir",
  "6 Bulan Terakhir",
  "Setahun Terakhir",
  ...Array.from({ length: 6 }, (_, i) => String(currentYear - i)),
  "Custom",
];

const RANK_COLORS = [
  { cls: "ra-rank-1" },
  { cls: "ra-rank-2" },
  { cls: "ra-rank-3" },
  { cls: "ra-rank-4" },
  { cls: "ra-rank-5" },
];

const SUMMARY_ICON_CLS = [
  "ra-icon-blue",
  "ra-icon-green",
  "ra-icon-yellow",
  "ra-icon-purple",
];

/* ======================== HELPERS ======================== */

const formatShort = (value) => {
  if (value >= 1_000_000_000)
    return (value / 1_000_000_000).toFixed(1).replace(".0", "") + "M";
  if (value >= 1_000_000)
    return (value / 1_000_000).toFixed(1).replace(".0", "") + "jt";
  if (value >= 1_000) return (value / 1_000).toFixed(0) + "rb";
  return value;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ======================== CUSTOM TOOLTIP ======================== */

const DarkTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="ra-custom-tooltip">
        <p className="ra-tooltip-label">{label}</p>
        <p className="ra-tooltip-value">Rp {payload[0].value.toLocaleString("id-ID")}</p>
      </div>
    );
  }
  return null;
};

/* ======================== COMPONENT ======================== */

const ReportAnalisis = () => {
  const { invoices } = useApp();
  const reportRef = useRef(null);

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [tempStart, setTempStart] = useState("");
  const [tempEnd, setTempEnd] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("6 Bulan Terakhir");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [exportType, setExportType] = useState("pdf");

  /* ======================== PERIOD LABEL ======================== */

  const periodLabel = useMemo(() => {
    if (selectedPeriod === "Custom" && customStart && customEnd) {
      return `${formatDateShort(customStart)} – ${formatDateShort(customEnd)}`;
    }
    return selectedPeriod;
  }, [selectedPeriod, customStart, customEnd]);

  /* ======================== PARSE AMOUNT ======================== */

  const parseAmount = (amount) => {
    if (!amount) return 0;
    if (typeof amount === "number") return amount;
    return Number(amount.replace(/[^0-9]/g, "")) || 0;
  };

  /* ======================== FILTER DATA ======================== */

  const filteredInvoices = useMemo(() => {
    const now = new Date();

    return invoices.filter((inv) => {
      if (!inv.date) return false;
      const itemDate = new Date(inv.date);

      if (selectedPeriod === "Custom") {
        if (!customStart || !customEnd) return false;
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }

      if (!isNaN(Number(selectedPeriod))) {
        return itemDate.getFullYear() === Number(selectedPeriod);
      }

      if (selectedPeriod === "Setahun Terakhir") {
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        return itemDate >= lastYear;
      }

      if (selectedPeriod.includes("Bulan")) {
        const monthsBack = parseInt(selectedPeriod);
        const diffMonth =
          (now.getFullYear() - itemDate.getFullYear()) * 12 +
          (now.getMonth() - itemDate.getMonth());
        return diffMonth >= 0 && diffMonth < monthsBack;
      }

      return true;
    });
  }, [invoices, selectedPeriod, customStart, customEnd]);

  /* ======================== AUTO OVERDUE ======================== */

  const today = new Date();

  const processed = filteredInvoices.map((inv) => {
    const invoiceDate = new Date(inv.date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 7);

    if (inv.status === "paid") return { ...inv, computedStatus: "paid" };
    if (today > dueDate) return { ...inv, computedStatus: "overdue" };
    return { ...inv, computedStatus: "unpaid" };
  });

  /* ======================== TOTALS ======================== */

  const totalRevenue = processed
    .filter((i) => i.computedStatus === "paid")
    .reduce((a, i) => a + parseAmount(i.amount), 0);

  const totalAmount = processed.reduce((a, i) => a + parseAmount(i.amount), 0);

  const collectionRate =
    totalAmount === 0 ? 0 : ((totalRevenue / totalAmount) * 100).toFixed(1);

  /* ======================== STATUS DATA ======================== */

  const paidCount = processed.filter((i) => i.computedStatus === "paid").length;
  const unpaidCount = processed.filter((i) => i.computedStatus === "unpaid").length;
  const overdueCount = processed.filter((i) => i.computedStatus === "overdue").length;

  const statusData = [
    { name: "Paid", value: paidCount, color: "#22C55E" },
    { name: "Unpaid", value: unpaidCount, color: "#F59E0B" },
    { name: "Overdue", value: overdueCount, color: "#EF4444" },
  ];

  /* ======================== MONTHLY DATA (cross-year safe) ======================== */

  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  const monthlyData = useMemo(() => {
    const grouped = {};

    processed.forEach((inv) => {
      if (inv.computedStatus !== "paid") return;
      const d = new Date(inv.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month).padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + parseAmount(inv.amount);
    });

    const sorted = Object.entries(grouped)
      .map(([key, value]) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month, value, sortKey: year * 100 + month };
      })
      .sort((a, b) => a.sortKey - b.sortKey);

    return sorted.map((item) => ({
      month: `${months[item.month]} ${item.year}`,
      value: item.value,
      year: item.year,
    }));
  }, [processed]);

  /* ======================== BANK DATA ======================== */

  const bankData = useMemo(() => {
    const grouped = {};
    processed.forEach((inv) => {
      if (inv.computedStatus === "paid") {
        const bank = inv.bank || "Other";
        grouped[bank] = (grouped[bank] || 0) + parseAmount(inv.amount);
      }
    });
    return Object.entries(grouped)
      .map(([bank, value]) => ({ bank, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [processed]);

  /* ======================== TOP CUSTOMERS ======================== */

  const topCustomers = useMemo(() => {
    const grouped = {};
    processed.forEach((inv) => {
      if (inv.computedStatus === "paid") {
        const customer = inv.customer || inv.kepada || "Unknown";
        grouped[customer] = (grouped[customer] || 0) + parseAmount(inv.amount);
      }
    });
    const sorted = Object.entries(grouped)
      .map(([customer, total]) => ({ customer, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    const max = sorted[0]?.total || 0;
    return sorted.map((item, i) => ({
      ...item,
      rank: i + 1,
      pct: max ? (item.total / max) * 100 : 0,
    }));
  }, [processed]);

  /* ======================== EXPORT ======================== */

  const handleExport = async () => {
    if (exportType === "excel") {
      const worksheetData = monthlyData.map((item) => ({
        Periode: item.month,
        Total_Pendapatan: item.value,
      }));
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(file, "Laporan_Tren_Pendapatan.xlsx");
    } else {
      const element = reportRef.current;
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("Laporan.pdf");
    }
  };

  /* ======================== CUSTOM MODAL HANDLERS ======================== */

  const handleOpenCustom = () => {
    setTempStart(customStart);
    setTempEnd(customEnd);
    setShowCustomModal(true);
    setOpenDropdown(false);
  };

  const handleApplyCustom = () => {
    if (!tempStart || !tempEnd) return;
    setCustomStart(tempStart);
    setCustomEnd(tempEnd);
    setSelectedPeriod("Custom");
    setShowCustomModal(false);
  };

  /* ======================== CHART TITLE ======================== */

  const chartTitle = useMemo(() => {
    if (selectedPeriod === "Custom" && customStart && customEnd) {
      return `Tren Pendapatan ${formatDateShort(customStart)} – ${formatDateShort(customEnd)}`;
    }
    return `Tren Pendapatan — ${selectedPeriod}`;
  }, [selectedPeriod, customStart, customEnd]);

  /* ======================== RENDER ======================== */

  return (
    <div className="ra-root" onClick={() => setOpenDropdown(false)}>
      <div className="ra-container" ref={reportRef}>

        {/* HEADER */}
        <div className="ra-header">
          <div>
            <h2 className="ra-header-title">Laporan & Analisis</h2>
            <p className="ra-header-sub">Ringkasan keuangan bisnis Anda</p>
          </div>

          <div className="ra-header-actions">
            {/* PERIOD DROPDOWN */}
            <div
              className="ra-dropdown"
              onClick={(e) => { e.stopPropagation(); setOpenDropdown(!openDropdown); }}
            >
              <span className="ra-dropdown-label">{periodLabel}</span>
              <ChevronDown size={15} className={`ra-chevron ${openDropdown ? "open" : ""}`} />

              {openDropdown && (
                <div className="ra-dropdown-menu">
                  {periods.map((period) => (
                    <div
                      key={period}
                      className={`ra-dropdown-item ${selectedPeriod === period ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (period === "Custom") {
                          handleOpenCustom();
                        } else {
                          setSelectedPeriod(period);
                          setOpenDropdown(false);
                        }
                      }}
                    >
                      <span>{period}</span>
                      {selectedPeriod === period && <Check size={13} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXPORT */}
            <div className="ra-export-wrapper">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="ra-export-select"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
              <button className="ra-export-btn" onClick={handleExport}>
                <Download size={14} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="ra-summary-grid">
          {[
            {
              label: "Total Revenue",
              value: `Rp ${totalRevenue.toLocaleString("id-ID")}`,
              icon: <TrendingUp size={17} />,
            },
            {
              label: "Collection Rate",
              value: `${collectionRate}%`,
              icon: <Wallet size={17} />,
            },
            {
              label: "Total Invoices",
              value: filteredInvoices.length,
              icon: <FileText size={17} />,
            },
            {
              label: "Active Customers",
              value: new Set(filteredInvoices.map((i) => i.customer)).size,
              icon: <Users size={17} />,
            },
          ].map((card, i) => (
            <div key={i} className="ra-summary-card">
              <div>
                <p className="ra-summary-label">{card.label}</p>
                <p className="ra-summary-value">{card.value}</p>
              </div>
              <div className={`ra-icon-box ${SUMMARY_ICON_CLS[i]}`}>{card.icon}</div>
            </div>
          ))}
        </div>

        {/* ROW 1 — LINE CHART + DONUT */}
        <div className="ra-chart-main">
          {/* Line chart */}
          <div className="ra-card">
            <p className="ra-card-title">{chartTitle}</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#8A95A3" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={formatShort}
                  tick={{ fontSize: 11, fill: "#8A95A3" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0D1B2A"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#0D1B2A", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#0D1B2A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Donut */}
          <div className="ra-card">
            <p className="ra-card-title">Status Invoice</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="#fff"
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {statusData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, ""]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="ra-divider" />

            {statusData.map((item, i) => (
              <div key={i} className="ra-legend-row">
                <div className="ra-legend-left">
                  <span className="ra-legend-dot" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
                <span className="ra-legend-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2 — BAR CHART (year only) + TOP CUSTOMERS */}
        <div className="ra-chart-bottom">
          {/* Bar chart — year grouped */}
          <div className="ra-card">
            <p className="ra-card-title">Pendapatan per Bank</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={bankData} margin={{ left: 8 }}>
                <XAxis
                  type="number"
                  tickFormatter={formatShort}
                  tick={{ fontSize: 11, fill: "#8A95A3" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="bank"
                  tick={{ fontSize: 12, fill: "#3D4A58" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill="#0D1B2A" radius={[0, 5, 5, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top customers */}
          <div className="ra-card">
            <p className="ra-card-title">Top 10 Customer</p>
            {topCustomers.length === 0 ? (
              <p className="ra-empty">Belum ada pembayaran masuk</p>
            ) : (
              topCustomers.map((c) => (
                <div key={c.rank} className="ra-customer-row">
                  <div className={`ra-rank-badge ${RANK_COLORS[c.rank - 1]?.cls ?? "ra-rank-other"}`}>
                    {c.rank}
                  </div>
                  <div className="ra-customer-info">
                    <div className="ra-customer-header">
                      <span className="ra-customer-name">{c.customer}</span>
                      <span className="ra-customer-amount">Rp {formatShort(c.total)}</span>
                    </div>
                    <div className="ra-bar-track">
                      <div
                        className="ra-bar-fill"
                        style={{
                          width: `${c.pct}%`,
                          opacity: Math.max(0.3, 1 - (c.rank - 1) * 0.07),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM DATE RANGE MODAL */}
      {showCustomModal && (
        <div className="ra-modal-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="ra-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="ra-modal-header">
              <div className="ra-modal-icon">
                <CalendarRange size={20} />
              </div>
              <div>
                <h3 className="ra-modal-title">Pilih Rentang Tanggal</h3>
                <p className="ra-modal-subtitle">Tentukan periode laporan kustom Anda</p>
              </div>
              <button className="ra-modal-close" onClick={() => setShowCustomModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Date Inputs */}
            <div className="ra-modal-body">
              <div className="ra-date-field">
                <label className="ra-date-label">Tanggal Mulai</label>
                <input
                  type="date"
                  className="ra-date-input"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                />
                {tempStart && (
                  <span className="ra-date-preview">{formatDateDisplay(tempStart)}</span>
                )}
              </div>

              <div className="ra-date-separator">
                <div className="ra-separator-line" />
                <span className="ra-separator-text">s/d</span>
                <div className="ra-separator-line" />
              </div>

              <div className="ra-date-field">
                <label className="ra-date-label">Tanggal Selesai</label>
                <input
                  type="date"
                  className="ra-date-input"
                  value={tempEnd}
                  min={tempStart}
                  onChange={(e) => setTempEnd(e.target.value)}
                />
                {tempEnd && (
                  <span className="ra-date-preview">{formatDateDisplay(tempEnd)}</span>
                )}
              </div>
            </div>

            {/* Selected Range Preview */}
            {tempStart && tempEnd && (
              <div className="ra-range-preview">
                <CalendarRange size={14} />
                <span>
                  {formatDateShort(tempStart)} — {formatDateShort(tempEnd)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="ra-modal-footer">
              <button className="ra-btn-cancel" onClick={() => setShowCustomModal(false)}>
                Batal
              </button>
              <button
                className="ra-btn-apply"
                onClick={handleApplyCustom}
                disabled={!tempStart || !tempEnd}
              >
                <Check size={14} />
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportAnalisis;