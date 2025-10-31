// const express = require("express");
// const { authenticateToken } = require("../middlewares/authMiddleware");
// const {  listSettlements,listUserNetSettlements } = require("../controllers/settlementController");

// const router = express.Router();

// // JWT protected routes
// router.use(authenticateToken);

// /**
//  * @swagger
//  * tags:
//  *   name: Settlements
//  *   description: Manage settlements between group members
//  */

// /**
//  * @swagger
//  * /api/settlements/group/{group_id}:
//  *   get:
//  *     summary: Get all settlements for a group
//  *     tags: [Settlements]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: group_id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: List of settlements
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   settlement_id:
//  *                     type: integer
//  *                     example: 10
//  *                   from_user:
//  *                     type: integer
//  *                     example: 2
//  *                   from_user_name:
//  *                     type: string
//  *                     example: Alice
//  *                   to_user:
//  *                     type: integer
//  *                     example: 3
//  *                   to_user_name:
//  *                     type: string
//  *                     example: Bob
//  *                   amount:
//  *                     type: number
//  *                     example: 500
//  *                   created_at:
//  *                     type: string
//  *                     format: date-time
//  *                     example: 2025-09-18T12:45:30Z
//  */
// router.get("/group/:group_id", listSettlements);


// /**
//  * @swagger
//  * /api/settlements/user/{user_id}/net:
//  *   get:
//  *     summary: Get net settlements for a user (total per user pair)
//  *     tags: [Settlements]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: user_id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Net settlements for a user
//  */
// router.get("/user/:user_id/net", listUserNetSettlements);
