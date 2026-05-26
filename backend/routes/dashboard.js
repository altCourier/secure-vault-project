const express = require("express");
const router = express.Router();
const db = require("../db");
const sessionMiddleware = require("../middleware/session_middleware");

// GET /api/session
router.get("/session", sessionMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT username FROM Users WHERE user_id = ?",
      [req.session.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      username: rows[0].username,
      ip: req.ip,
    });
  } catch (error) {
    console.error("Session route error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/audit-log
router.get("/audit-log", sessionMiddleware, async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT timestamp, event_code AS event_type, ip_address, user_agent, status
       FROM Audit_Log
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT 100`,
      [req.session.userId]
    );

    return res.json({ events });
  } catch (error) {
    console.error("Audit log route error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;