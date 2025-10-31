// const express = require("express");
// const { authenticateToken } = require("../middlewares/authMiddleware");
// const { getUserBalanceController } = require("../controllers/balanceController");

// const router = express.Router();
// router.use(authenticateToken);

// /**
//  * @swagger
//  * tags:
//  *   name: Balance
//  *   description: API for checking user balances
//  */

// /**
//  * @swagger
//  * /api/balance/user/{user_id}:
//  *   get:
//  *     summary: Get net balance for a user
//  *     description: >
//  *       Returns the net balance of a user across all settlements.  
//  *       A **positive balance** means the user should receive money,  
//  *       a **negative balance** means the user owes money,  
//  *       and **0** means no pending settlements.
//  *     tags: [Balance]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: user_id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: The ID of the user whose balance is being requested
//  *     responses:
//  *       200:
//  *         description: Net balance of the user
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 user_id:
//  *                   type: integer
//  *                   example: 2
//  *                 balance:
//  *                   type: number
//  *                   format: float
//  *                   example: -350.50
//  *       400:
//  *         description: Invalid request or error occurred
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to fetch balance
//  *       401:
//  *         description: Unauthorized (missing or invalid JWT token)
//  */
// router.get("/user/:user_id", getUserBalanceController);


