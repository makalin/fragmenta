import { startMcpServer } from "../src/server/mcp.ts";

startMcpServer().catch((error) => {
  console.error("[fragmenta:mcp] failed to start", error);
  process.exitCode = 1;
});
