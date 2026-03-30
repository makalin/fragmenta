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

* [ ] Semantic search (optional embeddings)
* [ ] Memory decay strategies
* [ ] Multi-agent shared memory
* [ ] Velo-Lite backend
* [ ] Visualization UI
* [ ] CLI tool

---

## 🔒 Philosophy

* Local-first
* Transparent > magical
* Deterministic > probabilistic
* Simple > complex

---

## 📄 License

MIT
