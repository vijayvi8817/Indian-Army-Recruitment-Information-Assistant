import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";
import VerificationModal from "../components/VerificationModal";
import { translations } from "../utils/translations";
import {
  Send,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe
} from "lucide-react";

export default function ChatPage({ lang = "en", setLang }) {
  const t = translations[lang] || translations.en;

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      status: "VERIFIED",
      text: t.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingModalQuestion, setPendingModalQuestion] = useState("");
  const [pendingModalCategory, setPendingModalCategory] = useState("General");

  // Voice Recognition (Speech-to-Text) state
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN");
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Text-to-Speech state
  const [speakingIdx, setSpeakingIdx] = useState(null);

  const chatEndRef = useRef(null);

  // Sync voice lang with app language selection
  useEffect(() => {
    if (lang === "hi") setVoiceLang("hi-IN");
    else if (lang === "mr") setVoiceLang("mr-IN");
    else setVoiceLang("en-IN");
  }, [lang]);

  // Update welcome message on language toggle if it's initial
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === "bot") {
        return [
          {
            sender: "bot",
            status: "VERIFIED",
            text: t.welcomeMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      }
      return prev;
    });
  }, [lang, t.welcomeMessage]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isListening]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to initialize speech recognition:", e);
      setSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  // Text-to-Speech handler
  const handleSpeak = (text, idx) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryToSend) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = {
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery("");
    setLoading(true);

    try {
      const res = await sendChatMessage(q, []);
      const botMsg = {
        sender: "bot",
        status: res.status,
        text: res.answer,
        source: res.source,
        reference: res.reference,
        page_number: res.page_number,
        source_url: res.source_url,
        verified_date: res.verified_date,
        is_demo: res.is_demo,
        can_request_verification: res.can_request_verification,
        category: res.category || "General",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          status: "ERROR",
          text: "System error: Unable to retrieve recruitment information. Please check backend connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerification = (q, cat) => {
    setPendingModalQuestion(q);
    setPendingModalCategory(cat || "General Recruitment Queries");
    setModalOpen(true);
  };

  const handleClearChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    setMessages([
      {
        sender: "bot",
        status: "VERIFIED",
        text: t.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #D4AF37", flexShrink: 0 }}>
            <img src="/indian_army_logo.png" alt="Indian Army Emblem" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: "700" }}>{t.chatHeaderTitle}</div>
            <div style={{ fontSize: "0.75rem", color: "#BCCCDC" }}>{t.chatHeaderSubtitle}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Voice Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem" }}>
            <Globe size={12} color="#D4AF37" />
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              style={{ background: "transparent", color: "#FFFFFF", border: "none", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", outline: "none" }}
            >
              <option value="en-IN" style={{ color: "#000" }}>English (en-IN)</option>
              <option value="hi-IN" style={{ color: "#000" }}>हिंदी (hi-IN)</option>
              <option value="mr-IN" style={{ color: "#000" }}>मराठी (mr-IN)</option>
            </select>
          </div>

          <button
            onClick={handleClearChat}
            className="btn btn-outline"
            style={{ color: "#FFFFFF", borderColor: "rgba(255,255,255,0.3)", padding: "4px 10px", fontSize: "0.8rem" }}
          >
            <RefreshCw size={12} /> {t.clearChat}
          </button>
        </div>
      </div>

      {/* Suggested Questions */}
      <div style={{ backgroundColor: "#F0F4F8", borderBottom: "1px solid #D9E2EC", padding: "10px 16px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#102A43", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Sparkles size={12} color="#E65100" /> {t.suggestedTitle}
        </div>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {t.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="btn btn-outline"
              style={{
                backgroundColor: "#FFFFFF",
                fontSize: "0.78rem",
                padding: "4px 10px",
                whiteSpace: "nowrap",
                borderRadius: "16px",
                borderColor: "#BCCCDC"
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {msg.sender === "user" ? (
              <div className="chat-bubble-user">
                <div>{msg.text}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", textAlign: "right", marginTop: "4px" }}>
                  {msg.timestamp}
                </div>
              </div>
            ) : (
              <div className="chat-bubble-bot">
                {/* Status Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div>
                    {msg.status === "VERIFIED" && (
                      <span className="badge badge-verified">
                        <CheckCircle size={12} /> {t.verifiedBadge}
                      </span>
                    )}
                    {msg.status === "UNKNOWN" && (
                      <span className="badge badge-unknown">
                        <AlertTriangle size={12} /> {t.unverifiedBadge}
                      </span>
                    )}
                    {msg.status === "CONFLICT" && (
                      <span className="badge badge-conflict">
                        <AlertTriangle size={12} /> {t.conflictBadge}
                      </span>
                    )}
                    {msg.is_demo && (
                      <span className="badge badge-demo" style={{ marginLeft: "6px" }}>
                        {t.demoBadge}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Audio Readout Button */}
                    <button
                      onClick={() => handleSpeak(msg.text, idx)}
                      className="btn btn-outline"
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        borderColor: speakingIdx === idx ? "#E65100" : "#BCCCDC",
                        backgroundColor: speakingIdx === idx ? "#FFF3E0" : "#FFFFFF",
                        color: speakingIdx === idx ? "#E65100" : "#102A43"
                      }}
                      title={t.audioReadout}
                    >
                      {speakingIdx === idx ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      {t.audioReadout}
                    </button>
                    <span style={{ fontSize: "0.72rem", color: "#486581" }}>{msg.timestamp}</span>
                  </div>
                </div>

                {/* Answer Text */}
                <div style={{ fontSize: "0.93rem", color: "#102A43", whiteSpace: "pre-line" }}>
                  {msg.text}
                </div>

                {/* Grounded Source Card */}
                {msg.status === "VERIFIED" && msg.source && (
                  <div className="source-card">
                    <div className="source-card-title">
                      <span><FileText size={14} style={{ display: "inline", marginRight: "4px" }} /> {t.officialSourceRef}</span>
                      {msg.source_url && (
                        <a
                          href={msg.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#102A43", textDecoration: "underline", fontSize: "0.78rem" }}
                        >
                          {t.officialLink} <ExternalLink size={10} style={{ display: "inline" }} />
                        </a>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "6px" }}>
                      <div><strong>{t.document}</strong> {msg.source}</div>
                      <div><strong>{t.reference}</strong> {msg.reference} ({msg.page_number})</div>
                      <div><strong>{t.verifiedDate}</strong> {msg.verified_date}</div>
                      <div><strong>{t.category}</strong> {msg.category}</div>
                    </div>
                  </div>
                )}

                {/* Request Verification Escalate Button */}
                {msg.can_request_verification && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #D9E2EC" }}>
                    <p style={{ fontSize: "0.82rem", color: "#486581", marginBottom: "8px" }}>
                      {t.escalatePrompt}
                    </p>
                    <button
                      onClick={() => handleOpenVerification(messages[idx - 1]?.text || inputQuery, msg.category)}
                      className="btn btn-amber"
                      style={{ fontSize: "0.82rem" }}
                    >
                      <HelpCircle size={14} /> {t.requestVerificationBtn}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-bot" style={{ fontStyle: "italic", color: "#486581" }}>
            Searching verified knowledge base and validating sources...
          </div>
        )}

        {isListening && (
          <div style={{ backgroundColor: "#FFF3E0", border: "1px solid #FFE0B2", borderRadius: "8px", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#E65100", fontSize: "0.88rem", fontWeight: "600" }}>
              <span className="pulse-mic-icon" style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#E65100" }}></span>
              {t.listeningPrompt} <strong>{voiceLang === "hi-IN" ? "Hindi (हिंदी)" : voiceLang === "mr-IN" ? "Marathi (मराठी)" : "English"}</strong>...
            </div>
            <button onClick={toggleListening} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem", borderColor: "#E65100", color: "#E65100" }}>
              <MicOff size={12} /> {t.stopListening}
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Query Input Box with Voice Mic Button */}
      <div style={{ padding: "14px 16px", backgroundColor: "#FFFFFF", borderTop: "1px solid #D9E2EC" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: "flex", gap: "10px" }}
        >
          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={t.micTooltip}
            className={`btn ${isListening ? "btn-amber" : "btn-outline"}`}
            style={{
              padding: "9px 14px",
              backgroundColor: isListening ? "#E65100" : "#F4F6F9",
              color: isListening ? "#FFFFFF" : "#102A43",
              borderColor: isListening ? "#E65100" : "#D9E2EC"
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            className="form-control"
            placeholder={t.inputPlaceholder}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !inputQuery.trim()}>
            <Send size={16} /> {t.sendBtn}
          </button>
        </form>
      </div>

      {/* Verification Request Modal */}
      <VerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultQuestion={pendingModalQuestion}
        category={pendingModalCategory}
      />
    </div>
  );
}
