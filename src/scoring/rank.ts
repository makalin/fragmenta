import type { Fragment } from "../memory/schema.ts";
import type { ScoreBreakdown, ScoringOptions } from "./score.ts";
import { calculateFragmentScore } from "./score.ts";
import { nowUnix } from "../utils/time.ts";

export interface RankedFragment {
  fragment: Fragment;
  score: ScoreBreakdown;
}

export function rankFragments(
  fragments: Fragment[],
  referenceTime = nowUnix(),
  options: ScoringOptions = {}
): RankedFragment[] {
  return fragments
    .map((fragment) => ({
      fragment,
      score: calculateFragmentScore(fragment, referenceTime, options)
    }))
    .sort((left, right) => {
      if (right.score.score !== left.score.score) {
        return right.score.score - left.score.score;
      }

      if (right.fragment.last_accessed !== left.fragment.last_accessed) {
        return right.fragment.last_accessed - left.fragment.last_accessed;
      }

      if (right.fragment.created_at !== left.fragment.created_at) {
        return right.fragment.created_at - left.fragment.created_at;
      }

      return left.fragment.id.localeCompare(right.fragment.id);
    });
}
