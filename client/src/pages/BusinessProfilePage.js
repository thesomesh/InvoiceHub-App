import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert } from "../components/UI";
import api from "../services/api";

const BusinessProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [defaultNote, setDefaultNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
const [reportType, setReportType] =
useState("today");

const [
  downloadingReport,
  setDownloadingReport
] = useState(false);


const [customStart, setCustomStart] =
useState("");

const [customEnd, setCustomEnd] =
useState("");
  useEffect(() => {
    if (!user) return;
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setGstin(user.gstin || "");
    setDefaultTaxRate(Number(user.defaultTaxRate ?? 0));
    setDefaultNote(user.defaultNote || "");
  }, [user]);

  const validate = () => {
    const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!phoneRegex.test(String(phone || "").trim())) {
      return "Please enter a valid mobile number";
    }
    if (!String(address || "").trim()) {
      return "Address is required";
    }

    const normalizedGstin = String(gstin || "").trim().toUpperCase();
    if (normalizedGstin && !gstinRegex.test(normalizedGstin)) {
      return "GSTIN format is invalid";
    }

    const tax = Number(defaultTaxRate);
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      return "Default tax % must be between 0 and 100";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
  phone,
  address,
  gstin,
  defaultTaxRate,
  defaultNote,
  timezone:
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone
});
      setSuccess("Business profile updated. New invoices will auto-fill your saved tax %.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update business profile");
    } finally {
      setLoading(false);
    }
  };

const downloadReport = async () => {
  try {
    setDownloadingReport(true);


let url =
  `/invoices/sales-report?type=${reportType}`;


    if (
      reportType === "custom"
    ) {
      if (
        !customStart ||
        !customEnd
      ) {
        alert(
          "Please select start and end date"
        );
        return;
      }

     url +=
`&customStart=${customStart}&customEnd=${customEnd}`;
    }

    const response =
      await api.get(url, {
        responseType: "blob",
      });

    const fileUrl =
      window.URL.createObjectURL(
        new Blob([response.data])
      );

    const link =
      document.createElement("a");

    link.href = fileUrl;

    link.download =
      `sales-report-${reportType}-${Date.now()}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      fileUrl
    );

  } catch (error) {
    console.error(
      "Sales Report Download Error:",
      error
    );

    alert(
      "Failed to download sales report"
    );

  } finally {
    setDownloadingReport(false);
  }
};



  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/dashboard")} className="btn-ghost p-2">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
            Seller Business Profile
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Manage details used for invoice auto-fill and PDF branding.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <Alert message={error} type="error" />
        <Alert message={success} type="success" />
<div>
  <label className="label">Business Owner Name</label>
  <input
    type="text"
    className="input"
    placeholder="Enter your full name"
    value={user?.name || ""}
    disabled={loading}
  />
</div>
       <div>
  <label className="label">
    Business Name
    
  </label>

  <input
    type="text"
    className="input"
    placeholder="Enter business name"
    value={user?.businessName || ""}
    onChange={(e) =>
      updateProfile({ businessName: e.target.value })
    }
    disabled={loading}
  />
</div>
        <div>
          <label className="label">Mobile Number *</label>
          <input
            type="tel"
            className="input"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label">Address *</label>
          <textarea
            className="input resize-none h-20"
            placeholder="Business address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label">GSTIN Number (optional)</label>
          <input
            type="text"
            className="input uppercase"
            placeholder="22AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label">Default Tax % for New Invoices *</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="input"
            value={defaultTaxRate}
            onChange={(e) => setDefaultTaxRate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label">Default Note for New Invoices (optional)</label>
          <textarea
            className="input resize-none h-24"
            placeholder="Thank you for your business. Payment due within 7 days."
            value={defaultNote}
            onChange={(e) => setDefaultNote(e.target.value)}
            disabled={loading}
            maxLength={2000}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

<div className="card p-6 mt-8">
  <div className="mb-5">
    <h2
      className="text-xl font-bold"
      style={{ color: "var(--text)" }}
    >
      Sales Report
    </h2>

    <p
      className="text-sm mt-1"
      style={{ color: "var(--text-muted)" }}
    >
      Download business performance reports
    </p>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">

    <button
      className={
        reportType === "today"
          ? "btn-primary"
          : "btn-secondary"
      }
      onClick={() => setReportType("today")}
    >
      Today
    </button>

    <button
      className={
        reportType === "this-month"
          ? "btn-primary"
          : "btn-secondary"
      }
      onClick={() =>
        setReportType("this-month")
      }
    >
      This Month
    </button>

    <button
      className={
        reportType === "last-month"
          ? "btn-primary"
          : "btn-secondary"
      }
      onClick={() =>
        setReportType("last-month")
      }
    >
      Last Month
    </button>

   

    <button
      className={
        reportType === "custom"
          ? "btn-primary"
          : "btn-secondary"
      }
      onClick={() =>
        setReportType("custom")
      }
    >
      Custom
    </button>
  </div>

  {reportType === "custom" && (
    <div className="mt-5 grid sm:grid-cols-2 gap-4">
      <div>
        <label className="label">
          Start Date
        </label>

        <input
          type="date"
          className="input"
          value={customStart}
          onChange={(e) =>
            setCustomStart(
              e.target.value
            )
          }
        />
      </div>

      <div>
        <label className="label">
          End Date
        </label>

        <input
          type="date"
          className="input"
          value={customEnd}
          onChange={(e) =>
            setCustomEnd(
              e.target.value
            )
          }
        />
      </div>
    </div>
  )}


<button
  className="btn-primary w-full mt-6"
  onClick={downloadReport}
  disabled={downloadingReport}
>
  {downloadingReport
    ? "Downloading..."
    : "Download Sales Report PDF"}
</button>


</div>




    </div>
  );
};

export default BusinessProfilePage;
