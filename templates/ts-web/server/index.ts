import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildApp } from "./app.js";

const environment = process.env.KDP_ENV ?? "development";
if (environment !== "development" && environment !== "production") throw new Error("Unsupported KDP_ENV");
if (process.env.NODE_ENV === "production" && environment !== "production") throw new Error("Production cannot enable local development identity");
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
const manifest = JSON.parse(readFileSync(resolve("kdp.json"), "utf8")) as { name: string; description: string };
const staticDir = resolve("dist/web");
const app = await buildApp({
  environment,
  toolId: process.env.KDP_TOOL_ID,
  contextSecret: process.env.KDP_CONTEXT_SECRET,
  toolName: manifest.name,
  description: manifest.description,
  staticDir: existsSync(staticDir) ? staticDir : undefined,
});
if (environment === "production" && !existsSync(staticDir)) throw new Error("Production frontend build is missing");
let shuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ event: "shutdown", signal }, "shutdown");
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    await app.close();
    clearTimeout(deadline);
  });
}
await app.listen({ host: environment === "production" ? "0.0.0.0" : "127.0.0.1", port });
