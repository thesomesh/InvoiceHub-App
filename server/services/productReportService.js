const puppeteer = require("puppeteer");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(amount || 0);
const getTimezone = (timezone) =>
  timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

const formatDate = (date, timezone) =>
  new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: getTimezone(timezone)
  });

const formatDateTime = (date, timezone) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: getTimezone(timezone),
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

const formatTime = (date, timezone) =>
  new Date(date).toLocaleTimeString("en-IN", {
    timeZone: getTimezone(timezone),
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const generateCategoryCharts = (categoryDistribution = {}) => {
  const categories = Object.entries(categoryDistribution);

  const total = categories.reduce(
    (sum, [_, data]) => sum + (data.value || data),
    0
  );

  const max = Math.max(
    ...categories.map(([_, data]) => data.value || data),
    1
  );

  const barChart = categories
    .sort((a, b) => (b[1].value || b[1]) - (a[1].value || a[1]))
    .map(([cat, data]) => {
      const value = data.value || data;
      const width = (value / max) * 100;

      return `
<div class="bar-row">
<div class="bar-label">${cat}</div>

<div class="bar-wrapper">
<div class="bar-fill" style="width:${width}%"></div>
</div>

<div class="bar-value">
${formatCurrency(value)}
</div>
</div>
`;
    })
    .join("");

  let cumulative = 0;

  const colors = [
    "#0f3460",
    "#2563eb",
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
    "#1d4ed8",
    "#0284c7",
    "#7dd3fc",
    "#38bdf8",
    "#0ea5e9"
  ];

  const pieChart = categories
    .map(([_, data], i) => {
      const value = data.value || data;
      const start = cumulative;
      cumulative += (value / total) * 100;

      return `${colors[i]} ${start}% ${cumulative}%`;
    })
    .join(",");

  const pieLegend = categories
    .map(([cat, data], i) => {
      const value = data.value || data;
      const percent = ((value / total) * 100).toFixed(1);

      return `
<div class="pie-row">
<span>
<span class="dot" style="background:${colors[i]}"></span>
${cat}
</span>
<span>${percent}%</span>
</div>
`;
    })
    .join("");

  return {
    pieChart,
    pieLegend
  };
};
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
<td>${formatDate(
  product.purchaseDate || product.createdAt
)}</td>

<td>${formatDate(
  product.updatedAt
)}</td>
</tr>
`;
    })
    .join("");

  const lowStockRows = report.products
  .filter(product => product.stock > 0 && product.stock <= 5)
  .map(product => `
<div class="summary-row">
  <span>${product.name}</span>
  <span>${product.stock} units</span>
</div>
`)
.join("");

const outOfStockRows = report.products
  .filter(product => product.stock === 0)
  .map(product => `
<div class="summary-row">
  <span>${product.name}</span>
  <span>Out Of Stock</span>
</div>
`)
.join("");
const categoryRows = Object.entries(
  report.categoryDistribution || {}
)
.map(([cat, value], i) => {
  const products = report.products.filter(
    p =>
      (p.category || "General")
        .toLowerCase() === cat.toLowerCase()
  );

  const totalUnits = products.reduce(
    (sum, p) => sum + (p.stock || 0),
    0
  );

  const shopStartDate = new Date(
    seller.createdAt || seller.updatedAt
  );

  const shopAgeDays = Math.floor(
    (Date.now() - shopStartDate.getTime()) /
    (1000 * 60 * 60 * 24)
  );

  const soldUnits = products.reduce(
    (sum, p) =>
      sum + (p.totalUnitsSold || 0),
    0
  );

  let movement;

  if (shopAgeDays < 30) {
    movement = "Initial Stock";
  } else if (soldUnits >= 10) {
    movement = "Fast Moving";
  } else if (soldUnits >= 5) {
    movement = "Normal";
  } else if (soldUnits > 0) {
    movement = "Slow";
  } else {
    movement = "No Sales Yet";
  }

  return `
<tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
<td>${cat}</td>
<td>${products.length}</td>
<td>${totalUnits}</td>
<td>${formatCurrency(value.value || value)}</td>
<td>${movement}</td>
</tr>
`;
})
.join("");
const categoryRanking = Object.entries(
  report.categoryDistribution || {}
)
.sort(
  (a, b) =>
    (b[1].value || b[1]) -
    (a[1].value || a[1])
)
.map(([cat, value], i) => `
<div class="rank-row">
<div class="rank-no">#${i + 1}</div>
<div class="rank-name">${cat}</div>
<div class="rank-value">
${formatCurrency(value.value || value)}
</div>
</div>
`)
.join("");
const {
  pieChart,
  pieLegend
} = generateCategoryCharts(
  report.categoryDistribution
);
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
margin:42px 0 20px;
font-size:18px;
font-weight:700;
color:#334155;
padding-top:8px;
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
.page-break{
page-break-before:always;
break-before:page;
}

.keep-together{
page-break-inside:avoid;
break-inside:avoid;
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
}.category-table{
margin-bottom:40px;
page-break-inside:avoid;
break-inside:avoid;
}

.category-table thead{
background:#f8fafc;
color:#334155;
border-bottom:2px solid #e2e8f0;
}

.category-table th{
font-size:12px;
font-weight:700;
padding:14px;
}

.category-table td{
padding:16px 14px;
font-size:14px;
}

.category-table tr{
page-break-inside:avoid;
break-inside:avoid;
}

.category-table .total-row{
background:#f1f5f9;
font-weight:700;
border-top:2px solid #e2e8f0;
}

.chart-box{
margin-top:38px;
margin-bottom:28px;
padding:18px;
border:1px solid #e2e8f0;
border-radius:10px;
background:#fff;
page-break-inside:avoid;
break-inside:avoid;
}

.category-table{
margin-bottom:40px;
}
.rank-row{
display:flex;
align-items:center;
justify-content:space-between;
padding:14px 16px;
margin:8px 0;
background:#f8fafc;
border-radius:8px;
}

.rank-no{
width:50px;
font-size:14px;
font-weight:700;
color:#475569;
}

.rank-name{
flex:1;
font-size:14px;
font-weight:600;
color:#1e293b;
}

.rank-value{
font-size:14px;
font-weight:700;
color:#111827;
} 
.footer{
margin-top:60px;
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

.chart-box{
margin-top:38px;
margin-bottom:28px;
padding:18px;
border:1px solid #e2e8f0;
border-radius:10px;
background:#fff;
}

.bar-row{
display:flex;
align-items:center;
width:100%;
margin:14px 0;
}

.bar-label{
width:140px;
font-size:12px;
font-weight:600;
text-align:left;
}

.bar-wrapper{
flex:1;
height:22px;
background:#e2e8f0;
border-radius:12px;
overflow:hidden;
margin:0 12px;
}

.bar-fill{
height:100%;
background:linear-gradient(
90deg,
#0f3460,
#2563eb
);
border-radius:12px;
}

.bar-value{
width:120px;
text-align:right;
font-size:12px;
font-weight:700;
}

.pie-chart{
width:220px;
height:220px;
border-radius:50%;
margin:20px auto;
}

.pie-row{
display:flex;
justify-content:space-between;
margin:8px 0;
font-size:12px;
}

.dot{
display:inline-block;
width:12px;
height:12px;
border-radius:50%;
margin-right:8px;
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
<span>Expected Revenue</span>
<span>${formatCurrency(
  report.expectedRevenue || 0
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

<div class="page-break"></div>
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
<th>Purchase Date</th>
<th>Updated Date</th>
</tr>
</thead>

<tbody>
${productRows}
</tbody>

<tbody>
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
<div class="page-break"></div>
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
LOW STOCK PRODUCTS
</div>
${lowStockRows || `
<div class="summary-row">
<span>No low stock products</span>
<span>✓</span>
</div>
`}

<div class="page-break"></div>

<div class="section-title">
OUT OF STOCK PRODUCTS
</div>
${outOfStockRows || `
<div class="summary-row">
<span>No out of stock products</span>
<span>✓</span>
</div>
`}

<div class="page-break"></div>

<div class="section-title">
CATEGORY WISE INVENTORY ANALYSIS
</div>

<table class="category-table">
<thead>
<tr>
<th>Category</th>
<th>Products</th>
<th>Total Units</th>
<th>Investment</th>
<th>Movement</th>
</tr>
</thead>

<tbody>
${categoryRows}
</tbody>

<tfoot>
<tr class="total-row">
<td style="font-weight:700;">TOTAL</td>
<td>${report.totalProducts}</td>
<td>${report.totalStockUnits}</td>
<td>${formatCurrency(report.inventoryValue)}</td>
<td>-</td>
</tr>
</tfoot>
</table>

<div class="chart-box">
<h3 style="margin-bottom:16px;color:#334155;">
CATEGORY INVESTMENT RANKING
</h3>

${categoryRanking}
</div>

<div class="page-break"></div>

<div class="chart-box">
<h3 style="color:#334155;margin-bottom:16px;">
Category Distribution %
</h3>

<div
class="pie-chart"
style="background:conic-gradient(${pieChart});">
</div>

${pieLegend}
</div>

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