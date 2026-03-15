const pool = require("../config/db");

async function ensureMonthUnlocked(req, res, next) {
  try {
    const monthKey =
      req.body.month_key ||
      req.body.monthKey ||
      req.query.monthKey ||
      req.params.monthKey;

    if (!monthKey) {
      return next();
    }

    const result = await pool.query(
      `
      SELECT is_locked
      FROM monthly_locks
      WHERE month_key = $1
      `,
      [monthKey]
    );

    if (result.rows.length > 0 && result.rows[0].is_locked === true) {
      return res.status(403).json({
        success: false,
        message: `Month ${monthKey} is locked. Changes are not allowed.`
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to validate month lock",
      error: error.message
    });
  }
}

module.exports = {
  ensureMonthUnlocked
};