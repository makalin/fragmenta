import { MemoryStore } from "../../memory/store.ts";
import { validateStoreMemoryInput } from "../../memory/schema.ts";

export async function handleStoreMemory(body: unknown, store: MemoryStore) {
  const input = validateStoreMemoryInput(body);
  const fragment = await store.addFragment(input);
  return { fragment };
}
