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

const PAIR_PAGE_SIZE = 10;

const InvoicePreview = ({ data, onBack }) => {
  const { invoices, setInvoices, refreshInvoices } = useApp();
  const invoiceRef   = useRef();
  const location     = useLocation();
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [generatedNumber, setGeneratedNumber] = useState("");
  const [searchParams] = useSearchParams();
  const [invoiceDetail, setInvoiceDetail] = useState(null);

  // ── Pair & Print (A5 only) ──
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairedInvoice, setPairedInvoice] = useState(null);
  const [a5List, setA5List]               = useState([]);
  const [pairMode, setPairMode]           = useState("list");
  const [pairSearch, setPairSearch]       = useState("");
  const [pairPage, setPairPage]           = useState(1);

  const openPairModal = () => {
    fetch("http://127.0.0.1:8000/api/invoices?paper_size=a5&per_page=200")
      .then(res => res.json())
      .then(result => {
        const raw = result.data?.data || result.data || result || [];
        const list = raw.filter(
          inv => inv.paper_size === "a5" && String(inv.id) !== String(invoiceData?.id)
        );
        setA5List(list);
      })
      .catch(() => setA5List(
        invoices.filter(inv => inv.paper_size === "a5" && String(inv.id) !== String(invoiceData?.id))
      ));
    setPairMode("list");
    setPairSearch("");
    setPairPage(1);
    setShowPairModal(true);
  };

  useEffect(() => {
    if (!data && id) {
      fetch(`http://127.0.0.1:8000/api/invoices/${id}`)
        .then(res => res.json())
        .then(result => setInvoiceDetail(result.data || result))
        .catch(err => console.error("Fetch invoice detail error:", err));
    }
  }, [id, data]);

  const invoiceData =
    data ||
    invoiceDetail ||
    location.state?.invoice ||
    invoices.find((inv) => String(inv.id) === String(id));

  // ── Tentukan paper_size ──
  const hasAnyImage = (invoiceData?.items || []).some(
    item => item.preview || item.image
  );
  const isSmallAuto = (invoiceData?.items || []).length <= 1 && !hasAnyImage;

  const paperSizeFromUrl = searchParams.get("paper_size");
  const paperSize =
    invoiceData?.paper_size ??
    paperSizeFromUrl ??
    (isSmallAuto ? "a5" : "a4");
  const isA5 = paperSize === "a5";

  useEffect(() => {
    const invNumber = invoiceData?.invoiceNumber;
    if (!invNumber) {
      fetch(`http://127.0.0.1:8000/api/invoices/preview-number?paper_size=${paperSize}`)
        .then(res => res.json())
        .then(d => setGeneratedNumber(d.invoiceNumber))
        .catch(err => console.error("Preview number error:", err));
    }
  }, [invoiceData?.invoiceNumber, paperSize]);

  // ── pagination A4 ──
  const MAX_ITEMS_PER_A4_PAGE = 10;
  const allItems = invoiceData?.items || [];

  const pages = isA5
    ? [allItems.slice(0, 1)]
    : allItems.reduce((acc, item, i) => {
        const pageIndex = Math.floor(i / MAX_ITEMS_PER_A4_PAGE);
        if (!acc[pageIndex]) acc[pageIndex] = [];
        acc[pageIndex].push(item);
        return acc;
      }, []);

  // ── Auto-scale A4 ──
  useEffect(() => {
    if (isA5 || !invoiceData) return;
    const A4_HEIGHT_PX = 1122;
    const A4_WIDTH_PX  = 794;

    const scalePages = () => {
      const papers = document.querySelectorAll(".invoice-paper-scalable");
      papers.forEach((paper) => {
        paper.style.transform      = "";
        paper.style.transformOrigin = "";
        paper.style.marginBottom   = "";

        const containerWidth = paper.parentElement?.offsetWidth || A4_WIDTH_PX;
        const scaleByWidth   = containerWidth / A4_WIDTH_PX;

        if (scaleByWidth < 1) {
          paper.style.transformOrigin = "top center";
          paper.style.transform       = `scale(${scaleByWidth})`;
          paper.style.marginBottom    = `-${A4_HEIGHT_PX * (1 - scaleByWidth)}px`;
        }
      });
    };

    const timer = setTimeout(scalePages, 150);
    return () => clearTimeout(timer);
  }, [invoiceData, isA5, pages.length]);

  if (!invoiceData) return (
    <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
      Memuat invoice...
    </div>
  );

  const invoiceType = searchParams.get("type") || invoiceData.type || "normal";
  const isSigned    = isA5 ? false : (invoiceType !== "unsigned");

  /* ── helpers ── */
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };
  const formatDateCompact = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
  };
  const sanitizeFileName = (text) =>
    String(text || "").replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, "_");

  /* ── totals ── */
  const subtotal     = allItems.reduce((acc, item) => acc + Number(item.qty||0)*Number(item.price||0), 0);
  const shippingCost = Number(invoiceData.shippingCost || 0);
  const bankInfo     = getBankInfo(invoiceData.bank || "");
  const grandTotal   = subtotal + shippingCost;

  /* ── PRINT ──
     - Jika A5 + ada pasangan  → pair print (2 invoice dalam 1 lembar A4)
     - Jika A5 + tanpa pasangan → single print (1 invoice A5 saja)
     - Jika A4                  → print halaman A4 seperti biasa
  ── */
  const handlePrint = async () => {
    // ── A5 PAIR PRINT ──
    if (isA5 && pairedInvoice) {
      const sheet = document.querySelector(".inv-a5-pair-sheet");
      if (!sheet) return;
      const [el1, el2] = sheet.querySelectorAll(".paper-a5");
      if (!el1 || !el2) return;
      const [canvas1, canvas2] = await Promise.all([
        html2canvas(el1, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false }),
        html2canvas(el2, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false }),
      ]);
      const img1 = canvas1.toDataURL("image/png");
      const img2 = canvas2.toDataURL("image/png");
      const printWindow = window.open("", "_blank", "width=900,height=700");
      printWindow.document.write(`<!DOCTYPE html>
<html><head>
  <title>Pair Print A5</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; background: #fff; }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .page { width: 210mm; height: 297mm; margin: 0 auto; background: #fff; display: flex; flex-direction: column; overflow: hidden; }
    .half { width: 210mm; height: 148.5mm; overflow: hidden; flex-shrink: 0; }
    .half img { display: block; width: 210mm; height: 148.5mm; object-fit: contain; object-position: top left; }
    .cut-line { width: 100%; flex-shrink: 0; border-top: 1.5px dashed #bbb; display: flex; align-items: center; justify-content: center; }
    .cut-label { background: #fff; font-size: 9px; color: #aaa; font-family: Arial, sans-serif; font-weight: 700; padding: 0 10px; margin-top: -7px; letter-spacing: 1px; }
  </style>
</head><body>
  <div class="page">
    <div class="half"><img src="${img1}" /></div>
    <div class="cut-line"><span class="cut-label">✂ POTONG</span></div>
    <div class="half"><img src="${img2}" /></div>
  </div>
</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
      return;
    }

    // ── A5 SINGLE PRINT (tanpa pasangan) ──
    // Pakai A4 portrait, invoice A5 di setengah atas (148.5mm),
    // sisa bawah kosong — identik dengan preview 210mm x 148.5mm.
    if (isA5 && !pairedInvoice) {
      const targetEl = invoiceRef.current?.querySelector(".paper-a5");
      if (!targetEl) return;
      const prevTransform = targetEl.style.transform;
      targetEl.style.transform = "";
      const canvas = await html2canvas(targetEl, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: "#ffffff", logging: false,
        width: targetEl.scrollWidth,
        height: targetEl.scrollHeight,
      });
      targetEl.style.transform = prevTransform;
      const imgData = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank", "width=900,height=700");
      printWindow.document.write(`<!DOCTYPE html>
<html><head>
  <title>Invoice - ${invoiceData.invoiceNumber || "Draft"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; background: #fff; }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .page { width: 210mm; height: 297mm; margin: 0 auto; background: #fff; display: flex; flex-direction: column; overflow: hidden; }
    .half { width: 210mm; height: 148.5mm; overflow: hidden; flex-shrink: 0; }
    .half img { display: block; width: 210mm; height: 148.5mm; object-fit: fill; }
    .empty { flex: 1; background: #fff; }
  </style>
</head><body>
  <div class="page">
    <div class="half"><img src="${imgData}" /></div>
    <div class="empty"></div>
  </div>
</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
      return;
    }

    // ── A4 PRINT ──
    const targetEl = invoiceRef.current.querySelector(".invoice-paper-scalable");
    if (!targetEl) return;
    const prevTransform    = targetEl.style.transform;
    const prevMarginBottom = targetEl.style.marginBottom;
    targetEl.style.transform    = "";
    targetEl.style.marginBottom = "";
    const canvas = await html2canvas(targetEl, {
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: "#ffffff", logging: false,
      width: targetEl.scrollWidth, height: targetEl.scrollHeight,
    });
    targetEl.style.transform    = prevTransform;
    targetEl.style.marginBottom = prevMarginBottom;
    const imgData = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`<!DOCTYPE html>
<html><head>
  <title>Invoice - ${invoiceData.invoiceNumber || "Draft"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #fff; }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { width: 210mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .page { width: 210mm; height: auto; margin: 0 auto; background: #fff; overflow: hidden; }
    .page img { display: block; width: 210mm; height: auto; }
  </style>
</head><body>
  <div class="page"><img src="${imgData}" /></div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
  };

  /* ── download PDF ── */
  const handleDownloadPDF = async () => {
    const pageElements = isA5
      ? [invoiceRef.current.querySelector(".paper-a5")]
      : Array.from(invoiceRef.current.querySelectorAll(".invoice-paper-scalable"));
    if (!pageElements || pageElements.length === 0) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [210, 297] });
    for (let i = 0; i < pageElements.length; i++) {
      const el = pageElements[i];
      const prevTransform    = el.style.transform;
      const prevMarginBottom = el.style.marginBottom;
      el.style.transform    = "";
      el.style.marginBottom = "";
      const canvas = await html2canvas(el, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: "#ffffff", logging: false,
        width: el.scrollWidth, height: el.scrollHeight,
      });
      el.style.transform    = prevTransform;
      el.style.marginBottom = prevMarginBottom;
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pageW   = 210;
      const pageH   = isA5 ? 148.5 : Math.min(297, Math.round((canvas.height * 210) / canvas.width));
      if (i === 0) { pdf.internal.pageSize.width = pageW; pdf.internal.pageSize.height = pageH; }
      else         { pdf.addPage([pageW, pageH]); }
      pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
    }
    const branch     = sanitizeFileName(invoiceData.branch);
    const bank       = sanitizeFileName(invoiceData.bank || "BANK");
    const invoiceNo  = (invoiceData.invoiceNumber || "").split("/")[0];
    const customer   = sanitizeFileName(invoiceData.kepada).slice(0, 30);
    const tanggal    = formatDateCompact(invoiceData.date);
    const sizeSuffix = isA5 ? "_A5" : "_A4";
    const ttdSuffix  = (!isA5 && isSigned) ? "_TTD" : "";
    pdf.save(`FP_${branch}_${bank}_${invoiceNo}_${customer}_${tanggal}${ttdSuffix}${sizeSuffix}.pdf`);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!invoiceData.bank) { alert("Bank belum dipilih"); return; }
    try {
      const isEdit = Boolean(invoiceData.id);
      const url = isEdit
        ? `http://127.0.0.1:8000/api/invoices/${invoiceData.id}`
        : "http://127.0.0.1:8000/api/invoices";
      const sanitizedItems = allItems.map(item => ({
        ...item, qty: Number(item.qty || 0), price: Number(item.price || 0),
      }));
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ ...invoiceData, type: invoiceType, paper_size: paperSize, items: sanitizedItems }),
      });
      if (!response.ok) {
        const t = await response.text();
        console.error("SERVER ERROR:", t);
        throw new Error("Server error");
      }
      const result = await response.json();

      if (isEdit) {
        setInvoices(prev => [result.data, ...prev.filter(inv => inv.id !== invoiceData.id)]);
      } else {
        setInvoices(prev => [result.data, ...prev]);
      }

      navigate("/invoice");
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleSwitchType = () => {
    const newType = isSigned ? "unsigned" : "signed";
    navigate(`/invoice/preview/${invoiceData.id || "new"}?type=${newType}`, { state: { invoice: invoiceData } });
  };

  /* ── Render A5 block (single & pair preview) ── */
  const renderA5Block = (inv, extraClass = "", refProp = null) => {
    if (!inv) return null;
    const pItems    = (inv.items || []).slice(0, 1);
    const pSubtotal = pItems.reduce((a, it) => a + Number(it.qty||0)*Number(it.price||0), 0);
    const pShipping = Number(inv.shippingCost || 0);
    const pTotal    = pSubtotal + pShipping;
    const pBankInfo = getBankInfo(inv.bank || "");
    const pHasImg   = pItems.some(it => it.preview || it.image);
    const pImgs     = pItems.flatMap(it => {
      const src = it.preview || it.image;
      if (!src) return [];
      return Array.isArray(src) ? src : [src];
    });

    return (
      <div ref={refProp} className={`invoice-paper paper-a5 ${extraClass}`}>
        <div className="inv-a5-body">
          <div className="inv-header">
            <img src={logo} alt="logo" className="invoice-logo" />
            <div className="inv-header-right">
              <h1 className="inv-title">INVOICE</h1>
              <div className="inv-meta">
                <div>No. Inv : {inv.invoiceNumber || ""}</div>
                <div>Tanggal : {formatDateDisplay(inv.date)}</div>
              </div>
            </div>
          </div>
          <div className="inv-customer" lang="id" spellCheck={false}>
            <p className="inv-customer-yth">Kepada Yth</p>
            <h5>{inv.kepada}</h5>
            <p>{inv.branch}</p>
          </div>
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width:"6%" }}>No</th>
                <th style={{ width:"44%" }}>Deskripsi</th>
                <th style={{ width:"12%" }}>Unit</th>
                <th style={{ width:"19%" }}>Harga (Rp)</th>
                <th style={{ width:"19%" }}>Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {pItems.map((item, i) => (
                <tr key={i} className={!pHasImg ? "inv-row-last-a5" : ""}>
                  <td className="inv-td-center">{i + 1}</td>
                  <td>{item.desc}</td>
                  <td className="inv-td-center">{item.qty}</td>
                  <td className="inv-td-center">{Number(item.price).toLocaleString("id-ID")}</td>
                  <td className="inv-td-center">{(Number(item.qty)*Number(item.price)).toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {pHasImg && (
                <tr className="inv-images-row">
                  <td className="inv-td-center"></td>
                  <td className="inv-images-cell">
                    <div className={pImgs.length === 1 ? "inv-img-wrap-single" : "inv-img-wrap-grid"}>
                      {pImgs.map((src, idx) => (
                        <img key={idx} src={src} className={pImgs.length === 1 ? "inv-img-single" : "inv-img-grid"} alt="" />
                      ))}
                    </div>
                  </td>
                  <td></td><td></td><td></td>
                </tr>
              )}
              {pShipping > 0 && (
                <tr className="grand-total-row">
                  <td colSpan={3} style={{ border:"none", background:"transparent" }}></td>
                  <td className="total-label shipping-label">Ongkos Kirim</td>
                  <td className="total-value">{pShipping.toLocaleString("id-ID")}</td>
                </tr>
              )}
              <tr className="grand-total-row">
                <td colSpan={3} style={{ border:"none", background:"transparent" }}></td>
                <td className="total-label grand-label">Total Tagihan</td>
                <td className="total-value grand-value">{pTotal.toLocaleString("id-ID")}</td>
              </tr>
            </tbody>
          </table>
        <div className={`inv-payment-row ${pBankInfo.norek === null ? "inv-payment-row-tunai" : ""}`}>
          <div className="payment" style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
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
          <p className={pBankInfo.norek === null ? "name-tunai" : ""} style={{ fontSize:"14px", fontWeight:"600", color:"#1f2937", width:"38%", textAlign:"center", margin:0, padding:0, border:"none", flexShrink:0, alignSelf:"flex-end", paddingBottom:"2px" }}>
            (Dede Syarifah)
          </p>
        </div>
        </div>
        <div className="inv-footer">
          <div><FaGlobe size={15} /> https://flowerplusofficial.com</div>
          <div><FaInstagram size={15} /> flowerplusofficial</div>
          <div><FaWhatsapp size={15} /> 081316835325</div>
        </div>
      </div>
    );
  };

  /* ── Render blok invoice A4 ── */
  const renderInvoiceBlock = (pageItems, pageIndex, totalPages, startIndex) => {
    const isLastPage = pageIndex === totalPages - 1;
    const allImagesOnPage = pageItems.flatMap(item => {
      const imgs = item.preview || item.image;
      if (!imgs) return [];
      return Array.isArray(imgs) ? imgs : [imgs];
    });
    const hasImages   = allImagesOnPage.length > 0;
    const isSingleImg = allImagesOnPage.length === 1;

    return (
      <>
        <div className="inv-header">
          <img src={logo} alt="logo" className="invoice-logo" />
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
              <th style={{ width:"6%" }}>No</th>
              <th style={{ width:"44%" }}>Deskripsi</th>
              <th style={{ width:"12%" }}>Unit</th>
              <th style={{ width:"19%" }}>Harga (Rp)</th>
              <th style={{ width:"19%" }}>Total (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, i) => {
              const isLastItem = i === pageItems.length - 1;
              const showBottomBorder = isA5 && !hasImages && isLastItem;
              return (
                <tr key={i} className={showBottomBorder ? "inv-row-last-a5" : ""}>
                  <td className="inv-td-center">{startIndex + i + 1}</td>
                  <td>{item.desc}</td>
                  <td className="inv-td-center">{item.qty}</td>
                  <td className="inv-td-center">{Number(item.price).toLocaleString("id-ID")}</td>
                  <td className="inv-td-center">{(Number(item.qty)*Number(item.price)).toLocaleString("id-ID")}</td>
                </tr>
              );
            })}
            {hasImages && (
              <tr className="inv-images-row">
                <td className="inv-td-center"></td>
                <td className="inv-images-cell">
                  <div className={isSingleImg ? "inv-img-wrap-single" : "inv-img-wrap-grid"}>
                    {allImagesOnPage.map((img, idx) => (
                      <img key={idx} src={img} className={isSingleImg ? "inv-img-single" : "inv-img-grid"} alt="" />
                    ))}
                  </div>
                </td>
                <td></td><td></td><td></td>
              </tr>
            )}
            {isLastPage && (
              <>
                {shippingCost > 0 && (
                  <tr className="grand-total-row">
                    <td colSpan={3} style={{ border:"none", background:"transparent" }}></td>
                    <td className="total-label shipping-label">Ongkos Kirim</td>
                    <td className="total-value">{shippingCost.toLocaleString("id-ID")}</td>
                  </tr>
                )}
                <tr className="grand-total-row">
                  <td colSpan={3} style={{ border:"none", background:"transparent" }}></td>
                  <td className="total-label grand-label">Total Tagihan</td>
                  <td className="total-value grand-value">{grandTotal.toLocaleString("id-ID")}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        {isLastPage && (
          <>
            <div className="inv-payment-row">
              <div className="payment" style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
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
                    <p style={{ fontSize:"10px", fontWeight:"500", color:"#374151", textAlign:"center", margin:"0 0 4px 0", lineHeight:"1.4" }}>
                      Untuk pembayaran bisa<br />Scan QR dibawah
                    </p>
                    <img src={qris} style={{ width:"150px", height:"150px", objectFit:"contain" }} alt="QRIS" />
                  </div>
                  <div className="inv-signed-stamp">
                    <div className="inv-stamp-wrap">
                      <p style={{ position:"absolute", bottom:"16px", left:0, right:0, fontSize:"12px", color:"#1f2937", fontWeight:"500", zIndex:0, textAlign:"center" }}>
                        (Dede Syarifah)
                      </p>
                      <img src={stamp} style={{ position:"absolute", top:0, left:0, width:"160px", objectFit:"contain", opacity:0.85, zIndex:1 }} alt="" />
                      <img src={ttdStamp} style={{ position:"absolute", top:0, left:0, width:"160px", objectFit:"contain", zIndex:2 }} alt="" />
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontSize:"15px", fontWeight:"600", color:"#1f2937", width:"38%", textAlign:"center", margin:0, padding:0, border:"none", flexShrink:0, alignSelf:"flex-end", paddingBottom:"2px" }}>
                  (Dede Syarifah)
                </p>
              )}
            </div>
            <div className="inv-footer">
              <div><FaGlobe size={20} /> https://flowerplusofficial.com</div>
              <div><FaInstagram size={20} /> flowerplusofficial</div>
              <div><FaWhatsapp size={20} /> 081316835325</div>
            </div>
          </>
        )}
        {!isLastPage && (
          <div className="inv-page-indicator">Halaman {pageIndex + 1} dari {totalPages}</div>
        )}
      </>
    );
  };

  /* ── Modal: filter + pagination ── */
  const filteredA5 = a5List.filter(inv => {
    const q = pairSearch.toLowerCase();
    return (
      (inv.kepada || "").toLowerCase().includes(q) ||
      (inv.invoiceNumber || "").toLowerCase().includes(q) ||
      (inv.branch || "").toLowerCase().includes(q)
    );
  });
  const totalPairPages = Math.ceil(filteredA5.length / PAIR_PAGE_SIZE);
  const pagedA5 = filteredA5.slice((pairPage - 1) * PAIR_PAGE_SIZE, pairPage * PAIR_PAGE_SIZE);

  /* ============================
     RENDER UTAMA
  ============================ */
  return (
    <>
      <div ref={invoiceRef} className="invoice-preview-wrapper">
        {isA5 ? (
          pairedInvoice ? (
            <div className="inv-a5-pair-sheet" style={{
              width:"210mm", minWidth:"210mm", background:"#fff",
              margin:"0 auto 20px auto",
              boxShadow:"0 1px 3px rgba(0,0,0,0.12),0 4px 16px rgba(0,0,0,0.10),0 8px 32px rgba(0,0,0,0.08)",
            }}>
              {renderA5Block(
                { ...invoiceData, invoiceNumber: invoiceData.invoiceNumber || generatedNumber },
                "paper-a5-top", null
              )}
              <div className="inv-cut-line">
                <span className="inv-cut-label">✂ POTONG</span>
              </div>
              {renderA5Block(pairedInvoice, "paper-a5-bottom", null)}
            </div>
          ) : (
            <div className="inv-a5-sheet">
              <div className="invoice-paper paper-a5">
                {renderInvoiceBlock(pages[0] || [], 0, 1, 0)}
              </div>
            </div>
          )
        ) : (
          <>
          {pages.map((pageItems, pageIndex) => (
            <div key={pageIndex} className="invoice-paper invoice-paper-scalable" id={`invoice-page-${pageIndex}`} style={{ padding: 0 }}>
              <div className="inv-a4-inner">
                {renderInvoiceBlock(pageItems, pageIndex, pages.length, pageIndex * MAX_ITEMS_PER_A4_PAGE)}
              </div>
            </div>
          ))}
          </>
        )}
      </div>

      {/* ── MODAL PAIR & PRINT ── */}
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
              {["list","new"].map(m => (
                <button key={m}
                  className={`pair-tab-btn ${pairMode === m ? "active" : ""}`}
                  onClick={() => { setPairMode(m); setPairPage(1); }}
                >
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
                  onChange={e => { setPairSearch(e.target.value); setPairPage(1); }}
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
                    {pagedA5.map(inv => (
                      <button key={inv.id}
                        className={`pair-list-item ${pairedInvoice?.id === inv.id ? "selected" : ""}`}
                        onClick={() => { setPairedInvoice(inv); setShowPairModal(false); }}
                      >
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
                  <button className="pair-new-btn"
                    onClick={() => { setShowPairModal(false); navigate("/invoice/create"); }}
                  >
                    + Buat Invoice Baru
                  </button>
                </div>
              )}
            </div>

            {pairMode === "list" && totalPairPages > 1 && (
              <div className="pair-pagination">
                <button className="pair-page-btn" disabled={pairPage === 1} onClick={() => setPairPage(p => p - 1)}>
                  ‹ Prev
                </button>
                <span className="pair-page-info">{pairPage} / {totalPairPages}</span>
                <button className="pair-page-btn" disabled={pairPage === totalPairPages} onClick={() => setPairPage(p => p + 1)}>
                  Next ›
                </button>
              </div>
            )}

            <div className="pair-modal-footer">
              <button className="pair-cancel-btn" onClick={() => setShowPairModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
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
          {/* Switch TTD — hanya A4 */}
          {!isA5 && (
            <button className="ia-btn ia-btn-switch" onClick={handleSwitchType}>
              <Eye size={16} />
              <span>{isSigned ? "Tanpa TTD" : "Dengan TTD"}</span>
            </button>
          )}

          {/* Pilih Pasangan — hanya A5, tombol opsional terpisah dari Print */}
          {isA5 && (
            <button
              className={`ia-btn ia-btn-switch${pairedInvoice ? " ia-btn-paired" : ""}`}
              onClick={openPairModal}
            >
              <Printer size={16} />
              <span>{pairedInvoice ? "Ganti Pasangan" : "Pilih Pasangan"}</span>
            </button>
          )}

          {/* Print — selalu bisa diklik, baik single maupun pair */}
          <button className="ia-btn ia-btn-print" onClick={handlePrint}>
            <Printer size={16} /><span>Print</span>
          </button>

          <button className="ia-btn ia-btn-save" onClick={handleSave}>
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