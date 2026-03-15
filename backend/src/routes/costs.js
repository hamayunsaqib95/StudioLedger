const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { ensureMonthUnlocked } = require("../middleware/monthLock");
const { calculateMonth } = require("../services/financeEngine");
const { auditLog } = require("../utils/audit");

const router = express.Router();

// Tool Costs
router.get("/tools", authRequired, async (req, res) => {
  try {
    const { poId, monthKey } = req.query;

    let query = `
      SELECT t.*, p.name AS po_name
      FROM tool_costs t
      JOIN product_owners p ON p.id = t.po_id
      WHERE 1=1
    `;
    const params = [];

    if (poId) {
      params.push(poId);
      query += ` AND t.po_id = $${params.length}`;
    }

    if (monthKey) {
      params.push(monthKey);
      query += ` AND t.month_key = $${params.length}`;
    }

    query += ` ORDER BY t.id DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tool costs",
      error: error.message
    });
  }
});

router.post("/tools", authRequired, ensureMonthUnlocked, async (req, res) => {
  try {
    const {
      month_key,
      po_id,
      scope,
      tool_name,
      amount,
      currency,
      billing_type,
      notes
    } = req.body;

    let createdRows = [];

    if (scope === "all") {
      const poResult = await pool.query(
        `SELECT id FROM product_owners WHERE status = 'Active' ORDER BY id`
      );

      for (const po of poResult.rows) {
        const result = await pool.query(
          `
          INSERT INTO tool_costs (month_key, po_id, tool_name, amount, currency, billing_type, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
          `,
          [month_key, po.id, tool_name, amount, currency, billing_type, notes]
        );
        createdRows.push(result.rows[0]);
      }
    } else {
      const result = await pool.query(
        `
        INSERT INTO tool_costs (month_key, po_id, tool_name, amount, currency, billing_type, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [month_key, po_id, tool_name, amount, currency, billing_type, notes]
      );
      createdRows.push(result.rows[0]);
    }

    calculateMonth(month_key).catch((err) => console.error("Finance recalc error:", err));

    const scopeLabel = scope === "all" ? "all POs" : `PO #${po_id}`;
    auditLog("COST_TOOL_ADD", `Tool cost "${tool_name}" ${amount} ${currency} for ${scopeLabel} — ${month_key}`, req.user);

    res.status(201).json({
      success: true,
      data: createdRows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create tool cost",
      error: error.message
    });
  }
});

// Office Expenses
router.get("/office", authRequired, async (req, res) => {
  try {
    const { poId, monthKey } = req.query;

    let query = `
      SELECT o.*, p.name AS po_name
      FROM office_expenses o
      JOIN product_owners p ON p.id = o.po_id
      WHERE 1=1
    `;
    const params = [];

    if (poId) {
      params.push(poId);
      query += ` AND o.po_id = $${params.length}`;
    }

    if (monthKey) {
      params.push(monthKey);
      query += ` AND o.month_key = $${params.length}`;
    }

    query += ` ORDER BY o.id DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch office expenses",
      error: error.message
    });
  }
});

router.post("/office", authRequired, ensureMonthUnlocked, async (req, res) => {
  try {
    const {
      month_key,
      po_id,
      scope,
      expense_type,
      amount,
      currency,
      notes
    } = req.body;

    let createdRows = [];

    if (scope === "all") {
      const poResult = await pool.query(
        `SELECT id FROM product_owners WHERE status = 'Active' ORDER BY id`
      );

      for (const po of poResult.rows) {
        const result = await pool.query(
          `
          INSERT INTO office_expenses (month_key, po_id, expense_type, amount, currency, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
          `,
          [month_key, po.id, expense_type, amount, currency, notes]
        );
        createdRows.push(result.rows[0]);
      }
    } else {
      const result = await pool.query(
        `
        INSERT INTO office_expenses (month_key, po_id, expense_type, amount, currency, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [month_key, po_id, expense_type, amount, currency, notes]
      );
      createdRows.push(result.rows[0]);
    }

    calculateMonth(month_key).catch((err) => console.error("Finance recalc error:", err));

    const scopeLabel = scope === "all" ? "all POs" : `PO #${po_id}`;
    auditLog("COST_OFFICE_ADD", `Office expense "${expense_type}" ${amount} ${currency} for ${scopeLabel} — ${month_key}`, req.user);

    res.status(201).json({
      success: true,
      data: createdRows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create office expense",
      error: error.message
    });
  }
});

module.exports = router;