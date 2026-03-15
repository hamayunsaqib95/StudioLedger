const express = require("express");
const pool = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const router = express.Router();

router.get(
  "/",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {
      try {
    const { poId } = req.query;

    let query = `
      SELECT e.id, e.full_name, e.role, e.monthly_salary_pkr, e.employment_type, e.assigned_po, p.name AS po_name, e.status
      FROM employees e
      LEFT JOIN product_owners p ON p.id = e.assigned_po
    `;
    const params = [];

    if (poId) {
      query += ` WHERE e.assigned_po = $1`;
      params.push(poId);
    }

    query += ` ORDER BY e.id`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message
    });
  }
});

router.post(
  "/",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {
      try {
    const {
      full_name,
      role,
      monthly_salary_pkr,
      employment_type,
      assigned_po,
      status
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO employees (full_name, role, monthly_salary_pkr, employment_type, assigned_po, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [full_name, role, monthly_salary_pkr, employment_type, assigned_po, status || "Active"]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error.message
    });
  }
});
router.put(
  "/:id",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {  try {
    const { id } = req.params;
    const {
      full_name,
      role,
      monthly_salary_pkr,
      employment_type,
      assigned_po,
      status
    } = req.body;

    const result = await pool.query(
      `
      UPDATE employees
      SET full_name = $1,
          role = $2,
          monthly_salary_pkr = $3,
          employment_type = $4,
          assigned_po = $5,
          status = $6
      WHERE id = $7
      RETURNING *
      `,
      [full_name, role, monthly_salary_pkr, employment_type, assigned_po, status, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error.message
    });
  }
});

// Employee tracking history — all allocation records across all months
router.get("/:id/history", authRequired, async (req, res) => {
  try {
    const { id } = req.params;

    // Employee profile
    const empResult = await pool.query(
      `SELECT e.id, e.full_name, e.role, e.monthly_salary_pkr, e.employment_type, e.status,
              COALESCE(po.full_name, po.name) AS po_name, po.id AS po_id
       FROM employees e
       LEFT JOIN product_owners po ON po.id = e.assigned_po
       WHERE e.id = $1`,
      [id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // All allocations ordered newest first
    const allocResult = await pool.query(
      `SELECT
         ea.id,
         ea.month_key,
         ea.allocation_scope,
         ea.allocation_percent,
         ea.notes,
         g.id AS game_id,
         g.name AS game_name,
         g.platform AS game_platform,
         g.status AS game_status,
         COALESCE(po.full_name, po.name) AS po_name
       FROM employee_allocations ea
       LEFT JOIN games g ON g.id = ea.game_id
       LEFT JOIN product_owners po ON po.id = ea.po_id
         OR (ea.po_id IS NULL AND po.id = (SELECT assigned_po FROM employees WHERE id = $1))
       WHERE ea.employee_id = $1
       ORDER BY ea.month_key DESC, ea.id DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        employee: empResult.rows[0],
        history: allocResult.rows
      }
    });
  } catch (err) {
    console.error("Employee history error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch employee history", error: err.message });
  }
});

router.delete(
  "/:id",
  authRequired,
  allowRoles("CEO", "COO", "Team Lead"),
  async (req, res) => {
      try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE employees
      SET status = 'Inactive'
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Employee deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate employee",
      error: error.message
    });
  }
});
module.exports = router;