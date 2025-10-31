const pool = require("../config/db");


// ===== Get Settlements by Group =====
async function getGroupSettlements(group_id) {
  const [settlements] = await pool.query(
    `SELECT s.settlement_id, s.from_user, fu.username AS from_user_name,
            s.to_user, tu.username AS to_user_name, s.amount, s.created_at
     FROM settlements s
     LEFT JOIN users fu ON s.from_user = fu.user_id
     LEFT JOIN users tu ON s.to_user = tu.user_id
     WHERE s.group_id = ?
     ORDER BY s.created_at DESC`,
    [group_id]
  );

  return settlements;
}
async function getUserNetSettlements(user_id) {
  const [rows] = await pool.query(
    `SELECT s.from_user, u1.username as from_name,
            s.to_user, u2.username as to_name,
            SUM(s.amount) as total_amount
     FROM settlements s
     JOIN users u1 ON s.from_user = u1.user_id
     JOIN users u2 ON s.to_user = u2.user_id
     WHERE s.from_user = ? OR s.to_user = ?
     GROUP BY s.from_user, s.to_user`,
    [user_id, user_id]
  );

  return rows;
}


module.exports = {  getGroupSettlements, getUserNetSettlements };

