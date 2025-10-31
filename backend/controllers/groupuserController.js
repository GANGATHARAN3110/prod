const {
  addgroupuser,
  respondToInvite,
  removegroupuser,
  updateMember,
  getgroupusers,
  getInvitesForUser,
} = require("../services/groupMemberService");

// Invite a member
async function inviteMemberController(req, res) {
  try {
    const { groupId, invitedEmail } = req.body;
    const invitedBy = req.user.userId;

    // Call service to add member (service will handle email)
    const member = await addgroupuser(groupId, invitedEmail, invitedBy);

    res.status(201).json({ message: "Member invited", member });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Respond to an invite (accept/reject)
async function respondToInviteController(req, res) {
  try {
    const { groupuserId, status } = req.body;
    const result = await respondToInvite(groupuserId, status);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Remove a group member
async function removegroupuserController(req, res) {
  try {
    const groupuserId = req.params.groupuserId;
    if (!groupuserId) return res.status(400).json({ message: "groupUserId is required" });

    const requesterId = req.user.userId;
    const result = await removegroupuser(groupuserId, requesterId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Update member role/status
async function updateMemberController(req, res) {
  try {
    const { groupUserId, role, status } = req.body;
    if (!groupUserId) return res.status(400).json({ message: "groupUserId is required" });

    const requesterId = req.user.userId;
    const result = await updateMember(groupUserId, role, status, requesterId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get all members of a group
async function getgroupusersController(req, res) {
  try {
    const { groupId } = req.params;
    const { page, search } = req.query;
    const members = await getgroupusers(groupId, parseInt(page) || 1, search || "");
    res.status(200).json({ members });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get my invites
async function getMyInvites(req, res) {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!userId && !email) return res.status(400).json({ message: "Invalid user info" });

    const invites = await getInvitesForUser(userId, email);
    res.status(200).json({ count: invites.length, members: invites });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch invites", error: err.message });
  }
}

module.exports = {
  inviteMemberController,
  respondToInviteController,
  removegroupuserController,
  updateMemberController,
  getgroupusersController,
  getMyInvites,
};
