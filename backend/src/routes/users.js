const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// GET all users
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        r.name AS role,
        u.status,
        u.created_by,
        u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.id DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Users list error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

// CREATE user
// If role = Team Lead -> auto create team_lead_profiles row
// If role = PO -> auto create product_owners row
router.post("/", async (req, res) => {
  const client = await db.connect();

  try {
    const {
      full_name,
      email,
      password,
      role_name,
      status,
      created_by
    } = req.body;

    if (!full_name || !email || !role_name) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and role are required"
      });
    }

    const allowedRoles = ["CEO", "COO", "Team Lead", "PO", "Admin", "HR"];
    if (!allowedRoles.includes(role_name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    await client.query("BEGIN");

    const roleRes = await client.query(
      `SELECT id, name FROM roles WHERE name = $1 LIMIT 1`,
      [role_name]
    );

    if (roleRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Role not found in roles table"
      });
    }

    const role_id = roleRes.rows[0].id;

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password || "admin123", 10);

    const userInsert = await client.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role_id,
        status,
        created_by,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING id, full_name, email, role_id, status
      `,
      [
        full_name,
        email,
        passwordHash,
        role_id,
        status || "Active",
        created_by || "System"
      ]
    );

    const newUser = userInsert.rows[0];

    // AUTO CREATE TEAM LEAD PROFILE
    if (role_name === "Team Lead") {
      const existingLead = await client.query(
        `SELECT id FROM team_lead_profiles WHERE user_id = $1 LIMIT 1`,
        [newUser.id]
      );

      if (existingLead.rows.length === 0) {
        await client.query(
          `
          INSERT INTO team_lead_profiles (
            user_id,
            full_name,
            profit_share_pool_percent,
            status,
            created_at
          )
          VALUES ($1,$2,$3,$4,NOW())
          `,
          [newUser.id, full_name, 20.0, "Active"]
        );
      }
    }

    // AUTO CREATE PRODUCT OWNER PROFILE
    if (role_name === "PO") {
      const existingPO = await client.query(
        `SELECT id FROM product_owners WHERE email = $1 LIMIT 1`,
        [email]
      );

      if (existingPO.rows.length === 0) {
        await client.query(
          `
          INSERT INTO product_owners (
            name,
            full_name,
            email,
            user_id,
            monthly_salary,
            salary_currency,
            profit_share_percent,
            profit_share_status,
            status,
            created_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
          `,
          [
            full_name,   // old required column
            full_name,   // new column
            email,
            newUser.id,
            0,
            "PKR",
            0,
            "Active",
            "Active"
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        ...newUser,
        role: role_name
      }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("User create error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: err.message
    });
  } finally {
    client.release();
  }
});

// UPDATE user basic info
router.put("/:id", async (req, res) => {
  const client = await db.connect();

  try {
    const { id } = req.params;
    const { full_name, email, role_name, status } = req.body;

    await client.query("BEGIN");

    const currentUserRes = await client.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (currentUserRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let role_id = currentUserRes.rows[0].role_id;

    if (role_name) {
      const roleRes = await client.query(
        `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
        [role_name]
      );

      if (roleRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Invalid role"
        });
      }

      role_id = roleRes.rows[0].id;
    }

    const updated = await client.query(
      `
      UPDATE users
      SET
        full_name = $1,
        email = $2,
        role_id = $3,
        status = $4
      WHERE id = $5
      RETURNING id, full_name, email, role_id, status
      `,
      [
        full_name ?? currentUserRes.rows[0].full_name,
        email ?? currentUserRes.rows[0].email,
        role_id,
        status ?? currentUserRes.rows[0].status,
        id
      ]
    );

    // keep product owner in sync if this user is a PO
    if (role_name === "PO") {
      await client.query(
        `
        UPDATE product_owners
        SET
          name = $1,
          full_name = $2,
          email = $3,
          status = $4
        WHERE user_id = $5
        `,
        [
          full_name ?? currentUserRes.rows[0].full_name,
          full_name ?? currentUserRes.rows[0].full_name,
          email ?? currentUserRes.rows[0].email,
          status ?? currentUserRes.rows[0].status,
          id
        ]
      );
    }

    // keep team lead profile in sync if this user is a Team Lead
    if (role_name === "Team Lead") {
      await client.query(
        `
        UPDATE team_lead_profiles
        SET
          full_name = $1,
          status = $2
        WHERE user_id = $3
        `,
        [
          full_name ?? currentUserRes.rows[0].full_name,
          status ?? currentUserRes.rows[0].status,
          id
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("User update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: err.message
    });
  } finally {
    client.release();
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await db.query(`DELETE FROM users WHERE id = $1`, [id]);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("User delete error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: err.message
    });
  }
});

module.exports = router;