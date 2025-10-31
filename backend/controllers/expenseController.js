const {
  addExpense,
  updateExpense,
  deleteExpense,
  getExpensesByGroupId,
  getExpenseUsers,
  getGroupExpenseSummary,
  logActivity,

} = require("../services/expenseService");

const db = require("../config/db");

// ============================================================
// 🧾 ADD EXPENSE
// ============================================================
async function addExpenseController(req, res) {
  try {
    const {
      groupId,
      title,
      description,
      amount,
      expenseType,
      paidBy,
      splitType,
      splitDetails,
      expenseDate,
    } = req.body;

    if (!groupId || !title || !amount || !paidBy || !expenseDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    const expense = await addExpense({
      groupId,
      title,
      description: description || null,
      amount: numericAmount,
      expenseType: expenseType || "other",
      paidBy,
      splitType,
      splitDetails,
      expenseDate,
    });

    console.log("[addExpenseController] ✅ Expense added successfully:", expense.expenseId);

    // 🟢 Log activity
    await logActivity({
      entityId: expense.expenseId,
      tableName: "expense",
      userId: paidBy, // or req.user.userId if JWT auth is used
      type: "created",
      newJson: expense,
      ipAddress: req.ip || null,
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("[addExpenseController] ❌ Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

// ============================================================
// ✏️ UPDATE EXPENSE
// ============================================================
async function updateExpenseController(req, res) {
  try {
    const { expenseId } = req.params;
    const {
      title,
      description,
      amount,
      expenseType,
      paidBy,
      splitType,
      splitDetails,
      expenseDate,
    } = req.body;

    if (!expenseId) {
      return res.status(400).json({ error: "Expense ID is required" });
    }

    if (!title || !amount || !paidBy || !expenseDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    // 🔹 Fetch old record before update
    const oldExpense = await getExpenseUsers(expenseId);

    const expense = await updateExpense({
      expenseId,
      title,
      description: description || null,
      amount: numericAmount,
      expenseType: expenseType || "other",
      paidBy,
      splitType,
      splitDetails,
      expenseDate,
    });

    console.log("[updateExpenseController] ✅ Expense updated:", expense.expenseId);

    // 🟡 Log activity
    await logActivity({
      entityId: expense.expenseId,
      tableName: "expense",
      userId: paidBy,
      type: "updated",
      oldJson: oldExpense,
      newJson: expense,
      ipAddress: req.ip || null,
    });

    res.status(200).json(expense);
  } catch (err) {
    console.error("[updateExpenseController] ❌ Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

// ============================================================
// ❌ DELETE EXPENSE
// ============================================================
async function deleteExpenseController(req, res) {
  try {
    const { expenseId } = req.params;
    if (!expenseId) return res.status(400).json({ error: "Expense ID required" });

    // 🔹 Fetch old record before delete
    const oldExpense = await getExpenseUsers(expenseId);

    const result = await deleteExpense(expenseId);
    console.log("[deleteExpenseController] ✅ Expense deleted:", expenseId);

    // 🔴 Log activity
    await logActivity({
      entityId: expenseId,
      tableName: "expense",
      userId: req.user?.userId || oldExpense?.paidBy || null,
      type: "deleted",
      oldJson: oldExpense,
      ipAddress: req.ip || null,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("[deleteExpenseController] ❌ Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

// ============================================================
// 📜 GET EXPENSES BY GROUP
// ============================================================
async function getExpensesByGroupController(req, res) {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? req.query.search.trim() : "";

    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required" });
    }

    const data = await getExpensesByGroupId(groupId, page, limit, search);
    console.log(
      `[getExpensesByGroupController] ✅ ${data.expenses.length} expenses fetched for groupId ${groupId}`
    );
    res.status(200).json(data);
  } catch (err) {
    console.error("[getExpensesByGroupController] ❌ Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

// ============================================================
// 📊 GET EXPENSE BY ID (with splits)
// ============================================================
async function getExpenseByIdController(req, res) {
  try {
    const { expenseId } = req.params;
    if (!expenseId) return res.status(400).json({ error: "Expense ID is required" });

    const expense = await getExpenseUsers(expenseId);
    res.status(200).json(expense);
  } catch (err) {
    console.error("[getExpenseByIdController] ❌ Error:", err.message);
    res.status(404).json({ error: err.message });
  }
}

// ============================================================
// 📈 GET GROUP EXPENSE SUMMARY
// ============================================================
async function getGroupExpenseSummaryController(req, res) {
  try {
    const { groupId } = req.params;
    if (!groupId) return res.status(400).json({ error: "Group ID is required" });

    const summary = await getGroupExpenseSummary(groupId);
    res.status(200).json(summary);
  } catch (err) {
    console.error("[getGroupExpenseSummaryController] ❌ Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  addExpenseController,
  updateExpenseController,
  deleteExpenseController,
  getExpensesByGroupController,
  getExpenseByIdController,
  getGroupExpenseSummaryController,
};
