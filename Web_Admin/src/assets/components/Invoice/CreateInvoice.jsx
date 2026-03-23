import { useState, useEffect, useRef } from "react";
import { Upload, X, Plus, FileText, ChevronDown, Check } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import InvoicePreview from "./InvoicePreview";
import { useApp } from "../../../context/AppContext";
import { BANK_INFO } from "../constants/bankInfo";
import "../../Style/Invoice/CreateInvoice.css";

// Urutan tampil di dropdown
const bankOptions = [
  "Mandiri",
  "BRI",
  "BCA",
  "BNI",
  "BSI",
  "BTN",
  "Bank Maluku Malut",
  "Tunai",
  "Other",
];

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
          {bankOptions.map((key) => (
            <button
              key={key}
              type="button"
              className={`ci-bank-option ${value === key ? "selected" : ""}`}
              onClick={() => { onChange(key); setOpen(false); }}
            >
              <span>{key}</span>
              {value === key && <Check size={13} className="ci-bank-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const formatRupiah = (value) => {
  const number = value.replace(/\D/g, "");
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRupiah = (value) => value.replace(/\./g, "");

const CreateInvoiceForm = () => {
  const { invoices } = useApp();
  const navigate     = useNavigate();
  const { id }       = useParams();
  const isEditMode   = Boolean(id);
  const existingInvoice = invoices.find((inv) => String(inv.id) === String(id));
  const [searchParams]  = useSearchParams();

  const [form, setForm] = useState({ date: "", kepada: "", branch: "", bank: "" });
  const [customBank, setCustomBank]     = useState("");
  const [items, setItems]               = useState([{ desc: "", qty: "", price: "", preview: null }]);
  const [shippingCost, setShippingCost] = useState("");
  const [previewData, setPreviewData]   = useState(null);

  useEffect(() => {
    if (isEditMode && existingInvoice) {
      setForm({
        date:   existingInvoice.date   ?? "",
        kepada: existingInvoice.kepada ?? "",
        branch: existingInvoice.branch ?? "",
        bank:   existingInvoice.bank   ?? "",
      });
      setItems(existingInvoice.items.map(item => ({
        ...item,
        desc:    item.desc    ?? "",
        qty:     item.qty     ?? "",
        price:   item.price   ?? "",
        preview: item.image   ?? null,
      })));
      setShippingCost(existingInvoice.shippingCost ? String(existingInvoice.shippingCost) : "");
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

  const handleChange     = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };
  const addItem    = () => setItems([...items, { desc: "", qty: "", price: "" }]);
  const removeItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const subtotalAmount = items.reduce((t, item) => t + Number(item.qty || 0) * Number(item.price || 0), 0);
  const shippingNum    = Number(parseRupiah(shippingCost || "0")) || 0;
  const totalAmount    = subtotalAmount + shippingNum;

  // ── Tentukan paper_size ──
  // A5 hanya jika: 1 item DAN tidak ada gambar sama sekali
  // Sinkron dengan logika backend (InvoiceController)
  const hasAnyImage    = items.some(item => item.preview || item.image);
  const derivedPaperSize = isEditMode && existingInvoice?.paper_size
    ? existingInvoice.paper_size
    : (items.length <= 1 && !hasAnyImage) ? "a5" : "a4";

  const handleSubmit = () => {
    if (!form.bank)   { alert("Silakan pilih bank"); return; }
    if (!form.kepada) { alert("Nama customer belum diisi"); return; }
    if (!form.date)   { alert("Tanggal invoice belum diisi"); return; }

    const bankValue = form.bank === "Other" ? customBank : form.bank;

    const invoiceData = {
      ...(isEditMode && existingInvoice ? { id: existingInvoice.id } : {}),
      ...(isEditMode && existingInvoice
        ? { invoiceNumber: existingInvoice.invoiceNumber, invoiceCode: existingInvoice.invoiceCode }
        : {}),
      customer:     form.kepada,
      kepada:       form.kepada,
      branch:       form.branch,
      bank:         bankValue,
      amount:       totalAmount,
      date:         form.date,
      status:       existingInvoice?.status || "unpaid",
      type:         existingInvoice?.type   || "normal",
      shippingCost: shippingNum,
      paper_size:   derivedPaperSize,
      items,
    };

    setPreviewData(invoiceData);
  };

  if (previewData) {
    return <InvoicePreview data={previewData} onBack={() => setPreviewData(null)} />;
  }

  const sizeLabel = derivedPaperSize === "a5" ? "A5 · Cetak" : "A4 · Kirim";
  const sizeColor = derivedPaperSize === "a5" ? "#92400e" : "#1e40af";
  const sizeBg    = derivedPaperSize === "a5" ? "#fef3c7" : "#dbeafe";

  return (
    <div className="ci-overlay">
      <div className="ci-card">

        {/* HEADER */}
        <div className="ci-header">
          <div className="ci-header-icon"><FileText size={18} /></div>
          <div className="ci-header-title">
            <h2>{isEditMode ? "Edit Invoice" : "Create Invoice"}</h2>
            <p>Fill in the details below</p>
          </div>
          <span style={{
            marginLeft: "auto",
            fontSize: "11.5px", fontWeight: "700",
            padding: "4px 11px", borderRadius: "7px",
            background: sizeBg, color: sizeColor,
            border: `1px solid ${derivedPaperSize === "a5" ? "#fde68a" : "#bfdbfe"}`,
            whiteSpace: "nowrap", alignSelf: "center",
            transition: "all 0.2s ease",
          }}>
            {sizeLabel}
          </span>
        </div>

        {/* BODY */}
        <div className="ci-body">
          <p className="ci-section-label">Invoice Details</p>

          <div className="ci-meta-grid">
            <div className="ci-field">
              <label>Date</label>
              <input type="date" className="ci-input" value={form.date}
                onChange={(e) => handleChange("date", e.target.value)} />
            </div>
            <div className="ci-field">
              <label>Kepada Yth</label>
              <input type="text" placeholder="Nama penerima" className="ci-input" value={form.kepada}
                onChange={(e) => handleChange("kepada", e.target.value)} />
            </div>
            <div className="ci-field">
              <label>Branch</label>
              <input type="text" placeholder="Cabang" className="ci-input" value={form.branch}
                onChange={(e) => handleChange("branch", e.target.value)} />
            </div>
            <div className="ci-field">
              <label>Bank Customer</label>
              <BankDropdown value={form.bank} onChange={(val) => {
                handleChange("bank", val);
                if (val !== "Other") setCustomBank("");
              }} />
              {form.bank === "Other" && (
                <input type="text" placeholder="Masukkan nama bank / norek" className="ci-input"
                  style={{ marginTop: "8px" }}
                  value={customBank} onChange={(e) => setCustomBank(e.target.value)} />
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
              <input type="text" placeholder="Deskripsi item" className="ci-input"
                value={item.desc} onChange={(e) => handleItemChange(index, "desc", e.target.value)} />
              <input type="number" placeholder="0" className="ci-input"
                value={item.qty ?? ""}
                onChange={(e) => handleItemChange(index, "qty", e.target.value === "" ? "" : e.target.value)} />
              <input type="text" placeholder="0" className="ci-input"
                value={item.price ? formatRupiah(String(item.price)) : ""}
                onChange={(e) => handleItemChange(index, "price", parseRupiah(e.target.value))} />
              <div className="ci-upload-wrapper">
                <label className="ci-upload-btn">
                  <Upload size={14} /> Upload
                  <input type="file" hidden accept="image/*"
                    onChange={(e) => handleImageUpload(index, e.target.files[0])} />
                </label>
                {item.preview && (
                  <div className="ci-image-preview">
                    <img src={item.preview} alt="preview" />
                  </div>
                )}
              </div>
              <button className="ci-remove-btn" onClick={() => removeItem(index)}><X size={14} /></button>
            </div>
          ))}

          <button className="ci-add-item" onClick={addItem}>
            <Plus size={14} /> Add Item
          </button>

          {/* ONGKOS KIRIM */}
          <div className="ci-shipping-row">
            <div className="ci-shipping-left">
              <span className="ci-shipping-label">Ongkos Kirim</span>
              <span className="ci-shipping-hint">opsional</span>
            </div>
            <div className="ci-shipping-input-wrap">
              <span className="ci-shipping-prefix">Rp</span>
              <input
                type="text"
                className="ci-input ci-shipping-input"
                placeholder="0"
                value={shippingCost ? formatRupiah(shippingCost) : ""}
                onChange={(e) => setShippingCost(parseRupiah(e.target.value))}
              />
            </div>
          </div>

          {/* TOTAL BOX */}
          <div className="ci-total-box">
            <div className="ci-total-breakdown">
              <div className="ci-total-line">
                <span className="ci-sub-label">Subtotal</span>
                <span className="ci-sub-value">Rp {subtotalAmount.toLocaleString("id-ID")}</span>
              </div>
              {shippingNum > 0 && (
                <div className="ci-total-line">
                  <span className="ci-sub-label">Ongkos Kirim</span>
                  <span className="ci-sub-value">Rp {shippingNum.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
            <div className="ci-total-right">
              <span className="label">Total Amount</span>
              <span className="amount">Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="ci-footer">
          <button className="ci-btn-cancel" onClick={() => navigate("/invoice")}>Cancel</button>
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