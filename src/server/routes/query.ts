import { MemoryStore } from "../../memory/store.ts";
import { validateQueryMemoryInput } from "../../memory/schema.ts";

export async function handleQueryMemory(body: unknown, store: MemoryStore) {
  const input = validateQueryMemoryInput(body);
  const result = await store.query(input);
  return {
    results: result.results,
    count: result.results.length
  };
}
