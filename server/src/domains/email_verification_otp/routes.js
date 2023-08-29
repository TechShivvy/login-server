const express = require("express");
const router = express.Router();

const { resendOTPVerificationEmail, verifyOTP } = require("./controller");
const { updateUser } = require("../user/controller");

router.post("/verifyOTP", async (req, res) => {
  try {
    let { userId, otp } = req.body;
    if (!userId || !otp) {
      throw Error("Empty otp details are not allowed");
    } else {
      const verified = await verifyOTP({ userId, otp });
      if (verified) {
        await updateUser(userId, { verified: true });
      }
      res.json({
        status: "VERIFIED",
        message: "User email verified successfully",
      });
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

//resend OTP
router.post("/resendOTPVerification", async (req, res) => {
  try {
    let { userId, email } = req.body;
    if (!userId || !email) {
      throw Error("Empty otp details are not allowed");
    } else {
      const emailData = await resendOTPVerificationEmail({ userId, email });
      res.json({
        status: "PENDING",
        message: "Verification email sent Again!",
        data: emailData,
      });
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

module.exports = router;
