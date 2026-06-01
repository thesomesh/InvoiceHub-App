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

const generateSalesReportPDF = async (
  invoices,
  expenses,
  seller,
  type,
  customStart,
  customEnd
) => {

  const { start, end } = getDateRange(type, customStart, customEnd);

  const filteredInvoices = invoices.filter(i => {
    const d = new Date(i.date || i.createdAt);
    return d >= start && d <= end && i.status !== "cancelled";
  });

 const filteredExpenses = expenses.filter((e) => {
  const expenseDate = new Date(e.date || e.createdAt);

  expenseDate.setHours(0, 0, 0, 0);

  const rangeStart = new Date(start);
  rangeStart.setHours(0, 0, 0, 0);

  const rangeEnd = new Date(end);
  rangeEnd.setHours(23, 59, 59, 999);

  return expenseDate >= rangeStart && expenseDate <= rangeEnd;
});

  const revenue = filteredInvoices.reduce(
    (s, i) => s + Number(i.total || 0), 0
  );

  const collected = filteredInvoices.reduce(
    (s, i) => s + Number(i.amountPaid || 0), 0
  );

  const due = filteredInvoices.reduce(
    (s, i) => s + Number(i.dueAmount || 0), 0
  );

const salesProfit =
  revenue > 0
    ? revenue * 0.1
    : 0;

  const expenseTotal = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0), 0
  );

  const paymentModes = ["UPI", "Cash", "Card", "Cheque", "Bank Transfer"];

  const paymentData = paymentModes.map(mode => ({
    name: mode,
    value: filteredInvoices
      .filter(i => i.paymentMethod === mode)
      .reduce((s, i) => s + Number(i.amountPaid || 0), 0)
  }));

  const totalPayment = paymentData.reduce((s, p) => s + p.value, 0);
const isTodayReport = type === "today";

const isMonthReport =
  type === "this-month" ||
  type === "last-month" ||
  type === "custom";
  let cumulative = 0;
  const colors = ["#0f3460","#2563eb","#60a5fa","#93c5fd","#dbeafe"];

  const pieStops = paymentData.map((p, i) => {
    const safeTotalPayment =
  totalPayment > 0 ? totalPayment : 1;

const percent =
  (p.value / safeTotalPayment) * 100;
    const start = cumulative;
    cumulative += percent;
    return `${colors[i]} ${start}% ${cumulative}%`;
  }).join(",");

 let comparisonInvoices = [];

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

  comparisonInvoices = invoices.filter(i => {
    const d = new Date(i.date || i.createdAt);
    return d >= prevStart &&
           d <= prevEnd &&
           i.status !== "cancelled";
  });

} else {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  comparisonInvoices = invoices.filter(i => {
    const d = new Date(i.date || i.createdAt);
    return d.toDateString() === yesterday.toDateString()
      && i.status !== "cancelled";
  });
}

const comparisonRevenue = comparisonInvoices.reduce(
  (s, i) => s + Number(i.total || 0), 0
);

const comparisonProfit = comparisonRevenue * 0.1;
  const categoryStats = {};

  filteredInvoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const cat = item.category || "General";

      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          units: 0,
          revenue: 0,
          profit: 0
        };
      }

      categoryStats[cat].units += Number(item.qty || 0);
      categoryStats[cat].revenue += Number(item.finalRevenue || item.total || 0);
     const profitRatio =
  revenue > 0
    ? salesProfit / revenue
    : 0;

categoryStats[cat].profit +=
  Number(item.finalRevenue || item.total || 0) *
  profitRatio;
    });
  });


const weeklyData = [0,0,0,0];

filteredInvoices.forEach(inv => {
  const day = new Date(inv.date || inv.createdAt).getDate();
  const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
  weeklyData[weekIndex] += Number(inv.total || 0);
});

const last6Months = [];

const today = new Date();

for (let i = 5; i >= 0; i--) {
  const monthDate = new Date(
    today.getFullYear(),
    today.getMonth() - i,
    1
  );

  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();

const monthRevenue = filteredInvoices
    .filter(inv => {
      const d = new Date(inv.date || inv.createdAt);

      return (
        d.getMonth() === month &&
        d.getFullYear() === year &&
        inv.status !== "cancelled"
      );
    })
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  last6Months.push({
    month: monthDate.toLocaleString("en-IN", {
      month: "short"
    }).toUpperCase(),
    revenue: monthRevenue
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
          ? "Today Sales Report"
          : type === "this-month"
          ? "This Month Sales Report"
          : "Custom Sales Report"
      }
    </p>

  </div>

</div>

<h2 class="section-title">1.SUMMARY </h2>
${row("Revenue", formatCurrency(revenue))}
${row("Collected", formatCurrency(collected))}
${row("Outstanding Due", formatCurrency(due))}
${row("Sales Profit", formatCurrency(salesProfit))}
${row("Expenses", formatCurrency(expenseTotal))}
${row("Invoices", filteredInvoices.length)}

${pageBreak}
<h2 class="section-title">
2. ${
type === "today"
? "VS YESTERDAY"
: type === "this-month"
? "VS LAST MONTH"
: "VS PREVIOUS PERIOD"
}
</h2>
<table>
<tr>
<th>Metric</th>
<th>${isMonthReport ? "Last Month" : "Yesterday"}</th>
<th>${isMonthReport ? "This Month" : "Today"}</th>
<th>Change</th>
</tr>
<tr><td>Revenue</td><td>${formatCurrency(comparisonRevenue)}</td><td>${formatCurrency(revenue)}</td><td>${comparisonRevenue > 0 ? ((comparisonRevenue > 0
  ? ((revenue - comparisonRevenue) / comparisonRevenue) * 100
  : 0)*100).toFixed(1) : revenue > 0 ? "100.0" : "0.0"}%</td></tr>
<tr><td>Sales Profit</td><td>${formatCurrency(comparisonProfit)}</td><td>${formatCurrency(salesProfit)}</td><td>${comparisonProfit > 0 ? (((salesProfit-comparisonProfit)/comparisonProfit)*100).toFixed(1) : salesProfit > 0 ? "100.0" : "0.0"}%</td></tr>
</table>
${pageBreak}
<h2 class="section-title">3. PAYMENT MODE</h2>
<table>
<tr><th>Mode</th><th>Amount</th><th>%</th></tr>
${paymentData.map(p=>`
<tr>
<td>${p.name}</td>
<td>${formatCurrency(p.value)}</td>
<td>${((p.value/(totalPayment||1))*100).toFixed(1)}%</td>
</tr>`).join("")}
<tr>
<th>Total</th>
<th>${formatCurrency(totalPayment)}</th>
<th>100%</th>
</tr>
</table>

<div class="pie" style="background:conic-gradient(${pieStops})"></div>
${pageBreak}
<h2 class="section-title">4. OUTSTANDING DUE</h2>
<table>
<tr><th>Customer</th><th>Due</th></tr>
${filteredInvoices.filter(i=>Number(i.dueAmount)>0).map(i=>`
<tr>
<td>${i.customer?.name || "Unknown"}</td>
<td>${formatCurrency(i.dueAmount)}</td>
</tr>`).join("")}
<tr>
<th>Total Due</th>
<th>${formatCurrency(due)}</th>
</tr>
</table>
${pageBreak}
<h2 class="section-title">
5. ${
type === "today"
? "TODAY'S EXPENSES"
: type === "this-month"
? "MONTHLY EXPENSES"
: "CUSTOM PERIOD EXPENSES"
}
</h2>
<table>
<tr>
  <th>Category</th>
  <th>Amount</th>
</tr>

${filteredExpenses.map(exp => `
<tr>
  <td>${exp.category || "Miscellaneous"}</td>
  <td>${formatCurrency(exp.amount)}</td>
</tr>
`).join("")}

<tr>
  <th>Total</th>
  <th>${formatCurrency(expenseTotal)}</th>
</tr>
</table>
${pageBreak}
<h2 class="section-title">6. CATEGORY PERFORMANCE</h2>
<table>
<tr><th>Category</th><th>Units</th><th>Revenue</th><th>Sales Profit</th></tr>
${Object.entries(categoryStats).map(([cat,data])=>`
<tr>
<td>${cat}</td>
<td>${data.units}</td>
<td>${formatCurrency(data.revenue)}</td>
<td>${formatCurrency(data.profit)}</td>
</tr>`).join("")}

<tr>
<th>Total</th>
<th>${Object.values(categoryStats).reduce((s,d)=>s+d.units,0)}</th>
<th>${formatCurrency(
Object.values(categoryStats).reduce((s,d)=>s+d.revenue,0)
)}</th>
<th>${formatCurrency(
Object.values(categoryStats).reduce((s,d)=>s+d.profit,0)
)}</th>
</tr>
</table>


${isMonthReport ? `
${pageBreak}
<h2 class="section-title">7. WEEKLY PERFORMANCE</h2>
<table>
<tr>
<th>Week</th>
<th>Revenue</th>
<th>%</th>
<th>Profit</th>
</tr>

${weeklyData.map((amt, i) => `
<tr>
<td>Week ${i+1}</td>
<td>${formatCurrency(amt)}</td>
<td>${((amt/(revenue||1))*100).toFixed(1)}%</td>
<td>${formatCurrency(amt*0.1)}</td>
</tr>
`).join("")}
<tr>
<th>Total</th>
<th>${formatCurrency(revenue)}</th>
<th>100%</th>
<th>${formatCurrency(salesProfit)}</th>
</tr>
</table>

<h2 class="section-title">8. WEEKLY REVENUE DISTRIBUTION</h2>

<div style="position:relative;width:300px;height:300px;margin:30px auto;">

<div class="pie" style="
width:300px;
height:300px;
background:conic-gradient(
#0f3460 0% ${(weeklyData[0]/(revenue||1))*100}%,
#2563eb ${(weeklyData[0]/(revenue||1))*100}% ${((weeklyData[0]+weeklyData[1])/(revenue||1))*100}%,
#60a5fa ${((weeklyData[0]+weeklyData[1])/(revenue||1))*100}% ${((weeklyData[0]+weeklyData[1]+weeklyData[2])/(revenue||1))*100}%,
#93c5fd ${((weeklyData[0]+weeklyData[1]+weeklyData[2])/(revenue||1))*100}% 100%
);
"></div>
${weeklyData[0] > 0 ? `<div style="position:absolute;top:20px;left:120px;font-weight:bold;">Week 1 </div>` : ""}
${weeklyData[1] > 0 ? `<div style="position:absolute;top:130px;right:20px;font-weight:bold;">Week 2</div>` : ""}
${weeklyData[2] > 0 ? `<div style="position:absolute;bottom:20px;left:120px;font-weight:bold;">Week 3</div>` : ""}
${weeklyData[3] > 0 ? `<div style="position:absolute;top:130px;left:20px;font-weight:bold;">Week 4</div>` : ""}

</div>
${pageBreak}
<h2 class="section-title">9. SALES OVERVIEW</h2>
${row("Total Sales Revenue", formatCurrency(revenue))}
${row("Paid Invoices", filteredInvoices.filter(i=>i.dueAmount===0).length)}
${row("Partial Payments", filteredInvoices.filter(i=>i.dueAmount>0 && i.amountPaid>0).length)}
${row("Pending Invoices", filteredInvoices.filter(i=>i.amountPaid===0).length)}
${row("Cancelled Invoices", invoices.filter(i=>i.status==="cancelled").length)}

<h2 class="section-title">10. CASH FLOW REPORT</h2>
${row("Cash Inflow", formatCurrency(collected))}
${row("Cash Outflow", formatCurrency(expenseTotal))}
${row("Net Cash Position", formatCurrency(collected-expenseTotal))}
${row("Receivable Cash", formatCurrency(due))}


${pageBreak}
<h2 class="section-title">11. LAST 6 MONTHS Revenue </h2>

${row(
  "Current Month Revenue",
  formatCurrency(last6Months[last6Months.length - 1]?.revenue || 0)
)}

${row(
  "Highest Revenue Month",
  (() => {
    const max = last6Months.reduce(
      (a,b) => a.revenue > b.revenue ? a : b,
      last6Months[0]
    );
    return `${max.month} (${formatCurrency(max.revenue)})`;
  })()
)}

${row(
  "6-Month Total Revenue",
  formatCurrency(
    last6Months.reduce((s,m)=>s+m.revenue,0)
  )
)}


<svg width="1100" height="380">

<line x1="60" y1="320" x2="1050" y2="320" stroke="#999"/>
<line x1="60" y1="40" x2="60" y2="320" stroke="#999"/>

<polyline
fill="none"
stroke="#000"
stroke-width="5"
points="${last6Months.map((m,i)=>{
 const x = 100 + i*160;
 const maxRevenue = Math.max(...last6Months.map(a=>a.revenue),1);
 const y = 320 - ((m.revenue/maxRevenue)*220);
 return `${x},${y}`;
}).join(" ")}"
/>

${last6Months.map((m,i)=>{
 const x = 100 + i*160;
 const maxRevenue = Math.max(...last6Months.map(a=>a.revenue),1);
 const y = 320 - ((m.revenue/maxRevenue)*220);

 return `
 <circle cx="${x}" cy="${y}" r="8" fill="#000"/>
 <text x="${x-25}" y="${y-15}" font-size="14">
   ${formatCurrency(m.revenue)}
 </text>
 <text x="${x-15}" y="350">${m.month}</text>
 `;
}).join("")}

</svg>
` : ""}

<div style="padding:40px; font-size:18px; line-height:2;">
<h2>GENERATED BY INVOICEHUB REPORT</h2>

<p>Generated On : ${new Date().toLocaleDateString("en-IN")}</p>

<p>Generated Time : ${new Date().toLocaleTimeString("en-IN")}</p>

<p>
Report Type :
${isTodayReport
 ? "Today Sales Report"
 : type === "this-month"
? "This-Month Sales Report"
 : "Custom Sales Report"}
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

module.exports = { generateSalesReportPDF };