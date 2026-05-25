const round2 = (num) =>
  Math.round(
    (num + Number.EPSILON) * 100
  ) / 100;

const calculateInvoice = ({
  items,
  taxRate = 0,
  discountRate = 0,
}) => {

  // ========================================
  // ITEMS
  // ========================================

  const updatedItems =
    items.map((item) => {

      const qty =
        Number(item.qty || 0);

      const price =
        Number(item.price || 0);

      // ========================================
      // LINE TOTAL
      // ========================================

      const total =
        round2(
          qty * price
        );

      // ========================================
      // ITEM DISCOUNT
      // ========================================

      const itemDiscountRate =
        Number(
          item.discountRate || 0
        );

      const discountAmount =
        round2(
          (
            total *
            itemDiscountRate
          ) / 100
        );

      // ========================================
      // FINAL ITEM TOTAL
      // ========================================

      const finalTotal =
        round2(
          total -
          discountAmount
        );

      return {
        ...item,

        total,

        discountRate:
          itemDiscountRate,

        discountAmount,

        finalTotal,
      };
    });

  // ========================================
  // SUBTOTAL
  // ========================================

  const subtotal =
    round2(
      updatedItems.reduce(
        (sum, item) =>
          sum +
          item.total,
        0
      )
    );

  // ========================================
  // DISCOUNTED SUBTOTAL
  // PRODUCT DISCOUNT ALREADY INCLUDED
  // ========================================

  const discountedSubtotal =
    subtotal;

  // ========================================
  // INVOICE DISCOUNT
  // ========================================

  const invoiceDiscountAmount =
    round2(
      (
        discountedSubtotal *
        Number(
          discountRate || 0
        )
      ) / 100
    );

  // ========================================
  // FINAL ITEMS
  // ========================================

  const finalItems =
    updatedItems.map(
      (item) => {

        const share =
          subtotal > 0
            ? item.total /
              subtotal
            : 0;

        const invoiceDiscountShare =
          round2(
            invoiceDiscountAmount *
            share
          );

        const finalRevenue =
          round2(
            item.total -
            invoiceDiscountShare
          );

        return {
          ...item,

          invoiceDiscountShare,

          finalRevenue,
        };
      }
    );

  // ========================================
  // TOTAL DISCOUNT
  // ONLY OVERALL DISCOUNT
  // ========================================

  const totalDiscount =
    round2(
      invoiceDiscountAmount
    );

  // ========================================
  // TAXABLE AMOUNT
  // ========================================

  const taxableAmount =
    round2(
      discountedSubtotal -
      invoiceDiscountAmount
    );

  // ========================================
  // TAX
  // ========================================

  const taxAmount =
    round2(
      (
        taxableAmount *
        Number(
          taxRate || 0
        )
      ) / 100
    );

  // ========================================
  // RAW TOTAL
  // ========================================

  const rawTotal =
    round2(
      taxableAmount +
      taxAmount
    );

  // ========================================
  // FINAL ROUNDED TOTAL
  // ========================================

  const total =
    Math.round(
      rawTotal
    );

  // ========================================
  // ROUND OFF
  // ========================================

  const finalRoundOff =
    round2(
      total -
      rawTotal
    );

  return {
    items: finalItems,

    subtotal,

    discountAmount:
      totalDiscount,

    discountRate,

    taxRate,

    taxAmount,

    roundOff:
      finalRoundOff,

    total,
  };
};

module.exports = {
  calculateInvoice,
};