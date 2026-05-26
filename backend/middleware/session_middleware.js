/* The logic of this file should:
1.  Check if req.session.userId exists
2.  Query user_session to find a session that belongs to that user where
    expires_at is in the future and is_mfa_verified = TRUE
3.  If nothing is found => respond with 401 unauthorized
4.  If found => call next() to let the request continue

*/

const pool = require('../db');

// req  := the incoming requests
// res  := the outgoing requests
// next := function to call the next middleware/route
const session_middleware = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // ── MFA CHECK (disabled) ───────────────────────────────────────────────
    // When MFA is re-enabled, uncomment the block below.
    // It queries User_Session to confirm the session exists, hasn't expired,
    // and that the user has completed MFA verification before proceeding.
    //
    // const result = await pool.query(
    //   'SELECT * FROM User_Session WHERE user_id = ? AND expires_at > NOW() AND is_mfa_verified = TRUE',
    //   [req.session.userId]
    // );
    // const rows = result[0];
    // if (!rows || rows.length === 0) {
    //   return res.status(401).json({ error: 'Session not found or MFA not verified' });
    // }
    // ── END MFA CHECK ──────────────────────────────────────────────────────

    next();
  } catch (error) {
    console.error("Session middleware error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = session_middleware;

// ── RE-ENABLING MFA (future) ───────────────────────────────────────────────
// When MFA is ready to be enforced:
//
// 1. Uncomment the User_Session query block above in session_middleware.
//
// 2. In verify_mfa.js — after MFA passes, insert into User_Session:
//      await pool.query(
//        `INSERT INTO User_Session (user_id, expires_at, is_mfa_verified, created_at)
//         VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), TRUE, NOW())
//         ON DUPLICATE KEY UPDATE
//           expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
//           is_mfa_verified = TRUE`,
//        [req.session.userId]
//      );
//
// 3. Re-enable requireAuth in setup_mfa.js and verfiy_recovery.js
//    (search for "requireAuth" — it's already written, just commented out).