const db = require("../config/db");

async function calculateMonth(monthKey) {
  // Fetch exchange rate for this month; fall back to 280 PKR/USD if not set
  const rateResult = await db.query(
    `SELECT usd_to_pkr FROM exchange_rates WHERE month_key = $1`,
    [monthKey]
  );
  const exchangeRate = Number(rateResult.rows[0]?.usd_to_pkr || 280);

  const games = await db.query(`
    SELECT g.id, g.po_id
    FROM games g
    WHERE g.status != 'Killed'
  `);

  for (const game of games.rows) {
    const gameId = game.id;
    const poId = game.po_id;

    // ── Team cost (salaries already in PKR) ──────────────────────────────
    const teamCostResult = await db.query(
      `
      SELECT SUM(COALESCE(e.monthly_salary, e.monthly_salary_pkr, 0) * a.allocation_percent / 100.0) AS cost
      FROM employee_allocations a
      JOIN employees e ON e.id = a.employee_id
      WHERE a.game_id = $1 AND a.month_key = $2
      `,
      [gameId, monthKey]
    );
    const directTeamCost = Number(teamCostResult.rows[0]?.cost || 0);

    // ── Role counts ────────────────────────────────────────────────────────
    const roleCountsResult = await db.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%dev%') AS dev_count,
        COUNT(*) FILTER (
          WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%artist%'
             OR LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%ui%'
        ) AS artist_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%qa%') AS qa_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(er.role_name, e.role, '')) LIKE '%marketing%') AS marketing_count,
        COUNT(*) AS total_team_members
      FROM employee_allocations a
      JOIN employees e ON e.id = a.employee_id
      LEFT JOIN employee_roles er ON er.id = e.role_id
      WHERE a.game_id = $1 AND a.month_key = $2
      `,
      [gameId, monthKey]
    );
    const devCount        = Number(roleCountsResult.rows[0]?.dev_count        || 0);
    const artistCount     = Number(roleCountsResult.rows[0]?.artist_count     || 0);
    const qaCount         = Number(roleCountsResult.rows[0]?.qa_count         || 0);
    const marketingCount  = Number(roleCountsResult.rows[0]?.marketing_count  || 0);
    const totalTeamMembers = Number(roleCountsResult.rows[0]?.total_team_members || 0);

    // ── UA spend – convert USD → PKR ────────────────────────────────────
    const uaResult = await db.query(
      `
      SELECT SUM(
        CASE WHEN UPPER(currency) = 'USD' THEN amount * $3 ELSE amount END
      ) AS cost
      FROM ua_spends
      WHERE game_id = $1 AND month_key = $2
      `,
      [gameId, monthKey, exchangeRate]
    );
    const ua = Number(uaResult.rows[0]?.cost || 0);

    // ── Tool costs – convert USD → PKR ───────────────────────────────────
    const toolResult = await db.query(
      `
      SELECT SUM(
        CASE WHEN UPPER(currency) = 'USD' THEN amount * $3 ELSE amount END
      ) AS cost
      FROM tool_costs
      WHERE po_id = $1 AND month_key = $2
      `,
      [poId, monthKey, exchangeRate]
    );
    const totalToolsForPo = Number(toolResult.rows[0]?.cost || 0);

    // ── Office expenses – convert USD → PKR ─────────────────────────────
    const officeResult = await db.query(
      `
      SELECT SUM(
        CASE WHEN UPPER(currency) = 'USD' THEN amount * $3 ELSE amount END
      ) AS cost
      FROM office_expenses
      WHERE po_id = $1 AND month_key = $2
      `,
      [poId, monthKey, exchangeRate]
    );
    const totalOfficeForPo = Number(officeResult.rows[0]?.cost || 0);

    // ── PO salary (PKR) ──────────────────────────────────────────────────
    const poSalaryResult = await db.query(
      `SELECT COALESCE(monthly_salary, 0) AS monthly_salary FROM product_owners WHERE id = $1`,
      [poId]
    );
    const poSalary = Number(poSalaryResult.rows[0]?.monthly_salary || 0);

    const gameCountResult = await db.query(
      `SELECT COUNT(*) AS count FROM games WHERE po_id = $1 AND status != 'Killed'`,
      [poId]
    );
    const activeGameCount = Number(gameCountResult.rows[0]?.count || 1);

    const poSalaryShare = poSalary / activeGameCount;
    const toolShare     = totalToolsForPo / activeGameCount;
    const officeShare   = totalOfficeForPo / activeGameCount;

    // ── Revenue – convert USD → PKR ──────────────────────────────────────
    const revenueResult = await db.query(
      `
      SELECT
        COALESCE(ad_revenue, 0)           AS ad_revenue,
        COALESCE(iap_revenue, 0)          AS iap_revenue,
        COALESCE(subscription_revenue, 0) AS subscription_revenue,
        COALESCE(other_revenue, 0)        AS other_revenue,
        COALESCE(currency, 'USD')         AS currency
      FROM revenues
      WHERE game_id = $1 AND month_key = $2
      `,
      [gameId, monthKey]
    );

    let adRevenue = 0, iapRevenue = 0, subscriptionRevenue = 0, otherRevenue = 0;
    if (revenueResult.rows[0]) {
      const rev  = revenueResult.rows[0];
      const rate = rev.currency.toUpperCase() === "USD" ? exchangeRate : 1;
      adRevenue           = Number(rev.ad_revenue)           * rate;
      iapRevenue          = Number(rev.iap_revenue)          * rate;
      subscriptionRevenue = Number(rev.subscription_revenue) * rate;
      otherRevenue        = Number(rev.other_revenue)        * rate;
    }

    const totalRevenue = adRevenue + iapRevenue + subscriptionRevenue + otherRevenue;
    const totalCost    = directTeamCost + ua + toolShare + officeShare + poSalaryShare;
    const profit       = totalRevenue - totalCost;

    // ── Upsert snapshot ─────────────────────────────────────────────────
    await db.query(
      `
      INSERT INTO game_financial_snapshots (
        month_key, game_id,
        dev_count, artist_count, qa_count, marketing_count, total_team_members,
        direct_team_cost, tool_cost, office_cost, ua_cost, po_salary_share, total_cost,
        ad_revenue, iap_revenue, subscription_revenue, other_revenue, total_revenue, profit
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (month_key, game_id) DO UPDATE SET
        dev_count           = EXCLUDED.dev_count,
        artist_count        = EXCLUDED.artist_count,
        qa_count            = EXCLUDED.qa_count,
        marketing_count     = EXCLUDED.marketing_count,
        total_team_members  = EXCLUDED.total_team_members,
        direct_team_cost    = EXCLUDED.direct_team_cost,
        tool_cost           = EXCLUDED.tool_cost,
        office_cost         = EXCLUDED.office_cost,
        ua_cost             = EXCLUDED.ua_cost,
        po_salary_share     = EXCLUDED.po_salary_share,
        total_cost          = EXCLUDED.total_cost,
        ad_revenue          = EXCLUDED.ad_revenue,
        iap_revenue         = EXCLUDED.iap_revenue,
        subscription_revenue = EXCLUDED.subscription_revenue,
        other_revenue       = EXCLUDED.other_revenue,
        total_revenue       = EXCLUDED.total_revenue,
        profit              = EXCLUDED.profit
      `,
      [
        monthKey, gameId,
        devCount, artistCount, qaCount, marketingCount, totalTeamMembers,
        directTeamCost, toolShare, officeShare, ua, poSalaryShare, totalCost,
        adRevenue, iapRevenue, subscriptionRevenue, otherRevenue, totalRevenue, profit
      ]
    );
  }
}

module.exports = { calculateMonth };
