const express = require("express");
const router = express.Router();
const finance = require("../services/financeEngine");

router.post("/calculate/:month", async (req, res) => {
  try {
    const month = req.params.month;

    await finance.calculateMonth(month);

    res.json({
      success: true,
      message: "Finance calculation completed"
    });
  } catch (err) {
    console.error("Finance route error:", err);

    res.status(500).json({
      success: false,
      message: "Calculation failed",
      error: err.message
    });
  }
});

module.exports = router;