import React, { useState } from "react";
import { submitVerificationRequest } from "../services/api";
import { X, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function VerificationModal({ isOpen, onClose, defaultQuestion = "", category = "General" }) {
  const [question, setQuestion] = useState(defaultQuestion);
  const [userCategory, setUserCategory] = useState(category);
  const [reason, setReason] = useState("Information not available in verified knowledge base");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await submitVerificationRequest(question, userCategory, "", reason);
      if (res.status === "SUCCESS") {
        setSuccessMsg(`Official Verification Request #${res.request_id} created successfully! Authorized administrators will review and add the verified answer.`);
        setTimeout(() => {
          onClose();
          setSuccessMsg("");
        }, 3000);
      } else {
        setErrorMsg(res.message || "Failed to submit request.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Network error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#102A43" }}>
            Submit Official Verification Request
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#486581" }}>
            <X size={20} />
          </button>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", color: "#1B5E20", padding: "12px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle size={18} />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828", padding: "12px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <p style={{ fontSize: "0.85rem", color: "#486581", marginBottom: "16px" }}>
          Unverified or unconfirmed queries are forwarded to the recruitment verification queue. Authorized verifiers review official notifications, enter verified sources, and approve answers for public access.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question for Verification *</label>
            <textarea
              className="form-control"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your recruitment query..."
              required
            />
          </div>

          <div className="form-group">
            <label>Recruitment Category</label>
            <select
              className="form-control"
              value={userCategory}
              onChange={(e) => setUserCategory(e.target.value)}
            >
              <option value="Eligibility">Eligibility</option>
              <option value="Age">Age Criteria</option>
              <option value="Education">Educational Qualification</option>
              <option value="Physical Standards">Physical Standards</option>
              <option value="Medical Requirements">Medical Requirements</option>
              <option value="Documents">Mandatory Documents</option>
              <option value="Application Process">Application Process</option>
              <option value="Recruitment Process">Recruitment Process</option>
              <option value="Selection Process">Selection Process</option>
              <option value="Written Examination">Written Examination (CEE)</option>
              <option value="Vacancies">Vacancies</option>
              <option value="General Recruitment Queries">General Queries</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reason for Escalation</label>
            <input
              type="text"
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Send size={14} />
              {loading ? "Submitting..." : "Submit Verification Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
