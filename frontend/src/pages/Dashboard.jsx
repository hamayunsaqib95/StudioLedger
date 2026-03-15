import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

const MONTHS = ["2026-03", "2026-02", "2026-01", "2025-12", "2025-11", "2025-10"];
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const BAR_COLORS = ["#6366f1", "#ef4444", "#10b981", "#2563eb"];

export default function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPo, setSelectedPo] = useState("1");
  const [monthKey, setMonthKey] = useState("2026-03");
  const [productOwners, setProductOwners] = useState([]);

  useEffect(() => {
    loadProductOwners();
  }, []);

  useEffect(() => {
    if (selectedPo && monthKey) loadDashboard();
  }, [selectedPo, monthKey]);

  async function loadProductOwners() {
    try {
      const res = await api.get("/product-owners");
      const poList = res.data.data || [];
      setProductOwners(poList);
      if (user.role === "PO") {
        const matched = poList.find((p) => p.email === user.email);
        if (matched) setSelectedPo(String(matched.id));
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/po-summary/${selectedPo}/${monthKey}`);
      setSummary(res.data.data);
    } catch (error) {
      console.error(error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  const barData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Revenue", value: Number(summary.totalRevenue || 0) },
      { name: "Cost", value: Number(summary.totalCost || 0) },
      { name: "Op. Profit", value: Number(summary.operatingProfit || 0) },
      { name: "Final Profit", value: Number(summary.finalProfit || 0) }
    ];
  }, [summary]);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Team", value: Number(summary.totalTeamCost || 0) },
      { name: "Tools", value: Number(summary.totalToolCost || 0) },
      { name: "Office", value: Number(summary.totalOfficeCost || 0) },
      { name: "UA", value: Number(summary.totalUa || 0) }
    ].filter((d) => d.value > 0);
  }, [summary]);

  const selectedPoName = useMemo(() => {
    const po = productOwners.find((p) => String(p.id) === String(selectedPo));
    return po ? po.name : "—";
  }, [productOwners, selectedPo]);

  const kpiCards = summary ? [
    { title: "Total Games", value: summary.totalGames, hint: "Active under PO", color: "#6366f1", bg: "linear-gradient(135deg, #6366f1, #4f46e5)" },
    { title: "Revenue", value: formatNumber(summary.totalRevenue), hint: "PKR", color: "#10b981", bg: "linear-gradient(135deg, #10b981, #059669)" },
    { title: "Total Cost", value: formatNumber(summary.totalCost), hint: "PKR", color: "#ef4444", bg: "linear-gradient(135deg, #ef4444, #dc2626)" },
    { title: "Operating Profit", value: formatNumber(summary.operatingProfit), hint: "Before incentive", color: "#2563eb", bg: "linear-gradient(135deg, #2563eb, #1d4ed8)" },
    { title: "PO Incentive", value: formatNumber(summary.poIncentive), hint: "Profit share", color: "#f59e0b", bg: "linear-gradient(135deg, #f59e0b, #d97706)" },
    { title: "Final Profit", value: formatNumber(summary.finalProfit), hint: "After incentive", color: "#8b5cf6", bg: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }
  ] : [];

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Financial Dashboard</h1>
          <p style={styles.pageSubtitle}>Cost, revenue, and profitability overview per Product Owner</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.filterCard}>
            <label style={styles.filterLabel}>Product Owner</label>
            <select
              style={styles.select}
              value={selectedPo}
              disabled={user.role === "PO"}
              onChange={(e) => setSelectedPo(e.target.value)}
            >
              {productOwners.map((po) => (
                <option key={po.id} value={po.id}>{po.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.filterCard}>
            <label style={styles.filterLabel}>Month</label>
            <select style={styles.select} value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Viewing Banner */}
      <div style={styles.viewingBanner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bannerAvatar}>{selectedPoName[0] || "?"}</div>
          <div>
            <div style={styles.bannerName}>{selectedPoName}</div>
            <div style={styles.bannerSub}>Viewing period: {monthKey}</div>
          </div>
        </div>
        <div style={styles.bannerStats}>
          {summary && (
            <>
              <div style={styles.bannerStat}>
                <span style={styles.bannerStatLabel}>Margin</span>
                <span style={styles.bannerStatValue}>
                  {summary.totalRevenue > 0
                    ? `${((summary.finalProfit / summary.totalRevenue) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div style={styles.bannerStatDivider} />
              <div style={styles.bannerStat}>
                <span style={styles.bannerStatLabel}>Efficiency</span>
                <span style={styles.bannerStatValue}>
                  {summary.totalCost > 0
                    ? `${((summary.totalRevenue / summary.totalCost) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div style={styles.bannerStatDivider} />
              <div style={styles.bannerStat}>
                <span style={styles.bannerStatLabel}>USD Rate</span>
                <span style={styles.bannerStatValue}>{summary.usdToPkr}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingCard}>
          <div style={styles.loadingDot} />
          Loading dashboard...
        </div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <div style={styles.kpiGrid}>
            {kpiCards.map((card) => (
              <div key={card.title} style={{ ...styles.kpiCard, background: card.bg }}>
                <div style={styles.kpiTitle}>{card.title}</div>
                <div style={styles.kpiValue}>{card.value}</div>
                <div style={styles.kpiHint}>{card.hint}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={styles.chartGrid}>
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div>
                  <h3 style={styles.chartTitle}>Revenue vs Cost vs Profit</h3>
                  <span style={styles.chartSub}>Financial breakdown in PKR</span>
                </div>
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={barData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                    <Tooltip
                      formatter={(value) => [formatNumber(value), "Amount (PKR)"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {barData.map((_, index) => (
                        <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div>
                  <h3 style={styles.chartTitle}>Cost Mix</h3>
                  <span style={styles.chartSub}>By category</span>
                </div>
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} paddingAngle={3}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                    <Legend formatter={(value) => <span style={{ fontSize: 13, color: "#475569" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Panels */}
          <div style={styles.bottomGrid}>
            <div style={styles.panelCard}>
              <h3 style={styles.panelTitle}>Cost Breakdown</h3>
              <div style={styles.breakdownList}>
                {[
                  { label: "Team Cost", value: summary.totalTeamCost, color: "#6366f1" },
                  { label: "Tool Cost", value: summary.totalToolCost, color: "#10b981" },
                  { label: "Office Cost", value: summary.totalOfficeCost, color: "#f59e0b" },
                  { label: "UA Spend", value: summary.totalUa, color: "#ef4444" }
                ].map((item) => {
                  const total = Number(summary.totalCost || 1);
                  const pct = ((Number(item.value || 0) / total) * 100).toFixed(1);
                  return (
                    <div key={item.label} style={styles.breakdownItem}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={styles.breakdownLabel}>{item.label}</span>
                        <span style={styles.breakdownValue}>{formatNumber(item.value)} <span style={{ color: "#94a3b8", fontSize: 12 }}>({pct}%)</span></span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.panelCard}>
              <h3 style={styles.panelTitle}>Performance Metrics</h3>
              <div style={styles.metricsList}>
                {[
                  {
                    label: "Revenue Efficiency",
                    value: summary.totalCost > 0 ? `${((summary.totalRevenue / summary.totalCost) * 100).toFixed(1)}%` : "0%",
                    icon: "↗",
                    good: summary.totalRevenue > summary.totalCost
                  },
                  {
                    label: "Profit Margin",
                    value: summary.totalRevenue > 0 ? `${((summary.finalProfit / summary.totalRevenue) * 100).toFixed(1)}%` : "0%",
                    icon: "◎",
                    good: summary.finalProfit > 0
                  },
                  {
                    label: "Avg Cost per Game",
                    value: summary.totalGames > 0 ? `${formatNumber(summary.totalCost / summary.totalGames)} PKR` : "0",
                    icon: "⬡",
                    good: null
                  },
                  {
                    label: "Avg Revenue per Game",
                    value: summary.totalGames > 0 ? `${formatNumber(summary.totalRevenue / summary.totalGames)} PKR` : "0",
                    icon: "◈",
                    good: null
                  }
                ].map((m) => (
                  <div key={m.label} style={styles.metricItem}>
                    <div style={styles.metricLeft}>
                      <span style={{
                        ...styles.metricIcon,
                        color: m.good === null ? "#6366f1" : m.good ? "#10b981" : "#ef4444",
                        background: m.good === null ? "#e0e7ff" : m.good ? "#dcfce7" : "#fee2e2"
                      }}>{m.icon}</span>
                      <span style={styles.metricLabel}>{m.label}</span>
                    </div>
                    <span style={{
                      ...styles.metricValue,
                      color: m.good === null ? "#0f172a" : m.good ? "#166534" : "#991b1b"
                    }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={styles.loadingCard}>Failed to load dashboard data.</div>
      )}
    </div>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value;
}

const styles = {
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 20
  },
  pageTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em"
  },
  pageSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 14
  },
  headerRight: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start"
  },
  filterCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
  },
  filterLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 6
  },
  select: {
    border: "none",
    outline: "none",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    minWidth: 140
  },
  viewingBanner: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: 16,
    padding: "18px 24px",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 20px rgba(15,23,42,0.2)"
  },
  bannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14
  },
  bannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18
  },
  bannerName: {
    color: "#f1f5f9",
    fontWeight: 700,
    fontSize: 16
  },
  bannerSub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 2
  },
  bannerStats: {
    display: "flex",
    alignItems: "center",
    gap: 24
  },
  bannerStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end"
  },
  bannerStatLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 500
  },
  bannerStatValue: {
    color: "#f1f5f9",
    fontSize: 18,
    fontWeight: 800,
    marginTop: 2
  },
  bannerStatDivider: {
    width: 1,
    height: 32,
    background: "rgba(255,255,255,0.08)"
  },
  loadingCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#6366f1"
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 14,
    marginBottom: 20
  },
  kpiCard: {
    borderRadius: 16,
    padding: "18px 16px",
    color: "#fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: 600,
    opacity: 0.8,
    letterSpacing: "0.03em"
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 800,
    marginTop: 8,
    letterSpacing: "-0.02em",
    lineHeight: 1.1
  },
  kpiHint: {
    fontSize: 11,
    opacity: 0.65,
    marginTop: 6
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 20,
    marginBottom: 20
  },
  chartCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 20px 16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)"
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  chartTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a"
  },
  chartSub: {
    display: "block",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 3
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20
  },
  panelCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)"
  },
  panelTitle: {
    margin: "0 0 16px",
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a"
  },
  breakdownList: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  breakdownItem: {},
  breakdownLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: 500
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a"
  },
  progressBar: {
    height: 6,
    background: "#f1f5f9",
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.4s ease"
  },
  metricsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  metricItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "12px 14px"
  },
  metricLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14
  },
  metricLabel: {
    color: "#475569",
    fontWeight: 500,
    fontSize: 13
  },
  metricValue: {
    fontWeight: 800,
    fontSize: 15
  }
};
