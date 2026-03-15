const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { auditLog } = require("../utils/audit");
const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const { poId } = req.query;

    let query = `
      SELECT g.id, g.po_id, p.name AS po_name, g.name, g.platform, g.genre, g.status, g.launch_date
      FROM games g
      JOIN product_owners p ON p.id = g.po_id
    `;
    const params = [];

    if (poId) {
      query += ` WHERE g.po_id = $1`;
      params.push(poId);
    }

    query += ` ORDER BY g.id`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch games",
      error: error.message
    });
  }
});

router.post("/", authRequired, async (req, res) => {
  try {
    const { po_id, name, platform, genre, status, launch_date } = req.body;

    const result = await pool.query(
      `
      INSERT INTO games (po_id, name, platform, genre, status, launch_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [po_id, name, platform, genre, status, launch_date]
    );

    const g = result.rows[0];
    auditLog("GAME_ADD", `Added game "${g.name}" (${g.platform} · ${g.genre}) — status: ${g.status}`, req.user);

    res.status(201).json({
      success: true,
      data: g
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create game",
      error: error.message
    });
  }
});
router.put("/:id", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { po_id, name, platform, genre, status, launch_date } = req.body;

    const result = await pool.query(
      `
      UPDATE games
      SET po_id = $1,
          name = $2,
          platform = $3,
          genre = $4,
          status = $5,
          launch_date = $6
      WHERE id = $7
      RETURNING *
      `,
      [po_id, name, platform, genre, status, launch_date, id]
    );

    const g = result.rows[0];
    auditLog("GAME_EDIT", `Edited game "${g.name}" (${g.platform} · ${g.genre}) — status: ${g.status}`, req.user);

    res.json({
      success: true,
      data: g
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update game",
      error: error.message
    });
  }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE games
      SET status = 'Killed'
      WHERE id = $1
      `,
      [id]
    );

    auditLog("GAME_DELETE", `Archived game ID #${id}`, req.user);

    res.json({
      success: true,
      message: "Game archived successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to archive game",
      error: error.message
    });
  }
});

module.exports = router;