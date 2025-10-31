const { getUserBalance } = require("../services/balanceService");

// Get balance for a user
async function getUserBalanceController(req, res) {
  try {
    const { user_id } = req.params;
    const balance = await getUserBalance(user_id);

    res.status(200).json({ user_id, balance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getUserBalanceController };
