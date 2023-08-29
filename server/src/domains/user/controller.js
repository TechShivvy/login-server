const User = require("./model");
const hashData = require("./../../util/hashData");
const verifyHashedData = require("./../../util/verifyHashedData");

const createNewUser = async (data) => {
  try {
    let { name, email, password, dateOfBirth } = data;
    //Checking if user already exists
    const existingUser = await User.find({ email });

    if (existingUser.length) {
      //A user already exists
      throw Error("User with the provided email already exists");
      res.json({
        status: "FAILED",
        message: "User with the provided email already exists",
      });
    } else {
      //hash password
      const hashedPassword = await hashData(password);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        dateOfBirth,
        verified: false,
      });
      const createdUser = await newUser.save();
      return createdUser;
    }
  } catch (error) {
    throw error;
  }
};

const authenticateUser = async (email, password) => {
  try {
    const fetchedUsers = await User.find({ email });
    if (!fetchedUsers.length) {
      throw Error("Invalid credentials enetered!");
    } else {
      if (!fetchedUsers[0].verified) {
        throw Error("Email hasn't ben verified yet. Check your inbox");
      } else {
        const hashedPassword = fetchedUsers[0].password;
        const passwordMatch = await verifyHashedData(password, hashedPassword);

        if (!passwordMatch) {
          throw Error("Invalid password entered!");
        } else {
          return fetchedUsers;
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

const updateUser = async (userId, updateData) => {
  try {
    // Update the user using the provided data
    const result = await User.updateOne({ _id: userId }, updateData);

    if (result.nModified === 0) {
      throw new Error("User not found or no changes applied");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const fetchUsers = async (criteria) => {
  try {
    const users = await User.find(criteria);
    return users;
  } catch (error) {
    throw error;
  }
};

module.exports = { createNewUser, authenticateUser, updateUser, fetchUsers };
