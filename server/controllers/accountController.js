const Expense =
require("../models/Expense");

const Invoice =
require("../models/Invoice");

const Ledger =
require("../models/LedgerTransaction");
const Account =
require("../models/Account");

const createAccount =
async (req, res) => {
  try {
    const {
      name,
      type,
      openingBalance,
    } = req.body;
const account =
  await Account.create({
    name,
    type,
    openingBalance,

    currentBalance:
      openingBalance,

    createdBy:
      req.user._id,
  });

// CREATE OPENING ENTRY
if (Number(openingBalance) > 0) {
  await Ledger.create({
    accountId: account._id,

    particulars: "Opening Balance",

    credit: Number(openingBalance),

    debit: 0,

    balanceAfter:
      Number(openingBalance),

    sourceType: "opening",

    createdBy:
      req.user._id,
  });
}
res.status(201).json(
  account
);
  } catch (err) {
    res.status(500).json({
      message:
        "Failed to create account",
    });
  }
};

const getAccounts =
async (req, res) => {
  const accounts =
    await Account.find({
      createdBy:
        req.user._id,
    }).sort({
      createdAt: -1,
    });

  res.json(accounts);
};
const deleteAccount =
async (req,res) => {

 try {

  await Account.findOneAndDelete({
    _id:req.params.id,
    createdBy:req.user._id,
  });

  res.json({
    success:true
  });

 } catch(err) {
const deleteAccount =
async (req,res) => {

 try {

 const ledgerCount =
await Ledger.countDocuments({
 accountId:req.params.id
});

if(ledgerCount > 0)
{
 return res.status(400).json({
  message:
   "Cannot delete account with transactions"
 });
}

  await Account.findOneAndDelete({
    _id:req.params.id,
    createdBy:req.user._id,
  });

  res.json({
    success:true
  });

 } catch(err) {

  console.log(err);

  res.status(500).json({
    message:
      "Failed to delete account"
  });

 }

};
  res.status(500).json({
    message:"Failed to delete account"
  });

 }
};

module.exports = {
  createAccount,
  getAccounts,
    deleteAccount,
  
};