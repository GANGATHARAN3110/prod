const express = require("express");
const { listActivitiesByGroup } = require("../controllers/activityController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/activities/group/{group_id}:
 *   get:
 *     summary: Get activity logs for a specific group
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Group ID
 *     responses:
 *       200:
 *         description: Returns all activities for a group
 */
router.get("/group/:group_id", listActivitiesByGroup);

module.exports = router;
