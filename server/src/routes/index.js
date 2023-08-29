const express = require("express");
const router = express.Router();

const userRoutes = require("./../domains/user");
const forgotPassword = require("./../domains/forgot_password");
const emailRoutes = require("./../domains/email_verification");
const emailOtpRoutes = require("./../domains/email_verification_otp");

router.use("/user", userRoutes);
router.use("/forgot_password", forgotPassword);
router.use("/email_verification", emailRoutes);
router.use("/email_verification_otp", emailOtpRoutes);

module.exports = router;
