const pool = require("../config/db");

// ===== Get net balance for a single user =====
async function getUserBalance(user_id) {
  const [rows] = await pool.query(
    `SELECT 
        SUM(CASE WHEN s.from_user = ? THEN -s.amount ELSE s.amount END) as balance
     FROM settlements s
     WHERE s.from_user = ? OR s.to_user = ?`,
    [user_id, user_id, user_id]
  );

  return rows[0].balance || 0;
}

module.exports = { getUserBalance };
