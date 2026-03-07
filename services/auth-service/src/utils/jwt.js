const jwt = require("jsonwebtoken");

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
const refreshTtl = process.env.JWT_REFRESH_TTL || "7d";

const signAccessToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, accessSecret, {
    expiresIn: accessTtl
  });
};

const signRefreshToken = (user) => {
  return jwt.sign({ sub: user.id }, refreshSecret, {
    expiresIn: refreshTtl
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
};
