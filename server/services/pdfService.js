const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const generateInvoiceHTML = (
  invoice,
  seller
) => {
  const itemRows =
    invoice.items
      .map(
        (
          item,
          i
        ) => `
    <tr class="${
      i % 2 === 0
        ? "row-even"
        : "row-odd"
    }">
      <td class="td-name">
        ${item.name}
      </td>

      <td class="td-center">
        ${item.qty}
      </td>

      <td class="td-right">
        ${formatCurrency(
          item.price
        )}
      </td>

      <td class="td-right td-total">
        ${formatCurrency(
          item.total
        )}
      </td>
    </tr>`
      )
      .join("");

  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  Invoice ${invoice.invoiceNumber}
</title>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    'Helvetica Neue',
    Helvetica,
    Arial,
    sans-serif;

  font-size: 13px;

  color: #1a1a2e;

  background: #fff;

  padding: 48px;

  position: relative;
}

/* ========================================
   MINIMAL WATERMARK
======================================== */

.watermark {
  position: fixed;

  inset: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  pointer-events: none;

  z-index: 0;
}
.wm {
  transform: rotate(-30deg);

  text-align: center;
opacity: 0.035;

  margin-top: -20px;
}

.wm-title {
  font-size: 92px;

  font-weight: 900;

  color: #0f172a;

  letter-spacing: 1px;

  line-height: 1;
}

.wm-sub {
  margin-top: 8px;

  font-size: 22px;

  color: #334155;

  letter-spacing: 10px;

  text-transform: uppercase;
}

/* ========================================
   CONTENT
======================================== */

.invoice-wrapper {
  position: relative;

  z-index: 1;
}

.header {
  display: flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  margin-bottom: 48px;

  padding-bottom: 32px;

  border-bottom:
    3px solid #0f3460;
}

.brand-block h1 {
  font-size: 28px;

  font-weight: 800;

  color: #0f3460;

  letter-spacing: -0.5px;
}

.brand-block p {
  margin-top: 4px;

  color: #64748b;

  font-size: 12px;

  line-height: 1.6;
}

.invoice-meta {
  text-align: right;
}

.invoice-meta .inv-badge {
  display: inline-block;

  background: #0f3460;

  color: #fff;

  padding: 6px 18px;

  border-radius: 4px;

  font-size: 11px;

  font-weight: 700;

  letter-spacing: 1.5px;

  text-transform: uppercase;

  margin-bottom: 12px;
}

.invoice-meta p {
  color: #475569;

  font-size: 12px;

  line-height: 1.8;
}

.invoice-meta span {
  font-weight: 600;

  color: #1a1a2e;
}

.status-badge {
  display: inline-block;

  padding: 3px 10px;

  border-radius: 20px;

  font-size: 11px;

  font-weight: 600;

  text-transform: uppercase;

  letter-spacing: 0.5px;

  margin-top: 8px;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-partial {
  background: #dbeafe;
  color: #1e40af;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.parties {
  display: flex;

  justify-content:
    space-between;

  margin-bottom: 36px;

  gap: 32px;
}

.party-block {
  flex: 1;
}

.party-block h3 {
  font-size: 10px;

  text-transform: uppercase;

  letter-spacing: 1.5px;

  color: #94a3b8;

  margin-bottom: 10px;

  font-weight: 700;
}

.party-block p {
  font-size: 13px;

  line-height: 1.7;

  color: #334155;
}

.party-block .party-name {
  font-size: 15px;

  font-weight: 700;

  color: #0f3460;

  margin-bottom: 4px;
}

table {
  width: 100%;

  border-collapse: collapse;

  margin-bottom: 0;
}

thead tr {
  background: #0f3460;
}

thead th {
  color: #fff;

  padding: 12px 16px;

  font-size: 11px;

  font-weight: 600;

  letter-spacing: 0.8px;

  text-transform: uppercase;
}

th:first-child {
  text-align: left;
}

th:not(:first-child) {
  text-align: right;
}

.td-name {
  padding: 11px 16px;

  color: #334155;

  font-weight: 500;
}

.td-center {
  padding: 11px 16px;

  text-align: right;

  color: #64748b;
}

.td-right {
  padding: 11px 16px;

  text-align: right;

  color: #334155;
}

.td-total {
  font-weight: 600;

  color: #0f3460;
}

.row-even {
  background: #f8fafc;
}

.row-odd {
  background: #fff;
}

.summary-section {
  display: flex;

  justify-content:
    flex-end;

  margin-top: 0;

  border-top:
    2px solid #e2e8f0;

  padding-top: 0;
}

.summary-table {
  width: 300px;
}

.summary-row {
  display: flex;

  justify-content:
    space-between;

  padding: 8px 16px;

  font-size: 13px;

  color: #475569;

  border-bottom:
    1px solid #f1f5f9;
}

.summary-row.total-row {
  background: #0f3460;

  color: #fff;

  font-weight: 700;

  font-size: 15px;

  padding: 12px 16px;

  border-bottom: none;
}

.summary-row span:last-child {
  font-weight: 600;
}

.notes-section {
  margin-top: 36px;

  padding: 16px;

  background: #f8fafc;

  border-left:
    4px solid #0f3460;

  border-radius:
    0 4px 4px 0;
}

.notes-section h4 {
  font-size: 11px;

  text-transform: uppercase;

  letter-spacing: 1px;

  color: #94a3b8;

  margin-bottom: 6px;
}

.notes-section p {
  color: #475569;

  line-height: 1.6;
}

.footer {
  margin-top: 48px;

  padding-top: 20px;

  border-top:
    1px solid #e2e8f0;

  text-align: center;

  color: #94a3b8;

  font-size: 11px;
}

.gstin-badge {
  display: inline-block;

  background: #f1f5f9;

  border:
    1px solid #e2e8f0;

  padding: 2px 8px;

  border-radius: 3px;

  font-size: 11px;

  font-family: monospace;

  color: #475569;

  margin-top: 4px;
}

</style>

</head>

<body>
<div class="watermark">

  <div class="wm">

    <div class="wm-title">
      ${seller.businessName.toUpperCase()}
    </div>

    <div class="wm-sub">
      I N V O I C E H U B
    </div>

  </div>

</div>
<div class="invoice-wrapper">

  <div class="header">

    <div class="brand-block">

      <h1>
        ${
          seller.businessName
        }
      </h1>

      <p>
        ${
          seller.address
        }<br/>

        ${
          seller.phone
        }<br/>

        ${
          seller.email
        }
      </p>

      ${
        seller.gstin
          ? `
          <span class="gstin-badge">
            GSTIN:
            ${seller.gstin}
          </span>
        `
          : ""
      }

    </div>

    <div class="invoice-meta">

      <div class="inv-badge">
        Invoice
      </div>

      <p>
        <span>#</span>
        ${
          invoice.invoiceNumber
        }
      </p>

      <p>
        Date:
        <span>
          ${formatDate(
            invoice.date
          )}
        </span>
      </p>

      ${
        invoice.dueDate
          ? `
          <p>
            Due:
            <span>
              ${formatDate(
                invoice.dueDate
              )}
            </span>
          </p>
        `
          : ""
      }

      <div>
        <span
          class="status-badge status-${
            invoice.status
          }"
        >
          ${
            invoice.status
          }
        </span>
      </div>

    </div>

  </div>

  <div class="parties">

    <div class="party-block">

      <h3>
        Billed To
      </h3>

      <p class="party-name">
        ${
          invoice.customer
            .name
        }
      </p>

      <p>
        ${
          invoice.customer
            .phone
        }
      </p>

      ${
        invoice.customer
          .email
          ? `
          <p>
            ${invoice.customer.email}
          </p>
        `
          : ""
      }

      ${
        invoice.customer
          .address
          ? `
          <p>
            ${invoice.customer.address}
          </p>
        `
          : ""
      }

    </div>

  </div>

  <table>

    <thead>

      <tr>

        <th>
          Item / Service
        </th>

        <th>
          Qty
        </th>

        <th>
          Unit Price
        </th>

        <th>
          Amount
        </th>

      </tr>

    </thead>

    <tbody>

      ${itemRows}

    </tbody>

  </table>
<div class="summary-section">

  <div class="summary-table">

    <div class="summary-row">
      <span>
        Subtotal
      </span>

      <span>
        ${formatCurrency(
          invoice.subtotal
        )}
      </span>
    </div>

    <div class="summary-row">
      <span>
        ${
          Number(
            invoice.discountPercentage ??
              invoice.discountRate
          ) > 0
            ? `Discount (${invoice.discountPercentage ?? invoice.discountRate}%)`
            : "Discount (0%)"
        }
      </span>

      <span>
        -
        ${formatCurrency(
          invoice.discountAmount ||
            0
        )}
      </span>
    </div>

    <div class="summary-row">
      <span>
        ${
          Number(
            invoice.taxPercentage ??
              invoice.taxRate
          ) > 0
            ? `Tax (${invoice.taxPercentage ?? invoice.taxRate}%)`
            : "Tax (0%)"
        }
      </span>

      <span>
        ${formatCurrency(
          invoice.taxAmount ||
            0
        )}
      </span>
    </div>

    <!-- PAYMENT MODE -->

    <div class="summary-row">
      <span>
        Payment Mode
      </span>

      <span>
        ${
          invoice.paymentMethod ||
          "N/A"
        }
      </span>
    </div>

    <!-- AMOUNT PAID -->

    <div class="summary-row">
      <span>
        Amount Paid
      </span>

      <span>
        ${formatCurrency(
          invoice.amountPaid ||
            0
        )}
      </span>
    </div>

    <!-- DUE -->

    ${
      invoice.status ===
        "partial" ||
      invoice.status ===
        "pending"
        ? `
        <div class="summary-row">

          <span>
            Remaining Due
          </span>

          <span style="color:#dc2626;font-weight:700;">
            ${formatCurrency(
              invoice.dueAmount ||
                invoice.total
            )}
          </span>

        </div>
      `
        : ""
    }

    <div class="summary-row total-row">

      <span>
        Total
      </span>

      <span>
        ${formatCurrency(
          invoice.total
        )}
      </span>

    </div>

  </div>

</div>
  ${
    invoice.notes
      ? `
      <div class="notes-section">

        <h4>
          Notes
        </h4>

        <p>
          ${invoice.notes}
        </p>

      </div>
    `
      : ""
  }

  <div class="footer">

    <p>
  Generated with InvoiceHub
      Generated on
      ${formatDate(
        new Date()
      )}.
    </p>

  </div>

</div>

</body>

</html>
`;
};

const generatePDF = async (
  invoice,
  seller
) => {
  const html =
    generateInvoiceHTML(
      invoice,
      seller
    );

  try {
    const browser =
      await puppeteer.launch({
        headless: "new",

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

    try {
      const page =
        await browser.newPage();

      await page.setContent(
        html,
        {
          waitUntil:
            "networkidle0",
        }
      );

      const pdf =
        await page.pdf({
          format: "A4",

          printBackground: true,

          margin: {
            top: "0mm",
            right: "0mm",
            bottom: "0mm",
            left: "0mm",
          },
        });

      return pdf;
    } finally {
      await browser.close();
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  generatePDF,
};