import { useEffect, useMemo, useState } from "react";
import api, { downloadExport } from "../api/api";

export default function StudioAnalytics() {
  const [monthKey, setMonthKey] = useState("2026-03");
  const [summary, setSummary] = useState(null);
  const [games, setGames] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [monthKey]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/studio-analytics/${monthKey}`);
      const data = res.data.data || {};

      setSummary(data.summary || null);
      setGames(data.games || []);
      setPos(data.pos || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load studio analytics.");
      setSummary(null);
      setGames([]);
      setPos([]);
    } finally {
      setLoading(false);
    }
  }
  const profitableGames = useMemo(
    () => games.filter((g) => Number(g.profit || 0) > 0).length,
    [games]
  );

  const lossGames = useMemo(
    () => games.filter((g) => Number(g.profit || 0) < 0).length,
    [games]
  );

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={styles.pageTitle}>Studio Analytics</h1>
        <p style={styles.pageSubtitle}>Studio-wide revenue, cost, and profitability overview</p>
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
    style={styles.primaryBtn}
    onClick={() => downloadExport(`/export/studio/${monthKey}`, `studio-summary-${monthKey}.csv`)}
  >
    Export Studio Report
  </button>
</div>

      {loading && <div style={styles.infoBox}>Loading studio analytics...</div>}
      {!loading && error && <div style={styles.errorBox}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={styles.statsGrid}>
            <StatCard label="Studio Revenue" value={formatNumber(summary?.total_revenue)} color="#10b981" />
            <StatCard label="Studio Cost" value={formatNumber(summary?.total_cost)} color="#ef4444" />
            <StatCard label="Studio Profit" value={formatNumber(summary?.total_profit)} color="#6366f1" />
            <StatCard label="Profitable Games" value={profitableGames} color="#f59e0b" />
            <StatCard label="Loss Games" value={lossGames} color="#dc2626" />
          </div>

          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Game Profitability</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Game</th>
                      <th style={styles.th}>PO</th>
                      <th style={styles.th}>Revenue</th>
                      <th style={styles.th}>Cost</th>
                      <th style={styles.th}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g) => (
                      <tr key={g.game_id}>
                        <td style={styles.td}>{g.game_name}</td>
                        <td style={styles.td}>{g.po_name || "-"}</td>
                        <td style={styles.td}>{formatNumber(g.total_revenue)}</td>
                        <td style={styles.td}>{formatNumber(g.total_cost)}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              background:
                                Number(g.profit || 0) >= 0 ? "#dcfce7" : "#fee2e2",
                              color:
                                Number(g.profit || 0) >= 0 ? "#166534" : "#991b1b"
                            }}
                          >
                            {formatNumber(g.profit)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {games.length === 0 && (
                      <tr>
                        <td style={styles.emptyRow} colSpan={5}>
                          No game data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>PO Comparison</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>PO</th>
                      <th style={styles.th}>Revenue</th>
                      <th style={styles.th}>Cost</th>
                      <th style={styles.th}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos.map((p) => (
                      <tr key={p.po_id}>
                        <td style={styles.td}>{p.po_name}</td>
                        <td style={styles.td}>{formatNumber(p.total_revenue)}</td>
                        <td style={styles.td}>{formatNumber(p.total_cost)}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              background:
                                Number(p.total_profit || 0) >= 0 ? "#dcfce7" : "#fee2e2",
                              color:
                                Number(p.total_profit || 0) >= 0 ? "#166534" : "#991b1b"
                            }}
                          >
                            {formatNumber(p.total_profit)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {pos.length === 0 && (
                      <tr>
                        <td style={styles.emptyRow} colSpan={4}>
                          No PO data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "#0f172a" }) {
  return (
    <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
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
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  topbarActions: { display: "flex", gap: 10, alignItems: "center", marginBottom: 20 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.35)", display: "flex", alignItems: "center", gap: 6 },
  select: { padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 },
  statCard: { background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  statLabel: { color: "#64748b", fontSize: 13, fontWeight: 600 },
  statValue: { marginTop: 6, fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  cardTitle: { marginTop: 0, marginBottom: 14, color: "#0f172a", fontSize: 16, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", color: "#64748b", fontWeight: 600, textAlign: "left", padding: "12px 14px", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontSize: 14 },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  infoBox: { marginBottom: 16, background: "#eff6ff", color: "#1d4ed8", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  errorBox: { marginBottom: 16, background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 }
};