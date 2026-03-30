import type { Fragment, QueryMemoryInput } from "../memory/schema.ts";
import { rankFragments } from "../scoring/rank.ts";
import type { ScoringOptions } from "../scoring/score.ts";
import { filterFragments } from "./filter.ts";
import { nowUnix } from "../utils/time.ts";

export interface QueryResult {
  fragment: Fragment;
  score: {
    score: number;
    importance: number;
    recency: number;
    frequency: number;
    decay: number;
  };
}

export interface QueryExecutionResult {
  results: QueryResult[];
  updatedFragments: Fragment[];
}

export function executeQuery(
  fragments: Fragment[],
  input: QueryMemoryInput,
  scoringOptions: ScoringOptions = {},
  referenceTime = nowUnix()
): QueryExecutionResult {
  const filtered = filterFragments(fragments, input);
  const ranked = rankFragments(filtered, referenceTime, scoringOptions);
  const limited = ranked.slice(0, input.limit ?? 5);
  const selectedIds = new Set(limited.map((entry) => entry.fragment.id));

  const updatedFragments = fragments.map((fragment) => {
    if (!selectedIds.has(fragment.id)) {
      return fragment;
    }

    return {
      ...fragment,
      access_count: fragment.access_count + 1,
      last_accessed: referenceTime
    };
  });

  const updatedById = new Map(updatedFragments.map((fragment) => [fragment.id, fragment]));

  return {
    results: limited.map((entry) => ({
      fragment: updatedById.get(entry.fragment.id) ?? entry.fragment,
      score: entry.score
    })),
    updatedFragments
  };
}
