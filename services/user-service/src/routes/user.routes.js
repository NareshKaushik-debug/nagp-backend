const express = require("express");
const { pool } = require("../db/mysql");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
