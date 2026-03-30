import process from "node:process";
import { loadConfig } from "../config.ts";
import { MemoryStore } from "../memory/store.ts";
import {
  NotFoundError,
  validateFragmentId,
  validateListMemoryInput,
  validateQueryMemoryInput,
  validateStoreMemoryInput
} from "../memory/schema.ts";
import { createStorageAdapter } from "../storage/adapter.ts";
import { handleGetMemory } from "./routes/get.ts";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

class StdioTransport {
  private buffer = Buffer.alloc(0);
  private readonly onMessage: (message: JsonRpcRequest) => Promise<void>;

  constructor(onMessage: (message: JsonRpcRequest) => Promise<void>) {
    this.onMessage = onMessage;
  }

  start(): void {
    process.stdin.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      void this.parseBuffer();
    });
  }

  send(message: JsonRpcResponse): void {
    const payload = JSON.stringify(message);
    process.stdout.write(`Content-Length: ${Buffer.byteLength(payload, "utf8")}\r\n\r\n${payload}`);
  }

  private async parseBuffer(): Promise<void> {
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }

      const header = this.buffer.subarray(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = Buffer.alloc(0);
        return;
      }

      const contentLength = Number(match[1]);
      const totalLength = headerEnd + 4 + contentLength;
      if (this.buffer.length < totalLength) {
        return;
      }

      const body = this.buffer.subarray(headerEnd + 4, totalLength).toString("utf8");
      this.buffer = this.buffer.subarray(totalLength);

      let parsedBody: JsonRpcRequest;

      try {
        parsedBody = JSON.parse(body) as JsonRpcRequest;
      } catch {
        this.send({
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Invalid JSON-RPC payload."
          }
        });
        continue;
      }

      await this.onMessage(parsedBody);
    }
  }
}

export async function startMcpServer(): Promise<void> {
  const config = await loadConfig();
  const adapter = createStorageAdapter(config.storage);
  const store = new MemoryStore(adapter, config.scoring);
  const transport = new StdioTransport(async (message) => {
    await handleMessage(message, transport, store);
  });

  process.on("SIGINT", async () => {
    await store.close();
    process.exit(0);
  });

  process.stdin.resume();
  transport.start();
}

async function handleMessage(message: JsonRpcRequest, transport: StdioTransport, store: MemoryStore): Promise<void> {
  if (!message.id && message.method === "notifications/initialized") {
    return;
  }

  if (message.method === "initialize") {
    return transport.send({
      jsonrpc: "2.0",
      id: message.id ?? null,
      result: {
        protocolVersion: "2024-11-05",
        serverInfo: {
          name: "fragmenta",
          version: "0.1.0"
        },
        capabilities: {
          tools: {}
        }
      }
    });
  }

  if (message.method === "tools/list") {
    return transport.send({
      jsonrpc: "2.0",
      id: message.id ?? null,
      result: {
        tools: [
          {
            name: "store_memory",
            description: "Store a new memory fragment.",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                importance: { type: "number" }
              },
              required: ["content"]
            }
          },
          {
            name: "query_memory",
            description: "Retrieve ranked memory fragments for a query.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
                limit: { type: "integer", minimum: 1, maximum: 100 },
                tags: { type: "array", items: { type: "string" } },
                minImportance: { type: "number" }
              },
              required: ["query"]
            }
          },
          {
            name: "list_memories",
            description: "List stored memories with optional filters.",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "integer", minimum: 1, maximum: 100 },
                tags: { type: "array", items: { type: "string" } },
                minImportance: { type: "number" },
                search: { type: "string" }
              }
            }
          },
          {
            name: "get_memory",
            description: "Fetch a single memory fragment by id.",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string" }
              },
              required: ["id"]
            }
          },
          {
            name: "delete_memory",
            description: "Delete a memory fragment by id.",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string" }
              },
              required: ["id"]
            }
          },
          {
            name: "memory_stats",
            description: "Return aggregate memory statistics.",
            inputSchema: {
              type: "object",
              properties: {}
            }
          }
        ]
      }
    });
  }

  if (message.method === "tools/call") {
    try {
      const params = message.params ?? {};
      const name = String(params.name ?? "");
      const argumentsPayload = (params.arguments ?? {}) as unknown;

      if (name === "store_memory") {
        const input = validateStoreMemoryInput(argumentsPayload);
        const fragment = await store.addFragment(input);
        return transport.send({
          jsonrpc: "2.0",
          id: message.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ fragment }, null, 2)
              }
            ],
            structuredContent: { fragment }
          }
        });
      }

      if (name === "query_memory") {
        const input = validateQueryMemoryInput(argumentsPayload);
        const result = await store.query(input);
        return transport.send({
          jsonrpc: "2.0",
          id: message.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ results: result.results }, null, 2)
              }
            ],
            structuredContent: { results: result.results }
          }
        });
      }

      if (name === "list_memories") {
        const input = validateListMemoryInput(argumentsPayload);
        const results = await store.list(input);
        return transport.send({
          jsonrpc: "2.0",
          id: message.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ results, count: results.length }, null, 2)
              }
            ],
            structuredContent: { results, count: results.length }
          }
        });
      }

      if (name === "get_memory") {
        const args = (argumentsPayload ?? {}) as Record<string, unknown>;
        const payload = await handleGetMemory(args.id, store);
        return transport.send({
          jsonrpc: "2.0",
          id: message.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(payload, null, 2)
              }
            ],
            structuredContent: payload
          }
        });
      }

      if (name === "delete_memory") {
        const args = (argumentsPayload ?? {}) as Record<string, unknown>;
        const id = validateFragmentId(args.id);
        const deleted = await store.deleteFragment(id);
        return transport.send({
          jsonrpc: "2.0",
          id: message.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ id, deleted }, null, 2)
              }
            ],
            structuredContent: { id, deleted }
          }
        });
      }

      if (name === "memory_stats") {
        const stats = await store.getStats();
        return transport.send({
          jsonrpc: "2.0",
          id: message.id ?? null,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ stats }, null, 2)
              }
            ],
            structuredContent: { stats }
          }
        });
      }

      return transport.send({
        jsonrpc: "2.0",
        id: message.id ?? null,
        error: {
          code: -32601,
          message: `Unknown tool '${name}'.`
        }
      });
    } catch (error) {
      return transport.send({
        jsonrpc: "2.0",
        id: message.id ?? null,
        error: {
          code: error instanceof NotFoundError ? -32004 : -32000,
          message: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
  }

  if (message.method === "ping") {
    return transport.send({
      jsonrpc: "2.0",
      id: message.id ?? null,
      result: {}
    });
  }

  if (message.id !== undefined) {
    transport.send({
      jsonrpc: "2.0",
      id: message.id ?? null,
      error: {
        code: -32601,
        message: `Unsupported method '${message.method}'.`
      }
    });
  }
}
