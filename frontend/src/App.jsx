import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Employees from "./pages/Employees";
import Costs from "./pages/Costs";
import RevenueUA from "./pages/RevenueUA";
import Transfers from "./pages/Transfers";
import UsersPage from "./pages/UsersPage";
import MonthlyLocks from "./pages/MonthlyLocks";
import AuditLogs from "./pages/AuditLogs";
import api, { registerToastHandler } from "./api/api";
import AppShell from "./layout/AppShell";
import Toast from "./components/Toast";
import POAnalytics from "./pages/POAnalytics";
import TeamLeadGovernance from "./pages/TeamLeadGovernance";
import Allocations from "./pages/Allocations";
import StudioAnalytics from "./pages/StudioAnalytics";

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    registerToastHandler(setToast);
    checkUser();
  }, []);

  async function checkUser() {
    const token = localStorage.getItem("token");
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }

  function clearToast() {
    setToast(null);
  }

  function canAccess(currentUser, allowedRoles) {
    return allowedRoles.includes(currentUser?.role);
  }

  function isPageAllowed(currentUser, currentPage) {
    const pageAccess = {
      dashboard: ["CEO", "COO", "Team Lead", "PO"],
      games: ["CEO", "COO", "Team Lead", "PO"],
      revenueUA: ["CEO", "COO", "Team Lead", "PO"],
      poAnalytics: ["CEO", "COO", "Team Lead"],
      studioAnalytics: ["CEO", "COO", "Team Lead"],
      allocations: ["CEO", "COO", "Team Lead"],
      employees: ["CEO", "COO", "Team Lead"],
      costs: ["CEO", "COO", "Team Lead"],
      transfers: ["CEO", "COO", "Team Lead"],
      users: ["CEO", "COO", "Team Lead"],
      monthlyLocks: ["CEO", "COO", "Team Lead"],
      auditLogs: ["CEO", "COO", "Team Lead"],
      teamLeadGovernance: ["CEO", "COO", "Team Lead"]
    };
    const allowedRoles = pageAccess[currentPage];
    if (!allowedRoles) return false;
    return allowedRoles.includes(currentUser?.role);
  }

  if (checkingAuth) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f1f5f9",
        fontFamily: "'Inter', sans-serif",
        color: "#64748b",
        fontSize: 15
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login setUser={setUser} />;
  }

  const pageAllowed = isPageAllowed(user, page);

  return (
    <>
      <Toast toast={toast} clearToast={clearToast} />
      <AppShell
        user={user}
        page={page}
        setPage={setPage}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }}
      >
        {!pageAllowed && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            color: "#991b1b",
            fontSize: 16,
            fontWeight: 600
          }}>
            Access denied
          </div>
        )}

        {page === "dashboard" && canAccess(user, ["CEO", "COO", "Team Lead", "PO"]) && (
          <Dashboard user={user} setUser={setUser} />
        )}

        {page === "games" && canAccess(user, ["CEO", "COO", "Team Lead", "PO"]) && (
          <Games user={user} />
        )}

        {page === "revenueUA" && canAccess(user, ["CEO", "COO", "Team Lead", "PO"]) && (
          <RevenueUA user={user} />
        )}

        {page === "poAnalytics" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <POAnalytics user={user} />
        )}

        {page === "studioAnalytics" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <StudioAnalytics user={user} />
        )}

        {page === "allocations" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <Allocations user={user} />
        )}

        {page === "employees" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <Employees />
        )}

        {page === "costs" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <Costs />
        )}

        {page === "transfers" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <Transfers />
        )}

        {page === "users" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <UsersPage user={user} />
        )}

        {page === "monthlyLocks" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <MonthlyLocks />
        )}

        {page === "auditLogs" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <AuditLogs />
        )}

        {page === "teamLeadGovernance" && canAccess(user, ["CEO", "COO", "Team Lead"]) && (
          <TeamLeadGovernance />
        )}
      </AppShell>
    </>
  );
}

export default App;
