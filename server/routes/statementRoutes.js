const express =
require("express");

const router =
express.Router();

const {
protect,
} = require(
"../middleware/auth"
);

const {

getStatement,
downloadStatementPDF,
} = require(
"../controllers/statementController"
);

router.get(

"/:accountId",

protect,

getStatement,

);
router.get(
  "/:accountId/pdf",
  protect,
  downloadStatementPDF
);
module.exports =
router;