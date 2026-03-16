import { useState } from "react";
import api from "../api/api";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      {/* Left Panel */}
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.logoWrap}>
            <div style={styles.logoMark}>
              <svg width="30" height="30" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <div style={styles.companyName}>Invogue Technologies</div>
          <h1 style={styles.leftTitle}>Studio Ledger</h1>
          <p style={styles.leftSub}>Financial Intelligence Platform</p>

          <div style={styles.divider} />

          <div style={styles.features}>
            {[
              "Game Portfolio Management",
              "P&L Analytics per PO",
              "Team & Cost Allocation",
              "Revenue & UA Tracking",
              "Multi-role Access Control"
            ].map((f) => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.featureDot}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <div style={styles.leftFooter}>
            <span>Developed by </span>
            <a href="http://www.Hamayunsaqib.com" target="_blank" rel="noreferrer" style={styles.footerLink}>
              HMS · hamayunsaqib.com
            </a>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardLogoSmall}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={styles.cardBrand}>Studio Ledger</span>
          </div>

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
                placeholder="you@invogue.com"
                required
                autoFocus
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
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div style={styles.cardFooter}>
            <span style={styles.cardFooterText}>Invogue Technologies · Studio Ledger</span>
            <a href="http://www.Hamayunsaqib.com" target="_blank" rel="noreferrer" style={styles.cardFooterLink}>
              Developed by HMS
            </a>
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
    width: "48%",
    background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    position: "relative",
    overflow: "hidden"
  },
  leftContent: {
    maxWidth: 380,
    position: "relative",
    zIndex: 1
  },
  logoWrap: {
    marginBottom: 24
  },
  logoMark: {
    width: 60,
    height: 60,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(99,102,241,0.5)"
  },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#818cf8",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 10
  },
  leftTitle: {
    margin: 0,
    fontSize: 42,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-0.03em",
    lineHeight: 1.1
  },
  leftSub: {
    color: "#94a3b8",
    fontSize: 15,
    margin: "10px 0 0"
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "32px 0"
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#cbd5e1",
    fontSize: 14
  },
  featureDot: {
    width: 26,
    height: 26,
    background: "rgba(99,102,241,0.25)",
    color: "#818cf8",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0
  },
  leftFooter: {
    marginTop: 48,
    fontSize: 12,
    color: "#475569"
  },
  footerLink: {
    color: "#6366f1",
    textDecoration: "none",
    fontWeight: 600
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
    borderRadius: 24,
    padding: "36px 36px 28px",
    boxShadow: "0 4px 40px rgba(0,0,0,0.1)"
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 28
  },
  cardLogoSmall: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a"
  },
  cardHeader: {
    marginBottom: 28
  },
  cardTitle: {
    margin: 0,
    fontSize: 26,
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
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 14,
    color: "#0f172a",
    background: "#f8fafc",
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
    padding: "13px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
    marginTop: 4,
    letterSpacing: "0.01em"
  },
  cardFooter: {
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardFooterText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500
  },
  cardFooterLink: {
    fontSize: 11,
    color: "#6366f1",
    textDecoration: "none",
    fontWeight: 600
  }
};
