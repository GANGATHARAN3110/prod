const express = require("express");
const {
  inviteMemberController,
  respondToInviteController,
  removegroupuserController,
  updateMemberController,
  getgroupusersController,
  getMyInvites,
} = require("../controllers/groupuserController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: groupusers
 *   description: Manage group members (invite, respond, update, remove, list)
 */

/**
 * @swagger
 * /api/group-members/invite:
 *   post:
 *     summary: Invite a user to join a group
 *     tags: [groupusers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - invitedEmail
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "uuid-of-group"
 *               invitedEmail:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       201:
 *         description: Member invited
 */
router.post("/invite", inviteMemberController);

/**
 * @swagger
 * /api/group-members/respond:
 *   post:
 *     summary: Respond to a group invitation (accept/reject)
 *     tags: [groupusers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupuserId
 *               - status
 *             properties:
 *               groupuserId:
 *                 type: string
 *                 example: "uuid-of-member"
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Invitation response updated
 */
router.post("/respond", respondToInviteController);

/**
 * @swagger
 * /api/group-members/remove:
 *   delete:
 *     summary: Remove a group member (admin only)
 *     tags: [groupusers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupuserId
 *             properties:
 *               groupuserId:
 *                 type: string
 *                 example: "uuid-of-member"
 *     responses:
 *       200:
 *         description: Member removed successfully
 */

router.delete("/remove/:groupuserId", removegroupuserController)


/**
 * @swagger
 * /api/group-members/update:
 *   put:
 *     summary: Update a member's role or status (admin only)
 *     tags: [groupusers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupuserId
 *             properties:
 *               groupuserId:
 *                 type: string
 *                 example: "uuid-of-member"
 *               role:
 *                 type: string
 *                 enum: [user, editor, admin]
 *                 example: "editor"
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *                 example: "accepted"
 *     responses:
 *       200:
 *         description: Member updated successfully
 */
router.put("/update", updateMemberController);

/**
 * @swagger
 * /api/group-members/my-invites:
 *   get:
 *     summary: Get all invitations for the logged-in user
 *     tags: [groupusers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invitations for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupuserId:
 *                         type: string
 *                         example: "uuid-of-invite"
 *                       groupId:
 *                         type: string
 *                         example: "uuid-of-group"
 *                       groupName:
 *                         type: string
 *                         example: "Travel Buddies"
 *                       invitedEmail:
 *                         type: string
 *                         example: "user@example.com"
 *                       invitedBy:
 *                         type: string
 *                         example: "admin@example.com"
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-11T18:30:00.000Z"
 */
router.get("/my-invites", getMyInvites);

/**
 * @swagger
 * /api/group-members/{groupId}:
 *   get:
 *     summary: Get members of a group (with pagination & search)
 *     tags: [groupusers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the group
 *         example: "uuid-of-group"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
 *         description: Search by username or invited email
 *     responses:
 *       200:
 *         description: List of group members
 */
router.get("/:groupId", getgroupusersController);

module.exports = router;
