const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET all product owners
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        po.id,
        po.user_id,
        po.name,
        COALESCE(po.full_name, po.name) AS po_name,
        po.full_name,
        po.email,
        po.monthly_salary,
        po.salary_currency,
        po.profit_share_percent,
        po.profit_share_status,
        po.status,
        po.team_lead_profile_id,
        tl.full_name AS team_lead_name
      FROM product_owners po
      LEFT JOIN team_lead_profiles tl
        ON tl.id = po.team_lead_profile_id
      ORDER BY COALESCE(po.full_name, po.name) ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("PO list error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product owners"
    });
  }
});

// CREATE PO directly from PO modal
router.post("/", async (req, res) => {
  try {
    const {
      full_name,
      email,
      team_lead_profile_id,
      monthly_salary,
      salary_currency,
      profit_share_percent,
      status
    } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required"
      });
    }

    const existing = await db.query(
      `SELECT id FROM product_owners WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A Product Owner with this email already exists"
      });
    }

    // try to link matching user if exists
    const userRes = await db.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    const userId = userRes.rows[0]?.id || null;

    const result = await db.query(
      `
      INSERT INTO product_owners (
        name,
        full_name,
        email,
        user_id,
        team_lead_profile_id,
        monthly_salary,
        salary_currency,
        profit_share_percent,
        profit_share_status,
        status,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      RETURNING *
      `,
      [
        full_name,                       // old required field
        full_name,
        email,
        userId,
        team_lead_profile_id || null,
        Number(monthly_salary || 0),
        salary_currency || "PKR",
        Number(profit_share_percent || 0),
        "Active",
        status || "Active"
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("PO create error:", err);
    res.status(500).json({
      success: false,
      message: "Create PO failed",
      error: err.message
    });
  }
});

// UPDATE PO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      full_name,
      email,
      monthly_salary,
      salary_currency,
      profit_share_percent,
      team_lead_profile_id,
      team_lead_pool_percent,
      status
    } = req.body;

    const currentRes = await db.query(
      `SELECT * FROM product_owners WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product Owner not found"
      });
    }

    const current = currentRes.rows[0];

    const nextFullName = full_name ?? current.full_name ?? current.name;
    const nextEmail = email ?? current.email;
    const nextStatus = status ?? current.status;

    const result = await db.query(
      `
      UPDATE product_owners
      SET
        name = $1,
        full_name = $2,
        email = $3,
        monthly_salary = $4,
        salary_currency = $5,
        profit_share_percent = $6,
        team_lead_profile_id = $7,
        status = $8
      WHERE id = $9
      RETURNING *
      `,
      [
        nextFullName, // keep name/full_name in sync
        nextFullName,
        nextEmail,
        Number(monthly_salary ?? current.monthly_salary ?? 0),
        salary_currency ?? current.salary_currency ?? "PKR",
        Number(profit_share_percent ?? current.profit_share_percent ?? 0),
        team_lead_profile_id ?? current.team_lead_profile_id ?? null,
        nextStatus,
        id
      ]
    );

    // Also update the Team Lead's pool percent if provided
    const tlId = team_lead_profile_id ?? current.team_lead_profile_id;
    if (team_lead_pool_percent !== undefined && team_lead_pool_percent !== "" && tlId) {
      await db.query(
        `UPDATE team_lead_profiles SET profit_share_pool_percent = $1, updated_at = NOW() WHERE id = $2`,
        [Number(team_lead_pool_percent), tlId]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("PO update error:", err);
    res.status(500).json({
      success: false,
      message: "PO update failed",
      error: err.message
    });
  }
});

module.exports = router;