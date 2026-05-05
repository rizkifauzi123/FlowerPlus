import { useRef, useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getBankInfo } from "../constants/bankInfo";
import "../../Style/Invoice/InvoicePreview.css";
import logo from "../../images/LogoInvoice.png";
import ttdStamp from "../../images/TTD1.png";
import stamp from "../../images/stempel.png";
import qris from "../../images/QRIS.png";
import { useApp } from "../../../context/AppContext";
import jsPDF from "jspdf";
import { ArrowLeft, Save, Download, Eye, Printer, Search } from "lucide-react";
import html2canvas from "html2canvas";
import { FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAIR_PAGE_SIZE        = 10;
const MAX_ITEMS_PER_A4_PAGE = 10;
const API_URL               = import.meta.env.VITE_API_URL || "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateDisplay = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const sanitizeFileName = (text) =>
  String(text || "").replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, "_");

const getBulanID = (dateStr) => {
  const bulan = ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGT","SEP","OKT","NOV","DES"];
  return bulan[new Date(dateStr).getMonth()];
};

const calcSubtotal = (items) =>
  items.reduce((acc, item) => acc + Number(item.qty || 0) * Number(item.price || 0), 0);


const getItemImages = (item) => {
  const src = item.image
    ? (String(item.image).startsWith("http") ? toProxyUrl(item.image) : item.preview)
    : (item.preview && String(item.preview).startsWith("data:") ? item.preview : null);
  if (!src) return [];
  return Array.isArray(src) ? src : [src];
};

// ─── Canvas / Print Helpers ───────────────────────────────────────────────────
const toProxyUrl = (url) => {
  if (!url) return url;
  // Hanya strip di local/dev saja
  if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
    return url.replace("https://api.flowerplusofficial.com", "");
  }
  return url;
};
const captureElement = async (el, { scale = 2 } = {}) => {
  const prevTransform  = el.style.transform;
  const prevMargin     = el.style.marginBottom;
  el.style.transform    = "";
  el.style.marginBottom = "";

  const canvas = await html2canvas(el, {
    scale,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: "#ffffff",
    logging:         false,
    width:           el.scrollWidth,
    height:          el.scrollHeight,
  });

  el.style.transform    = prevTransform;
  el.style.marginBottom = prevMargin;
  return canvas;
};

const BORDER_NORMAL = "0.3px solid #000000";
const BORDER_HEADER = "0.3px solid #000000";
const BORDER_NONE   = "none";
const BORDER_GRAND  = "0.3px solid #000000";

const fixTableBorders = (el) => {
  el.querySelectorAll("table.inv-table").forEach((tbl) => {
    tbl.dataset.origCollapse      = tbl.style.borderCollapse;
    tbl.dataset.origBorderSpacing = tbl.style.borderSpacing;
    tbl.style.borderCollapse      = "separate";
    tbl.style.borderSpacing       = "0";
  });

  el.querySelectorAll("td, th").forEach((cell) => {
    cell.dataset.origBorder = cell.style.cssText;

    const isFirst    = cell.cellIndex === 0;
    const isHeader   = cell.tagName === "TH";
    const isGrandRow = cell.closest(".grand-total-row") !== null;
    const isEmpty    = cell.classList.contains("inv-td-empty");
    const isImgRowTd = cell.classList.contains("inv-images-row-td");
const isTotalLbl  = cell.classList.contains("total-label");
    const isGrandVal  = cell.classList.contains("grand-value");
    const isTotalVal  = cell.classList.contains("total-value");
    const isEmptyNo    = cell.classList.contains("inv-td-empty-no");
    const isEmptyPlain = cell.classList.contains("inv-td-empty-plain");

    cell.style.borderTop    = BORDER_NONE;
    cell.style.borderRight  = BORDER_NONE;
    cell.style.borderBottom = BORDER_NONE;
    cell.style.borderLeft   = BORDER_NONE;

    if (isEmpty)      return;
    if (isEmptyPlain) return;

    if (isEmptyNo) {
      cell.style.borderLeft  = BORDER_NORMAL;
      cell.style.borderRight = BORDER_NORMAL;
      return;
    }

if (isGrandRow) {
  cell.style.borderTop    = BORDER_NONE;
  cell.style.borderRight  = BORDER_NONE;
  cell.style.borderBottom = BORDER_NONE;
  cell.style.borderLeft   = BORDER_NONE;

  if (isEmpty || isEmptyPlain)      return;

  if (isTotalLbl) {
    cell.style.borderLeft   = BORDER_GRAND;
    cell.style.borderBottom = BORDER_GRAND;
    return;
  }

  // total-value dan grand-value: border kanan + bawah saja
if (isGrandVal || isTotalVal) {
    cell.style.borderRight  = BORDER_GRAND;
    cell.style.borderBottom = BORDER_GRAND;
    return;
  }

  return;
}

    if (isImgRowTd) {
      cell.style.borderRight  = BORDER_NORMAL;
      cell.style.borderBottom = BORDER_NORMAL;
      if (isFirst) cell.style.borderLeft = BORDER_NORMAL;
      return;
    }

    if (isHeader) {
      cell.style.borderTop    = BORDER_HEADER;
      cell.style.borderRight  = BORDER_HEADER;
      cell.style.borderBottom = BORDER_HEADER;
      cell.style.borderLeft   = isFirst ? BORDER_HEADER : BORDER_NONE;
      return;
    }

    // Khusus baris terakhir A5 (inv-row-last-a5): tambah border BOTTOM
    // agar garis penutup tabel muncul saat print pair A5
    const isLastA5Row = cell.closest(".inv-row-last-a5") !== null;
    cell.style.borderRight = BORDER_NORMAL;
    if (isFirst)     cell.style.borderLeft   = BORDER_NORMAL;
    if (isLastA5Row) cell.style.borderBottom = BORDER_NORMAL;
  });
};


const restoreTableBorders = (el) => {
  el.querySelectorAll("table.inv-table").forEach((tbl) => {
    if (tbl.dataset.origCollapse !== undefined) {
      tbl.style.borderCollapse  = tbl.dataset.origCollapse || "";
      tbl.style.borderSpacing   = tbl.dataset.origBorderSpacing || "";
      delete tbl.dataset.origCollapse;
      delete tbl.dataset.origBorderSpacing;
    }
  });

  el.querySelectorAll("td, th").forEach((cell) => {
    if (cell.dataset.origBorder !== undefined) {
      cell.style.cssText = cell.dataset.origBorder;
      delete cell.dataset.origBorder;
    }
  });
};

const openPrintWindow = (htmlContent) => {
  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 1000);
};

const printBaseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; background: #fff; }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const InvoiceFooter = ({ iconSize = 20 }) => (
  <div className="inv-footer">
    <div><FaGlobe size={iconSize} /> https://flowerplusofficial.com</div>
    <div><FaInstagram size={iconSize} /> flowerplusofficial</div>
    <div><FaWhatsapp size={iconSize} /> 081316835325</div>
  </div>
);

const PaymentInfo = ({ bankInfo, isA5 = false }) => (
  <div className="payment">
    <p className="pay-title">CARA PEMBAYARAN</p>
    {bankInfo.norek === null ? (
      <p className="pay-tunai">PEMBAYARAN TUNAI</p>
    ) : (
      <>
        <p className="pay-transfer">TRANSFER KE :</p>

        {bankInfo.norek2 ? (
          /* ── DJPB: dua rekening ── */
          <div className="pay-dual">
            {isA5 ? (
              /* A5: satu baris */
              <>
                <p className="pay-dual-row">
                  <span className="pay-dual-norek">A.C. {bankInfo.norek}</span>
                  <span className="pay-dual-label">{bankInfo.label}</span>
                </p>
                <p className="pay-dual-row">
                  <span className="pay-dual-norek">A.C. {bankInfo.norek2}</span>
                  <span className="pay-dual-label">{bankInfo.label2}</span>
                </p>
              </>
            ) : (
              /* A4: no rek besar, a.n di bawah */
              <>
                <p className="pay-rekening">A.C. {bankInfo.norek}</p>
                <p className="pay-bank-name">{bankInfo.label}</p>
                <p className="pay-rekening" style={{ marginTop: "8px" }}>A.C. {bankInfo.norek2}</p>
                <p className="pay-bank-name">{bankInfo.label2}</p>
              </>
            )}
          </div>
        ) : (
          /* ── Bank lain: format normal ── */
          <>
            <p className="pay-rekening">A.C. {bankInfo.norek}</p>
            <p className="pay-bank-name">{bankInfo.label}</p>
          </>
        )}
      </>
    )}
  </div>
);

const GrandTotalRows = ({ subtotal, shippingCost }) => {
  const grandTotal = subtotal + shippingCost;
  return (
    <>
      {shippingCost > 0 && (
        <tr className="grand-total-row">
          <td colSpan={3} className="inv-td-empty" />
          <td className="total-label shipping-label">Ongkos Kirim</td>
          <td className="total-value">{shippingCost.toLocaleString("id-ID")}</td>
        </tr>
      )}
      <tr className="grand-total-row">
        <td colSpan={3} className="inv-td-empty" />
        <td className="total-label grand-label">Total Tagihan</td>
        <td className="total-value grand-value">{grandTotal.toLocaleString("id-ID")}</td>
      </tr>
    </>
  );
};

const ImagesRow = ({ images }) => {
  const isSingle = images.length === 1;
  return (
    <tr className="inv-images-row">
      <td className="inv-td-center inv-images-row-td" />
      <td className="inv-images-cell inv-images-row-td">
        <div className={isSingle ? "inv-img-wrap-single" : "inv-img-wrap-grid"}>
          {images.map((src, idx) => (
            <img
              key={idx}
              src={src}
              className={isSingle ? "inv-img-single" : "inv-img-grid"}
              alt=""
              crossOrigin="anonymous"
            />
          ))}
        </div>
      </td>
      <td className="inv-images-row-td" />
      <td className="inv-images-row-td" />
      <td className="inv-images-row-td" />
    </tr>
  );
};

const TableHead = () => (
  <thead>
    <tr>
      <th className="inv-col-no">No</th>
      <th className="inv-col-desc">Deskripsi</th>
      <th className="inv-col-unit">Unit</th>
      <th className="inv-col-price">Harga (Rp)</th>
      <th className="inv-col-total">Total (Rp)</th>
    </tr>
  </thead>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const InvoicePreview = ({ data, onBack }) => {
  const { invoices, setInvoices, refreshInvoices } = useApp();
  const invoiceRef     = useRef();
  const location       = useLocation();
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [generatedNumber, setGeneratedNumber] = useState("");
  const [invoiceDetail,   setInvoiceDetail]   = useState(null);
  const [pairedInvoice,   setPairedInvoice]   = useState(null);

  const [showPairModal, setShowPairModal] = useState(false);
  const [a5List,        setA5List]        = useState([]);
  const [pairMode,      setPairMode]      = useState("list");
  const [pairSearch,    setPairSearch]    = useState("");
  const [pairPage,      setPairPage]      = useState(1);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const invoiceData =
    data ||
    invoiceDetail ||
    location.state?.invoice ||
    invoices.find((inv) => String(inv.id) === String(id));

    // Tambah derived variable ini setelah deklarasi invoiceData
const displayInvoiceNumber =
  invoiceData?.invoiceNumber ||      // dari data yang sudah ada
  invoiceDetail?.invoiceNumber ||    // dari fetch async (edit mode)
  generatedNumber;                   // generate baru (create mode)

  const allItems    = invoiceData?.items || [];
  // SESUDAH — hanya cek image URL valid, abaikan preview
const hasAnyImage = allItems.some(
  (item) => item.image &&
            !String(item.image).startsWith("data:") &&
            String(item.image).startsWith("http")
);
  const isSmallAuto = allItems.length <= 1 && !hasAnyImage;

  const paperSizeFromUrl = searchParams.get("paper_size");
  const paperSize = allItems.length > 0
    ? (hasAnyImage ? "a4" : (isSmallAuto ? "a5" : "a4"))
    : (invoiceData?.paper_size ?? paperSizeFromUrl ?? "a5");
  const isA5 = paperSize === "a5";

  const invoiceType = searchParams.get("type") || invoiceData?.type || "normal";
  const showQR    = isA5 ? false : invoiceType !== "unsigned";

  const subtotal     = calcSubtotal(allItems);
  const shippingCost = Number(invoiceData?.shippingCost || 0);
  const bankInfo     = getBankInfo(invoiceData?.bank || "");

  const pages = isA5
    ? [allItems.slice(0, 1)]
    : allItems.reduce((acc, item, i) => {
        const idx = Math.floor(i / MAX_ITEMS_PER_A4_PAGE);
        if (!acc[idx]) acc[idx] = [];
        acc[idx].push(item);
        return acc;
      }, []);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/api/invoices/${id}`)
        .then((res) => res.json())
        .then((result) => {
          const inv = result.data || result;
          if (inv.items) {
            inv.items = inv.items.map((item) => ({
              ...item,
              preview: item.image ?? null,
            }));
          }
          setInvoiceDetail({
  ...inv,
  _originalPaperSize: inv.paper_size,
});
        })
        .catch((err) => console.error("Fetch invoice detail error:", err));
    }
  }, [id]);

// SESUDAH — tambah date
useEffect(() => {
  // Jika sudah ada id (mode edit), JANGAN generate nomor baru
  // — nomor akan datang dari fetch invoiceDetail di useEffect sebelumnya
  if (id) return;

  // Hanya generate nomor baru untuk invoice BARU (belum punya invoiceNumber)
  if (!invoiceData?.invoiceNumber) {
    const date = invoiceData?.date || "";
    const params = new URLSearchParams({ paper_size: paperSize });
    if (date) params.set("date", date);
    if (hasAnyImage) params.set("has_image", "true");

    fetch(`${API_URL}/api/invoices/preview-number?${params}`)
      .then((res) => res.json())
      .then((d) => setGeneratedNumber(d.invoiceNumber))
      .catch((err) => console.error("Preview number error:", err));
  }
}, [id, invoiceData?.invoiceNumber, paperSize, invoiceData?.date, hasAnyImage]);

  useEffect(() => {
    if (isA5 || !invoiceData) return;
    const A4_HEIGHT_PX = 1122;
    const A4_WIDTH_PX  = 794;

    const scalePages = () => {
      document.querySelectorAll(".invoice-paper-scalable").forEach((paper) => {
        paper.style.transform       = "";
        paper.style.transformOrigin = "";
        paper.style.marginBottom    = "";
        const containerWidth = paper.parentElement?.offsetWidth || A4_WIDTH_PX;
        const scale = containerWidth / A4_WIDTH_PX;
        if (scale < 1) {
          paper.style.transformOrigin = "top center";
          paper.style.transform       = `scale(${scale})`;
          paper.style.marginBottom    = `-${A4_HEIGHT_PX * (1 - scale)}px`;
        }
      });
    };

    const timer = setTimeout(scalePages, 150);
    return () => clearTimeout(timer);
  }, [invoiceData, isA5, pages.length]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const openPairModal = () => {
    fetch(`${API_URL}/api/invoices?paper_size=a5&per_page=200`)
      .then((res) => res.json())
      .then((result) => {
        const raw = result.data?.data || result.data || result || [];
        setA5List(raw.filter((inv) => inv.paper_size === "a5" && String(inv.id) !== String(invoiceData?.id)));
      })
      .catch(() =>
        setA5List(invoices.filter((inv) => inv.paper_size === "a5" && String(inv.id) !== String(invoiceData?.id)))
      );
    setPairMode("list");
    setPairSearch("");
    setPairPage(1);
    setShowPairModal(true);
  };

  const handlePrint = async () => {
    // ── A5 Pair ──
    if (isA5 && pairedInvoice) {
      const [el1, el2] = document.querySelectorAll(".inv-a5-pair-sheet .paper-a5");
      if (!el1 || !el2) return;

      fixTableBorders(el1);
      fixTableBorders(el2);
      const [canvas1, canvas2] = await Promise.all([
        captureElement(el1, { scale: 3 }),
        captureElement(el2, { scale: 3 }),
      ]);
      restoreTableBorders(el1);
      restoreTableBorders(el2);

      openPrintWindow(`<!DOCTYPE html>
<html><head><title>Pair Print A5</title><style>
  ${printBaseStyles}
  .page { width: 210mm; height: 297mm; margin: 0 auto; background: #fff; display: flex; flex-direction: column; overflow: hidden; }
  .half { width: 210mm; height: 148.5mm; overflow: hidden; flex-shrink: 0; }
  .half img { display: block; width: 210mm; height: 148.5mm; object-fit: contain; object-position: top left; }
  .cut-line { width: 100%; flex-shrink: 0; border-top: 1.5px dashed #bbb; display: flex; align-items: center; justify-content: center; }
  .cut-label { background: #fff; font-size: 9px; color: #aaa; font-family: Arial, sans-serif; font-weight: 700; padding: 0 10px; margin-top: -7px; letter-spacing: 1px; }
</style></head><body>
  <div class="page">
    <div class="half"><img src="${canvas1.toDataURL("image/png")}" /></div>
    <div class="cut-line"><span class="cut-label">✂ POTONG</span></div>
    <div class="half"><img src="${canvas2.toDataURL("image/png")}" /></div>
  </div>
</body></html>`);
      return;
    }

    // ── A5 Single ──
    if (isA5) {
      const el = invoiceRef.current?.querySelector(".paper-a5");
      if (!el) return;

      fixTableBorders(el);
      const canvas = await captureElement(el, { scale: 3 });
      restoreTableBorders(el);

      openPrintWindow(`<!DOCTYPE html>
<html><head><title>Invoice - ${invoiceData.invoiceNumber || "Draft"}</title><style>
  ${printBaseStyles}
  .page { width: 210mm; height: 297mm; margin: 0 auto; background: #fff; display: flex; flex-direction: column; overflow: hidden; }
  .half { width: 210mm; height: 148.5mm; overflow: hidden; flex-shrink: 0; }
  .half img { display: block; width: 210mm; height: 148.5mm; object-fit: fill; }
  .empty { flex: 1; background: #fff; }
</style></head><body>
  <div class="page">
    <div class="half"><img src="${canvas.toDataURL("image/png")}" /></div>
    <div class="empty"></div>
  </div>
</body></html>`);
      return;
    }

    // ── A4 ──
    const el = invoiceRef.current?.querySelector(".invoice-paper-scalable");
    if (!el) return;
    fixTableBorders(el);
    const canvas = await captureElement(el, { scale: 3 });
    restoreTableBorders(el);
    openPrintWindow(`<!DOCTYPE html>
<html><head><title>Invoice - ${invoiceData.invoiceNumber || "Draft"}</title><style>
  ${printBaseStyles}
  html, body { height: 100%; }
  @media print { html, body { width: 210mm; } }
  .page { width: 210mm; height: auto; margin: 0 auto; background: #fff; overflow: hidden; }
  .page img { display: block; width: 210mm; height: auto; }
</style></head><body>
  <div class="page"><img src="${canvas.toDataURL("image/png")}" /></div>
</body></html>`);
  };

  const handleDownloadPDF = async () => {
    const pageElements = isA5
      ? [invoiceRef.current.querySelector(".paper-a5")]
      : Array.from(invoiceRef.current.querySelectorAll(".invoice-paper-scalable"));
    if (!pageElements?.length) return;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [210, 297] });

    for (let i = 0; i < pageElements.length; i++) {
      const el = pageElements[i];

      fixTableBorders(el);
      const canvas  = await captureElement(el, { scale: 2 });
      restoreTableBorders(el);

      const imgData = canvas.toDataURL("image/jpeg", 0.82);
      const pageW   = 210;
      const pageH   = isA5 ? 148.5 : Math.min(297, Math.round((canvas.height * 210) / canvas.width));
      if (i === 0) {
        pdf.internal.pageSize.width  = pageW;
        pdf.internal.pageSize.height = pageH;
      } else {
        pdf.addPage([pageW, pageH]);
      }
      pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
    }

    const invoiceNo = (invoiceData.invoiceNumber || "").split("/")[0];
    const bulan     = getBulanID(invoiceData.date);
    const customer  = sanitizeFileName(invoiceData.kepada).replace(/_/g, " ").slice(0, 30);
    const branch    = sanitizeFileName(invoiceData.branch).replace(/_/g, " ");
    pdf.save(`INV ${invoiceNo} ${bulan} ${customer} ${branch}.pdf`);
  };

const handleSave = async () => {
  if (!invoiceData.bank) { alert("Bank belum dipilih"); return; }

  try {
    const isEdit = Boolean(invoiceData.id);
    const url = isEdit
      ? `${API_URL}/api/invoices/${invoiceData.id}`
      : `${API_URL}/api/invoices`;

    // ← Tambahkan ini
    const sanitizedItems = allItems.map((item) => {
      const imageUrl =
        item.image &&
        !String(item.image).startsWith("data:") &&
        String(item.image).startsWith("http")
          ? item.image
          : null;
      return {
        desc:  item.desc  ?? "",
        qty:   Number(item.qty   || 0),
        price: Number(item.price || 0),
        image: imageUrl,
      };
    });

    const payload = {
      customer:     invoiceData.customer,
      kepada:       invoiceData.kepada,
      branch:       invoiceData.branch,
      bank:         invoiceData.bank,
      amount:       subtotal,
      shippingCost: shippingCost,
      date:         invoiceData.date,
      status:       invoiceData.status,
      type:         invoiceType,
      items:        sanitizedItems,
    };

    console.log("=== SENDING REQUEST ===");
    const response = await fetch(url, {
      method:  isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify(payload),
    });
    console.log("=== RESPONSE STATUS:", response.status, "===");

    if (!response.ok) {
      const errText = await response.text();
      console.error("Response error:", errText);
      throw new Error(errText);
    }

// SESUDAH
const result = await response.json();
const savedInvoice = result.data || result;
console.log("=== RESPONSE DATA ===", JSON.stringify(savedInvoice.invoiceNumber));

// Update state langsung dari response server
setInvoices(prev =>
  prev.map(inv =>
    String(inv.id) === String(savedInvoice.id)
      ? { ...inv, ...savedInvoice }
      : inv
  )
);

// Refresh dulu, baru navigate — jangan pakai window.location.href
// karena itu bypass React state dan React Router
try {
  await refreshInvoices();
} catch (_) {
  // ignore error refresh, state lokal sudah terupdate
}
navigate("/invoice", { state: { savedInvoice: savedInvoice.invoiceNumber } });

  } catch (error) {
    console.error("Save error:", error);
    alert("Gagal menyimpan: " + error.message);
  }
};

const handleSwitchType = () => {
  const newType = showQR ? "unsigned" : "signed";  // ← ganti jadi showQR
  navigate(`/invoice/preview/${invoiceData.id || "new"}?type=${newType}`, {
    state: { invoice: invoiceData },
  });
};

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderInvoiceHeader = (inv, number) => (
    <>
      <div className="inv-header">
        <img src={logo} alt="logo" className="invoice-logo" />
        <div className="inv-header-right">
          <h1 className="inv-title">INVOICE</h1>
          <div className="inv-meta">
            <div>No. Inv : {inv.invoiceNumber || number}</div>
            <div>Tanggal : {formatDateDisplay(inv.date)}</div>
          </div>
        </div>
      </div>
      <div className="inv-customer" lang="id" spellCheck={false}>
        <p className="inv-customer-yth">Kepada Yth</p>
        <h5>{inv.kepada}</h5>
        <p>{inv.branch}</p>
      </div>
    </>
  );

  const renderTableRows = (items, startIndex, isLastPage) => {
    const allImages = items.flatMap(getItemImages);
    const hasImages = allImages.length > 0;

    const MIN_A4_ROWS = 4;
    const emptyCount  = !isA5 && !hasImages && items.length < MIN_A4_ROWS
      ? MIN_A4_ROWS - items.length
      : 0;

    return (
      <>
        {items.map((item, i) => (
          <tr key={i} className={isA5 && !hasImages && i === items.length - 1 ? "inv-row-last-a5" : ""}>
            <td className="inv-td-center">{startIndex + i + 1}</td>
            <td className="inv-td-desc" style={{ whiteSpace: "pre-wrap" }}>{item.desc}</td>
            <td className="inv-td-center">{item.qty}</td>
            <td className="inv-td-center">{Number(item.price).toLocaleString("id-ID")}</td>
            <td className="inv-td-center">{(Number(item.qty) * Number(item.price)).toLocaleString("id-ID")}</td>
          </tr>
        ))}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <tr key={`empty-${i}`} className="inv-row-empty-a4">
            <td className="inv-td-empty-no" />
            <td className="inv-td-empty-plain" />
            <td className="inv-td-empty-plain" />
            <td className="inv-td-empty-plain" />
            <td className="inv-td-empty-plain" />
          </tr>
        ))}
        {hasImages && <ImagesRow images={allImages} />}
        {isLastPage && <GrandTotalRows subtotal={calcSubtotal(items)} shippingCost={shippingCost} />}
      </>
    );
  };

const renderA4Footer = () => (
  <>
    <div className="inv-payment-row">
      <PaymentInfo bankInfo={bankInfo} />
      {showQR && (
        <div className="inv-signed-qris">
          <p className="inv-signed-qris-label">
            Untuk pembayaran bisa<br />Scan QR dibawah
          </p>
          <img src={qris} className="inv-signed-qris-img" alt="QRIS" />
        </div>
      )}
      <div className="inv-signed-stamp">
        <div className="inv-stamp-wrap">
          <p className="inv-stamp-name">(Dede Syarifah)</p>
          <img src={stamp}    className="inv-stamp-img" alt="" />
          <img src={ttdStamp} className="inv-ttd-img"   alt="" />
        </div>
      </div>
    </div>
    <InvoiceFooter iconSize={20} />
  </>
);

  const renderA5Block = (inv, extraClass = "") => {
    if (!inv) return null;
    const items     = (inv.items || []).slice(0, 1);
    const images    = items.flatMap(getItemImages);
    const hasImages = images.length > 0;
    const pBankInfo = getBankInfo(inv.bank || "");
    const pSubtotal = calcSubtotal(items);
    const pShipping = Number(inv.shippingCost || 0);

    return (
      <div className={`invoice-paper paper-a5 ${extraClass}`}>
        <div className="inv-a5-body">
          {renderInvoiceHeader(inv, "")}
          <table className="inv-table">
            <TableHead />
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={!hasImages ? "inv-row-last-a5" : ""}>
                  <td className="inv-td-center">{i + 1}</td>
                  <td className="inv-td-desc" style={{ whiteSpace: "pre-wrap" }}>{item.desc}</td>
                  <td className="inv-td-center">{item.qty}</td>
                  <td className="inv-td-center">{Number(item.price).toLocaleString("id-ID")}</td>
                  <td className="inv-td-center">{(Number(item.qty) * Number(item.price)).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {hasImages && <ImagesRow images={images} />}
              <GrandTotalRows subtotal={pSubtotal} shippingCost={pShipping} />
            </tbody>
          </table>
          <div className={`inv-payment-row ${pBankInfo.norek === null ? "inv-payment-row-tunai" : ""}`}>
            <PaymentInfo bankInfo={pBankInfo} isA5={true} />
            <p className="inv-signer-name">(Dede Syarifah)</p>
          </div>
        </div>
        <InvoiceFooter iconSize={15} />
      </div>
    );
  };

  // ─── Pair Modal ────────────────────────────────────────────────────────────

  const filteredA5 = a5List.filter((inv) => {
    const q = pairSearch.toLowerCase();
    return (
      (inv.kepada        || "").toLowerCase().includes(q) ||
      (inv.invoiceNumber || "").toLowerCase().includes(q) ||
      (inv.branch        || "").toLowerCase().includes(q)
    );
  });
  const totalPairPages = Math.ceil(filteredA5.length / PAIR_PAGE_SIZE);
  const pagedA5        = filteredA5.slice((pairPage - 1) * PAIR_PAGE_SIZE, pairPage * PAIR_PAGE_SIZE);

  // ─── Early return ──────────────────────────────────────────────────────────

  if (!invoiceData) return <div className="inv-loading">Memuat invoice...</div>;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div ref={invoiceRef} className="invoice-preview-wrapper">

        {/* ── A5 ── */}
        {isA5 ? (
          pairedInvoice ? (
            <div className="inv-a5-pair-sheet">
              {renderA5Block({ ...invoiceData, invoiceNumber: displayInvoiceNumber }, "paper-a5-top")}
              <div className="inv-cut-line"><span className="inv-cut-label">✂ POTONG</span></div>
              {renderA5Block(pairedInvoice, "paper-a5-bottom")}
            </div>
          ) : (
            <div className="inv-a5-sheet">
              <div className="invoice-paper paper-a5">
                <div className="inv-a5-body">
                  {renderInvoiceHeader(invoiceData, displayInvoiceNumber)}
                  <table className="inv-table">
                    <TableHead />
                    <tbody>{renderTableRows(pages[0] || [], 0, true)}</tbody>
                  </table>
                  <div className={`inv-payment-row ${bankInfo.norek === null ? "inv-payment-row-tunai" : ""}`}>
                    <PaymentInfo bankInfo={bankInfo} isA5={true} />
                    <p className="inv-signer-name">(Dede Syarifah)</p>
                  </div>
                </div>
                <InvoiceFooter iconSize={15} />
              </div>
            </div>
          )
        ) : (
          // ── A4 — multi page ──
          pages.map((pageItems, pageIndex) => (
            <div key={pageIndex} className="invoice-paper invoice-paper-scalable" id={`invoice-page-${pageIndex}`}>
              <div className="inv-a4-inner">
                {renderInvoiceHeader(invoiceData, displayInvoiceNumber)}
                <table className="inv-table">
                  <TableHead />
                  <tbody>
                    {renderTableRows(pageItems, pageIndex * MAX_ITEMS_PER_A4_PAGE, pageIndex === pages.length - 1)}
                  </tbody>
                </table>
                {pageIndex === pages.length - 1
                  ? renderA4Footer()
                  : <div className="inv-page-indicator">Halaman {pageIndex + 1} dari {pages.length}</div>
                }
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pair Modal ── */}
      {showPairModal && (
        <div className="pair-modal-overlay">
          <div className="pair-modal">
            <div className="pair-modal-header">
              <div>
                <p className="pair-modal-title">Pair & Print A5</p>
                <p className="pair-modal-subtitle">Gabungkan 2 invoice A5 dalam 1 lembar A4</p>
              </div>
              <button className="pair-modal-close" onClick={() => setShowPairModal(false)}>✕</button>
            </div>

            <div className="pair-modal-tabs">
              {["list", "new"].map((m) => (
                <button key={m} className={`pair-tab-btn ${pairMode === m ? "active" : ""}`}
                  onClick={() => { setPairMode(m); setPairPage(1); }}>
                  {m === "list" ? "Pilih Invoice" : "Buat Invoice Baru"}
                </button>
              ))}
            </div>

            {pairMode === "list" && (
              <div className="pair-search-wrap">
                <Search size={14} className="pair-search-icon" />
                <input
                  type="text"
                  className="pair-search-input"
                  placeholder="Cari nama, nomor, atau cabang..."
                  value={pairSearch}
                  onChange={(e) => { setPairSearch(e.target.value); setPairPage(1); }}
                />
              </div>
            )}

            <div className="pair-modal-body">
              {pairMode === "list" ? (
                filteredA5.length === 0 ? (
                  <div className="pair-empty">
                    {pairSearch ? "Tidak ada hasil pencarian" : "Belum ada invoice A5 lain"}
                  </div>
                ) : (
                  <div className="pair-list">
                    {pagedA5.map((inv) => (
                      <button key={inv.id}
                        className={`pair-list-item ${pairedInvoice?.id === inv.id ? "selected" : ""}`}
                        onClick={() => { setPairedInvoice(inv); setShowPairModal(false); }}>
                        <div className="pair-list-info">
                          <p className="pair-list-name">{inv.kepada}</p>
                          <p className="pair-list-meta">{inv.invoiceNumber} · {inv.branch || "—"}</p>
                        </div>
                        <span className="pair-list-arrow">Pilih →</span>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="pair-new-wrap">
                  <p className="pair-new-desc">
                    Klik tombol di bawah untuk membuat invoice A5 baru. Setelah disimpan, kembali ke halaman ini dan pilih dari daftar.
                  </p>
                  <button className="pair-new-btn" onClick={() => { setShowPairModal(false); navigate("/invoice/create"); }}>
                    + Buat Invoice Baru
                  </button>
                </div>
              )}
            </div>

            {pairMode === "list" && totalPairPages > 1 && (
              <div className="pair-pagination">
                <button className="pair-page-btn" disabled={pairPage === 1} onClick={() => setPairPage((p) => p - 1)}>‹ Prev</button>
                <span className="pair-page-info">{pairPage} / {totalPairPages}</span>
                <button className="pair-page-btn" disabled={pairPage === totalPairPages} onClick={() => setPairPage((p) => p + 1)}>Next ›</button>
              </div>
            )}

            <div className="pair-modal-footer">
              <button className="pair-cancel-btn" onClick={() => setShowPairModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Bar ── */}
      <div className="invoice-action">
        <button className="ia-btn ia-btn-back" onClick={() => onBack ? onBack() : navigate("/invoice")}>
          <ArrowLeft size={16} /><span>Back</span>
        </button>

        <div className="ia-badges">
          <span className={`ia-badge ${isA5 ? "ia-badge-a5" : "ia-badge-a4"}`}>
            {isA5 ? "A5 · Cetak" : "A4 · Kirim"}
          </span>
          {!isA5 && pages.length > 1 && (
            <span className="ia-badge ia-badge-page">{pages.length} Halaman</span>
          )}
          {isA5 && pairedInvoice && (
            <span className="ia-badge ia-badge-pair">
              ✓ {pairedInvoice.kepada}
              <button className="ia-badge-remove" onClick={() => setPairedInvoice(null)}>✕</button>
            </span>
          )}
        </div>

        <div className="ia-btn-right">
          {!isA5 && (
            <button className="ia-btn ia-btn-switch" onClick={handleSwitchType}>
  <Eye size={16} /><span>{showQR ? "Tanpa QR" : "Dengan QR"}</span>
</button>
          )}
          {isA5 && (
            <button className={`ia-btn ia-btn-switch${pairedInvoice ? " ia-btn-paired" : ""}`} onClick={openPairModal}>
              <Printer size={16} /><span>{pairedInvoice ? "Ganti Pasangan" : "Pilih Pasangan"}</span>
            </button>
          )}
          <button className="ia-btn ia-btn-print"    onClick={handlePrint}>
            <Printer size={16} /><span>Print</span>
          </button>
          <button className="ia-btn ia-btn-save"     onClick={handleSave}>
            <Save size={16} /><span>Save Invoice</span>
          </button>
          <button className="ia-btn ia-btn-download" onClick={handleDownloadPDF}>
            <Download size={16} /><span>Download PDF</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default InvoicePreview;