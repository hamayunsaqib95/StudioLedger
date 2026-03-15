import { useEffect, useState } from "react";
import api from "../api/api";
import Modal from "./Modal";

const emptyForm = {
  full_name: "",
  email: "",
  monthly_salary: "",
  salary_currency: "PKR",
  profit_share_percent: "",
  team_lead_profile_id: "",
  team_lead_pool_percent: "",
  status: "Active"
};

export default function POFormModal({
  open,
  onClose,
  po,
  teamLeads = [],
  onSaved
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (po) {
      setForm({
        full_name: po.full_name || po.po_name || "",
        email: po.email || "",
        monthly_salary: po.monthly_salary || "",
        salary_currency: po.salary_currency || "PKR",
        profit_share_percent: po.profit_share_percent || "",
        team_lead_profile_id: po.team_lead_profile_id || "",
        team_lead_pool_percent: po.team_lead_pool_percent ?? "",
        status: po.status || "Active"
      });
    } else {
      setForm({
        ...emptyForm,
        team_lead_profile_id:
          teamLeads.length > 0 ? String(teamLeads[0].team_lead_id) : ""
      });
    }

    setError("");
  }, [po, teamLeads, open]);

  async function save(e) {
    e.preventDefault();

    if (!form.full_name.trim() || !form.team_lead_profile_id) {
      setError("Complete required fields");
      return;
    }

    if (Number(form.monthly_salary || 0) < 0) {
      setError("Monthly salary cannot be negative");
      return;
    }

    if (Number(form.profit_share_percent || 0) < 0) {
      setError("Profit share % cannot be negative");
      return;
    }

    try {
      const payload = {
        ...form,
        monthly_salary: Number(form.monthly_salary || 0),
        profit_share_percent: Number(form.profit_share_percent || 0),
        team_lead_profile_id: Number(form.team_lead_profile_id),
        team_lead_pool_percent: form.team_lead_pool_percent !== "" ? Number(form.team_lead_pool_percent) : undefined
      };

      if (po?.id) {
        await api.put(`/product-owners/${po.id}`, payload);
      } else {
        await api.post(`/product-owners`, payload);
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={po ? "Edit Product Owner" : "Create Product Owner"}
      width={760}
    >
      <form onSubmit={save} style={styles.grid}>
        <div style={styles.field}>
          <label style={styles.label}>Full Name</label>
          <input
            style={styles.input}
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Monthly Salary</label>
          <input
            style={styles.input}
            type="number"
            placeholder="Monthly Salary"
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
            placeholder="Profit Share %"
            value={form.profit_share_percent}
            onChange={(e) => setForm({ ...form, profit_share_percent: e.target.value })}
          />
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
          <label style={styles.label}>
            Team Lead Pool %
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>
              (total profit share pool for this TL)
            </span>
          </label>
          <input
            style={styles.input}
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 20"
            value={form.team_lead_pool_percent}
            onChange={(e) => setForm({ ...form, team_lead_pool_percent: e.target.value })}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Status</label>
          <select
            style={styles.input}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.actions}>
          <button type="button" onClick={onClose} style={styles.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" style={styles.primaryBtn}>
            Save PO
          </button>
        </div>
      </form>
    </Modal>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151"
  },
  input: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    width: "100%",
    color: "#111827"
  },
  error: {
    gridColumn: "1 / -1",
    color: "#991b1b",
    background: "#fee2e2",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "14px"
  },
  actions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px"
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer"
  },
  secondaryBtn: {
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer"
  }
};