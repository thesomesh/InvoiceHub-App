const Counter =
  require("../models/Counter");

/**
 * Generate professional invoice number
 *
 * Format:
 * INV-YYYYMMDD-XXXXX
 *
 * Example:
 * INV-20260519-00001
 */

const generateInvoiceNumber = async (
  userId,
  invoiceDate
) => {
    try {

const date = invoiceDate
  ? new Date(invoiceDate)
  : new Date();

      // ========================================
      // DATE PARTS
      // ========================================

    const year = date.getFullYear();

const month = String(
  date.getMonth() + 1
).padStart(2, "0");

const day = String(
  date.getDate()
).padStart(2, "0");

      // ========================================
      // DATE FORMAT
      // ========================================

      const datePart =
        `${year}${month}${day}`;

      // ========================================
      // UNIQUE USER COUNTER
      // ========================================

      const counterId =
        `invoice_${userId}_${datePart}`;

      // ========================================
      // GET SEQUENCE
      // ========================================

      const sequence =
        await Counter.getNextSequence(
          counterId
        );

      // ========================================
      // FORMAT
      // ========================================

      const formattedSequence =
        String(sequence).padStart(
          5,
          "0"
        );

      // ========================================
      // FINAL NUMBER
      // ========================================

      return `INV-${datePart}-${formattedSequence}`;

    } catch (error) {

      console.error(
        "Invoice number generation failed:",
        error
      );

      throw new Error(
        "Unable to generate invoice number"
      );
    }
  };

module.exports = {
  generateInvoiceNumber,
};