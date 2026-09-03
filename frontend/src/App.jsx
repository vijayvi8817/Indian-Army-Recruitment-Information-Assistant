import React, { useState } from "react";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import DisclaimerBanner from "./components/DisclaimerBanner";
import ChatPage from "./pages/ChatPage";
import FaqDirectoryPage from "./pages/FaqDirectoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import AdminFaqs from "./pages/AdminFaqs";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import EvaluationPage from "./pages/EvaluationPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [lang, setLang] = useState("en"); // 'en' | 'hi' | 'mr'

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header lang={lang} setLang={setLang} />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />

      <main className="main-container" style={{ flex: 1, marginTop: "16px" }}>
        <DisclaimerBanner lang={lang} />

        {activeTab === "chat" && <ChatPage lang={lang} setLang={setLang} />}
        {activeTab === "faqs" && <FaqDirectoryPage lang={lang} />}
        {activeTab === "admin-overview" && <AdminDashboard setActiveTab={setActiveTab} />}
        {activeTab === "admin-requests" && <AdminRequests />}
        {activeTab === "admin-faqs" && <AdminFaqs />}
        {activeTab === "admin-audit" && <AdminAuditLogs />}
        {activeTab === "admin-eval" && <EvaluationPage />}
      </main>

      <footer style={{ backgroundColor: "#0A192F", color: "#BCCCDC", padding: "20px 24px", textAlign: "center", fontSize: "0.82rem", borderTop: "2px solid #D4AF37", marginTop: "auto" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div><strong>INDIAN ARMY RECRUITMENT INFORMATION ASSISTANT</strong></div>
          <div style={{ margin: "4px 0", color: "#9FB3C8" }}>
            Information Assistance System • Grounded Verified Knowledge Base • Zero Hallucination Guarantee
          </div>
          <div style={{ fontSize: "0.75rem", color: "#627D98" }}>
            Disclaimer: Not an official website of the Indian Army. All recruitment information should be cross-verified against official notifications on www.joinindianarmy.nic.in.
          </div>
        </div>
      </footer>
    </div>
  );
}
