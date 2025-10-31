const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/**
 * ------------------------
 * 1️⃣ Settle Partial or Full Amount
 * ------------------------
 */
async function settle({ groupId, fromUser, toUser = null, amount = null, ipAddress = null }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Validate group
    const [[group]] = await conn.query(
      `SELECT * FROM groupList WHERE groupId=? AND deletedAt IS NULL`,
      [groupId]
    );
    if (!group) throw new Error("Group not found");

    let totalSettled = 0;
    let settlementIds = [];

    if (fromUser && toUser && amount) {
      // -------------------------
      // Partial settlement
      // -------------------------
      const [balances] = await conn.query(
        `SELECT ep.id, ep.balance 
         FROM expenseUser ep
         JOIN expense e ON ep.expenseId = e.expenseId
         WHERE e.groupId=? AND ep.userId=? AND e.paidBy=? AND ep.balance>0
         ORDER BY ep.createdAt ASC`,
        [groupId, toUser, fromUser]
      );

      if (!balances.length) throw new Error("No pending balance found to settle");

      let remaining = parseFloat(amount);

      for (let b of balances) {
        if (remaining <= 0) break;
        const pay = Math.min(b.balance, remaining);

        await conn.query(`UPDATE expenseUser SET balance = balance - ? WHERE id = ?`, [pay, b.id]);

        const settlementId = uuidv4();
        await conn.query(
          `INSERT INTO settlement (settlementId, groupId, fromUser, toUser, amount, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          [settlementId, groupId, fromUser, toUser, pay]
        );

        settlementIds.push(settlementId);
        totalSettled += pay;
        remaining -= pay;
      }

      await conn.query(
        `INSERT INTO activity (activityId, entityId, tableName, userId, ipAddress, type, newJson)
         VALUES (?, ?, 'settlement', ?, ?, 'partialSettlement', ?)`,
        [uuidv4(), settlementIds[0], fromUser, ipAddress, JSON.stringify({ fromUser, toUser, amount: totalSettled })]
      );

    } else {
      // -------------------------
      // Full group settlement
      // -------------------------
      const [debts] = await conn.query(
        `SELECT ep.userId, e.paidBy AS creditor, SUM(ep.balance) AS totalOwed
         FROM expenseUser ep
         JOIN expense e ON ep.expenseId = e.expenseId
         WHERE e.groupId = ? AND ep.balance > 0
         GROUP BY ep.userId, e.paidBy`,
        [groupId]
      );

      for (let debt of debts) {
        const amountOwed = parseFloat(debt.totalOwed);
        if (amountOwed <= 0) continue;

        await conn.query(
          `UPDATE expenseUser ep
           JOIN expense e ON ep.expenseId = e.expenseId
           SET ep.balance = 0
           WHERE e.groupId = ? AND ep.userId = ? AND e.paidBy = ?`,
          [groupId, debt.userId, debt.creditor]
        );

        const settlementId = uuidv4();
        await conn.query(
          `INSERT INTO settlement (settlementId, groupId, fromUser, toUser, amount, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          [settlementId, groupId, debt.userId, debt.creditor, amountOwed]
        );

        settlementIds.push(settlementId);
        totalSettled += amountOwed;
      }

      if (totalSettled > 0) {
        const groupSettlementId = uuidv4();
        await conn.query(
          `INSERT INTO groupSettlement (groupSettlementId, groupId, settledBy, totalAmount, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [groupSettlementId, groupId, fromUser, totalSettled]
        );

        await conn.query(
          `INSERT INTO activity (activityId, entityId, tableName, userId, ipAddress, type, newJson)
           VALUES (?, ?, 'groupSettlement', ?, ?, 'groupSettlementMade', ?)`,
          [uuidv4(), groupSettlementId, fromUser, ipAddress, JSON.stringify({ groupId, totalAmount: totalSettled })]
        );
      }
    }

    await conn.commit();
    return { totalSettled, settlementIds, message: "Settlement completed successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * ------------------------
 * 2️⃣ Group Settle-Up Logic (Created-date based)
 * ------------------------
 */
async function settleUpGroup(groupId, settledBy, partialSettlements = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalSettled = 0;
    const appliedSettlements = [];

    for (const { toUser, amount } of partialSettlements) {
      console.log(`[settleUpGroup] ▶️ Processing debtor ${toUser}, amount ₹${amount}`);
      let remaining = parseFloat(amount);

      // Fetch all debts (expenses where toUser owes someone else) oldest first
      const [debts] = await conn.query(
        `SELECT eu.id AS expenseUserId, e.paidBy AS creditor, eu.balance, e.createdAt
         FROM expenseUser eu
         JOIN expense e ON eu.expenseId = e.expenseId
         WHERE e.groupId = ? 
           AND eu.userId = ?
           AND eu.balance > 0
           AND eu.userId != e.paidBy
         ORDER BY e.createdAt ASC`,
        [groupId, toUser]
      );

      if (!debts.length) {
        console.log(`[settleUpGroup] ⚠️ No debts found for user ${toUser}`);
        continue;
      }

      for (const debt of debts) {
        if (remaining <= 0) break;

        const settleAmount = Math.min(remaining, debt.balance);

        // Update expenseUser balance
        await conn.query(
          `UPDATE expenseUser SET balance = balance - ? WHERE id = ?`,
          [settleAmount, debt.expenseUserId]
        );

        // Insert into settlement table
        const settlementId = uuidv4();
        await conn.query(
          `INSERT INTO settlement (
             settlementId, groupId, fromUser, toUser, amount,  status, createdAt
           ) VALUES (?, ?, ?, ?, ?,'active', NOW())`,
          [settlementId, groupId, toUser, debt.creditor, settleAmount]
        );

        // Track applied settlement
        appliedSettlements.push({
          settlementId,
          fromUser: toUser,
          toUser: debt.creditor,
          amount: settleAmount,
          createdAt: debt.createdAt,
        });

        totalSettled += settleAmount;
        remaining -= settleAmount;
      }

      console.log(
        `[settleUpGroup] ✅ Settled ₹${amount - remaining} for debtor ${toUser}`
      );
    }

    if (appliedSettlements.length) {
      // Record group-level activity for tracking
      await conn.query(
        `INSERT INTO activity (activityId, entityId, tableName, userId, ipAddress, type, newJson)
         VALUES (?, ?, 'settlement', ?, NULL, 'groupPartialSettlement', ?)`,
        [
          uuidv4(),
          appliedSettlements[0].settlementId,
          settledBy,
          JSON.stringify({ groupId, totalSettled, appliedSettlements }),
        ]
      );
    }

    await conn.commit();
    return {
      success: true,
      message:
        appliedSettlements.length > 0
          ? "Partial settlements completed successfully"
          : "No applicable balances found to settle",
      totalSettled,
      settlements: appliedSettlements,
    };
  } catch (err) {
    await conn.rollback();
    console.error("[settleUpGroup] ❌ Error:", err.message);
    throw err;
  } finally {
    conn.release();
  }
}
/**
 * ------------------------
 * 3️⃣ Get Group Debts
 * ------------------------
 */
async function getGroupDebts(groupId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT 
        ep.userId AS debtorId,
        du1.fullName AS debtorName,
        du1.email AS debtorEmail,
        e.paidBy AS creditorId,
        du2.fullName AS creditorName,
        du2.email AS creditorEmail,
        SUM(ep.balance) AS totalOwed
       FROM expenseUser ep
       JOIN expense e ON ep.expenseId = e.expenseId
       JOIN user du1 ON ep.userId = du1.userId
       JOIN user du2 ON e.paidBy = du2.userId
       WHERE e.groupId = ? AND ep.balance > 0 AND ep.userId != e.paidBy
       GROUP BY ep.userId, e.paidBy
       ORDER BY debtorName ASC, creditorName ASC`,
      [groupId]
    );

    return rows.map(r => ({
      fromUserId: r.debtorId,
      fromUser: r.debtorName,
      fromEmail: r.debtorEmail,
      toUserId: r.creditorId,
      toUser: r.creditorName,
      toEmail: r.creditorEmail,
      amount: parseFloat(r.totalOwed),
    }));
  } finally {
    conn.release();
  }
}

/**
 * ------------------------
 * 4️⃣ Undo Last Settlement (Group or Individual)
 * ------------------------
 */

async function undoLastSettlement({ groupId, undoneBy, ipAddress = null }) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1️⃣ Get the most recent settlement entry for this group
    const [[latestSettle]] = await conn.query(
      `SELECT * FROM settlement 
       WHERE groupId = ? AND status = 'active' 
       ORDER BY createdAt DESC LIMIT 1`,
      [groupId]
    )

    if (!latestSettle) throw new Error('No settlement found to undo')

    // Extract the exact timestamp (to the second)
    const createdTime = latestSettle.createdAt

    // 2️⃣ Get all settlements created at the same timestamp (same batch)
    const [relatedSettlements] = await conn.query(
      `SELECT * FROM settlement 
       WHERE groupId = ? AND status = 'active' AND createdAt = ?`,
      [groupId, createdTime]
    )

    if (relatedSettlements.length === 0)
      throw new Error('No related settlements found to undo')

    // 3️⃣ Reverse all balances for that batch
    for (const s of relatedSettlements) {
      await conn.query(
        `UPDATE expenseUser ep
         JOIN expense e ON ep.expenseId = e.expenseId
         SET ep.balance = ep.balance + ?
         WHERE e.groupId = ? AND ep.userId = ? AND e.paidBy = ?`,
        [s.amount, groupId, s.fromUser, s.toUser]
      )
    }

    // 4️⃣ Mark all as adjusted (undo complete)
    await conn.query(
      `UPDATE settlement 
       SET status = 'adjusted' 
       WHERE groupId = ? AND createdAt = ?`,
      [groupId, createdTime]
    )

    // 5️⃣ Log one activity entry
    await conn.query(
      `INSERT INTO activity 
       (activityId, entityId, tableName, userId, ipAddress, type, newJson)
       VALUES (?, ?, 'settlement', ?, ?, 'undoSettlement', ?)`,
      [
        uuidv4(),
        latestSettle.settlementId,
        undoneBy,
        ipAddress,
        JSON.stringify({ groupId, undoneBatch: relatedSettlements }),
      ]
    )

    await conn.commit()

    return {
      undone: true,
      settlements: relatedSettlements,
      message: `Last settlement batch (createdAt: ${createdTime}) undone successfully — ${relatedSettlements.length} entries adjusted.`,
    }
  } catch (err) {
    await conn.rollback()
    console.error('[undoLastSettlement] Error:', err)
    throw err
  } finally {
    conn.release()
  }
}

/**
 * ------------------------
 * 5️⃣ Get Last Settlement for Confirmation
 * ------------------------
 */
async function getLastSettlement(groupId) {
  const conn = await pool.getConnection();
  try {
    const [[groupSettle]] = await conn.query(
      `SELECT * FROM settlement WHERE groupId = ? AND status = 'active' ORDER BY createdAt DESC LIMIT 1`,
      [groupId]
    );

    if (groupSettle) {
      const [settlements] = await conn.query(
        `SELECT * FROM settlement WHERE groupId = ? AND createdAt <= ? AND status = 'active'`,
        [groupId, groupSettle.createdAt]
      );
      return { type: "group", groupSettlement: groupSettle, settlements };
    }

    const [[settle]] = await conn.query(
      `SELECT * FROM settlement WHERE groupId = ? AND status = 'active' ORDER BY createdAt DESC LIMIT 1`,
      [groupId]
    );

    return settle
      ? { type: "individual", settlement: settle }
      : { type: null, message: "No settlements found" };
  } finally {
    conn.release();
  }
}
async function getGroupSummary(groupId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `
      SELECT 
        du1.userId AS debtorId,
        du1.fullName AS debtorName,
        du2.userId AS creditorId,
        du2.fullName AS creditorName,
        SUM(ep.balance) AS amountOwed
      FROM expenseUser ep
      JOIN expense e ON ep.expenseId = e.expenseId
      JOIN user du1 ON ep.userId = du1.userId
      JOIN user du2 ON e.paidBy = du2.userId
      WHERE e.groupId = ?
        AND ep.userId != e.paidBy
        AND ep.balance > 0
      GROUP BY du1.userId, du2.userId
      ORDER BY du1.fullName ASC, du2.fullName ASC
      `,
      [groupId]
    );

    if (!rows.length) {
      return { message: "No debts — everyone is settled!", debts: [], summary: [] };
    }

    // Build total owed/received summary
    const summaryMap = {};

    for (const r of rows) {
      const amt = parseFloat(r.amountOwed);

      // Debtor (owes money)
      if (!summaryMap[r.debtorId])
        summaryMap[r.debtorId] = { userId: r.debtorId, name: r.debtorName, owes: 0, gets: 0 };
      summaryMap[r.debtorId].owes += amt;

      // Creditor (gets money)
      if (!summaryMap[r.creditorId])
        summaryMap[r.creditorId] = { userId: r.creditorId, name: r.creditorName, owes: 0, gets: 0 };
      summaryMap[r.creditorId].gets += amt;
    }

    const summary = Object.values(summaryMap);

    return {
      message: "Group summary generated successfully",
      debts: rows.map(r => ({
        fromUserId: r.debtorId,
        fromUser: r.debtorName,
        toUserId: r.creditorId,
        toUser: r.creditorName,
        amount: parseFloat(r.amountOwed),
      })),
      summary,
    };
  } catch (err) {
    console.error("[getGroupSummary] Error:", err.message);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  settle,
  settleUpGroup,
  getGroupDebts,
  undoLastSettlement,
  getLastSettlement,
  getGroupSummary,
};
