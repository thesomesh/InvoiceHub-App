import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { invoiceAPI } from "../services/api";
import { StatusBadge, Spinner, Alert } from "../components/UI";
import { formatCurrency, formatDate } from "../utils/calculations";

const InvoicePreviewPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const taxPercent = Number(invoice?.taxPercentage ?? invoice?.taxRate ?? 0);
  const discountPercent = Number(invoice?.discountPercentage ?? invoice?.discountRate ?? 0);
  const sellerName = String(invoice?.sellerBusinessName || "InvoiceHub").trim();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await invoiceAPI.getById(id);
        setInvoice(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Invoice not found");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDownload = async () => {
    setPdfLoading(true);
    setPdfError("");
    try {
      const res = await invoiceAPI.downloadPDF(id);
      const contentType = res.headers?.["content-type"] || "application/pdf";
      if (!contentType.toLowerCase().includes("application/pdf")) {
        throw new Error("Unexpected response while generating PDF");
      }

      const bytes = new Uint8Array(res.data);
      if (bytes.length < 100) {
        throw new Error("Generated file is too small to be a valid PDF");
      }

      const dispo = res.headers?.["content-disposition"] || "";
      const fileMatch = dispo.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
      const serverFileName = decodeURIComponent((fileMatch?.[1] || fileMatch?.[2] || "").trim());
      const fallbackName = `${invoice.invoiceNumber}.pdf`;
      const safeName = (serverFileName || fallbackName)
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

      const fileName = safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5219);
    } catch {
      setPdfError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <Alert message={error} type="error" />
        <button onClick={() => navigate("/dashboard")} className="btn-ghost mt-4">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="invoice-preview-page page-enter">
      <div className="invoice-preview-topbar">
        <div className="invoice-preview-topbar-left">
          <button onClick={() => navigate("/dashboard")} className="btn-ghost p-2">
            ←
          </button>
          <div>
            <p className="invoice-topbar-label">Invoice Preview</p>
            <div className="invoice-topbar-row">
              <h1 className="invoice-topbar-number">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>
        <button onClick={handleDownload} className="button" type="button" disabled={pdfLoading}>
          <span className="button__text">{pdfLoading ? "Downloading..." : "Download"}</span>
          <span className="button__icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" className="svg">
              <path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path>
              <path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path>
              <path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path>
            </svg>
          </span>
        </button>
      </div>

      <Alert message={pdfError} type="error" className="mb-4" />

      <div className="invoice-paper">
        <section className="invoice-paper-head">
          <div>
            <p className="invoice-head-kicker">Professional Billing</p>
            <h2 className="invoice-head-title">{sellerName}</h2>
            <p className="invoice-head-subtitle">Thank you for your business. Please review the invoice details below.</p>
          </div>
          <div className="invoice-total-pill">
            <span>Total Amount </span>
          <strong>
  {formatCurrency(
    invoice.total
  )}
</strong>
          </div>
        </section>

        <section className="invoice-meta-grid">
          <article className="invoice-meta-card">
            <p className="invoice-meta-label">From</p>
            <p className="invoice-meta-strong">{sellerName}</p>
            {user?.phone && <p className="invoice-meta-muted">{user.phone}</p>}
            {user?.address && <p className="invoice-meta-muted">{user.address}</p>}
            {user?.gstin && <p className="invoice-meta-muted">GSTIN: {user.gstin}</p>}
            <p className="invoice-meta-muted">Generated via InvoiceHub</p>
          </article>

          <article className="invoice-meta-card">
            <p className="invoice-meta-label">Bill To</p>
            <p className="invoice-meta-strong">{invoice.customer?.name}</p>
            <p className="invoice-meta-muted">{invoice.customer?.phone}</p>
            {invoice.customer?.email && <p className="invoice-meta-muted">{invoice.customer.email}</p>}
            {invoice.customer?.address && <p className="invoice-meta-muted">{invoice.customer.address}</p>}
          </article>

          <article className="invoice-meta-card">
            <p className="invoice-meta-label">Invoice Info</p>
            <p className="invoice-meta-muted">
              Number: <span className="invoice-meta-strong">{invoice.invoiceNumber}</span>
            </p>
            <p className="invoice-meta-muted">
              Date: <span className="invoice-meta-strong">{formatDate(invoice.date)}</span>
            </p>
            {invoice.dueDate && (
              <p className="invoice-meta-muted">
                Due: <span className="invoice-meta-strong">{formatDate(invoice.dueDate)}</span>
              </p>
            )}
            <p className="invoice-meta-muted">
              Created: <span className="invoice-meta-strong">{formatDate(invoice.createdAt || invoice.date)}</span>
            </p>
          </article>
        </section>

        <section className="invoice-lines-wrap">
          <div className="overflow-x-auto">
            <table className="invoice-lines-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="invoice-item-name">{item.name}</td>
                    <td className="text-right">{item.qty}</td>
                    <td className="text-right">{formatCurrency(item.price)}</td>
                    <td className="text-right invoice-item-total">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      <section className="invoice-summary-panel">

  {/* SUBTOTAL */}

  <div className="invoice-summary-row">
    <span>Subtotal</span>

    <strong>
      {formatCurrency(
        invoice.subtotal
      )}
    </strong>
  </div>

  {/* DISCOUNT */}

  {Number(
    invoice.discountAmount || 0
  ) > 0 && (

    <div className="invoice-summary-row">

     <span>
        Discount
        ({invoice.discountRate || 0}%)
      </span>

      <strong>
        -{" "}
        {formatCurrency(
          invoice.discountAmount
        )}
      </strong>

    </div>
  )}

  {/* TAX */}

  {Number(
    invoice.taxAmount || 0
  ) > 0 && (

    <div className="invoice-summary-row">

      <span>
        Tax (
        {taxPercent}%)
      </span>

      <strong>
        {formatCurrency(
          invoice.taxAmount
        )}
      </strong>

    </div>
  )}

  {Number(
  invoice.roundOff || 0
) !== 0 && (

  <div className="invoice-summary-row">

    <span>
      Round Off
    </span>

    <strong>

      {Number(
        invoice.roundOff
      ) > 0
        ? "+"
        : ""}

      {formatCurrency(
        invoice.roundOff
      )}

    </strong>

  </div>
)}

  {/* GRAND TOTAL */}

  <div className="invoice-summary-total">

    <span>
      Grand Total
    </span>

    <strong>
  {formatCurrency(
  invoice.total
)}
    </strong>

  </div>

  {/* PAYMENT STATUS */}

  <div className="invoice-summary-row mt-4">
    <span>
      Payment Status
    </span>

    <strong
      style={{
        textTransform:
          "capitalize",

        color:
          invoice.status ===
          "paid"
            ? "#16a34a"
            : invoice.status ===
              "partial"
            ? "#2563eb"
            : invoice.status ===
              "pending"
            ? "#ea580c"
            : "#dc2626",
      }}
    >
      {invoice.status}
    </strong>
  </div>

  {/* PAYMENT METHOD */}

  <div className="invoice-summary-row">
    <span>
      Payment Method
    </span>

    <strong>
      {invoice.paymentMethod ||
        "Not Paid Yet"}
    </strong>
  </div>

  {/* PAID */}

  <div className="invoice-summary-row">
    <span>
      Amount Paid
    </span>

    <strong
      style={{
        color: "#16a34a",
      }}
    >
      {formatCurrency(
        invoice.amountPaid ||
          0
      )}
    </strong>
  </div>

  {/* DUE */}

  <div className="invoice-summary-row">
    <span>
      Remaining Due
    </span>

    <strong
      style={{
        color: "#dc2626",
      }}
    >
      {formatCurrency(
        invoice.dueAmount ||
          0
      )}
    </strong>
  </div>

</section>
{/* PAYMENT HISTORY */}

{invoice.paymentHistory &&
 invoice.paymentHistory.length > 0 && (

  <section className="invoice-notes-block">

    <p className="invoice-notes-label">
      Payment History
    </p>

    <div className="space-y-3 mt-4">

      {invoice.paymentHistory.map(
        (payment, index) => (

          <div
            key={index}
            className="flex justify-between items-center p-4 rounded-2xl border border-gray-100 bg-gray-50"
          >

            <div>

              <p className="font-semibold text-gray-900">
                {payment.amount < 0
                  ? "Refunded"
                  : payment.method}
              </p>

              <p className="text-sm text-gray-500">
                {new Date(
  payment.date
).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
})}
              </p>

            </div>

            <strong
              className={`text-lg ${
                payment.amount < 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {payment.amount < 0
                ? "-"
                : "+"}

              {formatCurrency(
                Math.abs(
                  payment.amount
                )
              )}
            </strong>

          </div>

        )
      )}

    </div>

  </section>
)}
        {invoice.notes && (
          
          <section className="invoice-notes-block">
            <p className="invoice-notes-label">Notes</p>
            <p>{invoice.notes}</p>
          </section>
        )}
      </div>
    </div>



  );
};

export default InvoicePreviewPage;
