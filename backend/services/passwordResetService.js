const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Generate OTP and store in user table
async function createPasswordReset(email) {
  // Check if user exists
  const [users] = await pool.query("SELECT userId FROM user WHERE email = ?", [email]);
  if (users.length === 0) throw new Error("Email not registered");

  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Store OTP and expiration directly in user table and reset attempts
  await pool.query(
    "UPDATE user SET resetOtp = ?, otpExpiresAt = ?, otpAttempts = 0, otpLockedUntil = NULL WHERE email = ?",
    [otp, expiresAt, email]
  );

  return { otp };
}

// Validate OTP with attempt tracking and lockout
async function validateOtp(email, otp) {
  const [users] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
  if (users.length === 0) throw new Error("Email not registered");

  const user = users[0];

  // 🔒 Check if account is locked
  if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.otpLockedUntil) - new Date()) / 60000);
    throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`);
  }

  // ✅ Check if OTP is valid and not expired
  const [rows] = await pool.query(
    "SELECT * FROM user WHERE email = ? AND resetOtp = ? AND otpExpiresAt > NOW()",
    [email, otp]
  );

  if (rows.length > 0) {
    // ✅ Success: reset attempts and lock
    await pool.query("UPDATE user SET otpAttempts = 0, otpLockedUntil = NULL WHERE email = ?", [email]);
    return;
  }

  // ❌ Invalid OTP — increment attempts
  const newAttempts = (user.otpAttempts || 0) + 1;
  let lockUntil = null;
  let message = "Invalid or expired OTP";

  if (newAttempts >= 3) {
    // Lock for 15 minutes
    lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    message = "Too many failed attempts. Try again after 15 minutes.";
  }

  await pool.query("UPDATE user SET otpAttempts = ?, otpLockedUntil = ? WHERE email = ?", [
    newAttempts,
    lockUntil,
    email,
  ]);

  throw new Error(message);
}

// Clear OTP
async function clearPasswordReset(email) {
  await pool.query(
    "UPDATE user SET resetOtp = NULL, otpExpiresAt = NULL, otpAttempts = 0, otpLockedUntil = NULL WHERE email = ?",
    [email]
  );
}

// Reset password
async function resetUserPassword(email, otp, newPassword) {
  // Validate OTP first
  await validateOtp(email, otp);

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password in DB
  await pool.query("UPDATE user SET password = ? WHERE email = ?", [hashedPassword, email]);

  // Clear OTP after success
  await clearPasswordReset(email);

  return { message: "Password reset successful" };
}

module.exports = {
  createPasswordReset,
  validateOtp,
  clearPasswordReset,
  resetUserPassword,
};
