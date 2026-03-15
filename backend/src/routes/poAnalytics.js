const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
router.get("/:month", async (req, res) => {
  try {
    const monthKey = req.params.month;

    const result = await db.query(
      `
      SELECT
        po.id AS po_id,
        COALESCE(po.full_name, po.name) AS po_name,
        po.full_name,
        po.email,
        po.monthly_salary,
        po.salary_currency,
        po.profit_share_percent,
        po.status,
        po.team_lead_profile_id,
        tl.full_name AS team_lead_name,
        tl.profit_share_pool_percent AS team_lead_pool_percent,
        COUNT(DISTINCT g.id) FILTER (WHERE g.status != 'Killed') AS active_game_count,
        COALESCE(SUM(gfs.total_revenue), 0) AS total_revenue,
        COALESCE(SUM(gfs.total_cost), 0) AS total_cost,
        COALESCE(SUM(gfs.profit), 0) AS profit_before_incentive,
        CASE
          WHEN COALESCE(SUM(gfs.profit), 0) > 0
          THEN COALESCE(SUM(gfs.profit), 0) * COALESCE(po.profit_share_percent, 0) / 100.0
          ELSE 0
        END AS incentive_amount,
        CASE
          WHEN COALESCE(SUM(gfs.profit), 0) > 0
          THEN COALESCE(SUM(gfs.profit), 0) - (COALESCE(SUM(gfs.profit), 0) * COALESCE(po.profit_share_percent, 0) / 100.0)
          ELSE COALESCE(SUM(gfs.profit), 0)
        END AS final_profit
      FROM product_owners po
      LEFT JOIN team_lead_profiles tl ON tl.id = po.team_lead_profile_id
      LEFT JOIN games g ON g.po_id = po.id
      LEFT JOIN game_financial_snapshots gfs
        ON gfs.game_id = g.id
       AND gfs.month_key = $1
      GROUP BY
        po.id,
        COALESCE(po.full_name, po.name),
        po.full_name,
        po.email,
        po.monthly_salary,
        po.salary_currency,
        po.profit_share_percent,
        po.status,
        po.team_lead_profile_id,
        tl.full_name,
        tl.profit_share_pool_percent
      ORDER BY COALESCE(po.full_name, po.name) ASC
      `,
      [monthKey]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("PO analytics error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PO analytics",
      error: err.message
    });
  }
});

module.exports = router;