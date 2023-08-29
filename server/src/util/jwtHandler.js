const jwt = require("jsonwebtoken");
const cache = require("memory-cache");
const { decryptData } = require("./crypto");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log("auth:",token)
  if (token == null) return res.sendStatus(401);

  await jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    async (err, user) => {
      if (err) {
        console.log(err);
        return res.sendStatus(403);
      }
      console.log(user);
      req.user = { _id: await decryptData(user._id) };
      next();
    }
  );
};

const generateAccessToken = async (user) => {
  try {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15s",
    });
  } catch (error) {
    throw error;
  }
};

const generateRefreshToken = async (user) => {
  try {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw error;
  }
};

const cacheRefreshToken = async (token) => {
  try {
    var tokens = (await cache.get("refreshTokens")) || [];
    tokens.push(token);
    await cache.put("refreshTokens", tokens, 3600000);
    // , async (key, value) => {
    //   console.log(key + " did " + value);
    // });
    console.log("Tokens in cache:", tokens);
    return true;
  } catch (error) {
    throw error;
  }
};

const isRefreshTokenValid = async (refreshToken) => {
  try {
    const cachedTokens = (await cache.get("refreshTokens")) || [];
    console.log(cachedTokens);
    return cachedTokens.includes(refreshToken);
  } catch (error) {
    throw error;
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.body.token;
    if (refreshToken === null || !(await isRefreshTokenValid(refreshToken))) {
      console.log("401");
      return res.sendStatus(401);
    }
    console.log(refreshToken);
    await jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, user) => {
        if (err) {
          console.log("403", err);
          return res.sendStatus(403);
        }

        const accessToken = await generateAccessToken({_id:user._id});
        res.json({ accessToken: accessToken });
      }
    );
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

module.exports = {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  cacheRefreshToken,
  isRefreshTokenValid,
  refreshAccessToken,
};
