import React, { useState } from "react";
import api from "../services/api";

const ReportsPage = () => {
  const [downloadingInventory,
  setDownloadingInventory] =
  useState(false);

const [downloadingPurchase,
  setDownloadingPurchase] =
  useState(false);

const [downloadingSales,
  setDownloadingSales] =
  useState(false);
const [includeProductSales,
  setIncludeProductSales] =
  useState(false);
  const [salesStartDate,
  setSalesStartDate] =
  useState("");

const [salesEndDate,
  setSalesEndDate] =
  useState("");
  
const [purchaseStartDate,
  setPurchaseStartDate] =
  useState("");

const [purchaseEndDate,
  setPurchaseEndDate] =
  useState("");
  const [salesPeriod, setSalesPeriod] =
    useState("today");

  const [purchasePeriod, setPurchasePeriod] =
    useState("today");

  const [profitPeriod, setProfitPeriod] =
    useState("today");

const [analysisMonths, setAnalysisMonths] =
  useState(3);
const downloadProductReport = async () => {
  try {
   setDownloadingInventory(true);

    const response = await api.get(
      "/invoices/product-report/pdf",
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-report-${Date.now()}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
  console.error("Download Error:", error);

  let message = "Failed to download product report";

  if (error.response?.data) {
    try {
      const text = await error.response.data.text();
      const data = JSON.parse(text);
      message = data.message || message;
    } catch {
      // Ignore parsing errors
    }
  }

  alert(message);
} finally {
   setDownloadingInventory(false);
  }
};
const downloadSalesReport = async () => {
  try {
    setDownloadingSales(true);

    const response = await api.get(
      "/invoices/sales-report",
      {
      params: {
  type: salesPeriod,
  customStart: salesStartDate,
  customEnd: salesEndDate,
    includeProductSales
},
        responseType: "blob"
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `sales-report-${Date.now()}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error) {
    alert("Failed to download sales report");
  } finally {
    setDownloadingSales(false);
  }
};
const downloadPurchaseReport = async () => {
  try {
 setDownloadingPurchase(true);

    const response = await api.get(
      "/invoices/purchase-report",
      {
       params: {
  type: purchasePeriod,
  customStart:
    purchaseStartDate,
  customEnd:
    purchaseEndDate,
  analysisMonths
},
        responseType: "blob"
      }
    );

    const url =
      window.URL.createObjectURL(
        new Blob([response.data])
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `purchase-report-${Date.now()}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } finally {
  setDownloadingPurchase(false);
  }
};
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Reports & Analytics
        </h1>

        <p className="text-gray-500 mt-1">
          Generate and download business reports
        </p>
      </div>

      {/* SALES REPORT */}

  <div className="card p-6 mb-8 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(79,70,229,0.15)]">
        <h2 className="text-xl font-bold mb-2">
          Sales Report
        </h2>

        <p className="text-gray-500 mb-5">
          Download sales performance reports
        </p>
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

  <button
    className={
      salesPeriod === "today"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setSalesPeriod("today")
    }
  >
    Today
  </button>

  <button
    className={
      salesPeriod === "this-month"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setSalesPeriod("this-month")
    }
  >
    This Month
  </button>

  <button
    className={
      salesPeriod === "last-month"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setSalesPeriod("last-month")
    }
  >
    Last Month
  </button>

  <button
    className={
      salesPeriod === "custom"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setSalesPeriod("custom")
    }
  >
    Custom
  </button>

</div>

{salesPeriod === "custom" && (
  <div className="mt-5 grid md:grid-cols-2 gap-4">

    <div>
      <label className="label">
        Start Date
      </label>

      <input
        type="date"
        className="input"
        value={salesStartDate}
        onChange={(e) =>
          setSalesStartDate(
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
        value={salesEndDate}
        onChange={(e) =>
          setSalesEndDate(
            e.target.value
          )
        }
      />
    </div>

  </div>
)}

      
  <div className="mt-6"> </div>     
        <div className="space-y-3 mb-5">
          <label className="flex gap-2">
  <input
    type="checkbox"
    checked={includeProductSales}
    onChange={(e) =>
      setIncludeProductSales(
        e.target.checked
      )
    }
  />
  Product Sales Details
</label>
        </div>
  <div className="mt-6"> </div>     
      <button
  onClick={downloadSalesReport}
  disabled={downloadingSales}
  className={`
    flex items-center justify-center
    gap-2 w-full px-5 py-3
    rounded-lg font-semibold
    transition-all duration-300
    ${
      downloadingSales
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95"
    }
    text-white shadow-md
  `}
>
  {downloadingSales ? (
    <>
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Downloading...
    </>
  ) : (
    <>⬇ Download Sales Report</>
  )}
</button>
      </div>



      {/* PURCHASE REPORT */}

<div className="card p-6 mb-8 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(79,70,229,0.15)]">
        <h2 className="text-xl font-bold mb-2">
          Purchase Report
        </h2>

        <p className="text-gray-500 mb-5">
          Download purchase history reports
        </p>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

  <button
    className={
      purchasePeriod === "today"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setPurchasePeriod("today")
    }
  >
    Today
  </button>

  <button
    className={
      purchasePeriod === "this-month"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setPurchasePeriod("this-month")
    }
  >
    This Month
  </button>

  <button
    className={
      purchasePeriod === "last-month"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setPurchasePeriod("last-month")
    }
  >
    Last Month
  </button>

  <button
    className={
      purchasePeriod === "custom"
        ? "btn-primary"
        : "btn-secondary"
    }
    onClick={() =>
      setPurchasePeriod("custom")
    }
  >
    Custom
  </button>

</div>

{purchasePeriod === "custom" && (

  <>
    <div className="mt-5 grid md:grid-cols-2 gap-4">

      <div>
        <label className="label">
          Start Date
        </label>

        <input
          type="date"
          className="input"
          value={purchaseStartDate}
          onChange={(e) =>
            setPurchaseStartDate(
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
          value={purchaseEndDate}
          onChange={(e) =>
            setPurchaseEndDate(
              e.target.value
            )
          }
        />
      </div>

    </div>

<div className="mt-4 max-w-md">
      <label className="label">
        Purchase Analysis Period
      </label>

      <select
        className="input"
        value={analysisMonths}
        onChange={(e) =>
          setAnalysisMonths(
            Number(e.target.value)
          )
        }
      >
        <option value={3}>
          Last 3 Months
        </option>

        <option value={6}>
          Last 6 Months
        </option>

        <option value={9}>
          Last 9 Months
        </option>

        <option value={12}>
          Last 12 Months (1 Year)
        </option>
      </select>
    </div>

  </>

)}

   <div className="mt-6"> </div>     
    <button
  onClick={downloadPurchaseReport}
  disabled={downloadingPurchase}
  className={`
    flex items-center justify-center
    gap-2 w-full px-5 py-3
    rounded-lg font-semibold
    transition-all duration-300
    ${
      downloadingPurchase
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
    }
    text-white shadow-md
  `}
>
  {downloadingPurchase ? (
    <>
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      Downloading...
    </>
  ) : (
    <>⬇ Download Purchase Report</>
  )}
</button>
      </div>

      {/* INVENTORY REPORT */}

     <div className="card p-6 mb-8 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(79,70,229,0.15)]">
        <h2 className="text-xl font-bold mb-2">
          Inventory Report
        </h2>

        <p className="text-gray-500 mb-5">
          Inventory and stock analysis
        </p>



  <button
    onClick={downloadProductReport}
  disabled={downloadingInventory}
    className={`
      flex items-center justify-center
      gap-2 w-full px-5 py-3
    rounded-lg font-semibold
      transition-all duration-300
      ${
    downloadingInventory
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
      }
      text-white shadow-md
    `}
  >
   {downloadingInventory ? (
      <>
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        Downloading...
      </>
    ) : (
   <>⬇ Download Inventory Report</>
    )}
  </button>
      </div>

    </div>
  );
};

export default ReportsPage;