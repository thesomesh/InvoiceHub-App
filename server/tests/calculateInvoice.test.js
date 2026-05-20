
const { calculateInvoice } = require("../utils/calculateInvoice");

let passed = 0;
let failed = 0;

const assert = (description, fn) => {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
};

const assertEqual = (actual, expected, label = "") => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
};

const assertThrows = (fn, expectedMsg) => {
  try {
    fn();
    throw new Error("Expected function to throw, but it did not");
  } catch (err) {
    if (!err.message.includes(expectedMsg)) {
      throw new Error(`Expected error containing "${expectedMsg}", got "${err.message}"`);
    }
  }
};

console.log("\n=== calculateInvoice Unit Tests ===\n");

// ─── Basic Calculations ────────────────────────────────────────────────────
console.log("Basic Calculations:");

assert("single item, no tax, no discount", () => {
  const result = calculateInvoice({
    items: [{ name: "Widget", qty: 2, price: 100 }],
    taxRate: 0,
    discountRate: 0,
  });
  assertEqual(result.subtotal, 200, "subtotal");
  assertEqual(result.taxAmount, 0, "taxAmount");
  assertEqual(result.discountAmount, 0, "discountAmount");
  assertEqual(result.total, 200, "total");
});

assert("multiple items summed correctly", () => {
  const result = calculateInvoice({
    items: [
      { name: "A", qty: 3, price: 10 },
      { name: "B", qty: 1, price: 50 },
      { name: "C", qty: 2, price: 25 },
    ],
  });
  assertEqual(result.subtotal, 130, "subtotal");
  assertEqual(result.items[0].total, 30, "item A total");
  assertEqual(result.items[1].total, 50, "item B total");
  assertEqual(result.items[2].total, 50, "item C total");
});

assert("item totals are rounded to 2 decimal places", () => {
  const result = calculateInvoice({
    items: [{ name: "X", qty: 3, price: 0.1 }],
  });
  assertEqual(result.items[0].total, 0.3, "item total rounding");
  assertEqual(result.subtotal, 0.3, "subtotal rounding");
});

// ─── Tax Calculations ──────────────────────────────────────────────────────
console.log("\nTax Calculations:");

assert("18% GST applied correctly", () => {
  const result = calculateInvoice({
    items: [{ name: "Service", qty: 1, price: 1000 }],
    taxRate: 18,
  });
  assertEqual(result.taxAmount, 180, "taxAmount");
  assertEqual(result.total, 1180, "total");
});

assert("tax applied on post-discount amount", () => {
  const result = calculateInvoice({
    items: [{ name: "Service", qty: 1, price: 1000 }],
    taxRate: 10,
    discountRate: 10,
  });
  // subtotal=1000, discount=100, taxable=900, tax=90, total=990
  assertEqual(result.subtotal, 1000, "subtotal");
  assertEqual(result.discountAmount, 100, "discountAmount");
  assertEqual(result.taxAmount, 90, "taxAmount on post-discount");
  assertEqual(result.total, 990, "total");
});

// ─── Discount Calculations ─────────────────────────────────────────────────
console.log("\nDiscount Calculations:");

assert("50% discount applied correctly", () => {
  const result = calculateInvoice({
    items: [{ name: "Item", qty: 2, price: 500 }],
    discountRate: 50,
  });
  assertEqual(result.subtotal, 1000, "subtotal");
  assertEqual(result.discountAmount, 500, "discountAmount");
  assertEqual(result.total, 500, "total");
});

assert("zero discount produces no change", () => {
  const result = calculateInvoice({
    items: [{ name: "Item", qty: 1, price: 200 }],
    discountRate: 0,
  });
  assertEqual(result.discountAmount, 0, "discountAmount");
  assertEqual(result.total, 200, "total");
});

// ─── Validation / Error Handling ──────────────────────────────────────────
console.log("\nValidation & Error Handling:");

assert("throws on empty items array", () => {
  assertThrows(
    () => calculateInvoice({ items: [] }),
    "Items array must not be empty"
  );
});

assert("throws on qty < 1", () => {
  assertThrows(
    () => calculateInvoice({ items: [{ name: "X", qty: 0, price: 100 }] }),
    "quantity must be >= 1"
  );
});

assert("throws on negative price", () => {
  assertThrows(
    () => calculateInvoice({ items: [{ name: "X", qty: 1, price: -50 }] }),
    "price must be >= 0"
  );
});

assert("throws on tax rate > 100", () => {
  assertThrows(
    () => calculateInvoice({ items: [{ name: "X", qty: 1, price: 100 }], taxRate: 150 }),
    "Tax rate must be between 0 and 100"
  );
});

assert("throws on discount rate > 100", () => {
  assertThrows(
    () => calculateInvoice({ items: [{ name: "X", qty: 1, price: 100 }], discountRate: 101 }),
    "Discount rate must be between 0 and 100"
  );
});

assert("price of 0 is valid (free item)", () => {
  const result = calculateInvoice({
    items: [{ name: "Freebie", qty: 5, price: 0 }],
  });
  assertEqual(result.total, 0, "total for free item");
});

// ─── Edge Cases ────────────────────────────────────────────────────────────
console.log("\nEdge Cases:");

assert("float qty and price produce correct total", () => {
  const result = calculateInvoice({
    items: [{ name: "Partial", qty: 1.5, price: 200 }],
  });
  assertEqual(result.items[0].total, 300, "float qty total");
  assertEqual(result.subtotal, 300, "float qty subtotal");
});

assert("100% discount results in zero total", () => {
  const result = calculateInvoice({
    items: [{ name: "Item", qty: 1, price: 999 }],
    discountRate: 100,
    taxRate: 18,
  });
  assertEqual(result.total, 0, "100% discount total");
  assertEqual(result.taxAmount, 0, "0 tax on 0 taxable amount");
});

assert("large invoice with many items", () => {
  const items = Array.from({ length: 20 }, (_, i) => ({
    name: `Item ${i + 1}`,
    qty: i + 1,
    price: 100,
  }));
  // sum of 1..20 = 210 items × 100 = 21000
  const result = calculateInvoice({ items, taxRate: 18 });
  assertEqual(result.subtotal, 21000, "large invoice subtotal");
  assertEqual(result.taxAmount, 3780, "large invoice taxAmount");
  assertEqual(result.total, 24780, "large invoice total");
});

// ─── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("⚠️  Some tests failed.");
  process.exit(1);
} else {
  console.log("✅ All tests passed.");
}
