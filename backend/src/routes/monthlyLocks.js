const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const router = express.Router();

router.get("/", authRequired, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM monthly_locks
      ORDER BY month_key DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch monthly locks", error: error.message });
  }
});

router.post("/toggle", authRequired, async (req, res) => {
  try {
    const { month_key, is_locked, locked_by } = req.body;

    const result = await pool.query(
      `
      INSERT INTO monthly_locks (month_key, is_locked, locked_by, locked_at)
      VALUES ($1,$2,$3, CASE WHEN $2 = true THEN NOW() ELSE NULL END)
      ON CONFLICT (month_key)
      DO UPDATE SET
        is_locked = EXCLUDED.is_locked,
        locked_by = EXCLUDED.locked_by,
        locked_at = CASE WHEN EXCLUDED.is_locked = true THEN NOW() ELSE NULL END
      RETURNING *
      `,
      [month_key, is_locked, locked_by || "System"]
    );

    await pool.query(
      `INSERT INTO audit_logs (action_type, action_detail, actor) VALUES ($1,$2,$3)`,
      ["Monthly Lock Updated", `Month ${month_key} lock changed to ${is_locked}`, locked_by || "System"]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update month lock", error: error.message });
  }
});

module.exports = router;