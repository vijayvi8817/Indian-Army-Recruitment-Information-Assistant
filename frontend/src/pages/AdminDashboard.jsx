import React, { useState, useEffect } from "react";
import { getAdminOverview, getExportExcelUrl } from "../services/api";
import { LayoutDashboard, Database, Clock, CheckCircle, XCircle, Download, RefreshCw, FileSpreadsheet } from "lucide-react";

export default function AdminDashboard({ setActiveTab }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="gov-card" style={{ textAlign: "center", padding: "40px" }}>Loading dashboard statistics...</div>;
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "20px" }}>
        <div className="gov-card" style={{ padding: "18px", borderLeft: "4px solid #102A43" }}>
          <div style={{ fontSize: "0.8rem", color: "#486581", fontWeight: "700" }}>TOTAL FAQS IN KB</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#102A43", margin: "4px 0" }}>{overview?.total_faqs || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "#627D98" }}>{overview?.verified_faqs || 0} Verified • {overview?.demo_faqs || 0} Demo Records</div>
        </div>

        <div className="gov-card" style={{ padding: "18px", borderLeft: "4px solid #D97706" }}>
          <div style={{ fontSize: "0.8rem", color: "#486581", fontWeight: "700" }}>PENDING VERIFICATION</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#D97706", margin: "4px 0" }}>{overview?.pending_requests || 0}</div>
          <button onClick={() => setActiveTab("admin-requests")} style={{ fontSize: "0.75rem", color: "#D97706", background: "none", border: "none", cursor: "pointer", fontWeight: "700", textDecoration: "underline", padding: 0 }}>
            Open Verification Queue →
          </button>
        </div>

        <div className="gov-card" style={{ padding: "18px", borderLeft: "4px solid #1B5E20" }}>
          <div style={{ fontSize: "0.8rem", color: "#486581", fontWeight: "700" }}>APPROVED REQUESTS</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#1B5E20", margin: "4px 0" }}>{overview?.approved_requests || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "#1B5E20" }}>Added to Knowledge Base</div>
        </div>

        <div className="gov-card" style={{ padding: "18px", borderLeft: "4px solid #C62828" }}>
          <div style={{ fontSize: "0.8rem", color: "#486581", fontWeight: "700" }}>REJECTED REQUESTS</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#C62828", margin: "4px 0" }}>{overview?.rejected_requests || 0}</div>
          <div style={{ fontSize: "0.75rem", color: "#C62828" }}>Unverified / Out of Scope</div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="gov-card" style={{ backgroundColor: "#F0F4F8", border: "1px solid #BCCCDC" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#102A43" }}>
              <FileSpreadsheet size={18} style={{ display: "inline", marginRight: "6px" }} /> Master FAQ Dataset (Excel File)
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#486581" }}>
              The system synchronizes all verified FAQs with <code>data/army_recruitment_faq.xlsx</code>.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <a href={getExportExcelUrl()} download className="btn btn-outline" style={{ backgroundColor: "#FFFFFF" }}>
              <Download size={14} /> Export Master Excel
            </a>
            <button onClick={() => setActiveTab("admin-faqs")} className="btn btn-primary">
              <Database size={14} /> Manage Knowledge Base
            </button>
          </div>
        </div>
      </div>

      {/* Recently Updated FAQs */}
      <div className="gov-card">
        <div className="gov-card-title">
          <span>Recently Updated Knowledge Base Records</span>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <table className="gov-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Category</th>
              <th>Source</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {overview?.recent_faqs?.map((f) => (
              <tr key={f.faq_id}>
                <td><strong>{f.faq_id}</strong></td>
                <td>{f.question}</td>
                <td>{f.category}</td>
                <td>{f.source_name}</td>
                <td>
                  <span className={`badge ${f.status === "VERIFIED" ? "badge-verified" : "badge-unknown"}`}>
                    {f.status}
                  </span>
                </td>
                <td>{f.last_updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
