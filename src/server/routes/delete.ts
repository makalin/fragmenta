import { MemoryStore } from "../../memory/store.ts";
import { validateFragmentId } from "../../memory/schema.ts";

export async function handleDeleteMemory(id: unknown, store: MemoryStore) {
  const validatedId = validateFragmentId(id);
  const deleted = await store.deleteFragment(validatedId);
  return {
    id: validatedId,
    deleted
  };
}
