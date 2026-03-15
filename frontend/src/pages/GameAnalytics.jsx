import { useEffect, useMemo, useState } from "react";
import api, { downloadExport } from "../api/api";

export default function GameAnalytics() {
  const [monthKey, setMonthKey] = useState("2026-03");
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [monthKey]);

  async function loadData() {
    const res = await api.get(`/game-analytics/${monthKey}`);
    setGames(res.data.data || []);
  }
  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) =>
      String(g.game_name || "").toLowerCase().includes(q) ||
      String(g.po_name || "").toLowerCase().includes(q) ||
      String(g.genre || "").toLowerCase().includes(q)
    );
  }, [games, search]);

  return (
    <div>
  <div style={styles.topbarActions}>
  <select
    style={styles.select}
    value={monthKey}
    onChange={(e) => setMonthKey(e.target.value)}
  >
    <option value="2026-03">2026-03</option>
    <option value="2026-02">2026-02</option>
  </select>

  <button
    style={styles.primaryBtn}
    onClick={() => downloadExport(`/export/games/${monthKey}`, `games-finance-${monthKey}.csv`)}
  >
    Export Game Report
  </button>
</div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by game, PO, or genre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
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
              {filteredGames.map((g) => (
                <tr key={g.game_id}>
                  <td style={styles.td}>
                    <div>
                      <div style={styles.nameText}>{g.game_name}</div>
                      <div style={styles.subText}>
                        {g.platform} • {g.genre}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{g.po_name || "-"}</td>
                  <td style={styles.td}>{g.dev_count}</td>
                  <td style={styles.td}>{g.artist_count}</td>
                  <td style={styles.td}>{g.qa_count}</td>
                  <td style={styles.td}>{g.marketing_count}</td>
                  <td style={styles.td}>{formatNumber(g.direct_team_cost)}</td>
                  <td style={styles.td}>{formatNumber(g.total_cost)}</td>
                  <td style={styles.td}>{formatNumber(g.total_revenue)}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background:
                          Number(g.profit) >= 0 ? "#dcfce7" : "#fee2e2",
                        color:
                          Number(g.profit) >= 0 ? "#166534" : "#991b1b"
                      }}
                    >
                      {formatNumber(g.profit)}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredGames.length === 0 ? (
                <tr>
                  <td style={styles.emptyRow} colSpan={10}>
                    No game analytics found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

const styles = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    marginBottom: 24
  },
  topbarActions: {
    display: "flex",
    gap: 10,
    alignItems: "center"
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer"
  },
  pageTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: "#0f172a"
  },
  pageSubtitle: {
    margin: "6px 0 0 0",
    color: "#64748b"
  },
  select: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff"
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)"
  },
  toolbar: {
    marginBottom: 16
  },
  searchInput: {
    minWidth: 320,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    outline: "none"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 14
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #f1f5f9"
  },
  nameText: {
    fontWeight: 600,
    color: "#0f172a"
  },
  subText: {
    marginTop: 2,
    fontSize: 12,
    color: "#94a3b8"
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600
  },
  emptyRow: {
    textAlign: "center",
    padding: 20,
    color: "#94a3b8"
  }
  
};