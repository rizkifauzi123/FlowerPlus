import { useState, useEffect, useRef } from "react";
import { Upload, X, Plus, FileText, ChevronDown, Check } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import InvoicePreview from "./InvoicePreview";
import { useApp } from "../../../context/AppContext";
import { BANK_INFO } from "../constants/bankInfo";
import "../../Style/Invoice/CreateInvoice.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const bankOptions = [
  "Mandiri", "BRI", "BCA", "BNI", "BSI", "BTN",
  "Bank Maluku Malut","DJPB", "Tunai",
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

  const [form, setForm]             = useState({ date: "", kepada: "", branch: "", bank: "" });
  const [customBank, setCustomBank] = useState("");
  const [items, setItems]           = useState([{ desc: "", qty: "", price: "", preview: null }]);
  const [shippingCost, setShippingCost] = useState("");
  const [previewData, setPreviewData]   = useState(null);
  const [fetchedKey, setFetchedKey] = useState(null);

  const [previewNumber,    setPreviewNumber]     = useState("");
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
        desc:    item.desc  ?? "",
        qty:     String(Number(item.qty)   || ""),
        price:   String(Math.round(Number(item.price)) || ""),
        preview: item.image ?? null,
        image:   item.image ?? null,
      })));

      const rawShipping = existingInvoice.shippingCost;
      const shippingNum = rawShipping ? Math.round(Number(rawShipping)) : 0;
      setShippingCost(shippingNum > 0 ? String(shippingNum) : "");
    }
  }, [id]);

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    const base64Preview = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    setItems(prev => {
      const updated = [...prev];
      updated[index].preview   = base64Preview;
      updated[index].uploading = true;
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res  = await fetch(`${API_URL}/api/upload-image`, { method: "POST", body: formData });
      const text = await res.text();
      if (!res.ok) throw new Error(`Upload gagal: ${res.status}`);
      const data = JSON.parse(text);

      setItems(prev => {
        const updated = [...prev];
        updated[index].preview   = base64Preview;
        updated[index].image     = data.url;
        updated[index].uploading = false;
        return updated;
      });
      // Reset fetchedPaperSize agar preview number dihitung ulang (a5→a4 karena ada gambar baru)
      setFetchedKey(null);

    } catch (err) {
      console.error("Upload error:", err);
      setItems(prev => {
        const updated = [...prev];
        updated[index].uploading = false;
        return updated;
      });
      alert(`Upload gagal: ${err.message}`);
    }
  };

  // Di handleChange, tambah reset saat date berubah
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
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

  // ─── Derived paper size & SC flag ─────────────────────────────────────────
  // hasAnyImage: item punya URL gambar valid (bukan base64) → ini yang dipakai backend
  // SESUDAH — lebih eksplisit, harus URL http
const hasAnyImage = items.some(
  item => item.image && 
          !item.image.startsWith("data:") && 
          item.image.startsWith("http")
);
  const derivedPaperSize = (items.length <= 1 && !hasAnyImage) ? "a5" : "a4";

  // Deteksi apakah format SC berubah dibanding invoice asli
  const originalHasSC   = isEditMode ? str_contains_sc(existingInvoice?.invoiceNumber ?? "") : false;
  const newHasSC        = derivedPaperSize === "a4" && hasAnyImage;
  const scChanged       = isEditMode && (originalHasSC !== newHasSC);
  const paperSizeChanged = isEditMode && existingInvoice?.paper_size !== derivedPaperSize;

  // Tampilkan warning jika nomor inv akan berubah
  const invoiceWillChange = paperSizeChanged || scChanged;

// GANTI useEffect preview number
useEffect(() => {
  if (!form.date) return;
  const key = `${derivedPaperSize}_${form.date}`;
  if (fetchedKey === key) return; // sudah fetch kombinasi ini

  fetch(`${API_URL}/api/invoices/preview-number?paper_size=${derivedPaperSize}&date=${form.date}`)
    .then((res) => res.json())
    .then((d) => {
      setPreviewNumber(d.invoiceNumber || "");
      setFetchedKey(key);
    })
    .catch(() => {});
}, [derivedPaperSize, form.date]);

  const handleSubmit = () => {
    if (!form.bank)   { alert("Silakan pilih bank"); return; }
    if (!form.kepada) { alert("Nama customer belum diisi"); return; }
    if (!form.date)   { alert("Tanggal invoice belum diisi"); return; }

    const bankValue = form.bank === "Other" ? customBank : form.bank;

    // Hitung preview number: hapus /SC/ dari nomor asli jika sekarang tidak ada gambar
    const previewInvoiceNumber = (() => {
      if (!isEditMode || !existingInvoice) return previewNumber;

      const originalNumber = existingInvoice.invoiceNumber; // e.g. "112/04/SC/FP/2026"
      const parts = originalNumber.split('/');
      const seq   = parts[0]; // "112"
      const month = parts[1]; // "04"
      const year  = parts[parts.length - 1]; // "2026"

      if (hasAnyImage) {
        // Tambah SC
        return `${seq}/${month}/SC/FP/${year}`;
      } else {
        // Hapus SC
        return `${seq}/${month}/FP/${year}`;
      }
    })();

    const invoiceData = {
      ...(isEditMode && existingInvoice ? { 
        id: existingInvoice.id,
        invoiceNumber: previewInvoiceNumber, // ← nomor yang ditampilkan di preview
      } : {}),
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

        {/* WARNING: nomor invoice akan berubah */}
        {isEditMode && invoiceWillChange && (
          <div style={{
            margin: "0 24px",
            padding: "10px 14px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#9a3412",
            lineHeight: "1.5",
          }}>
            ⚠️ Nomor invoice akan diperbarui karena format berubah
            {paperSizeChanged && ` (${existingInvoice?.paper_size?.toUpperCase()} → ${derivedPaperSize.toUpperCase()})`}
            {scChanged && !paperSizeChanged && ` (${originalHasSC ? "dengan SC → tanpa SC" : "tanpa SC → dengan SC"})`}
          </div>
        )}

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
              <label>Bank Transfer</label>
              <BankDropdown value={form.bank} onChange={(val) => {
                handleChange("bank", val);
                if (val !== "Other") setCustomBank("");
              }} />
              {/* {form.bank === "Other" && (
                <input type="text" placeholder="Masukkan nama bank / norek" className="ci-input"
                  style={{ marginTop: "8px" }}
                  value={customBank} onChange={(e) => setCustomBank(e.target.value)} />
              )} */}
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
              <textarea
                placeholder="Deskripsi item..."
                className="ci-input ci-desc-textarea"
                value={item.desc}
                onChange={(e) => handleItemChange(index, "desc", e.target.value)}
                rows={2}
              />
              <input type="number" placeholder="Qty" className="ci-input ci-qty-input"
                value={item.qty ?? ""}
                onChange={(e) => handleItemChange(index, "qty", e.target.value === "" ? "" : e.target.value)} />
              <input type="text" placeholder="Harga (Rp)" className="ci-input ci-price-input"
                value={item.price ? formatRupiah(String(item.price)) : ""}
                onChange={(e) => handleItemChange(index, "price", parseRupiah(e.target.value))} />
              <div className="ci-upload-wrapper">
                <label className="ci-upload-btn">
                  <Upload size={14} /> Upload
                  <input type="file" hidden accept="image/*"
                    onChange={(e) => handleImageUpload(index, e.target.files[0])} />
                </label>
                {item.preview && (
                  <div className="ci-image-preview" style={{ position: "relative" }}>
                    <img src={item.preview} alt="preview"
                      style={{ opacity: item.uploading ? 0.4 : 1, transition: "opacity 0.2s" }} />
                    {item.uploading && (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: "600", color: "#2c4775",
                      }}>
                        Uploading...
                      </div>
                    )}
                    {!item.uploading && (
                      <button
                        type="button"
                        className="ci-image-delete"
                        onClick={() => {
                          const updated = [...items];
                          updated[index].preview = null;
                          updated[index].image   = null;
                          setItems(updated);
                          setFetchedKey(null); // reset agar preview number dihitung ulang
                        }}
                        title="Hapus gambar"
                      >
                        <X size={10} />
                      </button>
                    )}
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

// Helper: cek apakah invoiceNumber mengandung /SC/
function str_contains_sc(invoiceNumber) {
  return typeof invoiceNumber === "string" && invoiceNumber.includes("/SC/");
}

export default CreateInvoiceForm;