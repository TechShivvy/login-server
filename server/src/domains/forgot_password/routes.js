const express = require("express");
const { fetchUsers, updateUser } = require("../user/controller");
const hashData = require("../../util/hashData");
const { sendResetEmail, resetPassword } = require("./controller");
const router = express.Router();

router.post("/requestPasswordReset", async (req, res) => {
    try {
      const { email, redirectUrl } = req.body;
  
      if (!email || !redirectUrl) throw Error("Empty details are not allowed");
      else {
        const fetchedUsers = await fetchUsers({ email });
        if (!fetchedUsers.length) {
          throw Error("No account with the supplied email exists!");
        } else {
          if (!fetchedUsers[0].verified)
            throw Error("Email hasn't ben verified yet. Check your inbox");
          else {
            //proceed with email to reset password
            const sent = await sendResetEmail(fetchedUsers[0], redirectUrl);
            if (sent === true) {
              res.json({
                status: "PENDING",
                message: "Password reset mail sent successfully",
              });
            }
          }
        }
      }
    } catch (error) {
      res.json({
        status: "FAILED",
        message: error.message,
      });
    }
  });
  
  router.post("/resetPassword", async (req, res) => {
    try {
      let { userId, resetString, newPassword } = req.body;
      if (!userId || !resetString || !newPassword) {
        throw Error("Empty details are not allowed");
      } else {
        const reset = await resetPassword(userId, resetString);
        if (reset === true) {
          const hashednewPassword = await hashData(newPassword);
          await updateUser(userId, { password: hashednewPassword });
          res.json({
            status: "SUCCESS",
            message: "Password has been reset successfully",
          });
        }
      }
    } catch (error) {
      res.json({
        status: "FAILED",
        message: error.message,
      });
    }
  });

module.exports = router;
