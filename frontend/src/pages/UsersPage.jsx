import { useEffect, useState } from "react";
import api from "../api/api";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  role_name: "PO",
  status: "Active"
};

export default function UsersPage({ user }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/users");
      setUsers(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    if (!form.full_name.trim()) { setError("Full name is required"); return false; }
    if (!form.email.trim()) { setError("Email is required"); return false; }
    if (!form.password.trim()) { setError("Password is required"); return false; }
    if (!form.role_name) { setError("Role is required"); return false; }
    setError("");
    return true;
  }

  async function saveUser(e) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.post("/users", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role_name: form.role_name,
        status: form.status,
        created_by: user?.full_name || "System"
      });
      setSuccess("User created successfully.");
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(u) {
    if (u.id === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Delete user "${u.full_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setSuccess(`User "${u.full_name}" deleted.`);
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.full_name || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.role || "").toLowerCase().includes(q) ||
      String(u.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Users</h1>
          <p style={styles.pageSubtitle}>Manage login accounts for CEO, COO, Team Lead, PO, Admin, and HR</p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Add User Form */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Add User</h3>
          <form onSubmit={saveUser} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter full name" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Role</label>
              <select style={styles.input} value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })}>
                <option value="CEO">CEO</option>
                <option value="COO">COO</option>
                <option value="Team Lead">Team Lead</option>
                <option value="PO">PO</option>
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Pending Activation">Pending Activation</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}
            {success && <div style={styles.successBox}>{success}</div>}
            <div style={styles.actions}>
              <button type="button" style={styles.secondaryBtn} onClick={() => { setForm(emptyForm); setError(""); setSuccess(""); }}>Reset</button>
              <button type="submit" style={styles.primaryBtn} disabled={saving}>{saving ? "Saving..." : "Create User"}</button>
            </div>
          </form>
        </div>

        {/* Users List */}
        <div style={styles.card}>
          <div style={styles.listHeader}>
            <h3 style={styles.cardTitle}>Users List</h3>
            <input style={styles.searchInput} placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div style={styles.infoBox}>Loading users...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Full Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={styles.avatar}>{String(u.full_name || "?")[0].toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{u.full_name}</div>
                            {u.id === user?.id && <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>You</div>}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, ...getRoleStyle(u.role) }}>{u.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: u.status === "Active" ? "#dcfce7" : "#fef3c7", color: u.status === "Active" ? "#166534" : "#92400e" }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {u.id !== user?.id ? (
                          <button style={styles.deleteBtn} onClick={() => deleteUser(u)}>Delete</button>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={styles.emptyRow}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRoleStyle(role) {
  switch (role) {
    case "CEO": return { background: "#fef3c7", color: "#92400e" };
    case "COO": return { background: "#fce7f3", color: "#9d174d" };
    case "Team Lead": return { background: "#e0e7ff", color: "#3730a3" };
    case "PO": return { background: "#d1fae5", color: "#065f46" };
    case "Admin": return { background: "#fee2e2", color: "#991b1b" };
    default: return { background: "#f1f5f9", color: "#475569" };
  }
}

const styles = {
  page: { minHeight: "100%" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "400px 1fr", gap: 20 },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  cardTitle: { margin: 0, marginBottom: 16, color: "#0f172a", fontSize: 16, fontWeight: 700 },
  form: { display: "grid", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, width: "100%", color: "#0f172a", background: "#fff", outline: "none", fontSize: 14 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  secondaryBtn: { padding: "10px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  deleteBtn: { padding: "6px 14px", border: "none", borderRadius: 8, background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  errorBox: { color: "#991b1b", background: "#fee2e2", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  successBox: { color: "#166534", background: "#dcfce7", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  infoBox: { color: "#1d4ed8", background: "#eff6ff", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 },
  searchInput: { minWidth: 200, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, color: "#0f172a", background: "#f8fafc", outline: "none", fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", color: "#64748b", fontWeight: 600, textAlign: "left", padding: "12px 14px", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontSize: 14 },
  avatar: { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  roleBadge: { display: "inline-block", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 }
};
