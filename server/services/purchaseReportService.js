const puppeteer = require("puppeteer");
const Product = require("../models/Product");
const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(amount || 0));

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN");

const row = (label, value) => `
<div class="row">
<span>${label}</span>
<span>${value}</span>
</div>
`;

const getDateRange = (type, customStart, customEnd) => {
  const now = new Date();

  switch (type) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date()
      };

    case "this-month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date()
      };

    case "last-month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0)
      };

    default:
      return {
        start: new Date(customStart),
        end: new Date(customEnd)
      };
  }
};

const styles = `
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial;padding:40px;color:#1a1a2e;}
.watermark{position:fixed;opacity:.03;transform:rotate(-30deg);font-size:90px;font-weight:900;color:#0f3460;}
.wm1{top:18%;left:8%;}
.wm2{top:48%;left:30%;}
.wm3{top:76%;left:52%;}
.header{display:flex;justify-content:space-between;border-bottom:3px solid #0f3460;padding-bottom:20px;margin-bottom:30px;}
.brand h1{font-size:24px;color:#0f3460;}
.section-title{margin:30px 0 15px;font-size:18px;font-weight:700;color:#334155;}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0;}
table{width:100%;border-collapse:collapse;margin-top:15px;}
th,td{border:1px solid #cbd5e1;padding:12px;text-align:center;}
th{background:#0f3460;color:white;}
.pie{width:220px;height:220px;border-radius:50%;margin:20px auto;}
.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  padding:20px 0 30px;
  border-bottom:3px solid #e2e8f0;
  margin-bottom:30px;
}

.brand-left h1{
  font-size:34px;
  color:#0f3460;
  font-weight:800;
  margin-bottom:10px;
}

.brand-left p{
  font-size:18px;
  color:#64748b;
  margin:6px 0;
}

.brand-right{
  text-align:right;
}

.report-badge{
  background:#0f3460;
  color:#fff;
  padding:14px 30px;
  border-radius:6px;
  font-size:20px;
  font-weight:700;
  margin-bottom:16px;
  display:inline-block;
}

.report-time{
  font-size:18px;
  color:#1e293b;
  margin:8px 0;
}

.report-type{
  font-size:18px;
  color:#64748b;
  font-weight:600;
}
</style>
`;

const generatePurchaseReportPDF = async (
  products,
  seller,
  type,
  customStart,
  customEnd,
  analysisMonths = 3
) => {

  const { start, end } = getDateRange(type, customStart, customEnd);

const purchasedProducts = [];

let periodPurchaseValue = 0;
let totalUnitsPurchased = 0;
let totalProductsPurchased = 0;

const categoryStats = {};

products.forEach((product) => {
  const purchaseDate = new Date(
    product.purchaseDate || product.createdAt
  );

  if (
    purchaseDate >= start &&
    purchaseDate <= end
  ) {
    const units = Number(product.stock || 0);

    const costPrice = Number(
      product.costPrice || 0
    );

    const total = units * costPrice;

    purchasedProducts.push({
      date: purchaseDate,
      name: product.name,
      category:
        product.category || "General",
      units,
      cp: costPrice,
      total,
    });

    periodPurchaseValue += total;

    totalUnitsPurchased += units;

    totalProductsPurchased += 1;

    if (
      !categoryStats[
        product.category || "General"
      ]
    ) {
      categoryStats[
        product.category || "General"
      ] = {
        products: 0,
        units: 0,
        value: 0,
      };
    }

    categoryStats[
      product.category || "General"
    ].products += 1;

    categoryStats[
      product.category || "General"
    ].units += units;

    categoryStats[
      product.category || "General"
    ].value += total;
  }
});





const isMonthReport =
  type === "this-month" ||
  type === "last-month" ||
  type === "custom";


if (isMonthReport) {
  const prevStart = new Date(
    start.getFullYear(),
    start.getMonth() - 1,
    1
  );

  const prevEnd = new Date(
    start.getFullYear(),
    start.getMonth(),
    0
  );

  prevStart.setHours(0,0,0,0);
  prevEnd.setHours(23,59,59,999);

}

 
const getCalendarWeeks = (start, end) => {
  const weeks = [];
  let current = new Date(start);

  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);

    const day = weekStart.getDay();

    const daysToSunday =
      day === 0 ? 0 : 7 - day;

    weekEnd.setDate(
      weekStart.getDate() + daysToSunday
    );

    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `${String(weekStart.getDate()).padStart(2,"0")}/${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekEnd.getDate()).padStart(2,"0")}/${String(weekEnd.getMonth()+1).padStart(2,"0")}`,
      revenue: 0,
      profit: 0
    });

    current = new Date(weekEnd);
    current.setDate(
      current.getDate() + 1
    );
  }

  return weeks;
};
const weeklyData = getCalendarWeeks(start, end);
const monthsToShow =
  type === "custom"
    ? analysisMonths
    : 3;

const monthWisePurchases = [];

const baseDate = new Date(end);

for (
  let i = monthsToShow - 1;
  i >= 0;
  i--
) {
  const monthDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() - i,
    1
  );

  const purchaseValue = products
    .filter((p) => {
      const d = new Date(
        p.purchaseDate || p.createdAt
      );

      return (
        d.getMonth() ===
          monthDate.getMonth() &&
        d.getFullYear() ===
          monthDate.getFullYear()
      );
    })
    .reduce(
      (sum, p) =>
        sum +
        Number(p.stock || 0) *
        Number(p.costPrice || 0),
      0
    );

  monthWisePurchases.push({
    month:
      monthDate.toLocaleString(
        "en-IN",
        {
          month: "short",
          year: "numeric"
        }
      ),
    value: purchaseValue
  });
}
const pageBreak = `<div style="page-break-before: always;"></div>`;
  const html = `

<html>
<head>${styles}</head>
<body>

<div class="watermark wm1">INVOICEHUB</div>
<div class="watermark wm2">INVOICEHUB</div>
<div class="watermark wm3">INVOICEHUB</div>
<div class="header">

  <div class="brand-left">
    <h1>${seller.businessName}</h1>
    <p>${seller.address || ""}</p>
    <p>${seller.phone || ""}</p>
    <p>${seller.email || ""}</p>
  </div>

  <div class="brand-right">

    <div class="report-badge">
      INVOICEHUB REPORT
    </div>

    <p class="report-time">
      ${new Date().toLocaleDateString("en-IN")} at
      ${new Date().toLocaleTimeString("en-IN")}
    </p>

    <p class="report-type">
      ${
        type === "today"
          ? "Today Purchase Report"
          : type === "this-month"
          ? "This Month Purchase Report"
         : type === "last-month"
? "Last Month Purchase Report"
: "Custom Purchase Report "
      }
    </p>

  </div>

</div>

<h2 class="section-title">1.SUMMARY </h2>
${row("Total Products Purchased", totalProductsPurchased)}
${row("Total Purchase Value",  formatCurrency(periodPurchaseValue))}
${row("Total Units Purchased", totalUnitsPurchased)}
${pageBreak}
<h2 class="section-title">
PRODUCT PURCHASE DETAILS
</h2>

<table>
<tr>
<th>Date</th>
<th>Product</th>
<th>Units</th>
<th>CP</th>
<th>Total</th>
</tr>

${purchasedProducts.map(p => `
<tr>
<td>${formatDate(p.date)}</td>
<td>${p.name}</td>
<td>${p.units}</td>
<td>${formatCurrency(p.cp)}</td>
<td>${formatCurrency(p.total)}</td>
</tr>
`).join("")}

<tr>
<th colspan="4">TOTAL</th>
<th>${formatCurrency(periodPurchaseValue)}</th>
</tr>
</table>


${pageBreak}
<h2 class="section-title">6. CATEGORY Wise Purchases </h2>
<table>
<tr>
<th>Category</th>
<th>Units Purchased</th>
<th>Total Purchase Value</th>
</tr>
${Object.entries(categoryStats).map(([cat,data])=>`
<tr>
<td>${cat}</td>
<td>${data.units}</td>
<td>${formatCurrency(data.value)}</td>
</tr>`).join("")}

<tr>
<th>Total</th>
<th>${totalUnitsPurchased}</th>
<th>${formatCurrency(periodPurchaseValue)}</th>
</tr>
</table>


${pageBreak}
<h2 class="section-title">
4. MONTH WISE PURCHASE 
</h2>

<table>
<tr>
<th>Month</th>
<th>Purchase Value</th>
</tr>

${monthWisePurchases.map(m => `
<tr>
<td>${m.month}</td>
<td>${formatCurrency(m.value)}</td>
</tr>
`).join("")}

<tr>
<th>Total</th>
<th>
${formatCurrency(
  monthWisePurchases.reduce(
    (s,m)=>s+m.value,
    0
  )
)}
</th>
</tr>
</table>

<div style="padding:40px; font-size:18px; line-height:2;">
<h2>GENERATED BY INVOICEHUB REPORT</h2>

<p>Generated On : ${new Date().toLocaleDateString("en-IN")}</p>

<p>Generated Time : ${new Date().toLocaleTimeString("en-IN")}</p>

<p>
Report Type :
${type === "today"
 ? "Today Purchase Report"
 : type === "this-month"
 ? "This Month Purchase Report"
 : type === "last-month"
 ? "Last Month Purchase Report"
 : "Custom Today Purchase Report"}
</p>
</div>
</body>
</html>

`;


  const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
});
  const page = await browser.newPage();

  await page.setContent(html);

  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true
  });

  await browser.close();

  return pdf;

};

module.exports = { generatePurchaseReportPDF };