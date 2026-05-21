const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // PRODUCT NAME
    name: {
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

    // UNIT
    unit: {
      type: String,
      required: true,
      trim: true,
    },

    // CURRENT STOCK
    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    // BUY PRICE
    costPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // SELL PRICE
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // INVENTORY VALUE
    totalValue: {
      type: Number,
      default: 0,
    },

    // PROFIT PER UNIT
    profitPerUnit: {
      type: Number,
      default: 0,
    },

    // FUTURE POSSIBLE PROFIT
    expectedProfit: {
      type: Number,
      default: 0,
    },

    // TOTAL SALES AMOUNT
    totalSales: {
      type: Number,
      default: 0,
    },

    // ACTUAL EARNED PROFIT
    totalSalesProfit: {
      type: Number,
      default: 0,
    },

    // LOW STOCK ALERT
    minimumStock: {
      type: Number,
      default: 5,
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
  "Product",
  productSchema
);