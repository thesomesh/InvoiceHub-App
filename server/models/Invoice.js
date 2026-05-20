const mongoose =
  require("mongoose");

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

    { _id: false }
  );

const invoiceSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      invoiceNumber: {
        type: String,

        required: true,

        unique: true,
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

      subtotal: {
        type: Number,

        required: true,

        min: [
          0,
          "Subtotal cannot be negative",
        ],
      },

      taxRate: {
        type: Number,

        default: 0,

        min: [
          0,
          "Tax rate cannot be negative",
        ],

        max: [
          100,
          "Tax rate cannot exceed 100%",
        ],
      },

      taxPercentage: {
        type: Number,

        default: 0,

        min: [
          0,
          "Tax percentage cannot be negative",
        ],

        max: [
          100,
          "Tax percentage cannot exceed 100%",
        ],
      },

      taxAmount: {
        type: Number,

        default: 0,

        min: [
          0,
          "Tax amount cannot be negative",
        ],
      },

      discountRate: {
        type: Number,

        default: 0,

        min: [
          0,
          "Discount rate cannot be negative",
        ],

        max: [
          100,
          "Discount rate cannot exceed 100%",
        ],
      },

      discountPercentage: {
        type: Number,

        default: 0,

        min: [
          0,
          "Discount percentage cannot be negative",
        ],

        max: [
          100,
          "Discount percentage cannot exceed 100%",
        ],
      },

      discountAmount: {
        type: Number,

        default: 0,

        min: [
          0,
          "Discount amount cannot be negative",
        ],
      },

      total: {
        type: Number,

        required: true,

        min: [
          0,
          "Total cannot be negative",
        ],
      },

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
      // AMOUNT PAID
      // ========================================

      amountPaid: {
        type: Number,

        default: 0,

        min: [
          0,
          "Amount paid cannot be negative",
        ],
      },

      // ========================================
      // DUE AMOUNT
      // ========================================

      dueAmount: {
        type: Number,

        default: 0,

        min: [
          0,
          "Due amount cannot be negative",
        ],
      },
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Invoice",
    invoiceSchema
  );