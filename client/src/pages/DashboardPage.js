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
    setPartialAmount,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Cash");

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

      if (fromDate) {
        params.fromDate =
          fromDate;
      }

      if (toDate) {
        params.toDate = toDate;
      }

      fetchInvoices(params);
    }, [
      fetchInvoices,
      statusFilter,
      search,
      customerSearch,
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
              status === "paid"
                ? invoice.total
                : amountPaid,

            dueAmount:
              status === "paid"
                ? 0
                : invoice.total -
                  amountPaid,
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

  // ========================================
  // STATS
  // ========================================

  const stats = [
    {
      label:
        "Total Invoices",
      value:
        invoices.length,
      icon: FileText,
    },

    {
      label:
        "Completed Payments",
      value: invoices.filter(
        (i) =>
          i.status ===
          "paid"
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
      label:
        "Inventory Value",
      value: formatCurrency(
        inventoryStats
          ?.inventoryValue || 0
      ),
      icon: Wallet,
    },

    {
      label:
        "Expected Profit",
      value: formatCurrency(
        inventoryStats
          ?.expectedProfit || 0
      ),
      icon: TrendingUp,
    },

    {
      label:
        "Products",
      value:
        inventoryStats
          ?.totalProducts || 0,
      icon: Package,
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

      {/* STATS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">

          <input
            type="text"
            placeholder="Search invoice"
            className="input"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <input
            type="text"
            placeholder="Customer name"
            className="input"
            value={
              customerSearch
            }
            onChange={(e) =>
              setCustomerSearch(
                e.target.value
              )
            }
          />

          <select
            className="input"
            value={
              statusFilter
            }
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

          <button
            onClick={load}
            className="btn-primary"
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
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="border-b bg-gray-50">

                  <th className="px-5 py-4 text-left">
                    Invoice
                  </th>

                  <th className="px-5 py-4 text-left">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left">
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

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {invoices.map(
                  (inv) => (
                    <tr
                      key={
                        inv._id
                      }
                      className="border-b hover:bg-gray-50 transition"
                    >

                      <td className="px-5 py-4 font-semibold">
                        {
                          inv.invoiceNumber
                        }
                      </td>

                      <td className="px-5 py-4">
                        {
                          inv.customer
                            ?.name
                        }
                      </td>

                      <td className="px-5 py-4">
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
                          className={`input text-sm font-medium ${
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

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">

                          <button
                            onClick={() =>
                              navigate(
                                 `/invoices/${inv._id}`
                              )
                            }
                            title="Preview Invoice"
                            className="w-10 h-10 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all duration-200 flex items-center justify-center"
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
                            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
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
                            className="w-10 h-10 rounded-xl hover:bg-red-50 text-red-500 flex items-center justify-center"
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

          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-[32px] p-7 w-full max-w-md shadow-2xl border border-gray-100">

            <div className="mb-6">

              <h2 className="text-3xl font-bold text-gray-900">
                {newStatus ===
                "paid"
                  ? "Complete Payment"
                  : "Update Payment"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {
                  selectedInvoice?.invoiceNumber
                }
              </p>

            </div>

            <div className="space-y-5">

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">

                <div className="flex justify-between items-center">

                  <span className="text-gray-500 font-medium">
                    Invoice Total
                  </span>

                  <strong className="text-xl text-gray-900">
                    {formatCurrency(
                      selectedInvoice?.total ||
                        0
                    )}
                  </strong>

                </div>

              </div>

              <div>

                <label className="label">
                  {newStatus ===
                  "paid"
                    ? "Remaining Amount"
                    : "Amount Received"}
                </label>

                <input
                  type="number"
                  className="input h-14 text-lg"
                  value={
                    partialAmount
                  }
                  onChange={(e) =>
                    setPartialAmount(
                      e.target.value
                    )
                  }
                />

              </div>

              <div>

                <label className="label">
                  Payment Method
                </label>

                <select
                  className="input h-14"
                  value={
                    paymentMethod
                  }
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                >
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

                </select>

              </div>

              <div
                className={`rounded-2xl p-5 border ${
                  newStatus ===
                  "paid"
                    ? "bg-green-50 border-green-100"
                    : "bg-red-50 border-red-100"
                }`}
              >

                <div className="flex justify-between items-center">

                  <span
                    className={`font-semibold ${
                      newStatus ===
                      "paid"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {newStatus ===
                    "paid"
                      ? "After Payment Due"
                      : "Remaining Due"}
                  </span>

                  <strong
                    className={`text-xl ${
                      newStatus ===
                      "paid"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {newStatus ===
                    "paid"
                      ? formatCurrency(
                          0
                        )
                      : formatCurrency(
                          (selectedInvoice?.total ||
                            0) -
                            Number(
                              partialAmount ||
                                0
                            )
                        )}
                  </strong>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">

                <button
                  onClick={() =>
                    setPaymentModal(
                      false
                    )
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

                      newStatus ===
                      "paid"
                        ? selectedInvoice.total
                        : Number(
                            partialAmount
                          ),

                      paymentMethod
                    )
                  }
                  className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-lg shadow-indigo-200"
                >
                  {newStatus ===
                  "paid"
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
  );
};

export default DashboardPage;