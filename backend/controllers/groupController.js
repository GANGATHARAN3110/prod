const {
  createGroup,
  getGroupsByUser,
  getGroupById,
  updateGroupById,
  deleteGroupById,
  isUserInGroup,
  logActivity,
} = require("../services/groupService");

const logger = require("../utils/logger");

// ============================================================
// 🟢 CREATE GROUP
// ============================================================
async function create(req, res) {
  try {
    const { groupName, type = "other", startDate, endDate } = req.body;
    const userId = req.user.userId;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Validate dates: optional but if both provided, endDate >= startDate
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date cannot be before Start date" });
    }

    const group = await createGroup({
      groupName,
      type,
      userId,
      startDate,
      endDate,
    });

    await logActivity({
      entityId: group.groupId,
      tableName: "groupList",
      userId,
      type: "created",
      newData: group,
      req,
    });

    logger.info({ userId, groupId: group.groupId, ip: req.ip }, "✅ Group created");

    return res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack, user: req.user },
      "❌ Failed to create group"
    );
    return res.status(500).json({ message: "Failed to create group", error: err.message });
  }
}

// ============================================================
// 🟢 UPDATE GROUP
// ============================================================
async function updateById(req, res) {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const { newName, newType, startDate, endDate } = req.body;

    if (!newName && !newType && !startDate && !endDate) {
      return res.status(400).json({ message: "At least one field (name, type, startDate, endDate) is required" });
    }

    // Validate dates
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: "End date cannot be before Start date" });
    }

    const { oldData, newData } = await updateGroupById(
      groupId,
      newName,
      newType,
      startDate,
      endDate,
      userId
    );

    await logActivity({
      entityId: groupId,
      tableName: "groupList",
      userId,
      type: "updated",
      oldData,
      newData,
      req,
    });

    logger.info({ userId, groupId, ip: req.ip }, "✏️ Group updated successfully");

    return res.status(200).json({
      message: "Group updated successfully",
      group: newData,
    });
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack, user: req.user },
      "❌ Failed to update group"
    );
    return res.status(500).json({ message: "Failed to update group", error: err.message });
  }
}

// ============================================================
// 🟢 GET ALL GROUPS FOR A USER
// ============================================================
async function getAll(req, res) {
  try {
    const userId = req.user.userId;
    const { page = 1, search = "" } = req.query;

    const result = await getGroupsByUser(userId, parseInt(page), search);

    logger.info({ userId, page, search }, "📂 Groups fetched successfully");
    return res.status(200).json(result);
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack, user: req.user },
      "❌ Failed to fetch groups"
    );
    return res.status(500).json({ message: "Failed to fetch groups", error: err.message });
  }
}

// ============================================================
// 🟢 GET GROUP BY ID
// ============================================================
async function getById(req, res) {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    const inGroup = await isUserInGroup(groupId, userId);
    if (!inGroup) {
      return res.status(403).json({ message: "Access denied: You are not a member of this group" });
    }

    const group = await getGroupById(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    logger.info({ userId, groupId, ip: req.ip }, "📄 Group details fetched");
    return res.status(200).json({ group });
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack, user: req.user },
      "❌ Failed to get group by ID"
    );
    return res.status(500).json({ message: "Failed to fetch group", error: err.message });
  }
}

// ============================================================
// 🟢 DELETE GROUP
// ============================================================
async function deleteById(req, res) {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    const oldData = await deleteGroupById(groupId, userId);

    await logActivity({
      entityId: groupId,
      tableName: "groupList",
      userId,
      type: "deleted",
      oldData,
      req,
    });

    logger.info({ userId, groupId, ip: req.ip }, "🗑️ Group deleted");

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (err) {
    logger.error(
      { error: err.message, stack: err.stack, user: req.user },
      "❌ Failed to delete group"
    );
    return res.status(500).json({ message: "Failed to delete group", error: err.message });
  }
}

module.exports = {
  create,
  updateById,
  getAll,
  getById,
  deleteById,
};
