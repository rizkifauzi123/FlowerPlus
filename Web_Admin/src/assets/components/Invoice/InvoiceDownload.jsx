import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getBankInfo } from "../constants/bankInfo";

// ✅ Pakai CSS yang SAMA dengan InvoicePreview — tidak perlu file terpisah
import "../../Style/Invoice/InvoicePreview.css";

import logo     from "../../images/LogoInvoice.png";
import ttdStamp from "../../images/TTD1.png";
import stamp    from "../../images/stempel.png";
import qris     from "../../images/QRIS.png";
import { FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";
import jsPDF        from "jspdf";
import html2canvas  from "html2canvas";

/* ─────────────────────────────────────────────────────────────
   InvoicePageBlock  —  struktur IDENTIK dengan renderInvoiceBlock
   di InvoicePreview.jsx (wrapper .invoice-paper-scalable > .inv-a4-inner)
───────────────────────────────────────────────────────────── */
const InvoicePageBlock = ({
  invoiceData,
  pageItems,
  pageIndex,
  totalPages,
  startIndex,
  isSigned,
  bankInfo,
  grandTotal,
  shippingCost,
  generatedNumber,
}) => {
  const isLastPage  = pageIndex === totalPages - 1;

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const allImagesOnPage = pageItems.flatMap((item) => {
    const imgs = item.preview || item.image;
    if (!imgs) return [];
    return Array.isArray(imgs) ? imgs : [imgs];
  });
  const hasImages   = allImagesOnPage.length > 0;
  const isSingleImg = allImagesOnPage.length === 1;

  return (
    /* ── Wrapper identik InvoicePreview: .invoice-paper.invoice-paper-scalable ── */
    <div className="invoice-paper invoice-paper-scalable dl-page" style={{ boxShadow: "none" }}>
      {/* ── Inner identik: .inv-a4-inner ── */}
      <div className="inv-a4-inner">

        {/* HEADER */}
        <div className="inv-header">
          <img src={logo} alt="logo" className="invoice-logo" crossOrigin="anonymous" />
          <div className="inv-header-right">
            <h1 className="inv-title">INVOICE</h1>
            <div className="inv-meta">
              <div>No. Inv : {invoiceData.invoiceNumber || generatedNumber}</div>
              <div>Tanggal : {formatDateDisplay(invoiceData.date)}</div>
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="inv-customer" lang="id" spellCheck={false}>
          <p className="inv-customer-yth">Kepada Yth</p>
          <h5>{invoiceData.kepada}</h5>
          <p>{invoiceData.branch}</p>
        </div>

        {/* TABLE */}
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: "6%"  }}>No</th>
              <th style={{ width: "44%" }}>Deskripsi</th>
              <th style={{ width: "12%" }}>Unit</th>
              <th style={{ width: "19%" }}>Harga (Rp)</th>
              <th style={{ width: "19%" }}>Total (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, i) => (
              <tr key={i}>
                <td className="inv-td-center">{startIndex + i + 1}</td>
                <td>{item.desc}</td>
                <td className="inv-td-center">{item.qty}</td>
                <td className="inv-td-center">{Number(item.price).toLocaleString("id-ID")}</td>
                <td className="inv-td-center">
                  {(Number(item.qty) * Number(item.price)).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}

            {/* Baris gambar */}
            {hasImages && (
              <tr className="inv-images-row">
                <td className="inv-td-center"></td>
                <td className="inv-images-cell">
                  <div className={isSingleImg ? "inv-img-wrap-single" : "inv-img-wrap-grid"}>
                    {allImagesOnPage.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        className={isSingleImg ? "inv-img-single" : "inv-img-grid"}
                        alt=""
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                </td>
                <td></td><td></td><td></td>
              </tr>
            )}

            {/* Total — hanya di halaman terakhir */}
            {isLastPage && (
              <>
                {shippingCost > 0 && (
                  <tr className="grand-total-row">
                    <td colSpan={3} style={{ border: "none", background: "transparent" }}></td>
                    <td className="total-label shipping-label">Ongkos Kirim</td>
                    <td className="total-value">{shippingCost.toLocaleString("id-ID")}</td>
                  </tr>
                )}
                <tr className="grand-total-row">
                  <td colSpan={3} style={{ border: "none", background: "transparent" }}></td>
                  <td className="total-label grand-label">Total Tagihan</td>
                  <td className="total-value grand-value">{grandTotal.toLocaleString("id-ID")}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* PAYMENT + SIGNATURE — hanya halaman terakhir */}
        {isLastPage && (
          <>
            {/* ── payment-row: class identik dengan Preview ── */}
            <div className="inv-payment-row">
              <div className="payment" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p className="pay-title">CARA PEMBAYARAN</p>
                {bankInfo.norek === null ? (
                  <p className="pay-tunai">PEMBAYARAN TUNAI</p>
                ) : (
                  <>
                    <p className="pay-transfer">TRANSFER KE :</p>
                    {bankInfo.norek && <p className="pay-rekening">{bankInfo.norek}</p>}
                    <p className="pay-bank-name">{bankInfo.label}</p>
                  </>
                )}
              </div>

              {isSigned ? (
                <>
                  <div className="inv-signed-qris">
                    <p style={{
                      fontSize: "10px", fontWeight: "500", color: "#374151",
                      textAlign: "center", margin: "0 0 4px 0", lineHeight: "1.4",
                    }}>
                      Untuk pembayaran bisa<br />Scan QR dibawah
                    </p>
                    <img
                      src={qris}
                      style={{ width: "150px", height: "150px", objectFit: "contain" }}
                      alt="QRIS"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="inv-signed-stamp">
                    <div className="inv-stamp-wrap">
                      <p style={{
                        position: "absolute", bottom: "16px", left: 0, right: 0,
                        fontSize: "12px", color: "#1f2937", fontWeight: "500",
                        zIndex: 0, textAlign: "center",
                      }}>
                        (Dede Syarifah)
                      </p>
                      <img
                        src={stamp}
                        style={{ position: "absolute", top: 0, left: 0, width: "160px", objectFit: "contain", opacity: 0.85, zIndex: 1 }}
                        alt=""
                        crossOrigin="anonymous"
                      />
                      <img
                        src={ttdStamp}
                        style={{ position: "absolute", top: 0, left: 0, width: "160px", objectFit: "contain", zIndex: 2 }}
                        alt=""
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p style={{
                  fontSize: "15px", fontWeight: "600", color: "#1f2937",
                  width: "38%", textAlign: "center", margin: 0, padding: 0,
                  border: "none", flexShrink: 0, alignSelf: "flex-end", paddingBottom: "2px",
                }}>
                  (Dede Syarifah)
                </p>
              )}
            </div>

            {/* FOOTER */}
            <div className="inv-footer">
              <div><FaGlobe size={20} /> https://flowerplusofficial.com</div>
              <div><FaInstagram size={20} /> flowerplusofficial</div>
              <div><FaWhatsapp size={20} /> 081316835325</div>
            </div>
          </>
        )}

        {/* Page indicator — bukan halaman terakhir */}
        {!isLastPage && (
          <div className="inv-page-indicator">
            Halaman {pageIndex + 1} dari {totalPages}
          </div>
        )}

      </div>{/* /inv-a4-inner */}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   InvoiceA5Block  —  struktur IDENTIK dengan renderA5Block
   di InvoicePreview.jsx  (.invoice-paper.paper-a5)
───────────────────────────────────────────────────────────── */
const InvoiceA5Block = ({ invoiceData, generatedNumber }) => {
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const pItems    = (invoiceData?.items || []).slice(0, 1);
  const pSubtotal = pItems.reduce((a, it) => a + Number(it.qty || 0) * Number(it.price || 0), 0);
  const pShipping = Number(invoiceData?.shippingCost || 0);
  const pTotal    = pSubtotal + pShipping;
  const pBankInfo = getBankInfo(invoiceData?.bank || "");
  const pHasImg   = pItems.some((it) => it.preview || it.image);
  const pImgs     = pItems.flatMap((it) => {
    const src = it.preview || it.image;
    if (!src) return [];
    return Array.isArray(src) ? src : [src];
  });

  return (
    <div className="invoice-paper paper-a5 dl-page" style={{ boxShadow: "none" }}>

      {/* BODY — flex grow */}
      <div className="inv-a5-body">
        <div className="inv-header">
          <img src={logo} alt="logo" className="invoice-logo" crossOrigin="anonymous" />
          <div className="inv-header-right">
            <h1 className="inv-title">INVOICE</h1>
            <div className="inv-meta">
              <div>No. Inv : {invoiceData.invoiceNumber || generatedNumber}</div>
              <div>Tanggal : {formatDateDisplay(invoiceData.date)}</div>
            </div>
          </div>
        </div>

        <div className="inv-customer" lang="id" spellCheck={false}>
          <p className="inv-customer-yth">Kepada Yth</p>
          <h5>{invoiceData.kepada}</h5>
          <p>{invoiceData.branch}</p>
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: "6%"  }}>No</th>
              <th style={{ width: "44%" }}>Deskripsi</th>
              <th style={{ width: "12%" }}>Unit</th>
              <th style={{ width: "19%" }}>Harga (Rp)</th>
              <th style={{ width: "19%" }}>Total (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {pItems.map((item, i) => (
              <tr key={i} className={!pHasImg ? "inv-row-last-a5" : ""}>
                <td className="inv-td-center">{i + 1}</td>
                <td>{item.desc}</td>
                <td className="inv-td-center">{item.qty}</td>
                <td className="inv-td-center">{Number(item.price).toLocaleString("id-ID")}</td>
                <td className="inv-td-center">
                  {(Number(item.qty) * Number(item.price)).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}

            {pHasImg && (
              <tr className="inv-images-row">
                <td className="inv-td-center"></td>
                <td className="inv-images-cell">
                  <div className={pImgs.length === 1 ? "inv-img-wrap-single" : "inv-img-wrap-grid"}>
                    {pImgs.map((src, idx) => (
                      <img
                        key={idx} src={src}
                        className={pImgs.length === 1 ? "inv-img-single" : "inv-img-grid"}
                        alt=""
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                </td>
                <td></td><td></td><td></td>
              </tr>
            )}

            {pShipping > 0 && (
              <tr className="grand-total-row">
                <td colSpan={3} style={{ border: "none", background: "transparent" }}></td>
                <td className="total-label shipping-label">Ongkos Kirim</td>
                <td className="total-value">{pShipping.toLocaleString("id-ID")}</td>
              </tr>
            )}
            <tr className="grand-total-row">
              <td colSpan={3} style={{ border: "none", background: "transparent" }}></td>
              <td className="total-label grand-label">Total Tagihan</td>
              <td className="total-value grand-value">{pTotal.toLocaleString("id-ID")}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment */}
        <div className={`inv-payment-row${pBankInfo.norek === null ? " inv-payment-row-tunai" : ""}`}>
          <div className="payment" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p className="pay-title">CARA PEMBAYARAN</p>
            {pBankInfo.norek === null ? (
              <p className="pay-tunai">PEMBAYARAN TUNAI</p>
            ) : (
              <>
                <p className="pay-transfer">TRANSFER KE :</p>
                {pBankInfo.norek && <p className="pay-rekening">{pBankInfo.norek}</p>}
                <p className="pay-bank-name">{pBankInfo.label}</p>
              </>
            )}
          </div>
          <p style={{
            fontSize: "14px", fontWeight: "600", color: "#1f2937",
            width: "38%", textAlign: "center", margin: 0, padding: 0,
            border: "none", flexShrink: 0, alignSelf: "flex-end", paddingBottom: "2px",
          }}>
            (Dede Syarifah)
          </p>
        </div>
      </div>{/* /inv-a5-body */}

      {/* FOOTER — selalu di paling bawah */}
      <div className="inv-footer">
        <div><FaGlobe size={15} /> https://flowerplusofficial.com</div>
        <div><FaInstagram size={15} /> flowerplusofficial</div>
        <div><FaWhatsapp size={15} /> 081316835325</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
const InvoiceDownload = () => {
  const { id }           = useParams();
  const [searchParams]   = useSearchParams();
  const invoiceType      = searchParams.get("type") || "normal";
  const isSigned         = invoiceType !== "unsigned";

  const [status,          setStatus]          = useState("loading");
  const [invoiceData,     setInvoiceData]     = useState(null);
  const [generatedNumber, setGeneratedNumber] = useState("");

  /* ── Fetch invoice ── */
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        const inv = data.data || data;
        setInvoiceData(inv);
        if (!inv.invoiceNumber) {
          const ps = inv.paper_size || "a4";
          fetch(`http://127.0.0.1:8000/api/invoices/preview-number?paper_size=${ps}`)
            .then((r) => r.json())
            .then((d) => setGeneratedNumber(d.invoiceNumber))
            .catch(() => {});
        }
        setStatus("rendering");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  /* ── Generate PDF setelah DOM render ── */
  useEffect(() => {
    if (status !== "rendering" || !invoiceData) return;

    const timer = setTimeout(async () => {
      setStatus("generating");
      try {
        const isA5 = invoiceData.paper_size === "a5";

        const pageElements = Array.from(document.querySelectorAll(".dl-page"));
        if (pageElements.length === 0) { setStatus("error"); return; }

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [210, 297] });

        for (let i = 0; i < pageElements.length; i++) {
          const el = pageElements[i];

          // ── Reset transform sementara supaya html2canvas dapat ukuran asli ──
          const prevTransform    = el.style.transform;
          const prevMarginBottom = el.style.marginBottom;
          el.style.transform    = "";
          el.style.marginBottom = "";

          const canvas = await html2canvas(el, {
            scale:           3,
            useCORS:         true,
            allowTaint:      true,
            backgroundColor: "#ffffff",
            logging:         false,
            width:           el.scrollWidth,
            height:          el.scrollHeight,
            windowWidth:     el.scrollWidth,
          });

          el.style.transform    = prevTransform;
          el.style.marginBottom = prevMarginBottom;

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const pageW   = 210;
          const pageH   = isA5
            ? 148.5
            : Math.min(297, Math.round((canvas.height * 210) / canvas.width));

          if (i === 0) {
            pdf.internal.pageSize.width  = pageW;
            pdf.internal.pageSize.height = pageH;
          } else {
            pdf.addPage([pageW, pageH]);
          }
          pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
        }

        /* ── Penamaan file identik InvoicePreview ── */
        const sanitize   = (text) =>
          String(text || "").replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, "_");
        const branch     = sanitize(invoiceData.branch);
        const bank       = sanitize(invoiceData.bank || "BANK");
        const invoiceNo  = (invoiceData.invoiceNumber || generatedNumber || "").split("/")[0];
        const customer   = sanitize(invoiceData.kepada).slice(0, 30);
        const d          = invoiceData.date ? new Date(invoiceData.date) : new Date();
        const tanggal    = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
        const sizeSuffix = isA5 ? "_A5" : "_A4";
        const ttdSuffix  = !isA5 && isSigned ? "_TTD" : "";

        pdf.save(`FP_${branch}_${bank}_${invoiceNo}_${customer}_${tanggal}${ttdSuffix}${sizeSuffix}.pdf`);
        setStatus("done");

      } catch (err) {
        console.error("PDF error:", err);
        setStatus("error");
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [status, invoiceData]);

  /* ── Status screens ── */
  const Spinner = () => (
    <>
      <style>{`@keyframes dl-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        border: "4px solid #e2e8f0", borderTopColor: "#2c4775",
        animation: "dl-spin 0.8s linear infinite",
      }} />
    </>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0f4f8", gap: 16, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <h2 style={{ margin: 0, color: "#1f2937" }}>Invoice tidak ditemukan</h2>
      <p style={{ margin: 0, color: "#6b7280" }}>Link mungkin sudah tidak valid</p>
    </div>
  );

  if (status === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0f4f8", gap: 16, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <h2 style={{ margin: 0, color: "#1f2937" }}>Invoice berhasil diunduh!</h2>
      <p style={{ margin: 0, color: "#6b7280" }}>File PDF sudah tersimpan di perangkat Anda</p>
    </div>
  );

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0f4f8", gap: 16, fontFamily: "'Segoe UI',sans-serif" }}>
      <Spinner />
      <h2 style={{ margin: 0, color: "#1f2937" }}>Memuat invoice...</h2>
      <p style={{ margin: 0, color: "#6b7280" }}>Mohon tunggu sebentar</p>
    </div>
  );

  /* ── rendering / generating ── */
  const isA5         = invoiceData.paper_size === "a5";
  const allItems     = invoiceData?.items || [];
  const subtotal     = allItems.reduce((a, it) => a + Number(it.qty || 0) * Number(it.price || 0), 0);
  const shippingCost = Number(invoiceData.shippingCost || 0);
  const grandTotal   = subtotal + shippingCost;
  const bankInfo     = getBankInfo(invoiceData.bank || "");

  const MAX_ITEMS_PER_PAGE = 10;
  const pages = isA5
    ? [allItems.slice(0, 1)]
    : allItems.reduce((acc, item, i) => {
        const pi = Math.floor(i / MAX_ITEMS_PER_PAGE);
        if (!acc[pi]) acc[pi] = [];
        acc[pi].push(item);
        return acc;
      }, []);

  return (
    <>
      {/* ── Spinner overlay ── */}
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(240,244,248,0.97)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 9999, fontFamily: "'Segoe UI',sans-serif", gap: 16,
      }}>
        <Spinner />
        <h2 style={{ margin: 0, color: "#1f2937", fontSize: 18 }}>Menyiapkan PDF...</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>File akan otomatis terunduh</p>
      </div>

      {/*
        ── Invoice paper untuk di-capture oleh html2canvas ──
        Dirender di luar viewport (left: -9999px) tapi TIDAK opacity:0
        agar computed styles terbaca dengan benar oleh html2canvas.
        Pakai class yang SAMA dengan InvoicePreview supaya hasil identik.
      */}
      <div
        aria-hidden="true"
        style={{
          position:   "fixed",
          top:        0,
          left:       "-9999px",
          width:      "210mm",
          zIndex:     -1,
          background: "#ffffff",
          visibility: "visible",
        }}
      >
        {isA5 ? (
          /* ── A5: wrapper .inv-a5-sheet identik Preview ── */
          <div className="inv-a5-sheet">
            <InvoiceA5Block
              invoiceData={invoiceData}
              generatedNumber={generatedNumber}
            />
          </div>
        ) : (
          /* ── A4: wrapper background putih, tanpa padding tambahan ── */
          <div style={{ background: "#ffffff", padding: 0 }}>
            {pages.map((pageItems, pageIndex) => (
              <InvoicePageBlock
                key={pageIndex}
                invoiceData={invoiceData}
                pageItems={pageItems}
                pageIndex={pageIndex}
                totalPages={pages.length}
                startIndex={pageIndex * MAX_ITEMS_PER_PAGE}
                isSigned={isSigned}
                bankInfo={bankInfo}
                grandTotal={grandTotal}
                shippingCost={shippingCost}
                generatedNumber={generatedNumber}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default InvoiceDownload;