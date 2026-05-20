const Invoice = require("../models/Invoice");
const User = require("../models/User");
const {
  calculateInvoice,
} = require("../utils/calculateInvoice");

const {
  generateInvoiceNumber,
} = require("../services/invoiceNumberService");

const {
  generatePDF,
} = require("../services/pdfService");

const Product = require("../models/Product");

// ========================================
// HELPERS
// ========================================

const sanitizeFileName = (
  name
) =>
  String(name || "invoice")
    .replace(
      /[\\/:*?"<>|]/g,
      "-"
    )
    .replace(/\s+/g, " ")
    .trim();

const isFiniteNumber = (
  v
) =>
  typeof v === "number" &&
  Number.isFinite(v);

const pickPercent = (
  primary,
  fallback
) => {
  const parsedPrimary =
    Number(primary);

  if (
    Number.isFinite(
      parsedPrimary
    )
  ) {
    return parsedPrimary;
  }

  const parsedFallback =
    Number(fallback);

  if (
    Number.isFinite(
      parsedFallback
    )
  ) {
    return parsedFallback;
  }

  return 0;
};

// ========================================
// NORMALIZE FINANCIALS
// ========================================

const normalizeInvoiceFinancials =
  (invoice) => {
    if (
      !invoice ||
      !Array.isArray(
        invoice.items
      ) ||
      invoice.items.length ===
        0
    ) {
      return {
        normalized:
          invoice,

        patch: null,
      };
    }

    const recalculated =
      calculateInvoice({
        items:
          invoice.items,

        taxRate:
          pickPercent(
            invoice.taxRate,
            invoice.taxPercentage
          ),

        discountRate:
          pickPercent(
            invoice.discountRate,
            invoice.discountPercentage
          ),
      });

    return {
      normalized: {
        ...invoice,
        ...recalculated,
      },

      patch: {
        items:
          recalculated.items,

        subtotal:
          recalculated.subtotal,

        taxRate:
          recalculated.taxRate,

        taxPercentage:
          recalculated.taxPercentage,

        taxAmount:
          recalculated.taxAmount,

        discountRate:
          recalculated.discountRate,

        discountPercentage:
          recalculated.discountPercentage,

        discountAmount:
          recalculated.discountAmount,

        total:
          recalculated.total,
      },
    };
  };

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

        taxRate,
        taxPercentage,

        discountRate,
        discountPercentage,

        date,
        dueDate,

        notes,

        status,

        paymentMethod,

        amountPaid,
      } = req.body;

      const normalizedTaxRate =
        pickPercent(
          taxRate,
          taxPercentage
        );

      const normalizedDiscountRate =
        pickPercent(
          discountRate,
          discountPercentage
        );

      // ========================================
      // VALIDATE PRODUCTS
      // ========================================

      for (const item of items) {
        const product =
          await Product.findOne(
            {
              name:
                item.name,

              createdBy:
                req.user._id,
            }
          );

        if (!product) {
          return res
            .status(404)
            .json({
              message: `${item.name} not found`,
            });
        }

        if (
          Number(item.qty) >
          Number(
            product.stock
          )
        ) {
          return res
            .status(400)
            .json({
              message: `Only ${product.stock} ${product.unit} available for ${product.name}`,
            });
        }
      }

      // ========================================
      // CALCULATE
      // ========================================

      const calculated =
        calculateInvoice({
          items,

          taxRate:
            normalizedTaxRate,

          discountRate:
            normalizedDiscountRate,
        });

      // ========================================
      // NUMBER
      // ========================================

      const invoiceNumber =
        await generateInvoiceNumber();

      // ========================================
      // PAYMENT LOGIC
      // ========================================

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
        status ===
        "pending"
      ) {
        finalPaymentMethod =
          "Not Paid Yet";

        finalAmountPaid = 0;

        finalDueAmount =
          calculated.total;
      }

      // PAID

      if (
        status === "paid"
      ) {
        finalAmountPaid =
          calculated.total;

        finalDueAmount = 0;
      }

      // PARTIAL

      if (
        status ===
        "partial"
      ) {
        if (
          !Number.isFinite(
            finalAmountPaid
          )
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid payment amount",
            });
        }

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
                "Partial payment must be less than total invoice amount",
            });
        }

        finalDueAmount =
          calculated.total -
          finalAmountPaid;
      }

      // CANCELLED

      if (
        status ===
        "cancelled"
      ) {
        finalPaymentMethod =
          "Not Paid Yet";

        finalAmountPaid = 0;

        finalDueAmount = 0;
      }

      // ========================================
      // CREATE
      // ========================================

      const invoice =
        await Invoice.create({
          userId:
            req.user._id,

          invoiceNumber,

          date:
            date ||
            Date.now(),

          dueDate:
            dueDate || null,

          customer,

          ...calculated,

          notes:
            notes || null,

          status:
            status ||
            "pending",

          paymentMethod:
            finalPaymentMethod,

          amountPaid:
            finalAmountPaid,

          dueAmount:
            finalDueAmount,
        });

      // ========================================
      // UPDATE INVENTORY
      // ========================================

      if (
        status !==
        "cancelled"
      ) {
        for (const item of items) {
          const product =
            await Product.findOne(
              {
                name:
                  item.name,

                createdBy:
                  req.user
                    ._id,
              }
            );

          if (product) {
            product.stock =
              Number(
                product.stock
              ) -
              Number(
                item.qty
              );

            if (
              product.stock <
              0
            ) {
              product.stock = 0;
            }

            await product.save();
          }
        }
      }

      res.status(201).json({
        message:
          "Invoice created successfully",

        invoice,
      });
    } catch (err) {
      next(err);
    }
  };

// ========================================
// GET INVOICES
// ========================================

const getInvoices =
  async (
    req,
    res,
    next
  ) => {
    try {
      const filter = {
        userId:
          req.user._id,
      };

      if (
        req.query.status
      ) {
        filter.status =
          req.query.status;
      }

      const invoices =
        await Invoice.find(
          filter
        ).sort({
          createdAt: -1,
        });

      res.status(200).json({
        invoices,
      });
    } catch (err) {
      next(err);
    }
  };

// ========================================
// GET SINGLE INVOICE
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
        return res.status(404).json({
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
        await Invoice.findById(
          req.params.id
        );

      if (!invoice) {
        return res.status(404).json({
          message:
            "Invoice not found",
        });
      }

      const {
        status,
        paymentMethod,
        amountPaid,
      } = req.body;

      invoice.status =
        status ||
        invoice.status;

      invoice.paymentMethod =
        paymentMethod ||
        invoice.paymentMethod;

      invoice.amountPaid =
        Number(
          amountPaid || 0
        );

      invoice.dueAmount =
        Number(
          invoice.total || 0
        ) -
        Number(
          amountPaid || 0
        );

      // AUTO PAID

      if (
        invoice.dueAmount <=
        0
      ) {
        invoice.status =
          "paid";

        invoice.amountPaid =
          invoice.total;

        invoice.dueAmount = 0;
      }

      // RESET PENDING

      if (
        status ===
        "pending"
      ) {
        invoice.amountPaid = 0;

        invoice.dueAmount =
          invoice.total;

        invoice.paymentMethod =
          "Not Paid Yet";
      }

      const updated =
        await invoice.save();

      res.status(200).json({
        success: true,

        invoice: updated,
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
        return res.status(404).json({
          message:
            "Invoice not found",
        });
      }

      res.status(200).json({
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
        const {
          patch,
        } =
          normalizeInvoiceFinancials(
            invoice.toObject()
          );

        if (patch) {
          await Invoice.updateOne(
            {
              _id:
                invoice._id,
            },

            patch
          );
        }
      }

      res.status(200).json({
        message:
          "Invoices recalculated successfully",
      });
    } catch (err) {
      next(err);
    }
  };

// ========================================
// DOWNLOAD PDF
// ========================================
const downloadInvoicePDF = async (
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

    // CONVERT TO BUFFER

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