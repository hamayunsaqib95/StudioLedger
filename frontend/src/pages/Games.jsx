import { useEffect, useMemo, useState } from "react";
import api, { downloadExport } from "../api/api";
import Modal from "../components/Modal";

const MONTHS = ["2026-03", "2026-02", "2026-01", "2025-12", "2025-11", "2025-10"];
const DEFAULT_MONTH = "2026-03";

export default function Games({ user }) {
  const [activeTab, setActiveTab] = useState("list");

  // --- Game List state ---
  const [games, setGames] = useState([]);
  const [productOwners, setProductOwners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showKilled, setShowKilled] = useState(false);

  // --- Analytics state ---
  const [monthKey, setMonthKey] = useState("2026-03");
  const [analyticsGames, setAnalyticsGames] = useState([]);
  const [analyticsSearch, setAnalyticsSearch] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // --- Team management state ---
  const [teamGame, setTeamGame] = useState(null); // { id, name }
  const [teamMonthKey, setTeamMonthKey] = useState(DEFAULT_MONTH);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [teamEmployees, setTeamEmployees] = useState([]);
  const [teamForm, setTeamForm] = useState({ employee_id: "", allocation_percent: 100, notes: "" });
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");

  const emptyForm = {
    po_id: "",
    name: "",
    platform: "Both",
    genre: "",
    status: "In Development",
    launch_date: ""
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab, monthKey]);

  async function loadGames() {
    const [gamesRes, poRes] = await Promise.all([
      api.get("/games"),
      api.get("/product-owners")
    ]);
    const gameList = gamesRes.data.data || [];
    const poList = poRes.data.data || [];
    setGames(gameList);
    setProductOwners(poList);
    if (!editingId && poList.length > 0 && !form.po_id) {
      setForm((prev) => ({ ...prev, po_id: String(poList[0].id) }));
    }
  }

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true);
      const res = await api.get(`/game-analytics/${monthKey}`);
      setAnalyticsGames(res.data.data || []);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function recalculate() {
    try {
      setAnalyticsLoading(true);
      await api.post(`/finance/calculate/${monthKey}`);
      const res = await api.get(`/game-analytics/${monthKey}`);
      setAnalyticsGames(res.data.data || []);
    } finally {
      setAnalyticsLoading(false);
    }
  }


  function openCreate() {
    setEditingId(null);
    setError("");
    setForm({ ...emptyForm, po_id: productOwners.length > 0 ? String(productOwners[0].id) : "" });
    setShowModal(true);
  }

  function openEdit(game) {
    setEditingId(game.id);
    setError("");
    setForm({
      po_id: String(game.po_id || ""),
      name: game.name || "",
      platform: game.platform || "Both",
      genre: game.genre || "",
      status: game.status || "In Development",
      launch_date: game.launch_date ? String(game.launch_date).slice(0, 10) : ""
    });
    setShowModal(true);
  }

  function validateForm() {
    if (!form.name.trim() || !form.po_id || !form.platform.trim() || !form.genre.trim() || !form.status.trim() || !form.launch_date) {
      setError("Please complete all required game fields.");
      return false;
    }
    setError("");
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { ...form, po_id: Number(form.po_id) };
    if (editingId) {
      await api.put(`/games/${editingId}`, payload);
      setShowModal(false);
      setEditingId(null);
      setForm({ ...emptyForm, po_id: productOwners.length > 0 ? String(productOwners[0].id) : "" });
      await loadGames();
    } else {
      const res = await api.post("/games", payload);
      const newGame = res.data.data;
      setShowModal(false);
      setEditingId(null);
      setForm({ ...emptyForm, po_id: productOwners.length > 0 ? String(productOwners[0].id) : "" });
      await loadGames();
      // Auto-open team management after creating a new game
      if (newGame?.id) {
        await openTeamModal({ id: newGame.id, name: newGame.name });
      }
    }
  }

  async function openTeamModal(game) {
    setTeamGame(game);
    setTeamError("");
    setTeamForm({ employee_id: "", allocation_percent: 100, notes: "" });
    const [allocRes, empRes] = await Promise.all([
      api.get(`/allocations/${teamMonthKey}`),
      teamEmployees.length === 0 ? api.get("/employees") : Promise.resolve(null)
    ]);
    const allAllocs = allocRes.data.data || [];
    setTeamAllocations(allAllocs.filter((a) => String(a.game_id) === String(game.id)));
    if (empRes) setTeamEmployees(empRes.data.data || []);
  }

  async function reloadTeamAllocations(gameId, month) {
    const res = await api.get(`/allocations/${month}`);
    const all = res.data.data || [];
    setTeamAllocations(all.filter((a) => String(a.game_id) === String(gameId)));
  }

  async function addTeamMember(e) {
    e.preventDefault();
    if (!teamForm.employee_id) { setTeamError("Please select an employee."); return; }
    const pct = Number(teamForm.allocation_percent);
    if (!pct || pct <= 0 || pct > 100) { setTeamError("Allocation % must be between 1 and 100."); return; }
    setTeamError("");
    setTeamLoading(true);
    try {
      await api.post("/allocations", {
        month_key: teamMonthKey,
        employee_id: Number(teamForm.employee_id),
        allocation_scope: "DirectGame",
        game_id: teamGame.id,
        po_id: null,
        allocation_percent: pct,
        notes: teamForm.notes
      });
      setTeamForm({ employee_id: "", allocation_percent: 100, notes: "" });
      await reloadTeamAllocations(teamGame.id, teamMonthKey);
    } catch (err) {
      setTeamError(err?.response?.data?.message || "Failed to add team member.");
    } finally {
      setTeamLoading(false);
    }
  }

  async function removeTeamMember(id) {
    if (!window.confirm("Remove this team member?")) return;
    await api.delete(`/allocations/${id}`);
    await reloadTeamAllocations(teamGame.id, teamMonthKey);
  }

  async function deleteGame(id) {
    const ok = window.confirm("Archive this game?");
    if (!ok) return;
    await api.delete(`/games/${id}`);
    await loadGames();
  }

  const filteredGames = useMemo(() => {
    return games
      .filter((g) => showKilled || g.status !== "Killed")
      .filter((g) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          String(g.name || "").toLowerCase().includes(q) ||
          String(g.platform || "").toLowerCase().includes(q) ||
          String(g.genre || "").toLowerCase().includes(q) ||
          String(g.po_name || "").toLowerCase().includes(q)
        );
      });
  }, [games, showKilled, search]);

  const filteredAnalytics = useMemo(() => {
    const q = analyticsSearch.trim().toLowerCase();
    if (!q) return analyticsGames;
    return analyticsGames.filter((g) =>
      String(g.game_name || "").toLowerCase().includes(q) ||
      String(g.po_name || "").toLowerCase().includes(q) ||
      String(g.genre || "").toLowerCase().includes(q)
    );
  }, [analyticsGames, analyticsSearch]);

  const activeCount = games.filter((g) => g.status !== "Killed").length;
  const killedCount = games.filter((g) => g.status === "Killed").length;
  const liveCount = games.filter((g) => g.status === "Live").length;
  const devCount = games.filter((g) => g.status === "In Development").length;

  const totalRevenue = analyticsGames.reduce((s, g) => s + Number(g.total_revenue || 0), 0);
  const totalCost = analyticsGames.reduce((s, g) => s + Number(g.total_cost || 0), 0);
  const profitableCount = analyticsGames.filter((g) => Number(g.profit) >= 0).length;

  return (
    <div>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Games & Analytics</h1>
          <p style={styles.pageSubtitle}>Manage your game portfolio and view financial performance</p>
        </div>
        {activeTab === "list" && (
          <button style={styles.primaryBtn} onClick={openCreate}>
            + Add Game
          </button>
        )}
        {activeTab === "analytics" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              style={styles.select}
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
            >
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              style={styles.exportBtn}
              onClick={recalculate}
              disabled={analyticsLoading}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Recalculate
            </button>
            <button
              style={styles.exportBtn}
              onClick={() => downloadExport(`/export/games/${monthKey}`, `games-finance-${monthKey}.csv`)}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>Active Games</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{activeCount}</div>
          <div style={styles.statHint}>Not killed</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Live</div>
          <div style={{ ...styles.statValue, color: "#10b981" }}>{liveCount}</div>
          <div style={styles.statHint}>In market</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <div style={styles.statLabel}>In Development</div>
          <div style={{ ...styles.statValue, color: "#f59e0b" }}>{devCount}</div>
          <div style={styles.statHint}>Building</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <div style={styles.statLabel}>Killed</div>
          <div style={{ ...styles.statValue, color: "#ef4444" }}>{killedCount}</div>
          <div style={styles.statHint}>Archived</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(activeTab === "list" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("list")}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Game List
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "analytics" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("analytics")}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
          Analytics
          {activeTab === "analytics" && (
            <span style={styles.tabBadge}>{monthKey}</span>
          )}
        </button>
      </div>

      {/* Game List Tab */}
      {activeTab === "list" && (
        <div style={styles.card}>
          <div style={styles.toolbar}>
            <div style={styles.searchWrap}>
              <svg style={styles.searchIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                style={styles.searchInput}
                placeholder="Search by game, genre, platform, or PO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showKilled}
                onChange={(e) => setShowKilled(e.target.checked)}
                style={{ marginRight: 6, accentColor: "#6366f1" }}
              />
              Show killed / archived
            </label>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Game</th>
                  <th style={styles.th}>PO</th>
                  <th style={styles.th}>Platform</th>
                  <th style={styles.th}>Genre</th>
                  <th style={styles.th}>Launch</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => (
                  <tr key={game.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.gameCell}>
                        <div style={styles.gameIcon}>
                          {String(game.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.nameText}>{game.name}</div>
                          <div style={styles.subText}>ID #{game.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{game.po_name}</td>
                    <td style={styles.td}>
                      <span style={styles.platformBadge}>{game.platform}</span>
                    </td>
                    <td style={styles.td}>{game.genre}</td>
                    <td style={styles.td}>
                      {game.launch_date ? String(game.launch_date).slice(0, 10) : "-"}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(game.status)
                      }}>
                        {game.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button style={styles.teamBtn} onClick={() => openTeamModal({ id: game.id, name: game.name })}>Team</button>
                        <button style={styles.editBtn} onClick={() => openEdit(game)}>Edit</button>
                        <button style={styles.deleteBtn} onClick={() => deleteGame(game.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGames.length === 0 && (
                  <tr>
                    <td colSpan={7} style={styles.emptyRow}>
                      <div style={styles.emptyState}>
                        <svg width="40" height="40" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4M8 10v4"/>
                        </svg>
                        <div>No games found</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <>
          <div style={styles.analyticsStatsGrid}>
            <div style={{ ...styles.analyticsStatCard, background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
              <div style={styles.analyticsStatLabel}>Total Revenue</div>
              <div style={styles.analyticsStatValue}>{formatNumber(totalRevenue)}</div>
              <div style={styles.analyticsStatHint}>PKR · {monthKey}</div>
            </div>
            <div style={{ ...styles.analyticsStatCard, background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              <div style={styles.analyticsStatLabel}>Total Cost</div>
              <div style={styles.analyticsStatValue}>{formatNumber(totalCost)}</div>
              <div style={styles.analyticsStatHint}>PKR · {monthKey}</div>
            </div>
            <div style={{ ...styles.analyticsStatCard, background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <div style={styles.analyticsStatLabel}>Net Profit</div>
              <div style={styles.analyticsStatValue}>{formatNumber(totalRevenue - totalCost)}</div>
              <div style={styles.analyticsStatHint}>PKR · {monthKey}</div>
            </div>
            <div style={{ ...styles.analyticsStatCard, background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <div style={styles.analyticsStatLabel}>Profitable Games</div>
              <div style={styles.analyticsStatValue}>{profitableCount}</div>
              <div style={styles.analyticsStatHint}>of {analyticsGames.length} total</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.toolbar}>
              <div style={styles.searchWrap}>
                <svg style={styles.searchIcon} width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  style={styles.searchInput}
                  placeholder="Search by game, PO, or genre..."
                  value={analyticsSearch}
                  onChange={(e) => setAnalyticsSearch(e.target.value)}
                />
              </div>
              <span style={styles.rowCount}>{filteredAnalytics.length} games</span>
            </div>

            {analyticsLoading ? (
              <div style={styles.loadingRow}>Loading analytics...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>Game</th>
                      <th style={styles.th}>PO</th>
                      <th style={styles.th}>Devs</th>
                      <th style={styles.th}>Artists</th>
                      <th style={styles.th}>QA</th>
                      <th style={styles.th}>Marketing</th>
                      <th style={styles.th}>Team Cost</th>
                      <th style={styles.th}>Total Cost</th>
                      <th style={styles.th}>Revenue</th>
                      <th style={styles.th}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalytics.map((g) => {
                      const profit = Number(g.profit);
                      return (
                        <tr key={g.game_id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={styles.gameCell}>
                              <div style={styles.gameIcon}>
                                {String(g.game_name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={styles.nameText}>{g.game_name}</div>
                                <div style={styles.subText}>{g.platform} · {g.genre}</div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>{g.po_name || "-"}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>{g.dev_count}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>{g.artist_count}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>{g.qa_count}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>{g.marketing_count}</td>
                          <td style={styles.td}>{formatNumber(g.direct_team_cost)}</td>
                          <td style={styles.td}>{formatNumber(g.total_cost)}</td>
                          <td style={styles.td}>{formatNumber(g.total_revenue)}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.profitBadge,
                              background: profit >= 0 ? "#dcfce7" : "#fee2e2",
                              color: profit >= 0 ? "#166534" : "#991b1b"
                            }}>
                              {profit >= 0 ? "▲" : "▼"} {formatNumber(Math.abs(profit))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAnalytics.length === 0 && (
                      <tr>
                        <td colSpan={10} style={styles.emptyRow}>
                          <div style={styles.emptyState}>
                            <svg width="40" height="40" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                              <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
                            </svg>
                            <div>No analytics data for {monthKey}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Team Management Modal */}
      <Modal
        open={!!teamGame}
        title={teamGame ? `Team · ${teamGame.name}` : "Team"}
        onClose={() => setTeamGame(null)}
        width={820}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Month</label>
            <select
              style={styles.select}
              value={teamMonthKey}
              onChange={async (e) => {
                const m = e.target.value;
                setTeamMonthKey(m);
                if (teamGame) await reloadTeamAllocations(teamGame.id, m);
              }}
            >
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Current team members */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Current Team Members</div>
            {teamAllocations.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>No team members assigned for this month.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Allocation %</th>
                    <th style={styles.th}>Notes</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamAllocations.map((a) => (
                    <tr key={a.id}>
                      <td style={styles.td}>{a.employee_name}</td>
                      <td style={styles.td}>{a.role_name || "-"}</td>
                      <td style={styles.td}>{Number(a.allocation_percent)}%</td>
                      <td style={styles.td}>{a.notes || "-"}</td>
                      <td style={styles.td}>
                        <button style={styles.deleteBtn} onClick={() => removeTeamMember(a.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add team member form */}
          <form onSubmit={addTeamMember} style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Add Team Member</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr auto", gap: 10, alignItems: "end" }}>
              <div style={styles.field}>
                <label style={styles.label}>Employee</label>
                <select
                  style={styles.input}
                  value={teamForm.employee_id}
                  onChange={(e) => setTeamForm({ ...teamForm, employee_id: e.target.value })}
                >
                  <option value="">Select Employee</option>
                  {teamEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Allocation %</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="100"
                  value={teamForm.allocation_percent}
                  onChange={(e) => setTeamForm({ ...teamForm, allocation_percent: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Notes</label>
                <input
                  style={styles.input}
                  placeholder="Optional"
                  value={teamForm.notes}
                  onChange={(e) => setTeamForm({ ...teamForm, notes: e.target.value })}
                />
              </div>
              <button type="submit" style={{ ...styles.primaryBtn, whiteSpace: "nowrap" }} disabled={teamLoading}>
                {teamLoading ? "Adding..." : "+ Add"}
              </button>
            </div>
            {teamError && <div style={{ ...styles.errorBox, marginTop: 10, gridColumn: "1/-1" }}>{teamError}</div>}
          </form>
        </div>
      </Modal>

      {/* Game Modal */}
      <Modal
        open={showModal}
        title={editingId ? "Edit Game" : "Add Game"}
        onClose={() => setShowModal(false)}
        width={760}
      >
        <form onSubmit={save} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Game Name</label>
            <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter game name" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Assign to PO</label>
            <select style={styles.input} value={form.po_id} onChange={(e) => setForm({ ...form, po_id: e.target.value })}>
              <option value="">Select PO</option>
              {productOwners.map((po) => <option key={po.id} value={po.id}>{po.name}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Platform</label>
            <select style={styles.input} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              <option>Android</option>
              <option>iOS</option>
              <option>Both</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Genre</label>
            <input style={styles.input} value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Enter genre" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Live</option>
              <option>Soft Launch</option>
              <option>In Development</option>
              <option>Killed</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Launch Date</label>
            <input style={styles.input} type="date" value={form.launch_date} onChange={(e) => setForm({ ...form, launch_date: e.target.value })} />
          </div>
          {error && <div style={styles.errorBox}>{error}</div>}
          <div style={styles.modalFooter}>
            <button type="button" style={styles.secondaryBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button style={styles.primaryBtn} type="submit">{editingId ? "Update Game" : "Save Game"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case "Live": return { background: "#dcfce7", color: "#166534" };
    case "Killed": return { background: "#fee2e2", color: "#991b1b" };
    case "Soft Launch": return { background: "#fef3c7", color: "#92400e" };
    default: return { background: "#e0e7ff", color: "#3730a3" };
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 24
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
  primaryBtn: {
    padding: "10px 18px",
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 4px 14px rgba(99,102,241,0.35)"
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    color: "#475569",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14
  },
  select: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 20
  },
  statCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)"
  },
  statLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600
  },
  statValue: {
    fontSize: 32,
    fontWeight: 800,
    marginTop: 6,
    letterSpacing: "-0.02em"
  },
  statHint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4
  },
  tabBar: {
    display: "flex",
    gap: 4,
    background: "#fff",
    borderRadius: 14,
    padding: 6,
    marginBottom: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    width: "fit-content"
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 18px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.15s"
  },
  tabActive: {
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(99,102,241,0.3)"
  },
  tabBadge: {
    background: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    padding: "1px 8px",
    fontSize: 11,
    fontWeight: 600
  },
  analyticsStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 20
  },
  analyticsStatCard: {
    borderRadius: 16,
    padding: "18px 20px",
    color: "#fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
  },
  analyticsStatLabel: {
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.85
  },
  analyticsStatValue: {
    fontSize: 26,
    fontWeight: 800,
    marginTop: 6,
    letterSpacing: "-0.02em"
  },
  analyticsStatHint: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)"
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap"
  },
  searchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    pointerEvents: "none"
  },
  searchInput: {
    padding: "10px 14px 10px 36px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
    width: 320,
    color: "#0f172a",
    background: "#f8fafc"
  },
  checkboxLabel: {
    color: "#475569",
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  rowCount: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: 500
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  thead: {
    background: "#f8fafc"
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderBottom: "1px solid #f1f5f9"
  },
  tr: {
    borderBottom: "1px solid #f8fafc",
    transition: "background 0.1s"
  },
  td: {
    padding: "14px",
    color: "#0f172a",
    fontSize: 14,
    verticalAlign: "middle"
  },
  gameCell: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  gameIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
    color: "#4338ca",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0
  },
  nameText: {
    fontWeight: 600,
    color: "#0f172a",
    fontSize: 14
  },
  subText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2
  },
  platformBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#475569"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600
  },
  profitBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700
  },
  actions: {
    display: "flex",
    gap: 8
  },
  teamBtn: {
    padding: "6px 14px",
    border: "none",
    borderRadius: 8,
    background: "#e0e7ff",
    color: "#4338ca",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  },
  editBtn: {
    padding: "6px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    color: "#475569",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  },
  deleteBtn: {
    padding: "6px 14px",
    border: "none",
    borderRadius: 8,
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  },
  emptyRow: {
    padding: 40,
    textAlign: "center"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    color: "#94a3b8",
    fontSize: 14
  },
  loadingRow: {
    padding: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151"
  },
  input: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
    color: "#0f172a"
  },
  errorBox: {
    gridColumn: "1 / -1",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14
  },
  modalFooter: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8
  },
  secondaryBtn: {
    padding: "10px 18px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    color: "#374151",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14
  }
};
