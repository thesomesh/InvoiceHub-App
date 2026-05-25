const express = require("express");

const router = express.Router();

const Product = require("../models/Product");

const {
  protect,
} = require("../middleware/auth");

// ========================================
// GET PRODUCTS
// ========================================

router.get(
  "/",
  protect,
  async (req, res) => {
    try {
      const {
        search,
        category,
        stockStatus,
      } = req.query;

      let query = {
        createdBy: req.user.id,
      };

      // SEARCH

      if (search) {
        query.name = {
          $regex: search,
          $options: "i",
        };
      }

      // CATEGORY FILTER

      if (
        category &&
        category !== "All"
      ) {
        query.category = category;
      }

      const products =
        await Product.find(query).sort({
          createdAt: -1,
        });

      // ========================================
      // STOCK FILTERS
      // ========================================

      let filteredProducts =
        products;

      // LOW STOCK

      if (
        stockStatus === "low"
      ) {
        filteredProducts =
          products.filter(
            (p) =>
              p.stock > 0 &&
              p.stock <=
                p.minimumStock
          );
      }

      // IN STOCK

      if (
        stockStatus ===
        "instock"
      ) {
        filteredProducts =
          products.filter(
            (p) =>
              p.stock >
              p.minimumStock
          );
      }

      // OUT OF STOCK

      if (
        stockStatus ===
        "outofstock"
      ) {
        filteredProducts =
          products.filter(
            (p) => p.stock <= 0
          );
      }

      res.json(filteredProducts);
    } catch (err) {
      res.status(500).json({
        message:
          "Failed to fetch products",
      });
    }
  }
);

// ========================================
// DASHBOARD STATS
// ========================================

router.get(
  "/dashboard/stats",
  protect,
  async (req, res) => {
    try {
      const products =
        await Product.find({
          createdBy: req.user.id,
        });

      // TOTAL PRODUCTS

      const totalProducts =
        products.length;

      // INVENTORY VALUE

      const inventoryValue =
        products.reduce(
          (sum, p) =>
            sum +
            Number(
              p.totalValue || 0
            ),
          0
        );

      // EXPECTED RETURNS

      const expectedReturns =
        inventoryValue;

      // EXPECTED PROFIT

      const expectedProfit =
        products.reduce(
          (sum, p) =>
            sum +
            Number(
              p.expectedProfit ||
                0
            ),
          0
        );

      // TOTAL SALES

      const totalSales =
        products.reduce(
          (sum, p) =>
            sum +
            Number(
              p.totalSales || 0
            ),
          0
        );

      // TOTAL SALES PROFIT

      const totalSalesProfit =
        products.reduce(
          (sum, p) =>
            sum +
            Number(
              p.totalSalesProfit ||
                0
            ),
          0
        );
         const cashCollected =
    products.reduce(
      (sum, p) =>
        sum +
        Number(
          p.totalCollected || 0
        ),
      0
    );

      // LOW STOCK

      const lowStockProducts =
        products.filter(
          (p) =>
            p.stock > 0 &&
            p.stock <=
              p.minimumStock
        ).length;

      // OUT OF STOCK

      const outOfStock =
        products.filter(
          (p) => p.stock <= 0
        ).length;

      // TOTAL CATEGORIES

      const categories =
        [
          ...new Set(
            products.map(
              (p) =>
                p.category
            )
          ),
        ].length;

      res.json({
        totalProducts,

        inventoryValue,

        expectedReturns,

        expectedProfit,

        totalSales,

        totalSalesProfit,

        lowStockProducts,

        outOfStock,

        categories,

         cashCollected,
      });
    } catch (err) {
      res.status(500).json({
        message:
          "Failed to load stats",
      });
    }
  }
);
// ========================================
// ADD PRODUCT
// ========================================

router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      const {
        name,
        category,
        unit,
        stock,
        costPrice,
        sellingPrice,

        // OPTIONAL PRODUCT DISCOUNT
        discountPercentage = 0,

        // OPTIONAL MANUAL FINAL PRICE
        finalSellingPrice,

        minimumStock,
      } = req.body;

      // ========================================
      // FINAL SELLING PRICE
      // ========================================

      const actualSellingPrice =
        Number(
          finalSellingPrice
        ) ||
        (
          Number(
            sellingPrice
          ) -
          (
            Number(
              sellingPrice
            ) *
            Number(
              discountPercentage
            )
          ) / 100
        );

      // ========================================
      // PROFIT PER UNIT
      // ========================================

      const profitPerUnit =
        actualSellingPrice -
        Number(costPrice);

      // ========================================
      // INVENTORY VALUE
      // ========================================

      const totalValue =
        Number(stock) *
        actualSellingPrice;

      // ========================================
      // EXPECTED PROFIT
      // ========================================

      const expectedProfit =
        Number(stock) *
        profitPerUnit;

      // ========================================
      // CREATE PRODUCT
      // ========================================

      const product =
        await Product.create({
          name,

          category,

          unit,

          stock,

          costPrice,

          // ORIGINAL SELL PRICE
          sellingPrice,

          // PRODUCT DISCOUNT
          discountPercentage,

          // FINAL SELL PRICE
          finalSellingPrice:
            actualSellingPrice,

          // INVENTORY
          totalValue,

          // PROFIT
          profitPerUnit,

          expectedProfit,

          // SALES
          totalSales: 0,

          totalSalesProfit: 0,

          // ALERT
          minimumStock,

          // USER
          createdBy:
            req.user.id,
        });

      res.status(201).json(
        product
      );
    } catch (err) {
      console.log(err);

      res.status(500).json({
        message:
          "Failed to create product",
      });
    }
  }
);

// ========================================
// UPDATE PRODUCT
// ========================================

router.put(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const updatedData = {
        ...req.body,
      };

      // ========================================
      // FINAL SELL PRICE
      // ========================================

      const actualSellingPrice =
        Number(
          updatedData
            .finalSellingPrice
        ) ||
        (
          Number(
            updatedData
              .sellingPrice
          ) -
          (
            Number(
              updatedData
                .sellingPrice
            ) *
            Number(
              updatedData
                .discountPercentage ||
                0
            )
          ) / 100
        );

      // ========================================
      // PROFIT PER UNIT
      // ========================================

      updatedData.profitPerUnit =
        actualSellingPrice -
        Number(
          updatedData.costPrice
        );

      // ========================================
      // TOTAL VALUE
      // ========================================

      updatedData.totalValue =
        Number(
          updatedData.stock
        ) *
        actualSellingPrice;

      // ========================================
      // EXPECTED PROFIT
      // ========================================

      updatedData.expectedProfit =
        Number(
          updatedData.stock
        ) *
        updatedData.profitPerUnit;

      // ========================================
      // SAVE FINAL SELL PRICE
      // ========================================

      updatedData.finalSellingPrice =
        actualSellingPrice;

      // ========================================
      // UPDATE
      // ========================================

      const product =
        await Product.findOneAndUpdate(
          {
            _id:
              req.params.id,

            createdBy:
              req.user.id,
          },

          updatedData,

          {
            new: true,
          }
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      res.json(product);
    } catch (err) {
      console.log(err);

      res.status(500).json({
        message:
          "Failed to update product",
      });
    }
  }
);

// ========================================
// DELETE PRODUCT
// ========================================

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const product =
        await Product.findOneAndDelete(
          {
            _id:
              req.params.id,

            createdBy:
              req.user.id,
          }
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      res.json({
        message:
          "Product deleted successfully",
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        message:
          "Failed to delete product",
      });
    }
  }
);

module.exports = router;