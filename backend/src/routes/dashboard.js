const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { getPoIdForUser, isLeadershipRole } = require("../utils/poAccess");

const router = express.Router();

router.get("/po-summary/:poId/:monthKey", authRequired, async (req, res) => {
  try {
    const { monthKey } = req.params;
    let effectivePoId = Number(req.params.poId);

    if (!isLeadershipRole(req.user.role)) {
      const poId = await getPoIdForUser(req.user);

      if (!poId) {
        return res.status(403).json({
          success: false,
          message: "PO record not found for this user"
        });
      }

      effectivePoId = poId;
    }

    const poResult = await pool.query(
      `
      SELECT id, name, full_name, email, profit_share_percent, profit_share_status, monthly_salary, salary_currency
      FROM product_owners
      WHERE id = $1
      `,
      [effectivePoId]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product owner not found"
      });
    }

    const po = poResult.rows[0];

    const gamesResult = await pool.query(
      `
      SELECT id, name, status
      FROM games
      WHERE po_id = $1
      ORDER BY id
      `,
      [effectivePoId]
    );

    const rateResult = await pool.query(
      `
      SELECT usd_to_pkr
      FROM exchange_rates
      WHERE month_key = $1
      `,
      [monthKey]
    );

    const usdToPkr = rateResult.rows[0] ? Number(rateResult.rows[0].usd_to_pkr) : 280;

    const activeGames = gamesResult.rows.filter((g) =>
      ["Live", "Soft Launch", "In Development"].includes(g.status)
    );

    const gameIds = activeGames.map((g) => g.id);

    let totalRevenue = 0;
    let totalUa = 0;
    let totalToolCost = 0;
    let totalOfficeCost = 0;
    let totalTeamCost = 0;
    let poSalaryShareTotal = 0;

    if (gameIds.length > 0) {
      const revResult = await pool.query(
        `
        SELECT *
        FROM revenues
        WHERE month_key = $1 AND game_id = ANY($2::int[])
        `,
        [monthKey, gameIds]
      );

      revResult.rows.forEach((row) => {
        const total =
          Number(row.ad_revenue || 0) +
          Number(row.iap_revenue || 0) +
          Number(row.subscription_revenue || 0) +
          Number(row.other_revenue || 0);

        totalRevenue += row.currency === "USD" ? total * usdToPkr : total;
      });

      const uaResult = await pool.query(
        `
        SELECT amount, currency
        FROM ua_spends
        WHERE month_key = $1 AND game_id = ANY($2::int[])
        `,
        [monthKey, gameIds]
      );

      uaResult.rows.forEach((row) => {
        totalUa += row.currency === "USD"
          ? Number(row.amount || 0) * usdToPkr
          : Number(row.amount || 0);
      });

      const allocResult = await pool.query(
        `
        SELECT
          a.employee_id,
          a.game_id,
          a.allocation_percent,
          COALESCE(e.monthly_salary, e.monthly_salary_pkr, 0) AS salary_value
        FROM employee_allocations a
        JOIN employees e ON e.id = a.employee_id
        WHERE a.month_key = $1
          AND a.game_id = ANY($2::int[])
        `,
        [monthKey, gameIds]
      );

      allocResult.rows.forEach((row) => {
        totalTeamCost += (Number(row.salary_value) * Number(row.allocation_percent || 0)) / 100;
      });
    }

    const toolResult = await pool.query(
      `
      SELECT amount, currency
      FROM tool_costs
      WHERE month_key = $1 AND (po_id = $2 OR scope_type = 'AllPOs')
      `,
      [monthKey, effectivePoId]
    );

    toolResult.rows.forEach((row) => {
      totalToolCost += row.currency === "USD"
        ? Number(row.amount || 0) * usdToPkr
        : Number(row.amount || 0);
    });

    const officeResult = await pool.query(
      `
      SELECT amount, currency
      FROM office_expenses
      WHERE month_key = $1 AND (po_id = $2 OR scope_type = 'AllPOs')
      `,
      [monthKey, effectivePoId]
    );

    officeResult.rows.forEach((row) => {
      totalOfficeCost += row.currency === "USD"
        ? Number(row.amount || 0) * usdToPkr
        : Number(row.amount || 0);
    });

    if (activeGames.length > 0) {
      poSalaryShareTotal = Number(po.monthly_salary || 0);
    }

    const totalCost =
      totalUa +
      totalToolCost +
      totalOfficeCost +
      totalTeamCost +
      poSalaryShareTotal;

    const operatingProfit = totalRevenue - totalCost;
    const poIncentive =
      operatingProfit > 0 && po.profit_share_status === "Active"
        ? operatingProfit * (Number(po.profit_share_percent || 0) / 100)
        : 0;

    const finalProfit = operatingProfit - poIncentive;

    res.json({
      success: true,
      data: {
        po,
        monthKey,
        usdToPkr,
        totalGames: activeGames.length,
        totalRevenue,
        totalUa,
        totalToolCost,
        totalOfficeCost,
        totalTeamCost,
        poSalaryShareTotal,
        totalCost,
        operatingProfit,
        poIncentive,
        finalProfit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary",
      error: error.message
    });
  }
});

module.exports = router;