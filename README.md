# Indian Army Recruitment Information Assistant

> **Production-Quality Verified FAQ Chatbot & Official Verification Workflow System**

The **Indian Army Recruitment Information Assistant** is a public-facing web application designed to answer recruitment-related frequently asked questions (FAQs) using a **verified knowledge base**.

The primary architectural guarantee of this application is:
> **The chatbot never invents, assumes, or hallucinates recruitment information. It answers strictly from verified knowledge-base content and explicitly refuses/escalates questions when verified information is unavailable.**

---

## 🏛️ UI Theme & Design
Designed with an authoritative **Government Portal Aesthetic**:
- **Light Theme**: Crisp white and light gray background (`#F4F6F9`) with Navy Blue (`#102A43`) primary headers.
- **Indian Tri-Color Top Accent**: Saffron (`#FF9933`), White (`#FFFFFF`), Green (`#138808`).
- **Recruitment Accents**: Military Green (`#1B5E20`) for verified badges and Gold (`#D4AF37`) for emblem highlights.
- **Prominent Disclaimer Banner**: Clearly states that this tool is an information assistant and NOT an official Indian Army portal, reminding candidates to verify details on `www.joinindianarmy.nic.in`.

---

## 🔒 Primary Trust Model

```text
OFFICIAL VERIFIED SOURCE (Notification / Gazette / Manual)
                ↓
    VERIFIED FAQ DATABASE (SQLite & Master Excel)
                ↓
    RETRIEVAL / SEMANTIC SEARCH (TF-IDF + Cosine Similarity)
                ↓
      GROUNDED LLM / STRICT TEMPLATE GENERATOR
                ↓
           USER-FACING ANSWER
```

- **LLM Role**: The LLM is NOT the source of truth. It is used strictly to format/rephrase retrieved verified facts.
- **Zero Hallucination Guarantee**: If similarity score < threshold, the system returns `UNKNOWN` and provides a **[Request Official Verification]** button.

---

## 🌟 Key Features

1. **Grounded Public Chatbot (`/`)**:
   - Suggested question chips (Eligibility, Age, Physical Run, Documents, Tattoos, Online Application).
   - Hinglish, Hindi, and paraphrased query support (e.g., *"Army recruitment ke liye age limit kya hai?"*).
   - Source Cards displaying Document Name, Section/Reference, Page Number, Verification Date, and Official Portal Links.
   - Refusal flow for unverified queries with direct escalation button.

2. **Official Verification Workflow (`/admin/requests`)**:
   - Escalated questions create pending verification requests.
   - Authorized verifiers enter official answers, document names, URLs, page references, and notes.
   - Clicking **[Approve & Add to Knowledge Base]** instantly indexes the answer into SQLite & Excel.
   - Re-querying the same question immediately returns the newly verified answer with source citations without restarting the server!

3. **FAQ Knowledge Base Manager & Excel Ingestion (`/admin/faqs`)**:
   - Master Excel sync (`data/army_recruitment_faq.xlsx`).
   - Drag-and-drop Excel batch upload with column validation and preview.
   - Real-time duplicate detection warning when adding or editing FAQs.
   - Export Master Excel button.

4. **System Audit Logs (`/admin/audit-log`)**:
   - Full immutable audit history tracking actions (`CREATE_FAQ`, `APPROVE_REQUEST`, `REJECT_REQUEST`, `IMPORT_EXCEL`, `DEACTIVATE_FAQ`), previous/new values, timestamps, and authorized users.

5. **Automated Evaluation Benchmark (`/admin/eval`)**:
   - 30+ benchmark test cases measuring Answer Accuracy, Source Accuracy (100%), Unknown Refusal Rate, Hallucination Rate (0.0%), Retrieval Accuracy, and Latency.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, FastAPI, SQLite 3, Pandas, OpenPyXL, Scikit-Learn (TF-IDF vectorizer + cosine similarity), Google GenAI SDK (optional LLM synthesis).
- **Frontend**: React 19, Vite, Lucide Icons, Vanilla CSS (Government Styling System).
- **Data Store**: SQLite (`backend/database/army_faq.db`) & Excel (`data/army_recruitment_faq.xlsx`).

---

## 🚀 Quick Start & Running Locally

### 1. Requirements
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Navigate to project root
cd "d:\southern command\project-ChatBot Query"

# Install backend dependencies
pip install fastapi uvicorn pandas openpyxl numpy scikit-learn pydantic python-multipart google-genai

# Seed initial database and Excel file
python backend/services/create_seed_data.py

# Run FastAPI backend server (Port 8005)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8005
```

### 3. Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server (Port 5173)
npm run dev -- --port 5173
```

Access the Web Application at: **`http://localhost:5173/`**

---

## 🧪 Automated Testing

Run the automated backend unit test suite:
```bash
python -m unittest backend/tests/test_backend.py
```

Run the benchmark evaluation suite via API or UI:
- Open `/admin/eval` tab in the web interface and click **"Run Evaluation Suite"**.

---

## 📊 End-to-End Demonstration Loop

1. **Step 1 (Known Question)**: Ask *"What is the age limit for Agniveer General Duty (GD)?"*. Bot answers 17.5 to 21 years with source (Page 4).
2. **Step 2 (Paraphrased Query)**: Ask *"Army recruitment ke liye age limit kya hai?"*. Bot semantically matches and returns the same verified answer.
3. **Step 3 (Unknown Query)**: Ask *"Next recruitment rally mein kitni vacancies aayengi Bihar ZRO me?"*. Bot refuses with status `UNVERIFIED / UNKNOWN`.
4. **Step 4 (Escalate Request)**: Click **[Request Official Verification]** and submit.
5. **Step 5 (Admin Review)**: Go to **Verification Queue** tab, click **Answer & Approve**.
6. **Step 6 (Add Answer)**: Enter official answer *"450 vacancies allocated for Bihar ZRO rally"* and source *"Official Bihar ZRO Recruitment Notice 2026"*.
7. **Step 7 (Approve)**: Click **Approve & Add to Knowledge Base**.
8. **Step 8 (Re-query)**: Return to Chat, ask *"Next recruitment rally mein kitni vacancies aayengi Bihar ZRO me?"* again. The bot NOW answers using the newly verified record and displays its official source card!
