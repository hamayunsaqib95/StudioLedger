export const isLeadership = (role) =>
  ["CEO", "COO", "Team Lead"].includes(role);

export const isPO = (role) => role === "PO";