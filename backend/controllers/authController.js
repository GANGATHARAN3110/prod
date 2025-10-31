const logger = require("../utils/logger");
const { registerUser, loginUser, getUserById, updateUser } = require("../services/authService");
const { sendMail } = require("../utils/mailer");

async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await registerUser(email, password, firstName, lastName);
    await sendMail(email, "Welcome 🎉", `<h3>Hi ${firstName || "User"},</h3><p>Thanks for registering!</p>`);

    res.status(201).json({ message: "User registered successfully. Email sent." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await loginUser(email, password);
    res.status(200).json({ message: "Login successful", token: user.token, user: user.userId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get user by ID
async function getUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    res.status(200).json({ user });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

// Update user by ID
async function updateUserController(req, res) {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, password } = req.body;

    const updatedUser = await updateUser(userId, { firstName, lastName, email, password });
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { register, login, getUser, updateUserController };
