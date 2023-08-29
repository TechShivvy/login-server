const express = require("express");
const router = express.Router();

//mongodb user model
const User = require("./../models/User");

//mongodb user verification model
const UserVerification = require("./../models/UserVerification");

//mongodb user verification model
const UserOTPVerification = require("./../models/UserOTPVerification");

//mongodb password reset model
const PasswordReset = require("./../models/PasswordReset");

//email handler
const nodemailer = require("nodemailer");

//unique string
const { v4: uuidv4 } = require("uuid");

//env variables
require("dotenv").config();

//Password Handler
const bcrypt = require("bcrypt");

//path for static verified page
const path = require("path");

const development = "http://localhost:3000/";
const production = "";
const currentUrl = process.env.NODE_ENV ? production : development;

//nodemailer init
let transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

//testing success
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

//Sign-up
router.post("/signup", (req, res) => {
  //retrieve values
  let { name, email, password, dateOfBirth } = req.body;
  name = name.trim();
  email = email.trim();
  password = password.trim();
  dateOfBirth = dateOfBirth.trim();

  //check non-empty
  if (name === "" || email === "" || password === "" || dateOfBirth === "") {
    res.json({
      status: "FAILED",
      message: "Empty input fields",
    });
  }
  //check name
  else if (!/^[a-zA-Z ]*$/.test(name)) {
    res.json({
      status: "FAILED",
      message: "Invalid Name entered",
    });
  }
  //check mail
  else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    res.json({
      status: "FAILED",
      message: "Invalid Email entered",
    });
  }
  //check dob
  else if (!new Date(dateOfBirth).getTime()) {
    res.json({
      status: "FAILED",
      message: "Invalid DOB entered",
    });
  }
  //check pwd
  else if (password.length < 8) {
    res.json({
      status: "FAILED",
      message: "Password is too short",
    });
  } else {
    //Checking if user already exists
    User.find({ email })
      .then((result) => {
        if (result.length) {
          //A user already exists
          res.json({
            status: "FAILED",
            message: "User with the provided email already exists",
          });
        } else {
          //try to create new user

          //password handling
          const saltRounds = 10;
          bcrypt
            .hash(password, saltRounds)
            .then((hashedPassword) => {
              const newUser = new User({
                name,
                email,
                password: hashedPassword,
                dateOfBirth,
                verified: false,
              });
              newUser
                .save()
                .then((result) => {
                  //   res.json({
                  //     status: "SUCCESS",
                  //     message: "Signup successful!",
                  //     data: result,
                  //   });

                  //handle acc verification
                  // sendVerificationEmail(result, res);
                  sendOTPVerificationEmail(result, res);
                })
                .catch((err) => {
                  console.error("Sign-up/newUser save");
                  console.error(err);
                  res.json({
                    status: "FAILED",
                    message: "An error occured while saving user account",
                  });
                });
            })
            .catch((err) => {
              console.error("Sign-up/pwd hashing");
              console.error(err);
              res.json({
                status: "FAILED",
                message: "An error occured while hashing the password!",
              });
            });
        }
      })
      .catch((err) => {
        console.error("Sign-up/cheking user already exist");
        console.error(err);
        res.json({
          status: "FAILED",
          message: "An error occured while checking for existsing user!",
        });
      });
  }
});

//send OTP Verification Email
const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    //mail options
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html:
        `<p>Enter ${otp} in the app to verify your email address and complete the verification process</p>` +
        `<p>This code <b>expires in 1 hour</b>.</p>`,
    };

    //hash the otp

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);
    const newOTPVerification = await new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1 * 3600 * 1000,
    });
    // save otp record
    await newOTPVerification.save();
    transporter.sendMail(mailOptions);
    res.json({
      status: "PENDING",
      message: "Verification email sent!",
      data: {
        userId: _id,
        email,
      },
    });
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
};

router.post("/verifyOTP", async (req, res) => {
  try {
    let { userId, otp } = req.body;
    if (!userId || !otp) {
      throw Error("Empty otp details are not allowed");
    } else {
      const UserOTPVerificationRecords = await UserOTPVerification.find({
        userId,
      });
      if (UserOTPVerificationRecords.length <= 0) {
        //no record found
        throw new Error(
          "Account record doesn't exist or has been verified already. Please sign-up or sign-in"
        );
      } else {
        //user otp record exists
        const { expiresAt } = UserOTPVerificationRecords[0];
        const hashedOTP = UserOTPVerificationRecords[0].otp;
        if (expiresAt < Date.now()) {
          //user otp record has expired
          await UserOTPVerification.deleteMany({ userId });
          throw new Error("Code has expired. Please request again.");
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOTP);
          if (!validOTP) {
            //supplied otp is wrong
            throw new Error("Invalid code passed. Check your inbox");
          } else {
            //success
            await User.updateOne({ _id: userId }, { verified: true });
            await UserOTPVerification.deleteMany({ userId });
            res.json({
              status: "VERIFIED",
              message: "User email verified successfully",
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

//resend OTP
router.post("/resendOTPVerification", async (req, res) => {
  try {
    let { userId, email } = req.body;
    if (!userId || !email) {
      throw Error("Empty otp details are not allowed");
    } else {
      //delete existing records and resend
      await UserOTPVerification.deleteMany({ userId });
      sendOTPVerificationEmail({ _id: userId, email }, res);
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
}); 

//send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  // url to be used in the email
  //   const currentUrl = "http:/localhost:3000/";

  const uniqueString = uuidv4() + _id;

  //mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html:
      `<p>Please click on the following link to verify your email address:</p>` +
      `<p>This link <b>expires in 6 hours</b>.</p>` +
      `<p>Press <a href=${
        currentUrl + "user/verify/" + _id + "/" + uniqueString
      }>here</a> to proceed.</p>`,
  };

  //hash the uniqueString
  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      //set values in userverification collection
      const newVerification = new UserVerification({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 6 * 3600 * 1000,
      });

      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              //email sent and verification record saved
              res.json({
                status: "PENDING",
                message: "Verification mail sent!",
              });
            })
            .catch((err) => {
              console.error("sendVerificationMail/send mail failed");
              console.error(err);
              res.json({
                status: "FAILED",
                message: "Verification mail failed",
              });
            });
        })
        .catch((err) => {
          console.error("sendVerificationMail/save newVerif failed");
          console.error(err);
          res.json({
            status: "FAILED",
            message: "Couldn't save verification email data",
          });
        });
    })
    .catch(() => {
      res.json({
        status: "FAILED",
        message: "An error occured while hasing email data",
      });
    });
};

//verify email
router.get("/verify/:userId/:uniqueString", (req, res) => {
  let { userId, uniqueString } = req.params;

  UserVerification.find({ userId })
    .then((result) => {
      if (result.length > 0) {
        //user verification record exists so we proceed
        const { expiresAt } = result[0];
        const hashedUniqueString = result[0].uniqueString;

        //checking for expired unique string
        if (expiresAt < Date.now()) {
          //record has expired so we delete it
          UserVerification.deleteOne({ userId })
            .then((result) => {
              User.deleteOne({ _id: userId })
                .then(() => {
                  let message = "Link has expired. Please sign-up again";
                  res.redirect(`/user/verified?error=true&message=${message}`);
                })
                .catch((err) => {
                  console.error("verify/expire User delete one failed");
                  console.error(err);
                  let message =
                    "Clearing user with expired unique string failed";
                  res.redirect(`/user/verified?error=true&message=${message}`);
                });
            })
            .catch((err) => {
              console.error("verify/expire UserVerification delete one failed");
              console.error(err);
              let message =
                "An error occured while clearing expired user verification record";
              res.redirect(`/user/verified?error=true&message=${message}`);
            });
        } else {
          //valid record exists
          //first compare the hashed unqiue string
          bcrypt
            .compare(uniqueString, hashedUniqueString)
            .then((result) => {
              if (result) {
                //Strings match
                User.updateOne({ _id: userId }, { verified: true })
                  .then(() => {
                    UserVerification.deleteOne({ userId })
                      .then(() => {
                        res.sendFile(
                          path.join(__dirname, "./../views/verified.html")
                        );
                      })
                      .catch((error) => {
                        let message =
                          "An error occured while finalizing successful verification.";
                        res.redirect(
                          `/user/verified?error=true&message=${message}`
                        );
                      });
                  })
                  .catch((err) => {
                    console.error(err);
                    let message =
                      "An error occured while updating user record to show verified.";
                    res.redirect(
                      `/user/verified?error=true&message=${message}`
                    );
                  });
              } else {
                //existing records but incorrect verification details passed
                let message =
                  "Invalid verification details passed.Check your inbox";
                res.redirect(`/user/verified?error=true&message=${message}`);
              }
            })
            .catch((err) => {
              console.error("verify/bcrypt compare failed");
              console.error(err);
              let message = "An error occured while comparing unique strings";
              res.redirect(`/user/verified?error=true&message=${message}`);
            });
        }
      } else {
        //user verification record doesn't exist
        let message =
          "Account record doesn't exit or has been verified already. Please sign up or log in";
        res.redirect(`/user/verified?error=true&message=${message}`);
      }
    })
    .catch((err) => {
      console.error("verify/find userId failed");
      console.error(err);
      let message =
        "An error occured while checking for existing user verification record";
      res.redirect(`/user/verified?error=true&message=${message}`);
    });
});

//verified page route
router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./../views/verified.html"));
});

//Sign-in
router.post("/signin", (req, res) => {
  //retrieve values
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  //check non-empty
  if (email === "" || password === "") {
    res.json({
      status: "FAILED",
      message: "Empty credentials supplied!",
    });
  } else {
    //Check if user exist
    User.find({ email })
      .then((data) => {
        if (data.length) {
          //user exists

          //check if user is verified
          if (!data[0].verified) {
            res.json({
              status: "FAILED",
              message: "Email hasn't been verified yet. Check your inbox",
            });
          } else {
            const hashedPassword = data[0].password;
            bcrypt
              .compare(password, hashedPassword)
              .then((result) => {
                if (result) {
                  //Passwords match
                  res.json({
                    status: "SUCCESS",
                    message: "Signin successful",
                    data: data,
                  });
                } else {
                  res.json({
                    status: "FAILED",
                    message: "Invalid password entered",
                  });
                }
              })
              .catch((err) => {
                console.error("Sign-in/comparing pwds");
                console.error(err);
                res.json({
                  status: "FAILED",
                  message: "An error occured while comparing passwords",
                });
              });
          }
        } else {
          res.json({
            status: "FAILED",
            message: "Invalid credentials entered!",
          });
        }
      })
      .catch((err) => {
        console.error("Sign-in/checking existing user");
        console.error(err);
        res.json({
          status: "FAILED",
          message: "An error occured while checking for existing user",
        });
      });
  }
});

//Password reset stuff
router.post("/requestPasswordReset", (req, res) => {
  const { email, redirectUrl } = req.body;

  //check if email exists
  User.find({ email })
    .then((data) => {
      if (data.length) {
        //user exists

        //check iff user is verified

        if (!data[0].verified) {
          res.json({
            status: "FAILED",
            message: "Email hasn't been verified yet. Check your inbox",
          });
        } else {
          //proceed with email to reset password
          sendResetEmail(data[0], redirectUrl, res);
        }
      } else {
        res.json({
          status: "FAILED",
          message: "No account with the supplied email exists!",
        });
      }
    })
    .catch((err) => {
      console.error("Password-reset/checking existing user");
      console.error(err);
      res.json({
        status: "FAILED",
        message: "An error occured while checking for existing user",
      });
    });
});

//send password reset email
const sendResetEmail = ({ _id, email }, redirectUrl, res) => {
  const resetString = uuidv4() + _id;

  //first,we clear all existing reset records
  PasswordReset.deleteMany({ userId: _id })
    .then((result) => {
      //reset records deleted successfully, so send mail
      //mail options
      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Password Reset",
        html:
          `<p>Use the link below to reset your password.</p>` +
          `<p>This link <b>expires in 60 minutes </b>.</p>` +
          `<p>Press <a href=${
            redirectUrl + "/" + _id + "/" + resetString
          }>here</a> to proceed.</p>`,
      };

      //hash the reset string
      const saltRounds = 10;
      bcrypt
        .hash(resetString, saltRounds)
        .then((hashedResetString) => {
          //set values in password reset collection
          const newPasswordReset = new PasswordReset({
            userId: _id,
            resetString: hashedResetString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 1 * 3600 * 1000,
          });

          newPasswordReset
            .save()
            .then(() => {
              transporter
                .sendMail(mailOptions)
                .then(() => {
                  //reset email sent and password reset record saved
                  res.json({
                    status: "PENDING",
                    message: "Password reset mail sent successfully",
                  });
                })
                .catch((err) => {
                  console.error(
                    "send-reset-email/couldn't send password reset mail"
                  );
                  console.error(err);
                  res.json({
                    status: "FAILED",
                    message:
                      "An error occured while sending Password reset mail",
                  });
                });
            })
            .catch((err) => {
              console.error(
                "send-reset-email/couldn't save password reset data"
              );
              console.error(err);
              res.json({
                status: "FAILED",
                message: "An error occured while saving password reset data",
              });
            });
        })
        .catch((err) => {
          console.error("send-reset-email/error during hashing resetString");
          console.error(err);
          res.json({
            status: "FAILED",
            message: "An error occured while hashing the password reset data",
          });
        });
    })
    .catch((err) => {
      //error while clearing existing records
      console.error("send-reset-email/clear existing user");
      console.error(err);
      res.json({
        status: "FAILED",
        message: "Clearing exisiting password reset records failed",
      });
    });
};

//Actually reset the password
router.post("/resetPassword", (req, res) => {
  let { userId, resetString, newPassword } = req.body;
  PasswordReset.find({ userId })
    .then((result) => {
      if (result.length > 0) {
        //Password record exists

        const { expiresAt } = result[0];
        const hashedResetString = result[0].resetString;
        //checking for expired reset string
        if (expiresAt < Date.now()) {
          PasswordReset.deleteOne({ userId })
            .then(() => {
              //Reset record deleted successfully
              res.json({
                status: "FAILED",
                message: "Password link has expired",
              });
            })
            .catch((err) => {
              console.error("reset-password/clearing pwd reset record failed");
              console.error(err);
              res.json({
                status: "FAILED",
                message: "Clearing password reset record failed",
              });
            });
        } else {
          //valid reset string exists, so we proceed

          bcrypt
            .compare(resetString, hashedResetString)
            .then((result) => {
              if (result) {
                //strings matched
                //hash password again

                const saltRounds = 10;
                bcrypt
                  .hash(newPassword, saltRounds)
                  .then((hashednewPassword) => {
                    //update user password

                    User.updateOne(
                      { _id: userId },
                      { password: hashednewPassword }
                    )
                      .then(() => {
                        //update complete.Now delete reset record
                        PasswordReset.deleteOne({ userId })
                          .then(() => {
                            //both user record and reset record updated
                            res.json({
                              status: "SUCCESS",
                              message: "Password has been reset successfully",
                            });
                          })
                          .catch((err) => {
                            console.error(
                              "reset-password/deleting pwd reset record"
                            );
                            console.error(err);
                            res.json({
                              status: "FAILED",
                              message:
                                "An error occurered while finalising password reset",
                            });
                          });
                      })
                      .catch((err) => {
                        console.error(
                          "reset-password/Updating user password failed"
                        );
                        console.error(err);
                        res.json({
                          status: "FAILED",
                          message: "Updating user password failed!",
                        });
                      });
                  })
                  .catch((err) => {
                    console.error("reset-password/pwd hashing failed");
                    console.error(err);
                    res.json({
                      status: "FAILED",
                      message: "An error occured while hashing the password!",
                    });
                  });
              } else {
                //Existing record but incorrect reset string passed
                res.json({
                  status: "FAILED",
                  message: "Invalid Password reset details passed",
                });
              }
            })
            .catch((err) => {
              console.error("reset-password/comparing reset strings failed");
              console.error(err);
              res.json({
                status: "FAILED",
                message: "Comparing password reset strings failed",
              });
            });
        }
      } else {
        //Password reset record not found
        res.json({
          status: "FAILED",
          message: "Password reset request not found",
        });
      }
    })
    .catch((err) => {
      console.error("reset-password/checking existing record failed");
      console.error(err);
      res.json({
        status: "FAILED",
        message: "Checking for  exisiting password reset record failed",
      });
    });
});
module.exports = router;
