import { useRef } from "react";
import { useLocation, useParams, useNavigate, useSearchParams } from "react-router-dom";
import "../../Style/Invoice/InvoicePreview.css";
import logo from "../../images/LogoInvoice.png";
import ttdStamp from "../../images/TTD1.png";
import stamp from "../../images/stempel.png";
import qris from "../../images/QRIS.jpeg";
import { useApp } from "../../../context/AppContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { ArrowLeft, Save, Download, Eye } from "lucide-react";

const InvoicePreview = ({ data, onBack }) => {
  const { invoices, setInvoices } = useApp();
  const invoiceRef = useRef();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceType = searchParams.get("type") || "normal";
  const isSigned = invoiceType === "signed";

  /* =============================
     GET INVOICE DATA FROM 3 SOURCES
  ============================== */

  let invoiceData = data;

  if (!invoiceData && location.state?.invoice) {
    invoiceData = location.state.invoice;
  }

  if (!invoiceData && id && invoices.length) {
    invoiceData = invoices.find((inv) => inv.id === id);
  }

  if (!invoiceData) {
    return <div style={{ padding: 20 }}>Invoice tidak ditemukan</div>;
  }

  /* =============================
     HELPERS
  ============================== */

  const formatDateCompact = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}${month}${day}`;
  };

  const sanitizeFileName = (text) => {
    return String(text || "")
      .replace(/[\/\\:*?"<>|]/g, "")
      .replace(/\s+/g, "_");
  };

  /* =============================
     DOWNLOAD PDF
  ============================== */

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageElements = invoiceRef.current.querySelectorAll(".invoice-paper");

    for (let i = 0; i < pageElements.length; i++) {
      const canvas = await html2canvas(pageElements[i], {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pageWidth = 210;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (i === 0) {
        pdf.internal.pageSize.width = pageWidth;
        pdf.internal.pageSize.height = imgHeight;
      } else {
        pdf.addPage([pageWidth, imgHeight]);
      }

      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);
    }

    const branch = sanitizeFileName(invoiceData.branch);
    const bank = sanitizeFileName(invoiceData.bank || "BANK");
    const invoiceNo = (invoiceData.invoiceNumber || "").split("/").pop();
    const customer = sanitizeFileName(invoiceData.kepada).slice(0, 30);
    const tanggal = formatDateCompact(invoiceData.date);
    const typeSuffix = isSigned ? "_TTD" : "";

    const fileName = `FP_${branch}_${bank}_${invoiceNo}_${customer}_${tanggal}${typeSuffix}.pdf`;

    pdf.save(fileName);
  };

  /* =============================
     TOTAL
  ============================== */

  const total = (invoiceData.items || []).reduce(
    (acc, item) => acc + Number(item.qty || 0) * Number(item.price || 0),
    0
  );

  /* =============================
     SPLIT PAGES BY IMAGE COUNT
  ============================== */

  const MAX_IMAGES_PER_PAGE = 6;
  const pages = [];
  let currentPage = [];
  let imageCount = 0;

  (invoiceData.items || []).forEach((item) => {
    const count = Array.isArray(item.preview)
      ? item.preview.length
      : item.preview
      ? 1
      : 0;

    if (imageCount + count > MAX_IMAGES_PER_PAGE && currentPage.length) {
      pages.push(currentPage);
      currentPage = [];
      imageCount = 0;
    }

    currentPage.push(item);
    imageCount += count;
  });

  if (currentPage.length) pages.push(currentPage);

  /* =============================
     SAVE HANDLER
  ============================== */

  const handleSave = () => {
    setInvoices((prev) => {
      const existIndex = prev.findIndex((inv) => inv.id === invoiceData.id);

      const updatedInvoice = {
        ...invoiceData,
        type: invoiceType || "normal",
      };

      if (existIndex !== -1) {
        const filtered = prev.filter((inv) => inv.id !== invoiceData.id);
        return [updatedInvoice, ...filtered];
      }

      return [updatedInvoice, ...prev];
    });
    navigate("/invoice");
  };

  /* =============================
     SWITCH TYPE HANDLER
  ============================== */

  const handleSwitchType = () => {
    const newType = isSigned ? "normal" : "signed";
    navigate(`/invoice/preview/${invoiceData.id}?type=${newType}`, {
      state: { invoice: invoiceData },
    });
  };

  /* =============================
     UI
  ============================== */

  return (
    <>
      <div ref={invoiceRef} className="invoice-preview-wrapper">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;

          const startIndex = pages
            .slice(0, pageIndex)
            .reduce((sum, p) => sum + p.length, 0);

          return (
            <div className="invoice-paper" key={pageIndex}>

              {/* HEADER */}
              <div className="header">
                <img src={logo} alt="logo" className="logo" />
                <h1>INVOICE</h1>
              </div>

              {/* META */}
              <div className="meta">
                <div>No. Inv : {invoiceData.invoiceNumber}</div>
                <div>Tanggal : {invoiceData.date}</div>
              </div>

              {/* CUSTOMER */}
              <div className="customer-box">
                <p>Kepada Yth :</p>
                <p>{invoiceData.kepada}</p>
                <p>{invoiceData.branch}</p>
              </div>

              {/* TABLE */}
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Deskripsi</th>
                    <th>Unit</th>
                    <th>Harga</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, i) => (
                    <tr key={i}>
                      <td>{startIndex + i + 1}</td>
                      <td>
                        {item.desc}
                        {item.preview && (
                          <div className="image-grid">
                            {Array.isArray(item.preview)
                              ? item.preview.map((img, idx) => (
                                  <img key={idx} src={img} className="item-image" />
                                ))
                              : <img src={item.preview} className="item-image" />
                            }
                          </div>
                        )}
                      </td>
                      <td>{item.qty}</td>
                      <td>{Number(item.price).toLocaleString("id-ID")}</td>
                      <td>{(item.qty * item.price).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}

                  {isLastPage && (
                    <tr className="grand-total-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="total-label">Total</td>
                      <td className="total-value">
                        {total.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* LAST PAGE — PAYMENT + FOOTER */}
              {isLastPage && (
                <>
                  <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "30px",
                    marginBottom: "20px",
                    width: "100%",
                  }}>

                    {/* KIRI — Payment */}
                    <div className="payment">
                      <h4>CARA PEMBAYARAN</h4>
                      <p>TRANSFER KE :</p>
                      <h2>A.C. 118 00 1022 970 5</h2>
                      <p>BANK MANDIRI a.n Dede Syarifah</p>
                    </div>
                    {/* TENGAH & KANAN — hanya muncul jika signed */}
                    {isSigned && (
                      <>
                        {/* TENGAH — QRIS */}
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}>
                          <img
                            src={qris}
                            style={{ width: "200px", height: "300px", objectFit: "contain" }}
                          />
                          <p style={{ fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                            Scan QRIS
                          </p>
                        </div>

                        {/* KANAN — TTD + Stamp */}
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flexShrink: 0,
                          textAlign: "center",
                        }}>
                          <div style={{ position: "relative", width: "200px", height: "180px" }}>
                            <p style={{
                              position: "absolute",
                              bottom: "20px",
                              left: 0, right: 0,
                              fontSize: "13px",
                              color: "#1f2937",
                              fontWeight: "500",
                              zIndex: 0,
                            }}>
                              (Dede Syarifah)
                            </p>
                            <img src={stamp} style={{ position: "absolute", top: 0, left: 0, width: "200px", objectFit: "contain", opacity: 0.85, zIndex: 1 }} />
                            <img src={ttdStamp} style={{ position: "absolute", top: 0, left: 0, width: "200px", objectFit: "contain", zIndex: 2 }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="footer">
                    <div><FaGlobe size={25} /> www.flowerplus.id</div>
                    <div><FaInstagram size={25} /> flowerplusofficial</div>
                    <div><FaWhatsapp size={25} /> 081316835325</div>
                  </div>
                </>
              )}

            </div>
          );
        })}
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="invoice-action">

        <button
          className="ia-btn ia-btn-back"
          onClick={() => onBack ? onBack() : navigate("/invoice")}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="ia-btn-right">

          {/* SWITCH TTD / TANPA TTD */}
          <button
            className="ia-btn ia-btn-switch"
            onClick={handleSwitchType}
          >
            <Eye size={16} />
            <span>{isSigned ? "Tanpa TTD" : "Dengan TTD"}</span>
          </button>

          {/* SAVE */}
          <button className="ia-btn ia-btn-save" onClick={handleSave}>
            <Save size={16} />
            <span>Save Invoice</span>
          </button>

          {/* DOWNLOAD */}
          <button className="ia-btn ia-btn-download" onClick={handleDownloadPDF}>
            <Download size={16} />
            <span>Download PDF</span>
          </button>

        </div>
      </div>
    </>
  );
};

export default InvoicePreview;