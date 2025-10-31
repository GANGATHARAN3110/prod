const express = require("express");
const {
  settleController,
  settleUpGroupController,
  getGroupDebtsController,
  undoLastSettlementController,
  getLastSettlementController,
    getGroupSummaryController,
} = require("../controllers/settleupController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route POST /api/settle
 * @desc Perform a settlement (individual)
 * @body { groupId, fromUser, toUser, amount }
 * @access Protected
 */
router.post("/", authenticateToken, settleController);

/**
 * @route POST /api/settle/group/:groupId
 * @desc Perform group settle-up (can be partial or full)
 * @body { settledBy, partialSettlements? }
 * @access Protected
 */
router.post("/group/:groupId", authenticateToken, settleUpGroupController);

/**
 * @route GET /api/settle/debts/:groupId
 * @desc Get all pending debts within a group
 * @access Protected
 */
router.get("/debts/:groupId", authenticateToken, getGroupDebtsController);

/**
 * @route POST /api/settle/undo
 * @desc Undo the last settlement in the group
 * @body { groupId, undoneBy }
 * @access Protected
 */
router.post("/undo", authenticateToken, undoLastSettlementController);

/**
 * @route GET /api/settle/last/:groupId
 * @desc Get the last settlement details
 * @access Protected
 */
router.get("/last/:groupId", authenticateToken, getLastSettlementController);

/**
 * @route GET /api/settle/summary/:groupId
 * @desc Get complete "who owes whom" summary for a group
 * @access Protected
 */
router.get("/summary/:groupId", authenticateToken, getGroupSummaryController);

module.exports = router;
