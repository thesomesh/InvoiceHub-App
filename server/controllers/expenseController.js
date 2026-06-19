const Expense = require("../models/Expense");
const Account =
require("../models/Account");

const Ledger =
require("../models/LedgerTransaction");
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
    createdBy: req.user._id,
    }).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expenses",
    });
  }
};

const createExpense = async (req, res) => {
  const account =
await Account.findOne({
  _id:req.body.accountId,
  createdBy:req.user._id
});

if(!account){
  return res.status(404).json({
    message:"Account not found"
  });
}
if (
  account.currentBalance <
  Number(req.body.amount)
) {
  return res.status(400).json({
    message:
      "Insufficient balance"
  });
}
account.currentBalance -=
Number(req.body.amount);

await account.save();
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user._id,
    });
await Ledger.create({
  accountId: account._id,

  particulars:
    `Expense - ${req.body.title}`,

  debit:
    Number(req.body.amount),

  credit:0,

  balanceAfter:
    account.currentBalance,

  sourceType:"expense",

  sourceId:expense._id,

  createdBy:req.user._id,
});
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create expense",
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
   const expense =
await Expense.findById(
 req.params.id
);

if(!expense){
 return res.status(404).json({
   message:"Expense not found"
 });
}if (!expense.accountId) {

  await Expense.findByIdAndDelete(
    expense._id
  );

  return res.status(200).json({
    message:
      "Legacy expense deleted"
  });
}

const account =
await Account.findOne({
  _id: expense.accountId,
  createdBy: req.user._id,
});

if (!account) {
  return res.status(404).json({
    message:
      "Account not found"
  });
}

account.currentBalance +=
Number(expense.amount);

await account.save();
await Ledger.create({
 accountId:account._id,

 particulars:
  `Expense Deleted - ${expense.title}`,

 credit:
  Number(expense.amount),

 debit:0,

 balanceAfter:
  account.currentBalance,

sourceType:
  "expense",

 createdBy:
  req.user._id,
});
await Expense.findByIdAndDelete(
  expense._id
);

res.status(200).json({
  message:
    "Expense deleted"
});
  } catch (error) {

  console.log(
    "DELETE EXPENSE ERROR:",
    error
  );

  res.status(500).json({
    message:
      error.message,
  });
}
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};