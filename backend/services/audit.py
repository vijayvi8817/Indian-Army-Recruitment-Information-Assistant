import sqlite3
from typing import Dict, Any, List, Optional
from backend.services.retrieval import DB_PATH

class AuditService:
    def get_logs(self, limit: int = 100, action_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []

        if action_filter and action_filter.upper() != "ALL":
            query += " AND action = ?"
            params.append(action_filter.upper())

        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

audit_service = AuditService()
