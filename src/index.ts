import { loadConfig } from "./config.ts";
import { MemoryStore } from "./memory/store.ts";
import { createApiServer } from "./server/api.ts";
import { createStorageAdapter } from "./storage/adapter.ts";
import { createLogger } from "./utils/logger.ts";

async function start(): Promise<void> {
  const config = await loadConfig();
  const logger = createLogger(config.logger.level);
  const adapter = createStorageAdapter(config.storage);
  const store = new MemoryStore(adapter, config.scoring);
  const server = createApiServer({ store, logger });

  const shutdown = async () => {
    logger.info("Shutting down Fragmenta API server.");
    server.close();
    await store.close();
  };

  process.once("SIGINT", () => {
    void shutdown();
  });

  process.once("SIGTERM", () => {
    void shutdown();
  });

  await new Promise<void>((resolve) => {
    server.listen(config.server.port, config.server.host, () => {
      logger.info(`Fragmenta API listening on http://${config.server.host}:${config.server.port}`);
      resolve();
    });
  });
}

start().catch((error) => {
  console.error("[fragmenta] failed to start", error);
  process.exitCode = 1;
});
