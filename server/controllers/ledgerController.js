const Account =
require("../models/Account");

const Ledger =
require(
  "../models/LedgerTransaction"
);

const manualTransaction =
async (req, res) => {
  try {
    const {
      accountId,
      amount,
      type,
      particulars,
      note,
    } = req.body;

    const account =
      await Account.findOne({
        _id: accountId,
        createdBy:
          req.user._id,
      });

    if (!account) {
      return res
        .status(404)
        .json({
          message:
            "Account not found",
        });
    }
if (type === "credit") {

  account.currentBalance +=
    Number(amount);

} else {

  if (
    account.currentBalance <
    Number(amount)
  ) {
    return res.status(400).json({
      message:
        "Insufficient balance",
    });
  }

  account.currentBalance -=
    Number(amount);
}
    

    await account.save();

    const txn =
      await Ledger.create({
        accountId,

        particulars,

        credit:
          type === "credit"
            ? amount
            : 0,

        debit:
          type === "debit"
            ? amount
            : 0,

        balanceAfter:
          account.currentBalance,

        sourceType:
          "manual",

        note,

        createdBy:
          req.user._id,
      });

    res.status(201).json(
      txn
    );
  } catch (err) {

  console.log(
    "MANUAL TRANSACTION ERROR:",
    err
  );

  res.status(500).json({
    message:
      err.message,
  });
}
};



const transferFunds =
async (req, res) => {
  const {
    fromAccountId,
    toAccountId,
    amount,
    note,
  } = req.body;
const from =
await Account.findOne({
  _id:
   fromAccountId,

  createdBy:
   req.user._id,
});

const to =
await Account.findOne({
  _id:
   toAccountId,

  createdBy:
   req.user._id,
});

  if (!from || !to) {
    return res
      .status(404)
      .json({
        message:
          "Account not found",
      });
  }
if (
 from.currentBalance <
 Number(amount)
)
{
 return res.status(400)
 .json({
  message:
   "Insufficient balance"
 });
}
  from.currentBalance -=
    Number(amount);

  to.currentBalance +=
    Number(amount);

  await from.save();
  await to.save();

  await Ledger.create({
    accountId:
      from._id,

    particulars:
      `Transfer to ${to.name}`,

    debit: amount,

    balanceAfter:
      from.currentBalance,

    sourceType:
      "transfer",

    createdBy:
      req.user._id,
  });

  await Ledger.create({
    accountId:
      to._id,

    particulars:
      `Transfer from ${from.name}`,

    credit: amount,

    balanceAfter:
      to.currentBalance,

    sourceType:
      "transfer",

    createdBy:
      req.user._id,
  });

  res.json({
    success: true,
  });
};


const getStatement =
async (req, res) => {

  const data =
    await Ledger.find({
      accountId:
        req.params.accountId,

      createdBy:
        req.user._id,
    })
      .sort({
        date: 1,
      });

  res.json(data);
};

module.exports = {
  manualTransaction,
transferFunds,
  getStatement,
};