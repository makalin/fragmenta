# 🧩 Fragmenta

**Fragmenta** is a lightweight, MCP-native memory engine for AI systems.

It stores, scores, and retrieves contextual **fragments** (facts, preferences, interactions) across sessions—giving LLMs persistent, structured memory without black-box complexity.

---

## 🚀 Why Fragmenta?

LLMs forget everything between requests.

Fragmenta adds:

* persistent memory
* deterministic ranking
* transparent storage
* local-first control

---

## ✨ Features

* 🧩 **Fragment-Based Memory**

  * Store atomic knowledge units

* ⚖️ **Deterministic Ranking**

  * Based on:

    * recency
    * frequency
    * importance
    * decay

* 🔍 **Context Retrieval**

  * Query top relevant fragments instantly

* 🔌 **MCP-Native**

  * Works with Claude, Cursor, custom agents

* 💾 **Pluggable Storage**

  * JSONL (default)
  * SQLite

* 🔎 **Inspectable**

  * No hidden embeddings required

---

## 🏗️ Architecture

User Input
→ Fragment Extractor
→ Memory Store ↔ Scoring Engine
→ Retrieval Engine
→ LLM Context Injection

---

## 📦 Installation

```bash
git clone https://github.com/makalin/fragmenta.git
cd fragmenta
npm install
```

---

## ⚡ Quick Start

```bash
npm run dev
```

### ➕ Store Memory

```bash
POST /memory

{
  "content": "User prefers minimal UI",
  "tags": ["preference", "ui"],
  "importance": 0.9
}
```

---

### 🔎 Query Memory

```bash
POST /query

{
  "query": "UI preference",
  "limit": 5
}
```

---

### 📚 List Memory

```bash
GET /memory?tag=ui&search=minimal&limit=10
```

---

### 🧾 Memory Stats

```bash
GET /memory/stats
```

---

## 🧠 Fragment Schema

```json
{
  "id": "uuid",
  "content": "User prefers minimal UI",
  "tags": ["preference"],
  "created_at": 1710000000,
  "last_accessed": 1710001000,
  "access_count": 3,
  "importance": 0.9
}
```

---

## ⚙️ Scoring Model

```
score =
  (importance * 0.4) +
  (recency * 0.3) +
  (frequency * 0.2) -
  (decay * 0.1)
```

Fully deterministic and tunable.

---

## 🔌 MCP Integration

```json
{
  "mcpServers": {
    "fragmenta": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
```

---

## 🛠️ Current Tools

### HTTP API

* `POST /memory` - store a fragment
* `POST /query` - retrieve ranked fragments
* `GET /memory` - list fragments with filters
* `GET /memory/:id` - fetch one fragment
* `DELETE /memory/:id` - delete one fragment
* `GET /memory/stats` - aggregate memory statistics
* `GET /health` - health check

### MCP Tools

* `store_memory`
* `query_memory`
* `list_memories`
* `get_memory`
* `delete_memory`
* `memory_stats`

---

## 📁 Project Structure

```
fragmenta/
├── src/
│   ├── server/
│   │   ├── mcp.ts
│   │   ├── api.ts
│   │   └── routes/
│   │
│   ├── memory/
│   │   ├── fragment.ts
│   │   ├── store.ts
│   │   └── schema.ts
│   │
│   ├── scoring/
│   │   ├── score.ts
│   │   ├── decay.ts
│   │   └── rank.ts
│   │
│   ├── retrieval/
│   │   ├── query.ts
│   │   └── filter.ts
│   │
│   ├── storage/
│   │   ├── jsonl.ts
│   │   ├── sqlite.ts
│   │   └── adapter.ts
│   │
│   ├── utils/
│   │   ├── time.ts
│   │   └── logger.ts
│   │
│   └── index.ts
│
├── data/
│   └── memory.jsonl
│
├── config/
│   └── default.json
│
├── tests/
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧩 Roadmap

### Primary Backend Direction

* [ ] Velo-Lite backend as the scalable production backend
* [ ] Velo-Lite backend with multi-agent shared memory
* [ ] Velo-Lite namespaces for agent, team, and tenant isolation
* [ ] Velo-Lite shared channels for cross-agent context exchange
* [ ] Velo-Lite write conflict resolution and optimistic concurrency
* [ ] Velo-Lite replication, backup, and recovery workflows

### Next Tools And Functions

* [ ] `update_memory` tool and `PATCH /memory/:id`
* [ ] `bulk_store_memories` for batched ingestion
* [ ] `bulk_delete_memories` for cleanup jobs
* [ ] `search_by_tags` shortcut tool
* [ ] `export_memories` to JSON/JSONL
* [ ] `import_memories` from JSON/JSONL
* [ ] `pin_memory` or protected fragments
* [ ] `archive_memory` and soft-delete support
* [ ] `memory_timeline` for chronological inspection
* [ ] `memory_explain` to show score breakdown per fragment

### Retrieval Improvements

* [ ] Semantic search (optional embeddings)
* [ ] Hybrid lexical + semantic ranking
* [ ] Better exact-match and phrase-match scoring
* [ ] Per-tag weighting and query boosting
* [ ] Configurable decay strategies
* [ ] Deduplication and fragment merging

### Storage And Reliability

* [ ] Default SQLite mode for safer concurrent writes
* [ ] Storage migrations and schema versioning
* [ ] Snapshot and backup support
* [ ] File locking for JSONL mode
* [ ] Background compaction and repair tools

### Security And Operations

* [ ] API auth token support
* [ ] Rate limiting
* [ ] Request audit logging
* [ ] CORS and host allowlist controls
* [ ] Configurable request size limits
* [ ] Safer production defaults

### Developer Experience

* [ ] CLI tool
* [ ] Visualization UI
* [ ] OpenAPI spec for the HTTP API
* [ ] More integration and concurrency tests
* [ ] Docker image and compose setup
* [ ] Benchmark suite

### Multi-Agent Memory

* [ ] Multi-agent shared memory
* [ ] Agent namespaces and tenant isolation
* [ ] Shared memory rooms or channels
* [ ] Agent attribution on fragments
* [ ] Conflict resolution for concurrent writes
* [ ] Cross-agent memory permissions

---

## 🔒 Philosophy

* Local-first
* Transparent > magical
* Deterministic > probabilistic
* Simple > complex

---

## 📄 License

MIT
