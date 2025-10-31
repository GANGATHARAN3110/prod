const pool = require("../config/db");
const { uuidv7 } = require("uuidv7");
const { sendMail } = require("../utils/mailer");

/**
 * Add / invite a member to a group
 */
async function addgroupuser(groupId, invitedEmail, invitedBy) {
  // Fetch group creator
  const [groupRows] = await pool.query(
    "SELECT createdBy FROM groupList WHERE groupId = ?",
    [groupId]
  );
  if (!groupRows[0]) throw new Error("Group not found");

  const groupCreatorId = groupRows[0].createdBy;

  // Prevent adding creator
  const [creatorRows] = await pool.query(
    "SELECT email FROM user WHERE userId = ?",
    [groupCreatorId]
  );
  if (creatorRows[0] && creatorRows[0].email === invitedEmail) {
    throw new Error("Group creator cannot be added as a user");
  }

  // Check if already invited
  const [existing] = await pool.query(
    "SELECT * FROM groupUser WHERE groupId = ? AND invitedEmail = ?",
    [groupId, invitedEmail]
  );
  if (existing.length > 0) throw new Error("User already invited");

  // Check if invited user exists
  const [userRows] = await pool.query(
    "SELECT userId, firstName, lastName FROM user WHERE email = ?",
    [invitedEmail]
  );

  let userId = null;
  let firstName = null;
  let lastName = null;
  let password = null;

  if (userRows.length > 0) {
    // Existing user
    userId = userRows[0].userId;
    firstName = userRows[0].firstName;
    lastName = userRows[0].lastName;
  } else {
    // Auto-create user profile
    const namePart = invitedEmail.split("@")[0];
    const nameSplit = namePart.split(".");
    firstName = nameSplit[0] || namePart;
    lastName = nameSplit[1] || "";
    password = `${namePart}1234`;
    userId = uuidv7();

    await pool.query(
      `INSERT INTO user (userId, firstName, lastName, email, password, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, firstName, lastName, invitedEmail, password]
    );
  }

  const groupUserId = uuidv7();

  await pool.query(
    `INSERT INTO groupUser 
      (groupUserId, groupId, invitedEmail, invitedBy, userId, status, role, invitedAt)
      VALUES (?, ?, ?, ?, ?, 'pending', 'user', NOW())`,
    [groupUserId, groupId, invitedEmail, invitedBy, userId]
  );

  // Send invite email
  const emailBody = `
    <h3>Hi ${firstName} ${lastName || ""},</h3>
    <p>You have been invited to join a group.</p>
    <p><strong>Email:</strong> ${invitedEmail}</p>
    ${password ? `<p><strong>Password:</strong> ${password}</p>` : ""}
    <p>Please login to your account to accept the invitation.</p>
    <p>Welcome aboard! 🎉</p>
  `;

  try {
    await sendMail(invitedEmail, "Group Invitation 🎉", emailBody);
  } catch (err) {
    console.error("Failed to send invite email:", err.message);
  }

  return {
    groupUserId,
    groupId,
    invitedEmail,
    invitedBy,
    userId,
    role: "user",
    status: "pending",
    invitedAt: new Date(),
    firstName,
    lastName,
    password // only for new users
  };
}

/**
 * Respond to invite
 */
async function respondToInvite(groupUserId, status) {
  if (!["accepted", "rejected"].includes(status)) throw new Error("Invalid status");

  const [rows] = await pool.query(
    "SELECT groupUserId, userId, invitedEmail FROM groupUser WHERE groupUserId = ?",
    [groupUserId]
  );
  if (!rows[0]) throw new Error("Invitation not found");

  let { userId, invitedEmail } = rows[0];

  if (!userId) {
    const [userRows] = await pool.query(
      "SELECT userId FROM user WHERE email = ?",
      [invitedEmail]
    );
    if (userRows.length > 0) {
      userId = userRows[0].userId;
      await pool.query(
        "UPDATE groupUser SET userId = ? WHERE groupUserId = ?",
        [userId, groupUserId]
      );
    }
  }

  await pool.query(
    "UPDATE groupUser SET status = ?, joinedAt = IF(?='accepted', NOW(), NULL) WHERE groupUserId = ?",
    [status, status, groupUserId]
  );

  return { groupUserId, status, userId };
}

/**
 * Remove group member
 */
async function removegroupuser(groupUserId, requesterId) {
  const [rows] = await pool.query(
    `SELECT g.createdBy 
     FROM groupUser gu 
     JOIN groupList g ON gu.groupId = g.groupId 
     WHERE gu.groupUserId = ?`,
    [groupUserId]
  );
  if (!rows[0]) throw new Error("Member not found");
  if (rows[0].createdBy !== requesterId) throw new Error("Only group creator can remove member");

  await pool.query("DELETE FROM groupUser WHERE groupUserId = ?", [groupUserId]);
  return { message: "Member removed successfully", groupUserId };
}

/**
 * Update member role/status
 */
async function updateMember(groupUserId, role, status, requesterId) {
  const [rows] = await pool.query(
    `SELECT g.createdBy 
     FROM groupUser gu 
     JOIN groupList g ON gu.groupId = g.groupId 
     WHERE gu.groupUserId = ?`,
    [groupUserId]
  );
  if (!rows[0]) throw new Error("Member not found");
  if (rows[0].createdBy !== requesterId) throw new Error("Not authorized");

  await pool.query(
    "UPDATE groupUser SET role = IFNULL(?, role), status = IFNULL(?, status) WHERE groupUserId = ?",
    [role, status, groupUserId]
  );

  return { groupUserId, role, status };
}

/**
 * Get group members
 */
async function getgroupusers(groupId, page = 1, search = "") {
  const limit = 10;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT 
      gu.groupUserId,
      gu.groupId,
      gu.userId,
      gu.invitedEmail,
      gu.status,
      gu.role,
      gu.invitedAt,
      gu.joinedAt,
      u.firstName,
      u.lastName,
      u.email AS userEmail,
      g.createdBy
    FROM groupUser gu
    LEFT JOIN user u ON gu.userId = u.userId
    JOIN groupList g ON gu.groupId = g.groupId
    WHERE gu.groupId = ?
      AND (u.firstName LIKE ? OR u.lastName LIKE ? OR gu.invitedEmail LIKE ?)
    ORDER BY gu.invitedAt DESC
    LIMIT ? OFFSET ?
  `;
  const searchTerm = `%${search}%`;
  const [rows] = await pool.query(sql, [
    groupId,
    searchTerm,
    searchTerm,
    searchTerm,
    limit,
    offset,
  ]);

  return rows.map((m) => ({
    groupUserId: m.groupUserId,
    groupId: m.groupId,
    userId: m.userId,
    role: m.role,
    status: m.status,
    email: m.userEmail || m.invitedEmail,
    firstName: m.firstName,
    lastName: m.lastName,
    username: m.firstName && m.lastName
      ? `${m.firstName} ${m.lastName}`
      : m.userEmail || m.invitedEmail,
    invitedAt: m.invitedAt,
    joinedAt: m.joinedAt,
    isCreator: m.userId === m.createdBy
  }));
}

/**
 * Get my invites
 */
/**
 * Get my invites (with invited userId)
 */
async function getInvitesForUser(userId, email) {
  const [rows] = await pool.query(
    `SELECT 
        gu.groupUserId,
        gu.groupId,
        gu.userId AS invitedUserId,   -- 🟢 Added: invited user's ID
        g.name AS groupName,
        gu.invitedEmail,
        gu.status,
        gu.invitedBy,
        u.email AS invitedByEmail,
        gu.invitedAt,
        gu.joinedAt
     FROM groupUser gu
     LEFT JOIN groupList g ON gu.groupId = g.groupId
     LEFT JOIN user u ON gu.invitedBy = u.userId
     WHERE gu.userId = ? OR gu.invitedEmail = ?
     ORDER BY gu.invitedAt DESC`,
    [userId, email]
  );

  return rows.map((i) => ({
    groupUserId: i.groupUserId,
    groupId: i.groupId,
    groupName: i.groupName,
    invitedUserId: i.invitedUserId,  // 🟢 Included in response
    invitedEmail: i.invitedEmail,
    status: i.status,
    invitedByEmail: i.invitedByEmail || i.invitedBy,
    invitedAt: i.invitedAt,
    joinedAt: i.joinedAt
  }));
}

module.exports = {
  addgroupuser,
  respondToInvite,
  removegroupuser,
  updateMember,
  getgroupusers,
  getInvitesForUser
};
