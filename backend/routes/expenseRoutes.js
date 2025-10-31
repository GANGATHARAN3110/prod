const express = require("express");
const {
  addExpenseController,
  getExpensesByGroupController,
  updateExpenseController,
  deleteExpenseController,
  getExpenseByIdController,
  getGroupExpenseSummaryController,
} = require("../controllers/expenseController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management
 */

// ============================================================
// 🧾 ADD EXPENSE
// ============================================================
/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Add a new expense
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - title
 *               - amount
 *               - paidBy
 *               - expenseDate
 *             properties:
 *               groupId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               expenseType:
 *                 type: string
 *                 example: "food"
 *               paidBy:
 *                 type: string
 *                 format: uuid
 *               splitType:
 *                 type: string
 *                 enum: [equal, exact, percentage]
 *               splitDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     share:
 *                       type: number
 *               expenseDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-25"
 *     responses:
 *       201:
 *         description: Expense created successfully
 */
router.post("/", addExpenseController);

// ============================================================
// 📜 GET EXPENSES BY GROUP
// ============================================================
/**
 * @swagger
 * /api/expenses/group/{groupId}:
 *   get:
 *     summary: Get all expenses for a group
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Group ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword (optional)
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get("/group/:groupId", getExpensesByGroupController);

// ============================================================
// 📈 GROUP EXPENSE SUMMARY
// ============================================================
/**
 * @swagger
 * /api/expenses/summary/group/{groupId}:
 *   get:
 *     summary: Get group expense summary
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group expense summary
 */
router.get("/summary/group/:groupId", getGroupExpenseSummaryController);

// ============================================================
// 📊 GET EXPENSE BY ID
// ============================================================
/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   get:
 *     summary: Get a specific expense with split details
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense details fetched successfully
 */
router.get("/:expenseId", getExpenseByIdController);

// ============================================================
// ✏️ UPDATE EXPENSE
// ============================================================
/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   put:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - paidBy
 *               - expenseDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               expenseType:
 *                 type: string
 *               paidBy:
 *                 type: string
 *                 format: uuid
 *               splitType:
 *                 type: string
 *                 enum: [equal, exact, percentage]
 *               splitDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                     share:
 *                       type: number
 *               expenseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Expense updated successfully
 */
router.put("/:expenseId", updateExpenseController);

// ============================================================
// ❌ DELETE EXPENSE
// ============================================================
/**
 * @swagger
 * /api/expenses/{expenseId}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 */
router.delete("/:expenseId", deleteExpenseController);

module.exports = router;
