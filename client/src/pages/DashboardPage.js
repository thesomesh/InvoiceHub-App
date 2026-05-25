import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FileText,
  CheckCircle2,
  Clock3,
  Package,
  Wallet,
  TrendingUp,
  Eye,
  Download,
  Trash2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import { useInvoices } from "../hooks/useInvoices";

import { invoiceAPI } from "../services/api";

import { productAPI } from "../services/productAPI";

import {
  EmptyState,
  ConfirmModal,
  Spinner,
  Alert,
} from "../components/UI";

import {
  formatCurrency,
  formatDate,
} from "../utils/calculations";

const DashboardPage = () => {
  const { user } = useAuth();

  const navigate =
    useNavigate();

  const {
    invoices,
    loading,
    error,
    fetchInvoices,
    deleteInvoice,
    updateStatus,
  } = useInvoices();

  const [
    inventoryStats,
    setInventoryStats,
  ] = useState(null);

  const [search, setSearch] =
    useState("");

  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [pdfLoading, setPdfLoading] =
    useState({});

  const [
    statusSaving,
    setStatusSaving,
  ] = useState({});

  // PAYMENT STATES

  const [
    paymentModal,
    setPaymentModal,
  ] = useState(false);

  const [
    selectedInvoice,
    setSelectedInvoice,
  ] = useState(null);

  const [
    newStatus,
    setNewStatus,
  ] = useState("");

const [
  partialAmount,
  setPartialAmount
] = useState("");
  const [
  paymentMethod,
  setPaymentMethod
] = useState("Cash");

const [
  currentPage,
  setCurrentPage
] = useState(1);

const invoicesPerPage = 10;
const [
  summaryPeriod,
  setSummaryPeriod
] = useState("thisMonth");


const [
  customFrom,
  setCustomFrom
] = useState("");

const [
  customTo,
  setCustomTo
] = useState("");
  // ========================================
  // LOAD
  // ========================================

  const load =
    useCallback(() => {
      const params = {};

      if (
        statusFilter !== "all"
      ) {
        params.status =
          statusFilter;
      }

      if (search.trim()) {
        params.search =
          search.trim();
      }

      if (
        customerSearch.trim()
      ) {
        params.customer =
          customerSearch.trim();
      }
if (paymentModeFilter !== "all") {
  params.paymentMethod =
    paymentModeFilter;
}
      if (fromDate) {
        params.fromDate =
          fromDate;
      }

      if (toDate) {
        params.toDate = toDate;
      }

     fetchInvoices(params);
setCurrentPage(1);
    }, [
      fetchInvoices,
      statusFilter,
      search,
      customerSearch,
      paymentModeFilter,
      fromDate,
      toDate,
    ]);

  useEffect(() => {
    load();

    fetchDashboardStats();
  }, [load]);

  // ========================================
  // FETCH STATS
  // ========================================

  const fetchDashboardStats =
    async () => {
      try {
        const res =
          await productAPI.getStats();

        setInventoryStats(
          res.data
        );
      } catch (err) {
        console.log(err);
      }
    };

  // ========================================
  // DELETE
  // ========================================

  const handleDelete =
    async () => {
      try {
        setDeleteLoading(true);

        await deleteInvoice(
          deleteTarget._id
        );

        setDeleteTarget(null);

        load();
      } catch (err) {
        setActionError(
          err.response?.data
            ?.message ||
            "Failed to delete invoice"
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  // ========================================
  // PDF
  // ========================================

  const handleDownloadPDF =
    async (invoice) => {
      try {
        setPdfLoading((p) => ({
          ...p,
          [invoice._id]: true,
        }));

        const res =
          await invoiceAPI.downloadPDF(
            invoice._id
          );

        const blob =
          new Blob([res.data], {
            type: "application/pdf",
          });

        const url =
          window.URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            "a"
          );

        a.href = url;

        a.download = `${invoice.invoiceNumber}.pdf`;

        document.body.appendChild(
          a
        );

        a.click();

        a.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (err) {
        setActionError(
          "Failed to download PDF"
        );
      } finally {
        setPdfLoading((p) => ({
          ...p,
          [invoice._id]: false,
        }));
      }
    };

  // ========================================
  // PAYMENT MODAL
  // ========================================

  const openPaymentModal = async (
  invoice,
  status
) => {
  setSelectedInvoice(
    invoice
  );

  setNewStatus(status);

  // ========================================
  // CANCELLED
  // ========================================

  if (
    status ===
    "cancelled"
  ) {
    const confirmCancel =
      window.confirm(
        invoice.status ===
          "paid"
          ? "Cancel & refund this paid invoice?"
          : "Cancel this invoice?"
      );

    if (!confirmCancel)
      return;

    try {
      setStatusSaving((p) => ({
        ...p,
        [invoice._id]: true,
      }));

      await updateStatus(
        invoice._id,
        {
          status:
            "cancelled",

          paymentMethod:
            invoice.status ===
            "paid"
              ? "Refunded"
              : "Not Paid Yet",

          amountPaid:
            invoice.status ===
            "paid"
              ? 0
              : invoice.amountPaid ||
                0,

          dueAmount: 0,
        }
      );

      load();
    } catch (err) {
      console.log(err);

      setActionError(
        "Failed to cancel invoice"
      );
    } finally {
      setStatusSaving((p) => ({
        ...p,
        [invoice._id]: false,
      }));
    }

    return;
  }

  // ========================================
  // PAID FLOW
  // ========================================

  if (status === "paid") {
    const remaining =
      Number(
        invoice.dueAmount || 0
      );

    setPartialAmount(
      remaining
    );

    setPaymentMethod(
      invoice.paymentMethod &&
        invoice.paymentMethod !==
          "Not Paid Yet"
        ? invoice.paymentMethod
        : "Cash"
    );

    setPaymentModal(true);

    return;
  }

  // ========================================
  // PENDING
  // ========================================

  if (
    status ===
    "pending"
  ) {
    handleFinalStatusUpdate(
      invoice,
      "pending",
      0,
      "Not Paid Yet"
    );

    return;
  }

  // ========================================
  // PARTIAL
  // ========================================

  setPartialAmount("");

  setPaymentMethod(
    "Cash"
  );

  setPaymentModal(true);
};
  // ========================================
  // UPDATE PAYMENT
  // ========================================

  const handleFinalStatusUpdate =
    async (
      invoice,
      status,
      amountPaid,
      paymentMethod
    ) => {
      try {
        setStatusSaving((p) => ({
          ...p,
          [invoice._id]: true,
        }));

        await updateStatus(
          invoice._id,
          {
            status,

            paymentMethod,

           amountPaid:
  amountPaid,

            dueAmount: Math.max(
  invoice.dueAmount - amountPaid,
  0
),
          }
        );

        setPaymentModal(
          false
        );

        load();
      } catch (err) {
        console.log(err);

        setActionError(
          err.response?.data
            ?.message ||
            "Failed to update payment"
        );
      } finally {
        setStatusSaving((p) => ({
          ...p,
          [invoice._id]: false,
        }));
      }
    };
const indexOfLastInvoice =
  currentPage *
  invoicesPerPage;

const indexOfFirstInvoice =
  indexOfLastInvoice -
  invoicesPerPage;

const currentInvoices =
  invoices.slice(
    indexOfFirstInvoice,
    indexOfLastInvoice
  );

const totalPages =
  Math.ceil(
    invoices.length /
      invoicesPerPage
  );
const summaryInvoices =
  invoices.filter((inv) => {
    const d = new Date(inv.date);
    const now = new Date();

    if (
      summaryPeriod === "today"
    ) {
      return (
        d.toDateString() ===
        now.toDateString()
      );
    }

    if (
      summaryPeriod ===
      "thisWeek"
    ) {
      const weekAgo =
        new Date();

      weekAgo.setDate(
        now.getDate() - 7
      );

      return d >= weekAgo;
    }

    if (
      summaryPeriod ===
      "previousMonth"
    ) {
      return (
        d.getMonth() ===
          now.getMonth() - 1 &&
        d.getFullYear() ===
          now.getFullYear()
      );
    }

    if (
      summaryPeriod ===
      "last3Months"
    ) {
      const threeMonthsAgo =
        new Date();

      threeMonthsAgo.setMonth(
        now.getMonth() - 3
      );

      return d >= threeMonthsAgo;
    }

    if (
      summaryPeriod ===
      "custom"
    ) {
      if (
        !customFrom ||
        !customTo
      ) {
        return true;
      }

      return (
        d >=
          new Date(
            customFrom
          ) &&
        d <=
          new Date(
            customTo
          )
      );
    }

    // default thisMonth
    return (
      d.getMonth() ===
        now.getMonth() &&
      d.getFullYear() ===
        now.getFullYear()
    );
  });

const activeSummaryInvoices =
  summaryInvoices.filter(
    (inv) =>
      inv.status !==
      "cancelled"
  );

const summaryStats = {
  bills:
  summaryInvoices.length,

  revenue:
    activeSummaryInvoices.reduce(
      (sum, inv) =>
        sum +
        Number(
          inv.total || 0
        ),
      0
    ),

  collected:
    activeSummaryInvoices.reduce(
      (sum, inv) =>
        sum +
        Number(
          inv.amountPaid ||
            0
        ),
      0
    ),

  due:
    activeSummaryInvoices.reduce(
      (sum, inv) =>
        sum +
        Number(
          inv.dueAmount ||
            0
        ),
      0
    ),

  refunded:
    summaryInvoices
      .filter(
        (inv) =>
          inv.status ===
          "cancelled"
      )
      .reduce(
        (sum, inv) =>
          sum +
          Number(
            inv.total || 0
          ),
        0
      ),
};
const overallProfit =
  inventoryStats?.totalSalesProfit || 0;
const totalRevenue =
  invoices
    .filter(
      (inv) =>
        inv.status !== "cancelled"
    )
    .reduce(
      (sum, inv) =>
        sum + Number(inv.total || 0),
      0
    );
const summarySalesProfit =
  summaryStats.revenue > 0 &&
  totalRevenue > 0
    ? (
        (summaryStats.revenue /
          totalRevenue) *
        overallProfit
      )
    : 0; 
const overallProfitMargin =
  totalRevenue > 0
    ? (
        (overallProfit /
          totalRevenue) *
        100
      ).toFixed(1)
    : 0;

const pendingCollections =
  invoices
    .filter(
      (inv) =>
        inv.status === "pending" ||
        inv.status === "partial"
    )
    .sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    )
    .slice(0, 5);






const stats = [
  // ROW 1 — FINANCIAL OVERVIEW

  {
    label: "Total Bills",
    value: invoices.length,
    icon: FileText,
  },


  {
    label: "Outstanding Due",
    value: formatCurrency(
  invoices.reduce(
    (sum, inv) =>
      sum + Number(inv.dueAmount || 0),
    0
  )
),
    icon: Clock3,
  },

  // ROW 2 — BUSINESS HEALTH

   {
      label: "Inventory Worth",
    value: formatCurrency(
      inventoryStats?.inventoryValue || 0
    ),
    icon: Package,
  },

  {
    label:
      "Completed Bills",
    value: invoices.filter(
      (i) =>
        i.status === "paid"
    ).length,
    icon: CheckCircle2,
  },

  {
    label:
      "Pending + Partial",
    value: invoices.filter(
      (i) =>
        i.status ===
          "pending" ||
        i.status ===
          "partial"
    ).length,
    icon: Clock3,
  },

  {
  label: "Net Profit Margin",
    value: `${overallProfitMargin}%`,
    icon: TrendingUp,
  },

  

];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="text-lg font-medium text-gray-700 mt-1">
  {(() => {
    const hour =
      new Date().getHours();

    if (hour < 12)
      return `Good Morning, ${user?.name}`;

    if (hour < 17)
      return `Good Afternoon, ${user?.name}`;

    return `Good Evening, ${user?.name}`;
  })()}
</p>


        </div>

        <Link
          to="/create-invoice"
          className="btn-primary"
        >
          + Create Invoice
        </Link>
      </div>

   <div className="bg-white rounded-3xl border border-gray-100 p-5 mb-8">

  <div className="flex items-center justify-between flex-wrap gap-4">

    <h2 className="text-lg font-semibold text-gray-800">
      Summary Period
    </h2>

    <div className="flex gap-3 flex-wrap">

      {[
        {
          key: "today",
          label: "Today",
        },
        {
          key: "thisWeek",
          label: "This Week",
        },
        {
          key: "thisMonth",
          label: "This Month",
        },
        {
          key: "previousMonth",
          label: "Previous Month",

        },

        {
    key: "custom",
    label: "Custom",
  },
      ].map((p) => (
        <button
          key={p.key}
          onClick={() =>
            setSummaryPeriod(
              p.key
            )
          }
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            summaryPeriod ===
            p.key
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {p.label}
        </button>
      ))}

    </div>
{summaryPeriod ===
  "custom" && (
  <div className="flex gap-4 mt-5 w-full">

    <input
      type="date"
      className="input"
      value={customFrom}
      onChange={(e) =>
        setCustomFrom(
          e.target.value
        )
      }
    />

    <input
      type="date"
      className="input"
      value={customTo}
      onChange={(e) =>
        setCustomTo(
          e.target.value
        )
      }
    />

  </div>
)}
  </div>

</div>
  <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8">

  <h2 className="text-xl font-bold mb-5">
    {summaryPeriod ===
    "today"
      ? "Today's Summary"
      : summaryPeriod ===
        "thisWeek"
      ? "This Week Summary"
      : summaryPeriod ===
        "previousMonth"
      ? "Previous Month Summary"
      : "Monthly Summary"}
  </h2>

<div className="grid grid-cols-6 gap-6 items-center">

   <div className="text-center">
      <p className="text-gray-500">
        Bills Created
      </p>
      <strong>
        {
          summaryStats.bills
        }
      </strong>
    </div>

    <div className="text-center">
      <p className="text-gray-500">
        Revenue
      </p>
      <strong>
        {formatCurrency(
          summaryStats.revenue
        )}
      </strong>
    </div>

    <div className="text-center">
      <p className="text-gray-500">
        Collected
      </p>
      <strong>
        {formatCurrency(
          summaryStats.collected
        )}
      </strong>
    </div>

  <div className="text-center">
      <p className="text-gray-500">
        Due
      </p>
      <strong>
        {formatCurrency(
          summaryStats.due
        )}
      </strong>
    </div>
<div className="text-center">
  <p className="text-gray-500">
    Sales Profit
  </p>
  <strong className="text-green-600">
    {formatCurrency(
      summarySalesProfit
    )}
  </strong>
</div>
   <div className="text-center">
      <p className="text-gray-500">
        Refunded
      </p>
      <strong>
        {formatCurrency(
          summaryStats.refunded
        )}
      </strong>
    </div>

  </div>

</div>  


<div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8">
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-xl font-bold">
      Pending Collections
    </h2>

    <span className="text-sm text-gray-500">
      {pendingCollections.length} invoices
    </span>
  </div>

  {pendingCollections.length === 0 ? (
    <p className="text-gray-500">
      No pending collections
    </p>
  ) : (
    <div className="space-y-4">
      {pendingCollections.map(
        (inv) => {
          const daysPending =
            Math.floor(
              (new Date() -
                new Date(inv.date)) /
                (1000 * 60 * 60 * 24)
            );

          return (
            <div
              key={inv._id}
              className="flex justify-between items-center border-b pb-3"
            >
              <div>
                <p className="font-semibold">
                  {inv.invoiceNumber}
                </p>

                <p className="text-sm text-gray-500">
                  {inv.customer?.name}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-red-500">
                  {formatCurrency(
                    inv.dueAmount
                  )}
                </p>

                <p className="text-xs text-gray-500">
                  {daysPending === 0
                    ? "Due Today"
                    : `${daysPending} Days Pending`}
                </p>
              </div>
            </div>
          );
        }
      )}
    </div>
  )}
</div>





<div className="mb-8">
  <h2 className="text-xl font-bold text-gray-900 mb-5">
    Business Performance Overview
  </h2>
  {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;

          return (
            <div
              key={s.label}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {s.label}
                  </p>

                  <h2 className="text-3xl font-bold mt-3 text-gray-900">
                    {s.value}
                  </h2>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Icon
                    size={24}
                    className="text-gray-700"
                  />
           
                </div>
              </div>
            </div>
          );
        })}
      </div>


      
{/* FILTERS */}

<div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8">
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 items-center">

    {/* Invoice No */}
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">
        Invoice No
      </label>
      <input
        type="text"
        placeholder="Search invoice"
        className="input"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />
    </div>

    {/* Customer */}
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">
      Customer Name
      </label>
      <input
        type="text"
        placeholder="Customer name"
        className="input"
        value={customerSearch}
        onChange={(e) =>
          setCustomerSearch(
            e.target.value
          )
        }
      />
    </div>

    {/* Status */}
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">
        Status
      </label>
      <select
        className="input"
        value={statusFilter}
        onChange={(e) =>
          setStatusFilter(
            e.target.value
          )
        }
      >
        <option value="all">
          All Status
        </option>
        <option value="pending">
          Pending
        </option>
        <option value="partial">
          Partial
        </option>
        <option value="paid">
          Paid
        </option>
        <option value="cancelled">
          Cancelled
        </option>
      </select>
    </div>

    {/* Payment Mode */}
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">
        Payment Mode
      </label>
      <select
        className="input"
        value={paymentModeFilter}
        onChange={(e) =>
          setPaymentModeFilter(
            e.target.value
          )
        }
      >
        <option value="all">
          All Payment Modes
        </option>
        <option value="Cash">
          Cash
        </option>
        <option value="UPI">
          UPI
        </option>
        <option value="Card">
          Card
        </option>
        <option value="Bank Transfer">
          Bank Transfer
        </option>
        <option value="Cheque">
          Cheque
        </option>
        <option value="Not Paid Yet">
          Not Paid Yet
        </option>
        <option value="Refunded">
          Refunded
        </option>
      </select>
    </div>

    {/* From Date */}
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">
        From Date
      </label>
      <input
        type="date"
        className="input"
        value={fromDate}
        onChange={(e) =>
          setFromDate(
            e.target.value
          )
        }
      />
    </div>

    {/* To Date */}
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 text-center">
        To Date
      </label>
      <input
        type="date"
        className="input"
        value={toDate}
        onChange={(e) =>
          setToDate(
            e.target.value
          )
        }
      />
    </div>

    {/* Apply */}
  <button
  onClick={load}
  className="btn-primary h-[42px] mt-[26px] flex items-center justify-center"
>
      Apply
    </button>

  </div>
</div>
      {/* TABLE */}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">

        {loading ? (
          <div className="py-16 flex justify-center">
            <Spinner />
          </div>
        ) : invoices.length ===
          0 ? (
          <EmptyState
            title="No invoices found"
            description="Create your first invoice"
          />
        ) : (
          <div className="overflow-x-auto pr-6">
<table className="w-full table-auto">

              <thead>
                <tr className="border-b bg-gray-50">

                  <th className="px-5 py-4 text-center whitespace-nowrap">
                    Invoice
                  </th>

                 <th className="px-5 py-4 text-center whitespace-nowrap">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-center whitespace-nowrap">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right">
                    Total
                  </th>

                  <th className="px-5 py-4 text-right">
                    Paid
                  </th>

                  <th className="px-5 py-4 text-right">
                    Due
                  </th>
                  <th className="px-3 py-4 text-center w-[160px]">
  Payment Mode
</th>
                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                 <th className="w-[180px] px-6 py-4 text-center whitespace-nowrap">
  Actions
</th>

                </tr>
              </thead>

              <tbody>

                {currentInvoices.map(
                  (inv) => (
                    <tr
                      key={
                        inv._id
                      }
                      className="border-b hover:bg-gray-50 transition"
                    >

                     <td className="px-5 py-4 font-semibold whitespace-nowrap">
                        {
                          inv.invoiceNumber
                        }
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {
                          inv.customer
                            ?.name
                        }
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {formatDate(
                          inv.date
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold">
                        {formatCurrency(
                          inv.total
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-green-600 font-semibold">
                        {formatCurrency(
                          inv.amountPaid ||
                            0
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-red-500 font-semibold">
                        {formatCurrency(
                          inv.dueAmount ||
                            0
                        )}
                      </td>
                   <td className="px-5 py-4 text-center">
  <span className="font-medium text-gray-700">
    {inv.paymentMethod || "-"}
  </span>
</td>


                      {/* STATUS */}

                      <td className="px-5 py-4 text-center">

                        <select
                          value={
                            inv.status
                          }
                          onChange={(
                            e
                          ) =>
                            openPaymentModal(
                              inv,
                              e
                                .target
                                .value
                            )
                          }
                          disabled={
                            statusSaving[
                              inv._id
                            ]
                          }
                       className={`input text-sm font-medium h-[44px] w-[130px] ${
                            inv.status ===
                            "paid"
                              ? "text-green-600 bg-green-50"
                              : inv.status ===
                                "partial"
                              ? "text-blue-600"
                              : inv.status ===
                                "cancelled"
                              ? "text-red-600"
                              : "text-orange-500"
                              
                          }`}
                        >

                          {inv.status ===
                            "pending" && (
                            <>
                              <option value="pending">
                                Pending
                              </option>

                              <option value="partial">
                                Partial
                              </option>

                              <option value="paid">
                                Paid
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>
                            </>
                          )}

                          {inv.status ===
                            "partial" && (
                            <>
                              <option value="partial">
                                Partial
                              </option>

                              <option value="paid">
                                Paid
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>
                            </>
                          )}

                          {inv.status ===
                            "paid" && (
                            <>
                              <option value="paid">
                                Paid
                              </option>

                              <option value="cancelled">
                                Cancel &
                                Refund
                              </option>
                            </>
                          )}

                          {inv.status ===
                            "cancelled" && (
                            <option value="cancelled">
                              Cancelled
                            </option>
                          )}

                        </select>

                      </td>

                      {/* ACTIONS */}

              <td className="px-5 py-4 min-w-[150px]">
                        <div className="flex items-center justify-center gap-1">

                          <button
                            onClick={() =>
                              navigate(
                                 `/invoices/${inv._id}`
                              )
                            }
                            title="Preview Invoice"
                            className="w-8 h-8 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all duration-200 flex items-center justify-center"
                          >
                            <Eye
                              size={
                                18
                              }
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDownloadPDF(
                                inv
                              )
                            }
                            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center"
                          >
                            <Download
                              size={
                                18
                              }
                            />
                          </button>

                          <button
                            onClick={() =>
                              setDeleteTarget(
                                inv
                              )
                            }
                            className="w-8 h-8 rounded-xl hover:bg-red-50 text-red-500 flex items-center justify-center"
                          >
                            <Trash2
                              size={
                                18
                              }
                            />
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>
            
<div className="flex justify-center items-center gap-4 py-6 border-t">

  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage(
        currentPage - 1
      )
    }
    className="px-4 py-2 rounded-xl border disabled:opacity-40"
  >
    Prev
  </button>

  <span className="font-medium text-gray-700">
    Page {currentPage} of {totalPages}
  </span>

  <button
    disabled={
      currentPage === totalPages
    }
    onClick={() =>
      setCurrentPage(
        currentPage + 1
      )
    }
    className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40"
  >
    Next
  </button>

</div>
          </div>
        )}
      </div>

     {/* PAYMENT MODAL */}

{paymentModal && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

    <div className="bg-white rounded-[32px] p-7 w-full max-w-md shadow-2xl border border-gray-100">

      <div className="mb-6">

        <h2 className="text-3xl font-bold text-gray-900">
          {newStatus === "paid"
            ? "Complete Payment"
            : "Update Payment"}
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {selectedInvoice?.invoiceNumber}
        </p>

      </div>

      <div className="space-y-5">

        {/* Invoice Total */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">
              Invoice Total
            </span>

            <strong className="text-xl text-gray-900">
              {formatCurrency(
                selectedInvoice?.total || 0
              )}
            </strong>
          </div>
        </div>

        {/* Installment Tracking */}
        {selectedInvoice?.amountPaid > 0 && (
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">

            <div className="flex justify-between mb-2">
              <span>Already Paid</span>

              <strong>
                {formatCurrency(
                  selectedInvoice?.amountPaid || 0
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Remaining Due</span>

              <strong>
                {formatCurrency(
                  selectedInvoice?.dueAmount || 0
                )}
              </strong>
            </div>

          </div>
        )}

        {/* Amount */}
        <div>

          <label className="label">
            {selectedInvoice?.amountPaid > 0
              ? "Add Payment"
              : "Amount Received"}
          </label>

          <input
            type="number"
            min="1"
            max={
              selectedInvoice?.dueAmount ||
              selectedInvoice?.total
            }
            className="input h-14 text-lg"
            value={partialAmount}
            onChange={(e) =>
              setPartialAmount(
                e.target.value
              )
            }
          />

        </div>

        {/* Payment Method */}
        <div>

          <label className="label">
            Payment Method
          </label>

          <select
            className="input h-14"
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">
              Bank Transfer
            </option>
            <option value="Cheque">Cheque</option>
  <option value="other">other</option>
          </select>

        </div>

        {/* Due Preview */}
        <div
          className={`rounded-2xl p-5 border ${
            newStatus === "paid"
              ? "bg-green-50 border-green-100"
              : "bg-red-50 border-red-100"
          }`}
        >

          <div className="flex justify-between items-center">

            <span
              className={`font-semibold ${
                newStatus === "paid"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {newStatus === "paid"
                ? "After Payment Due"
                : "Remaining Due"}
            </span>

          <strong
  className={`text-xl ${
    Number(partialAmount || 0) >=
    (selectedInvoice?.dueAmount || 0)
      ? "text-green-600"
      : "text-red-600"
  }`}
>
  {formatCurrency(
    Math.max(
      (selectedInvoice?.dueAmount || 0) -
        Number(partialAmount || 0),
      0
    )
  )}
</strong>

          </div>

        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-2">

          <button
            onClick={() =>
              setPaymentModal(false)
            }
            className="h-14 rounded-2xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={() =>
            handleFinalStatusUpdate(
  selectedInvoice,
  newStatus,
  Number(partialAmount),
  paymentMethod
)
            }
            className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-lg shadow-indigo-200"
          >
            {newStatus === "paid"
              ? "Complete Payment"
              : "Update Payment"}
          </button>

        </div>

      </div>

    </div>

  </div>
)}
      {/* DELETE MODAL */}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Delete invoice ${deleteTarget?.invoiceNumber}?`}
        loading={deleteLoading}
      />

      <Alert
        message={actionError}
        type="error"
      />

    </div>
    </div>
  );
};

export default DashboardPage;