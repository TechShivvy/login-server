const express = require("express");
const { updateUser } = require("../user/controller");
const { verifyEmail } = require("./controller");
const router = express.Router();
const path = require("path");

router.get("/verify/:userId/:uniqueString", async (req, res) => {
  try {
    let { userId, uniqueString } = req.params;
    if (!userId || !uniqueString) {
      throw Error("Empty details are not allowed");
    } else {
      const verified = await verifyEmail({ userId, uniqueString });
      if (verified) await updateUser(userId, { verified: true });
      res.redirect(`/email_verification/verified`);
      // res.json({
      //   status: "VERIFIED",
      //   message: "User email verified successfully",
      // });
    }
  } catch (error) {
    res.redirect(
      `/email_verification/verified?error=true&message=${error.message}`
    );
    // res.json({
    //   status: "FAILED",
    //   message: error.message,
    // });
  }
});

//verified page route
router.get("/verified", async (req, res) => {
  res.sendFile(path.join(__dirname, "./views/verified.html"));
});

module.exports = router;
