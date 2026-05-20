const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const calculateTotals = (items, taxRate = 0, discountRate = 0) => {
  const validItems = items.filter(
    (i) => i.name && parseFloat(i.qty) >= 1 && parseFloat(i.price) >= 0
  );

  const subtotal = round2(
    validItems.reduce((sum, item) => {
      return sum + round2(parseFloat(item.qty || 0) * parseFloat(item.price || 0));
    }, 0)
  );

  const parsedTax = Math.min(100, Math.max(0, parseFloat(taxRate) || 0));
  const parsedDiscount = Math.min(100, Math.max(0, parseFloat(discountRate) || 0));

  const discountAmount = round2((subtotal * parsedDiscount) / 100);
  const taxableAmount = round2(subtotal - discountAmount);
  const taxAmount = round2((taxableAmount * parsedTax) / 100);
  const total = round2(taxableAmount + taxAmount);

  return { subtotal, discountAmount, taxAmount, total };
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
