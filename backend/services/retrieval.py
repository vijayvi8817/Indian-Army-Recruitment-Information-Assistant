import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "army_faq.db")

class FAQRetrievalEngine:
    def __init__(self, similarity_threshold=0.35):
        self.similarity_threshold = similarity_threshold
        self.vectorizer = None
        self.faq_list = []
        self.question_texts = []
        self.faq_mappings = [] # maps question index back to faq record
        self.tfidf_matrix = None
        self.reload_index()

    def _normalize_text(self, text: str) -> str:
        """Normalizes Hindi, Hinglish, and English text for robust matching."""
        if not text:
            return ""
        text = text.lower()
        # Common Marathi, Hindi, Hinglish, and English synonym normalizations
        synonyms = {
            # Age / Vay
            r"\b(umar|vay|vayomaryada|aayu|उम्र|वय|वयोमर्यादा|आयु)\b": "age limit requirement",
            # Eligibility / Patrata
            r"\b(patrata|yogyata|पात्रता|योग्यता)\b": "eligibility qualification criteria",
            # Education / Shikshan
            r"\b(shiksha|shikshan|padhai|shaikshanik|शिक्षा|शिक्षण|पढाई|शैक्षणिक)\b": "education qualification 10th 12th pass",
            # Physical run / Daud / Dhavne
            r"\b(daud|dor|dhavne|dhavnyachi|दौड|धावणे|धावण्याची)\b": "run physical test 1.6 km",
            # Salary / Pay / Seva Nidhi
            r"\b(paisa|salary|pagar|vetan|पैसा|पगार|वेतन)\b": "seva nidhi pay allowance salary",
            # Documents / Kagadpatre / Dastavez
            r"\b(kagaz|dokument|dastavez|kagadpatre|कागदपत्रे|दस्तावेज|प्रमाणपत्र)\b": "documents certificates rally",
            # Application / Arja / Avedan
            r"\b(kaise apply kare|arja|avedan|online apply|अर्ज|आवेदन)\b": "how to apply register online portal",
            # Physical Height / Unchi / Lambai
            r"\b(height|lambai|unchi|उंची|लंबाई)\b": "height measurement physical standard",
            # Chest / Chhati / Seena
            r"\b(chest|chhati|seena|सीना|छाती)\b": "chest expansion physical standard",
            # Tattoo
            r"\b(tattoo|tatto|टॅटू|टैटू)\b": "permanent body tattoos allowed"
        }
        for pattern, repl in synonyms.items():
            text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
        return text

    def reload_index(self):
        """Reloads all FAQs from SQLite DB and updates the TF-IDF vector index."""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM faqs WHERE status = 'VERIFIED'")
        rows = cursor.fetchall()
        conn.close()

        self.faq_list = [dict(row) for row in rows]
        self.question_texts = []
        self.faq_mappings = []

        for idx, faq in enumerate(self.faq_list):
            # Combine main question and alternative questions
            alts = faq.get("alternative_questions", "") or ""
            alt_list = [a.strip() for a in alts.split("|") if a.strip()]
            
            # Primary question text
            main_q = self._normalize_text(faq["question"])
            full_text = f"{main_q} {faq['category']} {faq['answer']}"
            self.question_texts.append(full_text)
            self.faq_mappings.append(idx)

            # Add each alternative question as a separate searchable entry
            for alt in alt_list:
                normalized_alt = self._normalize_text(alt)
                self.question_texts.append(f"{normalized_alt} {faq['category']}")
                self.faq_mappings.append(idx)

        if self.question_texts:
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 3),
                analyzer='word',
                min_df=1,
                sublinear_tf=True
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(self.question_texts)
        else:
            self.vectorizer = None
            self.tfidf_matrix = None

    def search(self, query: str, top_k: int = 3):
        """
        Searches the FAQ knowledge base for top matching FAQs.
        Returns tuple of (status, top_faq, confidence, candidate_list, conflict_detected)
        """
        if self.tfidf_matrix is None or self.vectorizer is None or not query.strip():
            return "UNKNOWN", None, 0.0, [], False

        norm_query = self._normalize_text(query)
        query_vec = self.vectorizer.transform([norm_query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Group max similarity per unique FAQ record
        faq_scores = {}
        for text_idx, score in enumerate(similarities):
            faq_idx = self.faq_mappings[text_idx]
            if faq_idx not in faq_scores or score > faq_scores[faq_idx]:
                faq_scores[faq_idx] = float(score)

        # Sort FAQs by score descending
        sorted_faqs = sorted(faq_scores.items(), key=lambda x: x[1], reverse=True)

        if not sorted_faqs:
            return "UNKNOWN", None, 0.0, [], False

        top_faq_idx, top_score = sorted_faqs[0]
        top_faq = self.faq_list[top_faq_idx]

        candidates = []
        for f_idx, score in sorted_faqs[:top_k]:
            c_faq = dict(self.faq_list[f_idx])
            c_faq["similarity_score"] = round(score, 4)
            candidates.append(c_faq)

        # Conflict check: If top two matches are extremely close (top_score >= 0.55, second_score >= 0.50 and difference <= 0.02)
        # but belong to different categories or different questions, flag conflict.
        conflict_detected = False
        if len(sorted_faqs) > 1:
            second_idx, second_score = sorted_faqs[1]
            second_faq = self.faq_list[second_idx]
            if top_score >= 0.55 and second_score >= 0.50 and (top_score - second_score) <= 0.02:
                if second_faq["category"] != top_faq["category"] and second_faq["faq_id"] != top_faq["faq_id"]:
                    conflict_detected = True

        if conflict_detected:
            return "CONFLICT", top_faq, round(top_score, 4), candidates, True

        if top_score >= self.similarity_threshold:
            return "VERIFIED", top_faq, round(top_score, 4), candidates, False

        return "UNKNOWN", top_faq, round(top_score, 4), candidates, False

# Global instance singleton
retrieval_engine = FAQRetrievalEngine()
