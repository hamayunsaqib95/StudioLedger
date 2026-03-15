const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST || "db",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "studio_pnl",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres"
    });

module.exports = pool;
