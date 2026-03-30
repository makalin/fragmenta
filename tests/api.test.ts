import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createStorageAdapter } from "../src/storage/adapter.ts";
import { MemoryStore } from "../src/memory/store.ts";
import { handleDeleteMemory } from "../src/server/routes/delete.ts";
import { handleGetMemory } from "../src/server/routes/get.ts";
import { handleListMemory } from "../src/server/routes/list.ts";
import { handleStoreMemory } from "../src/server/routes/memory.ts";
import { handleQueryMemory } from "../src/server/routes/query.ts";
import { handleMemoryStats } from "../src/server/routes/stats.ts";
import { NotFoundError } from "../src/memory/schema.ts";

test("route handlers store and query fragments end-to-end", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "fragmenta-"));
  const adapter = createStorageAdapter({
    type: "jsonl",
    path: join(tempDir, "memory.jsonl")
  });
  const store = new MemoryStore(adapter);

  try {
    const stored = await handleStoreMemory(
      {
        content: "User prefers minimal UI",
        tags: ["preference", "ui"],
        importance: 0.9
      },
      store
    );

    assert.ok(stored.fragment.id);

    const queryResult = await handleQueryMemory(
      {
        query: "UI preference",
        limit: 5
      },
      store
    );

    assert.equal(queryResult.count, 1);
    assert.equal(queryResult.results[0]?.fragment.content, "User prefers minimal UI");
    assert.equal(queryResult.results[0]?.fragment.access_count, 1);

    const listed = await handleListMemory(
      {
        search: "minimal",
        tags: ["ui"]
      },
      store
    );

    assert.equal(listed.count, 1);
    assert.equal(listed.results[0]?.fragment.id, stored.fragment.id);

    const fetched = await handleGetMemory(stored.fragment.id, store);
    assert.equal(fetched.fragment.id, stored.fragment.id);

    const stats = await handleMemoryStats(store);
    assert.equal(stats.stats.totalFragments, 1);
    assert.equal(stats.stats.totalAccessCount, 1);
    assert.ok(stats.stats.topTags.some((entry) => entry.tag === "ui"));

    const deleted = await handleDeleteMemory(stored.fragment.id, store);
    assert.equal(deleted.deleted, true);

    const listedAfterDelete = await handleListMemory({}, store);
    assert.equal(listedAfterDelete.count, 0);

    await assert.rejects(() => handleGetMemory(stored.fragment.id, store), NotFoundError);
  } finally {
    await store.close();
  }
});
