const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const { category, search } = req.query;

    const categoryMap = {
      games:       ["GAME_ADD", "GAME_EDIT", "GAME_DELETE"],
      assignments: ["ASSIGNMENT_ADD", "ASSIGNMENT_EDIT", "ASSIGNMENT_DELETE"],
      revenue:     ["REVENUE_SAVE"],
      costs:       ["COST_TOOL_ADD", "COST_OFFICE_ADD"],
      ua:          ["UA_ADD"]
    };

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (category && categoryMap[category]) {
      params.push(categoryMap[category]);
      query += ` AND action_type = ANY($${params.length})`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (action_type ILIKE $${params.length} OR action_detail ILIKE $${params.length} OR actor ILIKE $${params.length})`;
    }

    query += ` ORDER BY id DESC LIMIT 500`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch audit logs", error: error.message });
  }
});

module.exports = router;
