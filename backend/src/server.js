const express = require("express");
const PORT = process.env.PORT || 4000;

const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");

const authRoutes = require("./routes/auth");
const productOwnerRoutes = require("./routes/productOwners");
const gameRoutes = require("./routes/games");
const employeeRoutes = require("./routes/employees");
const dashboardRoutes = require("./routes/dashboard");
const costRoutes = require("./routes/costs");

const uaRoutes = require("./routes/ua");
const revenueRoutes = require("./routes/revenues");
const transferRoutes = require("./routes/transfers");
const userRoutes = require("./routes/users");
const monthlyLockRoutes = require("./routes/monthlyLocks");
const auditLogRoutes = require("./routes/auditLogs");
const financeRoutes = require("./routes/finance");
const gameAnalyticsRoutes = require("./routes/gameAnalytics");
const poAnalyticsRoutes = require("./routes/poAnalytics");
const teamLeadGovernanceRoutes = require("./routes/teamLeadGovernance");
const allocationRoutes = require("./routes/allocations");
const studioAnalyticsRoutes = require("./routes/studioAnalytics");
const exportRoutes = require("./routes/export");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({
      success: true,
      message: "Backend is running",
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    app: "Studio P&L System Backend",
    version: "1.0.0"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/product-owners", productOwnerRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/costs", costRoutes);
app.use("/api/ua", uaRoutes);
app.use("/api/revenues", revenueRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/users", userRoutes);
app.use("/api/monthly-locks", monthlyLockRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/game-analytics", gameAnalyticsRoutes);
app.use("/api/po-analytics", poAnalyticsRoutes);
app.use("/api/team-lead-governance", teamLeadGovernanceRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/studio-analytics", studioAnalyticsRoutes);
app.use("/api/export", exportRoutes);
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});