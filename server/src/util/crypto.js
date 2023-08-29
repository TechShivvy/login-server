const crypto = require("crypto");
require("dotenv").config();

const encryptData = async (data) => {
  try {
    const cipher = crypto.createCipheriv(
      process.env.ALGORITHM,
      Buffer.from(process.env.SECURITY_KEY, "hex"),
      Buffer.from(process.env.INIT_VECTOR, "hex")
    );
    let encryptedData = cipher.update(
      data,
      process.env.IP_ENCODING,
      process.env.OP_ENCODING
    );
    encryptedData += cipher.final(process.env.OP_ENCODING);
    return encryptedData;
  } catch (error) {
    throw error;
  }
};

const decryptData = async (data) => {
  try {
    const decipher = crypto.createDecipheriv(
      process.env.ALGORITHM,
      Buffer.from(process.env.SECURITY_KEY, "hex"),
      Buffer.from(process.env.INIT_VECTOR, "hex")
    );
    let decryptedData = decipher.update(
      data,
      process.env.OP_ENCODING,
      process.env.IP_ENCODING
    );
    decryptedData += decipher.final(process.env.IP_ENCODING);
    return decryptedData;
  } catch (error) {
    throw error;
  }
};

module.exports = { encryptData, decryptData };
