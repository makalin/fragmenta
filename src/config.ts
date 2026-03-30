import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface FragmentaConfig {
  server: {
    host: string;
    port: number;
  };
  storage: {
    type: "jsonl" | "sqlite";
    path: string;
  };
  scoring: {
    recencyWindowSeconds: number;
    decayWindowSeconds: number;
    frequencySaturation: number;
  };
  logger: {
    level: "debug" | "info" | "error";
  };
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export async function loadConfig(configPath = process.env.FRAGMENTA_CONFIG ?? "config/default.json"): Promise<FragmentaConfig> {
  const resolvedConfigPath = resolve(projectRoot, configPath);
  const raw = await readFile(resolvedConfigPath, "utf8");
  const parsed = JSON.parse(raw) as FragmentaConfig;

  return {
    ...parsed,
    server: {
      ...parsed.server,
      host: process.env.FRAGMENTA_HOST ?? parsed.server.host,
      port: Number(process.env.FRAGMENTA_PORT ?? parsed.server.port)
    },
    storage: {
      type: (process.env.FRAGMENTA_STORAGE_TYPE as "jsonl" | "sqlite" | undefined) ?? parsed.storage.type,
      path: resolve(projectRoot, process.env.FRAGMENTA_STORAGE_PATH ?? parsed.storage.path)
    },
    logger: {
      level: (process.env.FRAGMENTA_LOG_LEVEL as "debug" | "info" | "error" | undefined) ?? parsed.logger.level
    }
  };
}
