const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const { uuidv7 } = require("uuidv7");
require("dotenv").config();

// Register a new user
async function registerUser(email, password, firstName, lastName) {
  const [existing] = await pool.query(`SELECT * FROM user WHERE email = ?`, [email]);
  if (existing.length > 0) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv7();

  await pool.query(
    `INSERT INTO user (userId, email, password, firstName, lastName)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, email, hashedPassword, firstName, lastName]
  );

  return { userId, email, firstName, lastName };
}

// Login user
async function loginUser(email, password) {
  const [users] = await pool.query(`SELECT * FROM user WHERE email = ?`, [email]);
  if (users.length === 0) throw new Error("User not found");

  const user = users[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid password");

  const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return {
    userId: user.userId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    token,
  };
}

// Get user by ID
async function getUserById(userId) {
  const [users] = await pool.query(`SELECT userId, email, firstName, lastName, createdAt FROM user WHERE userId = ?`, [userId]);
  if (users.length === 0) throw new Error("User not found");
  return users[0];
}

// Update user
async function updateUser(userId, { firstName, lastName, email, password }) {
  const [users] = await pool.query(`SELECT * FROM user WHERE userId = ?`, [userId]);
  if (users.length === 0) throw new Error("User not found");

  const updates = [];
  const params = [];

  if (firstName) { updates.push("firstName = ?"); params.push(firstName); }
  if (lastName) { updates.push("lastName = ?"); params.push(lastName); }
  if (email) {
    const [existingEmail] = await pool.query(`SELECT * FROM user WHERE email = ? AND userId != ?`, [email, userId]);
    if (existingEmail.length > 0) throw new Error("Email already in use");
    updates.push("email = ?");
    params.push(email);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.push("password = ?");
    params.push(hashedPassword);
  }

  if (updates.length === 0) throw new Error("No fields to update");

  params.push(userId);
  await pool.query(`UPDATE user SET ${updates.join(", ")} WHERE userId = ?`, params);
  return getUserById(userId);
}

module.exports = { registerUser, loginUser, getUserById, updateUser };
