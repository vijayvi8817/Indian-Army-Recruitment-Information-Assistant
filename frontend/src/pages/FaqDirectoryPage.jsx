import React, { useState, useEffect } from "react";
import { getAllFaqs } from "../services/api";
import { Search, BookOpen, CheckCircle, ExternalLink, Filter } from "lucide-react";

export default function FaqDirectoryPage() {
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

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
      console.error("Failed to load FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadFaqs();
  };

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-title">
          <span><BookOpen size={20} style={{ display: "inline", marginRight: "8px" }} /> Verified FAQ Knowledge Base Directory</span>
          <span style={{ fontSize: "0.85rem", color: "#486581", fontWeight: "normal" }}>
            Total Records: {faqs.length}
          </span>
        </div>

        {/* Search & Filters */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search verified recruitment questions, criteria, documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: "220px" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Search
          </button>
        </form>

        {/* FAQ Grid Cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>
            Loading verified knowledge base records...
          </div>
        ) : faqs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#486581" }}>
            No verified FAQs found matching your query criteria.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq) => (
              <div key={faq.faq_id} style={{ border: "1px solid #D9E2EC", borderRadius: "6px", padding: "16px", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span className="badge badge-verified" style={{ marginRight: "8px" }}>
                      <CheckCircle size={12} /> {faq.faq_id}
                    </span>
                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#486581", backgroundColor: "#F0F4F8", padding: "2px 8px", borderRadius: "4px" }}>
                      {faq.category}
                    </span>
                    {faq.is_demo === 1 && (
                      <span className="badge badge-demo" style={{ marginLeft: "8px" }}>
                        DEMO DATA
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#627D98" }}>Verified: {faq.verified_date}</span>
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#102A43", marginBottom: "8px" }}>
                  {faq.question}
                </h3>

                <p style={{ fontSize: "0.92rem", color: "#334E68", lineHeight: "1.6", marginBottom: "12px", whiteSpace: "pre-line" }}>
                  {faq.answer}
                </p>

                <div className="source-card">
                  <div style={{ fontSize: "0.8rem", color: "#102A43", fontWeight: "600" }}>
                    Source: {faq.source_name} | {faq.source_reference} ({faq.page_number})
                  </div>
                  {faq.source_url && (
                    <a
                      href={faq.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem", color: "#102A43", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}
                    >
                      Verify on Official Website <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
