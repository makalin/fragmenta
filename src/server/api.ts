import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { MemoryStore } from "../memory/store.ts";
import { NotFoundError, RequestTooLargeError, ValidationError } from "../memory/schema.ts";
import type { Logger } from "../utils/logger.ts";
import { validateFragmentId, validateListMemoryInput } from "../memory/schema.ts";
import { handleDeleteMemory } from "./routes/delete.ts";
import { handleGetMemory } from "./routes/get.ts";
import { handleListMemory } from "./routes/list.ts";
import { handleStoreMemory } from "./routes/memory.ts";
import { handleQueryMemory } from "./routes/query.ts";
import { handleMemoryStats } from "./routes/stats.ts";

export interface ApiServerOptions {
  store: MemoryStore;
  logger: Logger;
}

const MAX_REQUEST_BYTES = 1024 * 1024;

export function createApiServer({ store, logger }: ApiServerOptions): Server {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, {
          status: "ok"
        });
      }

      if (request.method === "GET" && url.pathname === "/memory") {
        const queryInput = validateListMemoryInput({
          limit: parseOptionalInteger(url.searchParams.get("limit")),
          minImportance: parseOptionalNumber(url.searchParams.get("minImportance")),
          search: url.searchParams.get("search") ?? undefined,
          tags: url.searchParams.getAll("tag")
        });
        const payload = await handleListMemory(queryInput, store);
        return sendJson(response, 200, payload);
      }

      if (request.method === "GET" && url.pathname === "/memory/stats") {
        const payload = await handleMemoryStats(store);
        return sendJson(response, 200, payload);
      }

      if (request.method === "POST" && url.pathname === "/memory") {
        const body = await readJsonBody(request);
        const payload = await handleStoreMemory(body, store);
        return sendJson(response, 201, payload);
      }

      if (request.method === "POST" && url.pathname === "/query") {
        const body = await readJsonBody(request);
        const payload = await handleQueryMemory(body, store);
        return sendJson(response, 200, payload);
      }

      if (url.pathname.startsWith("/memory/")) {
        const fragmentId = validateFragmentId(decodeURIComponent(url.pathname.slice("/memory/".length)));

        if (request.method === "GET") {
          const payload = await handleGetMemory(fragmentId, store);
          return sendJson(response, 200, payload);
        }

        if (request.method === "DELETE") {
          const payload = await handleDeleteMemory(fragmentId, store);
          return sendJson(response, payload.deleted ? 200 : 404, payload);
        }
      }

      return sendJson(response, 404, {
        error: "Not found"
      });
    } catch (error) {
      logger.error("Request failed", error);

      if (error instanceof ValidationError) {
        return sendJson(response, 400, { error: error.message });
      }

      if (error instanceof NotFoundError) {
        return sendJson(response, 404, { error: error.message });
      }

      if (error instanceof RequestTooLargeError) {
        return sendJson(response, 413, { error: error.message });
      }

      return sendJson(response, 500, { error: "Internal server error" });
    }
  });
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > MAX_REQUEST_BYTES) {
      throw new RequestTooLargeError(`Request body exceeds ${MAX_REQUEST_BYTES} bytes.`);
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError("Request body must contain valid JSON.");
  }
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload, null, 2));
}

function parseOptionalInteger(value: string | null): number | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  return Number.parseInt(value, 10);
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  return Number(value);
}
