# Multi-Document Intelligence Workbench 🧠📄

A full-stack, enterprise-grade AI workbench designed to ingest multiple heterogeneous documents (PDF, TXT, CSV), extract their text under strict boundary isolation, and generate cross-document comparative insights with source attribution and explicit fact-versus-interpretation tagging.

---

## 🌟 Key Highlights & Core Capabilities

- **Strict Boundary Isolation**: Documents are never blindly concatenated into one unstructured blob. Each document is wrapped in an isolated contextual XML boundary with index, unique ID, filename, and character counters.
- **Source Attribution & Evidence**: Every finding identifies its source document and includes verifiable supporting quotes/evidence.
- **Fact vs. Interpretation Separation**: Clear badges distinguish extracted factual disclosures from AI-generated interpretations and trends.
- **Cross-Document Comparison Matrix**: Side-by-side tabular comparison of common operational and fiscal dimensions.
- **Discrepancy & Inconsistency Detection**: Flags conflicting metrics, period mismatches, or divergent commitments with severity ratings (low, medium, high).
- **Missing Information & Gaps**: Highlights omitted disclosures, missing audit appendices, or unstated methodologies per document.
- **Zero-Key Dynamic Fallback Engine**: If no OpenAI API key is supplied (or when quota limits are reached), an intelligent dynamic analysis engine inspects actual numerical metrics, dates, and text to generate real, source-attributed results offline.
- **SQLite Persistence**: Document metadata, extracted text, and comprehensive analysis runs are persisted in SQLite.
- **Multi-Format Support**: Native plain text parsing (`.txt`, `.md`), structured relational CSV parsing (`.csv`), and binary PDF extraction (`.pdf` via `pdf-parse`).
- **One-Click Synthetic Dataset**: Preloaded with 3 synthetic cross-referenced documents (Q1 financial report, Q2 financial report with churn and margin discrepancies, and Q3 consolidated metrics CSV) plus a vendor SLA agreement PDF.

---

## 🏗️ Architecture Overview

The application follows a clean layered architecture with complete separation of concerns between ingestion/parsing, persistence, LLM orchestration, and user presentation:

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript + Vite                   │
│  (Dashboard, File Drop, Multi-Select, Comparison Matrix,    │
│   Fact/Interpretation Chips, History Drawer, Markdown Copy) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (Proxy /api)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Node.js + Express Backend                  │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │    Document Parser    │       │     AI Service        │  │
│  │ (PDF, TXT, CSV table) │       │ (Boundary Isolation,  │  │
│  └──────────┬────────────┘       │  OpenAI / Mock Fall)  │  │
│             │                    └───────────┬───────────┘  │
│             ▼                                ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          SQLite Database (Documents & Analyses)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Module Responsibilities:
1. **Frontend (`frontend/`)**: React 18 with Vite, TypeScript, and Tailwind CSS. Provides a clean, modern interface with drag-and-drop ingestion, token count indicators, live filters for facts vs. interpretations, comparison tables, and Markdown/JSON export.
2. **Backend Server (`backend/src/app.ts`, `backend/src/server.ts`)**: Express server with validation, error middleware, and CORS configuration.
3. **Document Parser (`backend/src/services/documentParser.ts`)**:
   - PDF: Stream parsing via `pdf-parse`.
   - Plain Text: UTF-8 normalization and token estimation.
   - CSV: Relational tabular transformer formatting rows into markdown alignment for LLM context retention.
4. **AI Service (`backend/src/services/aiService.ts`)**:
   - `buildIsolatedDocumentContext`: Encapsulates documents into structured XML boundaries.
   - OpenAI Integration: Strict JSON schema enforcement with `response_format: { type: "json_object" }`.
   - Dynamic Fallback: Heuristic extractor identifying factual metrics, cross-document discrepancies, and source evidence when API keys are absent.
5. **Persistence (`backend/src/db/database.ts`)**: SQLite schema storing document corpus and timestamped historical analyses.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (tested on Node v24)
- **npm**: v9 or higher

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd Ass

# Install dependencies for both backend and frontend
npm run install:all
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` or `backend/.env`:
```bash
cp .env.example backend/.env
```
Contents of `.env`:
```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here # Optional: Leave blank to use Dynamic Mock Mode
OPENAI_MODEL=gpt-4o-mini
```
*Note: If `OPENAI_API_KEY` is not provided, the application runs in **Dynamic Mock Fallback Mode** with 100% functionality.*

### 3. Start Development Servers
Run both frontend and backend concurrently from the root:
```bash
npm run dev
```
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 🧪 Automated Testing

The backend includes automated tests covering document parsing across formats (TXT, CSV, PDF), token estimation, document boundary isolation, and dynamic multi-document analysis output.

Run the test suite:
```bash
npm test
```
Or directly in the backend directory:
```bash
cd backend
npm test
```

---

## 📁 Sample Documents Included

Located in the `samples/` directory:
1. `Q1_Acme_Financial_Report.txt`: Q1 2024 earnings report detailing $12.4M revenue, 74.2% gross margin, $820K net income, and 1.8% customer churn.
2. `Q2_Acme_Financial_Report.txt`: Q2 2024 earnings report detailing $14.1M revenue, compressed gross margin (71.5%), operating loss (-$410K), and churn spike (3.2%) contradicting Q1 guidance.
3. `Q3_Acme_Financial_Metrics.csv`: Tabular departmental budget vs. actual expenditure matrix for engineering, sales, customer support, and G&A.
4. `Vendor_SLA_Agreement.pdf`: Adobe-compliant SLA agreement with 99.95% uptime guarantees, penalty credit tiers, and a $1,000,000 liability ceiling.

*In the web UI, simply click **"Load Synthetic Samples"** in the top-right of the Document Ingestion card to populate and test immediately.*

---

## 🔒 Security Considerations

1. **File Upload Hardening**:
   - Strict MIME type and extension whitelisting (`.pdf`, `.txt`, `.csv`, `.md`).
   - Memory storage prevents temp file clutter and path traversal vulnerabilities.
   - Enforced 15 MB payload limit per document.
2. **XML Escaping in Boundary Construction**:
   - Extracted document text is escaped before enclosure inside XML delimiter tags (`<document ...>`) to prevent prompt injection and boundary breakout attacks.
3. **Structured Output Enforcement**:
   - OpenAI completions utilize JSON schema validation to prevent unformatted or arbitrary code execution outputs.
4. **Environment Isolation**:
   - API keys are scoped to backend environment variables and never exposed to the client bundle.

---

## ⚙️ Assumptions & Trade-Offs

- **Token Approximation**: Uses the standard 4 characters per token heuristic for fast frontend estimation without loading heavy WebAssembly tokenizer dictionaries on the client.
- **CSV Truncation Threshold**: CSV files up to 250 rows are rendered into high-fidelity markdown tables. Larger datasets are truncated with an explicit warning note for LLM context preservation.
- **In-Memory Uploads vs. Object Storage**: In an MVP setting, memory buffers with SQLite text storage were preferred over S3/blob stores to ensure zero external cloud setup requirements.

---

## 🚀 Production Improvements Roadmap

For enterprise-scale production deployment, the following upgrades are recommended:
1. **Vector Embeddings & RAG**: Implement chunked vector indexing (e.g. pgvector or Pinecone) with hybrid search (BM25 + cosine similarity) for documents exceeding 100+ pages.
2. **OCR for Scanned PDFs**: Integrate Tesseract OCR or Google Cloud Document AI for scanned image PDFs.
3. **Streaming Responses**: Enable Server-Sent Events (SSE) or WebSockets to stream partial analysis blocks to the user interface in real time.
4. **Role-Based Access Control (RBAC)**: Multi-tenant workspace isolation with OAuth2 / SSO authentication.
5. **Background Job Queues**: Offload heavy document parsing jobs to Redis/BullMQ workers with webhook notifications.

---

## 🎙️ Technical Interview Discussion Guide

When explaining this application in your technical interview:

1. **How Document Boundaries are Preserved**:
   > *"Many naive multi-document implementations simply concatenate all document strings into one prompt, leading the model to hallucinate or cross-contaminate facts across documents. In our architecture, the `aiService` formats every document into an isolated XML block with explicit metadata attributes (`id`, `name`, `char_count`). The system prompt instructs the model to respect document frontiers and explicitly tag findings to their specific `sourceDocument`."*

2. **How Fact vs. Interpretation is Separated**:
   > *"We enforce a strict JSON output schema that categorizes findings into `fact` or `interpretation`. A fact requires verbatim or direct numerical evidence from the source text, while an interpretation captures analytical inferences, trend projections, and risk implications."*

3. **Resilience & Fallback Strategy**:
   > *"The platform is completely self-sufficient. If an OpenAI API key is unavailable or hits a rate limit, the backend automatically transitions to an Intelligent Mock Fallback Engine that dynamically parses numbers, dates, and topics from the actual uploaded files to generate genuine comparisons and discrepancies rather than a static canned response."*

4. **Relational Representation of CSV**:
   > *"Raw CSV strings often confuse LLMs with commas and commas inside quotes. Our parser normalizes CSV rows into structured markdown tables with clear column headers and row summaries, allowing the LLM to perform accurate cross-column comparisons."*
