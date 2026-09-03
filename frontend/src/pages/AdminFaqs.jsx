import React, { useState, useEffect } from "react";
import { getAllFaqs, createFaq, updateFaq, deactivateFaq, checkDuplicateFaq, uploadExcelFile, getExportExcelUrl } from "../services/api";
import { Database, Plus, Upload, Download, Search, Edit2, Trash2, AlertTriangle, CheckCircle, X, Shield, FileSpreadsheet } from "lucide-react";

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("General Recruitment Queries");
  const [sourceName, setSourceName] = useState("Official Indian Army Recruitment Notification");
  const [sourceUrl, setSourceUrl] = useState("https://www.joinindianarmy.nic.in");
  const [sourceRef, setSourceRef] = useState("Official Notification");
  const [pageNumber, setPageNumber] = useState("Page 1");
  const [altQuestions, setAltQuestions] = useState("");
  const [isDemo, setIsDemo] = useState(0);

  // Duplicate warning
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const categories = [
    "ALL", "Eligibility", "Age", "Education", "Physical Standards", "Medical Requirements",
    "Documents", "Application Process", "Recruitment Process", "Selection Process",
    "Written Examination", "Physical Fitness Test", "Admit Card", "Vacancies", "General Recruitment Queries"
  ];

  useEffect(() => {
    loadFaqs();
  }, [category]);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await getAllFaqs(category, search);
      setFaqs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setFaqCategory("General Recruitment Queries");
    setSourceName("Official Indian Army Recruitment Notification");
    setSourceUrl("https://www.joinindianarmy.nic.in");
    setSourceRef("Official Notification Reference");
    setPageNumber("Page 1");
    setAltQuestions("");
    setIsDemo(0);
    setDuplicateWarning(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setFaqCategory(faq.category);
    setSourceName(faq.source_name);
    setSourceUrl(faq.source_url || "https://www.joinindianarmy.nic.in");
    setSourceRef(faq.source_reference || "");
    setPageNumber(faq.page_number || "");
    setAltQuestions(faq.alternative_questions || "");
    setIsDemo(faq.is_demo || 0);
    setDuplicateWarning(null);
    setModalOpen(true);
  };

  const handleQuestionBlur = async () => {
    if (!question.trim() || editingFaq) return;
    try {
      const res = await checkDuplicateFaq(question);
      if (res.has_similar) {
        setDuplicateWarning(res);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    const payload = {
      question,
      answer,
      category: faqCategory,
      source_name: sourceName,
      source_url: sourceUrl,
      source_reference: sourceRef,
      page_number: pageNumber,
      alternative_questions: altQuestions,
      is_demo: isDemo
    };

    try {
      if (editingFaq) {
        await updateFaq(editingFaq.faq_id, payload);
        setMsg(`FAQ ${editingFaq.faq_id} updated successfully.`);
      } else {
        const res = await createFaq(payload);
        setMsg(`Created FAQ ${res.faq_id} and updated knowledge base.`);
      }
      setModalOpen(false);
      loadFaqs();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      alert("Failed to save FAQ: " + err.message);
    }
  };

  const handleDeactivate = async (faqId) => {
    if (!window.confirm(`Deactivate FAQ ${faqId}?`)) return;
    try {
      await deactivateFaq(faqId);
      loadFaqs();
    } catch (err) {
      alert("Failed to deactivate FAQ.");
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadExcelFile(file);
      alert(`Success: ${res.message}`);
      loadFaqs();
    } catch (err) {
      alert("Excel import failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-title">
          <span><Database size={20} style={{ display: "inline", marginRight: "8px" }} /> Knowledge Base FAQ Management</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <label className="btn btn-outline" style={{ cursor: "pointer", backgroundColor: "#FFFFFF" }}>
              <Upload size={14} /> {uploading ? "Importing..." : "Upload Excel KB"}
              <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} style={{ display: "none" }} />
            </label>
            <a href={getExportExcelUrl()} download className="btn btn-outline" style={{ backgroundColor: "#FFFFFF" }}>
              <Download size={14} /> Export Master Excel
            </a>
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <Plus size={14} /> Add New FAQ
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", color: "#1B5E20", padding: "10px 14px", borderRadius: "4px", marginBottom: "16px", fontSize: "0.88rem" }}>
            {msg}
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: "220px" }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={loadFaqs} className="btn btn-outline">
            <Search size={14} /> Filter
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>Loading FAQs...</div>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>FAQ ID</th>
                <th>Question</th>
                <th>Category</th>
                <th>Source Name</th>
                <th>Status</th>
                <th>Is Demo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.faq_id}>
                  <td><strong>{f.faq_id}</strong></td>
                  <td style={{ maxWidth: "300px" }}>{f.question}</td>
                  <td>{f.category}</td>
                  <td>{f.source_name}</td>
                  <td>
                    <span className={`badge ${f.status === "VERIFIED" ? "badge-verified" : "badge-unknown"}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    {f.is_demo === 1 ? (
                      <span className="badge badge-demo">DEMO</span>
                    ) : (
                      <span className="badge badge-verified">OFFICIAL</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleOpenEdit(f)} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDeactivate(f.faq_id)} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#C62828" }}>
                        <Trash2 size={12} /> Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#102A43" }}>
                {editingFaq ? `Edit FAQ ${editingFaq.faq_id}` : "Create New Verified FAQ"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#486581" }}>
                <X size={20} />
              </button>
            </div>

            {duplicateWarning && duplicateWarning.has_similar && (
              <div style={{ backgroundColor: "#FFF9E6", border: "1px solid #FFE58F", borderLeft: "4px solid #D97706", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#D97706", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={16} /> SIMILAR FAQ DETECTED (Similarity: {duplicateWarning.similarity_score})
                </div>
                <div style={{ fontSize: "0.82rem", color: "#593800", marginTop: "4px" }}>
                  Existing Question #{duplicateWarning.similar_faq?.faq_id}: "{duplicateWarning.similar_faq?.question}"
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Recruitment Question *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onBlur={handleQuestionBlur}
                  required
                />
              </div>

              <div className="form-group">
                <label>Verified Answer * (Must match official source)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)}>
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
                  <label>Is Demo Data?</label>
                  <select className="form-control" value={isDemo} onChange={(e) => setIsDemo(Number(e.target.value))}>
                    <option value={0}>0 - Genuine Official Data</option>
                    <option value={1}>1 - Demo Data Placeholder</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Source Document Name *</label>
                  <input type="text" className="form-control" value={sourceName} onChange={(e) => setSourceName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Source URL</label>
                  <input type="url" className="form-control" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Section / Reference</label>
                  <input type="text" className="form-control" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Page Number</label>
                  <input type="text" className="form-control" value={pageNumber} onChange={(e) => setPageNumber(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Alternative Paraphrased Questions (Pipe '|' separated)</label>
                <input type="text" className="form-control" value={altQuestions} onChange={(e) => setAltQuestions(e.target.value)} placeholder="Alt 1|Alt 2" />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFaq ? "Save Changes" : "Create FAQ & Reindex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
