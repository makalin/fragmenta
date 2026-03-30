import type { Fragment, ListMemoryInput, QueryMemoryInput } from "../memory/schema.ts";

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function matchesQuery(fragment: Fragment, query: string): boolean {
  if (query.trim().length === 0) {
    return true;
  }

  const queryTokens = tokenize(query);
  const haystack = `${fragment.content} ${fragment.tags.join(" ")}`.toLowerCase();

  return queryTokens.some((token) => haystack.includes(token));
}

export function filterFragments(fragments: Fragment[], input: QueryMemoryInput): Fragment[] {
  return filterFragmentsByCriteria(fragments, {
    tags: input.tags,
    minImportance: input.minImportance,
    search: input.query
  });
}

export function filterFragmentsByCriteria(fragments: Fragment[], input: ListMemoryInput): Fragment[] {
  const requiredTags = new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean));
  const search = input.search?.trim() ?? "";

  return fragments.filter((fragment) => {
    if (search.length > 0 && !matchesQuery(fragment, search)) {
      return false;
    }

    if (input.minImportance !== undefined && fragment.importance < input.minImportance) {
      return false;
    }

    if (requiredTags.size > 0) {
      const fragmentTags = new Set(fragment.tags);
      for (const tag of requiredTags) {
        if (!fragmentTags.has(tag)) {
          return false;
        }
      }
    }

    return true;
  });
}
