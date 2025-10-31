const { createPasswordReset, resetUserPassword, validateOtp } = require("../services/passwordResetService");
const { sendMail } = require("../utils/mailer");
const logger = require("../utils/logger");

// Request OTP
async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const { otp } = await createPasswordReset(email);

    await sendMail(
      email,
      "Password Reset OTP",
      `Your OTP is ${otp}`,
      `<p>Your OTP is <b>${otp}</b>. It will expire in 10 minutes.</p>`
    );

    logger.info({ email }, "OTP generated and sent");
    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    logger.error({ err, email: req.body.email }, "Failed to generate OTP");
    res.status(400).json({ message: err.message });
  }
}

// Verify OTP
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    await validateOtp(email, otp);

    logger.info({ email }, "OTP verified successfully");
    res.status(200).json({ message: "OTP is valid" });
  } catch (err) {
    logger.error({ err, email: req.body.email }, "OTP verification failed");
    res.status(400).json({ message: err.message });
  }
}

// Reset Password
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Email, OTP, and newPassword are required" });

    const result = await resetUserPassword(email, otp, newPassword);

    logger.info({ email }, "Password reset successful");
    res.status(200).json(result);
  } catch (err) {
    logger.error({ err, email: req.body.email }, "Password reset failed");
    res.status(400).json({ message: err.message });
  }
}

module.exports = { requestOtp, verifyOtp, resetPassword };
