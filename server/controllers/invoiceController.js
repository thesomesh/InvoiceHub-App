const Invoice =
  require("../models/Invoice");

const User =
  require("../models/User");

const Product =
  require("../models/Product");
const Expense = require("../models/Expense");
const {
  generatePurchaseReportPDF
} = require(
  "../services/purchaseReportService"
);
const {
  generateSalesReportPDF
} = require("../services/salesReportService");
const {
  calculateInvoice,
} = require(
  "../utils/calculateInvoice"
);
const Account =
require("../models/Account");

const Ledger =
require(
 "../models/LedgerTransaction"
);
const {
  generateInventoryPDF
} = require("../services/productReportService");

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
        accountId,
      } = req.body;

      // ========================================
      // CALCULATE
      // ========================================

      for (const item of items) {
  const product = await Product.findOne({
    name: item.name,
    createdBy: req.user._id,
  });

  if (product) {
    item.category = product.category;
  }
}
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
      accountId,
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
accountId,
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
        `${item.name} has only ${product.stock}left in stock`
    });
  }
}

// ========================================
// 3. UPDATE PRODUCTS AFTER VALIDATION
// ========================================
let distributedRoundOff = 0;
for (const item of invoice.items) {
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
  Number(product.costPrice || 0);

product.expectedRevenue =
  Number(product.stock) *
  Number(
    product.finalSellingPrice ||
    product.sellingPrice ||
    0
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

// distribute overall invoice discount
const itemShare =
  calculated.subtotal > 0
    ? finalRevenue /
      calculated.subtotal
    : 0;


const isLastItem =
  calculated.items.indexOf(item) ===
  calculated.items.length - 1;

let invoiceRoundShare;

if (calculated.items.length === 1) {
  invoiceRoundShare =
    Number(invoice.roundOff || 0);

} else if (isLastItem) {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) -
      distributedRoundOff
    );

} else {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) *
      itemShare
    );

  distributedRoundOff +=
    invoiceRoundShare;
}

const actualRevenue =
  round2(
    finalRevenue +
    invoiceRoundShare
  );

// real product profit
const finalProfit =
  round2(
    actualRevenue -
    totalCost
  );
// no roundoff allocation
item.finalProfit = finalProfit;
item.actualRevenue = actualRevenue;
item.totalCost = totalCost;

  const paymentRatio =
    calculated.total > 0
      ? finalAmountPaid /
        calculated.total
      : 0;
const paidRevenue =
  actualRevenue;
const paidCollected =
  invoice.amountPaid > 0
    ? round2(
        finalAmountPaid *
        itemShare
      )
    : 0;
const paidProfit =
  finalProfit;
product.totalSales =
  round2(
    Number(product.totalSales || 0) +
    paidRevenue
  );

product.totalCollected =
  round2(
    Number(product.totalCollected || 0) +
    paidCollected
  );

product.totalSalesProfit =
  round2(
    Number(product.totalSalesProfit || 0) +
    paidProfit
  );

  product.totalUnitsSold =
    Number(
      product.totalUnitsSold || 0
    ) + soldQty;

  product.lastSoldAt =
    new Date();

await product.save();
}

await invoice.save();

if (
  finalAmountPaid > 0 &&
  accountId
) {

  const account =
    await Account.findOne({
      _id: accountId,
      createdBy:
        req.user._id,
    });

  if (account) {

    account.currentBalance +=
      Number(finalAmountPaid);

    await account.save();

    await Ledger.create({
      accountId:
        account._id,

      particulars:
        `Invoice ${invoice.invoiceNumber}`,

      credit:
        Number(finalAmountPaid),

      debit: 0,

      balanceAfter:
        account.currentBalance,

      sourceType:
        "invoice",

      sourceId:
        invoice._id,

      note:
        customer?.name || "",

      createdBy:
        req.user._id,
    });
  }
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
  accountId,
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
    userId: req.user._id,
  })
  .populate("accountId", "name")
  .populate(
    "paymentHistory.accountId",
    "name"
  );

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
let distributedRoundOff = 0;
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

  const itemShare =
  round2(
    invoice.subtotal > 0
      ? finalRevenue / invoice.subtotal
      : 0
  );
const isLastItem =
  invoice.items.indexOf(item) ===
  invoice.items.length - 1;

let invoiceRoundShare;

if (invoice.items.length === 1) {
  invoiceRoundShare =
    Number(invoice.roundOff || 0);

} else if (isLastItem) {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) -
      distributedRoundOff
    );

} else {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) *
      itemShare
    );

  distributedRoundOff +=
    invoiceRoundShare;
}

const actualRevenue =
  round2(
    finalRevenue +
    invoiceRoundShare
  );

const finalProfit =
  round2(
    actualRevenue -
    totalCost
  );

item.finalProfit = finalProfit;
item.actualRevenue = actualRevenue;
item.totalCost = totalCost;
    
const collectedDelta =
  (invoice.amountPaid - oldAmountPaid) *
  itemShare;


      product.totalCollected =
        Number(
          product.totalCollected || 0
        ) + collectedDelta;

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
  accountId,
  refundAccountId,
  refundMethod,
    refundAmount,
} = req.body;

      // ========================================
      // CANCELLED
      // ========================================
if (
  status === "cancelled"
) {



  let distributedRoundOff = 0;
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

const itemShare =
  invoice.subtotal > 0
    ? returnedRevenue /
      invoice.subtotal
    : 0;

const isLastItem =
  invoice.items.indexOf(item) ===
  invoice.items.length - 1;

let invoiceRoundShare;

if (invoice.items.length === 1) {
  invoiceRoundShare =
    Number(invoice.roundOff || 0);

} else if (isLastItem) {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) -
      distributedRoundOff
    );

} else {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) *
      itemShare
    );

  distributedRoundOff +=
    invoiceRoundShare;
}

const actualRevenue =
  round2(
    returnedRevenue +
    invoiceRoundShare
  );
const refundedCollected =
  invoice.amountPaid * itemShare;

const totalCost =
  returnedQty *
  Number(product.costPrice);

const refundedProfit =
  round2(
    actualRevenue -
    totalCost
  );
// RESTORE STOCK
product.stock =
  Number(product.stock) +
  returnedQty;

// INVENTORY VALUE
product.totalValue =
  Number(product.stock) *
  Number(product.costPrice);

// EXPECTED REVENUE
product.expectedRevenue =
  Number(product.stock) *
  Number(
    product.finalSellingPrice ||
    product.sellingPrice ||
    0
  );

// EXPECTED PROFIT
product.expectedProfit =
  Number(product.stock) *
  Number(
    product.profitPerUnit || 0
  );

// REVERSE SOLD QTY
product.totalUnitsSold =
  Math.max(
    0,
    Number(product.totalUnitsSold || 0) -
      returnedQty
  );
// REVERSE SALES
product.totalSales =
  Math.round(
    (
      Number(product.totalSales || 0) -
      actualRevenue
    ) * 100
  ) / 100;

product.totalCollected =
  Math.round(
    (
      Number(product.totalCollected || 0) -
      refundedCollected
    ) * 100
  ) / 100;
// REVERSE PROFIT
product.totalSalesProfit =
  Math.round(
    (
      Number(
        product.totalSalesProfit || 0
      ) -
      refundedProfit
    ) * 100
  ) / 100;
// PREVENT NEGATIVE VALUES
if (product.totalSales < 0) {
  product.totalSales = 0;
}

if (product.totalCollected < 0) {
  product.totalCollected = 0;
}
if (
  Math.abs(
    product.totalSalesProfit
  ) < 1
) {
  product.totalSalesProfit = 0;
}


await product.save();
  }
if (invoice.amountPaid > 0) {
 invoice.paymentHistory.push({
 amount:
  -Number(refundAmount),
  method:
    refundMethod || "Refund",

  accountId:
    refundAccountId,

  date: new Date(),
});
}
// REFUND ACCOUNT BALANCE

if (
  invoice.amountPaid > 0 &&
  refundAccountId
) {
  const account =
    await Account.findOne({
      _id: refundAccountId,
      createdBy: req.user._id,
    });
if (
  account.currentBalance <
  Number(refundAmount)
) {
  return res.status(400).json({
    message:
      "Insufficient balance in account",
  });
}
  if (account) {
    account.currentBalance -=
     Number(refundAmount);

    await account.save();

    await Ledger.create({
      accountId:
        account._id,

      particulars:
        `Refund ${invoice.invoiceNumber}`,

    debit:
  Number(refundAmount),

      credit: 0,

      balanceAfter:
        account.currentBalance,

      sourceType:
        "refund",

      sourceId:
        invoice._id,

      createdBy:
        req.user._id,
    });
  }
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
     
  ...(accountId
    ? { accountId }
    : {}),
  });

  invoice.amountPaid =
    Math.min(
      totalPaid,
      invoice.total
    );
if (paid > 0 && accountId) {
  const account =
    await Account.findOne({
      _id: accountId,
      createdBy: req.user._id,
    });

  if (account) {
    account.currentBalance += paid;

    await account.save();

    await Ledger.create({
      accountId: account._id,
      particulars: `Invoice ${invoice.invoiceNumber}`,
      credit: paid,
      debit: 0,
      balanceAfter: account.currentBalance,
      sourceType: "invoice",
      sourceId: invoice._id,
      createdBy: req.user._id,
    });
  }
}
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
 
  ...(accountId
    ? { accountId }
    : {}),
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
        console.log(
      "RECALCULATE HIT"
    );
    try {

     const invoices =
  await Invoice.find({
    userId:
      req.user._id,
  });

let updatedCount = 0;
console.log("RESETTING PRODUCTS");


const products =
  await Product.find({
    createdBy: req.user._id,
  });

for (const product of products) {
  product.totalSales = 0;
  product.totalCollected = 0;
  product.totalSalesProfit = 0;
  product.totalUnitsSold = 0;

  await product.save();
}


      

      for (const invoice of invoices) {
// FIX OLD ITEM PRICES

console.log(
  invoice.invoiceNumber,
  invoice.amountPaid
);
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
    items: invoice.items,
    taxRate: invoice.taxRate || 0,
    discountRate:
      invoice.discountPercentage || 0,
    roundOff:
      invoice.roundOff || 0
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

// REBUILD PRODUCT STATS
if (
  invoice.status !== "cancelled"
) {
  let distributedRoundOff = 0;
  for (const item of invoice.items) {

    const product =
      await Product.findOne({
        name: item.name,
        createdBy: req.user._id,
      });

    if (!product) continue;

    const qty =
      Number(item.qty);

    const finalRevenue =
      Number(item.finalRevenue || 0);

    const itemShare =
      invoice.subtotal > 0
        ? finalRevenue /
          invoice.subtotal
        : 0;

 

const isLastItem =
  invoice.items.indexOf(item) ===
  invoice.items.length - 1;

let invoiceRoundShare;

if (invoice.items.length === 1) {
  invoiceRoundShare =
    Number(invoice.roundOff || 0);

} else if (isLastItem) {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) -
      distributedRoundOff
    );

} else {
  invoiceRoundShare =
    round2(
      Number(invoice.roundOff || 0) *
      itemShare
    );

  distributedRoundOff +=
    invoiceRoundShare;
}

    const actualRevenue =
      round2(
        finalRevenue +
        invoiceRoundShare
      );

    const totalCost =
      qty *
      Number(product.costPrice);

    const finalProfit =
      round2(
        actualRevenue -
        totalCost
      );
item.finalProfit = finalProfit;
item.actualRevenue = actualRevenue;
item.totalCost = totalCost;
    const collected =
      invoice.amountPaid > 0
        ? round2(
            invoice.amountPaid *
            itemShare
          )
        : 0;

    product.totalSales =
      round2(
        Number(product.totalSales || 0) +
        actualRevenue
      );

    product.totalCollected =
      round2(
        Number(product.totalCollected || 0) +
        collected
      );

    product.totalSalesProfit =
      round2(
        Number(product.totalSalesProfit || 0) +
        finalProfit
      );

product.totalUnitsSold =
  Number(product.totalUnitsSold || 0) +
  Number(qty || 0);

console.log(
  "SOLD UPDATE:",
  product.name,
  qty,
  product.totalUnitsSold
);

  round2(product.totalSales);

product.totalCollected =
  round2(product.totalCollected);

product.totalSalesProfit =
  round2(product.totalSalesProfit);

    await product.save();
  }

  await invoice.save(); // save item profit fields
}

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
const downloadProductReportPDF = async (req, res) => {
  try {
    const products = await Product.find({
      createdBy: req.user._id
    });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found"
      });
    }

    const seller = await User.findById(
      req.user._id
    );

    const totalSales = products.reduce(
      (sum, p) =>
        sum + Number(p.totalSales || 0),
      0
    );

    const cashCollected = products.reduce(
      (sum, p) =>
        sum +
        Number(p.totalCollected || 0),
      0
    );

    const report = {
  products,

  totalProducts: products.length,

  totalCategories: [
    ...new Set(
      products.map(
        p => p.category || "General"
      )
    )
  ].length,

  totalStockUnits:
    products.reduce(
      (sum, p) =>
        sum + Number(p.stock || 0),
      0
    ),

  inventoryValue:
    products.reduce(
      (sum, p) =>
        sum +
        Number(p.totalValue || 0),
      0
    ),
    expectedRevenue:
  products.reduce(
    (sum, p) =>
      sum +
      Number(
        p.expectedRevenue || 0
      ),
    0  
  ),   
totalSales: products.reduce(
  (sum, p) =>
    sum + Number(p.totalSales || 0),
  0
),

totalProfit: products.reduce(
  (sum, p) =>
    sum +
    Number(
      p.totalSalesProfit || 0
    ),
  0
),
  lowStockProducts:
    products.filter(
      p =>
        Number(p.stock || 0) > 0 &&
        Number(p.stock || 0) <=
          Number(
            p.minimumStock || 5
          )
    ).length,

  outOfStock:
    products.filter(
      p =>
        Number(p.stock || 0) <= 0
    ).length,

  healthyStock:
    products.filter(
      p =>
        Number(p.stock || 0) >
        Number(
          p.minimumStock || 5
        )
    ).length,

  zeroMovement:
    products.filter(
      p =>
        Number(
          p.totalUnitsSold || 0
        ) === 0
    ).length,

  lastStockActivity:
    products.length
      ? new Date(
          Math.max(
            ...products.map(
              p =>
                new Date(
                  p.updatedAt
                )
            )
          )
        ).toLocaleString("en-IN")
      : "N/A",

  categoryDistribution:
    products.reduce(
      (acc, p) => {
        const cat =
          p.category ||
          "General";

        acc[cat] =
          (acc[cat] || 0) +
          Number(
            p.totalValue || 0
          );

        return acc;
      },
      {}
    )
};

    const sellerInfo = {
      businessName:
        seller?.businessName ||
        "InvoiceHub",

      address:
        seller?.address ||
        "Business Address",

      phone:
        seller?.phone ||
        "N/A",

      email:
        seller?.email ||
        "N/A"
    };

    const pdf =
      await generateInventoryPDF(
        report,
        sellerInfo
      );

    res.writeHead(200, {
      "Content-Type":
        "application/pdf",

      "Content-Disposition":
`attachment; filename="inventory-report-${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}.pdf"`,

      "Content-Length":
        pdf.length
    });

    return res.end(pdf);

  } catch (error) {
    console.error(
      "Inventory PDF Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate inventory report",
      error: error.message
    });
  }
};
const downloadPurchaseReportPDF =
async (req, res) => {
  try {

    const {
  type,
  customStart,
  customEnd,
  analysisMonths = 3
} = req.query;

    const products =
      await Product.find({
        createdBy: req.user._id
      });

    const seller =
      await User.findById(
        req.user._id
      );

    const sellerData = {
      _id: req.user._id,

      businessName:
        seller?.businessName ||
        "InvoiceHub",

      address:
        seller?.address ||
        "Business Address",

      phone:
        seller?.phone ||
        "N/A",

      email:
        seller?.email ||
        "N/A"
    };

    const pdf =
      await generatePurchaseReportPDF(
        products,
        sellerData,
        type,
        customStart,
        customEnd,
        Number(analysisMonths)
      );

    res.writeHead(200, {
      "Content-Type":
        "application/pdf",

      "Content-Disposition":
        `attachment; filename="purchase-report.pdf"`,

      "Content-Length":
        pdf.length
    });

    return res.end(pdf);

  } catch (error) {

    console.error(
      "Purchase PDF Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate purchase report",
      error: error.message
    });
  }
};

const downloadSalesReportPDF =
async (req, res) => {
  try {
    const {
      type,
      customStart,
      customEnd
    } = req.query;

    const invoices =
      await Invoice.find({
        userId: req.user._id
      });

    const expenses =
      await Expense.find({
        createdBy: req.user._id
      });
      const products = await Product.find({
  createdBy: req.user._id
});

  const includeProductSales =
req.query.includeProductSales === "true";
const includeProductPurchases =
  req.query.includeProductPurchases === "true";
const seller =
  await User.findById(
    req.user._id
  );

const sellerData = {
  _id: req.user._id,

  businessName:
    seller?.businessName || "InvoiceHub",

  address:
    seller?.address || "Business Address",

  phone:
    seller?.phone || "N/A",

  email:
    seller?.email || "N/A"
};
const pdf =
  await generateSalesReportPDF(
    invoices,
    expenses,
    products,
    sellerData,
    type,
    customStart,
    customEnd,
    includeProductSales,
    includeProductPurchases
  );



  const pdfBuffer = pdf;

    res.writeHead(200, {
      "Content-Type":
        "application/pdf",

      "Content-Disposition":
        `attachment; filename="${type}.pdf"`,

      "Content-Length":
        pdfBuffer.length
    });

    return res.end(pdfBuffer);

  } catch (error) {
    console.error(
      "Sales PDF Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate sales report",
      error: error.message
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

  downloadProductReportPDF,
  downloadSalesReportPDF ,
  downloadPurchaseReportPDF,
};