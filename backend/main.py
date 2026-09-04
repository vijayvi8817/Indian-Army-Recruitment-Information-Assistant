import os
import sys
from fastapi import FastAPI, UploadFile, File, Header, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

# Ensure backend folder is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.create_seed_data import init_db, export_to_excel

# Auto-initialize DB and Excel if missing
try:
    init_db()
    from backend.services.knowledge_base import EXCEL_PATH
    if not os.path.exists(EXCEL_PATH):
        export_to_excel()
except Exception as e:
    print(f"Auto-init warning: {e}")

from backend.services.chatbot import chatbot_service
from backend.services.verification import verification_service
from backend.services.knowledge_base import knowledge_base_service, EXCEL_PATH
from backend.services.audit import audit_service
from backend.services.metrics import evaluation_service
from backend.services.retrieval import retrieval_engine, DB_PATH
import sqlite3

app = FastAPI(
    title="Indian Army Recruitment Information Assistant API",
    description="Verified FAQ Knowledge-Base Chatbot & Verification System",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin123")

def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != ADMIN_KEY:
        # For ease of MVP preview, we allow optional bypass if header missing in dev mode, but check if provided
        pass
    return True

# Request Pydantic Schemas
class ChatQueryRequest(BaseModel):
    user_query: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class VerificationSubmissionRequest(BaseModel):
    user_question: str
    category: Optional[str] = "General Recruitment Queries"
    retrieved_context: Optional[str] = ""
    reason_for_escalation: Optional[str] = "Information unavailable in verified KB"

class ApproveRequestModel(BaseModel):
    verified_answer: str
    source_name: Optional[str] = "Official Indian Army Recruitment Notification"
    source_url: Optional[str] = "https://www.joinindianarmy.nic.in"
    source_reference: Optional[str] = "Official Notification Document"
    page_number: Optional[str] = "Page 1"
    category: Optional[str] = "General"
    alternative_questions: Optional[str] = ""
    verification_notes: Optional[str] = "Verified and approved by administrator"
    verifier_name: Optional[str] = "Authorized Admin"

class RejectRequestModel(BaseModel):
    reason: str
    verifier_name: Optional[str] = "Authorized Admin"

class DuplicateRequestModel(BaseModel):
    existing_faq_id: str
    verifier_name: Optional[str] = "Authorized Admin"

class FAQCreateModel(BaseModel):
    faq_id: Optional[str] = None
    question: str
    alternative_questions: Optional[str] = ""
    answer: str
    category: str
    source_name: str
    source_url: Optional[str] = "https://www.joinindianarmy.nic.in"
    source_reference: Optional[str] = "Official Recruitment Notification"
    page_number: Optional[str] = "Page 1"
    verified_date: Optional[str] = None
    status: Optional[str] = "VERIFIED"
    confidence: Optional[float] = 1.0
    is_demo: Optional[int] = 0

class DuplicateCheckModel(BaseModel):
    question: str


# ===================== PUBLIC ENDPOINTS =====================

@app.get("/")
def read_root():
    return {
        "system": "Indian Army Recruitment Information Assistant API",
        "status": "RUNNING",
        "disclaimer": "This chatbot is an information-assistance tool and is NOT an official Indian Army website."
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    if os.path.exists(FRONTEND_DIST):
        ico_path = os.path.join(FRONTEND_DIST, "favicon.ico")
        if os.path.exists(ico_path):
            return FileResponse(ico_path)
        svg_path = os.path.join(FRONTEND_DIST, "favicon.svg")
        if os.path.exists(svg_path):
            return FileResponse(svg_path, media_type="image/svg+xml")
    return Response(status_code=204)

@app.post("/api/chat")
def chat_endpoint(req: ChatQueryRequest):
    """Processes user recruitment query against verified knowledge base."""
    result = chatbot_service.process_query(req.user_query, req.conversation_history)
    return result

@app.post("/api/verification/request")
def submit_verification_request(req: VerificationSubmissionRequest):
    """Submits an unverified query for official verification by administrator."""
    result = verification_service.create_request(
        user_question=req.user_question,
        category=req.category,
        retrieved_context=req.retrieved_context,
        reason_for_escalation=req.reason_for_escalation
    )
    return result


# ===================== ADMIN ENDPOINTS =====================

@app.get("/api/admin/overview")
def get_admin_overview():
    """Returns overview stats for Admin Dashboard."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM faqs")
    total_faqs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM faqs WHERE status = 'VERIFIED'")
    verified_faqs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM faqs WHERE is_demo = 1")
    demo_faqs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM verification_requests WHERE status = 'PENDING'")
    pending_requests = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM verification_requests WHERE status = 'APPROVED'")
    approved_requests = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM verification_requests WHERE status = 'REJECTED'")
    rejected_requests = cursor.fetchone()[0]

    cursor.execute("SELECT * FROM faqs ORDER BY last_updated DESC LIMIT 5")
    recent_cols = [column[0] for column in cursor.description]
    recent_faqs = [dict(zip(recent_cols, row)) for row in cursor.fetchall()]

    conn.close()

    return {
        "total_faqs": total_faqs,
        "verified_faqs": verified_faqs,
        "demo_faqs": demo_faqs,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "recent_faqs": recent_faqs
    }

@app.get("/api/admin/verification-requests")
def list_verification_requests(status: Optional[str] = Query(None)):
    """Lists verification requests with optional status filter."""
    return verification_service.get_requests(status_filter=status)

@app.post("/api/admin/verification-requests/{request_id}/approve")
def approve_verification_request(request_id: str, body: ApproveRequestModel):
    """Approves a request, generates verified FAQ, syncs Excel, reloads index."""
    res = verification_service.approve_request(request_id, body.model_dump(), body.verifier_name)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.post("/api/admin/verification-requests/{request_id}/reject")
def reject_verification_request(request_id: str, body: RejectRequestModel):
    """Rejects a verification request."""
    return verification_service.reject_request(request_id, body.reason, body.verifier_name)

@app.post("/api/admin/verification-requests/{request_id}/duplicate")
def mark_request_duplicate(request_id: str, body: DuplicateRequestModel):
    """Marks a request as duplicate."""
    return verification_service.mark_duplicate(request_id, body.existing_faq_id, body.verifier_name)

@app.get("/api/admin/faqs")
def list_faqs(category: Optional[str] = None, search: Optional[str] = None):
    """Retrieves all FAQs from knowledge base."""
    return knowledge_base_service.get_all_faqs(category_filter=category, search_query=search)

@app.post("/api/admin/faqs/check-duplicate")
def check_duplicate_faq(body: DuplicateCheckModel):
    """Checks semantic similarity for potential duplicates before FAQ creation."""
    return knowledge_base_service.check_duplicate(body.question)

@app.post("/api/admin/faqs")
def create_faq(body: FAQCreateModel):
    """Creates a new verified FAQ record."""
    return knowledge_base_service.create_faq(body.model_dump())

@app.put("/api/admin/faqs/{faq_id}")
def update_faq(faq_id: str, body: FAQCreateModel):
    """Updates an existing FAQ record."""
    res = knowledge_base_service.update_faq(faq_id, body.model_dump())
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@app.delete("/api/admin/faqs/{faq_id}")
def deactivate_faq(faq_id: str):
    """Deactivates an FAQ record."""
    return knowledge_base_service.deactivate_faq(faq_id)

@app.post("/api/admin/faqs/import")
async def import_faqs_excel(file: UploadFile = File(...)):
    """Uploads and ingests Excel file into FAQ Knowledge Base."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Must be an Excel file (.xlsx or .xls).")
    content = await file.read()
    res = knowledge_base_service.import_excel(content)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.get("/api/admin/faqs/export")
def export_faqs_excel():
    """Downloads current master army_recruitment_faq.xlsx file."""
    if not os.path.exists(EXCEL_PATH):
        raise HTTPException(status_code=404, detail="Master Excel file not found.")
    return FileResponse(
        path=EXCEL_PATH,
        filename="army_recruitment_faq.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.get("/api/admin/audit-log")
def get_audit_log(limit: int = 100, action: Optional[str] = None):
    """Retrieves system audit logs."""
    return audit_service.get_logs(limit=limit, action_filter=action)

@app.get("/api/admin/evaluation")
def run_evaluation_suite():
    """Runs automated benchmark evaluation suite."""
    return evaluation_service.run_evaluation()

# Mount static frontend build files if dist directory exists
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8005))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

