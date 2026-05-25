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
         roundOff = 0,
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
    roundOff,
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
const paymentHistory = [];

if (finalAmountPaid > 0) {
  paymentHistory.push({
    amount: finalAmountPaid,
    method: finalPaymentMethod,
    date: new Date(),
  });
}

const invoice = await Invoice.create({
  userId: req.user._id,

  invoiceNumber:
    await generateInvoiceNumber(
      req.user._id
    ),

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

  roundOff:
    calculated.roundOff,

  paymentHistory
});


// ========================================
// 2. MERGE DUPLICATE PRODUCT QTY
// ========================================

const mergedQty = {};

for (const item of calculated.items) {
  mergedQty[item.name] =
    (mergedQty[item.name] || 0) +
    Number(item.qty);
}

// ========================================
// 3. VALIDATE STOCK
// ========================================

for (const item of calculated.items) {
  const product =
    await Product.findOne({
      name: item.name,
      createdBy: req.user._id,
    });

  if (!product) {
    return res.status(404).json({
      message: `${item.name} not found`,
    });
  }

if (
  product.stock <
  mergedQty[item.name]
) {
    return res.status(400).json({
      message:
        `${item.name} has only ${product.stock} ${product.unit} left in stock`
    });
  }
}

// ========================================
// 3. UPDATE PRODUCTS AFTER VALIDATION
// ========================================

for (const item of calculated.items) {
  const product =
    await Product.findOne({
      name: item.name,
      createdBy: req.user._id,
    });

  const soldQty =
    Number(item.qty);

  // Deduct ONCE only
  product.stock =
    Number(product.stock) -
    soldQty;

  if (product.stock < 0) {
    product.stock = 0;
  }

  product.totalValue =
    Number(product.stock) *
    Number(
      product.finalSellingPrice ||
      product.sellingPrice
    );

  product.expectedProfit =
    Number(product.stock) *
    Number(
      product.profitPerUnit
    );

  const finalRevenue =
    Number(item.finalRevenue || 0);

  const totalCost =
    soldQty *
    Number(product.costPrice);

  const finalProfit =
    finalRevenue - totalCost;

  const itemShare =
    calculated.subtotal > 0
      ? finalRevenue /
        calculated.subtotal
      : 0;

  const collectedAmount =
    finalRevenue +
    (
      Number(calculated.roundOff || 0)
      * itemShare
    );

  const paymentRatio =
    calculated.total > 0
      ? finalAmountPaid /
        calculated.total
      : 0;

  const paidRevenue =
    finalRevenue *
    paymentRatio;

  const paidCollected =
    collectedAmount *
    paymentRatio;

  const paidProfit =
    finalProfit *
    paymentRatio;

  product.totalSales =
    Number(
      product.totalSales || 0
    ) + paidRevenue;

  product.totalCollected =
    Number(
      product.totalCollected || 0
    ) + paidCollected;

  product.totalSalesProfit =
    Number(
      product.totalSalesProfit || 0
    ) + paidProfit;

  product.totalUnitsSold =
    Number(
      product.totalUnitsSold || 0
    ) + soldQty;

  product.lastSoldAt =
    new Date();

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
  paymentMethod,
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
if (
  paymentMethod &&
  paymentMethod !== "all"
) {
  query.paymentMethod =
    paymentMethod;
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
const syncProductPaymentStats =
  async (
    invoice,
    userId,
    oldAmountPaid = 0
  ) => {
    const newRatio =
      invoice.total > 0
        ? invoice.amountPaid /
          invoice.total
        : 0;

    const oldRatio =
      invoice.total > 0
        ? oldAmountPaid /
          invoice.total
        : 0;

    for (const item of invoice.items) {
      const product =
        await Product.findOne({
          name: item.name,
          createdBy: userId,
        });

      if (!product) continue;

      const finalRevenue =
        Number(
          item.finalRevenue || 0
        );

      const totalCost =
        Number(item.qty) *
        Number(product.costPrice);

      const finalProfit =
        finalRevenue - totalCost;

      const itemShare =
        invoice.subtotal > 0
          ? finalRevenue /
            invoice.subtotal
          : 0;

      const collectedAmount =
        finalRevenue +
        (
          Number(
            invoice.roundOff || 0
          ) * itemShare
        );

      const revenueDelta =
        finalRevenue *
        (newRatio - oldRatio);

      const collectedDelta =
        collectedAmount *
        (newRatio - oldRatio);

      const profitDelta =
        finalProfit *
        (newRatio - oldRatio);

      product.totalSales =
        Number(
          product.totalSales || 0
        ) + revenueDelta;

      product.totalCollected =
        Number(
          product.totalCollected || 0
        ) + collectedDelta;

      product.totalSalesProfit =
        Number(
          product.totalSalesProfit || 0
        ) + profitDelta;

      await product.save();
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
const oldAmountPaid =
  invoice.amountPaid || 0;
      const {
        status,

        paymentMethod,

        amountPaid,
      } = req.body;

      // ========================================
      // CANCELLED
      // ========================================
if (status === "cancelled") {

  // RESTORE INVENTORY
  for (const item of invoice.items) {

    const product =
      await Product.findOne({
        name: item.name,
        createdBy: req.user._id,
      });

    if (!product) continue;

const returnedQty =
  Number(item.qty);

const returnedRevenue =
  Number(item.finalRevenue || 0);

const returnedUnitPrice =
  Number(
    product.finalSellingPrice ||
    product.sellingPrice
  );

const paymentRatio =
  invoice.total > 0
    ? invoice.amountPaid / invoice.total
    : 0;

const refundedCollected =
  returnedRevenue * paymentRatio;

const totalCost =
  returnedQty *
  Number(product.costPrice);

const refundedProfit =
  returnedRevenue - totalCost;

// RESTORE STOCK
product.stock =
  Number(product.stock) +
  returnedQty;

// INVENTORY VALUE
product.totalValue =
  Number(product.stock) *
  returnedUnitPrice;

// EXPECTED PROFIT
product.expectedProfit =
  Number(product.stock) *
  Number(product.profitPerUnit);
// REVERSE SALES
product.totalSales =
  Number(product.totalSales || 0) -
  returnedRevenue;

// REVERSE CASH
product.totalCollected =
  Number(product.totalCollected || 0) -
  refundedCollected;

// REVERSE PROFIT
product.totalSalesProfit =
  Number(product.totalSalesProfit || 0) -
  refundedProfit;

// PREVENT NEGATIVE VALUES
if (product.totalSales < 0) {
  product.totalSales = 0;
}

if (product.totalCollected < 0) {
  product.totalCollected = 0;
}

if (product.totalSalesProfit < 0) {
  product.totalSalesProfit = 0;
}

await product.save();
  }
if (invoice.amountPaid > 0) {
  invoice.paymentHistory.push({
    amount: -Number(
      invoice.amountPaid
    ),
    method: "Refund",
    date: new Date(),
  });
}
  // UPDATE INVOICE
  invoice.status = "cancelled";

  invoice.paymentMethod = "Refunded";

  invoice.amountPaid = 0;

  invoice.dueAmount = 0;

  await invoice.save();

  return res.status(200).json({
    success: true,
    invoice,
  });
}

      // ========================================
      // PAID
      // ========================================

     if (status === "paid") {
  const paid =
    Number(amountPaid || 0);

  const totalPaid =
    Number(invoice.amountPaid || 0) +
    paid;

  invoice.paymentHistory.push({
    amount: paid,
    method: paymentMethod,
    date: new Date(),
  });

  invoice.amountPaid =
    Math.min(
      totalPaid,
      invoice.total
    );

  invoice.dueAmount =
    Math.max(
      invoice.total -
        invoice.amountPaid,
      0
    );

  invoice.status =
    invoice.dueAmount === 0
      ? "paid"
      : "partial";

  invoice.paymentMethod =
    paymentMethod ||
    invoice.paymentMethod;

  await invoice.save();

  await syncProductPaymentStats(
    invoice,
    req.user._id,
    oldAmountPaid
  );

  return res.status(200).json({
    success: true,
    invoice,
  });
}

// ========================================
// PARTIAL
// ========================================

if (status === "partial") {
  const paid =
    Number(amountPaid || 0);

  if (paid <= 0) {
    return res.status(400).json({
      message:
        "Amount paid must be greater than 0",
    });
  }

  const totalPaid =
    Number(invoice.amountPaid || 0) +
    paid;

  invoice.paymentHistory.push({
    amount: paid,
    method: paymentMethod,
    date: new Date(),
  });

  if (totalPaid >= invoice.total) {
    invoice.status = "paid";
    invoice.amountPaid =
      invoice.total;
    invoice.dueAmount = 0;
  } else {
    invoice.status =
      "partial";

    invoice.amountPaid =
      totalPaid;

    invoice.dueAmount =
      invoice.total -
      totalPaid;
  }

  invoice.paymentMethod =
    paymentMethod;

  await invoice.save();

  await syncProductPaymentStats(
    invoice,
    req.user._id,
    oldAmountPaid
  );

  return res.status(200).json({
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
await syncProductPaymentStats(
  invoice,
  req.user._id,
  oldAmountPaid
);
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
const round2 = (num) =>
  Math.round(
    (num + Number.EPSILON) * 100
  ) / 100;
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

      let updatedCount = 0;





      

      for (const invoice of invoices) {
// FIX OLD ITEM PRICES
// ========================================
// FIX OLD BROKEN ITEM PRICES
// ========================================
for (const item of invoice.items) {

  // OLD BROKEN INVOICES
  // HAD finalTotal SAVED AS price

  if (
    item.finalTotal &&
    Number(item.finalTotal) > 0
  ) {

    item.price =
      round2(
        Number(item.finalTotal) /
        Number(item.qty || 1)
      );
  }
}
        // ========================================
        // RECALCULATE
        // ========================================

        const recalculated =
          calculateInvoice({
            items:
              invoice.items,

            taxRate:
              invoice.taxRate || 0,

            discountRate:
              invoice.discountRate || 0,
          });

        // ========================================
        // UPDATE TOTALS
        // ========================================

        invoice.items =
          recalculated.items;

        invoice.subtotal =
          recalculated.subtotal;

        invoice.discountAmount =
          recalculated.discountAmount;

        invoice.taxAmount =
          recalculated.taxAmount;

        invoice.roundOff =
          recalculated.roundOff;

        invoice.total =
          recalculated.total;

        // ========================================
        // PAYMENT LOGIC
        // ========================================

        if (
          invoice.status ===
          "pending"
        ) {

          invoice.amountPaid = 0;

          invoice.dueAmount =
            invoice.total;
        }

        else if (
          invoice.status ===
          "partial"
        ) {

          invoice.dueAmount =
            Math.max(
              invoice.total -
              Number(
                invoice.amountPaid || 0
              ),
              0
            );
        }

        else if (
          invoice.status ===
          "paid"
        ) {

          // KEEP CUSTOMER ENTERED PAYMENT

          invoice.dueAmount = 0;
        }

        else if (
          invoice.status ===
          "cancelled"
        ) {

          invoice.amountPaid = 0;

          invoice.dueAmount = 0;
        }

        // ========================================
        // SAVE
        // ========================================

        await invoice.save();

        updatedCount++;
      }

      res.status(200).json({
        success: true,

        message:
          `${updatedCount} invoices recalculated successfully`,
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