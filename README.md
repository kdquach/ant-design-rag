# Ant Design Docs Reference — RAG Assistant

A Retrieval-Augmented Generation (RAG) assistant that answers questions about Ant Design components, grounded entirely in the official documentation, with inline source citations for every answer.

**Live demo:** https://ant-design-rag.netlify.app
**Repository:** https://github.com/kdquach/ant-design-rag

> Note: the backend runs on a free-tier host and may sleep after inactivity — the first request after idle time can take 30–50 seconds to respond.

## Why RAG instead of a plain LLM chatbot

A general-purpose LLM either doesn't know about a specific, narrow documentation set, or has to be fed the entire document on every request — expensive and still prone to hallucination. This project narrows the domain to a single, well-understood source (Ant Design's component docs), indexes it once, and retrieves only the relevant passages per query — keeping token cost constant regardless of document size and letting every answer cite exactly which docs it drew from.

## Architecture

- **Ingestion**: clone Ant Design's docs → chunk by component/section (not fixed character length) → embed each chunk locally with `all-MiniLM-L6-v2` via `@xenova/transformers` (no API cost) → store in PostgreSQL (Neon) with the `pgvector` extension
- **Retrieval**: embed the incoming question, run an exact cosine-similarity search (see note on indexing below) to fetch the top-5 relevant chunks
- **Generation**: inject the retrieved chunks into a prompt sent to Gemini 3.6 Flash, instructed to answer only from the provided context and explicitly decline when the answer isn't present
- **Frontend**: React + Vite, styled as a documentation-reference reading experience rather than a chat-bubble UI — IBM Plex Sans/Mono for interface chrome, Source Serif 4 for answer prose

## Evaluation results

**Retrieval accuracy: 91.7%** (22/24) on a hand-written test set spanning Table, Form, Modal, Button, Select, DatePicker, Upload, Drawer, Tooltip, Notification, Card, Steps, Pagination, Cascader, and others — measured as whether the expected component appears in the top-5 retrieved chunks.

The 2 misses both involved theming/dark-mode questions, where the phrasing gap between how users ask ("dark mode", "custom colors") and how the docs are written (design tokens, algorithms) reduced embedding similarity — a known limitation of pure semantic search, not a system bug.

**Hallucination guard: 3/3.** Tested with questions about features that don't exist in Ant Design (direct Excel export from Table, click-confetti animation on Button, built-in payment integration). The system correctly declined all three instead of fabricating an answer.

## A debugging note worth reading

Early retrieval accuracy measurements were inconsistent (40% → 20% across runs) with no changes to the underlying data. Adding row-count logging around each query revealed that identical `LIMIT 5` queries were returning anywhere from 0 to 5 rows — with only 423 rows in the table, that should never happen with an exact search.

The cause: the `ivfflat` index on the embedding column is an **approximate** nearest-neighbor index — it partitions the table into clusters and by default searches only the single nearest one. On a dataset this small, the clustering was poorly balanced, so many queries landed in a near-empty cluster.

**Fix:** dropped the index entirely. At 423 rows, a sequential scan with exact distance calculation is both faster and 100% accurate — approximate indexes only pay off at a scale (tens of thousands of rows+) where the accuracy/speed trade-off actually matters. Lesson: understanding *when* an optimization applies matters more than applying it by default.

## Tech stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL + pgvector (Neon, serverless)
- **Embeddings**: `all-MiniLM-L6-v2` via `@xenova/transformers` (local, free)
- **LLM**: Gemini 3.6 Flash
- **Frontend**: React, Vite, TypeScript
- **Deployment**: Render (backend), Netlify (frontend)

## Running locally

```bash
git clone https://github.com/kdquach/ant-design-rag
cd ant-design-rag

# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and GEMINI_API_KEY
npx tsx src/ingestion/embed-and-seed.ts   # one-time data load
npx tsx src/index.ts

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev

# Evaluation (optional)
cd ../backend
npx tsx ../eval/run-eval.ts
```
