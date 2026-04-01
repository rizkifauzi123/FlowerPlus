import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Calendar, Filter, MoreVertical, Eye, Pencil, Trash2,
  Check, ChevronDown, Search, Building2, Share2, Mail,
  Printer, Send
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import "../../Style/Invoice/InvoiceManagement.css";
import { useApp } from "../../../context/AppContext";

const banks = [
  "Semua Bank", "BCA", "Mandiri", "BRI", "BNI",
  "CIMB Niaga", "Permata", "Danamon", "BTN", "OCBC", "Lainnya"
];

const statuses = ["Semua Status", "Lunas", "Belum Lunas"];

/* ===============================
   HELPER: Format tanggal DD/MM/YYYY
================================= */
const formatDateBroadcast = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/* ===============================
   HELPER: Jatuh tempo DD/MM/YYYY (+7 hari)
================================= */
const formatDueDateBroadcast = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(new Date(dateString).getTime() + 7 * 24 * 60 * 60 * 1000);
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/* ===============================
   HELPER: Link download invoice
================================= */
const getDownloadLink = (item) => {
  const base = window.location.origin;
  return `${base}/invoice/download/${item.id}?type=${item.type || "normal"}&paper_size=${item.paper_size ?? "a4"}`;
};

/* ===============================
   BANK DROPDOWN
================================= */
const BankDropdown = ({ value, customBank, onBankChange, onCustomBankChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && value === "Lainnya" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, value]);

  const handleSelect = (option) => {
    onBankChange(option);
    if (option !== "Lainnya") { onCustomBankChange(""); setOpen(false); }
  };

  const displayLabel = value === "Lainnya" && customBank ? `Lainnya: ${customBank}` : value;

  return (
    <div className="custom-dropdown bank-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen(p => !p)}
      >
        <Building2 size={13} className="trigger-icon" />
        <span className="trigger-label">{displayLabel}</span>
        <ChevronDown size={13} className={`dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu bank-menu">
          {banks.map((option, i) => (
            <button
              key={i} type="button"
              className={`custom-dropdown-option ${value === option ? "selected" : ""}`}
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>
              {value === option && <Check size={13} className="option-check" />}
            </button>
          ))}

          {value === "Lainnya" && (
            <div className="other-bank-input-wrap">
              <div className="other-input-divider" />
              <div className="other-input-label"><Building2 size={12} /> Masukkan nama bank</div>
              <input
                ref={inputRef} type="text" className="other-bank-input"
                placeholder="cth. Maybank, HSBC..."
                value={customBank}
                onChange={(e) => onCustomBankChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === "Enter") setOpen(false); }}
              />
              {customBank && (
                <button type="button" className="other-apply-btn" onClick={() => setOpen(false)}>
                  <Check size={12} /> Terapkan
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ===============================
   STATUS DROPDOWN
================================= */
const CustomDropdown = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen(p => !p)}
      >
        <span>{value}</span>
        <ChevronDown size={13} className={`dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu">
          {options.map((option, i) => (
            <button
              key={i} type="button"
              className={`custom-dropdown-option ${value === option ? "selected" : ""}`}
              onClick={() => { onChange(option); setOpen(false); }}
            >
              <span>{option}</span>
              {value === option && <Check size={13} className="option-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ===============================
   PAPER SIZE TOGGLE
================================= */
const PaperSizeToggle = ({ value, onChange }) => {
  const options = [
    { key: "all",  label: "Semua",  icon: null },
    { key: "a5",   label: "A5",     icon: <Printer size={12} />,  sub: "Cetak" },
    { key: "a4",   label: "A4",     icon: <Send size={12} />,     sub: "PDF" },
  ];

  return (
    <div className="paper-size-toggle">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          className={`pst-btn ${value === opt.key ? "pst-active" : ""} ${opt.key !== "all" ? `pst-${opt.key}` : ""}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.icon && <span className="pst-icon">{opt.icon}</span>}
          <span className="pst-label">{opt.label}</span>
          {opt.sub && <span className="pst-sub">{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
};

/* ===============================
   MAIN COMPONENT
================================= */
const InvoiceManagement = () => {
  const { invoices, setInvoices } = useApp();
  const navigate = useNavigate();

  const [currentPage,       setCurrentPage]       = useState(1);
  const itemsPerPage = 20;
  const paginationRef = useRef(null);

  const [customBank,        setCustomBank]        = useState("");
  const [selectedBank,      setSelectedBank]      = useState("Semua Bank");
  const [selectedStatus,    setSelectedStatus]    = useState("Semua Status");
  const [selectedPaperSize, setSelectedPaperSize] = useState("all");
  const [activeDropdown,    setActiveDropdown]    = useState(null);
  const [shareDropdown,     setShareDropdown]     = useState(null);
  const [selectedDate,      setSelectedDate]      = useState("");
  const [dateOpen,          setDateOpen]          = useState(false);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [currentDate,       setCurrentDate]       = useState(new Date());
  const [invoiceToDelete,   setInvoiceToDelete]   = useState(null);

  const dateWrapperRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (dateWrapperRef.current && !dateWrapperRef.current.contains(e.target)) setDateOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest(".action-cell")) {
        setActiveDropdown(null);
        setShareDropdown(null);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleDropdown = (index) => {
    setShareDropdown(null);
    setActiveDropdown(prev => prev === index ? null : index);
  };

  /* ── COUNT per paper_size ── */
  const countA5 = invoices.filter(inv => (inv.paper_size ?? "a4") === "a5").length;
  const countA4 = invoices.filter(inv => (inv.paper_size ?? "a4") === "a4").length;

  /* ── FILTER ── */
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedPaperSize !== "all") {
      const size = inv.paper_size ?? "a4";
      if (size !== selectedPaperSize) return false;
    }
    if (selectedBank !== "Semua Bank") {
      if (selectedBank === "Lainnya") {
        if (customBank && !inv.bank.toLowerCase().includes(customBank.toLowerCase())) return false;
      } else {
        if (inv.bank !== selectedBank) return false;
      }
    }
    if (selectedStatus !== "Semua Status") {
      const statusMap = { "Lunas": "paid", "Belum Lunas": "unpaid" };
      if (inv.status.toLowerCase() !== (statusMap[selectedStatus] || selectedStatus.toLowerCase())) return false;
    }
    if (selectedDate && inv.date !== selectedDate) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCustomer = inv.customer.toLowerCase().includes(term);
      const matchInvoiceNumber = inv.invoiceNumber.toLowerCase().includes(term);
      if (!matchCustomer && !matchInvoiceNumber) return false;
    }
    return true;
  });

  useEffect(() => { setCurrentPage(1); }, [selectedPaperSize, selectedBank, selectedStatus, selectedDate, searchTerm]);

  /* ── PAGINATION ── */
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setTimeout(() => {
      paginationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const totalPages       = Math.ceil(filteredInvoices.length / itemsPerPage);
  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices  = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    try {
      const response = await fetch(`https://api.flowerplusofficial.com/api/invoices/${invoiceToDelete}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("DELETE ERROR:", text);
        alert("Gagal menghapus invoice");
        return;
      }

      setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete));
      setInvoiceToDelete(null);
      setActiveDropdown(null);

    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus");
    }
  };

  /* ── SHARE VIA WHATSAPP ── */
  const handleShareWhatsApp = (item) => {
    const totalItem = (item.items || []).reduce(
      (acc, i) => acc + Number(i.qty || 0) * Number(i.price || 0), 0
    );
    const linkDownload = getDownloadLink(item);
    const tanggal  = formatDateBroadcast(item.date);
    const dueDate  = formatDueDateBroadcast(item.date);

    const msg = encodeURIComponent(
      `Kepada Yth. *${item.customer}*,\n\n` +
      `Bersama pesan ini kami sampaikan invoice terbaru dari *Flower Plus*.\n\n` +
      `*Detail Invoice:*\n` +
      `No. Invoice   : ${item.invoiceNumber}\n` +
      `Tanggal       : ${tanggal}\n` +
      `Total Tagihan : Rp ${totalItem.toLocaleString("id-ID")}\n` +
      `Jatuh Tempo   : ${dueDate}\n\n` +
      `*Tautan Unduh Invoice:*\n` +
      `${linkDownload}\n\n` +
      `*Informasi Pembayaran:*\n` +
      `Bank    : Bank Mandiri\n` +
      `No. Rek : 118 00 1022 970 5\n` +
      `A.n     : Dede Syarifah\n\n` +
      `Kami mohon pembayaran dapat dilakukan sebelum tanggal jatuh tempo yang tertera.\n` +
      `Apabila ada pertanyaan, jangan ragu untuk menghubungi kami.\n\n` +
      `Hormat kami,\n` +
      `*Flower Plus*\n` +
      `https://flowerplusofficial.com`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  /* ── SHARE VIA EMAIL ── */
  const handleShareEmail = (item) => {
    const totalItem = (item.items || []).reduce(
      (acc, i) => acc + Number(i.qty || 0) * Number(i.price || 0), 0
    );
    const linkDownload = getDownloadLink(item);
    const tanggal  = formatDateBroadcast(item.date);
    const dueDate  = formatDueDateBroadcast(item.date);

    const subject = encodeURIComponent(`Invoice ${item.invoiceNumber} - Flower Plus`);
    const body    = encodeURIComponent(
      `Kepada Yth. ${item.customer},\n\n` +
      `Bersama email ini kami sampaikan invoice terbaru dari Flower Plus.\n\n` +
      `Detail Invoice:\n` +
      `- No. Invoice   : ${item.invoiceNumber}\n` +
      `- Tanggal       : ${tanggal}\n` +
      `- Total Tagihan : Rp ${totalItem.toLocaleString("id-ID")}\n` +
      `- Jatuh Tempo   : ${dueDate}\n\n` +
      `Silakan unduh invoice Anda melalui tautan berikut:\n` +
      `${linkDownload}\n\n` +
      `Informasi Pembayaran:\n` +
      `- Bank    : Bank Mandiri\n` +
      `- No. Rek : 118 00 1022 970 5\n` +
      `- A.n     : Dede Syarifah\n\n` +
      `Kami mohon pembayaran dapat dilakukan sebelum tanggal jatuh tempo yang tertera.\n` +
      `Apabila ada pertanyaan, jangan ragu untuk menghubungi kami.\n\n` +
      `Hormat kami,\n` +
      `Flower Plus\n` +
      `www.flowerplus.id | +62 813 1683 5325`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  /* ── CALENDAR ── */
  const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth     = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  /* ── Paper badge ── */
  const PaperBadge = ({ size }) => {
    const isA5 = (size ?? "a4") === "a5";
    return (
      <span className={`paper-badge ${isA5 ? "paper-badge-a5" : "paper-badge-a4"}`}>
        {isA5
          ? <><Printer size={10} /> A5 · Cetak</>
          : <><Send size={10} /> A4 · PDF</>
        }
      </span>
    );
  };

  /* ── Badge label Indonesia ── */
  const getBadgeLabel = (status) => {
    if (status === "paid")   return "Lunas";
    if (status === "unpaid") return "Belum Lunas";
    if (status === "overdue") return "Jatuh Tempo";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /* ===============================
     UI
  ================================= */
  return (
    <div className="invoice-page">

      {/* HEADER */}
      <div className="invoice-header">
        <div className="header-text">
          <h1>Manajemen Invoice</h1>
          <p>Kelola semua invoice bisnis Anda</p>
        </div>
        <button className="create-btn-invoice" onClick={() => navigate("/invoice/create?type=normal")}>
          <Plus size={15} /> Buat Invoice
        </button>
      </div>

      {/* SUMMARY BAR */}
      <div className="inv-summary-bar">
        <div className="inv-summary-item">
          <span className="isb-dot isb-dot-all" />
          <span className="isb-label">Total</span>
          <span className="isb-count">{invoices.length}</span>
        </div>
        <div className="inv-summary-divider" />
        <div className="inv-summary-item isb-a5" onClick={() => setSelectedPaperSize(selectedPaperSize === "a5" ? "all" : "a5")}>
          <Printer size={13} />
          <span className="isb-label">A5 · Cetak</span>
          <span className="isb-count isb-count-a5">{countA5}</span>
        </div>
        <div className="inv-summary-divider" />
        <div className="inv-summary-item isb-a4" onClick={() => setSelectedPaperSize(selectedPaperSize === "a4" ? "all" : "a4")}>
          <Send size={13} />
          <span className="isb-label">A4 · PDF</span>
          <span className="isb-count isb-count-a4">{countA4}</span>
        </div>
      </div>

      {/* FILTER */}
      <div className="filter-card">
        <div className="filter-left">
          <Filter size={14} /><span>Filter</span>
        </div>
        <div className="filter-divider-v" />
        <div className="filter-controls">

          <PaperSizeToggle value={selectedPaperSize} onChange={setSelectedPaperSize} />

          <div className="filter-divider-v" style={{ height: "20px" }} />

          <div className="date-picker-wrapper" ref={dateWrapperRef}>
            <button
              type="button"
              className={`filter-date-btn ${selectedDate ? "active" : ""}`}
              onClick={() => setDateOpen(p => !p)}
            >
              <Calendar size={14} />
              {selectedDate ? formatDisplayDate(selectedDate) : "Jatuh Tempo"}
              {selectedDate && (
                <span className="clear-date" onClick={(e) => { e.stopPropagation(); setSelectedDate(""); }}>×</span>
              )}
            </button>

            {dateOpen && (
              <div className="calendar-dropdown">
                <div className="calendar-header">
                  <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>‹</button>
                  <span>{currentDate.toLocaleString("id-ID", { month: "long", year: "numeric" })}</span>
                  <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>›</button>
                </div>
                <div className="calendar-grid">
                  {HARI.map(d => (
                    <div key={d} className="calendar-day-label">{d}</div>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNumber = i + 1;
                    const year  = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
                    const dayStr  = String(dayNumber).padStart(2, "0");
                    const dateVal = `${year}-${month}-${dayStr}`;
                    return (
                      <button
                        key={dayNumber}
                        className={`calendar-day ${selectedDate === dateVal ? "selected-day" : ""}`}
                        onClick={() => { setSelectedDate(dateVal); setDateOpen(false); }}
                      >
                        {dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text" placeholder="Cari pelanggan / no. invoice..."
              className="search-input" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <BankDropdown
            value={selectedBank} customBank={customBank}
            onBankChange={setSelectedBank} onCustomBankChange={setCustomBank}
          />
          <CustomDropdown options={statuses} value={selectedStatus} onChange={setSelectedStatus} />

        </div>
      </div>

      {/* TABLE */}
      <div className="invoice-table-card">
        <div className="invoice-table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>No</th>
                <th>Invoice</th>
                <th>Tipe</th>
                <th>Pelanggan</th>
                <th>Bank</th>
                <th>Jumlah</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    <div className="empty-state">
                      <span className="empty-icon">📄</span>
                      <span>Tidak ada invoice ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                currentInvoices.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#94a3b8", fontSize: "12px" }}>
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="invoice-id">{item.invoiceNumber}</td>
                    <td><PaperBadge size={item.paper_size} /></td>
                    <td>
                      <strong>{item.customer}</strong>
                      <span>{item.email}</span>
                    </td>
                    <td className="bank-cell">{item.bank}</td>
                    <td className="amount-cell">Rp {Number(item.amount).toLocaleString("id-ID")}</td>
                    <td className="date-cell">{item.date}</td>
                    <td>
                      <span className={`badge ${item.status}`}>
                        {getBadgeLabel(item.status)}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className="action-btn" onClick={() => toggleDropdown(index)}>
                        <MoreVertical size={16} />
                      </button>

                      {activeDropdown === index && (
                        <div className="action-dropdown">

                          <button className="dropdown-item"
                            onClick={() => navigate(
                              `/invoice/preview/${item.id}?type=${item.type || "normal"}&paper_size=${item.paper_size ?? "a4"}`
                            )}>
                            <Eye size={14} /> Lihat Detail
                          </button>

                          <button className="dropdown-item"
                            onClick={() => navigate(`/invoice/edit/${item.id}?type=${item.type || "normal"}`)}>
                            <Pencil size={14} /> Ubah
                          </button>

                          {/* Share sub-dropdown */}
                          <div className="share-sub-wrap">
                            <button
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareDropdown(prev => prev === index ? null : index);
                              }}
                            >
                              <Share2 size={14} /> Bagikan
                              <ChevronDown
                                size={12}
                                style={{
                                  marginLeft: "auto",
                                  transform: shareDropdown === index ? "rotate(180deg)" : "none",
                                  transition: "transform 0.2s",
                                }}
                              />
                            </button>

                            {shareDropdown === index && (
                              <div className="share-sub-menu">
                                <button
                                  className="share-sub-item share-sub-wa"
                                  onClick={() => {
                                    handleShareWhatsApp(item);
                                    setActiveDropdown(null);
                                    setShareDropdown(null);
                                  }}
                                >
                                  <FaWhatsapp size={13} /> WhatsApp
                                </button>
                                <button
                                  className="share-sub-item share-sub-email"
                                  onClick={() => {
                                    handleShareEmail(item);
                                    setActiveDropdown(null);
                                    setShareDropdown(null);
                                  }}
                                >
                                  <Mail size={13} /> Email
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="dropdown-divider" />

                          <button className="dropdown-item delete"
                            onClick={() => { setInvoiceToDelete(item.id); setActiveDropdown(null); }}>
                            <Trash2 size={14} /> Hapus
                          </button>

                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination-management" ref={paginationRef}>
          <button className="page-arrow" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
              return (
                <button key={page} className={currentPage === page ? "active" : ""} onClick={() => handlePageChange(page)}>
                  {page}
                </button>
              );
            }
            if (Math.abs(page - currentPage) === 2) return <span key={page} className="page-ellipsis">…</span>;
            return null;
          })}
          <button className="page-arrow" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>›</button>
        </div>
      )}

      {/* DELETE MODAL */}
      {invoiceToDelete && (
        <div className="del-overlay" onClick={() => setInvoiceToDelete(null)}>
          <div className="del-modal" onClick={e => e.stopPropagation()}>
            <div className="del-icon-wrap">
              <div className="del-icon-ring" />
              <svg className="del-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <div className="del-copy">
              <h3 className="del-title">Hapus Invoice</h3>
              <p className="del-subtitle">
                Anda akan menghapus invoice&nbsp;
                <span className="del-id">{invoiceToDelete}</span>.
                <br />Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="del-divider" />
            <div className="del-actions">
              <button className="del-btn-cancel" onClick={() => setInvoiceToDelete(null)}>Batal</button>
              <button className="del-btn-confirm" onClick={handleDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceManagement;