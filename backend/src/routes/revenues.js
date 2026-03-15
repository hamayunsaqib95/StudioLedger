const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { ensureMonthUnlocked } = require("../middleware/monthLock");
const { getPoIdForUser, isLeadershipRole, ensurePoOwnsGame } = require("../utils/poAccess");
const { calculateMonth } = require("../services/financeEngine");
const { auditLog } = require("../utils/audit");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const { monthKey, gameId } = req.query;

    let query = `
      SELECT r.*, g.name AS game_name
      FROM revenues r
      JOIN games g ON g.id = r.game_id
      WHERE 1=1
    `;
    const params = [];

    if (monthKey) {
      params.push(monthKey);
      query += ` AND r.month_key = $${params.length}`;
    }

    if (gameId) {
      params.push(gameId);
      query += ` AND r.game_id = $${params.length}`;
    }

    if (!isLeadershipRole(req.user.role)) {
      const poId = await getPoIdForUser(req.user);

      if (!poId) {
        return res.json({ success: true, data: [] });
      }

      params.push(poId);
      query += ` AND g.po_id = $${params.length}`;
    }

    query += ` ORDER BY r.id DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenues",
      error: error.message
    });
  }
});

router.post("/", authRequired, ensureMonthUnlocked, async (req, res) => {
  try {
    const {
      month_key,
      game_id,
      platform,
      ad_revenue,
      iap_revenue,
      subscription_revenue,
      other_revenue,
      currency
    } = req.body;

    if (!isLeadershipRole(req.user.role)) {
      const allowed = await ensurePoOwnsGame(req.user, game_id);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You can only save revenue for your own games"
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO revenues (
        month_key, game_id, platform, ad_revenue, iap_revenue, subscription_revenue, other_revenue, currency
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (month_key, game_id)
      DO UPDATE SET
        platform = EXCLUDED.platform,
        ad_revenue = EXCLUDED.ad_revenue,
        iap_revenue = EXCLUDED.iap_revenue,
        subscription_revenue = EXCLUDED.subscription_revenue,
        other_revenue = EXCLUDED.other_revenue,
        currency = EXCLUDED.currency
      RETURNING *
      `,
      [month_key, game_id, platform, ad_revenue, iap_revenue, subscription_revenue, other_revenue, currency]
    );

    calculateMonth(month_key).catch((err) => console.error("Finance recalc error:", err));

    const r = result.rows[0];
    const gameNameRes = await pool.query(`SELECT name FROM games WHERE id=$1`, [game_id]);
    const gameName = gameNameRes.rows[0]?.name || `#${game_id}`;
    const total = Number(ad_revenue||0) + Number(iap_revenue||0) + Number(subscription_revenue||0) + Number(other_revenue||0);
    auditLog(
      "REVENUE_SAVE",
      `Saved revenue for "${gameName}" ${month_key}: AD ${ad_revenue||0} + IAP ${iap_revenue||0} + Sub ${subscription_revenue||0} + Other ${other_revenue||0} = ${total} ${currency}`,
      req.user
    );

    res.status(201).json({ success: true, data: r });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save revenue",
      error: error.message
    });
  }
});

module.exports = router;