import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../../images/LogoInvoice.png";
import ttdStamp from "../../images/TTD1.png";
import stamp from "../../images/stempel.png";
import qris from "../../images/QRIS.jpeg";
import { FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";

const InvoiceDownload = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const invoiceType = searchParams.get("type") || "normal";
  const isSigned = invoiceType === "signed";

  const [status, setStatus] = useState("loading"); // loading | rendering | generating | done | error
  const [invoiceData, setInvoiceData] = useState(null);
  const invoiceRef = useRef(null);

  /* =============================
     STEP 1: Fetch invoice data
  ============================== */
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/invoices/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Invoice tidak ditemukan");
        return res.json();
      })
      .then(data => {
        setInvoiceData(data.data || data);
        setStatus("rendering"); // ← render DOM dulu, baru generate
      })
      .catch(() => setStatus("error"));
  }, [id]);

  /* =============================
     STEP 2: Tunggu render selesai, baru generate PDF
  ============================== */
  useEffect(() => {
    if (status !== "rendering") return;

    const timer = setTimeout(async () => {
      setStatus("generating");

      try {
        const pageElements = invoiceRef.current?.querySelectorAll(".dl-invoice-paper");

        if (!pageElements || pageElements.length === 0) {
          console.error("Elemen tidak ditemukan");
          setStatus("error");
          return;
        }

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        for (let i = 0; i < pageElements.length; i++) {
          const canvas = await html2canvas(pageElements[i], {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
            scrollX: 0,
            scrollY: 0,
          });

          const imgData   = canvas.toDataURL("image/jpeg", 0.85);
          const pageWidth = 210;
          const imgHeight = (canvas.height * pageWidth) / canvas.width;

          if (i === 0) {
            pdf.internal.pageSize.width  = pageWidth;
            pdf.internal.pageSize.height = imgHeight;
          } else {
            pdf.addPage([pageWidth, imgHeight]);
          }

          pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);
        }

        const invNo = (invoiceData.invoiceNumber || "invoice").split("/").pop();
        pdf.save(`Invoice_${invNo}.pdf`);
        setStatus("done");

      } catch (err) {
        console.error("Generate PDF error:", err);
        setStatus("error");
      }
    }, 1500); // tunggu DOM + gambar selesai render

    return () => clearTimeout(timer);
  }, [status, invoiceData]);

  /* =============================
     SPLIT PAGES BY IMAGE COUNT
  ============================== */
  const MAX_IMAGES_PER_PAGE = 6;
  const pages = [];

  if (invoiceData) {
    let currentPage = [];
    let imageCount  = 0;

    (invoiceData.items || []).forEach(item => {
      const count = Array.isArray(item.preview)
        ? item.preview.length
        : item.preview ? 1 : 0;

      if (imageCount + count > MAX_IMAGES_PER_PAGE && currentPage.length) {
        pages.push(currentPage);
        currentPage = [];
        imageCount  = 0;
      }
      currentPage.push(item);
      imageCount += count;
    });

    if (currentPage.length) pages.push(currentPage);
  }

  const total = (invoiceData?.items || []).reduce(
    (acc, item) => acc + Number(item.qty || 0) * Number(item.price || 0), 0
  );

  /* =============================
     REUSABLE STATUS SCREEN
  ============================== */
  const StatusScreen = ({ icon, title, subtitle, color, spin }) => (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0f4f8",
      fontFamily: "'Segoe UI', sans-serif",
      gap: 16,
    }}>
      {spin ? (
        <>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: "4px solid #e2e8f0",
            borderTopColor: "#2c4775",
            animation: "spin 0.8s linear infinite",
          }} />
        </>
      ) : (
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: color + "20",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
        }}>
          {icon}
        </div>
      )}
      <h2 style={{ margin: 0, color: "#1f2937", fontSize: 20 }}>{title}</h2>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>{subtitle}</p>
    </div>
  );

  /* =============================
     STATUS SCREENS
  ============================== */
  if (status === "loading") return (
    <StatusScreen spin
      color="#3b82f6"
      title="Memuat invoice..."
      subtitle="Mohon tunggu sebentar"
    />
  );

  if (status === "done") return (
    <StatusScreen
      icon="✅"
      color="#10b981"
      title="Invoice berhasil diunduh!"
      subtitle="File PDF sudah tersimpan di perangkat Anda"
    />
  );

  if (status === "error") return (
    <StatusScreen
      icon="❌"
      color="#ef4444"
      title="Invoice tidak ditemukan"
      subtitle="Link mungkin sudah tidak valid atau terjadi kesalahan"
    />
  );

  /* =============================
     RENDERING + GENERATING — Invoice paper + spinner
  ============================== */
  if (status === "rendering" || status === "generating") return (
    <>
      {/* Spinner overlay */}
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(240,244,248,0.97)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 9999, fontFamily: "'Segoe UI', sans-serif", gap: 16,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: "4px solid #e2e8f0",
          borderTopColor: "#2c4775",
          animation: "spin 0.8s linear infinite",
        }} />
        <h2 style={{ margin: 0, color: "#1f2937", fontSize: 18 }}>Menyiapkan PDF...</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>File akan otomatis terunduh</p>
      </div>

      {/* Invoice paper — fixed dalam viewport agar html2canvas bisa capture */}
      <div
        ref={invoiceRef}
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: "210mm",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
          background: "#fff",
        }}
      >
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const startIndex = pages.slice(0, pageIndex).reduce((s, p) => s + p.length, 0);

          return (
            <div
              className="dl-invoice-paper"
              key={pageIndex}
              style={{
                width: "210mm",
                minWidth: "210mm",
                background: "#fff",
                padding: "40px",
                boxSizing: "border-box",
                fontFamily: "'Segoe UI', sans-serif",
                color: "#1f2937",
              }}
            >
              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
                <img src={logo} alt="logo" style={{ height: 120, objectFit: "contain" }} crossOrigin="anonymous" />
                <h1 style={{ fontSize: 48, fontWeight: 700, color: "#2c4775", margin: 0 }}>INVOICE</h1>
              </div>

              {/* META */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 20 }}>
                {[
                  `No. Inv : ${invoiceData.invoiceNumber}`,
                  `Tanggal : ${invoiceData.date}`
                ].map((t, i) => (
                  <div key={i} style={{
                    background: "#3f5f9b", color: "white",
                    padding: "8px 14px", fontSize: 13,
                  }}>{t}</div>
                ))}
              </div>

              {/* CUSTOMER */}
              <div style={{
                background: "#3f5f9b", color: "white",
                padding: 20, marginBottom: 20,
              }}>
                <p style={{ margin: "4px 0", fontSize: 14 }}>Kepada Yth :</p>
                <p style={{ margin: "4px 0", fontSize: 14 }}>{invoiceData.kepada}</p>
                <p style={{ margin: "4px 0", fontSize: 14 }}>{invoiceData.branch}</p>
              </div>

              {/* TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 25 }}>
                <thead>
                  <tr>
                    {["No", "Deskripsi", "Unit", "Harga", "Total"].map(h => (
                      <th key={h} style={{
                        background: "#2c4775", color: "white",
                        padding: 10, border: "1px solid #000",
                        fontSize: 13, textAlign: "center",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: 10, border: "1px solid #000", textAlign: "center", fontSize: 13 }}>
                        {startIndex + i + 1}
                      </td>
                      <td style={{ padding: 10, border: "1px solid #000", fontSize: 13 }}>
                        {item.desc}
                        {(item.preview || item.image) && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {(Array.isArray(item.preview || item.image)
                              ? (item.preview || item.image)
                              : [item.preview || item.image]
                            ).map((img, idx) => (
                              <img
                                key={idx} src={img}
                                style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 4 }}
                                crossOrigin="anonymous"
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 10, border: "1px solid #000", textAlign: "center", fontSize: 13 }}>
                        {item.qty}
                      </td>
                      <td style={{ padding: 10, border: "1px solid #000", textAlign: "center", fontSize: 13 }}>
                        {Number(item.price).toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: 10, border: "1px solid #000", textAlign: "center", fontSize: 13 }}>
                        {(item.qty * item.price).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}

                  {isLastPage && (
                    <tr>
                      <td colSpan={3} style={{ border: "none" }} />
                      <td style={{
                        padding: 10, border: "1px solid #000",
                        background: "#3f5f9b", color: "white",
                        textAlign: "center", fontWeight: 600, fontSize: 13,
                      }}>Total</td>
                      <td style={{
                        padding: 10, border: "1px solid #000",
                        textAlign: "center", fontWeight: 600, fontSize: 13,
                      }}>
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 30,
                    marginBottom: 20,
                  }}>
                    {/* PAYMENT */}
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>CARA PEMBAYARAN</h4>
                      <p style={{ margin: "4px 0", fontSize: 14 }}>TRANSFER KE :</p>
                      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0" }}>A.C. 118 00 1022 970 5</h2>
                      <p style={{ margin: "4px 0", fontSize: 14 }}>BANK MANDIRI a.n Dede Syarifah</p>
                    </div>

                    {/* QRIS + TTD (hanya jika signed) */}
                    {isSigned && (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <img
                            src={qris}
                            style={{ width: 200, height: 300, objectFit: "contain" }}
                            crossOrigin="anonymous"
                          />
                          <p style={{ fontSize: 11, color: "#6b7280" }}>Scan QRIS</p>
                        </div>

                        <div style={{ position: "relative", width: 200, height: 180, textAlign: "center" }}>
                          <p style={{
                            position: "absolute", bottom: 20, left: 0, right: 0,
                            fontSize: 13, fontWeight: 500, zIndex: 0,
                          }}>(Dede Syarifah)</p>
                          <img
                            src={stamp}
                            style={{ position: "absolute", top: 0, left: 0, width: 200, objectFit: "contain", opacity: 0.85, zIndex: 1 }}
                            crossOrigin="anonymous"
                          />
                          <img
                            src={ttdStamp}
                            style={{ position: "absolute", top: 0, left: 0, width: 200, objectFit: "contain", zIndex: 2 }}
                            crossOrigin="anonymous"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* FOOTER */}
                  <div style={{
                    marginTop: 40,
                    display: "flex",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#2c4775",
                    gap: 80,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FaGlobe size={20} /> https://flowerplusofficial.com/
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FaInstagram size={20} /> flowerplusofficial
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FaWhatsapp size={20} /> 081316835325
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return null;
};

export default InvoiceDownload;