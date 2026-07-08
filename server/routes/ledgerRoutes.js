const express =
require("express");

const router =
express.Router();

const {
  manualTransaction,
  transferFunds,
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


module.exports =
router;
