import { useState, useEffect, useRef } from "react";
import { Upload, X, Plus, FileText, ChevronDown, Check } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import InvoicePreview from "./InvoicePreview";
import { useApp } from "../../../context/AppContext";
import "../../Style/Invoice/CreateInvoice.css";

/* ============================
   BANK DROPDOWN COMPONENT
============================ */

const bankOptions = ["BTN", "Mandiri", "BNI", "BCA", "BSI", "Other"];

const BankDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="ci-bank-wrapper" ref={ref}>
      <button
        type="button"
        className={`ci-bank-trigger ${open ? "open" : ""} ${value ? "has-value" : ""}`}
        onClick={() => setOpen((p) => !p)}
      >
        <span>{value || "Pilih Bank"}</span>
        <ChevronDown size={14} className={`ci-bank-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="ci-bank-menu">
          {bankOptions.map((bank) => (
            <button
              key={bank}
              type="button"
              className={`ci-bank-option ${value === bank ? "selected" : ""}`}
              onClick={() => { onChange(bank); setOpen(false); }}
            >
              <span>{bank}</span>
              {value === bank && <Check size={13} className="ci-bank-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================
   MAIN FORM
============================ */

const CreateInvoiceForm = () => {
  const { invoices, setInvoices } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const existingInvoice = invoices.find((inv) => inv.id === id);
  const [searchParams] = useSearchParams();
  const invoiceType = searchParams.get("type") || "normal";

  const [form, setForm] = useState({
    date: "",
    kepada: "",
    branch: "",
    bank: "",
  });
  const [customBank, setCustomBank] = useState("");
  const [items, setItems] = useState([{ desc: "", qty: "", price: "", preview: null }]);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (isEditMode && existingInvoice) {
      setForm({
        date: existingInvoice.date,
        kepada: existingInvoice.kepada,
        branch: existingInvoice.branch,
        bank: existingInvoice.bank || "",
      });
      setItems(existingInvoice.items);
    }
  }, [id]);

  const handleImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...items];
      updated[index].preview = reader.result;
      setItems(updated);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { desc: "", qty: "", price: "" }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const getRomanMonth = (monthNumber) => {
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return romans[monthNumber - 1];
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const romanMonth = getRomanMonth(month);
    const unique = Date.now().toString().slice(-4);

    const simpleNumber = `FP/${romanMonth}/${year}/${unique}`;

    const bankValue = form.bank === "Other" ? customBank : form.bank;
    const bankName = bankValue
      ? bankValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      : "CUSTOMER";

    const customerName = form.kepada
      ? form.kepada.replace(/[^a-zA-Z0-9 ]/g, "").trim().split(" ").slice(0, 2).join("").toUpperCase()
      : "CLIENT";

    const detailedCode = `FP/${bankName}-${customerName}/${romanMonth}/${year}/${unique}`;

    return { simpleNumber, detailedCode };
  };

  const handleSubmit = () => {
    const uniqueId = isEditMode ? id : Date.now().toString();

    let simpleNumber;
    let detailedCode;

    if (isEditMode && existingInvoice) {
      simpleNumber = existingInvoice.invoiceNumber;
      detailedCode = existingInvoice.invoiceCode;
    } else {
      const generated = generateInvoiceNumber();
      simpleNumber = generated.simpleNumber;
      detailedCode = generated.detailedCode;
    }

    const totalAmount = items.reduce(
      (total, item) => total + Number(item.qty || 0) * Number(item.price || 0),
      0
    );

    const invoiceData = {
      id: uniqueId,
      invoiceNumber: simpleNumber,
      invoiceCode: detailedCode,
      customer: form.kepada,
      bank: form.bank === "Other" ? customBank : form.bank,
      amount: `Rp ${totalAmount.toLocaleString("id-ID")}`,
      due: form.date,
      date: form.date,
      kepada: form.kepada,
      branch: form.branch,
      items,
      type: invoiceType,
      status: "unpaid",
    };

    setPreviewData(invoiceData);
  };

  const totalAmount = items.reduce(
    (total, item) => total + Number(item.qty || 0) * Number(item.price || 0),
    0
  );

  /* ── Jika preview aktif, tampilkan InvoicePreview (merged) ── */
  if (previewData) {
    return (
      <InvoicePreview
        data={previewData}
        onBack={() => setPreviewData(null)}
      />
    );
  }

  /* ============================
     FORM UI
  ============================ */

  return (
    <div className="ci-overlay">
      <div className="ci-card">

        {/* HEADER */}
        <div className="ci-header">
          <div className="ci-header-icon">
            <FileText size={18} />
          </div>
          <div className="ci-header-title">
            <h2>{isEditMode ? "Edit Invoice" : "Create Invoice"}</h2>
            <p>Fill in the details below</p>
          </div>
        </div>

        {/* BODY */}
        <div className="ci-body">

          <p className="ci-section-label">Invoice Details</p>

          <div className="ci-meta-grid">
            <div className="ci-field">
              <label>Date</label>
              <input
                type="date"
                className="ci-input"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>

            <div className="ci-field">
              <label>Kepada Yth</label>
              <input
                type="text"
                placeholder="Nama penerima"
                className="ci-input"
                value={form.kepada}
                onChange={(e) => handleChange("kepada", e.target.value)}
              />
            </div>

            <div className="ci-field">
              <label>Branch</label>
              <input
                type="text"
                placeholder="Cabang"
                className="ci-input"
                value={form.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
              />
            </div>

            <div className="ci-field">
              <label>Bank Customer</label>
              <BankDropdown
                value={form.bank}
                onChange={(val) => {
                  handleChange("bank", val);
                  if (val !== "Other") setCustomBank("");
                }}
              />
              {form.bank === "Other" && (
                <input
                  type="text"
                  placeholder="Masukkan nama bank"
                  className="ci-input"
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                />
              )}
            </div>
          </div>

          <hr className="ci-divider" />

          <p className="ci-section-label">Item List</p>

          <div className="ci-items-header">
            <span>Deskripsi</span>
            <span>Qty</span>
            <span>Harga</span>
            <span>Lampiran</span>
            <span></span>
          </div>

          {items.map((item, index) => (
            <div key={index} className="ci-item-row">
              <input
                type="text"
                placeholder="Deskripsi item"
                className="ci-input"
                value={item.desc}
                onChange={(e) => handleItemChange(index, "desc", e.target.value)}
              />
              <input
                type="number"
                placeholder="0"
                className="ci-input"
                value={item.qty ?? ""}
                onChange={(e) => handleItemChange(index, "qty", e.target.value === "" ? "" : e.target.value)}
              />
              <input
                type="number"
                placeholder="0"
                className="ci-input"
                value={item.price ?? ""}
                onChange={(e) => handleItemChange(index, "price", e.target.value === "" ? "" : e.target.value)}
              />
              <div className="ci-upload-wrapper">
                <label className="ci-upload-btn">
                  <Upload size={14} />
                  Upload
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e.target.files[0])}
                  />
                </label>
                {item.preview && (
                  <div className="ci-image-preview">
                    <img src={item.preview} alt="preview" />
                  </div>
                )}
              </div>
              <button className="ci-remove-btn" onClick={() => removeItem(index)}>
                <X size={14} />
              </button>
            </div>
          ))}

          <button className="ci-add-item" onClick={addItem}>
            <Plus size={14} />
            Add Item
          </button>

          <div className="ci-total-box">
            <span className="label">Total Amount</span>
            <span className="amount">Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>

        </div>

        {/* FOOTER */}
        <div className="ci-footer">
          <button className="ci-btn-cancel" onClick={() => navigate("/invoice")}>
            Cancel
          </button>
          <button className="ci-btn-create" onClick={handleSubmit}>
            <FileText size={15} />
            {isEditMode ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateInvoiceForm;