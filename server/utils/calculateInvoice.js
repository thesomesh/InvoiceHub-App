/**
 * All monetary calculations are performed server-side.
 * Frontend calculations are for UX only and are never trusted.
 */

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const calculateInvoice = ({ items, taxRate = 0, discountRate = 0 }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array must not be empty");
  }

  const calculatedItems = items.map((item, index) => {
    const qty = Number(item.qty);
    const price = Number(item.price);

    if (!Number.isFinite(qty) || qty < 1) {
      throw new Error(`Item ${index + 1}: quantity must be >= 1`);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Item ${index + 1}: price must be >= 0`);
    }

    return {
      name: String(item.name).trim(),
      qty,
      price: round2(price),
      total: round2(qty * price),
    };
  });

  const subtotal = round2(
    calculatedItems.reduce((sum, item) => sum + item.total, 0)
  );

  const parsedTaxRate = Number(taxRate);
  const parsedDiscountRate = Number(discountRate);

  if (!Number.isFinite(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100) {
    throw new Error("Tax rate must be between 0 and 100");
  }
  if (!Number.isFinite(parsedDiscountRate) || parsedDiscountRate < 0 || parsedDiscountRate > 100) {
    throw new Error("Discount rate must be between 0 and 100");
  }

  const discountAmount = round2((subtotal * parsedDiscountRate) / 100);
  const taxableAmount = round2(subtotal - discountAmount);
  const taxAmount = round2((taxableAmount * parsedTaxRate) / 100);
  const total = round2(taxableAmount + taxAmount);

  return {
    items: calculatedItems,
    subtotal,
    taxRate: parsedTaxRate,
    taxPercentage: parsedTaxRate,
    taxAmount,
    discountRate: parsedDiscountRate,
    discountPercentage: parsedDiscountRate,
    discountAmount,
    total,
  };
};

module.exports = { calculateInvoice };
