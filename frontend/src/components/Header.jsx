import React from "react";
import { Shield, ExternalLink, Globe } from "lucide-react";
import { translations } from "../utils/translations";

export default function Header({ lang = "en", setLang }) {
  const t = translations[lang] || translations.en;

  return (
    <header>
      {/* Indian Tri-Color Top Accent Bar */}
      <div className="tricolor-bar">
        <div className="tricolor-saffron"></div>
        <div className="tricolor-white"></div>
        <div className="tricolor-green"></div>
      </div>

      <div className="gov-header">
        <div className="gov-header-inner">
          <div className="gov-brand">
            <div className="gov-emblem-badge" title="Indian Army Information Assistance Portal" style={{ width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A192F", border: "2px solid #D4AF37", boxShadow: "0 0 10px rgba(212, 175, 55, 0.4)", padding: "0" }}>
              <img src="/indian_army_logo.png" alt="Indian Army Emblem" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="gov-title-group">
              <h1>{t.appTitle}</h1>
              <p>{t.appSubTitle}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Language Switcher Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(212, 175, 55, 0.5)",
                borderRadius: "20px",
                padding: "3px 8px"
              }}
            >
              <Globe size={14} color="#D4AF37" />
              <button
                onClick={() => setLang("en")}
                style={{
                  background: lang === "en" ? "#D4AF37" : "transparent",
                  color: lang === "en" ? "#0A192F" : "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  padding: "3px 10px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                English
              </button>
              <button
                onClick={() => setLang("hi")}
                style={{
                  background: lang === "hi" ? "#D4AF37" : "transparent",
                  color: lang === "hi" ? "#0A192F" : "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  padding: "3px 10px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLang("mr")}
                style={{
                  background: lang === "mr" ? "#D4AF37" : "transparent",
                  color: lang === "mr" ? "#0A192F" : "#FFFFFF",
                  border: "none",
                  borderRadius: "14px",
                  padding: "3px 10px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                मराठी
              </button>
            </div>

            <span className="gov-official-tag">
              <Shield size={14} /> {t.groundedSystem}
            </span>
            <a
              href="https://www.joinindianarmy.nic.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.3)", fontSize: "0.8rem", padding: "6px 12px" }}
            >
              {t.officialPortal} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
