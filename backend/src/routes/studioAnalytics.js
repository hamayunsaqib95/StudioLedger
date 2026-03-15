const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
router.get(
    "/:month",
    authRequired,
    allowRoles("CEO", "COO", "Team Lead"),
    async (req, res) => {
          try {
    const monthKey = req.params.month;

    const totals = await db.query(
      `
      SELECT
        COALESCE(SUM(total_revenue), 0) AS total_revenue,
        COALESCE(SUM(total_cost), 0) AS total_cost,
        COALESCE(SUM(profit), 0) AS total_profit
      FROM game_financial_snapshots
      WHERE month_key = $1
      `,
      [monthKey]
    );

    const gameBreakdown = await db.query(
      `
      SELECT
        gfs.game_id,
        g.name AS game_name,
        COALESCE(po.full_name, po.name) AS po_name,
        gfs.total_revenue,
        gfs.total_cost,
        gfs.profit
      FROM game_financial_snapshots gfs
      JOIN games g ON g.id = gfs.game_id
      LEFT JOIN product_owners po ON po.id = g.po_id
      WHERE gfs.month_key = $1
      ORDER BY gfs.profit DESC
      `,
      [monthKey]
    );

    const poBreakdown = await db.query(
      `
      SELECT
        po.id AS po_id,
        COALESCE(po.full_name, po.name) AS po_name,
        COALESCE(SUM(gfs.total_revenue), 0) AS total_revenue,
        COALESCE(SUM(gfs.total_cost), 0) AS total_cost,
        COALESCE(SUM(gfs.profit), 0) AS total_profit
      FROM product_owners po
      LEFT JOIN games g ON g.po_id = po.id
      LEFT JOIN game_financial_snapshots gfs
        ON gfs.game_id = g.id
       AND gfs.month_key = $1
      GROUP BY po.id, COALESCE(po.full_name, po.name)
      ORDER BY total_profit DESC
      `,
      [monthKey]
    );

    res.json({
      success: true,
      data: {
        summary: totals.rows[0],
        games: gameBreakdown.rows,
        pos: poBreakdown.rows
      }
    });
  } catch (err) {
    console.error("Studio analytics error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch studio analytics",
      error: err.message
    });
  }
});

module.exports = router;