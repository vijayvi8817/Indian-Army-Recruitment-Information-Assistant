import sqlite3
import pandas as pd
from datetime import datetime
import os
import io
from typing import Dict, Any, List, Optional
from backend.services.retrieval import retrieval_engine, DB_PATH

EXCEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "army_recruitment_faq.xlsx")

class KnowledgeBaseService:
    def get_all_faqs(self, category_filter: Optional[str] = None, search_query: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM faqs WHERE 1=1"
        params = []

        if category_filter and category_filter.lower() != "all":
            query += " AND category = ?"
            params.append(category_filter)

        if search_query and search_query.strip():
            query += " AND (question LIKE ? OR answer LIKE ? OR alternative_questions LIKE ?)"
            term = f"%{search_query.strip()}%"
            params.extend([term, term, term])

        query += " ORDER BY faq_id ASC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def check_duplicate(self, question: str) -> Dict[str, Any]:
        """Checks if a similar FAQ already exists before adding."""
        status, top_faq, score, candidates, conflict = retrieval_engine.search(question, top_k=3)
        is_similar = score >= 0.65
        return {
            "has_similar": is_similar,
            "similarity_score": score,
            "similar_faq": top_faq if is_similar else None
        }

    def create_faq(self, data: Dict[str, Any], user: str = "Admin") -> Dict[str, Any]:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM faqs")
        count = cursor.fetchone()[0]
        new_id = data.get("faq_id") or f"FAQ{count + 1:03d}"

        now_date = datetime.now().strftime("%Y-%m-%d")
        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            INSERT INTO faqs (
                faq_id, question, alternative_questions, answer, category,
                source_name, source_url, source_reference, page_number,
                verified_date, status, confidence, last_updated, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_id,
            data["question"],
            data.get("alternative_questions", ""),
            data["answer"],
            data.get("category", "General Recruitment Queries"),
            data.get("source_name", "Official Indian Army Recruitment Notification"),
            data.get("source_url", "https://www.joinindianarmy.nic.in"),
            data.get("source_reference", "Official Notification Reference"),
            data.get("page_number", "Page 1"),
            data.get("verified_date", now_date),
            data.get("status", "VERIFIED"),
            float(data.get("confidence", 1.0)),
            now_datetime,
            int(data.get("is_demo", 0))
        ))

        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_datetime, "CREATE_FAQ", new_id, None, data["question"], user, "Manual FAQ Creation"))

        conn.commit()

        # Update Excel
        cursor.execute("SELECT * FROM faqs")
        all_faqs = [dict(r) for r in cursor.fetchall()]
        conn.close()

        df = pd.DataFrame(all_faqs)
        df.to_excel(EXCEL_PATH, index=False)

        retrieval_engine.reload_index()

        return {"status": "SUCCESS", "message": f"FAQ {new_id} created successfully.", "faq_id": new_id}

    def update_faq(self, faq_id: str, data: Dict[str, Any], user: str = "Admin") -> Dict[str, Any]:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM faqs WHERE faq_id = ?", (faq_id,))
        existing = cursor.fetchone()
        if not existing:
            conn.close()
            return {"status": "ERROR", "message": "FAQ not found"}

        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        old_val = existing["question"]

        cursor.execute("""
            UPDATE faqs SET
                question = ?,
                alternative_questions = ?,
                answer = ?,
                category = ?,
                source_name = ?,
                source_url = ?,
                source_reference = ?,
                page_number = ?,
                status = ?,
                is_demo = ?,
                last_updated = ?
            WHERE faq_id = ?
        """, (
            data.get("question", existing["question"]),
            data.get("alternative_questions", existing["alternative_questions"]),
            data.get("answer", existing["answer"]),
            data.get("category", existing["category"]),
            data.get("source_name", existing["source_name"]),
            data.get("source_url", existing["source_url"]),
            data.get("source_reference", existing["source_reference"]),
            data.get("page_number", existing["page_number"]),
            data.get("status", existing["status"]),
            int(data.get("is_demo", existing["is_demo"])),
            now_datetime,
            faq_id
        ))

        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_datetime, "UPDATE_FAQ", faq_id, old_val, data.get("question", existing["question"]), user, "FAQ Updated"))

        conn.commit()

        # Update Excel
        cursor.execute("SELECT * FROM faqs")
        all_faqs = [dict(r) for r in cursor.fetchall()]
        conn.close()

        df = pd.DataFrame(all_faqs)
        df.to_excel(EXCEL_PATH, index=False)

        retrieval_engine.reload_index()

        return {"status": "SUCCESS", "message": f"FAQ {faq_id} updated successfully."}

    def deactivate_faq(self, faq_id: str, user: str = "Admin") -> Dict[str, Any]:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("UPDATE faqs SET status = 'DEACTIVATED', last_updated = ? WHERE faq_id = ?", (now_datetime, faq_id))
        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_datetime, "DEACTIVATE_FAQ", faq_id, "VERIFIED", "DEACTIVATED", user, "Deactivated by admin"))

        conn.commit()
        conn.close()

        retrieval_engine.reload_index()
        return {"status": "SUCCESS", "message": f"FAQ {faq_id} deactivated."}

    def import_excel(self, file_bytes: bytes, user: str = "Admin") -> Dict[str, Any]:
        """Validates columns, previews/imports Excel records."""
        try:
            df = pd.read_excel(io.BytesIO(file_bytes))
        except Exception as e:
            return {"status": "ERROR", "message": f"Invalid Excel file format: {str(e)}"}

        required_cols = ["question", "answer", "category", "source_name"]
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            return {"status": "ERROR", "message": f"Missing required Excel columns: {', '.join(missing)}"}

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now_date = datetime.now().strftime("%Y-%m-%d")
        now_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        imported_count = 0
        duplicate_warnings = []

        for idx, row in df.iterrows():
            q = str(row["question"]).strip()
            ans = str(row["answer"]).strip()
            cat = str(row.get("category", "General Recruitment Queries")).strip()
            src = str(row.get("source_name", "Uploaded Excel Source")).strip()
            s_url = str(row.get("source_url", "https://www.joinindianarmy.nic.in")).strip()
            s_ref = str(row.get("source_reference", "Imported Document")).strip()
            pg = str(row.get("page_number", "N/A")).strip()
            alts = str(row.get("alternative_questions", "")).strip()
            if alts == "nan":
                alts = ""

            cursor.execute("SELECT COUNT(*) FROM faqs")
            count = cursor.fetchone()[0]
            faq_id = f"FAQ{count + 1:03d}"

            cursor.execute("""
                INSERT INTO faqs (
                    faq_id, question, alternative_questions, answer, category,
                    source_name, source_url, source_reference, page_number,
                    verified_date, status, confidence, last_updated, is_demo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                faq_id, q, alts, ans, cat, src, s_url, s_ref, pg, now_date, "VERIFIED", 1.0, now_datetime, 0
            ))
            imported_count += 1

        cursor.execute("""
            INSERT INTO audit_logs (timestamp, action, target_id, previous_value, new_value, user, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_datetime, "IMPORT_EXCEL", "BATCH", None, f"Imported {imported_count} FAQs", user, "Excel Batch Upload"))

        conn.commit()

        # Update Master Excel file
        cursor.execute("SELECT * FROM faqs")
        all_faqs = [dict(r) for r in cursor.fetchall()]
        conn.close()

        df_all = pd.DataFrame(all_faqs)
        df_all.to_excel(EXCEL_PATH, index=False)

        retrieval_engine.reload_index()

        return {
            "status": "SUCCESS",
            "message": f"Successfully imported {imported_count} FAQ records into Knowledge Base.",
            "imported_count": imported_count
        }

knowledge_base_service = KnowledgeBaseService()
