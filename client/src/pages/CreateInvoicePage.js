import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { invoiceAPI } from "../services/api";
import { calculateTotals, formatCurrency } from "../utils/calculations";
import { Alert } from "../components/UI";

const PlusIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

const emptyItem = () => ({ name: "", qty: 1, price: "" ,  discountRate: 0 ,});

const CreateInvoicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
const [status, setStatus] = useState("pending");
const [
  paymentMethod,
  setPaymentMethod,
] = useState("Cash");


const [
  amountPaid,
  setAmountPaid,
] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    const defaultTax = Number(user.defaultTaxRate ?? 0);
    if (Number.isFinite(defaultTax)) {
      setTaxRate(defaultTax);
    }
    setNotes(String(user.defaultNote || ""));
  }, [user?.id]);

  const totals = calculateTotals(items, taxRate, discountRate);
// ========================================
// ROUND OFF
// ========================================
const actualTotal =
  totals.total;

const roundedTotal =
  Math.round(
    actualTotal
  );

const roundOff =
  Number(
    (
      roundedTotal -
      actualTotal
    ).toFixed(2)
  );

const finalGrandTotal =
  roundedTotal;
  const updateCustomer = (e) => {
    setCustomer((c) => ({ ...c, [e.target.name]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [`customer.${e.target.name}`]: "" }));
  };



useEffect(() => {
  fetchProducts();
}, []);

const fetchProducts =
  async () => {
    try {
      const res =
        await fetch(
          "http://localhost:5219/api/products",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "token"
              )}`,
            },
          }
        );

      const data =
        await res.json();

      setProducts(data || []);
    } catch (err) {
      console.log(err);
    }
  };



const updateItem = (
  index,
  field,
  value
) => {
  setItems((prev) => {
    const updated = [...prev];

    updated[index] = {
      ...updated[index],
      [field]: value
    };

    return updated;
  });

  setFieldErrors(
    (prev) => {
      const updated = {
        ...prev
      };

      delete updated[
        `items[${index}].qty`
      ];

      delete updated[
        `items[${index}].name`
      ];

      delete updated[
        `items[${index}].price`
      ];

      return updated;
    }
  );

  setError("");
};
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errors = {};
    if (!customer.name.trim()) errors["customer.name"] = "Customer name required";
    if (!customer.phone.trim()) errors["customer.phone"] = "Customer phone required";
    items.forEach((item, i) => {
      if (!item.name.trim()) errors[`items[${i}].name`] = "Item name required";
      if (!item.qty || parseFloat(item.qty) < 1) errors[`items[${i}].qty`] = "Qty ≥ 1";

const productQtyMap = {};

items.forEach((item) => {
  if (!item.name) return;

  productQtyMap[item.name] =
    (productQtyMap[item.name] || 0) +
    Number(item.qty || 0);
});

items.forEach((item, i) => {
  const selectedProduct =
    products.find(
      (p) =>
        p.name === item.name
    );

  if (
    selectedProduct &&
    productQtyMap[item.name] >
      Number(selectedProduct.stock)
  ) {
    errors[
      `items[${i}].qty`
    ] =
      `${selectedProduct.name} has only ${selectedProduct.stock} ${selectedProduct.unit} left`;
  }
});
      if (item.price === "" || parseFloat(item.price) < 0) errors[`items[${i}].price`] = "Price ≥ 0";
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
  customer,

items: items.map((i) => ({
  name: i.name.trim(),

  qty: parseFloat(i.qty),

  price: parseFloat(i.price),

  discountRate:
    parseFloat(
      i.discountRate || 0
    ),
})),
  taxRate:
    parseFloat(taxRate) || 0,

  taxPercentage:
    parseFloat(taxRate) || 0,

  discountRate:
    parseFloat(discountRate) || 0,

  discountPercentage:
    parseFloat(discountRate) || 0,
roundOff,
  date,

  dueDate:
    dueDate || undefined,

  notes:
    notes.trim() ||
    undefined,

  status,

  paymentMethod:
    status === "pending" ||
    status === "cancelled"
      ? "Not Paid Yet"
      : paymentMethod,

  amountPaid:
     Number(amountPaid || 0),

  dueAmount:
  Math.max(
    Math.round(
      totals.total
    ) -
    Number(amountPaid || 0),
    0
  ),
};

      const res = await invoiceAPI.create(payload);
      navigate(`/invoices/${res.data.invoice._id}`, { replace: true });
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        serverErrors.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setFieldErrors(mapped);
      }
      setError(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const fe = (key) => fieldErrors[key];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-ghost p-2"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
            New Invoice
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            from {user?.businessName}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert message={error} type="error" />

        {/* Invoice Meta */}
        <div className="card p-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Invoice Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Due Date (optional)</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>
            
          </div>
        </div>

        {/* Customer */}
        <div className="card p-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Bill To
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input
                type="text"
                name="name"
                className={`input ${fe("customer.name") ? "border-[var(--danger)]" : ""}`}
                placeholder="John Smith"
                value={customer.name}
                onChange={updateCustomer}
                disabled={loading}
              />
              {fe("customer.name") && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                  {fe("customer.name")}
                </p>
              )}
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                type="tel"
                name="phone"
                className={`input ${fe("customer.phone") ? "border-[var(--danger)]" : ""}`}
                placeholder="+91 98765 43210"
                value={customer.phone}
                onChange={updateCustomer}
                disabled={loading}
              />
              {fe("customer.phone") && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
                  {fe("customer.phone")}
                </p>
              )}
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="customer@example.com"
                value={customer.email}
                onChange={updateCustomer}
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Address (optional)</label>
              <input
                type="text"
                name="address"
                className="input"
                placeholder="123 Street, City"
                value={customer.address}
                onChange={updateCustomer}
                disabled={loading}
              />
            </div>
          </div>
        </div>
{/* Line Items */}

<div className="card p-5">
  <h2
    className="text-xs font-bold uppercase tracking-widest mb-4"
    style={{
      color:
        "var(--text-muted)",
    }}
  >
    Invoice Items
  </h2>

  <div className="space-y-3">
    {/* HEADER */}

    <div
      className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wide mb-2"
      style={{
        color:
          "var(--text-muted)",
      }}
    >
      <div className="col-span-5">
        Product
      </div>

      <div className="col-span-2">
        Quantity
      </div>

      <div className="col-span-3">
        Unit Price
      </div>

      <div className="col-span-2 text-right">
        Total
      </div>
    </div>

    {/* ITEMS */}

    {items.map((item, i) => (
      <div
        key={i}
        className="grid grid-cols-12 gap-3 items-start border rounded-2xl p-3"
        style={{
          borderColor:
            "var(--border)",
        }}
      >
        {/* PRODUCT */}

        <div className="col-span-12 sm:col-span-5">
          <label className="label sm:hidden">
            Product
          </label>

          <select
            className={`input ${
              fe(
                `items[${i}].name`
              )
                ? "border-[var(--danger)]"
                : ""
            }`}
            disabled={loading}
            value={
              item.productId ||
              ""
            }
            onChange={(e) => {
              const selectedProduct =
                products.find(
                  (p) =>
                    p._id ===
                    e.target.value
                );

              if (
                !selectedProduct
              )
                return;

              setItems(
                (prev) => {
                  const updated =
                    [...prev];

                  updated[i] = {
                    ...updated[
                      i
                    ],

                    productId:
                      selectedProduct._id,

                    name:
                      selectedProduct.name,

                price:
  selectedProduct.finalSellingPrice ||
  selectedProduct.sellingPrice,

discountRate:
  selectedProduct.discountPercentage || 0,

                    unit:
                      selectedProduct.unit,

                    availableStock:
                      selectedProduct.stock,
                  };

                  return updated;
                }
              );
            }}
          >
            <option value="">
              Select Product
            </option>

            {products.map(
              (
                product
              ) => (
                <option
                  key={
                    product._id
                  }
                  value={
                    product._id
                  }
                >
                  {
                    product.name
                  }{" "}
                
                </option>
              )
            )}
          </select>

          {fe(
            `items[${i}].name`
          ) && (
            <p
              className="text-xs mt-1"
              style={{
                color:
                  "var(--danger)",
              }}
            >
              {fe(
                `items[${i}].name`
              )}
            </p>
          )}
        </div>

        {/* QUANTITY */}

        <div className="col-span-5 sm:col-span-2">
          <label className="label sm:hidden">
            Quantity
          </label>

          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              className={`input pr-14 ${
                fe(
                  `items[${i}].qty`
                )
                  ? "border-[var(--danger)]"
                  : ""
              }`}
              placeholder="1"
              value={item.qty}
              onChange={(
                e
              ) =>
                updateItem(
                  i,
                  "qty",
                  e.target
                    .value
                )
              }
              disabled={
                loading
              }
            />

            {item.unit && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {item.unit}
              </span>
            )}
          </div>

          {item.availableStock !==
            undefined && (
            <p className="text-xs mt-1 text-gray-500">
              Available:
              {" "}
              {
                item.availableStock
              }{" "}
              {item.unit}
            </p>
          )}

          {fe(
            `items[${i}].qty`
          ) && (
            <p
              className="text-xs mt-1"
              style={{
                color:
                  "var(--danger)",
              }}
            >
              {fe(
                `items[${i}].qty`
              )}
            </p>
          )}
        </div>

        {/* PRICE */}

        <div className="col-span-4 sm:col-span-3">
          <label className="label sm:hidden">
            Unit Price
          </label>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              ₹
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              className={`input pl-8 ${
                fe(
                  `items[${i}].price`
                )
                  ? "border-[var(--danger)]"
                  : ""
              }`}
              placeholder="0.00"
              value={
                item.price
              }
              onChange={(
                e
              ) =>
                updateItem(
                  i,
                  "price",
                  e.target
                    .value
                )
              }
              disabled={
                loading
              }
            />
          </div>

          {fe(
            `items[${i}].price`
          ) && (
            <p
              className="text-xs mt-1"
              style={{
                color:
                  "var(--danger)",
              }}
            >
              {fe(
                `items[${i}].price`
              )}
            </p>
          )}
        </div>

        {/* TOTAL */}

        <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2 pt-7 sm:pt-2">
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Total
            </p>

            <p className="font-bold text-base">
              {formatCurrency(
                parseFloat(
                  item.qty ||
                    0
                ) *
                  parseFloat(
                    item.price ||
                      0
                  )
              )}
            </p>
          </div>

          {items.length >
            1 && (
            <button
              type="button"
              onClick={() =>
                removeItem(
                  i
                )
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 text-red-500 transition"
              disabled={
                loading
              }
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    ))}
  </div>

  {/* ADD ITEM */}

  <button
    type="button"
    onClick={addItem}
    className="btn-ghost mt-5 text-sm"
    disabled={loading}
  >
    <PlusIcon />
    Add Product
  </button>
</div>

       
         {/* Summary + Payment */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* LEFT */}

  <div className="card p-6 rounded-3xl border border-gray-100 bg-white">
    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-5">
      Invoice Adjustments
    </h2>

    <div className="space-y-5">
      {/* DISCOUNT */}

      <div>
        <label className="label">
          Discount Rate (%)
        </label>

        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="input pr-10"
            placeholder="0"
            value={discountRate}
            onChange={(e) =>
              setDiscountRate(
                e.target.value
              )
            }
            disabled={loading}
          />

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            %
          </span>
        </div>
      </div>

      {/* TAX */}

      <div>
        <label className="label">
          Tax Rate (%)
        </label>

        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="input pr-10"
            placeholder="0"
            value={taxRate}
            onChange={(e) =>
              setTaxRate(
                e.target.value
              )
            }
            disabled={loading}
          />

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            %
          </span>
        </div>
      </div>

      {/* NOTES */}

      <div>
        <label className="label">
          Invoice Notes
        </label>

        <textarea
          className="input resize-none h-28"
          placeholder="Payment instructions, delivery notes, terms & conditions..."
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          disabled={loading}
        />
      </div>
    </div>
  </div>

  {/* RIGHT */}

  <div className="space-y-6">
    {/* SUMMARY */}

    <div className="card p-6 rounded-3xl border border-gray-100 bg-white">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-5">
        Invoice Summary
      </h2>

      <div className="space-y-4">
        {/* SUBTOTAL */}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Subtotal
          </span>

          <span className="font-semibold text-gray-900">
            {formatCurrency(
              totals.subtotal
            )}
          </span>
        </div>

        {/* DISCOUNT */}

        {parseFloat(
          discountRate
        ) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Discount (
              {discountRate}%)
            </span>

            <span className="font-semibold text-red-500">
              −{" "}
              {formatCurrency(
                totals.discountAmount
              )}
            </span>
          </div>
        )}

        {/* TAX */}

        {parseFloat(
          taxRate
        ) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Tax (
              {taxRate}%)
            </span>

            <span className="font-semibold text-green-600">
              +
              {formatCurrency(
                totals.taxAmount
              )}
            </span>
          </div>
        )}
{
  Number(amountPaid || 0) > 0 &&
  roundOff !== 0 && (

    <div className="flex items-center justify-between">

      <span className="text-sm text-gray-500">
        Round Off
      </span>

      <span className="font-semibold text-gray-700">

        {roundOff > 0
          ? "+"
          : ""}

        {formatCurrency(
          roundOff
        )}

      </span>

    </div>
  )
}
        {/* TOTAL */}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">
              Grand Total
            </span>

            <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
              {formatCurrency(
              Math.round(
    totals.total
  )
              )}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* PAYMENT DETAILS */}

    <div className="card p-6 rounded-3xl border border-gray-100 bg-white">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-5">
        Payment Details
      </h2>

      <div className="space-y-5">
        {/* STATUS */}

        <div>
          <label className="label">
            Payment Status
          </label>

          <select
            className="input"
            value={status}
           onChange={(e) => {
  const newStatus =
    e.target.value;

  setStatus(newStatus);

  if (
    newStatus === "pending" ||
    newStatus === "cancelled"
  ) {
    setAmountPaid("");
    setPaymentMethod(
      "Not Paid Yet"
    );
  }

  if (newStatus === "paid") {
    setAmountPaid(
      Math.round(
        totals.total
      )
    );
  }
}}
          >
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

        {/* METHOD */}

        <div>
          <label className="label">
            Payment Method
          </label>

          <select
            className="input"
            value={
              status ===
                "pending" ||
              status ===
                "cancelled"
                ? "Not Paid Yet"
                : paymentMethod
            }
            onChange={(e) =>
              setPaymentMethod(
                e.target.value
              )
            }
            disabled={
              status ===
                "pending" ||
              status ===
                "cancelled"
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

            <option value="Other">
              Other
            </option>

            {(status ===
              "pending" ||
              status ===
                "cancelled") && (
              <option value="Not Paid Yet">
                Not Paid Yet
              </option>
            )}
          </select>
        </div>

        {/* RECEIVED */}

        <div>
          <label className="label">
            Amount Received
          </label>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              ₹
            </span>

           <input
  type="number"
  className="input pl-8"
  value={amountPaid}
  onChange={(e) =>
    setAmountPaid(
      e.target.value
    )
  }
  disabled={
     status === "pending" ||
    status ===
    "cancelled"
 
  }
/>
          
          </div>
        </div>

        {/* PAYMENT SUMMARY */}

        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* RECEIVED */}

          <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
            <p className="text-xs uppercase tracking-wide text-green-700 font-semibold">
              Received
            </p>

              <p className="text-2xl font-extrabold mt-2 text-green-600">

    {formatCurrency(
      amountPaid || 0
    )}

  </p>

          </div>

          {/* DUE */}

          <div className="rounded-2xl bg-red-50 border border-red-100 p-5">
            <p className="text-xs uppercase tracking-wide text-red-700 font-semibold">
              Remaining Due
            </p>

            <p className="text-2xl font-extrabold mt-2 text-red-500">
              {status ===
                "paid" ||
              status ===
                "cancelled"
                ? formatCurrency(
                    0
                  )
                : formatCurrency(
                    Math.max(
  Math.round(
    totals.total
  ) -
  Number(amountPaid || 0),
  0
)
                  )}
            </p>
          </div>
        </div>

        {/* SUBMIT */}

       <button
              type="submit"
              className="continue-application w-full mt-6"
              disabled={loading}
            >
              <div>
                <div className="pencil"></div>
                <div className="folder">
                  <div className="top">
                    <svg viewBox="0 0 24 27">
                      <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z"></path>
                    </svg>
                  </div>
                  <div className="paper"></div>
                </div>
              </div>
              {loading ? "Creating Invoice..." : "Create Invoice"}
            </button>
      </div>
    </div>
  </div>
</div>
      </form>
    </div>

  );
};

const SummaryRow = ({ label, value, muted }) => (
  <div
    className="flex justify-between items-center"
    style={{ color: muted ? "var(--text-muted)" : "var(--text)" }}
  >
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default CreateInvoicePage;
