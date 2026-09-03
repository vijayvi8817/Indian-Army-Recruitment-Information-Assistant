import React, { useState, useEffect } from "react";
import { getVerificationRequests, approveVerificationRequest, rejectVerificationRequest, markRequestDuplicate } from "../services/api";
import { Clock, CheckCircle, XCircle, Copy, AlertTriangle, ShieldCheck, X, FileText } from "lucide-react";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [verifiedAnswer, setVerifiedAnswer] = useState("");
  const [sourceName, setSourceName] = useState("Official Indian Army Recruitment Notification");
  const [sourceUrl, setSourceUrl] = useState("https://www.joinindianarmy.nic.in");
  const [sourceRef, setSourceRef] = useState("Official Recruitment Notification Document");
  const [pageNumber, setPageNumber] = useState("Page 1");
  const [category, setCategory] = useState("General");
  const [altQuestions, setAltQuestions] = useState("");
  const [notes, setNotes] = useState("Verified by authorized administrator");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getVerificationRequests(filter);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (req) => {
    setSelectedReq(req);
    setVerifiedAnswer(req.verified_answer || "");
    setSourceName(req.source_name || "Official Indian Army Recruitment Notification");
    setSourceUrl(req.source_url || "https://www.joinindianarmy.nic.in");
    setSourceRef(req.source_reference || "Official Recruitment Notification");
    setPageNumber(req.page_number || "Page 1");
    setCategory(req.category || "General Recruitment Queries");
    setAltQuestions("");
    setNotes("Verified and approved by administrator");
    setActionError("");
    setActionSuccess("");
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedReq || !verifiedAnswer.trim()) return;

    setSubmitting(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await approveVerificationRequest(selectedReq.request_id, {
        verified_answer: verifiedAnswer,
        source_name: sourceName,
        source_url: sourceUrl,
        source_reference: sourceRef,
        page_number: pageNumber,
        category: category,
        alternative_questions: altQuestions,
        verification_notes: notes,
        verifier_name: "Authorized Admin"
      });

      if (res.status === "SUCCESS") {
        setActionSuccess(`Approved! Created FAQ ${res.faq_id} and synchronized knowledge base.`);
        setTimeout(() => {
          setSelectedReq(null);
          loadRequests();
        }, 2000);
      } else {
        setActionError(res.message || "Failed to approve request.");
      }
    } catch (err) {
      setActionError(err.message || "Approval failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reqId) => {
    const reason = prompt("Enter reason for rejecting this verification request:");
    if (!reason) return;
    try {
      await rejectVerificationRequest(reqId, reason);
      loadRequests();
    } catch (err) {
      alert("Failed to reject request.");
    }
  };

  const handleMarkDuplicate = async (reqId) => {
    const faqId = prompt("Enter existing FAQ ID (e.g. FAQ001) that answers this query:");
    if (!faqId) return;
    try {
      await markRequestDuplicate(reqId, faqId);
      loadRequests();
    } catch (err) {
      alert("Failed to mark duplicate.");
    }
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-title">
          <span><Clock size={20} style={{ display: "inline", marginRight: "8px" }} /> Official Verification Request Queue</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {["PENDING", "APPROVED", "REJECTED", "DUPLICATE", "ALL"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`btn ${filter === st ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "4px 10px", fontSize: "0.78rem" }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>Loading verification requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>
            No verification requests found in status <strong>{filter}</strong>.
          </div>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Candidate Question</th>
                <th>Category</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.request_id}>
                  <td><strong>{r.request_id}</strong></td>
                  <td style={{ maxWidth: "340px" }}>{r.user_question}</td>
                  <td>{r.category || "General"}</td>
                  <td>{r.timestamp}</td>
                  <td>
                    <span className={`badge ${
                      r.status === "APPROVED" ? "badge-verified" :
                      r.status === "PENDING" ? "badge-unknown" :
                      r.status === "REJECTED" ? "badge-conflict" : "badge-demo"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleOpenReview(r)} className="btn btn-success" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                          <CheckCircle size={12} /> Answer & Approve
                        </button>
                        <button onClick={() => handleReject(r.request_id)} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#C62828" }}>
                          <XCircle size={12} /> Reject
                        </button>
                        <button onClick={() => handleMarkDuplicate(r.request_id)} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                          <Copy size={12} /> Duplicate
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "#486581" }}>{r.verification_notes || "Processed"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review & Approve Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "750px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#102A43" }}>
                Verify & Approve Question #{selectedReq.request_id}
              </h3>
              <button onClick={() => setSelectedReq(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#486581" }}>
                <X size={20} />
              </button>
            </div>

            {actionSuccess && (
              <div style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", color: "#1B5E20", padding: "12px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.88rem" }}>
                {actionSuccess}
              </div>
            )}

            {actionError && (
              <div style={{ backgroundColor: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828", padding: "12px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.88rem" }}>
                {actionError}
              </div>
            )}

            <div style={{ backgroundColor: "#F0F4F8", padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", borderLeft: "4px solid #102A43" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#486581" }}>CANDIDATE SUBMITTED QUESTION:</div>
              <div style={{ fontSize: "1rem", fontWeight: "700", color: "#102A43", marginTop: "2px" }}>{selectedReq.user_question}</div>
            </div>

            <form onSubmit={handleApprove}>
              <div className="form-group">
                <label>Verified Official Answer * (Must come strictly from Official Notification)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={verifiedAnswer}
                  onChange={(e) => setVerifiedAnswer(e.target.value)}
                  placeholder="Enter the official verified answer text..."
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Official Source Document Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Official Source URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Document Section / Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    placeholder="e.g. Section 2 Clause 4"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Page / Appendix Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    placeholder="e.g. Page 4"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
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
                  <label>Alternative Questions (Pipe '|' separated for semantic match)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={altQuestions}
                    onChange={(e) => setAltQuestions(e.target.value)}
                    placeholder="Alternative question 1|Alternative question 2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Verification Notes</label>
                <input
                  type="text"
                  className="form-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setSelectedReq(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-success">
                  <ShieldCheck size={16} />
                  {submitting ? "Processing..." : "Approve & Add to Knowledge Base"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
