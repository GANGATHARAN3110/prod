const express = require("express");
const router = express.Router();
const {
  create,
  getAll,
  getById,
  updateById,
  deleteById,
} = require("../controllers/groupController");

/**
 * @swagger
 * /api/group:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Create a new group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *             properties:
 *               groupName:
 *                 type: string
 *                 example: "Trip Expenses"
 *               type:
 *                 type: string
 *                 example: "travel"
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group created successfully"
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Bad request
 */
router.post("/", create);

/**
 * @swagger
 * /api/group:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get all groups for the logged-in user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           default: ""
 *     responses:
 *       200:
 *         description: Paginated list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 */
router.get("/", getAll);

/**
 * @swagger
 * /api/group/{groupId}:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get a group by ID (must be a member)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/GroupDetails'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Group not found
 */
router.get("/:groupId", getById);

/**
 * @swagger
 * /api/group/{groupId}:
 *   put:
 *     tags:
 *       - Groups
 *     summary: Update a group (only creator)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *               newType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *       403:
 *         description: Access denied
 */
router.put("/:groupId", updateById);

/**
 * @swagger
 * /api/group/{groupId}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Delete a group (only creator)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 */
router.delete("/:groupId", deleteById);

module.exports = router;
