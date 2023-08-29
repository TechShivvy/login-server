const { v4: uuidv4 } = require("uuid");
const UserVerification = require("./model");
const generateOTP = require("./../../util/generateOTP");
const hashData = require("./../../util/hashData");
const sendEmail = require("./../../util/sendEmail");
const verifyHashedData = require("./../../util/verifyHashedData");

//send verification email
const sendVerificationEmail = async ({ _id, email }) => {
  try {
    // url to be used in the email
    const currentUrl = "http:/localhost:5000/";

    const uniqueString = uuidv4() + _id;

    //mail options
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html:
        `<p>Please click on the following link to verify your email address:</p>` +
        `<p>This link <b>expires in 6 hours</b>.</p>` +
        `<p>Press <a target="_blank" href=${
          currentUrl + "email_verification/verify/" + _id + "/" + uniqueString
        }>here</a> to proceed.</p>`,
    };

    //hashing
    const hashedUniqueString = await hashData(uniqueString);
    const newVerification = new UserVerification({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 6 * 3600 * 1000,
    });
    await newVerification.save();
    await sendEmail(mailOptions);
    return {
      userId: _id,
      email,
    };
  } catch (error) {
    throw error;
  }
};

const verifyEmail = async ({ userId, uniqueString }) => {
  try {
    const UserVerificationRecords = await UserVerification.find({ userId });
    if (UserVerificationRecords.length <= 0) {
      //no record found
      throw new Error(
        "Account record doesn't exist or has been verified already. Please sign-up or sign-in"
      );
    } else {
      //user otp record exists
      const { expiresAt } = UserVerificationRecords[0];
      const hashedUniqueString = UserVerificationRecords[0].uniqueString;
      if (expiresAt < Date.now()) {
        //user otp record has expired
        await UserVerification.deleteMany({ userId });
        throw new Error("Link has expired. Please request again.");
      } else {
        const uniqueStringMatch = await verifyHashedData(
          uniqueString,
          hashedUniqueString
        );
        if (!uniqueStringMatch) {
          //supplied link is wrong
          throw new Error("Invalid string passed. Check your inbox");
        } else {
          await UserVerification.deleteMany({ userId });
          return true;
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  verifyEmail,
};
