import React from "react";
import { AlertTriangle } from "lucide-react";
import { translations } from "../utils/translations";

export default function DisclaimerBanner({ lang = "en" }) {
  const t = translations[lang] || translations.en;

  return (
    <div className="disclaimer-banner">
      <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px", color: "#D97706" }} />
      <div>
        <strong>{t.disclaimerTitle}</strong> {t.disclaimerText}{" "}
        <a
          href="https://www.joinindianarmy.nic.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#B45309", fontWeight: "700", textDecoration: "underline" }}
        >
          www.joinindianarmy.nic.in
        </a>.
      </div>
    </div>
  );
}
