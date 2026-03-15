import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import Modal from "../components/Modal";

export default function Costs() {
  const [productOwners, setProductOwners] = useState([]);
  const [tools, setTools] = useState([]);
  const [office, setOffice] = useState([]);
  const [search, setSearch] = useState("");
  const [showToolModal, setShowToolModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [toolError, setToolError] = useState("");
  const [officeError, setOfficeError] = useState("");

  const emptyToolForm = {
    month_key: "2026-03",
    scope: "single",
    po_id: "",
    tool_name: "",
    amount: "",
    currency: "USD",
    billing_type: "Flat",
    notes: ""
  };

  const emptyOfficeForm = {
    month_key: "2026-03",
    scope: "single",
    po_id: "",
    expense_type: "",
    amount: "",
    currency: "PKR",
    notes: ""
  };

  const [toolForm, setToolForm] = useState(emptyToolForm);
  const [officeForm, setOfficeForm] = useState(emptyOfficeForm);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [poRes, toolRes, officeRes] = await Promise.all([
      api.get("/product-owners"),
      api.get("/costs/tools"),
      api.get("/costs/office")
    ]);

    const poList = poRes.data.data || [];
    setProductOwners(poList);
    setTools(toolRes.data.data || []);
    setOffice(officeRes.data.data || []);

    if (poList.length > 0) {
      if (!toolForm.po_id) {
        setToolForm((prev) => ({ ...prev, po_id: String(poList[0].id) }));
      }
      if (!officeForm.po_id) {
        setOfficeForm((prev) => ({ ...prev, po_id: String(poList[0].id) }));
      }
    }
  }

  function openToolModal() {
    setToolError("");
    setToolForm({
      ...emptyToolForm,
      po_id: productOwners.length > 0 ? String(productOwners[0].id) : ""
    });
    setShowToolModal(true);
  }

  function openOfficeModal() {
    setOfficeError("");
    setOfficeForm({
      ...emptyOfficeForm,
      po_id: productOwners.length > 0 ? String(productOwners[0].id) : ""
    });
    setShowOfficeModal(true);
  }

  function validMonth(v) {
    return /^\d{4}-\d{2}$/.test(v);
  }

  function validateTool() {
    if (!validMonth(toolForm.month_key)) {
      setToolError("Month must be in YYYY-MM format.");
      return false;
    }
    if (!toolForm.tool_name.trim() || !toolForm.currency || !toolForm.billing_type) {
      setToolError("Please complete all required tool cost fields.");
      return false;
    }
    if (toolForm.scope === "single" && !toolForm.po_id) {
      setToolError("Please select a Product Owner.");
      return false;
    }
    if (Number(toolForm.amount) <= 0) {
      setToolError("Tool amount must be greater than 0.");
      return false;
    }
    setToolError("");
    return true;
  }

  function validateOffice() {
    if (!validMonth(officeForm.month_key)) {
      setOfficeError("Month must be in YYYY-MM format.");
      return false;
    }
    if (!officeForm.expense_type.trim() || !officeForm.currency) {
      setOfficeError("Please complete all required office expense fields.");
      return false;
    }
    if (officeForm.scope === "single" && !officeForm.po_id) {
      setOfficeError("Please select a Product Owner.");
      return false;
    }
    if (Number(officeForm.amount) <= 0) {
      setOfficeError("Office expense amount must be greater than 0.");
      return false;
    }
    setOfficeError("");
    return true;
  }

  async function saveTool(e) {
    e.preventDefault();
    if (!validateTool()) return;

    try {
      await api.post("/costs/tools", {
        ...toolForm,
        po_id: toolForm.scope === "all" ? null : Number(toolForm.po_id),
        amount: Number(toolForm.amount)
      });

      setShowToolModal(false);
      await loadAll();
    } catch (error) {
      setToolError(error?.response?.data?.message || "Failed to save tool cost.");
    }
  }

  async function saveOffice(e) {
    e.preventDefault();
    if (!validateOffice()) return;

    try {
      await api.post("/costs/office", {
        ...officeForm,
        po_id: officeForm.scope === "all" ? null : Number(officeForm.po_id),
        amount: Number(officeForm.amount)
      });

      setShowOfficeModal(false);
      await loadAll();
    } catch (error) {
      setOfficeError(error?.response?.data?.message || "Failed to save office expense.");
    }
  }

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) =>
      String(t.tool_name || "").toLowerCase().includes(q) ||
      String(t.po_name || "").toLowerCase().includes(q) ||
      String(t.currency || "").toLowerCase().includes(q)
    );
  }, [tools, search]);

  const filteredOffice = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return office;
    return office.filter((o) =>
      String(o.expense_type || "").toLowerCase().includes(q) ||
      String(o.po_name || "").toLowerCase().includes(q) ||
      String(o.currency || "").toLowerCase().includes(q)
    );
  }, [office, search]);

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Costs</h1>
          <p style={styles.pageSubtitle}>
            Manage shared and PO-specific tool and office expenses
          </p>
        </div>

        <div style={styles.topbarActions}>
          <button style={styles.secondaryBtn} onClick={openToolModal}>
            + Add Tool Cost
          </button>
          <button style={styles.primaryBtn} onClick={openOfficeModal}>
            + Add Office Expense
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #6366f1" }}>
          <div style={styles.statLabel}>Tool Cost Records</div>
          <div style={{ ...styles.statValue, color: "#6366f1" }}>{tools.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <div style={styles.statLabel}>Office Expense Records</div>
          <div style={{ ...styles.statValue, color: "#f59e0b" }}>{office.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Active POs</div>
          <div style={{ ...styles.statValue, color: "#10b981" }}>{productOwners.length}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by name, PO, or currency"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={styles.twoCols}>
          <div style={styles.innerCard}>
            <h3 style={styles.sectionTitle}>Tool Costs</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>PO</th>
                    <th style={styles.th}>Tool</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Currency</th>
                    <th style={styles.th}>Billing</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map((t) => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.month_key}</td>
                      <td style={styles.td}>{t.po_name}</td>
                      <td style={styles.td}>{t.tool_name}</td>
                      <td style={styles.td}>{t.amount}</td>
                      <td style={styles.td}>{t.currency}</td>
                      <td style={styles.td}>{t.billing_type}</td>
                    </tr>
                  ))}
                  {filteredTools.length === 0 ? (
                    <tr>
                      <td style={styles.emptyRow} colSpan={6}>No tool costs found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.innerCard}>
            <h3 style={styles.sectionTitle}>Office Expenses</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>PO</th>
                    <th style={styles.th}>Expense Type</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffice.map((o) => (
                    <tr key={o.id}>
                      <td style={styles.td}>{o.month_key}</td>
                      <td style={styles.td}>{o.po_name}</td>
                      <td style={styles.td}>{o.expense_type}</td>
                      <td style={styles.td}>{o.amount}</td>
                      <td style={styles.td}>{o.currency}</td>
                    </tr>
                  ))}
                  {filteredOffice.length === 0 ? (
                    <tr>
                      <td style={styles.emptyRow} colSpan={5}>No office expenses found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showToolModal}
        title="Add Tool Cost"
        onClose={() => setShowToolModal(false)}
        width={720}
      >
        <form onSubmit={saveTool} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Month</label>
            <input
              style={styles.input}
              value={toolForm.month_key}
              onChange={(e) => setToolForm({ ...toolForm, month_key: e.target.value })}
              placeholder="YYYY-MM"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Scope</label>
            <select
              style={styles.input}
              value={toolForm.scope}
              onChange={(e) => setToolForm({ ...toolForm, scope: e.target.value })}
            >
              <option value="single">Single PO</option>
              <option value="all">All POs</option>
            </select>
          </div>

          {toolForm.scope === "single" ? (
            <div style={styles.field}>
              <label style={styles.label}>Product Owner</label>
              <select
                style={styles.input}
                value={toolForm.po_id}
                onChange={(e) => setToolForm({ ...toolForm, po_id: e.target.value })}
              >
                <option value="">Select PO</option>
                {productOwners.map((po) => (
                  <option key={po.id} value={po.id}>{po.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={styles.infoBox}>
              This tool cost will be added for all active Product Owners.
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Tool Name</label>
            <input
              style={styles.input}
              value={toolForm.tool_name}
              onChange={(e) => setToolForm({ ...toolForm, tool_name: e.target.value })}
              placeholder="Enter tool name"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Amount</label>
            <input
              style={styles.input}
              type="number"
              value={toolForm.amount}
              onChange={(e) => setToolForm({ ...toolForm, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Currency</label>
            <select
              style={styles.input}
              value={toolForm.currency}
              onChange={(e) => setToolForm({ ...toolForm, currency: e.target.value })}
            >
              <option>USD</option>
              <option>PKR</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Billing Type</label>
            <select
              style={styles.input}
              value={toolForm.billing_type}
              onChange={(e) => setToolForm({ ...toolForm, billing_type: e.target.value })}
            >
              <option>Flat</option>
              <option>Per seat</option>
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Notes</label>
            <input
              style={styles.input}
              value={toolForm.notes}
              onChange={(e) => setToolForm({ ...toolForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          {toolError ? <div style={styles.errorBox}>{toolError}</div> : null}

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setShowToolModal(false)}
            >
              Cancel
            </button>
            <button style={styles.primaryBtn} type="submit">
              Save Tool Cost
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showOfficeModal}
        title="Add Office Expense"
        onClose={() => setShowOfficeModal(false)}
        width={720}
      >
        <form onSubmit={saveOffice} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Month</label>
            <input
              style={styles.input}
              value={officeForm.month_key}
              onChange={(e) => setOfficeForm({ ...officeForm, month_key: e.target.value })}
              placeholder="YYYY-MM"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Scope</label>
            <select
              style={styles.input}
              value={officeForm.scope}
              onChange={(e) => setOfficeForm({ ...officeForm, scope: e.target.value })}
            >
              <option value="single">Single PO</option>
              <option value="all">All POs</option>
            </select>
          </div>

          {officeForm.scope === "single" ? (
            <div style={styles.field}>
              <label style={styles.label}>Product Owner</label>
              <select
                style={styles.input}
                value={officeForm.po_id}
                onChange={(e) => setOfficeForm({ ...officeForm, po_id: e.target.value })}
              >
                <option value="">Select PO</option>
                {productOwners.map((po) => (
                  <option key={po.id} value={po.id}>{po.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={styles.infoBox}>
              This office expense will be added for all active Product Owners.
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Expense Type</label>
            <input
              style={styles.input}
              value={officeForm.expense_type}
              onChange={(e) => setOfficeForm({ ...officeForm, expense_type: e.target.value })}
              placeholder="Enter expense type"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Amount</label>
            <input
              style={styles.input}
              type="number"
              value={officeForm.amount}
              onChange={(e) => setOfficeForm({ ...officeForm, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Currency</label>
            <select
              style={styles.input}
              value={officeForm.currency}
              onChange={(e) => setOfficeForm({ ...officeForm, currency: e.target.value })}
            >
              <option>PKR</option>
              <option>USD</option>
            </select>
          </div>

          <div style={styles.fieldFull}>
            <label style={styles.label}>Notes</label>
            <input
              style={styles.input}
              value={officeForm.notes}
              onChange={(e) => setOfficeForm({ ...officeForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          {officeError ? <div style={styles.errorBox}>{officeError}</div> : null}

          <div style={styles.modalFooter}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setShowOfficeModal(false)}
            >
              Cancel
            </button>
            <button style={styles.primaryBtn} type="submit">
              Save Office Expense
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
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" },
  searchInput: { minWidth: 300, padding: "10px 14px 10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, background: "#f8fafc" },
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
  infoBox: { gridColumn: "1 / -1", background: "#eff6ff", color: "#1d4ed8", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  errorBox: { gridColumn: "1 / -1", background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 10, fontSize: 14 },
  modalFooter: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  emptyRow: { textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 14 }
};