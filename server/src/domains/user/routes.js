const express = require("express");
const router = express.Router();

//custom functions
const {
  createNewUser,
  authenticateUser,
  updateUser,
  fetchUsers,
} = require("./controller");
const {
  sendOTPVerificationEmail,
  verifyOTP,
} = require("./../email_verification_otp/controller");
const {
  sendResetEmail,
  resetPassword,
} = require("./../forgot_password/controller");

const {
  sendVerificationEmail,
  verifyEmail,
} = require("./../email_verification/controller");
const { Error } = require("mongoose");
const {
  generateAccessToken,
  authenticateToken,
  cacheRefreshToken,
  isRefreshTokenValid,
  refreshAccessToken,
  generateRefreshToken,
} = require("../../util/jwtHandler");
const hashData = require("../../util/hashData");
const { encryptData, decryptData } = require("../../util/crypto");
const { decrypt } = require("dotenv");
//Sign-up
router.post("/signup", async (req, res) => {
  try {
    //retrieve values
    let { name, email, password, dateOfBirth } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();
    dateOfBirth = dateOfBirth.trim();

    //check non-empty
    if (name === "" || email === "" || password === "" || dateOfBirth === "") {
      throw Error("Empty input fields");
      res.json({
        status: "FAILED",
        message: "Empty input fields",
      });
    }
    //check name
    else if (!/^[a-zA-Z ]*$/.test(name)) {
      throw Error("Invalid Name entered");
      res.json({
        status: "FAILED",
        message: "Invalid Name entered",
      });
    }
    //check mail
    else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      throw Error("Invalid Email entered");

      res.json({
        status: "FAILED",
        message: "Invalid Email entered",
      });
    }
    //check dob
    else if (!new Date(dateOfBirth).getTime()) {
      throw Error("Invalid DOB entered");

      res.json({
        status: "FAILED",
        message: "Invalid DOB entered",
      });
    }
    //check pwd
    else if (password.length < 8) {
      throw Error("Password is too short");

      res.json({
        status: "FAILED",
        message: "Password is too short",
      });
    } else {
      const newUser = await createNewUser({
        name,
        email,
        password,
        dateOfBirth,
      });
      const emailData = await sendVerificationEmail(newUser);
      // const emailData = await sendOTPVerificationEmail(newUser);
      res.json({
        status: "PENDING",
        message: "Verification email sent!",
        data: emailData,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

//Sign-in
router.post("/signin", async (req, res) => {
  try {
    //retrieve values
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    //check non-empty
    if (email === "" || password === "") {
      throw Error("Empty credentials supplied!");
      res.json({
        status: "FAILED",
        message: "Empty credentials supplied!",
      });
    } else {
      const data = await authenticateUser(email, password);
      const encryptedData = await encryptData(`${data[0]._id}`);
      const user = { _id: encryptedData };
      console.log(data[0]._id + "          " + encryptedData);
      const accessToken = await generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);
      cacheRefreshToken(refreshToken);
      res.json({
        status: "SUCCESS",
        message: "Signin successful",
        data: data,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

router.get("/info", authenticateToken, async (req, res) => {
  try {
    const { _id } = req.user;
    console.log(_id);
    const fetchedUsers = await fetchUsers({ _id });

    if (!fetchedUsers.length) {
      throw Error("No account with the supplied criteria exists!");
    } else {
      console.log(fetchedUsers[0]);
      res.json({
        status: "SUCCESS",
        message: "Users fetched successfully",
        data: fetchedUsers[0],
      });
    }
  } catch (error) {
    console.error(error.message);
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

router.delete("/signout", async (req, res) => {
  try {
    refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
    res.sendStatus(204);
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

router.post("/token", refreshAccessToken);

module.exports = router;
