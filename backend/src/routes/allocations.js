const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { auditLog } = require("../utils/audit");
router.get(
    "/:month",
    authRequired,
    allowRoles("CEO", "COO", "Team Lead"),
    async (req, res) => {
          try {
    const monthKey = req.params.month;

    const result = await db.query(
      `
      SELECT
        ea.id,
        ea.month_key,
        ea.employee_id,
        e.full_name AS employee_name,
        COALESCE(er.role_name, e.role, 'Unknown') AS role_name,
        ea.allocation_scope,
        ea.po_id,
        COALESCE(po.full_name, po.name) AS po_name,
        ea.game_id,
        g.name AS game_name,
        ea.allocation_percent,
        ea.notes
      FROM employee_allocations ea
      JOIN employees e ON e.id = ea.employee_id
      LEFT JOIN employee_roles er ON er.id = e.role_id
      LEFT JOIN product_owners po ON po.id = ea.po_id
      LEFT JOIN games g ON g.id = ea.game_id
      WHERE ea.month_key = $1
      ORDER BY e.full_name ASC, ea.id DESC
      `,
      [monthKey]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Allocation list error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch allocations",
      error: err.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      month_key,
      employee_id,
      allocation_scope,
      po_id,
      game_id,
      allocation_percent,
      notes
    } = req.body;

    const result = await db.query(
      `
      INSERT INTO employee_allocations (
        month_key,
        employee_id,
        allocation_scope,
        po_id,
        game_id,
        allocation_percent,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      RETURNING *
      `,
      [
        month_key,
        employee_id,
        allocation_scope,
        po_id || null,
        game_id || null,
        allocation_percent,
        notes || null
      ]
    );

    const a = result.rows[0];
    // Fetch game/po names for detail
    const gameRes = a.game_id ? await db.query(`SELECT name FROM games WHERE id=$1`, [a.game_id]) : null;
    const gameName = gameRes?.rows[0]?.name || "—";
    auditLog(
      "ASSIGNMENT_ADD",
      `Assigned employee #${a.employee_id} to game "${gameName}" at ${a.allocation_percent}% (${a.allocation_scope}) for ${a.month_key}`,
      req.user
    );

    res.status(201).json({
      success: true,
      data: a
    });
  } catch (err) {
    console.error("Allocation create error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create allocation",
      error: err.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      allocation_scope,
      po_id,
      game_id,
      allocation_percent,
      notes
    } = req.body;

    const result = await db.query(
      `
      UPDATE employee_allocations
      SET
        allocation_scope = $1,
        po_id = $2,
        game_id = $3,
        allocation_percent = $4,
        notes = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [
        allocation_scope,
        po_id || null,
        game_id || null,
        allocation_percent,
        notes || null,
        id
      ]
    );

    const a = result.rows[0];
    auditLog("ASSIGNMENT_EDIT", `Updated allocation #${id} to ${a.allocation_percent}% (${a.allocation_scope})`, req.user);

    res.json({
      success: true,
      data: a
    });
  } catch (err) {
    console.error("Allocation update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update allocation",
      error: err.message
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM employee_allocations WHERE id = $1`, [id]);

    auditLog("ASSIGNMENT_DELETE", `Removed allocation #${id}`, req.user);

    res.json({
      success: true,
      message: "Allocation deleted"
    });
  } catch (err) {
    console.error("Allocation delete error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete allocation",
      error: err.message
    });
  }
});

module.exports = router;