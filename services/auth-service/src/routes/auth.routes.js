const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/mysql");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../utils/jwt");

const router = express.Router();

const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
    [email]
  );
  return rows[0];
};

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email };
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, refreshExpiry]
    );

    res.status(201).json({
      user,
      tokens: { accessToken, refreshToken }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, refreshToken, refreshExpiry]
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      tokens: { accessToken, refreshToken }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const [rows] = await pool.execute(
      "SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ?",
      [refreshToken, payload.sub]
    );

    if (!rows[0]) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    await pool.execute(
      "DELETE FROM refresh_tokens WHERE token = ?",
      [refreshToken]
    );

    const user = { id: payload.sub };
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [payload.sub, newRefreshToken, refreshExpiry]
    );

    res.json({
      tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    await pool.execute("DELETE FROM refresh_tokens WHERE token = ?", [
      refreshToken
    ]);

    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
