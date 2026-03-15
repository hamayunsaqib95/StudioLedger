const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { ensureMonthUnlocked } = require("../middleware/monthLock");
const router = express.Router();
const { allowRoles } = require("../middleware/roles");
router.get("/games", authRequired, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT gt.*, g.name AS game_name, p1.name AS from_po_name, p2.name AS to_po_name
      FROM game_transfers gt
      JOIN games g ON g.id = gt.game_id
      JOIN product_owners p1 ON p1.id = gt.from_po
      JOIN product_owners p2 ON p2.id = gt.to_po
      ORDER BY gt.id DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch game transfers", error: error.message });
  }
});

router.post("/games", authRequired, ensureMonthUnlocked, async (req, res) => {  
    try {
    const { game_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by } = req.body;

    const transfer = await pool.query(
      `
      INSERT INTO game_transfers (game_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [game_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by]
    );

    await pool.query(
      `UPDATE games SET po_id = $1 WHERE id = $2`,
      [to_po, game_id]
    );

    await pool.query(
      `INSERT INTO audit_logs (action_type, action_detail, actor) VALUES ($1,$2,$3)`,
      ["Game Transfer", `Game ${game_id} transferred from PO ${from_po} to PO ${to_po}`, created_by || "System"]
    );

    res.status(201).json({ success: true, data: transfer.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to transfer game", error: error.message });
  }
});

router.get("/employees", authRequired, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT et.*, e.full_name AS employee_name, p1.name AS from_po_name, p2.name AS to_po_name
      FROM employee_transfers et
      JOIN employees e ON e.id = et.employee_id
      JOIN product_owners p1 ON p1.id = et.from_po
      JOIN product_owners p2 ON p2.id = et.to_po
      ORDER BY et.id DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch employee transfers", error: error.message });
  }
});

router.post("/employees", authRequired, ensureMonthUnlocked, async (req, res) => {  
    try {
    const { employee_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by } = req.body;

    const transfer = await pool.query(
      `
      INSERT INTO employee_transfers (employee_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [employee_id, from_po, to_po, effective_month, transfer_reason, approved_by, created_by]
    );

    await pool.query(
      `UPDATE employees SET assigned_po = $1 WHERE id = $2`,
      [to_po, employee_id]
    );

    await pool.query(
      `INSERT INTO audit_logs (action_type, action_detail, actor) VALUES ($1,$2,$3)`,
      ["Employee Transfer", `Employee ${employee_id} transferred from PO ${from_po} to PO ${to_po}`, created_by || "System"]
    );

    res.status(201).json({ success: true, data: transfer.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to transfer employee", error: error.message });
  }
});

module.exports = router;