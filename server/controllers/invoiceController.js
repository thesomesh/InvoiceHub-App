const Invoice =
  require("../models/Invoice");

const User =
  require("../models/User");

const Product =
  require("../models/Product");

const {
  calculateInvoice,
} = require(
  "../utils/calculateInvoice"
);

const {
  generateInvoiceNumber,
} = require(
  "../services/invoiceNumberService"
);

const {
  generatePDF,
} = require(
  "../services/pdfService"
);

// ========================================
// CREATE INVOICE
// ========================================

const createInvoice =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        customer,
        items,

        taxRate = 0,

        discountRate = 0,

        notes,

        date,

        dueDate,

        status =
          "pending",

        paymentMethod =
          "Not Paid Yet",

        amountPaid = 0,
      } = req.body;

      // ========================================
      // CALCULATE
      // ========================================

      const calculated =
        calculateInvoice({
          items,

          taxRate,

          discountRate,
        });

      // ========================================
      // PAYMENT
      // ========================================

      let finalStatus =
        status;

      let finalPaymentMethod =
        paymentMethod;

      let finalAmountPaid =
        Number(
          amountPaid || 0
        );

      let finalDueAmount =
        calculated.total -
        finalAmountPaid;

      // PENDING

      if (
        finalStatus ===
        "pending"
      ) {
        finalAmountPaid = 0;

        finalDueAmount =
          calculated.total;

        finalPaymentMethod =
          "Not Paid Yet";
      }

      // PAID

      if (
        finalStatus ===
        "paid"
      ) {
        finalAmountPaid =
          calculated.total;

        finalDueAmount = 0;
      }

      // PARTIAL

      if (
        finalStatus ===
        "partial"
      ) {
        if (
          finalAmountPaid <=
          0
        ) {
          return res
            .status(400)
            .json({
              message:
                "Amount paid must be greater than 0",
            });
        }

        if (
          finalAmountPaid >=
          calculated.total
        ) {
          return res
            .status(400)
            .json({
              message:
                "Partial payment must be less than total amount",
            });
        }

        finalDueAmount =
          calculated.total -
          finalAmountPaid;
      }

      // CANCELLED

      if (
        finalStatus ===
        "cancelled"
      ) {
        finalAmountPaid = 0;

        finalDueAmount = 0;

        finalPaymentMethod =
          "Refunded";
      }

      // ========================================
      // CREATE
      // ========================================

  // 1. CREATE INVOICE
const invoice = await Invoice.create({
  userId: req.user._id,
  invoiceNumber:
    await generateInvoiceNumber(),
  customer,
  items: calculated.items,
  subtotal: calculated.subtotal,
  taxRate: calculated.taxRate,
  taxPercentage:
    calculated.taxPercentage,
  taxAmount:
    calculated.taxAmount,
  discountRate:
    calculated.discountRate,
  discountPercentage:
    calculated.discountPercentage,
  discountAmount:
    calculated.discountAmount,
  total: calculated.total,
  notes,
  date: date || Date.now(),
  dueDate: dueDate || null,
  status: finalStatus,
  paymentMethod:
    finalPaymentMethod,
  amountPaid:
    finalAmountPaid,
  dueAmount:
    finalDueAmount,
});


// 2. UPDATE PRODUCTS
for (const item of items) {
  const product = await Product.findOne({
    name: item.name,
    createdBy: req.user._id,
  });

  if (!product) continue;

  const soldQty = Number(item.qty);

  product.stock =
    Number(product.stock) - soldQty;

  if (product.stock < 0) {
    product.stock = 0;
  }

  product.totalValue =
    Number(product.stock) *
    Number(product.sellingPrice);

  const profitPerItem =
    Number(product.sellingPrice) -
    Number(product.costPrice);

  product.expectedProfit =
    Number(product.stock) *
    profitPerItem;

  product.totalSales =
    Number(product.totalSales || 0) +
    soldQty *
      Number(product.sellingPrice);

  product.totalSalesProfit =
    Number(product.totalSalesProfit || 0) +
    soldQty * profitPerItem;

  await product.save();
}


// 3. RESPONSE
res.status(201).json({
  success: true,
  invoice,
});
    } catch (err) {
      next(err);
    }
  };

// ========================================
// GET ALL
// ========================================

const getInvoices =
  async (
    req,
    res,
    next
  ) => {
    try {

      const {
        status,
        search,
        customer,
        fromDate,
        toDate,
      } = req.query;

      let query = {
        userId: req.user._id,
      };

      // STATUS FILTER

      if (
        status &&
        status !== "all"
      ) {
        query.status = status;
      }

      // SEARCH INVOICE NUMBER

      if (search) {
        query.invoiceNumber = {
          $regex: search,
          $options: "i",
        };
      }

      // CUSTOMER SEARCH

      if (customer) {
        query["customer.name"] = {
          $regex: customer,
          $options: "i",
        };
      }

      // DATE FILTER

      if (
        fromDate ||
        toDate
      ) {
        query.date = {};

        if (fromDate) {
          query.date.$gte =
            new Date(fromDate);
        }

        if (toDate) {
          query.date.$lte =
            new Date(toDate);
        }
      }

      const invoices =
        await Invoice.find(
          query
        ).sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        invoices,
      });

    } catch (err) {
      next(err);
    }
  };

// ========================================
// GET SINGLE
// ========================================

const getInvoiceById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const invoice =
        await Invoice.findOne({
          _id: req.params.id,

          userId:
            req.user._id,
        });

      if (!invoice) {
        return res
          .status(404)
          .json({
            message:
              "Invoice not found",
          });
      }

      res.status(200).json(
        invoice
      );
    } catch (err) {
      next(err);
    }
  };

// ========================================
// UPDATE STATUS
// ========================================

const updateInvoiceStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const invoice =
        await Invoice.findOne({
          _id: req.params.id,

          userId:
            req.user._id,
        });

      if (!invoice) {
        return res
          .status(404)
          .json({
            message:
              "Invoice not found",
          });
      }

      const {
        status,

        paymentMethod,

        amountPaid,
      } = req.body;

      // ========================================
      // CANCELLED
      // ========================================

      if (
        status ===
        "cancelled"
      ) {
        invoice.status =
          "cancelled";

        invoice.paymentMethod =
          "Refunded";

        invoice.amountPaid = 0;

        invoice.dueAmount = 0;

        await invoice.save();

        return res
          .status(200)
          .json({
            success: true,

            invoice,
          });
      }

      // ========================================
      // PAID
      // ========================================

      if (
        status === "paid"
      ) {
        invoice.status =
          "paid";

        invoice.paymentMethod =
          paymentMethod ||
          invoice.paymentMethod;

        invoice.amountPaid =
          invoice.total;

        invoice.dueAmount = 0;

        await invoice.save();

        return res
          .status(200)
          .json({
            success: true,

            invoice,
          });
      }

      // ========================================
      // PARTIAL
      // ========================================

      if (
        status ===
        "partial"
      ) {
        const paid =
          Number(
            amountPaid || 0
          );

        if (paid <= 0) {
          return res
            .status(400)
            .json({
              message:
                "Amount paid must be greater than 0",
            });
        }

        if (
          paid >=
          invoice.total
        ) {
          invoice.status =
            "paid";

          invoice.amountPaid =
            invoice.total;

          invoice.dueAmount = 0;
        } else {
          invoice.status =
            "partial";

          invoice.amountPaid =
            paid;

          invoice.dueAmount =
            invoice.total -
            paid;
        }

        invoice.paymentMethod =
          paymentMethod;

        await invoice.save();

        return res
          .status(200)
          .json({
            success: true,

            invoice,
          });
      }

      // ========================================
      // PENDING
      // ========================================

      if (
        status ===
        "pending"
      ) {
        invoice.status =
          "pending";

        invoice.paymentMethod =
          "Not Paid Yet";

        invoice.amountPaid = 0;

        invoice.dueAmount =
          invoice.total;
      }

      await invoice.save();

      res.status(200).json({
        success: true,

        invoice,
      });
    } catch (err) {
      next(err);
    }
  };

// ========================================
// DELETE
// ========================================

const deleteInvoice =
  async (
    req,
    res,
    next
  ) => {
    try {
      const invoice =
        await Invoice.findOneAndDelete(
          {
            _id:
              req.params.id,

            userId:
              req.user._id,
          }
        );

      if (!invoice) {
        return res
          .status(404)
          .json({
            message:
              "Invoice not found",
          });
      }

      res.status(200).json({
        success: true,

        message:
          "Invoice deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  };

// ========================================
// RECALCULATE
// ========================================

const recalculateInvoices =
  async (
    req,
    res,
    next
  ) => {
    try {
      const invoices =
        await Invoice.find({
          userId:
            req.user._id,
        });

      for (const invoice of invoices) {
        const recalculated =
          calculateInvoice({
            items:
              invoice.items,

            taxRate:
              invoice.taxRate,

            discountRate:
              invoice.discountRate,
          });

        invoice.subtotal =
          recalculated.subtotal;

        invoice.taxAmount =
          recalculated.taxAmount;

        invoice.discountAmount =
          recalculated.discountAmount;

        invoice.total =
          recalculated.total;

        await invoice.save();
      }

      res.status(200).json({
        success: true,

        message:
          "Invoices recalculated",
      });
    } catch (err) {
      next(err);
    }
  };

// ========================================
// DOWNLOAD PDF
// ========================================

const downloadInvoicePDF =
  async (
    req,
    res
  ) => {
    try {
      const invoice =
        await Invoice.findOne({
          _id: req.params.id,

          userId:
            req.user._id,
        });

      if (!invoice) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Invoice not found",
          });
      }

      const seller =
        await User.findById(
          req.user._id
        );

      const pdf =
        await generatePDF(
          invoice,
          seller
        );

      const pdfBuffer =
        Buffer.from(pdf);

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${invoice.invoiceNumber}.pdf"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      return res.end(
        pdfBuffer
      );
    } catch (error) {
      console.error(
        "PDF Download Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to generate PDF",
        });
    }
  };

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createInvoice,

  getInvoices,

  getInvoiceById,

  updateInvoiceStatus,

  deleteInvoice,

  recalculateInvoices,

  downloadInvoicePDF,
};