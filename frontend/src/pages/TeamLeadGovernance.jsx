import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Modal from "../components/Modal";

export default function TeamLeadGovernance() {
  const [monthKey, setMonthKey] = useState("2026-03");
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = {
    employee_id: "",
    team_lead_profile_id: "",
    po_name: "",
    email: "",
    monthly_salary: "",
    salary_currency: "PKR",
    profit_share_percent: "",
    effective_from: "2026-03-14",
    changed_by_user_id: ""
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, [monthKey]);

  async function loadData() {
    const [govRes, empRes] = await Promise.all([
      api.get(`/team-lead-governance/${monthKey}`),
      api.get("/employees")
    ]);

    const govRows = govRes.data.data || [];
    setRows(govRows);
    setTeamLeads(govRows);
    setEmployees((empRes.data.data || []).filter((e) => e.status === "Active"));
  }

  function openPromoteModal() {
    setError("");
    setForm({
      ...emptyForm,
      employee_id: employees.length > 0 ? String(employees[0].id) : "",
      team_lead_profile_id: teamLeads.length > 0 ? String(teamLeads[0].team_lead_id) : ""
    });
    setShowModal(true);
  }

  function validateForm() {
    if (
      !form.employee_id ||
      !form.team_lead_profile_id ||
      !form.po_name.trim() ||
      !form.email.trim() ||
      !String(form.monthly_salary).trim() ||
      !String(form.profit_share_percent).trim() ||
      !form.effective_from
    ) {
      setError("Please complete all required fields.");
      return false;
    }

    if (Number(form.monthly_salary) < 0) {
      setError("Monthly salary cannot be negative.");
      return false;
    }

    if (Number(form.profit_share_percent) < 0) {
      setError("Profit % cannot be negative.");
      return false;
    }

    setError("");
    return true;
  }

  async function savePromotion(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await api.post("/team-lead-governance/promote-to-po", {
        ...form,
        employee_id: Number(form.employee_id),
        team_lead_profile_id: Number(form.team_lead_profile_id),
        monthly_salary: Number(form.monthly_salary),
        profit_share_percent: Number(form.profit_share_percent),
        changed_by_user_id: null
      });

      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to promote employee.");
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.team_lead_name || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Team Lead Governance</h1>
          <p style={styles.pageSubtitle}>
            Monitor Team Lead PO profit-share pool usage and promote employees to PO
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

          <button style={styles.primaryBtn} onClick={openPromoteModal}>
            + Promote Employee to PO
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by Team Lead"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Team Lead</th>
                <th style={styles.th}>Pool %</th>
                <th style={styles.th}>Assigned PO %</th>
                <th style={styles.th}>Remaining %</th>
                <th style={styles.th}>Active POs</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.team_lead_id}>
                  <td style={styles.td}>{r.team_lead_name}</td>
                  <td style={styles.td}>{Number(r.profit_share_pool_percent || 0)}%</td>
                  <td style={styles.td}>{Number(r.assigned_po_percent_total || 0)}%</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background:
                          Number(r.remaining_percent || 0) >= 0 ? "#dcfce7" : "#fee2e2",
                        color:
                          Number(r.remaining_percent || 0) >= 0 ? "#166534" : "#991b1b"
                      }}
                    >
                      {Number(r.remaining_percent || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td style={styles.td}>{Number(r.active_po_count || 0)}</td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td style={styles.emptyRow} colSpan={5}>
                    No Team Lead governance data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        title="Promote Employee to PO"
        onClose={() => setShowModal(false)}
        width={760}
      >
        <form onSubmit={savePromotion} style={styles.formGrid}>
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
            <label style={styles.label}>Team Lead</label>
            <select
              style={styles.input}
              value={form.team_lead_profile_id}
              onChange={(e) => setForm({ ...form, team_lead_profile_id: e.target.value })}
            >
              <option value="">Select Team Lead</option>
              {teamLeads.map((t) => (
                <option key={t.team_lead_id} value={t.team_lead_id}>
                  {t.team_lead_name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PO Name</label>
            <input
              style={styles.input}
              value={form.po_name}
              onChange={(e) => setForm({ ...form, po_name: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Monthly Salary</label>
            <input
              style={styles.input}
              type="number"
              value={form.monthly_salary}
              onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Salary Currency</label>
            <select
              style={styles.input}
              value={form.salary_currency}
              onChange={(e) => setForm({ ...form, salary_currency: e.target.value })}
            >
              <option>PKR</option>
              <option>USD</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Profit Share %</label>
            <input
              style={styles.input}
              type="number"
              value={form.profit_share_percent}
              onChange={(e) => setForm({ ...form, profit_share_percent: e.target.value })}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Effective Date</label>
            <input
              style={styles.input}
              type="date"
              value={form.effective_from}
              onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
            />
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
              Promote to PO
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24 },
  topbarActions: { display: "flex", gap: 10, alignItems: "center" },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  select: { padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14 },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { marginBottom: 16 },
  searchInput: { minWidth: 300, padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, background: "#f8fafc" },
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
