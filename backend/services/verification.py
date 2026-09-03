import sqlite3
import pandas as pd
from datetime import datetime
import uuid
import os
from typing import Dict, Any, List, Optional
from backend.services.retrieval import retrieval_engine, DB_PATH

EXCEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "army_recruitment_faq.xlsx")

class VerificationService:
    def create_request(self, user_question: str, category: str = "General", retrieved_context: str = "", reason_for_escalation: str = "") -> Dict[str, Any]:
        """Creates a pending verification request in SQLite DB."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            INSERT INTO verification_requests (
                request_id, user_question, category, timestamp, status,
                retrieved_context, reason_for_escalation
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (req_id, user_question, category, now_str, "PENDING", retrieved_context, reason_for_escalation))

        # Log audit entry
        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_str, "CREATE_REQUEST", req_id, None, user_question, "Candidate / User", reason_for_escalation))

        conn.commit()
        conn.close()

        return {
            "status": "SUCCESS",
            "message": "Official verification request submitted successfully.",
            "request_id": req_id,
            "user_question": user_question
        }

    def get_requests(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves list of verification requests."""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        if status_filter and status_filter.upper() != "ALL":
            cursor.execute("SELECT * FROM verification_requests WHERE status = ? ORDER BY timestamp DESC", (status_filter.upper(),))
        else:
            cursor.execute("SELECT * FROM verification_requests ORDER BY timestamp DESC")

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def approve_request(self, req_id: str, data: Dict[str, Any], verifier_name: str = "Authorized Admin") -> Dict[str, Any]:
        """
        Approves a verification request, converts it to a verified FAQ record,
        inserts into DB & Excel, reloads index, and records audit trail.
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM verification_requests WHERE request_id = ?", (req_id,))
        req = cursor.fetchone()
        if not req:
            conn.close()
            return {"status": "ERROR", "message": "Request not found."}

        # Generate new FAQ ID
        cursor.execute("SELECT COUNT(*) FROM faqs")
        count = cursor.fetchone()[0]
        new_faq_id = f"FAQ{count + 1:03d}"

        now_date = datetime.now().strftime("%Y-%m-%d")
        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        verified_answer = data.get("verified_answer", "").strip()
        source_name = data.get("source_name", "Official Indian Army Notification").strip()
        source_url = data.get("source_url", "https://www.joinindianarmy.nic.in").strip()
        source_reference = data.get("source_reference", "Official Recruitment Notice").strip()
        page_number = data.get("page_number", "Page 1").strip()
        category = data.get("category", req["category"] or "General").strip()
        alt_questions = data.get("alternative_questions", "").strip()
        notes = data.get("verification_notes", "Approved by authorized verifier").strip()

        # Insert new FAQ
        cursor.execute("""
            INSERT INTO faqs (
                faq_id, question, alternative_questions, answer, category,
                source_name, source_url, source_reference, page_number,
                verified_date, status, confidence, last_updated, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_faq_id, req["user_question"], alt_questions, verified_answer, category,
            source_name, source_url, source_reference, page_number,
            now_date, "VERIFIED", 1.0, now_datetime, 0
        ))

        # Update verification request
        cursor.execute("""
            UPDATE verification_requests SET
                status = 'APPROVED',
                verified_answer = ?,
                source_name = ?,
                source_url = ?,
                source_reference = ?,
                page_number = ?,
                verification_notes = ?,
                verifier_name = ?
            WHERE request_id = ?
        """, (verified_answer, source_name, source_url, source_reference, page_number, notes, verifier_name, req_id))

        # Audit Log
        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            now_datetime, "APPROVE_REQUEST", req_id,
            f"Question: {req['user_question']}",
            f"Created FAQ {new_faq_id}: {verified_answer}",
            verifier_name, notes
        ))

        conn.commit()

        # Sync Excel file
        cursor.execute("SELECT * FROM faqs")
        all_faqs = [dict(r) for r in cursor.fetchall()]
        conn.close()

        df = pd.DataFrame(all_faqs)
        df.to_excel(EXCEL_PATH, index=False)

        # Immediately reload search index so new FAQ is instantly searchable!
        retrieval_engine.reload_index()

        return {
            "status": "SUCCESS",
            "message": f"Verification request approved. Created verified FAQ {new_faq_id}.",
            "faq_id": new_faq_id
        }

    def reject_request(self, req_id: str, reason: str, verifier_name: str = "Authorized Admin") -> Dict[str, Any]:
        """Rejects a pending request with audit trail."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            UPDATE verification_requests SET status = 'REJECTED', verification_notes = ?, verifier_name = ?
            WHERE request_id = ?
        """, (reason, verifier_name, req_id))

        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_datetime, "REJECT_REQUEST", req_id, "PENDING", "REJECTED", verifier_name, reason))

        conn.commit()
        conn.close()

        return {"status": "SUCCESS", "message": f"Request {req_id} marked as REJECTED."}

    def mark_duplicate(self, req_id: str, existing_faq_id: str, verifier_name: str = "Authorized Admin") -> Dict[str, Any]:
        """Marks a request as DUPLICATE of an existing FAQ."""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        note = f"Duplicate of existing FAQ {existing_faq_id}"
        cursor.execute("""
            UPDATE verification_requests SET status = 'DUPLICATE', verification_notes = ?, verifier_name = ?
            WHERE request_id = ?
        """, (note, verifier_name, req_id))

        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_datetime, "MARK_DUPLICATE", req_id, "PENDING", f"DUPLICATE of {existing_faq_id}", verifier_name, note))

        conn.commit()
        conn.close()

        return {"status": "SUCCESS", "message": f"Request {req_id} marked as DUPLICATE of {existing_faq_id}."}

verification_service = VerificationService()
