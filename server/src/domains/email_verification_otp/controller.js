const UserOTPVerification = require("./model");
const generateOTP = require("./../../util/generateOTP");
const hashData = require("./../../util/hashData");
const sendEmail = require("./../../util/sendEmail");
const verifyHashedData = require("./../../util/verifyHashedData");

//send OTP Verification Email
const sendOTPVerificationEmail = async ({ _id, email }) => {
  try {
    const otp = await generateOTP();

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

    const hashedOTP = await hashData(otp);
    const newOTPVerification = await new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1 * 3600 * 1000,
    });
    // save otp record
    await newOTPVerification.save();
    await sendEmail(mailOptions);
    return {
      userId: _id,
      email,
    };
    res.json({
      status: "PENDING",
      message: "Verification email sent!",
      data: {
        userId: _id,
        email,
      },
    });
  } catch (error) {
    throw error;
  }
};

const verifyOTP = async ({ userId, otp }) => {
  try {
    const UserOTPVerificationRecords = await UserOTPVerification.find({
      "userId":userId,
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
        const otpMatch = await verifyHashedData(otp, hashedOTP);
        if (!otpMatch) {
          //supplied otp is wrong
          throw new Error("Invalid code passed. Check your inbox");
        } else {
          //success
          await UserOTPVerification.deleteMany({ userId });
          return true;
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

const resendOTPVerificationEmail = async ({ userId, email }) => {
  try {
    //delete existing records and resend
    await UserOTPVerification.deleteMany({ userId });
    const emailData = await sendOTPVerificationEmail({ _id: userId, email });
    return emailData;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendOTPVerificationEmail,
  resendOTPVerificationEmail,
  verifyOTP,
};
