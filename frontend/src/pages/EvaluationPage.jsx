import React, { useState } from "react";
import { runEvaluationSuite } from "../services/api";
import { Award, Play, CheckCircle, XCircle, ShieldCheck, Zap, BarChart2, RefreshCw } from "lucide-react";

export default function EvaluationPage() {
  const [evalResult, setEvalResult] = useState(null);
  const [running, setRunning] = useState(false);

  const handleRunEval = async () => {
    setRunning(true);
    try {
      const data = await runEvaluationSuite();
      setEvalResult(data);
    } catch (err) {
      alert("Failed to run evaluation suite: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const summary = evalResult?.summary;

  return (
    <div>
      <div className="gov-card">
        <div className="gov-card-title">
          <span><Award size={20} style={{ display: "inline", marginRight: "8px" }} /> System Evaluation & Accuracy Benchmark</span>
          <button onClick={handleRunEval} disabled={running} className="btn btn-success">
            <Play size={14} /> {running ? "Running 30+ Benchmark Tests..." : "Run Evaluation Suite"}
          </button>
        </div>

        <p style={{ fontSize: "0.85rem", color: "#486581", marginBottom: "16px" }}>
          Executes automated tests on 30 benchmark test scenarios including exact questions, paraphrased Hinglish queries, unknown out-of-scope questions, and adversarial jailbreak attempts. Measures zero-hallucination compliance.
        </p>

        {summary && (
          <div className="grid-4" style={{ marginBottom: "20px" }}>
            <div className="gov-card" style={{ padding: "16px", borderLeft: "4px solid #1B5E20" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#486581" }}>ANSWER ACCURACY</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1B5E20" }}>{summary.answer_accuracy_pct}%</div>
              <div style={{ fontSize: "0.72rem", color: "#1B5E20" }}>Known questions answered</div>
            </div>

            <div className="gov-card" style={{ padding: "16px", borderLeft: "4px solid #102A43" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#486581" }}>UNKNOWN REFUSAL RATE</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#102A43" }}>{summary.unknown_refusal_rate_pct}%</div>
              <div style={{ fontSize: "0.72rem", color: "#102A43" }}>Unsupported queries refused</div>
            </div>

            <div className="gov-card" style={{ padding: "16px", borderLeft: "4px solid #138808" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#486581" }}>HALLUCINATION RATE</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#138808" }}>{summary.hallucination_rate_pct}%</div>
              <div style={{ fontSize: "0.72rem", color: "#138808" }}>Target: 0.00% Zero-Hallucination</div>
            </div>

            <div className="gov-card" style={{ padding: "16px", borderLeft: "4px solid #D97706" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#486581" }}>AVG RESPONSE TIME</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#D97706" }}>{summary.avg_response_time_ms} ms</div>
              <div style={{ fontSize: "0.72rem", color: "#D97706" }}>Retrieval & inference latency</div>
            </div>
          </div>
        )}

        {evalResult?.test_results && (
          <div>
            <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "#102A43", marginBottom: "10px" }}>
              Detailed Test Benchmark Matrix ({evalResult.test_results.length} Scenarios)
            </h4>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Test Type</th>
                  <th>Test Query</th>
                  <th>Expected Status</th>
                  <th>Actual Status</th>
                  <th>Result</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {evalResult.test_results.map((tr, idx) => (
                  <tr key={idx}>
                    <td><span className="badge badge-demo">{tr.type}</span></td>
                    <td style={{ maxWidth: "340px" }}>{tr.query}</td>
                    <td>{tr.expected_status}</td>
                    <td>{tr.actual_status}</td>
                    <td>
                      {tr.passed ? (
                        <span className="badge badge-verified"><CheckCircle size={12} /> PASSED</span>
                      ) : (
                        <span className="badge badge-conflict"><XCircle size={12} /> FAILED</span>
                      )}
                    </td>
                    <td>{tr.latency_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
