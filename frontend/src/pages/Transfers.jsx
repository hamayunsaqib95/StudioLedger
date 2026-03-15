import { useEffect, useState } from "react";
import api from "../api/api";

export default function Transfers() {
  const [games, setGames] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pos, setPos] = useState([]);
  const [gameTransfers, setGameTransfers] = useState([]);
  const [employeeTransfers, setEmployeeTransfers] = useState([]);
  const [gameError, setGameError] = useState("");
  const [employeeError, setEmployeeError] = useState("");

  const [gameForm, setGameForm] = useState({
    game_id: "",
    from_po: "",
    to_po: "",
    effective_month: "2026-03",
    transfer_reason: ""
  });

  const [employeeForm, setEmployeeForm] = useState({
    employee_id: "",
    from_po: "",
    to_po: "",
    effective_month: "2026-03",
    transfer_reason: ""
  });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [g, e, p, gt, et] = await Promise.all([
      api.get("/games"),
      api.get("/employees"),
      api.get("/product-owners"),
      api.get("/transfers/games"),
      api.get("/transfers/employees")
    ]);

    const gamesList = g.data.data || [];
    const employeeList = e.data.data || [];
    const poList = p.data.data || [];

    setGames(gamesList);
    setEmployees(employeeList);
    setPos(poList);
    setGameTransfers(gt.data.data || []);
    setEmployeeTransfers(et.data.data || []);

    if (gamesList.length > 0 && !gameForm.game_id) {
      setGameForm((prev) => ({ ...prev, game_id: String(gamesList[0].id) }));
    }
    if (employeeList.length > 0 && !employeeForm.employee_id) {
      setEmployeeForm((prev) => ({ ...prev, employee_id: String(employeeList[0].id) }));
    }
    if (poList.length > 1) {
      if (!gameForm.from_po) setGameForm((prev) => ({ ...prev, from_po: String(poList[0].id) }));
      if (!gameForm.to_po) setGameForm((prev) => ({ ...prev, to_po: String(poList[1].id) }));
      if (!employeeForm.from_po) setEmployeeForm((prev) => ({ ...prev, from_po: String(poList[0].id) }));
      if (!employeeForm.to_po) setEmployeeForm((prev) => ({ ...prev, to_po: String(poList[1].id) }));
    }
  }

  function validMonth(v) {
    return /^\d{4}-\d{2}$/.test(v);
  }

  function validateGameTransfer() {
    if (!gameForm.game_id || !gameForm.from_po || !gameForm.to_po || !gameForm.transfer_reason.trim()) {
      setGameError("Please complete all required game transfer fields.");
      return false;
    }
    if (!validMonth(gameForm.effective_month)) {
      setGameError("Effective month must be in YYYY-MM format.");
      return false;
    }
    if (gameForm.from_po === gameForm.to_po) {
      setGameError("From PO and To PO cannot be the same.");
      return false;
    }
    setGameError("");
    return true;
  }

  function validateEmployeeTransfer() {
    if (!employeeForm.employee_id || !employeeForm.from_po || !employeeForm.to_po || !employeeForm.transfer_reason.trim()) {
      setEmployeeError("Please complete all required employee transfer fields.");
      return false;
    }
    if (!validMonth(employeeForm.effective_month)) {
      setEmployeeError("Effective month must be in YYYY-MM format.");
      return false;
    }
    if (employeeForm.from_po === employeeForm.to_po) {
      setEmployeeError("From PO and To PO cannot be the same.");
      return false;
    }
    setEmployeeError("");
    return true;
  }

  async function saveGameTransfer(e) {
    e.preventDefault();
    if (!validateGameTransfer()) return;

    await api.post("/transfers/games", {
      ...gameForm,
      game_id: Number(gameForm.game_id),
      from_po: Number(gameForm.from_po),
      to_po: Number(gameForm.to_po),
      approved_by: "COO",
      created_by: "Team Lead"
    });
    setGameError("");
    loadAll();
  }

  async function saveEmployeeTransfer(e) {
    e.preventDefault();
    if (!validateEmployeeTransfer()) return;

    await api.post("/transfers/employees", {
      ...employeeForm,
      employee_id: Number(employeeForm.employee_id),
      from_po: Number(employeeForm.from_po),
      to_po: Number(employeeForm.to_po),
      approved_by: "COO",
      created_by: "Admin"
    });
    setEmployeeError("");
    loadAll();
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Transfers</h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>Transfer games and employees between Product Owners</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Game Transfer</h3>
          <form onSubmit={saveGameTransfer} style={styles.form}>
            <select style={styles.input} value={gameForm.game_id} onChange={(e) => setGameForm({ ...gameForm, game_id: e.target.value })}>
              <option value="">Select Game</option>
              {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select style={styles.input} value={gameForm.from_po} onChange={(e) => setGameForm({ ...gameForm, from_po: e.target.value })}>
              <option value="">From PO</option>
              {pos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select style={styles.input} value={gameForm.to_po} onChange={(e) => setGameForm({ ...gameForm, to_po: e.target.value })}>
              <option value="">To PO</option>
              {pos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input style={styles.input} value={gameForm.effective_month} onChange={(e) => setGameForm({ ...gameForm, effective_month: e.target.value })} placeholder="Effective Month" />
            <input style={styles.input} value={gameForm.transfer_reason} onChange={(e) => setGameForm({ ...gameForm, transfer_reason: e.target.value })} placeholder="Reason" />
            {gameError ? <div style={styles.error}>{gameError}</div> : null}
            <button style={styles.button}>Transfer Game</button>
          </form>
        </div>

        <div style={styles.card}>
          <h3>Employee Transfer</h3>
          <form onSubmit={saveEmployeeTransfer} style={styles.form}>
            <select style={styles.input} value={employeeForm.employee_id} onChange={(e) => {
              const empId = e.target.value;
              const emp = employees.find((x) => String(x.id) === empId);
              setEmployeeForm({ ...employeeForm, employee_id: empId, from_po: emp ? String(emp.assigned_po || "") : employeeForm.from_po });
            }}>
              <option value="">Select Employee</option>
              {employees.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}
            </select>
            <select style={styles.input} value={employeeForm.from_po} onChange={(e) => setEmployeeForm({ ...employeeForm, from_po: e.target.value })}>
              <option value="">From PO</option>
              {pos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select style={styles.input} value={employeeForm.to_po} onChange={(e) => setEmployeeForm({ ...employeeForm, to_po: e.target.value })}>
              <option value="">To PO</option>
              {pos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input style={styles.input} value={employeeForm.effective_month} onChange={(e) => setEmployeeForm({ ...employeeForm, effective_month: e.target.value })} placeholder="Effective Month" />
            <input style={styles.input} value={employeeForm.transfer_reason} onChange={(e) => setEmployeeForm({ ...employeeForm, transfer_reason: e.target.value })} placeholder="Reason" />
            {employeeError ? <div style={styles.error}>{employeeError}</div> : null}
            <button style={styles.button}>Transfer Employee</button>
          </form>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 20 }}>
        <h3>Game Transfer History</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Game</th>
              <th style={styles.th}>From</th>
              <th style={styles.th}>To</th>
              <th style={styles.th}>Month</th>
              <th style={styles.th}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {gameTransfers.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.game_name}</td>
                <td style={styles.td}>{t.from_po_name}</td>
                <td style={styles.td}>{t.to_po_name}</td>
                <td style={styles.td}>{t.effective_month}</td>
                <td style={styles.td}>{t.transfer_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...styles.card, marginTop: 20 }}>
        <h3>Employee Transfer History</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Employee</th>
              <th style={styles.th}>From</th>
              <th style={styles.th}>To</th>
              <th style={styles.th}>Month</th>
              <th style={styles.th}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {employeeTransfers.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.employee_name}</td>
                <td style={styles.td}>{t.from_po_name}</td>
                <td style={styles.td}>{t.to_po_name}</td>
                <td style={styles.td}>{t.effective_month}</td>
                <td style={styles.td}>{t.transfer_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: { background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" },
  button: { marginTop: 10, padding: "11px 18px", border: "none", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #2563eb)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  error: { marginTop: 8, padding: "10px 14px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", background: "#f8fafc" },
  td: { padding: "12px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 14 }
};