const { v4: uuidv4 } = require("uuid");

const PasswordReset = require("./model");
const hashData = require("./../../util/hashData");
const verifyHashedData = require("../../util/verifyHashedData");
const sendEmail = require("../../util/sendEmail");

//send password reset email
const sendResetEmail = async ({ _id, email }, redirectUrl) => {
  try {
    const resetString = uuidv4() + _id;

    //first,we clear all existing reset records
    await PasswordReset.deleteMany({ userId: _id });
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

    const hashedResetString = await hashData(resetString);
    const newPasswordReset = new PasswordReset({
      userId: _id,
      resetString: hashedResetString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1 * 3600 * 1000,
    });

    await newPasswordReset.save();
    await sendEmail(mailOptions);
    //reset email sent and password reset record saved
    return true;
  } catch (error) {
    throw error;
  }
};

const resetPassword = async (userId, resetString) => {
  try {
    const fetchedRecords = await PasswordReset.find({ userId });
    if (fetchedRecords.length <= 0) {
      //no record found
      throw new Error(
        "Account record doesn't exist or has been verified already. Please sign-up or sign-in"
      );
    } else {
      const { expiresAt } = fetchedRecords[0];
      const hashedResetString = fetchedRecords[0].resetString;
      //checking for expired reset string
      if (expiresAt < Date.now()) {
        await PasswordReset.deleteOne({ userId });
        throw Error("Password link expired");
      } else {
        const verified = await verifyHashedData(resetString, hashedResetString);
        if (!verified) {
          //supplied otp is wrong
          throw new Error("Invalid code passed");
        } else {
          await PasswordReset.deleteOne({ userId });
          return true;
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { sendResetEmail, resetPassword };
