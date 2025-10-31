const { getActivitiesByGroupId } = require("../services/activityService");
const logger = require("../utils/logger");

async function listActivitiesByGroup(req, res) {
  try {
    const { group_id } = req.params;

    if (!group_id) {
      return res.status(400).json({ message: "group_id is required" });
    }

    const activities = await getActivitiesByGroupId(group_id);

    logger.info(
      { group_id, count: activities.length },
      "Fetched group activity logs"
    );

    res.status(200).json({ activities });
  } catch (err) {
    logger.error(err, "Failed to fetch group activities");
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listActivitiesByGroup };
