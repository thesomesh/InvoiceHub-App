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
  default: "kg",
  trim: true,
},

    // STOCK
    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    // COST PRICE
    costPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // ORIGINAL SELLING PRICE
    sellingPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // DEFAULT PRODUCT DISCOUNT
    discountPercentage: {
      type: Number,
      default: 0,
    },

    // FINAL SELLING PRICE
    finalSellingPrice: {
      type: Number,
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

    // EXPECTED PROFIT
    expectedProfit: {
      type: Number,
      default: 0,
    },

    // TOTAL REVENUE
    totalSales: {
      type: Number,
      default: 0,
    },

    // NET PROFIT
    totalSalesProfit: {
      type: Number,
      default: 0,
    },
totalCollected: {
  type: Number,
  default: 0,
},

totalUnitsSold: {
  type: Number,
  default: 0,
},
   purchaseHistory: [
  {
    date: {
      type: Date,
      default: Date.now,
    },

    units: {
      type: Number,
      default: 0,
    },

    costPrice: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },
  },
], // LOW STOCK
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