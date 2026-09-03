import React, { useState, useEffect } from "react";
import { getAuditLogs } from "../services/api";
import { History, Search, ShieldAlert, Filter, RefreshCw } from "lucide-react";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const actions = [
    "ALL", "INITIAL_SEED", "CREATE_REQUEST", "APPROVE_REQUEST", "REJECT_REQUEST",
    "MARK_DUPLICATE", "CREATE_FAQ", "UPDATE_FAQ", "DEACTIVATE_FAQ", "IMPORT_EXCEL"
  ];

  useEffect(() => {
    loadLogs();
  }, [action]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(100, action);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-title">
          <span><History size={20} style={{ display: "inline", marginRight: "8px" }} /> System Audit Trail & Compliance Log</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <select className="form-control" style={{ width: "200px" }} value={action} onChange={(e) => setAction(e.target.value)}>
              {actions.map((act) => (
                <option key={act} value={act}>Action: {act}</option>
              ))}
            </select>
            <button onClick={loadLogs} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>Loading audit log trail...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>No audit log events found.</div>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Target ID</th>
                <th>Previous Value</th>
                <th>New Value / Details</th>
                <th>Authorized User</th>
                <th>Reason / Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td><strong>#{log.id}</strong></td>
                  <td>{log.timestamp}</td>
                  <td>
                    <span className="badge badge-demo" style={{ textTransform: "none" }}>
                      {log.action}
                    </span>
                  </td>
                  <td><strong>{log.target_id || "N/A"}</strong></td>
                  <td style={{ maxWidth: "180px", color: "#627D98" }}>{log.previous_value || "—"}</td>
                  <td style={{ maxWidth: "240px", fontWeight: "600" }}>{log.new_value || "—"}</td>
                  <td>{log.user}</td>
                  <td style={{ maxWidth: "200px", color: "#486581" }}>{log.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
