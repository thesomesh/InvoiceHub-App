const puppeteer = require("puppeteer");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(amount || 0);
const formatDate = (date, timezone) =>
  new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone || "UTC"
  });

const formatDateTime = (date, timezone) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

const formatTime = (date, timezone) =>
  new Date(date).toLocaleTimeString("en-IN", {
    timeZone: timezone || "UTC"
  });
const generateInventoryHTML = (
  report,
  seller
) => {
  const productRows = report.products
    .map((product, i) => {
      const cost = Number(
        product.costPrice || 0
      );

      const sell = Number(
        product.finalSellingPrice || 0
      );

   const discount = Number(
  product.discountPercentage || 0
);
      const margin =
        cost > 0
          ? (
              ((sell - cost) / cost) *
              100
            ).toFixed(0)
          : 0;

      return `
<tr class="${
  i % 2 === 0
    ? "row-even"
    : "row-odd"
}">
<td>${product.name}</td>
<td>${product.category || "General"}</td>
<td>${product.stock || 0}</td>
<td style="font-weight:700;color:#0f3460;">
${Number(product.totalUnitsSold || 0)}
</td>
<td>${formatCurrency(cost)}</td>
<td>${formatCurrency(sell)}</td>
<td>${discount}%</td>
<td>${margin}%</td>
<td>${formatCurrency(product.totalValue)}</td>
<td>${formatCurrency(product.totalSales || 0)}</td>
<td>${formatCurrency(product.totalSalesProfit || 0)}</td>
<td>${formatDateTime(product.updatedAt)}</td>
</tr>
`;
    })
    .join("");

  const categoryRows =
    Object.entries(
      report.categoryDistribution ||
        {}
    )
      .map(
        ([cat, val]) => `
<div class="summary-row">
<span>${cat}</span>
<span>${formatCurrency(val)}</span>
</div>
`
      )
      .join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>

<style>
*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
font-family:Arial,sans-serif;
padding:40px;
color:#1a1a2e;
}

.watermark{
position:fixed;
opacity:.025;
transform:rotate(-30deg);
font-size:90px;
font-weight:900;
color:#0f3460;
pointer-events:none;
}

.wm1{
top:18%;
left:8%;
}

.wm2{
top:48%;
left:30%;
}

.wm3{
top:76%;
left:52%;
}
.header{
display:flex;
justify-content:space-between;
border-bottom:3px solid #0f3460;
padding-bottom:20px;
margin-bottom:30px;
}

.brand h1{
font-size:24px;
font-weight:800;
color:#0f3460;
}

.brand p{
color:#64748b;
line-height:1.5;
font-size:14px;
}

.badge{
background:#0f3460;
color:#fff;
padding:8px 16px;
font-size:12px;
font-weight:700;
border-radius:4px;
}

.section-title{
margin:28px 0 14px;
font-size:18px;
font-weight:700;
color:#0f3460;
}

.summary-row{
display:flex;
justify-content:space-between;
padding:8px 0;
border-bottom:1px solid #e2e8f0;
font-size:13px;
color:#334155;
}

table{
width:100%;
border-collapse:collapse;
margin-top:18px;
}

thead{
background:#0f3460;
color:#fff;
}

th{
padding:10px 6px;
font-size:10px;
text-align:center;
}

td{
padding:12px 6px;
font-size:11px;
text-align:center;
line-height:1.4;
vertical-align:middle;
}

td:first-child{
width:260px;
max-width:260px;
text-align:left;
padding:12px 10px;
white-space:normal;
word-break:break-word;
line-height:1.45;
font-weight:600;
font-size:12px;
vertical-align:middle;
}
.row-even{
background:#f8fafc;
}

.row-odd{
background:#fff;
}

.footer{
margin-top:35px;
text-align:left;
color:#64748b;
border-top:1px solid #dbe2ea;
padding-top:14px;
font-size:14px;
line-height:1.6;
}

.footer h3{
font-size:16px;
font-weight:700;
color:#0f3460;
margin-bottom:8px;
}
</style>
</head>

<body>

<div class="watermark wm1">INVOICEHUB</div>
<div class="watermark wm2">INVOICEHUB</div>
<div class="watermark wm3">INVOICEHUB</div>

<div class="header">
<div class="brand">
<h1>${seller.businessName}</h1>
<p>
${seller.address}<br/>
${seller.phone}<br/>
${seller.email}
</p>
</div>

<div>
<div class="badge">
INVOICEHUB REPORT
</div>
<p style="margin-top:10px;font-size:14px;">
${formatDateTime(new Date(), seller.timezone)}
</p>
</div>
</div>

<div class="section-title">
INVENTORY CONTROL REPORT
</div>

<div class="summary-row">
<span>Products Registered</span>
<span>${report.totalProducts}</span>
</div>

<div class="summary-row">
<span>Total Categories</span>
<span>${report.totalCategories}</span>
</div>

<div class="summary-row">
<span>Available Units</span>
<span>${report.totalStockUnits}</span>
</div>

<div class="summary-row">
<span>Inventory Value</span>
<span>${formatCurrency(
  report.inventoryValue
)}</span>
</div>

<div class="summary-row">
<span>Low Stock Items</span>
<span>${report.lowStockProducts}</span>
</div>

<div class="summary-row">
<span>Out Of Stock Items</span>
<span>${report.outOfStock}</span>
</div>

<div class="section-title">
ALL PRODUCTS 
</div>

<table>
<thead>
<tr>
<th>Product</th>
<th>Category</th>
<th>Stock</th>
<th>Sold</th>
<th>Cost</th>
<th>Sell</th>
<th>Discount</th>
<th>Margin</th>
<th>Inventory Value</th>
<th>Revenue</th>
<th>Net Profit</th>
<th>Updated</th>
</tr>
</thead>

<tbody>
${productRows}
</tbody>

<tfoot>
<tr style="background:#0f3460;color:#fff;font-weight:700;">
<td style="
width:auto;
max-width:none;
text-align:center;
font-weight:700;
padding:10px 6px;
white-space:nowrap;
">
TOTAL
</td>
<td>-</td>
<td>${report.totalStockUnits}</td>
<td>-</td>
<td>-</td>
<td>-</td>
<td>-</td>
<td>-</td>
<td>${formatCurrency(report.inventoryValue)}</td>
<td>${formatCurrency(report.totalSales)}</td>
<td>${formatCurrency(report.totalProfit)}</td>
<td>-</td>
</tr>
</tfoot>
</table>
<div class="section-title">
STOCK STATUS
</div>

<div class="summary-row">
<span>Healthy Stock</span>
<span>${report.healthyStock}</span>
</div>

<div class="summary-row">
<span>Low Stock</span>
<span>${report.lowStockProducts}</span>
</div>

<div class="summary-row">
<span>Out Of Stock</span>
<span>${report.outOfStock}</span>
</div>

<div class="summary-row">
<span>Zero Movement</span>
<span>${report.zeroMovement}</span>
</div>
<div class="section-title">
CATEGORY WISE VALUE
</div>

${categoryRows}

<div class="footer">
<h3>
GENERATED BY INVOICEHUB REPORT
</h3>

<p>
Generated On :
${formatDate(new Date(), seller.timezone)}
</p>

<p>
Generated Time :
${formatTime(new Date(), seller.timezone)}
</p>

<p>
Report Type :
Inventory Snapshot
</p>
</div>

</body>
</html>
`;
};

const generateInventoryPDF =
async (report, seller) => {
  const html =
    generateInventoryHTML(
      report,
      seller
    );

  const browser =
    await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

  try {
    const page =
      await browser.newPage();

    await page.setContent(
      html,
      {
        waitUntil:
          "networkidle0"
      }
    );

  return await page.pdf({
  format: "A4",
  landscape: true,
  printBackground: true,
  margin: {
    top: "20px",
    right: "20px",
    bottom: "20px",
    left: "20px"
  }
});
  } finally {
    await browser.close();
  }
};

module.exports = {
  generateInventoryPDF
};