import type { Fragment } from "../memory/schema.ts";
import { ageInSeconds, clamp, nowUnix } from "../utils/time.ts";
import { calculateDecay } from "./decay.ts";

export interface ScoringOptions {
  recencyWindowSeconds?: number;
  decayWindowSeconds?: number;
  frequencySaturation?: number;
}

export interface ScoreBreakdown {
  score: number;
  importance: number;
  recency: number;
  frequency: number;
  decay: number;
}

export function calculateFragmentScore(
  fragment: Fragment,
  referenceTime = nowUnix(),
  options: ScoringOptions = {}
): ScoreBreakdown {
  const recencyWindowSeconds = options.recencyWindowSeconds ?? 60 * 60 * 24 * 30;
  const decayWindowSeconds = options.decayWindowSeconds ?? 60 * 60 * 24 * 90;
  const frequencySaturation = Math.max(1, options.frequencySaturation ?? 10);

  const age = ageInSeconds(fragment.last_accessed || fragment.created_at, referenceTime);
  const importance = clamp(fragment.importance);
  const recency = clamp(1 - age / recencyWindowSeconds);
  const frequency = clamp(Math.log1p(fragment.access_count) / Math.log1p(frequencySaturation));
  const decay = calculateDecay(age, decayWindowSeconds);
  const score = round(importance * 0.4 + recency * 0.3 + frequency * 0.2 - decay * 0.1);

  return {
    score,
    importance: round(importance),
    recency: round(recency),
    frequency: round(frequency),
    decay: round(decay)
  };
}

function round(value: number): number {
  return Number(value.toFixed(6));
}
