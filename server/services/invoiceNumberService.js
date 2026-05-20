const Counter = require("../models/Counter");

/**
 * Generate professional invoice number
 *
 * Format:
 * INV-YYYYMMDD-XXXXX
 *
 * Example:
 * INV-20260519-00001
 */

const generateInvoiceNumber = async () => {
  try {
    const now = new Date();

    // Date parts
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // Formatted date
    const datePart = `${year}${month}${day}`;

    // Counter ID per day
    const counterId = `invoice_${datePart}`;

    // Get atomic sequence
    const sequence = await Counter.getNextSequence(counterId);

    // Format sequence
    const formattedSequence = String(sequence).padStart(5, "0");

    // Final invoice number
    const invoiceNumber = `INV-${datePart}-${formattedSequence}`;

    return invoiceNumber;
  } catch (error) {
    console.error("Invoice number generation failed:", error);

    throw new Error("Unable to generate invoice number");
  }
};

module.exports = {
  generateInvoiceNumber,
};