const db = require("../config/db");

/**
 * Insert a row into audit_logs (fire-and-forget — never throws).
 * @param {string} actionType  e.g. "GAME_ADD"
 * @param {string} detail      Human-readable description
 * @param {object} user        req.user (has fullName / email / role)
 */
async function auditLog(actionType, detail, user) {
  try {
    const actor = user
      ? `${user.fullName || user.email} (${user.role})`
      : "System";
    await db.query(
      `INSERT INTO audit_logs (action_type, action_detail, actor, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [actionType, detail, actor]
    );
  } catch (err) {
    console.error("Audit log write error:", err.message);
  }
}

module.exports = { auditLog };
