# Team Sheep AI

A fitness assistant chatbot with **Retrieval-Augmented Generation (RAG)**. Upload your own workout plans, training programs, or nutrition guides and the assistant will ground its answers in your documents — citing the source inline.

Built with **Next.js 16**, **LangChain**, **PostgreSQL + pgvector**, and the **Vercel AI SDK**.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [RAG Pipeline](#rag-pipeline)
- [Prompts System](#prompts-system)
- [UI Components](#ui-components)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Tech Stack](#tech-stack)

---

## Features

- **Streaming chat** powered by any [OpenRouter](https://openrouter.ai) model (defaults to Llama 3.3 70B Instruct free tier)
- **RAG pipeline** — PDF, TXT, and Markdown files are chunked, embedded locally with a HuggingFace model, and stored in PostgreSQL with pgvector
- **Source citations** — each assistant reply shows which uploaded documents were used as source badges
- **Multi-turn retrieval** — the last three user turns are combined into the retrieval query so follow-up questions still find the right context
- **Knowledge base management** — upload and delete documents via a dedicated UI page
- **Drag-and-drop upload** with real-time progress tracking (upload phase + embedding phase)
- **Markdown rendering** — assistant replies render full markdown: lists, code blocks, tables, blockquotes
- **Local embeddings** — no external embedding API needed; `Xenova/all-MiniLM-L6-v2` runs in-process via `@huggingface/transformers`
- **Graceful degradation** — if the database is unavailable, chat still works using the model's general knowledge

---

## Architecture

```
User message
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/chat                                                 │
│                                                                 │
│  1. Build retrieval query from last 3 user turns                │
│  2. retrieveRelevantChunks()  ◄── pgvector HNSW cosine search   │
│     top-5 chunks, min similarity score 0.3                      │
│  3. buildSystemPrompt()  ◄── injects context into template      │
│  4. streamText() via OpenRouter (Llama 3.3 70B or custom model) │
│  5. Write source-document stream parts (Vercel AI SDK v6)       │
│     + merge text delta stream                                   │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼ (UIMessage stream to client)
┌─────────────────────────────────────────────────────────────────┐
│  Client                                                         │
│  - Source badges rendered from source-document parts            │
│  - Markdown response rendered via react-markdown + remark-gfm   │
│  - Typing indicator during streaming                            │
└─────────────────────────────────────────────────────────────────┘
```

### Ingestion flow

```
File upload (PDF / TXT / MD)
    │
    ▼
PDFLoader (LangChain) or plain-text parser
    │
    ▼
RecursiveCharacterTextSplitter
  chunk size: 1000 chars  |  overlap: 200 chars
    │
    ├──► Insert metadata row into `documents` (Drizzle)
    │
    ▼
Xenova/all-MiniLM-L6-v2  ◄── runs locally, no API key
  384-dimensional float32 vectors
    │
    ▼
PGVectorStore → `langchain_chunks` table (PostgreSQL)
  HNSW index on embedding column (cosine distance)
    │
    └── on failure: rollback `documents` row (no orphaned records)
```

---

## Project Structure

```
team-sheep-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # Streaming chat endpoint
│   │   │   └── knowledge/
│   │   │       ├── upload/route.ts   # Multipart file upload + ingest
│   │   │       ├── list/route.ts     # List documents
│   │   │       └── delete/route.ts   # Delete document + chunks
│   │   ├── knowledge/
│   │   │   └── page.tsx              # Knowledge management page (server component)
│   │   ├── layout.tsx                # Root layout (sidebar nav, fonts)
│   │   ├── page.tsx                  # Chat page
│   │   └── globals.css               # Tailwind v4 + CSS variables (oklch theme)
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx     # Main chat container (useChat hook)
│   │   │   ├── MessageList.tsx       # Message renderer (markdown + source badges)
│   │   │   └── ChatInput.tsx         # Textarea input with send/stop controls
│   │   ├── knowledge/
│   │   │   ├── DocumentUpload.tsx    # Drag-and-drop uploader with progress
│   │   │   └── DocumentList.tsx      # Document table with delete buttons
│   │   └── ui/                       # shadcn-based primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       └── separator.tsx
│   └── lib/
│       ├── ai/
│       │   ├── client.ts             # OpenRouter provider configuration
│       │   └── prompts.ts            # System prompt builder (template + JSON config)
│       ├── db/
│       │   ├── index.ts              # pg.Pool + Drizzle singleton
│       │   ├── schema.ts             # Drizzle schema (documents table)
│       │   └── migrate.ts            # Migration runner (pgvector ext + Drizzle)
│       ├── rag/
│       │   ├── embeddings.ts         # HuggingFace Transformers singleton
│       │   ├── vectorStore.ts        # PGVectorStore (lazy init, retry on failure)
│       │   ├── ingest.ts             # Ingestion pipeline (load → split → embed → store)
│       │   └── retrieval.ts          # Similarity search + context formatter
│       └── utils.ts                  # cn() helper (clsx + tailwind-merge)
├── prompts/
│   ├── answerPrompt.json             # Prompt configuration (role, instructions, tone)
│   └── template.txt                  # System prompt template with {placeholders}
├── drizzle/
│   └── 0000_stiff_electro.sql        # Initial migration (documents table, HNSW index)
├── docker-compose.yml                # PostgreSQL + pgvector service
├── drizzle.config.ts                 # Drizzle Kit configuration
├── next.config.ts                    # Next.js config (serverExternalPackages)
└── .env.local.example                # Environment variable template
```

---

## Database Schema

### `documents` table _(managed by Drizzle)_

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `name` | `text` | Original filename |
| `file_type` | `text` | MIME type (e.g. `application/pdf`) |
| `size_bytes` | `integer` | File size in bytes |
| `created_at` | `timestamp` | Upload time, defaults to `now()` |

### `langchain_chunks` table _(managed by LangChain's PGVectorStore)_

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `content` | `text` | Chunk text |
| `embedding` | `vector(384)` | 384-dimensional float32 embedding |
| `metadata` | `jsonb` | `{ documentId, documentName, chunkIndex }` |
| `created_at` | `timestamp` | Auto-set on insert |

An **HNSW index** is created on the `embedding` column using cosine distance for fast approximate nearest-neighbour search.

---

## API Reference

### `POST /api/chat`

Streams a chat response with source citations.

**Request body:**
```json
{
  "messages": [
    { "id": "1", "role": "user", "parts": [{ "type": "text", "text": "What are the best recovery exercises?" }] }
  ]
}
```

**Response:** A `UIMessageStream` (Vercel AI SDK v6) that emits:
1. `source-document` parts — one per unique source document referenced
2. Text delta parts — streamed assistant response

**Error handling:**
- Rate-limited → `429` with friendly message
- Timeout → `408` with friendly message
- Context too long → `413` with friendly message
- DB unavailable → chat continues with general model knowledge (graceful degradation)

**Max duration:** 60 seconds

---

### `POST /api/knowledge/upload`

Uploads and ingests a document into the knowledge base.

**Request:** `multipart/form-data` with a `file` field.

**Constraints:**
- Accepted types: `application/pdf`, `text/plain`, `text/markdown`
- Max size: **10 MB**

**Response:**
```json
{
  "success": true,
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "chunkCount": 42
}
```

---

### `GET /api/knowledge/list`

Returns all documents in the knowledge base, newest first.

**Response:**
```json
{
  "documents": [
    {
      "id": "550e8400-...",
      "name": "stronglifts-5x5.pdf",
      "fileType": "application/pdf",
      "sizeBytes": 204800,
      "createdAt": "2026-03-13T10:00:00.000Z"
    }
  ]
}
```

---

### `DELETE /api/knowledge/delete`

Deletes a document and all its associated vector chunks.

**Request body:**
```json
{ "id": "550e8400-e29b-41d4-a716-446655440000" }
```

**Response:**
```json
{ "success": true }
```

Chunks are deleted via a raw SQL `DELETE ... WHERE metadata->>'documentId' = $1` query against `langchain_chunks`, then the `documents` row is removed.

---

## RAG Pipeline

### Ingestion (`POST /api/knowledge/upload`)

1. **Load** — PDFLoader (LangChain + pdf-parse) for `.pdf` files; plain `Buffer.toString('utf-8')` for `.txt` / `.md` files
2. **Split** — `RecursiveCharacterTextSplitter` with **1000-char chunk size** and **200-char overlap**; each chunk carries `{ documentId, documentName, chunkIndex }` metadata
3. **Persist metadata** — A row is inserted into the `documents` table via Drizzle before embedding starts
4. **Embed** — `Xenova/all-MiniLM-L6-v2` (384 dimensions) runs locally via `@huggingface/transformers`; no external API call required
5. **Store vectors** — `PGVectorStore.addDocuments()` writes chunks + embeddings to `langchain_chunks`
6. **Rollback on failure** — if step 4–5 fails, the `documents` row inserted in step 3 is deleted to keep state consistent

### Retrieval (`POST /api/chat`)

1. **Build query** — Concatenates the content of the last three user messages to preserve conversational context for follow-up questions
2. **Similarity search** — `PGVectorStore.similaritySearchWithScore()` runs an HNSW cosine-similarity search against all stored vectors
3. **Filter** — Only chunks with similarity score ≥ **0.3** are kept; top **5** chunks are returned
4. **Format context** — Chunks are formatted as numbered excerpts with source attribution and injected into the system prompt under `<context>…</context>`
5. **Source deduplication** — Unique document names are extracted and written as `source-document` stream parts before text streaming begins, so the client can render source badges immediately

---

## Prompts System

The system prompt is built from two files in the `prompts/` directory:

### `prompts/answerPrompt.json`

Defines the assistant's persona and behaviour:

```json
{
  "metadata": { "app": "Team Sheep AI", "version": "1.0", "category": "fitness" },
  "role": "Expert fitness assistant specialising in workouts, training programs, and nutrition",
  "task": "Answer questions about fitness, workouts, training, and nutrition",
  "instructions": [
    "Answer exclusively about fitness topics",
    "Politely redirect non-fitness questions",
    "Prioritise context from uploaded documents over general knowledge",
    "Cite document sources when using uploaded context",
    "Use structured format (bullets, numbered lists) for workout plans",
    "Include sets/reps for workouts and portions for nutrition advice",
    "Be encouraging and ground answers in exercise science"
  ],
  "constraints": {
    "language": "Match the user's language, default to English",
    "tone": "encouraging and professional",
    "format": "Clear text with structured formatting"
  }
}
```

### `prompts/template.txt`

The string template that `src/lib/ai/prompts.ts` populates at request time:

```
You are {role}.

**Task:** {task}

**Tone and format:** {tone}. Use {format}.

**Instructions:**
{instructions}

**Knowledge base context (from uploaded documents):**
<context>
{context}
</context>

Answer using context when relevant. If context is not relevant, answer from general fitness knowledge.
```

If no relevant chunks are retrieved, `{context}` is replaced with `(No relevant excerpts from uploaded documents.)` and the model falls back to its general fitness knowledge.

---

## UI Components

### Chat page (`/`)

| Component | Description |
|-----------|-------------|
| `ChatInterface` | Owns the `useChat()` state; handles auto-scroll and streaming status |
| `MessageList` | Renders user and assistant turns; parses `source-document` parts into badges; shows typing indicator (three bouncing dots) while streaming |
| `ChatInput` | Textarea with Enter-to-send (Shift+Enter for newline); shows a Stop button while streaming; includes an AI disclaimer |

**Markdown support in assistant messages:** headings, bold/italic, unordered/ordered lists, inline code, fenced code blocks, tables, and blockquotes — all styled with Tailwind.

### Knowledge page (`/knowledge`)

| Component | Description |
|-----------|-------------|
| `DocumentUpload` | Drag-and-drop zone + click-to-browse; uses `XMLHttpRequest` for upload progress tracking; two-phase progress bar (uploading → processing/embedding) |
| `DocumentList` | Table of uploaded documents showing name, type badge, size, upload date, and a delete button |

The knowledge page is a **server component** that queries the database directly and passes document data to the client components as props. If the database is unavailable it returns an empty list instead of erroring.

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **Docker** (for PostgreSQL + pgvector)
- An **[OpenRouter](https://openrouter.ai) API key**

### 1. Clone and install

```bash
git clone <repo-url>
cd team-sheep-ai
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/team_sheep_ai

# Optional — defaults shown
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

### 3. Start the database

```bash
docker compose up -d
```

This starts a `pgvector/pgvector:pg17` container on port 5432 with a persistent `pgdata` volume.

### 4. Run migrations

```bash
npm run db:migrate
```

Creates the `pgvector` extension, the `documents` table, and the HNSW index. The `langchain_chunks` table is created automatically by `PGVectorStore` on first use.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Go to **Knowledge** → upload a PDF or text document (workout plan, nutrition guide, etc.)
2. Return to **Chat** and ask a question — the assistant will answer using your documents and cite them inline

---

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | API key from [openrouter.ai](https://openrouter.ai) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `OPENROUTER_MODEL` | No | `meta-llama/llama-3.3-70b-instruct:free` | Any model available on OpenRouter |
| `EMBEDDING_MODEL` | No | `Xenova/all-MiniLM-L6-v2` | Any ONNX-compatible HuggingFace sentence-transformer |

### Changing the LLM

Set `OPENROUTER_MODEL` to any model slug from the [OpenRouter models list](https://openrouter.ai/models). Examples:

```env
OPENROUTER_MODEL=openai/gpt-4o
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_MODEL=google/gemini-flash-1.5
```

### Changing the embedding model

The embedding model must be compatible with `@huggingface/transformers` (ONNX format). It must output vectors of a consistent dimension — if you change the model after documents have already been ingested you will need to re-upload them because the vector dimensions will not match.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate a new Drizzle migration from schema changes |
| `npm run db:migrate` | Apply all pending migrations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 (strict mode) |
| AI streaming | [Vercel AI SDK 6](https://sdk.vercel.ai) (`@ai-sdk/react`, `ai`) |
| LLM provider | [OpenRouter](https://openrouter.ai) via `@openrouter/ai-sdk-provider` |
| Embeddings | [`@huggingface/transformers`](https://huggingface.co/docs/transformers.js) — runs locally, no API key |
| RAG framework | [LangChain](https://js.langchain.com) (`langchain`, `@langchain/community`, `@langchain/core`) |
| Database | PostgreSQL 17 + [pgvector](https://github.com/pgvector/pgvector) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) + Drizzle Kit |
| UI primitives | [shadcn/ui](https://ui.shadcn.com) (Radix-based) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + oklch color system |
| Markdown | `react-markdown` + `remark-gfm` |
| Icons | [Lucide React](https://lucide.dev) |
| PDF parsing | `pdf-parse` (via LangChain PDFLoader) |
| Containerisation | Docker Compose (`pgvector/pgvector:pg17`) |
