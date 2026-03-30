import { MemoryStore } from "../../memory/store.ts";

export async function handleMemoryStats(store: MemoryStore) {
  const stats = await store.getStats();
  return { stats };
}
