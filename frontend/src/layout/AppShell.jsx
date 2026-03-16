import { useState, useEffect } from "react";

const Icons = {
  dashboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  games: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4M8 10v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  revenue: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  poIntel: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  studioAnalytics: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  allocations: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  employees: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  costs: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  transfers: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="16" y1="11" x2="22" y2="11"/><line x1="19" y1="8" x2="19" y2="14"/>
    </svg>
  ),
  lock: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  audit: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  governance: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
};

const menuSections = [
  {
    label: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: Icons.dashboard, roles: ["CEO", "COO", "Team Lead", "PO"] }
    ]
  },
  {
    label: "Analytics",
    items: [
      { key: "games", label: "Games & Analytics", icon: Icons.games, roles: ["CEO", "COO", "Team Lead", "PO"] },
      { key: "revenueUA", label: "Revenue & UA", icon: Icons.revenue, roles: ["CEO", "COO", "Team Lead", "PO"] },
      { key: "poAnalytics", label: "PO Dashboard", icon: Icons.poIntel, roles: ["CEO", "COO", "Team Lead"] },
      { key: "studioAnalytics", label: "Studio Analytics", icon: Icons.studioAnalytics, roles: ["CEO", "COO", "Team Lead"] }
    ]
  },
  {
    label: "Operations",
    items: [
      { key: "allocations", label: "Allocations", icon: Icons.allocations, roles: ["CEO", "COO", "Team Lead"] },
      { key: "employees", label: "Employees", icon: Icons.employees, roles: ["CEO", "COO", "Team Lead"] },
      { key: "costs", label: "Costs", icon: Icons.costs, roles: ["CEO", "COO", "Team Lead"] },
      { key: "transfers", label: "Transfers", icon: Icons.transfers, roles: ["CEO", "COO", "Team Lead"] }
    ]
  },
  {
    label: "Administration",
    items: [
      { key: "users", label: "Users", icon: Icons.users, roles: ["CEO", "COO", "Team Lead"] },
      { key: "monthlyLocks", label: "Monthly Locks", icon: Icons.lock, roles: ["CEO", "COO", "Team Lead"] },
      { key: "auditLogs", label: "Audit Logs", icon: Icons.audit, roles: ["CEO", "COO", "Team Lead"] },
      { key: "teamLeadGovernance", label: "TL Governance", icon: Icons.governance, roles: ["CEO", "COO", "Team Lead"] }
    ]
  }
];

export default function AppShell({ user, page, setPage, children, onLogout }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userInitials = (user?.fullName || user?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleColors = {
    CEO: { bg: "#fef3c7", color: "#92400e" },
    COO: { bg: "#dbeafe", color: "#1d4ed8" },
    "Team Lead": { bg: "#ede9fe", color: "#6d28d9" },
    PO: { bg: "#dcfce7", color: "#166534" },
    Admin: { bg: "#fee2e2", color: "#991b1b" },
    HR: { bg: "#fce7f3", color: "#9d174d" }
  };
  const roleStyle = roleColors[user?.role] || { bg: "#f1f5f9", color: "#475569" };

  const handleNavClick = (key) => {
    setPage(key);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarStyle = isMobile
    ? {
        ...styles.sidebar,
        position: "fixed",
        top: 0,
        left: sidebarOpen ? 0 : -280,
        height: "100vh",
        zIndex: 1000,
        transition: "left 0.25s ease",
        boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.3)" : "none"
      }
    : styles.sidebar;

  return (
    <div style={styles.layout}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.logoText}>Invogue Technologies</div>
            <div style={styles.logoSub}>Studio P&L Platform</div>
          </div>
          {isMobile && (
            <button style={styles.closeBtn} onClick={() => setSidebarOpen(false)}>✕</button>
          )}
        </div>

        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>{userInitials}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.fullName || user?.full_name || "User"}</div>
            <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.color }}>
              {user?.role || "-"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {menuSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(user?.role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} style={styles.section}>
                <div style={styles.sectionLabel}>{section.label}</div>
                {visibleItems.map((item) => {
                  const isActive = item.key === page;
                  const isHovered = hoveredItem === item.key;
                  return (
                    <button
                      key={item.key}
                      style={{
                        ...styles.navItem,
                        ...(isActive ? styles.navItemActive : {}),
                        ...(isHovered && !isActive ? styles.navItemHover : {})
                      }}
                      onClick={() => handleNavClick(item.key)}
                      onMouseEnter={() => setHoveredItem(item.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span style={{ ...styles.navIcon, color: isActive ? "#fff" : "#94a3b8" }}>
                        {item.icon}
                      </span>
                      <span style={styles.navLabel}>{item.label}</span>
                      {isActive && <span style={styles.navActiveDot} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          style={styles.logoutBtn}
          onClick={onLogout}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ color: "#f87171" }}>{Icons.logout}</span>
          <span style={{ color: "#f87171", fontWeight: 600 }}>Logout</span>
        </button>
      </aside>

      {/* Main content */}
      <main style={{ ...styles.main, paddingTop: isMobile ? 72 : 28 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={styles.topBar}>
            <button style={styles.hamburger} onClick={() => setSidebarOpen(true)}>
              <span style={styles.hamburgerLine} />
              <span style={styles.hamburgerLine} />
              <span style={styles.hamburgerLine} />
            </button>
            <div style={styles.topBarLogo}>
              <div style={styles.topBarLogoIcon}>
                <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span style={styles.topBarTitle}>Studio Ledger</span>
            </div>
            <div style={styles.topBarAvatar}>{userInitials}</div>
          </div>
        )}

        <div style={{ minHeight: "calc(100vh - 100px)", maxWidth: "100%", overflowX: "auto" }}>{children}</div>
        <footer style={styles.footer}>
          <span style={styles.footerCompany}>Invogue Technologies</span>
          <span style={styles.footerSep}>·</span>
          <span style={styles.footerDev}>Developed by HMS</span>
          <span style={styles.footerSep}>·</span>
          <span style={styles.footerYear}>{new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999
  },
  sidebar: {
    width: 256,
    minWidth: 256,
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    padding: "20px 12px",
    gap: 4,
    overflowY: "auto",
    position: "sticky",
    top: 0,
    height: "100vh"
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px 16px"
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(99,102,241,0.4)"
  },
  logoText: {
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  logoSub: {
    fontSize: 11,
    color: "#475569",
    marginTop: 1
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 16,
    cursor: "pointer",
    padding: "4px 6px",
    flexShrink: 0
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: "10px 12px",
    marginBottom: 8,
    border: "1px solid rgba(255,255,255,0.06)"
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0
  },
  userName: {
    fontWeight: 600,
    color: "#f1f5f9",
    fontSize: 13,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 999,
    width: "fit-content"
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflowY: "auto"
  },
  section: {
    marginBottom: 8
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#334155",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "6px 10px 4px"
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "9px 10px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s ease",
    position: "relative"
  },
  navItemActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
    fontWeight: 600
  },
  navItemHover: {
    background: "rgba(255,255,255,0.07)",
    color: "#e2e8f0"
  },
  navIcon: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center"
  },
  navLabel: {
    flex: 1
  },
  navActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.7)",
    flexShrink: 0
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.2)",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    marginTop: 4,
    transition: "background 0.15s ease"
  },
  topBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 998,
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)"
  },
  hamburger: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    padding: 6
  },
  hamburgerLine: {
    display: "block",
    width: 22,
    height: 2,
    background: "#e2e8f0",
    borderRadius: 2
  },
  topBarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  topBarLogoIcon: {
    width: 26,
    height: 26,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topBarTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 15
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: "linear-gradient(135deg, #6366f1, #2563eb)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 12
  },
  main: {
    flex: 1,
    padding: 28,
    minHeight: "100vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 12,
    color: "#94a3b8",
    flexWrap: "wrap"
  },
  footerCompany: { fontWeight: 700, color: "#64748b" },
  footerDev: { fontWeight: 600, color: "#6366f1" },
  footerSep: { color: "#cbd5e1" },
  footerYear: { color: "#94a3b8" }
};
