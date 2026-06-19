const express =
require("express");

const router =
express.Router();

const {
  createAccount,
  getAccounts,
    deleteAccount,
} = require(
  "../controllers/accountController"
);

const {
  protect,
} = require(
  "../middleware/auth"
);

router.post(
  "/",
  protect,
  createAccount
);

router.get(
  "/",
  protect,
  getAccounts
);
router.delete(
 "/:id",
 protect,
 deleteAccount
);
module.exports =
router;