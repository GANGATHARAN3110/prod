const express = require("express");

// Import route modules
const authRoutes = require("./authRoutes");
const groupRoutes = require("./groupRoutes");
const groupuserRoutes = require("./groupuserRoutes");
const expenseRoutes = require("./expenseRoutes");
// const settlementRoutes = require("./settlementRoutes");
const activityRoutes = require("./activityRoutes");
// const balanceRoutes = require("./balanceRoutes");
const settleupRoutes = require("./settleupRoutes");

// Auth middleware
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.use("/auth", authRoutes);

// Protected routes (requires authentication)
router.use("/group", authenticateToken, groupRoutes);
router.use("/group-members", authenticateToken, groupuserRoutes);
router.use("/expenses", authenticateToken, expenseRoutes);
// router.use("/settlements", authenticateToken, settlementRoutes);
router.use("/activities",  activityRoutes);
// router.use("/balance", authenticateToken, balanceRoutes);
router.use("/settleup", authenticateToken, settleupRoutes);

module.exports = router;
