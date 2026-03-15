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
      SELECT u.*, g.name AS game_name
      FROM ua_spends u
      JOIN games g ON g.id = u.game_id
      WHERE 1=1
    `;
    const params = [];

    if (monthKey) {
      params.push(monthKey);
      query += ` AND u.month_key = $${params.length}`;
    }

    if (gameId) {
      params.push(gameId);
      query += ` AND u.game_id = $${params.length}`;
    }

    if (!isLeadershipRole(req.user.role)) {
      const poId = await getPoIdForUser(req.user);

      if (!poId) {
        return res.json({ success: true, data: [] });
      }

      params.push(poId);
      query += ` AND g.po_id = $${params.length}`;
    }

    query += ` ORDER BY u.id DESC`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch UA spends",
      error: error.message
    });
  }
});

router.post("/", authRequired, ensureMonthUnlocked, async (req, res) => {
  try {
    const { month_key, game_id, channel, campaign_name, amount, currency, notes } = req.body;

    if (!isLeadershipRole(req.user.role)) {
      const allowed = await ensurePoOwnsGame(req.user, game_id);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You can only add UA for your own games"
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO ua_spends (month_key, game_id, channel, campaign_name, amount, currency, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [month_key, game_id, channel, campaign_name, amount, currency, notes]
    );

    calculateMonth(month_key).catch((err) => console.error("Finance recalc error:", err));

    const u = result.rows[0];
    const gameNameRes = await pool.query(`SELECT name FROM games WHERE id=$1`, [game_id]);
    const gameName = gameNameRes.rows[0]?.name || `#${game_id}`;
    auditLog(
      "UA_ADD",
      `UA spend for "${gameName}" ${month_key}: ${amount} ${currency} via ${channel}${campaign_name ? ` — "${campaign_name}"` : ""}`,
      req.user
    );

    res.status(201).json({ success: true, data: u });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create UA spend",
      error: error.message
    });
  }
});

module.exports = router;