import React, {
  useState,
  useEffect,
} from "react";

import {
  useParams,
  Link,
} from "react-router-dom";

import {
  Download,
  ChevronRight,
  Wallet,
  Calendar,
  Landmark,
  IndianRupee,
} from "lucide-react";

import { accountAPI } from "../services/accountAPI";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

const StatementPage = () => {

  const { id } = useParams();

  const [account, setAccount] =
    useState(null);
const [downloadingPdf, setDownloadingPdf] =
  useState(false);
  const [statement, setStatement] =
    useState([]);
const [summary, setSummary] =
useState({

openingBalance:0,

totalCredit:0,

totalDebit:0,

closingBalance:0,

});
  const [loading, setLoading] =
    useState(true);

  const [period, setPeriod] =
    useState("thisMonth");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");
const loadStatement = async () => {

  try {

    setLoading(true);

const res =
await accountAPI.getStatementPage(
  id,
  {
    type: period,
    customStart: fromDate,
    customEnd: toDate,
  }
);

setAccount(
res.data.account
);

setSummary(
res.data.summary
);

setStatement(
res.data.transactions
);
  } catch (err) {

    console.log(err);

  } finally {

    setLoading(false);

  }

};

useEffect(() => {

  loadStatement();

}, [id]);

useEffect(()=>{

if(period!=="custom"){

loadStatement();

}

},[period]);
if (loading) {

  return (

    <div className="max-w-7xl mx-auto py-10 text-center">

      Loading Statement...

    </div>

  );

}
const downloadPDF = async () => {
  try {

    setDownloadingPdf(true);

    const response =
      await accountAPI.downloadStatementPDF(
        id,
        {
          type: period,
          customStart: fromDate,
          customEnd: toDate,
        }
      );

    const url =
      window.URL.createObjectURL(
        new Blob([response.data])
      );

    const link =
      document.createElement("a");

    link.href = url;

 const disposition = response.headers["content-disposition"];

let fileName = "statement.pdf";

if (disposition) {
  const match = disposition.match(/filename="?([^"]+)"?/);

  if (match && match[1]) {
    fileName = match[1];
  }
}

link.download = fileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {

    console.error(err);

    alert("Failed to download statement");

  } finally {

    setDownloadingPdf(false);

  }
};
  return (

<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">

{/* Breadcrumb */}

<div
  className="flex items-center gap-2 text-sm mb-6"
  style={{ color: "var(--text-muted)" }}
>

<Link
to="/accounts"
className="transition-colors hover:opacity-80"
style={{ color: "var(--accent)" }}
>

Accounts

</Link>

<ChevronRight size={16}/>

<span>

Statement

</span>

</div>

{/* Header */}

{/* Header */}

<div className="flex justify-between items-center mb-8">

    <div>

<h1
  className="text-4xl font-extrabold"
  style={{ color: "var(--text)" }}
>

            {account?.name} Statement

        </h1>

        <div className="flex items-center gap-10 mt-8">

            <div className="flex items-center gap-4">

              <div
  className="w-12 h-12 rounded-2xl flex items-center justify-center"
  style={{
    background: "var(--surface-2)"
  }}
>

                    <Landmark
                        size={22}
                       style={{ color: "var(--accent)" }}
                    />

                </div>

                <div>

                 <p
    style={{
        color: "var(--text-muted)"
    }}
>

                        Account Type

                    </p>

                  <h3
  className="text-xl font-semibold"
  style={{ color:"var(--text)" }}
>

                        {account?.type}

                    </h3>

                </div>

            </div>

         <div
    className="w-px h-16"
    style={{
        background: "var(--border)"
    }}
/>

            <div className="flex items-center gap-4">

               <div
  className="w-12 h-12 rounded-2xl flex items-center justify-center"
  style={{
    background:"var(--surface-2)"
  }}
>
    <IndianRupee
        size={22}
        style={{
            color:"var(--success)"
        }}
    />
</div>
                <div>

              <p
  style={{
    color:"var(--text-muted)"
  }}
>

                        Current Balance

                    </p>

             <h2
 className="text-2xl font-bold"
 style={{
   color:"var(--success)"
 }}
>

                        {formatCurrency(summary.closingBalance)}

                    </h2>

                </div>

            </div>

        </div>

    </div>

    <button
onClick={downloadPDF}
disabled={downloadingPdf}
className={`
flex items-center
justify-center
gap-2
px-6
py-3
rounded-lg
font-semibold
transition-all
duration-300

${
downloadingPdf
? "bg-gray-500 cursor-not-allowed"
: "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95"
}

text-white
shadow-lg
`}
>

{downloadingPdf ? (
<>
<span
className="
w-4
h-4
border-2
border-white
border-t-transparent
rounded-full
animate-spin"
/>

Downloading...

</>
) : (
<>
<Download size={20}/>
Download Statement
</>
)}

</button>

</div>
{/* Filter */}

{/* Statement Period */}

<div className="card rounded-2xl p-6 mb-8">

    <div className="flex items-center gap-3 mb-5">

      <div
  className="w-6 h-1 rounded"
  style={{
    background: "var(--accent)",
  }}
></div>

      <h3
  className="text-xl font-semibold"
  style={{
    color: "var(--text)",
  }}
>
    Select Period
</h3>

    </div>

    <div className="flex flex-wrap items-center gap-3">

        {[
            {
                label: "Today",
                value: "today",
            },
            {
                label: "This Week",
                value: "thisWeek",
            },
            {
                label: "This Month",
                value: "thisMonth",
            },
            {
                label: "Previous Month",
                value: "previousMonth",
            },
            {
                label: "Custom Range",
                value: "custom",
            },
        ].map((item) => (

            <button
                key={item.value}
                onClick={() => {

                    setPeriod(item.value);

                    if (item.value !== "custom") {

                        setFromDate("");

                        setToDate("");

                    }

                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 font-medium

                ${
                    period === item.value
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                        : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                }`}
            >

              <Calendar size={18} />

                {item.label}

            </button>

        ))}

    {period === "custom" && (

<div className="w-full mt-6 border-t pt-6">

    <div className="flex flex-wrap items-end gap-5">

        <div>

            <label className="block text-sm font-medium text-gray-600 mb-2">

                Start Date

            </label>

            <input
                type="date"
                className="input w-52"
                value={fromDate}
                onChange={(e) =>
                    setFromDate(e.target.value)
                }
            />

        </div>

        <div>

            <label className="block text-sm font-medium text-gray-600 mb-2">

                End Date

            </label>

            <input
                type="date"
                className="input w-52"
                value={toDate}
                onChange={(e) =>
                    setToDate(e.target.value)
                }
            />

        </div>

        <button
            className="btn-primary px-8 h-11"
            onClick={() => {

                if (!fromDate || !toDate) {

                    alert("Please select both dates.");

                    return;

                }

                loadStatement();

            }}
        >

            Apply Filter

        </button>

    </div>

</div>

)}

    </div>

</div>

{/* Summary */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">



  <div className="card p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(79,70,229,0.20)] cursor-pointer">

<p
    style={{
        color: "var(--text-muted)"
    }}
>

Total Credit

</p>

<h2
    className="text-3xl font-bold"
    style={{
        color: "var(--success)"
    }}
>
{formatCurrency(
summary.totalCredit
)}
</h2>

</div>

  <div className="card p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(79,70,229,0.20)] cursor-pointer">

<p
    style={{
        color: "var(--text-muted)"
    }}
>

Total Debit

</p>

<h2
    className="text-3xl font-bold"
    style={{
        color: "var(--danger)"
    }}
>
{formatCurrency(
summary.totalDebit
)}

</h2>

</div>


</div>

{/* Transactions */}

<div className="card overflow-hidden">

<div
    className="flex items-center justify-between px-8 py-5"
    style={{
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--border)"
    }}
>

<div>

<h2
    className="text-2xl font-bold"
    style={{
        color: "var(--text)"
    }}
>


Account Transactions

</h2>

<p
    className="text-sm mt-1"
    style={{
        color: "var(--text-muted)"
    }}
>

{statement.length} transactions

</p>

</div>

<div
    className="px-4 py-2 rounded-full font-medium"
    style={{
        background: "var(--surface-2)",
        color: "var(--accent)"
    }}
>

Statement

</div>

</div>

<div className="overflow-x-auto">

<div className="card overflow-hidden">
<table className="w-full">
<thead
    className="sticky top-0 z-10"
    style={{
        background: "var(--surface-2)"
    }}
>

<tr>

<th
    className="text-left px-6 py-4 font-semibold"
    style={{
        color: "var(--text)"
    }}
>

Date

</th>

<th
    className="text-left px-6 py-4 font-semibold"
    style={{
        color: "var(--text)"
    }}
>

Particulars

</th>

<th
    className="text-left px-6 py-4 font-semibold"
    style={{
        color: "var(--text)"
    }}
>

Credit (₹)

</th>

<th
    className="text-left px-6 py-4 font-semibold"
    style={{
        color: "var(--text)"
    }}
>

Debit (₹)

</th>

<th
    className="text-left px-6 py-4 font-semibold"
    style={{
        color: "var(--text)"
    }}
>

Balance (₹)

</th>

</tr>

</thead>

<tbody>

{statement.length===0 ? (

<tr>

<td
    colSpan="5"
    className="text-center py-16"
    style={{
        color: "var(--text-muted)"
    }}
>

No Transactions Found

</td>

</tr>

) : (

statement.map((tx,index)=>(

<tr
className="border-t transition"
style={{
    borderColor: "var(--border)"
}}
onMouseEnter={(e)=>{
    e.currentTarget.style.background="var(--surface-2)";
}}
onMouseLeave={(e)=>{
    e.currentTarget.style.background="transparent";
}}
>

<td className="px-6 py-4">

{new Date(
tx.createdAt
).toLocaleDateString("en-IN")}

</td>

<td className="px-6 py-4">

<div className="font-medium">

{tx.particulars}

</div>

{tx.note && (

<div
    className="text-xs mt-1"
    style={{
        color: "var(--text-muted)"
    }}
>

{tx.note}

</div>

)}

</td>

<td className="px-6 py-4 text-right">

{tx.credit ? (

<span className="font-semibold text-green-600">

{formatCurrency(tx.credit)}

</span>

) : (

<span
    style={{
        color: "var(--text-muted)"
    }}
>

—

</span>

)}

</td>

<td className="px-6 py-4 text-right">

{tx.debit ? (
<span
    className="font-semibold"
    style={{
        color: "var(--danger)"
    }}
>

{formatCurrency(tx.debit)}

</span>

) : (

<span className="text-gray-400">

—

</span>

)}

</td>

<td
    className="px-6 py-4 text-right font-semibold"
    style={{
        color: "var(--text)"
    }}
>

{formatCurrency(tx.balanceAfter)}

</td>

</tr>

))

)}

</tbody>

</table>

</div>

</div>
</div>
</div>

);

};

export default StatementPage;