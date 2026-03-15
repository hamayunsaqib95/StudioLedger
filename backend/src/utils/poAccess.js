const db = require("../config/db");

async function getPoIdForUser(user) {
  if (!user?.email) return null;

  const result = await db.query(
    `
    SELECT id
    FROM product_owners
    WHERE email = $1
    LIMIT 1
    `,
    [user.email]
  );

  return result.rows[0]?.id || null;
}

function isLeadershipRole(role) {
  return ["CEO", "COO", "Team Lead"].includes(role);
}

module.exports = {
  getPoIdForUser,
  isLeadershipRole
};