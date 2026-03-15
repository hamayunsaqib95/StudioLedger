import { useState } from "react";
import api from "../api/api";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("coo@studio.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 style={styles.leftTitle}>Studio P&L</h1>
          <p style={styles.leftSub}>Financial Platform</p>
          <div style={styles.features}>
            {["Game Portfolio Management", "P&L Analytics per PO", "Team & Cost Allocation", "Revenue & UA Tracking"].map((f) => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.featureDot}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSub}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={styles.demoBox}>
            <div style={styles.demoLabel}>Demo credentials</div>
            <code style={styles.demoCode}>coo@studio.com / admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  left: {
    width: "45%",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 60
  },
  leftContent: {
    maxWidth: 380
  },
  logoMark: {
    width: 52,
    height: 52,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    boxShadow: "0 8px 24px rgba(99,102,241,0.4)"
  },
  leftTitle: {
    margin: 0,
    fontSize: 36,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em"
  },
  leftSub: {
    color: "#64748b",
    fontSize: 16,
    margin: "8px 0 40px"
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#cbd5e1",
    fontSize: 15
  },
  featureDot: {
    width: 24,
    height: 24,
    background: "rgba(99,102,241,0.2)",
    color: "#818cf8",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0
  },
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    padding: 40
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 20,
    padding: 36,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
  },
  cardHeader: {
    marginBottom: 28
  },
  cardTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em"
  },
  cardSub: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 14
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151"
  },
  input: {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
    color: "#0f172a",
    transition: "border-color 0.15s"
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14
  },
  button: {
    padding: "12px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
    marginTop: 4
  },
  demoBox: {
    marginTop: 24,
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: 12,
    border: "1px solid #e2e8f0"
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 6
  },
  demoCode: {
    fontSize: 13,
    color: "#475569",
    fontFamily: "monospace"
  }
};
