import { MemoryStore } from "../../memory/store.ts";
import { validateListMemoryInput } from "../../memory/schema.ts";

export async function handleListMemory(input: unknown, store: MemoryStore) {
  const validated = validateListMemoryInput(input);
  const results = await store.list(validated);
  return {
    results,
    count: results.length
  };
}
