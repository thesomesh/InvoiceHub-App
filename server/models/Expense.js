const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // EXPENSE TITLE

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // CATEGORY

    category: {
      type: String,
      required: true,
      default: "General",
      trim: true,
    },

    // PAYMENT MODE

    paymentMode: {
      type: String,
      required: true,

      enum: [
        "Cash",
        "UPI",
        "Card",
        "Bank Transfer",
        "Cheque",
        "Other",
      ],

      default: "Cash",
    },

    // AMOUNT

    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // DATE

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // NOTES

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // USER

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Expense",
  expenseSchema
);