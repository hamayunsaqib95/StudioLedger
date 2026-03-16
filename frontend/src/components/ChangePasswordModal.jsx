import { useState } from "react";
import api from "../api/api";

export default function ChangePasswordModal({ forced = false, onDone, onCancel }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h2 style={styles.title}>{forced ? "Set Your Password" : "Change Password"}</h2>
            <p style={styles.subtitle}>
              {forced
                ? "For security, please set a new password before continuing."
                : "Update your account password."}
            </p>
          </div>
        </div>

        {forced && (
          <div style={styles.warningBox}>
            You are using a temporary password. Set a new password to continue.
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>{forced ? "Temporary Password" : "Current Password"}</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Min. 6 characters"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Repeat new password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.footer}>
            {!forced && (
              <button type="button" style={styles.cancelBtn} onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? "Saving..." : "Set New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, backdropFilter: "blur(4px)"
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: 36,
    width: "100%", maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
  },
  header: { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    background: "linear-gradient(135deg,#6366f1,#2563eb)",
    display: "flex", alignItems: "center", justifyContent: "center"
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },
  warningBox: {
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 13, color: "#92400e", fontWeight: 500, marginBottom: 20
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "11px 14px", borderRadius: 12,
    border: "1px solid #e2e8f0", outline: "none",
    fontSize: 14, color: "#0f172a", background: "#f8fafc"
  },
  errorBox: {
    background: "#fee2e2", color: "#991b1b",
    padding: "10px 14px", borderRadius: 10, fontSize: 13
  },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  cancelBtn: {
    padding: "11px 18px", background: "#fff",
    border: "1px solid #e2e8f0", borderRadius: 12,
    color: "#374151", cursor: "pointer", fontWeight: 600, fontSize: 14
  },
  submitBtn: {
    padding: "11px 20px",
    background: "linear-gradient(135deg,#6366f1,#2563eb)",
    border: "none", borderRadius: 12, color: "#fff",
    cursor: "pointer", fontWeight: 700, fontSize: 14,
    boxShadow: "0 4px 14px rgba(99,102,241,0.35)"
  }
};
