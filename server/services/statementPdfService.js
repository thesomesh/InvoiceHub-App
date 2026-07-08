const puppeteer = require("puppeteer");

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount || 0));

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN");

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN");

const row = (label, value) => `
<div class="row">
    <span>${label}</span>
    <span>${value}</span>
</div>
`;

const styles = `
<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    font-family:Arial,Helvetica,sans-serif;
    color:#1e293b;
    background:#fff;
    padding:35px;
    font-size:13px;
}

.watermark{
    position:fixed;
    transform:rotate(-30deg);
    opacity:.03;
    color:#0f3460;
    font-size:90px;
    font-weight:900;
    z-index:-1;
}

.wm1{
    top:18%;
    left:8%;
}

.wm2{
    top:48%;
    left:28%;
}

.wm3{
    top:76%;
    left:52%;
}

.header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    border-bottom:3px solid #0f3460;
    padding-bottom:20px;
    margin-bottom:30px;
}

.brand-left h1{
    font-size:34px;
    color:#0f3460;
    margin-bottom:8px;
    font-weight:800;
}

.brand-left p{
    color:#64748b;
    font-size:15px;
    margin:5px 0;
}

.brand-right{
    text-align:right;
}

.report-badge{
    display:inline-block;
    background:#0f3460;
    color:#fff;
    padding:12px 28px;
    border-radius:6px;
    font-size:18px;
    font-weight:700;
    margin-bottom:15px;
}

.report-time{
    font-size:13px;
    color:#334155;
    margin-top:12px;
    line-height:1.7;
}
.report-type{
    font-size:13px;
    color:#334155;
    margin-top:6px;
    line-height:1.7;
}

.section-title{
    font-size:20px;
    color:#0f3460;
    font-weight:700;
    margin:35px 0 18px;
}

.row{
    display:flex;
    justify-content:space-between;
    padding:12px 0;
    border-bottom:1px solid #e2e8f0;
    font-size:14px;
}

.info-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:18px;
    margin-top:10px;
}

.info-card{
    border:1px solid #dbe3ef;
    border-radius:8px;
    padding:16px;
    background:#fafcff;
}

.info-label{
    color:#64748b;
    font-size:12px;
    margin-bottom:6px;
}

.info-value{
    font-size:18px;
    font-weight:700;
    color:#0f172a;
}

.summary-grid{
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:18px;
    margin-top:20px;
    margin-bottom:35px;
}

.summary-card{
    border-radius:10px;
    padding:18px;
    color:white;
}

.summary-card h4{
    font-size:14px;
    margin-bottom:12px;
    font-weight:600;
}

.summary-card h2{
    font-size:24px;
    font-weight:800;
}

.blue{
    background:#0f3460;
}

.green{
    background:#16a34a;
}

.red{
    background:#dc2626;
}

.indigo{
    background:#4338ca;
}

table{
    width:100%;
    border-collapse:collapse;
    margin-top:20px;
}

thead{
    display:table-header-group;
}

th{
    background:#0f3460;
    color:#fff;
    padding:12px;
    border:1px solid #cbd5e1;
    font-size:13px;
}

td{
    border:1px solid #e2e8f0;
    padding:10px;
    font-size:12px;
}

tbody tr:nth-child(even){
    background:#f8fafc;
}

.text-right{
    text-align:right;
}

.text-center{
    text-align:center;
}

.footer{
    width:100%;
    margin-top:30px;
    border-top:2px solid #e2e8f0;
    padding-top:12px;
    display:flex;
    justify-content:space-between;
    color:#64748b;
    font-size:12px;
}

.page-break{
    page-break-before:always;
}

@page{
    size:A4 portrait;
    margin:20mm;
}

</style>
`;
const generateStatementPDF = async ({
  seller,
  account,
  summary,
  transactions,
  periodLabel,
  fromDate,
  toDate,
}) => {
const pageBreak = `<div style="page-break-before: always;"></div>`;
const reportTypes = {
  today: "Daily Statement",
  thisWeek: "Weekly Statement",
  thisMonth: "Monthly Statement",
  previousMonth: "Previous Month Statement",
  custom: "Custom Period Statement",
};

const reportType =
  reportTypes[periodLabel] || "Account Statement";

let statementPeriod;

switch (periodLabel) {
  case "today":
  case "yesterday":
    // Single day
    statementPeriod = formatDate(fromDate);
    break;

  case "thisWeek":
  case "lastWeek":
  case "thisMonth":
  case "lastMonth":
  case "custom":
    // Date range
    statementPeriod = `${formatDate(fromDate)}  –  ${formatDate(toDate)}`;
    break;

  default:
    statementPeriod = "Entire Transaction History";
}
const html = `
<html>

<head>

${styles}

</head>

<body>

<div class="watermark wm1">
INVOICEHUB
</div>

<div class="watermark wm2">
INVOICEHUB
</div>

<div class="watermark wm3">
INVOICEHUB
</div>

<div class="header">

<div class="brand-left">

<h1>${seller.businessName}</h1>

<p>${seller.address || ""}</p>

<p>${seller.phone || ""}</p>

<p>${seller.email || ""}</p>

</div>

<div class="brand-right">

<div class="report-badge">

ACCOUNT STATEMENT

</div>
<p class="report-time">
<strong>Generated On :</strong>
${formatDate(new Date())}
&nbsp;
${new Date().toLocaleTimeString("en-IN")}
</p>


</div>

</div>
<h2 class="section-title">
1. ACCOUNT DETAILS
</h2>
${row("Account Name", account.name)}
${row("Account Type", account.type)}
${row("Report Type", reportType)}
${row("Statement Period", statementPeriod)}


${pageBreak}
<h2 class="section-title">
TRANSACTION DETAILS

</h2>

<table>

<thead>

<tr>

<th style="width:90px">
Date
</th>

<th>
Particulars
</th>

<th style="width:130px">
Reference
</th>

<th style="width:120px">
Credit
</th>

<th style="width:120px">
Debit
</th>

<th style="width:130px">
Balance
</th>

</tr>

</thead>

<tbody>

${transactions.map((tx,index)=>`

<tr>

<td>

${formatDate(tx.createdAt)}

</td>

<td>

<strong>

${tx.particulars}

</strong>

<br>

<span style="font-size:11px;color:#64748b">

${tx.note || "-"}

</span>

</td>

<td class="text-center">

${tx.referenceNumber || tx.sourceType || "-"}

</td>

<td class="text-right">

${tx.credit
? formatCurrency(tx.credit)
: "-"}

</td>

<td class="text-right">

${tx.debit
? formatCurrency(tx.debit)
: "-"}

</td>

<td class="text-right">

${formatCurrency(tx.balanceAfter)}

</td>

</tr>

`).join("")}

</tbody>

</table>


${pageBreak}
<div class="section-title">
STATEMENT SUMMARY
</div>

${row(
  "Opening Balance",
  formatCurrency(summary.openingBalance)
)}

${row(
  "Total Credit",
  formatCurrency(summary.totalCredit)
)}

${row(
  "Total Debit",
  formatCurrency(summary.totalDebit)
)}

${row(
  "Closing Balance",
  formatCurrency(summary.closingBalance)
)}

${row(
  "Total Transactions",
  transactions.length
)}

<div class="footer">

<div>

Generated by
<strong>INVOICEHUB</strong>

</div>

<div>

Generated On:
${formatDateTime(new Date())}

</div>

</div>

<div
style="
margin-top:30px;
padding-top:20px;
border-top:1px solid #cbd5e1;
font-size:12px;
color:#64748b;
text-align:center;
">

This is a computer generated Account Statement.
No signature is required.

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


module.exports = {
  generateStatementPDF,
};