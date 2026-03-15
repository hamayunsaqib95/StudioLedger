import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Modal from "../components/Modal";

export default function RevenueUA() {
  const [games, setGames] = useState([]);
  const [uaList, setUaList] = useState([]);
  const [revenueList, setRevenueList] = useState([]);
  const [search, setSearch] = useState("");

  const [showUAModal, setShowUAModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const [uaError, setUaError] = useState("");
  const [revError, setRevError] = useState("");

  const emptyUAForm = {
    month_key: "2026-03",
    game_id: "",
    channel: "Meta",
    campaign_name: "",
    amount: "",
    currency: "USD",
    notes: ""
  };

  const emptyRevenueForm = {
    month_key: "2026-03",
    game_id: "",
    platform: "Both",
    ad_revenue: "",
    iap_revenue: "",
    subscription_revenue: "",
    other_revenue: "",
    currency: "USD"
  };

  const [uaForm, setUaForm] = useState(emptyUAForm);
  const [revForm, setRevForm] = useState(emptyRevenueForm);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [gamesRes, uaRes, revRes] = await Promise.all([
      api.get("/games"),
      api.get("/ua"),
      api.get("/revenues")
    ]);

    const gameList = gamesRes.data.data || [];
    setGames(gameList);
    setUaList(uaRes.data.data || []);
    setRevenueList(revRes.data.data || []);

    if (gameList.length > 0) {
      if (!uaForm.game_id) {
        setUaForm((prev) => ({ ...prev, game_id: String(gameList[0].id) }));
      }
      if (!revForm.game_id) {
        setRevForm((prev) => ({ ...prev, game_id: String(gameList[0].id) }));
      }
    }
  }

  function openUAModal() {
    setUaError("");
    setUaForm({
      ...emptyUAForm,
      game_id: games.length > 0 ? String(games[0].id) : ""
    });
    setShowUAModal(true);
  }

  function openRevenueModal() {
    setRevError("");
    setRevForm({
      ...emptyRevenueForm,
      game_id: games.length > 0 ? String(games[0].id) : ""
    });
    setShowRevenueModal(true);
  }

  function validMonth(v) {
    return /^\d{4}-\d{2}$/.test(v);
  }

  function validateUA() {
    if (!validMonth(uaForm.month_key)) {
      setUaError("Month must be in YYYY-MM format.");
      return false;
    }
    if (!uaForm.game_id || !uaForm.channel.trim() || !uaForm.campaign_name.trim()) {
      setUaError("Please complete all required UA fields.");
      return false;
    }
    if (Number(uaForm.amount) <= 0) {
      setUaError("UA amount must be greater than 0.");
      return false;
    }
    setUaError("");
    return true;
  }

  function validateRevenue() {
    if (!validMonth(revForm.month_key)) {
      setRevError("Month must be in YYYY-MM format.");
      return false;
    }
    if (!revForm.game_id || !revForm.platform || !revForm.currency) {
      setRevError("Please complete all required revenue fields.");
      return false;
    }

    const values = [
      Number(revForm.ad_revenue || 0),
      Number(revForm.iap_revenue || 0),
      Number(revForm.subscription_revenue || 0),
      Number(revForm.other_revenue || 0)
    ];

    if (values.some((v) => v < 0)) {
      setRevError("Revenue values cannot be negative.");
      return false;
    }

    if (values.every((v) => v === 0)) {
      setRevError("At least one revenue value must be greater than 0.");
      return false;
    }

    setRevError("");
    return true;
  }

  async function saveUA(e) {
    e.preventDefault();
    if (!validateUA()) return;

    try {
      await api.post("/ua", {
        ...uaForm,
        game_id: Number(uaForm.game_id),
        amount: Number(uaForm.amount)
      });

      setShowUAModal(false);
      await loadAll();
    } catch (error) {
      setUaError(error?.response?.data?.message || "Failed to save UA spend.");
    }
  }

  async function saveRevenue(e) {
    e.preventDefault();
    if (!validateRevenue()) return;

    try {
      await api.post("/revenues", {
        ...revForm,
        game_id: Number(revForm.game_id),
        ad_revenue: Number(revForm.ad_revenue || 0),
        iap_revenue: Number(revForm.iap_revenue || 0),
        subscription_revenue: Number(revForm.subscription_revenue || 0),
        other_revenue: Number(revForm.other_revenue || 0)
      });

      setShowRevenueModal(false);
      await loadAll();
    } catch (error) {
      setRevError(error?.response?.data?.message || "Failed to save revenue.");
    }
  }

  const filteredUA = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return uaList;
    return uaList.filter((u) =>
      String(u.game_name || "").toLowerCase().includes(q) ||
      String(u.channel || "").toLowerCase().includes(q) ||
      String(u.campaign_name || "").toLowerCase().includes(q)
    );
  }, [uaList, search]);

  const filteredRevenue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return revenueList;
    return revenueList.filter((r) =>
      String(r.game_name || "").toLowerCase().includes(q) ||
      String(r.platform || "").toLowerCase().includes(q) ||
      String(r.currency || "").toLowerCase().includes(q)
    );
  }, [revenueList, search]);

  const totalUARecords = uaList.length;
  const totalRevenueRecords = revenueList.length;
  const activeGames = games.filter((g) => g.status !== "Killed").length;

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>UA & Revenue</h1>
          <p style={styles.pageSubtitle}>
            Manage user acquisition spend and game revenue records
          </p>
        </div>

        <div style={styles.topbarActions}>
          <button style={styles.secondaryBtn} onClick={openUAModal}>
            + Add UA Spend
          </button>
          <button style={styles.primaryBtn} onClick={openRevenueModal}>
            + Add Revenue
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <div style={styles.statLabel}>UA Records</div>
          <div style={{ ...styles.statValue, color: "#ef4444" }}>{totalUARecords}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Revenue Records</div>
          <div style={{ ...styles.statValue, color: "#10b981" }}>{totalRevenueRecords}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>Active Games</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{activeGames}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by game, channel, campaign, or platform"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.twoCols}>
          <div style={styles.innerCard}>
            <h3 style={styles.sectionTitle}>UA Spend History</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>Game</th>
                    <th style={styles.th}>Channel</th>
                    <th style={styles.th}>Campaign</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUA.map((u) => (
                    <tr key={u.id}>
                      <td style={styles.td}>{u.month_key}</td>
                      <td style={styles.td}>{u.game_name}</td>
                      <td style={styles.td}>{u.channel}</td>
                      <td style={styles.td}>{u.campaign_name}</td>
                      <td style={styles.td}>{u.amount}</td>
                      <td style={styles.td}>{u.currency}</td>
                    </tr>
                  ))}
                  {filteredUA.length === 0 ? (
                    <tr>
                      <td style={styles.emptyRow} colSpan={6}>No UA records found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.innerCard}>
            <h3 style={styles.sectionTitle}>Revenue History</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>Game</th>
                    <th style={styles.th}>Platform</th>
                    <th style={styles.th}>Ad</th>
                    <th style={styles.th}>IAP</th>
                    <th style={styles.th}>Subs</th>
                    <th style={styles.th}>Other</th>
                    <th style={styles.th}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenue.map((r) => (
                    <tr key={r.id}>
                      <td style={styles.td}>{r.month_key}</td>
                      <td style={styles.td}>{r.game_name}</td>
                      <td style={styles.td}>{r.platform}</td>
                      <td style={styles.td}>{r.ad_revenue}</td>
                      <td style={styles.td}>{r.iap_revenue}</td>
                      <td style={styles.td}>{r.subscription_revenue}</td>
                      <td style={styles.td}>{r.other_revenue}</td>
                      <td style={styles.td}>{r.currency}</td>
                    </tr>
                  ))}
                  {filteredRevenue.length === 0 ? (
                    <tr>
                      <td style={styles.emptyRow} colSpan={8}>No revenue records found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showUAModal}
        title="Add UA Spend"
        onClose={() => setShowUAModal(false)}
        width={720}
      >
        <form onSubmit={saveUA} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Month</label>
            <input
              style={styles.input}
              value={uaForm.month_key}
              onChange={(e) => setUaForm({ ...uaForm, month_key: e.target.value })}
              placeholder="YYYY-MM"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Game</label>
            <select
              style={styles.input}
              value={uaForm.game_id}
              onChange={(e) => setUaForm({ ...uaForm, game_id: e.target.value })}
            >
              <option value="">Select Game</option>
              {games
                .filter((g) => g.status !== "Killed")
                .map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Channel</label>
            <input
              style={styles.input}
              value={uaForm.channel}
              onChange={(e) => setUaForm({ ...uaForm, channel: e.target.value })}
              placeholder="Meta, Google Ads, TikTok..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Campaign Name</label>
            <input
              style={styles.input}
              value={uaForm.campaign_name}
              onChange={(e) => setUaForm({ ...uaForm, campaign_name: e.target.value })}
              placeholder="Enter campaign name"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Amount</label>
            <input
              style={styles.input}
              type="number"
              value={uaForm.amount}
              onChange={(e) => setUaForm({ ...uaForm, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Currency</label>
            <select
              style={styles.input}
              value={uaForm.currency}
              onChange={(e) => setUaForm({ ...uaForm, currency: e.target.value })}
            >
              <option>USD</option>
              <option>PKR</option>
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Notes</label>
            <input
              style={styles.input}
              value={uaForm.notes}
              onChange={(e) => setUaForm({ ...uaForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          {uaError ? <div style={styles.errorBox}>{uaError}</div> : null}

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setShowUAModal(false)}
            >
              Cancel
            </button>
            <button style={styles.primaryBtn} type="submit">
              Save UA Spend
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showRevenueModal}
        title="Add Revenue"
        onClose={() => setShowRevenueModal(false)}
        width={760}
      >
        <form onSubmit={saveRevenue} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Month</label>
            <input
              style={styles.input}
              value={revForm.month_key}
              onChange={(e) => setRevForm({ ...revForm, month_key: e.target.value })}
              placeholder="YYYY-MM"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Game</label>
            <select
              style={styles.input}
              value={revForm.game_id}
              onChange={(e) => setRevForm({ ...revForm, game_id: e.target.value })}
            >
              <option value="">Select Game</option>
              {games
                .filter((g) => g.status !== "Killed")
                .map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Platform</label>
            <select
              style={styles.input}
              value={revForm.platform}
              onChange={(e) => setRevForm({ ...revForm, platform: e.target.value })}
            >
              <option>Android</option>
              <option>iOS</option>
              <option>Both</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Currency</label>
            <select
              style={styles.input}
              value={revForm.currency}
              onChange={(e) => setRevForm({ ...revForm, currency: e.target.value })}
            >
              <option>USD</option>
              <option>PKR</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Ad Revenue</label>
            <input
              style={styles.input}
              type="number"
              value={revForm.ad_revenue}
              onChange={(e) => setRevForm({ ...revForm, ad_revenue: e.target.value })}
              placeholder="0"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>IAP Revenue</label>
            <input
              style={styles.input}
              type="number"
              value={revForm.iap_revenue}
              onChange={(e) => setRevForm({ ...revForm, iap_revenue: e.target.value })}
              placeholder="0"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subscription Revenue</label>
            <input
              style={styles.input}
              type="number"
              value={revForm.subscription_revenue}
              onChange={(e) => setRevForm({ ...revForm, subscription_revenue: e.target.value })}
              placeholder="0"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Other Revenue</label>
            <input
              style={styles.input}
              type="number"
              value={revForm.other_revenue}
              onChange={(e) => setRevForm({ ...revForm, other_revenue: e.target.value })}
              placeholder="0"
            />
          </div>

          {revError ? <div style={styles.errorBox}>{revError}</div> : null}

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setShowRevenueModal(false)}
            >
              Cancel
            </button>
            <button style={styles.primaryBtn} type="submit">
              Save Revenue
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 24 },
  topbarActions: { display: "flex", gap: 10 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 },
  statCard: { background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  statLabel: { color: "#64748b", fontSize: 13, fontWeight: 600 },
  statValue: { marginTop: 6, fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap"
  },
  searchInput: { minWidth: 300, padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, background: "#f8fafc" },
  twoCols: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  innerCard: { background: "#f8fafc", borderRadius: 14, padding: 16 },
  sectionTitle: { marginTop: 0, marginBottom: 14, color: "#0f172a", fontSize: 15, fontWeight: 700 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", color: "#64748b", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle", fontSize: 14 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" },
  secondaryBtn: { padding: "10px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none", fontSize: 14 },
  errorBox: { gridColumn: "1 / -1", background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  modalFooter: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 }
};