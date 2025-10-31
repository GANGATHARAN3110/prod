const pool = require("../config/db")

// 🔹 Safe JSON parser (handles null, stringified, and double-stringified JSON)
const safeParse = (value) => {
  if (!value) return {}
  try {
    let parsed = typeof value === "string" ? JSON.parse(value) : value
    if (typeof parsed === "string") parsed = JSON.parse(parsed)
    return parsed
  } catch (e) {
    console.warn("⚠️ Invalid JSON:", value)
    return {}
  }
}

// 🔹 Helper to get user names by IDs
async function getUserNamesByIds(ids = []) {
  if (ids.length === 0) return {}
  const [rows] = await pool.query(
    `SELECT userId, CONCAT(firstName, ' ', lastName) AS fullName FROM user WHERE userId IN (?)`,
    [ids]
  )
  const map = {}
  rows.forEach((r) => (map[r.userId] = r.fullName))
  return map
}

async function getActivitiesByGroupId(groupId) {
  const [rows] = await pool.query(
    `
    SELECT 
      a.activityId,
      a.tableName,
      a.type,
      a.userId,
      u.firstName,
      u.lastName,
      a.entityId,
      a.oldJson,
      a.newJson,
      a.createdAt,
      a.ipAddress
    FROM activity a
    JOIN user u ON a.userId = u.userId
    WHERE 
      (a.tableName = 'groupList' AND a.entityId = ?)
      OR
      (a.tableName = 'expense' AND JSON_EXTRACT(a.newJson, '$.groupId') = ?)
      OR
      (a.tableName = 'settlement' AND JSON_EXTRACT(a.newJson, '$.groupId') = ?)
    ORDER BY a.createdAt DESC
    `,
    [groupId, groupId, groupId]
  )

  // Collect all user IDs that appear in settlements to resolve later
  const allUserIds = new Set()

  const preProcessed = rows.map((row) => {
    const newData = safeParse(row.newJson)
    const oldData = safeParse(row.oldJson)
    const activity = {
      activityId: row.activityId,
      tableName: row.tableName,
      type: row.type,
      userId: row.userId,
      userName: `${row.firstName || ""} ${row.lastName || ""}`.trim() || "Unknown",
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
      details: {},
    }

    if (row.tableName === "expense") {
      activity.details = {
        title: newData.title || oldData.title || "Unnamed Expense",
        amount: newData.amount || oldData.amount || 0,
        expenseType: newData.expenseType || "other",
      }
    } else if (row.tableName === "settlement") {
      const s =
        newData.appliedSettlements && newData.appliedSettlements.length > 0
          ? newData.appliedSettlements[0]
          : {}

      if (s.fromUser) allUserIds.add(s.fromUser)
      if (s.toUser) allUserIds.add(s.toUser)

      activity.details = {
        fromUser: s.fromUser || oldData.fromUser || null,
        toUser: s.toUser || oldData.toUser || null,
        amount: s.amount || oldData.amount || 0,
        status: newData.status || "completed",
      }
    } else if (row.tableName === "groupList") {
      activity.details = {
        name: newData.name || oldData.name || "Group Updated",
        type: newData.type || "other",
      }
    }

    return activity
  })

  // 🔹 Resolve all user IDs into names
  const userMap = await getUserNamesByIds([...allUserIds])

  // Replace IDs with names in settlements
  const activities = preProcessed.map((a) => {
    if (a.tableName === "settlement" && a.details) {
      a.details.fromUserName = userMap[a.details.fromUser] || a.details.fromUser
      a.details.toUserName = userMap[a.details.toUser] || a.details.toUser
    }
    return a
  })

  return activities
}

module.exports = { getActivitiesByGroupId }
