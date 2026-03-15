import { useEffect, useMemo, useState } from "react";
import api, { downloadExport } from "../api/api";
import Modal from "../components/Modal";

const emptyForm = {
  month_key: "2026-03",
  employee_id: "",
  allocation_scope: "DirectGame",
  po_id: "",
  game_id: "",
  allocation_percent: "",
  notes: ""
};

export default function Allocations() {
  const [monthKey, setMonthKey] = useState("2026-03");
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [games, setGames] = useState([]);
  const [pos, setPos] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [monthKey]);
  async function loadData() {
    const [allocRes, empRes, gameRes, poRes] = await Promise.all([
      api.get(`/allocations/${monthKey}`),
      api.get("/employees"),
      api.get("/games"),
      api.get("/product-owners")
    ]);

    setRows(allocRes.data.data || []);
    setEmployees(empRes.data.data || []);
    setGames(gameRes.data.data || []);
    setPos(poRes.data.data || []);
  }

  function openCreate() {
    setEditing(null);
    setError("");
    setForm({
      ...emptyForm,
      month_key: monthKey,
      employee_id: employees[0]?.id ? String(employees[0].id) : "",
      po_id: pos[0]?.id ? String(pos[0].id) : "",
      game_id: games[0]?.id ? String(games[0].id) : ""
    });
    setShowModal(true);
  }

  function openEdit(row) {
    setEditing(row);
    setError("");
    setForm({
      month_key: row.month_key || monthKey,
      employee_id: String(row.employee_id || ""),
      allocation_scope: row.allocation_scope || "DirectGame",
      po_id: row.po_id ? String(row.po_id) : "",
      game_id: row.game_id ? String(row.game_id) : "",
      allocation_percent: row.allocation_percent || "",
      notes: row.notes || ""
    });
    setShowModal(true);
  }

  function validate() {
    if (!form.employee_id || !form.allocation_scope || !form.allocation_percent) {
      setError("Please complete required fields.");
      return false;
    }

    const percent = Number(form.allocation_percent);
    if (percent <= 0 || percent > 100) {
      setError("Allocation % must be between 1 and 100.");
      return false;
    }

    if (form.allocation_scope === "DirectGame" && !form.game_id) {
      setError("Game is required for DirectGame allocation.");
      return false;
    }

    if (form.allocation_scope === "POShared" && !form.po_id) {
      setError("PO is required for POShared allocation.");
      return false;
    }

    setError("");
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      month_key: form.month_key,
      employee_id: Number(form.employee_id),
      allocation_scope: form.allocation_scope,
      po_id: form.allocation_scope === "POShared" ? Number(form.po_id) : null,
      game_id: form.allocation_scope === "DirectGame" ? Number(form.game_id) : null,
      allocation_percent: Number(form.allocation_percent),
      notes: form.notes
    };

    if (editing?.id) {
      await api.put(`/allocations/${editing.id}`, payload);
    } else {
      await api.post("/allocations", payload);
    }

    setShowModal(false);
    await loadData();
  }

  async function removeAllocation(id) {
    const ok = window.confirm("Delete this allocation?");
    if (!ok) return;
    await api.delete(`/allocations/${id}`);
    await loadData();
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.employee_name || "").toLowerCase().includes(q) ||
      String(r.role_name || "").toLowerCase().includes(q) ||
      String(r.po_name || "").toLowerCase().includes(q) ||
      String(r.game_name || "").toLowerCase().includes(q) ||
      String(r.allocation_scope || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Resource Allocation Manager</h1>
          <p style={styles.pageSubtitle}>
            Assign employees to games, PO-shared work, or studio-shared work
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
    onClick={() => downloadExport(`/export/allocations/${monthKey}`, `team-allocations-${monthKey}.csv`)}
  >
    Export Allocation Report
  </button>

  <button style={styles.primaryBtn} onClick={openCreate}>
    + Add Allocation
  </button>
</div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by employee, role, PO, game, or scope"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Scope</th>
                <th style={styles.th}>PO</th>
                <th style={styles.th}>Game</th>
                <th style={styles.th}>%</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id}>
                  <td style={styles.td}>{r.employee_name}</td>
                  <td style={styles.td}>{r.role_name}</td>
                  <td style={styles.td}>{r.allocation_scope}</td>
                  <td style={styles.td}>{r.po_name || "-"}</td>
                  <td style={styles.td}>{r.game_name || "-"}</td>
                  <td style={styles.td}>{Number(r.allocation_percent || 0)}%</td>
                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      <button style={styles.smallBtn} onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      <button style={styles.smallDangerBtn} onClick={() => removeAllocation(r.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td style={styles.emptyRow} colSpan={7}>
                    No allocations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Allocation" : "Create Allocation"}
        width={760}
      >
        <form onSubmit={save} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Employee</label>
            <select
              style={styles.input}
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Scope</label>
            <select
              style={styles.input}
              value={form.allocation_scope}
              onChange={(e) => setForm({ ...form, allocation_scope: e.target.value })}
            >
              <option value="DirectGame">DirectGame</option>
              <option value="POShared">POShared</option>
              <option value="StudioShared">StudioShared</option>
            </select>
          </div>

          {form.allocation_scope === "POShared" && (
            <div style={styles.field}>
              <label style={styles.label}>PO</label>
              <select
                style={styles.input}
                value={form.po_id}
                onChange={(e) => setForm({ ...form, po_id: e.target.value })}
              >
                <option value="">Select PO</option>
                {pos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.po_name || p.full_name || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.allocation_scope === "DirectGame" && (
            <div style={styles.field}>
              <label style={styles.label}>Game</label>
              <select
                style={styles.input}
                value={form.game_id}
                onChange={(e) => setForm({ ...form, game_id: e.target.value })}
              >
                <option value="">Select Game</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Allocation %</label>
            <input
              style={styles.input}
              type="number"
              value={form.allocation_percent}
              onChange={(e) => setForm({ ...form, allocation_percent: e.target.value })}
            />
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Notes</label>
            <input
              style={styles.input}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <div style={styles.modalFooter}>
            <button type="button" style={styles.secondaryBtn} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryBtn}>
              Save Allocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  page: { minHeight: "100%" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24 },
  topbarActions: { display: "flex", gap: 10, alignItems: "center" },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  select: { padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" },
  secondaryBtn: { padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { marginBottom: 16 },
  searchInput: { minWidth: 300, padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, background: "#f8fafc" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f8fafc", color: "#64748b", fontWeight: 600, textAlign: "left", padding: "12px 14px", fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" },
  td: { padding: "13px 14px", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontSize: 14 },
  actionRow: { display: "flex", gap: 8 },
  smallBtn: { padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  smallDangerBtn: { padding: "6px 14px", border: "none", borderRadius: 8, background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, width: "100%", color: "#0f172a", fontSize: 14 },
  errorBox: { gridColumn: "1 / -1", color: "#991b1b", background: "#fee2e2", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  modalFooter: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }
};