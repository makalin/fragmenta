import type { Fragment } from "../memory/schema.ts";
import { JsonlStorageAdapter } from "./jsonl.ts";
import { SqliteStorageAdapter } from "./sqlite.ts";

export interface StorageAdapter {
  listFragments(): Promise<Fragment[]>;
  upsertFragment(fragment: Fragment): Promise<void>;
  replaceFragments(fragments: Fragment[]): Promise<void>;
  close?(): Promise<void>;
}

export interface StorageConfig {
  type: "jsonl" | "sqlite";
  path: string;
}

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  if (config.type === "sqlite") {
    return new SqliteStorageAdapter(config.path);
  }

  return new JsonlStorageAdapter(config.path);
}
