export interface Fragment {
  id: string;
  content: string;
  tags: string[];
  created_at: number;
  last_accessed: number;
  access_count: number;
  importance: number;
  metadata?: Record<string, unknown>;
}

export interface StoreMemoryInput {
  content: string;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, unknown>;
}

export interface QueryMemoryInput {
  query: string;
  limit?: number;
  tags?: string[];
  minImportance?: number;
}

export interface ListMemoryInput {
  limit?: number;
  tags?: string[];
  minImportance?: number;
  search?: string;
}

export interface DeleteMemoryInput {
  id: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class RequestTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestTooLargeError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateStoreMemoryInput(value: unknown): StoreMemoryInput {
  if (!isRecord(value)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  if (typeof value.content !== "string" || value.content.trim().length === 0) {
    throw new ValidationError("Field 'content' must be a non-empty string.");
  }

  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string"))) {
    throw new ValidationError("Field 'tags' must be an array of strings.");
  }

  if (value.importance !== undefined && (typeof value.importance !== "number" || Number.isNaN(value.importance))) {
    throw new ValidationError("Field 'importance' must be a number.");
  }

  if (value.metadata !== undefined && !isRecord(value.metadata)) {
    throw new ValidationError("Field 'metadata' must be an object.");
  }

  return {
    content: value.content.trim(),
    tags: value.tags,
    importance: value.importance,
    metadata: value.metadata
  };
}

export function validateQueryMemoryInput(value: unknown): QueryMemoryInput {
  if (!isRecord(value)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  if (typeof value.query !== "string") {
    throw new ValidationError("Field 'query' must be a string.");
  }

  if (value.limit !== undefined && (!Number.isInteger(value.limit) || value.limit < 1 || value.limit > 100)) {
    throw new ValidationError("Field 'limit' must be an integer between 1 and 100.");
  }

  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string"))) {
    throw new ValidationError("Field 'tags' must be an array of strings.");
  }

  if (
    value.minImportance !== undefined &&
    (typeof value.minImportance !== "number" || Number.isNaN(value.minImportance))
  ) {
    throw new ValidationError("Field 'minImportance' must be a number.");
  }

  return {
    query: value.query.trim(),
    limit: value.limit,
    tags: value.tags,
    minImportance: value.minImportance
  };
}

export function validateListMemoryInput(value: unknown): ListMemoryInput {
  if (!isRecord(value)) {
    throw new ValidationError("Request parameters must be an object.");
  }

  if (value.limit !== undefined && (!Number.isInteger(value.limit) || value.limit < 1 || value.limit > 100)) {
    throw new ValidationError("Field 'limit' must be an integer between 1 and 100.");
  }

  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== "string"))) {
    throw new ValidationError("Field 'tags' must be an array of strings.");
  }

  if (
    value.minImportance !== undefined &&
    (typeof value.minImportance !== "number" || Number.isNaN(value.minImportance))
  ) {
    throw new ValidationError("Field 'minImportance' must be a number.");
  }

  if (value.search !== undefined && typeof value.search !== "string") {
    throw new ValidationError("Field 'search' must be a string.");
  }

  return {
    limit: value.limit,
    tags: value.tags,
    minImportance: value.minImportance,
    search: typeof value.search === "string" ? value.search.trim() : undefined
  };
}

export function validateFragmentId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError("Fragment id must be a non-empty string.");
  }

  return value.trim();
}
