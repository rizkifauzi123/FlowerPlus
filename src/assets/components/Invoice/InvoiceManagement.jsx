import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  Search,
  Building2
} from "lucide-react";
import "../../Style/Invoice/InvoiceManagement.css";
import { useApp } from "../../../context/AppContext";

/* ===============================
   CONSTANT DATA
================================= */

const banks = [
  "All Banks", "BCA", "Mandiri", "BRI", "BNI",
  "CIMB Niaga", "Permata", "Danamon", "BTN", "OCBC", "Other"
];

const statuses = ["All Status", "Paid", "Unpaid"];

/* ===============================
   BANK DROPDOWN
================================= */

const BankDropdown = ({ value, customBank, onBankChange, onCustomBankChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && value === "Other" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, value]);

  const handleSelect = (option) => {
    onBankChange(option);
    if (option !== "Other") {
      onCustomBankChange("");
      setOpen(false);
    }
  };

  const displayLabel = value === "Other" && customBank ? `Other: ${customBank}` : value;

  return (
    <div className="custom-dropdown bank-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Building2 size={13} className="trigger-icon" />
        <span className="trigger-label">{displayLabel}</span>
        <ChevronDown size={13} className={`dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu bank-menu">
          {banks.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`custom-dropdown-option ${value === option ? "selected" : ""}`}
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>
              {value === option && <Check size={13} className="option-check" />}
            </button>
          ))}

          {value === "Other" && (
            <div className="other-bank-input-wrap">
              <div className="other-input-divider" />
              <div className="other-input-label">
                <Building2 size={12} />
                Enter bank name
              </div>
              <input
                ref={inputRef}
                type="text"
                className="other-bank-input"
                placeholder="e.g. Maybank, HSBC..."
                value={customBank}
                onChange={(e) => onCustomBankChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === "Enter") setOpen(false); }}
              />
              {customBank && (
                <button type="button" className="other-apply-btn" onClick={() => setOpen(false)}>
                  <Check size={12} /> Apply
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value}</span>
        <ChevronDown size={13} className={`dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
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
   MAIN COMPONENT
================================= */

const InvoiceManagement = () => {
  const { invoices, setInvoices } = useApp();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const paginationRef = useRef(null);

  const [customBank, setCustomBank] = useState("");
  const [selectedBank, setSelectedBank] = useState("All Banks");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [showInvoiceTypeModal, setShowInvoiceTypeModal] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const dateWrapperRef = useRef(null);

  /* ── Close date picker on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateWrapperRef.current && !dateWrapperRef.current.contains(e.target)) {
        setDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Close action dropdown on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-cell")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (index) => {
    setActiveDropdown((prev) => (prev === index ? null : index));
  };

  /* ── FILTER ── */
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedBank !== "All Banks") {
      if (selectedBank === "Other") {
        if (customBank && !inv.bank.toLowerCase().includes(customBank.toLowerCase())) return false;
      } else {
        if (inv.bank !== selectedBank) return false;
      }
    }
    if (selectedStatus !== "All Status" && inv.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (selectedDate && inv.due !== selectedDate) return false;
    if (searchTerm && !inv.customer.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  /* ── PAGINATION ── */
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setTimeout(() => {
      paginationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  /* ── DELETE ── */
  const handleDelete = () => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete));
    setInvoiceToDelete(null);
    setActiveDropdown(null); // tutup dropdown setelah delete
  };

  /* ── CALENDAR ── */
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  /* ===============================
     UI
  ================================= */

  return (
    <div className="invoice-page">

      {/* HEADER */}
      <div className="invoice-header">
        <div className="header-text">
          <h1>Invoice Management</h1>
          <p>Kelola semua invoice bisnis Anda</p>
        </div>
        <button className="create-btn-invoice" onClick={() => setShowInvoiceTypeModal(true)}>
          <Plus size={15} />
          Create Invoice
        </button>
      </div>

      {/* FILTER */}
      <div className="filter-card">
        <div className="filter-left">
          <Filter size={14} />
          <span>Filter</span>
        </div>

        <div className="filter-divider-v" />

        <div className="filter-controls">

          {/* DATE PICKER */}
          <div className="date-picker-wrapper" ref={dateWrapperRef}>
            <button
              type="button"
              className={`filter-date-btn ${selectedDate ? "active" : ""}`}
              onClick={() => setDateOpen((prev) => !prev)}
            >
              <Calendar size={14} />
              {selectedDate ? formatDisplayDate(selectedDate) : "Due Date"}
              {selectedDate && (
                <span className="clear-date" onClick={(e) => { e.stopPropagation(); setSelectedDate(""); }}>×</span>
              )}
            </button>

            {dateOpen && (
              <div className="calendar-dropdown">
                <div className="calendar-header">
                  <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>‹</button>
                  <span>{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                  <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>›</button>
                </div>
                <div className="calendar-grid">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="calendar-day-label">{d}</div>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNumber = i + 1;
                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
                    const dayStr = String(dayNumber).padStart(2, "0");
                    const dateVal = `${year}-${month}-${dayStr}`;
                    const isSelected = selectedDate === dateVal;
                    return (
                      <button
                        key={dayNumber}
                        className={`calendar-day ${isSelected ? "selected-day" : ""}`}
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

          {/* SEARCH */}
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search customer..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* BANK DROPDOWN */}
          <BankDropdown
            value={selectedBank}
            customBank={customBank}
            onBankChange={setSelectedBank}
            onCustomBankChange={setCustomBank}
          />

          {/* STATUS DROPDOWN */}
          <CustomDropdown
            options={statuses}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />

        </div>
      </div>

      {/* TABLE */}
      <div className="invoice-table-card">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Bank</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  <div className="empty-state">
                    <span className="empty-icon">📄</span>
                    <span>No invoices found</span>
                  </div>
                </td>
              </tr>
            ) : (
              currentInvoices.map((item, index) => (
                <tr key={index}>
                  <td className="invoice-id">{item.invoiceNumber}</td>
                  <td>
                    <strong>{item.customer}</strong>
                    <span>{item.email}</span>
                  </td>
                  <td className="bank-cell">{item.bank}</td>
                  <td className="amount-cell">{item.amount}</td>
                  <td className="date-cell">{item.due}</td>
                  <td>
                    <span className={`badge ${item.status}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button className="action-btn" onClick={() => toggleDropdown(index)}>
                      <MoreVertical size={16} />
                    </button>
                    {activeDropdown === index && (
                      <div className="action-dropdown">
                        <button
                          className="dropdown-item"
                          onClick={() => navigate(`/invoice/preview/${item.id}?type=${item.type || "normal"}`)}
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={() => navigate(`/invoice/edit/${item.id}?type=${item.type || "normal"}`)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-item delete"
                          onClick={() => {
                            setInvoiceToDelete(item.id);
                            setActiveDropdown(null); // tutup dropdown saat buka modal delete
                          }}
                        >
                          <Trash2 size={14} /> Delete
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
            if (Math.abs(page - currentPage) === 2) {
              return <span key={page} className="page-ellipsis">…</span>;
            }
            return null;
          })}
          <button className="page-arrow" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>›</button>
        </div>
      )}

      {/* DELETE MODAL */}
      {invoiceToDelete && (
        <div className="del-overlay" onClick={() => setInvoiceToDelete(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
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

      {/* INVOICE TYPE MODAL */}
      {showInvoiceTypeModal && (
        <div className="invoice-type-overlay" onClick={() => setShowInvoiceTypeModal(false)}>
          <div className="invoice-type-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cetak Invoice</h3>
            <p>Apakah invoice akan dicetak dengan <br /> tanda tangan dan stempel?</p>
            <div className="invoice-type-buttons">
              <button
                className="invoice-type-yes"
                onClick={() => { setShowInvoiceTypeModal(false); navigate("/invoice/create?type=signed"); }}
              >
                Ya
              </button>
              <button
                className="invoice-type-no"
                onClick={() => { setShowInvoiceTypeModal(false); navigate("/invoice/create?type=normal"); }}
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceManagement;