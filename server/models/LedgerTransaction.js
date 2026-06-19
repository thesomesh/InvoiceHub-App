const mongoose = require("mongoose");

const ledgerTransactionSchema =
  new mongoose.Schema(
    {
      accountId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
      },

      date: {
        type: Date,
        default: Date.now,
      },

      particulars: {
        type: String,
        required: true,
        trim: true,
      },

      credit: {
        type: Number,
        default: 0,
      },

      debit: {
        type: Number,
        default: 0,
      },

      balanceAfter: {
        type: Number,
        required: true,
      },

      sourceType: {
        type: String,
        enum: [
          "invoice",
          "expense",
          "expense-reversal",
          "refund",
          "transfer",
          "manual",
          "opening",
        ],
        default: "manual",
      },

      sourceId: {
        type:
          mongoose.Schema.Types.ObjectId,
      },
isReversal: {
  type: Boolean,
  default: false,
},
      note: {
        type: String,
        default: "",
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "LedgerTransaction",
  ledgerTransactionSchema
);