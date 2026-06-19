const express =
require("express");

const router =
express.Router();

const {
  manualTransaction,
  transferFunds,
  getStatement,
  getRecentTransactions,
} = require(
  "../controllers/ledgerController"
);

const {
  protect,
} = require(
  "../middleware/auth"
);

router.post(
  "/manual",
  protect,
  manualTransaction
);

router.post(
  "/transfer",
  protect,
  transferFunds
);

router.get(
  "/statement/:accountId",
  protect,
  getStatement
);

module.exports =
router;
