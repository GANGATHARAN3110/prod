const pool = require("../config/db");
const { uuidv7 } = require("uuidv7");

/**
 * Log user activity
 */
async function logActivity({ entityId, tableName, userId, type, oldData = null, newData = null, req = null }) {
  const ipAddress = (() => {
    if (!req) return null;
    let ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || req.ip || null;
    if (!ip) return null;
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    if (ip === "::1") ip = "127.0.0.1";
    return ip;
  })();

  await pool.query(
    `
      INSERT INTO activity (
        activityId,
        entityId,
        tableName,
        userId,
        ipAddress,
        type,
        oldJson,
        newJson,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      uuidv7(),
      entityId,
      tableName,
      userId,
      ipAddress,
      type,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
    ]
  );
}

/**
 * Create group
 */
async function createGroup({ groupName, type, userId, startDate = null, endDate = null }) {
  const connection = await pool.getConnection();
  const groupId = uuidv7();

  try {
    await connection.beginTransaction();

    // Ensure only date part is stored (YYYY-MM-DD)
    const dbStartDate = startDate ? startDate.split('T')[0] : null;
    const dbEndDate = endDate ? endDate.split('T')[0] : null;

    // Check duplicate group name
    const [duplicate] = await connection.query(
      `SELECT groupId FROM groupList WHERE name = ? AND createdBy = ?`,
      [groupName, userId]
    );
    if (duplicate.length) throw new Error("You already have a group with this name");

    // Insert group
    await connection.query(
      `INSERT INTO groupList (groupId, name, type, startDate, endDate, createdBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [groupId, groupName, type, dbStartDate, dbEndDate, userId]
    );

    // Add creator as admin in groupUser
    await connection.query(
      `INSERT INTO groupUser (groupUserId, groupId, userId, invitedEmail, invitedBy, status, role, joinedAt)
       VALUES (?, ?, ?, NULL, ?, 'accepted', 'admin', NOW())`,
      [uuidv7(), groupId, userId, userId]
    );

    await connection.commit();

    return {
      groupId,
      groupName,
      type,
      startDate: dbStartDate,
      endDate: dbEndDate,
      createdBy: userId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
/**
 * Update group by ID
 */
async function updateGroupById(groupId, newName, newType, startDate, endDate, userId) {
  const [existing] = await pool.query(
    `SELECT * FROM groupList WHERE groupId = ? AND createdBy = ?`,
    [groupId, userId]
  );
  if (!existing[0]) throw new Error("Not authorized or group not found");

  const oldData = existing[0];

  if (newName && newName !== oldData.name) {
    const [dup] = await pool.query(
      `SELECT groupId FROM groupList WHERE name = ? AND createdBy = ? AND groupId != ?`,
      [newName, userId, groupId]
    );
    if (dup.length) throw new Error("You already have a group with this name");
  }

  // Only store date part
  const dbStartDate = startDate ? startDate.split('T')[0] : null;
  const dbEndDate = endDate ? endDate.split('T')[0] : null;

  await pool.query(
    `UPDATE groupList
     SET name = IFNULL(?, name),
         type = IFNULL(?, type),
         startDate = ?,
         endDate = ?
     WHERE groupId = ?`,
    [newName, newType, dbStartDate, dbEndDate, groupId]
  );

  const [updated] = await pool.query(`SELECT * FROM groupList WHERE groupId = ?`, [groupId]);
  return { oldData, newData: updated[0] };
}
/**
 * Get groups by user with pagination & search (including totalExpense)
 */
async function getGroupsByUser(userId, page = 1, search = "") {
  const limit = 5;
  const offset = (page - 1) * limit;

  let baseQuery = `
    SELECT 
      g.groupId,
      g.name AS groupName,
      g.type,
      g.startDate,
      g.endDate,
      g.createdAt,
      g.createdBy,
      u.email AS createdByEmail,
      u.firstName AS createdByFirstName,
      u.lastName AS createdByLastName,
      COALESCE(SUM(e.amount), 0) AS totalExpense
    FROM groupList g
    JOIN groupUser gm ON g.groupId = gm.groupId
    JOIN user u ON g.createdBy = u.userId
    LEFT JOIN expense e ON g.groupId = e.groupId
    WHERE gm.userId = ?
  `;
  const params = [userId];

  if (search.trim()) {
    baseQuery += " AND g.name LIKE ?";
    params.push(`%${search}%`);
  }

  baseQuery += " GROUP BY g.groupId ORDER BY g.createdAt DESC LIMIT ? OFFSET ?";
  const [rows] = await pool.query(baseQuery, [...params, limit, offset]);

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM groupList g
     JOIN groupUser gm ON g.groupId = gm.groupId
     WHERE gm.userId = ?
     ${search.trim() ? "AND g.name LIKE ?" : ""}`,
    params
  );

  const total = countRows[0].total;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    totalPages,
    currentPage: page,
    pageSize: limit,
    groups: rows.map((r) => ({
      groupId: r.groupId,
      groupName: r.groupName,
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      createdBy: r.createdBy,
      createdByEmail: r.createdByEmail,
      createdByFirstName: r.createdByFirstName,
      createdByLastName: r.createdByLastName,
      createdAt: r.createdAt,
      totalExpense: r.totalExpense,
    })),
  };
}

/**
 * Get single group by ID
 */
async function getGroupById(groupId, userId) {
  const [membership] = await pool.query(
    `SELECT 1 FROM groupUser WHERE groupId = ? AND userId = ? AND status = 'accepted'`,
    [groupId, userId]
  );
  if (!membership.length) return null;

  const [rows] = await pool.query(
    `SELECT 
       g.groupId,
       g.name AS groupName,
       g.type,
       g.startDate,
       g.endDate,
       g.createdAt,
       g.createdBy,
       u.email AS createdByEmail,
       u.firstName AS createdByFirstName,
       u.lastName AS createdByLastName,
       COALESCE(SUM(e.amount),0) AS totalExpense
     FROM groupList g
     JOIN user u ON g.createdBy = u.userId
     LEFT JOIN expense e ON g.groupId = e.groupId
     WHERE g.groupId = ?
     GROUP BY g.groupId`,
    [groupId]
  );

  return rows[0] || null;
}

/**
 * Delete group by ID (creator only)
 */
async function deleteGroupById(groupId, userId) {
  const [existing] = await pool.query(
    `SELECT * FROM groupList WHERE groupId = ? AND createdBy = ?`,
    [groupId, userId]
  );
  if (!existing[0]) throw new Error("Not authorized or group not found");

  await pool.query(`DELETE FROM groupList WHERE groupId = ?`, [groupId]);
  return existing[0];
}

/**
 * Check if user is in group
 */
async function isUserInGroup(groupId, userId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM groupUser WHERE groupId = ? AND userId = ? AND status = 'accepted'`,
    [groupId, userId]
  );
  return rows.length > 0;
}

module.exports = {
  createGroup,
  updateGroupById,
  getGroupsByUser,
  getGroupById,
  deleteGroupById,
  logActivity,
  isUserInGroup,
};
