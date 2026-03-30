import test from "node:test";
import assert from "node:assert/strict";
import { calculateFragmentScore } from "../src/scoring/score.ts";
import { rankFragments } from "../src/scoring/rank.ts";
import type { Fragment } from "../src/memory/schema.ts";

test("calculateFragmentScore favors stronger fragments deterministically", () => {
  const referenceTime = 1_710_001_000;
  const newerImportant: Fragment = {
    id: "a",
    content: "User prefers minimal UI",
    tags: ["preference", "ui"],
    created_at: 1_710_000_000,
    last_accessed: 1_710_000_900,
    access_count: 5,
    importance: 0.9
  };

  const olderLessImportant: Fragment = {
    id: "b",
    content: "User used blue theme once",
    tags: ["theme"],
    created_at: 1_709_000_000,
    last_accessed: 1_709_000_100,
    access_count: 1,
    importance: 0.2
  };

  const strongerScore = calculateFragmentScore(newerImportant, referenceTime);
  const weakerScore = calculateFragmentScore(olderLessImportant, referenceTime);

  assert.ok(strongerScore.score > weakerScore.score);
  assert.deepEqual(rankFragments([olderLessImportant, newerImportant], referenceTime).map((item) => item.fragment.id), ["a", "b"]);
});
