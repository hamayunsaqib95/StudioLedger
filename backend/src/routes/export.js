const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { Parser } = require("json2csv");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { getPoIdForUser, isLeadershipRole } = require("../utils/poAccess");

// ==============================
// GAME FINANCE EXPORT
// leadership: all games
// PO: own games only
// ==============================
router.get("/games/:month", authRequired, async (req, res) => {
  try {
    const month = req.params.month;

    let query = `
      SELECT
        g.name AS game,
        COALESCE(po.full_name, po.name) AS po,
        COALESCE(gfs.total_revenue, 0) AS revenue,
        COALESCE(gfs.ua_cost, 0) AS ua_spend,
        COALESCE(gfs.direct_team_cost, 0) AS team_cost,
        COALESCE(gfs.tool_cost, 0) AS tools,
        COALESCE(gfs.office_cost, 0) AS office_share,
        COALESCE(gfs.total_cost, 0) AS total_cost,
        COALESCE(gfs.profit, 0) AS profit
      FROM game_financial_snapshots gfs
      JOIN games g ON g.id = gfs.game_id
      LEFT JOIN product_owners po ON po.id = g.po_id
      WHERE gfs.month_key = $1
    `;

    const params = [month];

    if (!isLeadershipRole(req.user.role)) {
      const poId = await getPoIdForUser(req.user);

      if (!poId) {
        return res.status(403).json({
          success: false,
          message: "PO record not found for this user"
        });
      }

      params.push(poId);
      query += ` AND g.po_id = $2 `;
    }

    query += ` ORDER BY gfs.profit DESC `;

    const result = await db.query(query, params);

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.header("Content-Type", "text/csv");
    res.attachment(`games-finance-${month}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("Games CSV export error:", err);
    return res.status(500).json({ success: false, error: "CSV export failed" });
  }
});

// ==============================
// PO PROFITABILITY EXPORT
// leadership only
// ==============================
router.get(
  "/po/:month",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {
    try {
      const month = req.params.month;

      const result = await db.query(
        `
        SELECT
          po.id,
          COALESCE(po.full_name, po.name) AS po,
          COALESCE(SUM(gfs.total_revenue), 0) AS revenue,
          COALESCE(SUM(gfs.total_cost), 0) AS cost,
          COALESCE(SUM(gfs.profit), 0) AS profit
        FROM product_owners po
        LEFT JOIN games g ON g.po_id = po.id
        LEFT JOIN game_financial_snapshots gfs
          ON gfs.game_id = g.id
         AND gfs.month_key = $1
        GROUP BY po.id, COALESCE(po.full_name, po.name)
        ORDER BY profit DESC
        `,
        [month]
      );

      const parser = new Parser();
      const csv = parser.parse(result.rows);

      res.header("Content-Type", "text/csv");
      res.attachment(`po-profitability-${month}.csv`);
      return res.send(csv);
    } catch (err) {
      console.error("PO CSV export error:", err);
      return res.status(500).json({ success: false, error: "CSV export failed" });
    }
  }
);

// ==============================
// STUDIO SUMMARY EXPORT
// leadership only
// ==============================
router.get(
  "/studio/:month",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {
    try {
      const month = req.params.month;

      const result = await db.query(
        `
        SELECT
          COALESCE(SUM(total_revenue), 0) AS total_revenue,
          COALESCE(SUM(total_cost), 0) AS total_cost,
          COALESCE(SUM(profit), 0) AS total_profit
        FROM game_financial_snapshots
        WHERE month_key = $1
        `,
        [month]
      );

      const parser = new Parser();
      const csv = parser.parse(result.rows);

      res.header("Content-Type", "text/csv");
      res.attachment(`studio-summary-${month}.csv`);
      return res.send(csv);
    } catch (err) {
      console.error("Studio CSV export error:", err);
      return res.status(500).json({ success: false, error: "CSV export failed" });
    }
  }
);

// ==============================
// TEAM ALLOCATION EXPORT
// leadership only
// ==============================
router.get(
  "/allocations/:month",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {
    try {
      const month = req.params.month;

      const result = await db.query(
        `
        SELECT
          e.full_name AS employee,
          COALESCE(er.role_name, e.role, 'Unknown') AS role,
          g.name AS game,
          ea.allocation_percent,
          COALESCE(po.full_name, po.name) AS po
        FROM employee_allocations ea
        JOIN employees e ON e.id = ea.employee_id
        LEFT JOIN employee_roles er ON er.id = e.role_id
        LEFT JOIN games g ON g.id = ea.game_id
        LEFT JOIN product_owners po ON po.id = ea.po_id
        WHERE ea.month_key = $1
        ORDER BY employee ASC
        `,
        [month]
      );

      const parser = new Parser();
      const csv = parser.parse(result.rows);

      res.header("Content-Type", "text/csv");
      res.attachment(`team-allocations-${month}.csv`);
      return res.send(csv);
    } catch (err) {
      console.error("Allocations CSV export error:", err);
      return res.status(500).json({ success: false, error: "CSV export failed" });
    }
  }
);

module.exports = router;