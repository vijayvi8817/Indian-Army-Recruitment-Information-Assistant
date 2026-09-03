import React from "react";
import { MessageSquare, BookOpen, LayoutDashboard, Clock, Database, History, Award } from "lucide-react";
import { translations } from "../utils/translations";

export default function Navbar({ activeTab, setActiveTab, lang = "en" }) {
  const t = translations[lang] || translations.en;

  const tabs = [
    { id: "chat", label: t.navChat, icon: MessageSquare },
    { id: "faqs", label: t.navFaqs, icon: BookOpen },
    { id: "admin-overview", label: t.navOverview, icon: LayoutDashboard },
    { id: "admin-requests", label: t.navRequests, icon: Clock },
    { id: "admin-faqs", label: t.navFaqsAdmin, icon: Database },
    { id: "admin-audit", label: t.navAudit, icon: History },
    { id: "admin-eval", label: t.navEval, icon: Award }
  ];

  return (
    <nav className="gov-navbar">
      <div className="gov-navbar-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
