import { MemoryStore } from "../../memory/store.ts";
import { NotFoundError, validateFragmentId } from "../../memory/schema.ts";

export async function handleGetMemory(id: unknown, store: MemoryStore) {
  const validatedId = validateFragmentId(id);
  const fragment = await store.getFragment(validatedId);

  if (!fragment) {
    throw new NotFoundError(`Fragment '${validatedId}' was not found.`);
  }

  return { fragment };
}
