const Account =
require("../models/Account");
const User = require("../models/User");
const Ledger =
require("../models/LedgerTransaction");
const {
  generateStatementPDF,
} = require("../services/statementPdfService");
const getStatement =
async (req,res)=>{

try{

const account =
await Account.findOne({

_id:req.params.accountId,

createdBy:req.user._id,

});
const {
  type,
  customStart,
  customEnd,
} = req.query;
if(!account){

return res.status(404).json({

message:"Account not found",

});

}
let filter = {

accountId:req.params.accountId,

createdBy:req.user._id,

};

const today = new Date();

let start = null;

let end = null;

switch(type){

case "today":

start = new Date(
today.getFullYear(),
today.getMonth(),
today.getDate()
);

end = new Date(start);

end.setDate(end.getDate()+1);

break;

case "thisWeek":

start = new Date(today);

start.setDate(
today.getDate()-today.getDay()
);

end = new Date();

break;

case "thisMonth":

start = new Date(
today.getFullYear(),
today.getMonth(),
1
);

end = new Date();

break;

case "previousMonth":

start = new Date(
today.getFullYear(),
today.getMonth()-1,
1
);

end = new Date(
today.getFullYear(),
today.getMonth(),
0,
23,
59,
59
);

break;

case "custom":

if(customStart && customEnd){

start = new Date(customStart);

end = new Date(customEnd);

end.setHours(
23,
59,
59,
999
);

}

break;

default:

break;

}

if(start){

filter.createdAt={

$gte:start,

$lte:end,

};

}

const transactions =
await Ledger.find(filter)
.sort({
createdAt:1,
});
const totalCredit =
transactions.reduce(
(sum,item)=>
sum+Number(item.credit||0),
0
);

const totalDebit =
transactions.reduce(
(sum,item)=>
sum+Number(item.debit||0),
0
);

const closingBalance =
Number(
account.currentBalance||0
);

const openingBalance =
closingBalance
-totalCredit
+totalDebit;

res.json({

account,

summary:{

openingBalance,

totalCredit,

totalDebit,

closingBalance,

},

transactions,

});

}catch(err){

console.log(err);

res.status(500).json({

message:"Failed to fetch statement",

});

}

};
const downloadStatementPDF = async (req, res) => {

try {

const account =
await Account.findOne({

_id:req.params.accountId,

createdBy:req.user._id,

});

if(!account){

return res.status(404).json({

message:"Account not found",

});

}

const seller = await User.findById(req.user._id);

const {
type,
customStart,
customEnd,
} = req.query;

let filter = {

accountId:req.params.accountId,

createdBy:req.user._id,

};

const today = new Date();

let start = null;

let end = null;

switch(type){

case "today":

start = new Date(
today.getFullYear(),
today.getMonth(),
today.getDate()
);

end = new Date(start);

end.setDate(end.getDate()+1);

break;

case "thisWeek":

start = new Date(today);

start.setDate(
today.getDate()-today.getDay()
);

end = new Date();

break;

case "thisMonth":

start = new Date(
today.getFullYear(),
today.getMonth(),
1
);

end = new Date();

break;

case "previousMonth":

start = new Date(
today.getFullYear(),
today.getMonth()-1,
1
);

end = new Date(
today.getFullYear(),
today.getMonth(),
0,
23,
59,
59
);

break;

case "custom":

if(customStart && customEnd){

start = new Date(customStart);

end = new Date(customEnd);

end.setHours(
23,
59,
59,
999
);

}

break;

}

if(start){

filter.createdAt={

$gte:start,

$lte:end,

};

}

const transactions =
await Ledger.find(filter)
.sort({
createdAt:1,
});

const totalCredit =
transactions.reduce(
(sum,item)=>
sum+Number(item.credit||0),
0
);

const totalDebit =
transactions.reduce(
(sum,item)=>
sum+Number(item.debit||0),
0
);

const closingBalance =
Number(account.currentBalance);

const openingBalance =
closingBalance -
totalCredit +
totalDebit;

const pdf =
await generateStatementPDF({

seller,
account,

transactions,

periodLabel:type || "Statement",
  fromDate: start,
  toDate: end,
summary:{

openingBalance,

totalCredit,

totalDebit,

closingBalance,

},

});
const pdfBuffer = Buffer.from(pdf);
const statementFileTypes = {
  today: "Daily_Statement",
  thisWeek: "Weekly_Statement",
  thisMonth: "Monthly_Statement",
  previousMonth: "Previous_Month_Statement",
  custom: "Custom_Statement",
};

const statementType =
  statementFileTypes[type] || "Account_Statement";

// Replace spaces and invalid filename characters
const accountName = account.name
  .trim()
  .replace(/[\\/:*?"<>|]/g, "")
  .replace(/\s+/g, "_");

const fileName = `Account_${accountName}_${statementType}.pdf`;
console.log(fileName);
res.writeHead(200, {
  "Content-Type": "application/pdf",
 "Content-Disposition":
  `attachment; filename="${fileName}"`,
  "Content-Length": pdfBuffer.length,
});

return res.end(pdfBuffer);

res.send(pdf);

} catch (error) {

  console.error(
    "Statement PDF Error:",
    error
  );

  return res.status(500).json({
    success: false,
    message: "Failed to generate statement PDF",
    error: error.message,
  });

}
};
module.exports={

getStatement,

downloadStatementPDF,

};