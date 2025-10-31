const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

async function logActivity({
  entityId,
  tableName,
  userId,
  type,
  oldJson = null,
  newJson = null,
  ipAddress = null,
}) {
  const conn = await pool.getConnection();
  try {
    const activityId = uuidv4();

    const sql = `
      INSERT INTO activity (
        activityId, entityId, tableName, userId, ipAddress, type, oldJson, newJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.query(sql, [
      activityId,
      entityId,
      tableName,
      userId,
      ipAddress,
      type,
      oldJson ? JSON.stringify(oldJson) : null,
      newJson ? JSON.stringify(newJson) : null,
    ]);

    console.log(
      `[activityService] ✅ Logged ${type} on ${tableName} (entityId: ${entityId})`
    );
  } catch (err) {
    console.error("[activityService] ❌ Failed to log activity:", err.message);
  } finally {
    conn.release();
  }
}

// ============================================================
// 🧮 CALCULATE SPLITS (Enhanced)
// ============================================================
async function calculateSplits(conn, groupId, amount, splitType, splitDetails) {
  const [members] = await conn.query(
    `SELECT userId FROM groupUser WHERE groupId = ? AND status='accepted'`,
    [groupId]
  );
  if (!members.length) throw new Error("No group members found");

  let splits = [];

  switch (splitType) {
    case "equal":
      const equalAmount = parseFloat((amount / members.length).toFixed(2));
      splits = members.map((m) => ({
        userId: m.userId,
        amount: equalAmount,
        percentage: parseFloat((100 / members.length).toFixed(2)),
        splitValue: 1,
      }));
      break;

    case "percentage":
      const totalPercent = splitDetails.reduce((a, s) => a + parseFloat(s.percentage || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01)
        throw new Error("Percentages must total 100%");
      splits = splitDetails.map((s) => ({
        userId: s.userId,
        amount: parseFloat(((amount * s.percentage) / 100).toFixed(2)),
        percentage: parseFloat(s.percentage),
        splitValue: s.percentage,
      }));
      break;

    case "exact":
      const totalExact = splitDetails.reduce((a, s) => a + parseFloat(s.amount || 0), 0);
      if (Math.abs(totalExact - parseFloat(amount)) > 0.01)
        throw new Error("Exact splits must total the expense amount");
      splits = splitDetails.map((s) => ({
        userId: s.userId,
        amount: parseFloat(s.amount),
        percentage: parseFloat(((s.amount / amount) * 100).toFixed(2)),
        splitValue: s.amount,
      }));
      break;

    case "share":
      const totalShares = splitDetails.reduce((sum, s) => sum + s.share, 0);
      splits = splitDetails.map((s) => ({
        userId: s.userId,
        amount: parseFloat(((amount * s.share) / totalShares).toFixed(2)),
        percentage: parseFloat(((s.share / totalShares) * 100).toFixed(2)),
        splitValue: s.share,
      }));
      break;

    default:
      throw new Error("Invalid split type");
  }

  return splits;
}

// ============================================================
// 🧾 ADD EXPENSE (Enhanced)
// ============================================================
async function addExpense({
  groupId,
  title,
  description,
  amount,
  expenseType,
  paidBy,
  splitType,
  splitDetails,
  expenseDate,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ Validate group and optional date range
    const [[group]] = await conn.query(
      `SELECT startDate, endDate FROM groupList WHERE groupId = ? AND deletedAt IS NULL`,
      [groupId]
    );
    if (!group) throw new Error("Group not found");
    if (!expenseDate) throw new Error("Expense date required");

    const dateObj = new Date(expenseDate);
    const startDate = group.startDate ? new Date(group.startDate) : null;
    const endDate = group.endDate ? new Date(group.endDate) : null;

    if (startDate && dateObj < startDate)
      throw new Error("Expense date cannot be before group start date");
    if (endDate && dateObj > endDate)
      throw new Error("Expense date cannot be after group end date");

    const expenseId = uuidv4();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) throw new Error("Invalid amount value");

    // Insert expense
    await conn.query(
      `INSERT INTO expense 
       (expenseId, groupId, title, description, amount, expenseType, paidBy, splitType, expenseDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [expenseId, groupId, title, description, numericAmount, expenseType, paidBy, splitType, expenseDate]
    );

    // Splits
    const splits = await calculateSplits(conn, groupId, numericAmount, splitType, splitDetails);
    for (let s of splits) {
      const balance = s.userId === paidBy ? 0 : s.amount;
      await conn.query(
        `INSERT INTO expenseUser (id, expenseId, userId, amount, percentage, splitValue, balance)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), expenseId, s.userId, s.amount, s.percentage, s.splitValue || 0, balance]
      );
    }

    await conn.commit();
    return { expenseId, groupId, title, amount: numericAmount, expenseType, expenseDate, splitType, splits };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ============================================================
// ✏️ UPDATE EXPENSE (Enhanced)
// ============================================================
async function updateExpense({
  expenseId,
  title,
  description,
  amount,
  expenseType,
  paidBy,
  splitType,
  splitDetails,
  expenseDate,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[expense]] = await conn.query(`SELECT * FROM expense WHERE expenseId = ?`, [expenseId]);
    if (!expense) throw new Error("Expense not found");

    const [[group]] = await conn.query(
      `SELECT startDate, endDate FROM groupList WHERE groupId = ?`,
      [expense.groupId]
    );

    const dateObj = new Date(expenseDate);
    if (group.startDate && dateObj < new Date(group.startDate))
      throw new Error("Expense date cannot be before group start date");
    if (group.endDate && dateObj > new Date(group.endDate))
      throw new Error("Expense date cannot be after group end date");

    await conn.query(
      `UPDATE expense 
       SET title=?, description=?, amount=?, expenseType=?, paidBy=?, splitType=?, expenseDate=? 
       WHERE expenseId=?`,
      [title, description, amount, expenseType, paidBy, splitType, expenseDate, expenseId]
    );

    await conn.query(`DELETE FROM expenseUser WHERE expenseId=?`, [expenseId]);

    const splits = await calculateSplits(conn, expense.groupId, amount, splitType, splitDetails);
    for (let s of splits) {
      const balance = s.userId === paidBy ? 0 : s.amount;
      await conn.query(
        `INSERT INTO expenseUser (id, expenseId, userId, amount, percentage, splitValue, balance)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), expenseId, s.userId, s.amount, s.percentage, s.splitValue || 0, balance]
      );
    }

    await conn.commit();
    return { expenseId, title, amount, expenseType, expenseDate, splitType, splits };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ============================================================
// ❌ DELETE EXPENSE
// ============================================================
async function deleteExpense(expenseId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[expense]] = await conn.query(`SELECT groupId FROM expense WHERE expenseId = ?`, [expenseId]);
    if (!expense) throw new Error("Expense not found");

    await conn.query(`DELETE FROM expenseUser WHERE expenseId=?`, [expenseId]);
    await conn.query(`DELETE FROM expense WHERE expenseId=?`, [expenseId]);

    await conn.commit();
    return { message: "Expense deleted successfully", expenseId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ============================================================
// 📜 GET EXPENSES BY GROUP
// ============================================================
async function getExpensesByGroupId(groupId, page = 1, limit = 10, search = "") {
  const conn = await pool.getConnection();
  try {
    const offset = (page - 1) * limit;
    const searchQuery = `%${search}%`;

    let whereClause = `WHERE e.groupId = ?`;
    const params = [groupId];

    if (search && search.trim() !== "") {
      whereClause += ` AND (e.title LIKE ? OR e.description LIKE ? OR u.email LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ?)`;
      params.push(searchQuery, searchQuery, searchQuery, searchQuery, searchQuery);
    }

    const [countResult] = await conn.query(
      `SELECT COUNT(*) AS total FROM expense e JOIN user u ON e.paidBy = u.userId ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const [totalSpentResult] = await conn.query(
      `SELECT COALESCE(SUM(e.amount), 0) AS totalSpent 
       FROM expense e JOIN user u ON e.paidBy = u.userId ${whereClause}`,
      params
    );
    const totalSpent = parseFloat(totalSpentResult[0]?.totalSpent || 0);

    const [expenses] = await conn.query(
      `SELECT e.expenseId, e.title, e.description, e.amount, e.expenseType, e.splitType, e.expenseDate, e.createdAt,
              u.userId AS paidById, u.firstName, u.lastName
       FROM expense e
       JOIN user u ON e.paidBy = u.userId
       ${whereClause}
       ORDER BY e.expenseDate DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    for (let exp of expenses) {
      exp.amount = parseFloat(exp.amount);
      exp.paidByName = `${exp.firstName} ${exp.lastName}`;

      const [splits] = await conn.query(
        `SELECT ep.userId, u.firstName, u.lastName, ep.amount, ep.percentage, ep.splitValue, ep.balance
         FROM expenseUser ep
         JOIN user u ON ep.userId = u.userId
         WHERE ep.expenseId = ?`,
        [exp.expenseId]
      );

      exp.splits = splits.map((s) => ({
        userId: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        amount: parseFloat(s.amount),
        percentage: parseFloat(s.percentage),
        splitValue: parseFloat(s.splitValue),
        balance: parseFloat(s.balance),
      }));
    }

    return {
      total,
      totalSpent,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      expenses,
    };
  } finally {
    conn.release();
  }
}

// ============================================================
// 📊 GET EXPENSE DETAILS
// ============================================================
async function getExpenseUsers(expenseId) {
  const conn = await pool.getConnection();
  try {
    const [[expense]] = await conn.query(
      `SELECT e.*, u.firstName, u.lastName
       FROM expense e
       JOIN user u ON e.paidBy = u.userId
       WHERE e.expenseId=?`,
      [expenseId]
    );
    if (!expense) throw new Error("Expense not found");

    expense.paidByName = `${expense.firstName} ${expense.lastName}`;

    const [splits] = await conn.query(
      `SELECT ep.userId, u.firstName, u.lastName, ep.amount, ep.percentage, ep.splitValue, ep.balance
       FROM expenseUser ep
       JOIN user u ON ep.userId = u.userId
       WHERE ep.expenseId=?`,
      [expenseId]
    );

    expense.splits = splits.map((s) => ({
      userId: s.userId,
      fullName: `${s.firstName} ${s.lastName}`,
      amount: parseFloat(s.amount),
      percentage: parseFloat(s.percentage),
      splitValue: parseFloat(s.splitValue),
      balance: parseFloat(s.balance),
    }));

    return expense;
  } finally {
    conn.release();
  }
}

// ============================================================
// 📈 GROUP EXPENSE SUMMARY
// ============================================================
async function getGroupExpenseSummary(groupId) {
  const conn = await pool.getConnection();
  try {
    const [expenses] = await conn.query(
      `SELECT e.expenseId, e.amount FROM expense e WHERE e.groupId = ?`,
      [groupId]
    );
    const [expenseUsers] = await conn.query(
      `SELECT ep.userId, ep.amount FROM expenseUser ep JOIN expense e ON ep.expenseId = e.expenseId WHERE e.groupId = ?`,
      [groupId]
    );

    const totalGroupExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const perMember = {};
    for (let eu of expenseUsers) {
      if (!perMember[eu.userId]) perMember[eu.userId] = 0;
      perMember[eu.userId] += parseFloat(eu.amount);
    }

    const membersExpense = Object.entries(perMember).map(([userId, amount]) => ({
      userId,
      totalExpense: parseFloat(amount.toFixed(2)),
    }));

    return { groupId, totalGroupExpense: parseFloat(totalGroupExpense.toFixed(2)), membersExpense };
  } finally {
    conn.release();
  }
}

module.exports = {
  addExpense,
  updateExpense,
  deleteExpense,
  getExpensesByGroupId,
  getExpenseUsers,
  calculateSplits,
  getGroupExpenseSummary,
  logActivity,
};
