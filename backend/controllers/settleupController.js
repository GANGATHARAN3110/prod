const {
  settle,
  settleUpGroup,
  getGroupDebts,
  undoLastSettlement,
  getLastSettlement,
  getGroupSummary,
} = require("../services/settleupService");

/**
 * 🔹 Utility: Extract IP address safely
 */
const getIpAddress = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * 1️⃣ Individual or Partial Settlement
 * -------------------------------------
 * POST /api/settle
 * Body: { groupId, fromUser, toUser?, amount? }
 */
const settleController = async (req, res) => {
  try {
    const { groupId, fromUser, toUser, amount } = req.body;
    const ipAddress = getIpAddress(req);

    // ✅ Validation
    if (!groupId || !fromUser) {
      return res
        .status(400)
        .json({ error: "Missing required fields: groupId and fromUser" });
    }

    const result = await settle({ groupId, fromUser, toUser, amount, ipAddress });

    res.status(200).json({
      success: true,
      message: result.message,
      totalSettled: result.totalSettled,
      settlementIds: result.settlementIds,
    });
  } catch (err) {
    console.error("[settleController] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 2️⃣ Group Settle-Up (Created-date-based)
 * ----------------------------------------
 * POST /api/settle/group/:groupId
 * Body: { settledBy, partialSettlements? }
 */
const settleUpGroupController = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { settledBy, partialSettlements } = req.body;

    if (!groupId || !settledBy || !partialSettlements) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: groupId, settledBy, partialSettlements",
      });
    }

    const result = await settleUpGroup(groupId, settledBy, partialSettlements);

    return res.status(200).json(result);
  } catch (err) {
    console.error("[settleUpGroupController] ❌ Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * 3️⃣ Get Group Debts Summary
 * ----------------------------
 * GET /api/settle/debts/:groupId
 */
const getGroupDebtsController = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId)
      return res.status(400).json({ error: "groupId parameter is required" });

    const debts = await getGroupDebts(groupId);

    res.status(200).json({
      success: true,
      message:
        debts.length === 0
          ? "No pending debts. Everyone is settled up!"
          : "Group debts fetched successfully",
      totalDebts: debts.length,
      debts,
    });
  } catch (err) {
    console.error("[getGroupDebtsController] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 4️⃣ Undo Last Settlement (Group or Individual)
 * ----------------------------------------------
 * POST /api/settle/undo
 * Body: { groupId, undoneBy }
 */
const undoLastSettlementController = async (req, res) => {
  try {
    const { groupId, undoneBy } = req.body;
    const ipAddress = getIpAddress(req);

    if (!groupId || !undoneBy) {
      return res
        .status(400)
        .json({ error: "Missing required fields: groupId and undoneBy" });
    }

    const result = await undoLastSettlement({ groupId, undoneBy, ipAddress });

    res.status(200).json({
      success: true,
      message: result.message,
      undone: result.undone,
      settlements: result.settlements,
    });
  } catch (err) {
    console.error("[undoLastSettlementController] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 5️⃣ Get Last Settlement Summary (for confirmation)
 * --------------------------------------------------
 * GET /api/settle/last/:groupId
 */
const getLastSettlementController = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId)
      return res.status(400).json({ error: "groupId parameter is required" });

    const result = await getLastSettlement(groupId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("[getLastSettlementController] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getGroupSummaryController = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId)
      return res.status(400).json({ error: "groupId parameter is required" });

    const summary = await getGroupSummary(groupId);
    res.status(200).json({
      success: true,
      message: summary.message,
      debts: summary.debts,
      summary: summary.summary,
    });
  } catch (err) {
    console.error("[getGroupSummaryController] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  settleController,
  settleUpGroupController,
  getGroupDebtsController,
  undoLastSettlementController,
  getLastSettlementController,
  getGroupSummaryController,
};
