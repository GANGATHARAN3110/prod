const logger = require("../utils/logger");
const {  getGroupSettlements,getUserNetSettlements } = require("../services/settlementService");



// ===== Get all settlements in a group =====
async function listSettlements(req, res) {
  try {
    const { group_id } = req.params;
    const settlements = await getGroupSettlements(group_id);

    logger.info({ group_id, count: settlements.length }, "Fetched group settlements");
    res.status(200).json(settlements);
  } catch (err) {
    logger.error(err, "Failed to list settlements");
    res.status(400).json({ message: err.message });
  }
}
async function listUserNetSettlements(req, res) {
  try {
    const { user_id } = req.params;
    const settlements = await getUserNetSettlements(user_id);

    res.status(200).json(settlements);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
async function getUserBalanceController(req, res) {
  try {
    const { user_id } = req.params;
    const balance = await getUserBalance(user_id);

    res.status(200).json({ user_id, balance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


module.exports = { listSettlements,listUserNetSettlements  };
