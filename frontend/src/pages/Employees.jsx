import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Modal from "../components/Modal";

const ROLE_COLORS = {
  Dev: { bg: "#e0e7ff", color: "#4338ca" },
  Art: { bg: "#fce7f3", color: "#9d174d" },
  QA: { bg: "#dcfce7", color: "#166534" },
  UI: { bg: "#fef3c7", color: "#92400e" },
  Marketing: { bg: "#ede9fe", color: "#6d28d9" },
  PM: { bg: "#dbeafe", color: "#1d4ed8" }
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [productOwners, setProductOwners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Tracking
  const [trackingEmp, setTrackingEmp] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const emptyForm = {
    full_name: "",
    role: "Dev",
    monthly_salary_pkr: "",
    employment_type: "Full-time",
    assigned_po: "",
    status: "Active"
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [empRes, poRes] = await Promise.all([api.get("/employees"), api.get("/product-owners")]);
    const empList = empRes.data.data || [];
    const poList = poRes.data.data || [];
    setEmployees(empList);
    setProductOwners(poList);
    if (!editingId && poList.length > 0 && !form.assigned_po) {
      setForm((prev) => ({ ...prev, assigned_po: String(poList[0].id) }));
    }
  }

  function openCreate() {
    setEditingId(null);
    setError("");
    setForm({ ...emptyForm, assigned_po: productOwners.length > 0 ? String(productOwners[0].id) : "" });
    setShowModal(true);
  }

  function openEdit(emp) {
    setEditingId(emp.id);
    setError("");
    setForm({
      full_name: emp.full_name || "",
      role: emp.role || "Dev",
      monthly_salary_pkr: emp.monthly_salary_pkr || "",
      employment_type: emp.employment_type || "Full-time",
      assigned_po: String(emp.assigned_po || ""),
      status: emp.status || "Active"
    });
    setShowModal(true);
  }

  function validateForm() {
    if (!form.full_name.trim() || !form.role.trim() || !String(form.monthly_salary_pkr).trim() || !form.employment_type.trim()) {
      setError("Please complete all required employee fields.");
      return false;
    }
    if (Number(form.monthly_salary_pkr) <= 0) {
      setError("Monthly salary must be greater than 0.");
      return false;
    }
    setError("");
    return true;
  }

  async function save(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { ...form, assigned_po: form.assigned_po ? Number(form.assigned_po) : null, monthly_salary_pkr: Number(form.monthly_salary_pkr) };
    if (editingId) {
      await api.put(`/employees/${editingId}`, payload);
    } else {
      await api.post("/employees", payload);
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm, assigned_po: productOwners.length > 0 ? String(productOwners[0].id) : "" });
    await loadAll();
  }

  async function deleteEmployee(id) {
    const ok = window.confirm("Deactivate this employee?");
    if (!ok) return;
    await api.delete(`/employees/${id}`);
    await loadAll();
  }

  async function openTracking(emp) {
    setTrackingEmp(emp);
    setTrackingHistory([]);
    setTrackingLoading(true);
    try {
      const res = await api.get(`/employees/${emp.id}/history`);
      setTrackingEmp(res.data.data.employee);
      setTrackingHistory(res.data.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTrackingLoading(false);
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => showInactive || emp.status !== "Inactive")
      .filter((emp) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          String(emp.full_name || "").toLowerCase().includes(q) ||
          String(emp.role || "").toLowerCase().includes(q) ||
          String(emp.po_name || "").toLowerCase().includes(q)
        );
      });
  }, [employees, showInactive, search]);

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const inactiveCount = employees.filter((e) => e.status === "Inactive").length;
  const totalSalary = employees.filter((e) => e.status === "Active").reduce((sum, e) => sum + Number(e.monthly_salary_pkr || 0), 0);
  const roleBreakdown = employees.filter((e) => e.status === "Active").reduce((acc, e) => {
    acc[e.role] = (acc[e.role] || 0) + 1;
    return acc;
  }, {});
  const topRole = Object.entries(roleBreakdown).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Employees</h1>
          <p style={styles.pageSubtitle}>Manage studio workforce, assignments, and salaries</p>
        </div>
        <button style={styles.primaryBtn} onClick={openCreate}>+ Add Employee</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>Active Employees</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{activeCount}</div>
          <div style={styles.statHint}>On payroll</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <div style={styles.statLabel}>Inactive</div>
          <div style={{ ...styles.statValue, color: "#ef4444" }}>{inactiveCount}</div>
          <div style={styles.statHint}>Off payroll</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Monthly Payroll</div>
          <div style={{ ...styles.statValue, color: "#10b981", fontSize: 22 }}>
            {new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(totalSalary)}
          </div>
          <div style={styles.statHint}>PKR · active employees</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <div style={styles.statLabel}>Largest Team</div>
          <div style={{ ...styles.statValue, color: "#f59e0b" }}>{topRole ? topRole[1] : 0}</div>
          <div style={styles.statHint}>{topRole ? topRole[0] : "—"} engineers</div>
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
              placeholder="Search by name, role, or PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} style={{ marginRight: 6, accentColor: "#6366f1" }} />
              Show inactive
            </label>
            <span style={styles.rowCount}>{filteredEmployees.length} employees</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Employment</th>
                <th style={styles.th}>PO</th>
                <th style={styles.th}>Salary (PKR)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const roleStyle = ROLE_COLORS[emp.role] || { bg: "#f1f5f9", color: "#475569" };
                return (
                  <tr key={emp.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={styles.avatar}>
                          {String(emp.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.nameText}>{emp.full_name}</div>
                          <div style={styles.subText}>#{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.color }}>
                        {emp.role}
                      </span>
                    </td>
                    <td style={styles.td}>{emp.employment_type}</td>
                    <td style={styles.td}>
                      {emp.po_name || <span style={{ fontSize: 11, fontWeight: 700, background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: 999 }}>Shared</span>}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.salaryText}>
                        {Number(emp.monthly_salary_pkr || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: emp.status === "Active" ? "#dcfce7" : "#fee2e2",
                        color: emp.status === "Active" ? "#166534" : "#991b1b"
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button style={styles.viewBtn} onClick={() => openTracking(emp)}>Track</button>
                        <button style={styles.editBtn} onClick={() => openEdit(emp)}>Edit</button>
                        <button style={styles.deleteBtn} onClick={() => deleteEmployee(emp.id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} style={styles.emptyRow}>
                    <div style={styles.emptyState}>
                      <svg width="40" height="40" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <div>No employees found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Tracking Modal */}
      <Modal open={!!trackingEmp} title="Employee Profile & History" onClose={() => setTrackingEmp(null)} width={860}>
        {trackingLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading history...</div>
        ) : trackingEmp ? (
          <div>
            {/* Profile card */}
            <div style={styles.profileCard}>
              <div style={styles.profileAvatar}>
                {String(trackingEmp.full_name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{trackingEmp.full_name}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{trackingEmp.employment_type}</div>
              </div>
              <div style={styles.profileMeta}>
                <ProfileStat label="Role" value={trackingEmp.role} highlight />
                <ProfileStat label="PO" value={trackingEmp.po_name || "—"} />
                <ProfileStat label="Salary" value={`PKR ${Number(trackingEmp.monthly_salary_pkr || 0).toLocaleString()}`} />
                <ProfileStat label="Status" value={trackingEmp.status} status={trackingEmp.status} />
              </div>
            </div>

            {/* Current assignment */}
            {trackingHistory.length > 0 && (() => {
              const latest = trackingHistory[0];
              return (
                <div style={styles.currentAssign}>
                  <div style={styles.sectionLabel}>Current Assignment · {latest.month_key}</div>
                  <div style={styles.currentRow}>
                    <div style={styles.currentItem}>
                      <div style={styles.currentLabel}>Game</div>
                      <div style={styles.currentValue}>{latest.game_name || "—"}</div>
                      {latest.game_platform && <div style={styles.currentSub}>{latest.game_platform} · {latest.game_status}</div>}
                    </div>
                    <div style={styles.currentItem}>
                      <div style={styles.currentLabel}>PO</div>
                      <div style={styles.currentValue}>{latest.po_name || "—"}</div>
                    </div>
                    <div style={styles.currentItem}>
                      <div style={styles.currentLabel}>Allocation</div>
                      <div style={{ ...styles.currentValue, color: "#6366f1" }}>{latest.allocation_percent}%</div>
                    </div>
                    <div style={styles.currentItem}>
                      <div style={styles.currentLabel}>Scope</div>
                      <div style={styles.currentValue}>{latest.allocation_scope}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* History table */}
            <div style={{ marginTop: 20 }}>
              <div style={styles.sectionLabel}>Full Allocation History</div>
              {trackingHistory.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 0" }}>No allocation history found.</div>
              ) : (
                <div style={{ overflowX: "auto", maxHeight: 320, overflowY: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Month</th>
                        <th style={styles.th}>Game</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>PO</th>
                        <th style={styles.th}>Scope</th>
                        <th style={styles.th}>Allocation %</th>
                        <th style={styles.th}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackingHistory.map((h, i) => (
                        <tr key={h.id} style={{ ...styles.tr, background: i === 0 ? "#f8fafc" : "transparent" }}>
                          <td style={styles.td}>
                            <span style={{ fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "#6366f1" : "#0f172a" }}>
                              {h.month_key}
                            </span>
                            {i === 0 && <span style={styles.latestBadge}>Latest</span>}
                          </td>
                          <td style={styles.td}>{h.game_name || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={styles.td}>{h.game_platform || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={styles.td}>{h.po_name || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                          <td style={styles.td}>
                            <span style={getScopeBadge(h.allocation_scope)}>{h.allocation_scope}</span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 700 }}>{h.allocation_percent}%</td>
                          <td style={{ ...styles.td, color: "#64748b" }}>{h.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={showModal} title={editingId ? "Edit Employee" : "Add Employee"} onClose={() => setShowModal(false)} width={720}>
        <form onSubmit={save} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter employee name" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Dev</option><option>Art</option><option>QA</option><option>UI</option><option>Marketing</option><option>PM</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Monthly Salary (PKR)</label>
            <input style={styles.input} type="number" value={form.monthly_salary_pkr} onChange={(e) => setForm({ ...form, monthly_salary_pkr: e.target.value })} placeholder="Enter salary" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Employment Type</label>
            <select style={styles.input} value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
              <option>Full-time</option><option>Part-time</option><option>Contract</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Assign to PO <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
            <select style={styles.input} value={form.assigned_po} onChange={(e) => setForm({ ...form, assigned_po: e.target.value })}>
              <option value="">Shared Resource (no PO)</option>
              {productOwners.map((po) => <option key={po.id} value={po.id}>{po.name}</option>)}
            </select>
            {!form.assigned_po && (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Art, UI, Marketing and other shared roles can be left unassigned and allocated per-month via Resource Allocations.
              </div>
            )}
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          {error && <div style={styles.errorBox}>{error}</div>}
          <div style={styles.modalFooter}>
            <button type="button" style={styles.secondaryBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button style={styles.primaryBtn} type="submit">{editingId ? "Update Employee" : "Save Employee"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProfileStat({ label, value, highlight, status }) {
  let color = "#0f172a";
  let bg = "transparent";
  if (highlight) { color = "#4338ca"; bg = "#e0e7ff"; }
  if (status === "Active") { color = "#166534"; bg = "#dcfce7"; }
  if (status === "Inactive") { color = "#991b1b"; bg = "#fee2e2"; }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color, background: bg, padding: bg !== "transparent" ? "3px 10px" : 0, borderRadius: 999 }}>{value}</div>
    </div>
  );
}

function getScopeBadge(scope) {
  const map = {
    DirectGame: { background: "#e0e7ff", color: "#3730a3" },
    POShared: { background: "#fce7f3", color: "#9d174d" },
    StudioShared: { background: "#dcfce7", color: "#065f46" }
  };
  return { ...(map[scope] || { background: "#f1f5f9", color: "#475569" }), display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 };
}

const styles = {
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 24 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  primaryBtn: { padding: "10px 18px", background: "linear-gradient(135deg, #6366f1, #2563eb)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  statCard: { background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  statLabel: { color: "#64748b", fontSize: 13, fontWeight: 600 },
  statValue: { fontSize: 32, fontWeight: 800, marginTop: 6, letterSpacing: "-0.02em" },
  statHint: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 12, pointerEvents: "none" },
  searchInput: { padding: "10px 14px 10px 36px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, width: 300, color: "#0f172a", background: "#f8fafc" },
  checkboxLabel: { color: "#475569", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center" },
  rowCount: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8fafc" },
  th: { textAlign: "left", padding: "12px 14px", color: "#64748b", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "14px", color: "#0f172a", fontSize: 14, verticalAlign: "middle" },
  nameCell: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  nameText: { fontWeight: 600, color: "#0f172a", fontSize: 14 },
  subText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  roleBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  salaryText: { fontWeight: 600, color: "#0f172a", fontVariantNumeric: "tabular-nums" },
  statusBadge: { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  actions: { display: "flex", gap: 8 },
  viewBtn: { padding: "6px 14px", border: "none", borderRadius: 8, background: "#e0e7ff", color: "#4338ca", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  editBtn: { padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  profileCard: { display: "flex", alignItems: "center", gap: 20, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", borderRadius: 16, padding: "20px 24px", marginBottom: 20, border: "1px solid #e2e8f0" },
  profileAvatar: { width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, flexShrink: 0 },
  profileMeta: { display: "flex", gap: 28, marginLeft: "auto" },
  currentAssign: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 },
  currentRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  currentItem: { display: "flex", flexDirection: "column", gap: 4 },
  currentLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" },
  currentValue: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  currentSub: { fontSize: 12, color: "#64748b" },
  latestBadge: { marginLeft: 8, background: "#e0e7ff", color: "#4338ca", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 },
  deleteBtn: { padding: "6px 14px", border: "none", borderRadius: 8, background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  emptyRow: { padding: 40, textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#94a3b8", fontSize: 14 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, color: "#0f172a" },
  errorBox: { gridColumn: "1 / -1", background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  modalFooter: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  secondaryBtn: { padding: "10px 18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14 }
};
