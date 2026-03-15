import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const CATEGORIES = [
  { key: "all",         label: "All",        color: "#6366f1" },
  { key: "games",       label: "Games",      color: "#f59e0b" },
  { key: "assignments", label: "Assignments", color: "#8b5cf6" },
  { key: "revenue",     label: "Revenue",    color: "#10b981" },
  { key: "costs",       label: "Costs",      color: "#ef4444" },
  { key: "ua",          label: "UA Spend",   color: "#0ea5e9" }
];

const ACTION_META = {
  GAME_ADD:          { label: "Game Added",       bg: "#fef3c7", color: "#92400e" },
  GAME_EDIT:         { label: "Game Edited",      bg: "#e0e7ff", color: "#3730a3" },
  GAME_DELETE:       { label: "Game Archived",    bg: "#fee2e2", color: "#991b1b" },
  ASSIGNMENT_ADD:    { label: "Assigned",         bg: "#ede9fe", color: "#6d28d9" },
  ASSIGNMENT_EDIT:   { label: "Assignment Edit",  bg: "#f5f3ff", color: "#7c3aed" },
  ASSIGNMENT_DELETE: { label: "Unassigned",       bg: "#fee2e2", color: "#991b1b" },
  REVENUE_SAVE:      { label: "Revenue Saved",    bg: "#dcfce7", color: "#166534" },
  COST_TOOL_ADD:     { label: "Tool Cost Added",  bg: "#fee2e2", color: "#991b1b" },
  COST_OFFICE_ADD:   { label: "Office Cost Added",bg: "#fee2e2", color: "#b45309" },
  UA_ADD:            { label: "UA Spend Added",   bg: "#e0f2fe", color: "#0369a1" }
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
  }, [category]);

  async function loadLogs() {
    try {
      setLoading(true);
      const params = category !== "all" ? { category } : {};
      const res = await api.get("/audit-logs", { params });
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      String(log.action_type || "").toLowerCase().includes(q) ||
      String(log.action_detail || "").toLowerCase().includes(q) ||
      String(log.actor || "").toLowerCase().includes(q)
    );
  }, [logs, search]);

  const todayCount = logs.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;

  const uniqueActors = new Set(logs.map((l) => l.actor).filter(Boolean)).size;

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Audit Logs</h1>
          <p style={styles.pageSubtitle}>Full activity trail — games, assignments, revenue, costs, and UA</p>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>Total Logs</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{logs.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Today's Activity</div>
          <div style={{ ...styles.statValue, color: "#10b981" }}>{todayCount}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <div style={styles.statLabel}>Active Users</div>
          <div style={{ ...styles.statValue, color: "#f59e0b" }}>{uniqueActors}</div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={styles.tabBar}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            style={{
              ...styles.tab,
              ...(category === cat.key ? { background: cat.color, color: "#fff", boxShadow: `0 2px 8px ${cat.color}55` } : {})
            }}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <div style={styles.searchWrap}>
            <svg style={styles.searchIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Search action, detail, or actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={styles.rowCount}>{filteredLogs.length} entries</span>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading audit logs...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Detail</th>
                  <th style={styles.th}>Actor</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const meta = ACTION_META[log.action_type] || { label: log.action_type, bg: "#f1f5f9", color: "#475569" };
                  return (
                    <tr key={log.id} style={styles.tr}>
                      <td style={{ ...styles.td, whiteSpace: "nowrap", color: "#64748b", fontSize: 13 }}>
                        <div>{new Date(log.created_at).toLocaleDateString("en-PK")}</div>
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(log.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: meta.bg, color: meta.color }}>{meta.label}</span>
                      </td>
                      <td style={{ ...styles.td, maxWidth: 480, color: "#374151" }}>{log.action_detail}</td>
                      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                        <div style={styles.actorCell}>
                          <div style={styles.actorAvatar}>{String(log.actor || "?")[0].toUpperCase()}</div>
                          <span style={{ fontSize: 13, color: "#374151" }}>{log.actor || "—"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={styles.empty}>No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 24 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 },
  statCard: { background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  statLabel: { color: "#64748b", fontSize: 13, fontWeight: 600 },
  statValue: { marginTop: 6, fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" },
  tabBar: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" },
  tab: { padding: "8px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 12, pointerEvents: "none" },
  searchInput: { padding: "10px 14px 10px 36px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, width: 320, color: "#0f172a", background: "#f8fafc" },
  rowCount: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", color: "#64748b", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", fontSize: 14 },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  actorCell: { display: "flex", alignItems: "center", gap: 8 },
  actorAvatar: { width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 },
  empty: { textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }
};
