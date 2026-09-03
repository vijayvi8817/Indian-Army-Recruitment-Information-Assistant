const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://127.0.0.1:8005"
      : "");


export async function sendChatMessage(query, history = []) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_query: query, conversation_history: history })
  });
  if (!response.ok) throw new Error("Failed to process chat message.");
  return response.json();
}

export async function submitVerificationRequest(userQuestion, category, retrievedContext, reason) {
  const response = await fetch(`${API_BASE_URL}/api/verification/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_question: userQuestion,
      category: category || "General Recruitment Queries",
      retrieved_context: retrievedContext || "",
      reason_for_escalation: reason || "Unverified query"
    })
  });
  if (!response.ok) throw new Error("Failed to submit verification request.");
  return response.json();
}

export async function getAdminOverview() {
  const response = await fetch(`${API_BASE_URL}/api/admin/overview`);
  if (!response.ok) throw new Error("Failed to fetch admin overview.");
  return response.json();
}

export async function getVerificationRequests(status = "ALL") {
  const url = status && status !== "ALL" 
    ? `${API_BASE_URL}/api/admin/verification-requests?status=${status}`
    : `${API_BASE_URL}/api/admin/verification-requests`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch verification requests.");
  return response.json();
}

export async function approveVerificationRequest(id, data) {
  const response = await fetch(`${API_BASE_URL}/api/admin/verification-requests/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to approve verification request.");
  return response.json();
}

export async function rejectVerificationRequest(id, reason) {
  const response = await fetch(`${API_BASE_URL}/api/admin/verification-requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error("Failed to reject request.");
  return response.json();
}

export async function markRequestDuplicate(id, existingFaqId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/verification-requests/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ existing_faq_id: existingFaqId })
  });
  if (!response.ok) throw new Error("Failed to mark duplicate.");
  return response.json();
}

export async function getAllFaqs(category = "ALL", search = "") {
  let url = `${API_BASE_URL}/api/admin/faqs?`;
  if (category && category !== "ALL") url += `category=${encodeURIComponent(category)}&`;
  if (search) url += `search=${encodeURIComponent(search)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch FAQs.");
  return response.json();
}

export async function checkDuplicateFaq(question) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs/check-duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  if (!response.ok) throw new Error("Failed to check duplicate.");
  return response.json();
}

export async function createFaq(faqData) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(faqData)
  });
  if (!response.ok) throw new Error("Failed to create FAQ.");
  return response.json();
}

export async function updateFaq(id, faqData) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(faqData)
  });
  if (!response.ok) throw new Error("Failed to update FAQ.");
  return response.json();
}

export async function deactivateFaq(id) {
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to deactivate FAQ.");
  return response.json();
}

export async function uploadExcelFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs/import`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to upload Excel.");
  }
  return response.json();
}

export function getExportExcelUrl() {
  return `${API_BASE_URL}/api/admin/faqs/export`;
}

export async function getAuditLogs(limit = 100, action = "ALL") {
  const url = action && action !== "ALL"
    ? `${API_BASE_URL}/api/admin/audit-log?limit=${limit}&action=${action}`
    : `${API_BASE_URL}/api/admin/audit-log?limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch audit logs.");
  return response.json();
}

export async function runEvaluationSuite() {
  const response = await fetch(`${API_BASE_URL}/api/admin/evaluation`);
  if (!response.ok) throw new Error("Failed to run evaluation suite.");
  return response.json();
}
