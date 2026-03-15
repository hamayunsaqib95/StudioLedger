import { useEffect, useState } from "react";
import api from "../api/api";
import Modal from "../components/Modal";

export default function MonthlyLocks() {
  const [locks, setLocks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    month_key: "2026-03",
    is_locked: false
  });

  useEffect(() => {
    loadLocks();
  }, []);

  async function loadLocks() {
    const res = await api.get("/monthly-locks");
    setLocks(res.data.data || []);
  }

  function openModal() {
    setError("");
    setForm({
      month_key: "2026-03",
      is_locked: false
    });
    setShowModal(true);
  }

  function validateForm() {
    if (!/^\d{4}-\d{2}$/.test(form.month_key)) {
      setError("Month must be in YYYY-MM format.");
      return false;
    }
    setError("");
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await api.post("/monthly-locks/toggle", {
        month_key: form.month_key,
        is_locked: form.is_locked,
        locked_by: "COO"
      });

      setShowModal(false);
      await loadLocks();
    } catch (error) {
      setError(error?.response?.data?.message || "Failed to update lock.");
    }
  }

  const lockedCount = locks.filter((l) => l.is_locked).length;
  const unlockedCount = locks.filter((l) => !l.is_locked).length;

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Monthly Locks</h1>
          <p style={styles.pageSubtitle}>
            Lock or unlock a reporting month to control financial changes
          </p>
        </div>

        <button style={styles.primaryBtn} onClick={openModal}>
          + Update Lock
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <div style={styles.statLabel}>Locked Months</div>
          <div style={{ ...styles.statValue, color: "#ef4444" }}>{lockedCount}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Unlocked Months</div>
          <div style={{ ...styles.statValue, color: "#10b981" }}>{unlockedCount}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>Tracked Months</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{locks.length}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Locked By</th>
                <th style={styles.th}>Locked At</th>
              </tr>
            </thead>
            <tbody>
              {locks.map((l) => (
                <tr key={l.id}>
                  <td style={styles.td}>{l.month_key}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: l.is_locked ? "#fee2e2" : "#dcfce7",
                        color: l.is_locked ? "#991b1b" : "#166534"
                      }}
                    >
                      {l.is_locked ? "Locked" : "Unlocked"}
                    </span>
                  </td>
                  <td style={styles.td}>{l.locked_by || "-"}</td>
                  <td style={styles.td}>
                    {l.locked_at ? new Date(l.locked_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}

              {locks.length === 0 ? (
                <tr>
                  <td style={styles.emptyRow} colSpan={4}>
                    No monthly lock records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        title="Update Monthly Lock"
        onClose={() => setShowModal(false)}
        width={640}
      >
        <form onSubmit={save} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Month</label>
            <input
              style={styles.input}
              value={form.month_key}
              onChange={(e) => setForm({ ...form, month_key: e.target.value })}
              placeholder="YYYY-MM"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              style={styles.input}
              value={String(form.is_locked)}
              onChange={(e) =>
                setForm({ ...form, is_locked: e.target.value === "true" })
              }
            >
              <option value="false">Unlocked</option>
              <option value="true">Locked</option>
            </select>
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button style={styles.primaryBtn} type="submit">
              Save
            </button>
          </div>
        </form>
      </Modal>
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
  statValue: { marginTop: 6, fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", color: "#64748b", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 14 },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" },
  secondaryBtn: { padding: "10px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none", fontSize: 14 },
  errorBox: { gridColumn: "1 / -1", background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  modalFooter: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 }
};