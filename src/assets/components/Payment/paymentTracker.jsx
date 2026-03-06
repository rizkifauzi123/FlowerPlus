import "../../Style/Payment/paymentTracker.css";
import { useState, useEffect, useRef } from "react";
import {
  Filter, ChevronDown, Check,
  CheckCircle2, Clock, AlertCircle, Calendar
} from "lucide-react";
import { useApp } from "../../../context/AppContext";

const PaymentTracker = () => {
  const { invoices, setInvoices, focusedInvoiceId, setFocusedInvoiceId } = useApp();

  const paginationRef  = useRef(null);
  const itemRefs       = useRef({});   // { [inv.id]: domElement }
  const [activeId, setActiveId] = useState(null); // keyboard nav

  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage = 20;
  const [openStatus, setOpenStatus]       = useState(false);
  const [openMonth, setOpenMonth]         = useState(false);
  const [openYear, setOpenYear]           = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedMonth, setSelectedMonth]   = useState("Semua Bulan");
  const [selectedYear, setSelectedYear]     = useState("Semua Tahun");
  const [highlightId, setHighlightId]     = useState(null); // untuk flash kuning

  const statusOptions = ["All Status", "Paid", "Unpaid", "Overdue"];
  const monthOptions  = [
    "Semua Bulan",
    "Januari","Februari","Maret","April",
    "Mei","Juni","Juli","Agustus",
    "September","Oktober","November","Desember"
  ];
  const currentYear = new Date().getFullYear();
  const yearOptions = ["Semua Tahun", ...Array.from({ length: 6 }, (_, i) => String(currentYear - i))];

  const closeAll = () => { setOpenStatus(false); setOpenMonth(false); setOpenYear(false); };

  const handleMarkPaid = (id) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
  };

  const today = new Date();

  const processedInvoices = invoices.map(inv => {
    const dueDate = new Date(inv.date);
    dueDate.setDate(dueDate.getDate() + 7);
    if (inv.status === "paid")  return { ...inv, computedStatus: "paid" };
    if (today > dueDate)        return { ...inv, computedStatus: "overdue" };
    return { ...inv, computedStatus: "unpaid" };
  });

  const filteredInvoices = processedInvoices.filter(inv => {
    const invDate  = new Date(inv.date);
    const invMonth = invDate.getMonth() + 1;
    const invYear  = invDate.getFullYear();
    if (selectedStatus !== "All Status") {
      const m = { Paid:"paid", Unpaid:"unpaid", Overdue:"overdue" };
      if (inv.computedStatus !== m[selectedStatus]) return false;
    }
    if (selectedMonth !== "Semua Bulan") {
      const idx = monthOptions.indexOf(selectedMonth);
      if (idx === -1 || invMonth !== idx) return false;
    }
    if (selectedYear !== "Semua Tahun" && String(invYear) !== selectedYear) return false;
    return true;
  });

  const totalPages      = Math.ceil(filteredInvoices.length / itemsPerPage);
  const indexOfLast     = currentPage * itemsPerPage;
  const indexOfFirst    = indexOfLast - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => paginationRef.current?.scrollIntoView({ behavior:"smooth", block:"center" }), 50);
  };

  useEffect(() => { setCurrentPage(1); }, [selectedStatus, selectedMonth, selectedYear]);

  /* ─────────────────────────────────────────
     SCROLL + HIGHLIGHT dari notifikasi
  ───────────────────────────────────────── */
  useEffect(() => {
    if (!focusedInvoiceId) return;

    // Cari di halaman berapa invoice itu berada
    const idx = filteredInvoices.findIndex(inv => inv.id === focusedInvoiceId);
    if (idx === -1) return;

    const targetPage = Math.ceil((idx + 1) / itemsPerPage);
    setCurrentPage(targetPage);
    setActiveId(focusedInvoiceId);

    // Scroll + flash setelah render
    setTimeout(() => {
      const el = itemRefs.current[focusedInvoiceId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightId(focusedInvoiceId);
        // Hilangkan highlight setelah 2.5 detik
        setTimeout(() => setHighlightId(null), 2500);
      }
      setFocusedInvoiceId(null); // reset context
    }, 120);
  }, [focusedInvoiceId]);

  /* ─────────────────────────────────────────
     KEYBOARD NAVIGATION ↑↓ Enter
  ───────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (!["ArrowDown","ArrowUp","Enter"].includes(e.key)) return;
      if (currentInvoices.length === 0) return;

      e.preventDefault();

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const ids  = currentInvoices.map(i => i.id);
        const curr = activeId ? ids.indexOf(activeId) : -1;
        const next = e.key === "ArrowDown"
          ? Math.min(curr + 1, ids.length - 1)
          : Math.max(curr - 1, 0);
        const nextId = ids[next === -1 ? 0 : next];
        setActiveId(nextId);
        itemRefs.current[nextId]?.scrollIntoView({ behavior:"smooth", block:"nearest" });
      }

      if (e.key === "Enter" && activeId) {
        // Mark as paid dengan Enter jika item aktif bukan paid
        const inv = currentInvoices.find(i => i.id === activeId);
        if (inv && inv.computedStatus !== "paid") handleMarkPaid(activeId);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeId, currentInvoices]);

  /* summary */
  const totalAmount = filteredInvoices.reduce((a, inv) => a + Number(inv.amount?.replace(/[^0-9]/g,"") || 0), 0);
  const paidAmount  = filteredInvoices.filter(i => i.computedStatus === "paid")
                        .reduce((a, inv) => a + Number(inv.amount?.replace(/[^0-9]/g,"") || 0), 0);
  const collectionRate = totalAmount === 0 ? 0 : ((paidAmount / totalAmount) * 100).toFixed(1);
  const paidCount    = filteredInvoices.filter(i => i.computedStatus === "paid").length;
  const unpaidCount  = filteredInvoices.filter(i => i.computedStatus === "unpaid").length;
  const overdueCount = filteredInvoices.filter(i => i.computedStatus === "overdue").length;

  const formatDate = (d) => new Date(d).toLocaleDateString("id-ID",{ day:"2-digit", month:"long", year:"numeric" });
  const getDueDate = (d) => { const x = new Date(d); x.setDate(x.getDate()+7); return x; };

  const CustomSelect = ({ open, setOpen, options, value, setValue, minWidth }) => (
    <div className="pt-select" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className={`pt-select-trigger ${open ? "open" : ""}`}
        style={{ minWidth }}
        onClick={() => { closeAll(); setOpen(!open); }}
      >
        <span>{value}</span>
        <ChevronDown size={13} className={`pt-chevron ${open ? "rotated" : ""}`} />
      </button>
      {open && (
        <div className="pt-select-menu">
          {options.map(opt => (
            <button
              key={opt} type="button"
              className={`pt-select-option ${value === opt ? "selected" : ""}`}
              onClick={() => { setValue(opt); setOpen(false); }}
            >
              <span>{opt}</span>
              {value === opt && <Check size={13} className="pt-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="payment-page" onClick={closeAll}>

      {/* HEADER */}
      <div className="pt-header">
        <div className="pt-header-text">
          <h2>Payment Tracker</h2>
          <p>Pantau status pembayaran invoice</p>
        </div>
      </div>

      {/* PROGRESS CARD */}
      <div className="pt-progress-card">
        <div className="pt-progress-top">
          <div className="pt-progress-label">
            <h4>Payment Progress</h4>
            <span>Total collection rate</span>
          </div>
          <div className="pt-progress-rate">
            <h3>{collectionRate}%</h3>
            <span>Rp {paidAmount.toLocaleString("id-ID")} dari Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>
        </div>
        <div className="pt-bar-track">
          <div className="pt-bar-fill" style={{ width:`${collectionRate}%` }} />
        </div>
        <div className="pt-summary-row">
          <div className="pt-summary-card paid"><CheckCircle2 size={18}/><h3>{paidCount}</h3><span>Paid</span></div>
          <div className="pt-summary-card pending"><Clock size={18}/><h3>{unpaidCount}</h3><span>Unpaid</span></div>
          <div className="pt-summary-card overdue"><AlertCircle size={18}/><h3>{overdueCount}</h3><span>Overdue</span></div>
        </div>
      </div>

      {/* FILTER */}
      <div className="pt-filter-bar">
        <div className="pt-filter-left"><Filter size={14}/><span>Filter</span></div>
        <div className="pt-filter-divider"/>
        <div className="pt-filter-controls">
          <Calendar size={14} className="pt-cal-icon"/>
          <CustomSelect open={openMonth}  setOpen={setOpenMonth}  options={monthOptions}  value={selectedMonth}  setValue={setSelectedMonth}  minWidth="148px"/>
          <CustomSelect open={openYear}   setOpen={setOpenYear}   options={yearOptions}   value={selectedYear}   setValue={setSelectedYear}   minWidth="110px"/>
          <CustomSelect open={openStatus} setOpen={setOpenStatus} options={statusOptions} value={selectedStatus} setValue={setSelectedStatus} minWidth="120px"/>
        </div>
      </div>

      {/* LIST */}
      <div className="pt-list">
        {currentInvoices.length === 0 ? (
          <div className="pt-empty">
            <span className="pt-empty-icon">📄</span>
            <span>Tidak ada invoice ditemukan</span>
          </div>
        ) : (
          currentInvoices.map((inv) => {
            const status = inv.computedStatus;
            const isActive    = activeId === inv.id;
            const isHighlight = highlightId === inv.id;
            return (
              <div
                key={inv.id}
                ref={el => itemRefs.current[inv.id] = el}
                className={`pt-item ${status} ${isActive ? "kb-active" : ""} ${isHighlight ? "flash-highlight" : ""}`}
                onClick={() => setActiveId(inv.id)}
              >
                <div className="pt-item-left">
                  <div className={`pt-status-icon ${status}`}>
                    {status === "paid"    && <CheckCircle2 size={18}/>}
                    {status === "overdue" && <AlertCircle  size={18}/>}
                    {status === "unpaid"  && <Clock        size={18}/>}
                  </div>
                  <div className="pt-item-info">
                    <div className="pt-item-title">
                      <span className="pt-inv-number">{inv.invoiceNumber}</span>
                      <span className={`pt-badge badge-${status}`}>{status}</span>
                    </div>
                    <span className="pt-item-customer">{inv.kepada}</span>
                  </div>
                </div>

                <div className="pt-item-right">
                  <div className="pt-item-meta">
                    <span className="pt-amount">{inv.amount}</span>
                    <span className="pt-date">Dibuat: {formatDate(inv.date)}</span>
                    <span className="pt-date">Jatuh Tempo: {formatDate(getDueDate(inv.date))}</span>
                  </div>
                  <div className="pt-item-actions">
                    {status === "overdue" && (
                      <span className="pt-late-tag">
                        Terlambat {Math.floor((new Date() - getDueDate(inv.date)) / (1000*60*60*24))} hari
                      </span>
                    )}
                    {status !== "paid" && (
                      <button className={`pt-mark-btn ${status}`} onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv.id); }}>
                        <Check size={14}/> Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pt-pagination" ref={paginationRef}>
          <button className="pt-page-arrow" disabled={currentPage===1} onClick={() => handlePageChange(currentPage-1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const p = i + 1;
            if (p===1 || p===totalPages || Math.abs(p-currentPage)<=1)
              return <button key={p} className={currentPage===p?"active":""} onClick={() => handlePageChange(p)}>{p}</button>;
            if (Math.abs(p-currentPage)===2)
              return <span key={p} className="pt-ellipsis">…</span>;
            return null;
          })}
          <button className="pt-page-arrow" disabled={currentPage===totalPages} onClick={() => handlePageChange(currentPage+1)}>›</button>
        </div>
      )}
    </div>
  );
};

export default PaymentTracker;