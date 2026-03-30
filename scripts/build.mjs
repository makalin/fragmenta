import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");

await mkdir(distDir, { recursive: true });

await writeFile(resolve(distDir, "index.js"), 'import "../src/index.ts";\n', "utf8");

await writeFile(
  resolve(distDir, "server.js"),
  [
    'import { startMcpServer } from "../src/server/mcp.ts";',
    "",
    "startMcpServer().catch((error) => {",
    '  console.error("[fragmenta:mcp] failed to start", error);',
    "  process.exitCode = 1;",
    "});",
    ""
  ].join("\n"),
  "utf8"
);

console.log("Built dist wrappers.");
