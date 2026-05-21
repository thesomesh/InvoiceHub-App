const mongoose =
  require("mongoose");

// ========================================
// ITEM SCHEMA
// ========================================

const itemSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,

        required: [
          true,
          "Item name is required",
        ],

        trim: true,
      },

      qty: {
        type: Number,

        required: [
          true,
          "Quantity is required",
        ],

        min: [
          1,
          "Quantity must be at least 1",
        ],
      },

      price: {
        type: Number,

        required: [
          true,
          "Price is required",
        ],

        min: [
          0,
          "Price cannot be negative",
        ],
      },

      total: {
        type: Number,

        required: true,

        min: [
          0,
          "Item total cannot be negative",
        ],
      },
    },

    {
      _id: false,
    }
  );

// ========================================
// INVOICE SCHEMA
// ========================================

const invoiceSchema =
  new mongoose.Schema(
    {
      // ========================================
      // USER
      // ========================================

      userId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      // ========================================
      // INVOICE INFO
      // ========================================

      invoiceNumber: {
        type: String,

        required: true,

        unique: true,

        trim: true,
      },

      date: {
        type: Date,

        required: [
          true,
          "Invoice date is required",
        ],

        default: Date.now,
      },

      dueDate: {
        type: Date,

        default: null,
      },

      // ========================================
      // CUSTOMER
      // ========================================

      customer: {
        name: {
          type: String,

          required: [
            true,
            "Customer name is required",
          ],

          trim: true,
        },

        phone: {
          type: String,

          required: [
            true,
            "Customer phone is required",
          ],

          trim: true,
        },

        email: {
          type: String,

          trim: true,

          lowercase: true,

          default: null,
        },

        address: {
          type: String,

          trim: true,

          default: null,
        },
      },

      // ========================================
      // ITEMS
      // ========================================

      items: {
        type: [itemSchema],

        validate: {
          validator: (v) =>
            Array.isArray(v) &&
            v.length > 0,

          message:
            "At least one item is required",
        },
      },

      // ========================================
      // FINANCIALS
      // ========================================

      subtotal: {
        type: Number,

        required: true,

        min: 0,

        default: 0,
      },

      taxRate: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      taxPercentage: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      taxAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      discountRate: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      discountPercentage: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      discountAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      total: {
        type: Number,

        required: true,

        min: 0,

        default: 0,
      },

      // ========================================
      // NOTES
      // ========================================

      notes: {
        type: String,

        trim: true,

        default: null,
      },

      // ========================================
      // PAYMENT STATUS
      // ========================================

      status: {
        type: String,

        enum: [
          "pending",
          "partial",
          "paid",
          "cancelled",
        ],

        default: "pending",
      },

      // ========================================
      // PAYMENT METHOD
      // ========================================

      paymentMethod: {
        type: String,

        enum: [
          "Cash",
          "UPI",
          "Card",
          "Bank Transfer",
          "Cheque",
          "Other",
          "Not Paid Yet",
          "Refunded",
        ],

        default:
          "Not Paid Yet",
      },

      // ========================================
      // PAYMENT TRACKING
      // ========================================

      amountPaid: {
        type: Number,

        default: 0,

        min: 0,
      },

      dueAmount: {
        type: Number,

        default: 0,

        min: 0,
      },

      // ========================================
      // OPTIONAL TRACKING
      // ========================================

      paidAt: {
        type: Date,

        default: null,
      },

      cancelledAt: {
        type: Date,

        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

// ========================================
// AUTO PAYMENT LOGIC
// ========================================

invoiceSchema.pre(
  "save",
  function (next) {
    // PAID

    if (
      this.status === "paid"
    ) {
      this.amountPaid =
        this.total;

      this.dueAmount = 0;

      this.paidAt =
        new Date();
    }

    // PENDING

    if (
      this.status ===
      "pending"
    ) {
      this.amountPaid = 0;

      this.dueAmount =
        this.total;

      this.paymentMethod =
        "Not Paid Yet";
    }

    // PARTIAL

    if (
      this.status ===
      "partial"
    ) {
      this.dueAmount =
        this.total -
        this.amountPaid;

      if (
        this.dueAmount < 0
      ) {
        this.dueAmount = 0;
      }
    }

    // CANCELLED

    if (
      this.status ===
      "cancelled"
    ) {
      this.cancelledAt =
        new Date();

      this.paymentMethod =
        "Refunded";
    }

    next();
  }
);

// ========================================
// EXPORT
// ========================================

module.exports =
  mongoose.model(
    "Invoice",
    invoiceSchema
  );