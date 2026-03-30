import { randomUUID } from "node:crypto";
import type { Fragment, StoreMemoryInput } from "./schema.ts";
import { clamp, nowUnix } from "../utils/time.ts";

export function normalizeTags(tags: string[] = []): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export function createFragment(input: StoreMemoryInput, timestamp = nowUnix()): Fragment {
  return {
    id: randomUUID(),
    content: input.content.trim(),
    tags: normalizeTags(input.tags),
    created_at: timestamp,
    last_accessed: timestamp,
    access_count: 0,
    importance: clamp(input.importance ?? 0.5),
    metadata: input.metadata
  };
}
