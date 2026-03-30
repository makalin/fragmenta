import { createFragment } from "./fragment.ts";
import type { ListMemoryInput, QueryMemoryInput, StoreMemoryInput } from "./schema.ts";
import type { StorageAdapter } from "../storage/adapter.ts";
import { executeQuery } from "../retrieval/query.ts";
import type { QueryExecutionResult } from "../retrieval/query.ts";
import type { ScoringOptions } from "../scoring/score.ts";
import { filterFragmentsByCriteria } from "../retrieval/filter.ts";
import { rankFragments } from "../scoring/rank.ts";

export class MemoryStore {
  private readonly adapter: StorageAdapter;
  private readonly scoringOptions: ScoringOptions;

  constructor(adapter: StorageAdapter, scoringOptions: ScoringOptions = {}) {
    this.adapter = adapter;
    this.scoringOptions = scoringOptions;
  }

  async addFragment(input: StoreMemoryInput) {
    const fragment = createFragment(input);
    await this.adapter.upsertFragment(fragment);
    return fragment;
  }

  async listFragments() {
    return this.adapter.listFragments();
  }

  async list(input: ListMemoryInput = {}) {
    const fragments = await this.adapter.listFragments();
    const filtered = filterFragmentsByCriteria(fragments, input);
    const ranked = rankFragments(filtered, undefined, this.scoringOptions);
    const limited = input.limit ? ranked.slice(0, input.limit) : ranked;
    return limited.map((entry) => ({
      fragment: entry.fragment,
      score: entry.score
    }));
  }

  async getFragment(id: string) {
    const fragments = await this.adapter.listFragments();
    return fragments.find((fragment) => fragment.id === id) ?? null;
  }

  async deleteFragment(id: string) {
    const fragments = await this.adapter.listFragments();
    const nextFragments = fragments.filter((fragment) => fragment.id !== id);
    const deleted = nextFragments.length !== fragments.length;

    if (deleted) {
      await this.adapter.replaceFragments(nextFragments);
    }

    return deleted;
  }

  async getStats() {
    const fragments = await this.adapter.listFragments();
    const tagCounts = new Map<string, number>();
    let totalImportance = 0;
    let totalAccessCount = 0;

    for (const fragment of fragments) {
      totalImportance += fragment.importance;
      totalAccessCount += fragment.access_count;

      for (const tag of fragment.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    const topTags = [...tagCounts.entries()]
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const lastUpdatedAt = fragments.reduce((latest, fragment) => Math.max(latest, fragment.last_accessed), 0);

    return {
      totalFragments: fragments.length,
      totalAccessCount,
      averageImportance: fragments.length > 0 ? Number((totalImportance / fragments.length).toFixed(6)) : 0,
      topTags,
      lastUpdatedAt
    };
  }

  async query(input: QueryMemoryInput): Promise<QueryExecutionResult> {
    const fragments = await this.adapter.listFragments();
    const result = executeQuery(fragments, input, this.scoringOptions);
    await this.adapter.replaceFragments(result.updatedFragments);
    return result;
  }

  async close(): Promise<void> {
    await this.adapter.close?.();
  }
}
