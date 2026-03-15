const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { getPoIdForUser, isLeadershipRole } = require("../utils/poAccess");

router.get("/:month", authRequired, async (req, res) => {
  try {
    const monthKey = req.params.month;

    // Exchange rate for the month (fall back to 280)
    const rateResult = await db.query(
      `SELECT usd_to_pkr FROM exchange_rates WHERE month_key = $1`,
      [monthKey]
    );
    const exchangeRate = Number(rateResult.rows[0]?.usd_to_pkr || 280);

    // Fetch all active games (optionally filtered by PO)
    let gameQuery = `
      SELECT g.id AS game_id, g.po_id, g.name AS game_name, g.platform, g.genre, g.status,
             COALESCE(po.full_name, po.name) AS po_name
      FROM games g
      LEFT JOIN product_owners po ON po.id = g.po_id
      WHERE g.status != 'Killed'
    `;
    const gameParams = [];

    if (!isLeadershipRole(req.user.role)) {
      const poId = await getPoIdForUser(req.user);
      if (!poId) return res.json({ success: true, data: [] });
      gameParams.push(poId);
      gameQuery += ` AND g.po_id = $1`;
    }

    gameQuery += ` ORDER BY g.name ASC`;
    const gamesResult = await db.query(gameQuery, gameParams);
    const games = gamesResult.rows;

    const results = [];

    for (const game of games) {
      const gameId = game.game_id;
      const poId   = game.po_id;

      // Active game count for this PO (for cost sharing)
      const gcResult = await db.query(
        `SELECT COUNT(*) AS cnt FROM games WHERE po_id = $1 AND status != 'Killed'`,
        [poId]
      );
      const activeGameCount = Math.max(1, Number(gcResult.rows[0]?.cnt || 1));

      // ── Team cost (PKR) ────────────────────────────────────────────────
      const teamResult = await db.query(
        `SELECT COALESCE(SUM(
           COALESCE(e.monthly_salary, e.monthly_salary_pkr, 0) * a.allocation_percent / 100.0
         ), 0) AS cost
         FROM employee_allocations a
         JOIN employees e ON e.id = a.employee_id
         WHERE a.game_id = $1 AND a.month_key = $2`,
        [gameId, monthKey]
      );
      const directTeamCost = Number(teamResult.rows[0]?.cost || 0);

      // ── Role counts ────────────────────────────────────────────────────
      const rcResult = await db.query(
        `SELECT
           COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%dev%') AS dev_count,
           COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%artist%'
                               OR LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%ui%') AS artist_count,
           COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%qa%') AS qa_count,
           COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%marketing%') AS marketing_count,
           COUNT(*) AS total_team_members
         FROM employee_allocations a
         JOIN employees e ON e.id = a.employee_id
         LEFT JOIN employee_roles er ON er.id = e.role_id
         WHERE a.game_id = $1 AND a.month_key = $2`,
        [gameId, monthKey]
      );
      const rc = rcResult.rows[0] || {};

      // ── UA cost → PKR ──────────────────────────────────────────────────
      const uaResult = await db.query(
        `SELECT COALESCE(SUM(
           CASE WHEN UPPER(currency) = 'USD' THEN amount * $3 ELSE amount END
         ), 0) AS cost
         FROM ua_spends
         WHERE game_id = $1 AND month_key = $2`,
        [gameId, monthKey, exchangeRate]
      );
      const uaCost = Number(uaResult.rows[0]?.cost || 0);

      // ── Tool cost → PKR (shared across PO games) ───────────────────────
      const toolResult = await db.query(
        `SELECT COALESCE(SUM(
           CASE WHEN UPPER(currency) = 'USD' THEN amount * $3 ELSE amount END
         ), 0) AS cost
         FROM tool_costs
         WHERE po_id = $1 AND month_key = $2`,
        [poId, monthKey, exchangeRate]
      );
      const toolCost = Number(toolResult.rows[0]?.cost || 0) / activeGameCount;

      // ── Office cost → PKR (shared across PO games) ────────────────────
      const officeResult = await db.query(
        `SELECT COALESCE(SUM(
           CASE WHEN UPPER(currency) = 'USD' THEN amount * $3 ELSE amount END
         ), 0) AS cost
         FROM office_expenses
         WHERE po_id = $1 AND month_key = $2`,
        [poId, monthKey, exchangeRate]
      );
      const officeCost = Number(officeResult.rows[0]?.cost || 0) / activeGameCount;

      // ── PO salary share (PKR) ─────────────────────────────────────────
      const poResult = await db.query(
        `SELECT COALESCE(monthly_salary, 0) AS monthly_salary FROM product_owners WHERE id = $1`,
        [poId]
      );
      const poSalaryShare = Number(poResult.rows[0]?.monthly_salary || 0) / activeGameCount;

      // ── Revenue → PKR ─────────────────────────────────────────────────
      const revResult = await db.query(
        `SELECT
           COALESCE(ad_revenue, 0)           AS ad_revenue,
           COALESCE(iap_revenue, 0)          AS iap_revenue,
           COALESCE(subscription_revenue, 0) AS subscription_revenue,
           COALESCE(other_revenue, 0)        AS other_revenue,
           COALESCE(currency, 'USD')         AS currency
         FROM revenues
         WHERE game_id = $1 AND month_key = $2`,
        [gameId, monthKey]
      );

      let adRevenue = 0, iapRevenue = 0, subRevenue = 0, otherRevenue = 0;
      if (revResult.rows[0]) {
        const rev  = revResult.rows[0];
        const rate = rev.currency.toUpperCase() === "USD" ? exchangeRate : 1;
        adRevenue   = Number(rev.ad_revenue)           * rate;
        iapRevenue  = Number(rev.iap_revenue)          * rate;
        subRevenue  = Number(rev.subscription_revenue) * rate;
        otherRevenue = Number(rev.other_revenue)       * rate;
      }

      const totalRevenue = adRevenue + iapRevenue + subRevenue + otherRevenue;
      const totalCost    = directTeamCost + uaCost + toolCost + officeCost + poSalaryShare;
      const profit       = totalRevenue - totalCost;

      results.push({
        game_id:            gameId,
        game_name:          game.game_name,
        platform:           game.platform,
        genre:              game.genre,
        status:             game.status,
        po_name:            game.po_name,
        dev_count:          Number(rc.dev_count       || 0),
        artist_count:       Number(rc.artist_count    || 0),
        qa_count:           Number(rc.qa_count        || 0),
        marketing_count:    Number(rc.marketing_count || 0),
        total_team_members: Number(rc.total_team_members || 0),
        direct_team_cost:   directTeamCost,
        tool_cost:          toolCost,
        office_cost:        officeCost,
        ua_cost:            uaCost,
        po_salary_share:    poSalaryShare,
        total_cost:         totalCost,
        ad_revenue:         adRevenue,
        iap_revenue:        iapRevenue,
        subscription_revenue: subRevenue,
        other_revenue:      otherRevenue,
        total_revenue:      totalRevenue,
        profit:             profit
      });
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Game analytics error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch game analytics",
      error: err.message
    });
  }
});

module.exports = router;
