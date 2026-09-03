import os
import re
import sqlite3
from typing import Dict, Any, List, Optional
from backend.services.retrieval import retrieval_engine, DB_PATH
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

SYSTEM_PROMPT = """You are a recruitment information assistant for Indian Army Recruitment.
You may answer ONLY using the verified context supplied to you.
Do not use your general knowledge to fill missing information.
Do not infer eligibility, dates, vacancies, age limits, physical standards, fees, selection rules, or other recruitment facts unless explicitly supported by the retrieved verified source.
If the supplied context does not contain enough information to answer the user's question, say that verified information is unavailable and recommend official verification.
Never fabricate citations.
Never invent a source URL, notification number, date, page number, eligibility criterion, or recruitment rule.
Clearly distinguish verified information from uncertainty.
The Indian Army's official recruitment notification/source is the authoritative reference.
Always add a note reminding the candidate to verify with official notifications on www.joinindianarmy.nic.in."""

ADVERSARIAL_PATTERNS = [
    r"ignore (your|all) instructions",
    r"forget (your|all) rules",
    r"you are an army officer",
    r"pretend you",
    r"just guess",
    r"predict the next",
    r"make up an answer",
    r"bypass safety",
    r"jailbreak"
]

class ChatbotService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: Failed to initialize GenAI client: {e}")

    def _is_adversarial(self, query: str) -> bool:
        norm = query.lower()
        for pattern in ADVERSARIAL_PATTERNS:
            if re.search(pattern, norm):
                return True
        return False

    def process_query(self, user_query: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Process a user query end-to-end adhering strictly to ground-truth verified information.
        """
        user_query_clean = user_query.strip()
        if not user_query_clean:
            return {
                "status": "ERROR",
                "answer": "Please enter a valid recruitment question.",
                "can_request_verification": False
            }

        # Step 1: Check for adversarial manipulation
        if self._is_adversarial(user_query_clean):
            return {
                "status": "UNKNOWN",
                "answer": "I am programmed strictly to answer recruitment queries using verified official sources. I cannot ignore safety rules, guess unverified details, or act outside my verified knowledge base.",
                "can_request_verification": True,
                "reason": "Adversarial or out-of-scope prompt detected."
            }

        # Step 2: Semantic retrieval from knowledge base
        status, top_faq, confidence, candidates, conflict = retrieval_engine.search(user_query_clean)

        # Handle Conflict
        if status == "CONFLICT" or conflict:
            return {
                "status": "CONFLICT",
                "answer": "There are conflicting records in the current knowledge base regarding this topic. The information requires official verification before I can provide a reliable answer.",
                "requires_review": True,
                "can_request_verification": True,
                "top_candidate": top_faq["question"] if top_faq else "",
                "category": top_faq["category"] if top_faq else "General",
                "retrieved_context": f"Conflict between candidates: {[c['question'] for c in candidates[:2]]}"
            }

        # Handle Unknown / Below Threshold
        if status == "UNKNOWN" or not top_faq or confidence < retrieval_engine.similarity_threshold:
            return {
                "status": "UNKNOWN",
                "answer": "I don't have verified information for this question in my current knowledge base. I don't want to provide an unverified or inaccurate answer.",
                "can_request_verification": True,
                "user_question": user_query_clean,
                "category": top_faq["category"] if top_faq else "General Recruitment Queries",
                "retrieved_context": f"Top candidate similarity score: {confidence} (threshold: {retrieval_engine.similarity_threshold})",
                "reason_for_escalation": f"Low similarity score ({confidence}) below threshold ({retrieval_engine.similarity_threshold})"
            }

        # Step 3: Verified Answer Generation
        # Formulate grounded answer using LLM (if configured) or exact verified record fallback
        verified_answer_text = top_faq["answer"]
        source_name = top_faq["source_name"]
        source_url = top_faq["source_url"]
        source_ref = top_faq["source_reference"]
        page_num = top_faq["page_number"]
        verified_date = top_faq["verified_date"]
        is_demo = top_faq.get("is_demo", 1)

        final_answer = verified_answer_text

        # If LLM API client available, synthesize response grounded ONLY on top_faq
        if self.client:
            try:
                prompt_content = f"""Context:
FAQ Question: {top_faq['question']}
Verified Answer: {top_faq['answer']}
Category: {top_faq['category']}
Source: {top_faq['source_name']}

User Question: {user_query_clean}

Formulate a concise, helpful response using ONLY the provided Verified Answer text above. Do not add external facts."""

                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt_content,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.0
                    )
                )
                if response and response.text:
                    final_answer = response.text.strip()
            except Exception as e:
                print(f"LLM call fallback to direct verified text due to: {e}")
                final_answer = verified_answer_text

        return {
            "status": "VERIFIED",
            "answer": final_answer,
            "faq_id": top_faq["faq_id"],
            "question": top_faq["question"],
            "category": top_faq["category"],
            "source": source_name,
            "source_url": source_url,
            "reference": source_ref,
            "page_number": page_num,
            "verified_date": verified_date,
            "is_demo": bool(is_demo),
            "confidence": confidence
        }

chatbot_service = ChatbotService()
