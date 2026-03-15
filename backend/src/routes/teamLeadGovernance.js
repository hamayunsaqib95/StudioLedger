const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
router.get("/:month", async (req, res) => {
  try {
    const monthKey = req.params.month;

    const result = await db.query(
      `
      SELECT
        tl.id AS team_lead_id,
        tl.full_name AS team_lead_name,
        tl.profit_share_pool_percent,

        COALESCE(SUM(po.profit_share_percent), 0) AS assigned_po_percent_total,
        tl.profit_share_pool_percent - COALESCE(SUM(po.profit_share_percent), 0) AS remaining_percent,

        COUNT(DISTINCT po.id) FILTER (WHERE po.status = 'Active') AS active_po_count
      FROM team_lead_profiles tl
      LEFT JOIN product_owners po
        ON po.team_lead_profile_id = tl.id
      GROUP BY
        tl.id,
        tl.full_name,
        tl.profit_share_pool_percent
      ORDER BY tl.full_name ASC
      `
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Team lead governance error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team lead governance data",
      error: err.message
    });
  }
});

router.get("/po-list/:teamLeadId", async (req, res) => {
  try {
    const { teamLeadId } = req.params;

    const result = await db.query(
      `
      SELECT
        po.id,
        COALESCE(po.full_name, po.name) AS po_name,
        po.monthly_salary,
        po.salary_currency,
        po.profit_share_percent,
        po.status
      FROM product_owners po
      WHERE po.team_lead_profile_id = $1
      ORDER BY COALESCE(po.full_name, po.name) ASC
      `,
      [teamLeadId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Team lead PO list error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PO list",
      error: err.message
    });
  }
});

router.post("/promote-to-po", async (req, res) => {
  try {
    const {
      employee_id,
      team_lead_profile_id,
      po_name,
      email,
      monthly_salary,
      salary_currency,
      profit_share_percent,
      effective_from,
      changed_by_user_id
    } = req.body;

    const poolResult = await db.query(
      `
      SELECT
        tl.profit_share_pool_percent,
        COALESCE(SUM(po.profit_share_percent), 0) AS assigned_total
      FROM team_lead_profiles tl
      LEFT JOIN product_owners po
        ON po.team_lead_profile_id = tl.id
       AND po.status = 'Active'
      WHERE tl.id = $1
      GROUP BY tl.id, tl.profit_share_pool_percent
      `,
      [team_lead_profile_id]
    );

    const pool = Number(poolResult.rows[0]?.profit_share_pool_percent || 0);
    const assigned = Number(poolResult.rows[0]?.assigned_total || 0);
    const requested = Number(profit_share_percent || 0);

    if (assigned + requested > pool) {
      return res.status(400).json({
        success: false,
        message: `Profit % exceeds Team Lead pool. Remaining allowed: ${(pool - assigned).toFixed(2)}%`
      });
    }

    const productOwnerRole = await db.query(
      `
      SELECT id
      FROM employee_roles
      WHERE role_name = 'Product Owner'
      LIMIT 1
      `
    );

    const poRoleId = productOwnerRole.rows[0]?.id || null;

    const oldRole = await db.query(
      `
      SELECT role_id
      FROM employees
      WHERE id = $1
      `,
      [employee_id]
    );

    await db.query(
      `
      UPDATE employees
      SET role_id = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [poRoleId, employee_id]
    );

    await db.query(
      `
      INSERT INTO employee_role_history (
        employee_id,
        old_role_id,
        new_role_id,
        changed_by_user_id,
        effective_from,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        employee_id,
        oldRole.rows[0]?.role_id || null,
        poRoleId,
        changed_by_user_id || null,
        effective_from,
        "Promoted to Product Owner"
      ]
    );

    const poInsert = await db.query(
      `
      INSERT INTO product_owners (
        employee_id,
        full_name,
        email,
        status,
        team_lead_profile_id,
        monthly_salary,
        salary_currency,
        profit_share_percent,
        profit_share_status,
        effective_from,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,'Active',$4,$5,$6,$7,'Active',$8,NOW(),NOW()
      )
      RETURNING *
      `,
      [
        employee_id,
        po_name,
        email,
        team_lead_profile_id,
        monthly_salary,
        salary_currency,
        profit_share_percent,
        effective_from
      ]
    );

    res.status(201).json({
      success: true,
      data: poInsert.rows[0]
    });
  } catch (err) {
    console.error("Promote to PO error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to promote employee to PO",
      error: err.message
    });
  }
});

module.exports = router;