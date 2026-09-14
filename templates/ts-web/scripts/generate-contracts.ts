import { mkdir, writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";
import { buildApp } from "../server/app.js";

const app = await buildApp({ logger: false });
try {
  await app.ready();
  const document = app.swagger();
  await mkdir("contracts", { recursive: true });
  await writeFile("contracts/openapi.json", JSON.stringify(document, null, 2) + "\n");
  const types = await openapiTS(JSON.stringify(document));
  await writeFile("contracts/api.d.ts", astToString(types));
} finally { await app.close(); }
