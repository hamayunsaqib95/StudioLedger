import { useEffect, useMemo, useState } from "react";
import api, { downloadExport } from "../api/api";
import POFormModal from "../components/POFormModal";

export default function POAnalytics() {
  const [monthKey, setMonthKey] = useState("2026-03");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [showPOModal, setShowPOModal] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);

  useEffect(() => {
    loadData();
  }, [monthKey]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [poRes, tlRes] = await Promise.all([
        api.get(`/po-analytics/${monthKey}`),
        api.get(`/team-lead-governance/${monthKey}`)
      ]);

      setRows(Array.isArray(poRes?.data?.data) ? poRes.data.data : []);
      setTeamLeads(Array.isArray(tlRes?.data?.data) ? tlRes.data.data : []);
    } catch (err) {
      console.error("PO analytics load error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load PO analytics."
      );
      setRows([]);
      setTeamLeads([]);
    } finally {
      setLoading(false);
    }
  }
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      String(r?.po_name || "").toLowerCase().includes(q) ||
      String(r?.team_lead_name || "").toLowerCase().includes(q) ||
      String(r?.status || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalRevenue = filteredRows.reduce(
    (sum, r) => sum + Number(r?.total_revenue || 0),
    0
  );
  const totalCost = filteredRows.reduce(
    (sum, r) => sum + Number(r?.total_cost || 0),
    0
  );
  const totalProfit = filteredRows.reduce(
    (sum, r) => sum + Number(r?.final_profit || 0),
    0
  );

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>PO Dashboard</h1>
          <p style={styles.pageSubtitle}>
            Product Owner salary, profitability, incentive, and team leadership view
          </p>
        </div>
        <div style={styles.topbarActions}>
  <select
    style={styles.select}
    value={monthKey}
    onChange={(e) => setMonthKey(e.target.value)}
  >
    {["2026-03","2026-02","2026-01","2025-12","2025-11","2025-10"].map((m) => (
      <option key={m} value={m}>{m}</option>
    ))}
  </select>

  <button
    style={styles.secondaryBtn}
    onClick={() => downloadExport(`/export/po/${monthKey}`, `po-profitability-${monthKey}.csv`)}
  >
    Export PO Report
  </button>

  <button
    style={styles.primaryBtn}
    onClick={() => {
      setEditingPO(null);
      setShowPOModal(true);
    }}
  >
    + Add PO
  </button>
</div>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>PO Count</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{filteredRows.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Revenue</div>
          <div style={{ ...styles.statValue, color: "#10b981", fontSize: 20 }}>{formatNumber(totalRevenue)}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <div style={styles.statLabel}>Cost</div>
          <div style={{ ...styles.statValue, color: "#ef4444", fontSize: 20 }}>{formatNumber(totalCost)}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #8b5cf6" }}>
          <div style={styles.statLabel}>Final Profit</div>
          <div style={{ ...styles.statValue, color: "#8b5cf6", fontSize: 20 }}>{formatNumber(totalProfit)}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by PO, Team Lead, or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <div style={styles.infoBox}>Loading PO analytics...</div>}
        {!loading && error && <div style={styles.errorBox}>{error}</div>}

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>PO</th>
                <th style={styles.th}>Team Lead</th>
                <th style={styles.th}>TL Pool %</th>
                <th style={styles.th}>Salary</th>
                <th style={styles.th}>PO Profit %</th>
                <th style={styles.th}>Games</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>Cost</th>
                <th style={styles.th}>Profit Before Incentive</th>
                <th style={styles.th}>Incentive</th>
                <th style={styles.th}>Final Profit</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => (
                <tr key={r?.po_id ?? idx}>
                  <td style={styles.td}>
                    <div>
                      <div style={styles.nameText}>{r?.po_name || "-"}</div>
                      <div style={styles.subText}>{r?.status || "-"}</div>
                    </div>
                  </td>
                  <td style={styles.td}>{r?.team_lead_name || "-"}</td>
                  <td style={styles.td}>
                    <span style={styles.poolBadge}>
                      {Number(r?.team_lead_pool_percent || 0)}%
                    </span>
                  </td>
                  <td style={styles.td}>
                    {formatNumber(r?.monthly_salary)} {r?.salary_currency || "PKR"}
                  </td>
                  <td style={styles.td}>
                    {Number(r?.profit_share_percent || 0)}%
                  </td>
                  <td style={styles.td}>{Number(r?.active_game_count || 0)}</td>
                  <td style={styles.td}>{formatNumber(r?.total_revenue)}</td>
                  <td style={styles.td}>{formatNumber(r?.total_cost)}</td>
                  <td style={styles.td}>
                    {formatNumber(r?.profit_before_incentive)}
                  </td>
                  <td style={styles.td}>{formatNumber(r?.incentive_amount)}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background:
                          Number(r?.final_profit || 0) >= 0 ? "#dcfce7" : "#fee2e2",
                        color:
                          Number(r?.final_profit || 0) >= 0 ? "#166534" : "#991b1b"
                      }}
                    >
                      {formatNumber(r?.final_profit)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.editBtn}
                      onClick={() => {
                        setEditingPO({ ...r, id: r.po_id });
                        setShowPOModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && !error && filteredRows.length === 0 && (
                <tr>
                  <td style={styles.emptyRow} colSpan={12}>
                    No PO analytics found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <POFormModal
        open={showPOModal}
        onClose={() => {
          setShowPOModal(false);
          setEditingPO(null);
        }}
        po={editingPO}
        teamLeads={teamLeads}
        onSaved={loadData}
      />
    </div>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

const styles = {
  page: { minHeight: "100%" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24 },
  secondaryBtn: { padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  topbarActions: { display: "flex", gap: 10, alignItems: "center" },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  select: { padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  statCard: { background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)", borderLeft: "4px solid #6366f1" },
  statLabel: { color: "#64748b", fontSize: 13, fontWeight: 600 },
  statValue: { marginTop: 6, fontSize: 28, fontWeight: 800, color: "#6366f1", letterSpacing: "-0.02em" },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { marginBottom: 16 },
  searchInput: { minWidth: 300, padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, background: "#f8fafc" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", color: "#64748b", fontWeight: 600, textAlign: "left", padding: "12px 14px", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontSize: 14 },
  nameText: { fontWeight: 600, color: "#0f172a" },
  subText: { marginTop: 2, fontSize: 12, color: "#94a3b8" },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  poolBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: "#ede9fe", color: "#6d28d9" },
  editBtn: { padding: "5px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  infoBox: { marginBottom: 16, background: "#eff6ff", color: "#1d4ed8", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  errorBox: { marginBottom: 16, background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 }
};