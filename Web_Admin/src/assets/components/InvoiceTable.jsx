import "../Style/InvoiceTable.css";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

const InvoiceTable = () => {
  const { invoices } = useApp();

  if (!Array.isArray(invoices)) return null;
  const navigate = useNavigate();

  return (
    <div className="recent-card">

      <div className="recent-header">
        <div>
          <h3>Invoice Terbaru</h3>
          <p>Aktivitas invoice terkini</p>
        </div>

        <button
          className="view-all"
          onClick={() => navigate("/invoice")}
        >
          Lihat Semua →
        </button>
      </div>

      <div className="invoice-list">
        {invoices
        .slice(0, 5)
          .map((invoice, index) => (
            <div className="invoice-item" key={index}>
              
              <div className="invoice-left">
                <div className="invoice-avatar">
                  {(invoice.kepada || invoice.customer || "C").charAt(0)}
                </div>

                <div>
                  <h4>{invoice.kepada || invoice.customer}</h4>
                  <span>{invoice.invoiceNumber || invoice.id}</span>
                </div>
              </div>

              <div className="invoice-right">
                <div className="invoice-amount">
                  <strong>{invoice.amount}</strong>
                  <span>{invoice.date}</span>
                </div>
              </div>

            </div>
        ))}
      </div>

    </div>
  );
};

export default InvoiceTable;