import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { buildApp } from "../server/app.js";

const options = { trimLines: true, collapseSpaces: true, removeEmptyLines: true };
const secret = "a".repeat(48);
function token(overrides: Record<string, unknown> = {}, signingSecret = secret) {
  const payload = Buffer.from(JSON.stringify({ userId: "employee-1", toolId: "tool-1", requestId: "request-1", expiresAt: Math.floor(Date.now() / 1000) + 60, ...overrides })).toString("base64url");
  return `${payload}.${createHmac("sha256", signingSecret).update(payload).digest("base64url")}`;
}

test("business HTTP flow produces wrapped output and strict validation", async (t) => {
  const app = await buildApp({ logger: false });
  t.after(() => app.close());
  const success = await app.inject({ method: "POST", url: "/api/v1/normalize", payload: { text: "  甲    乙\n\n 丙  ", options } });
  assert.equal(success.statusCode, 200);
  assert.equal(success.json().data.text, "甲 乙\n丙");
  for (const payload of [
    { text: "a", options, ownerId: "somebody" },
    { text: "a", options: { ...options, unknown: true } },
    { text: "a", options: { ...options, trimLines: "true" } },
    { text: " ", options },
    { text: "x".repeat(100_001), options },
  ]) {
    const response = await app.inject({ method: "POST", url: "/api/v1/normalize", payload });
    assert.equal(response.statusCode, 400);
    assert.equal(typeof response.json().error.requestId, "string");
    assert.equal(response.json().data, undefined);
  }
});

test("production authenticates pages and API, rejects forged, expired and other-tool contexts", async (t) => {
  const app = await buildApp({ logger: false, environment: "production", toolId: "tool-1", contextSecret: secret });
  t.after(() => app.close());
  for (const headers of [
    {},
    { "x-user-id": "employee-1" },
    { "x-kdp-context": token({}, "wrong-secret") },
    { "x-kdp-context": token({ toolId: "tool-2" }) },
    { "x-kdp-context": token({ expiresAt: Math.floor(Date.now() / 1000) - 1 }) },
    { "x-kdp-context": token({ expiresAt: Math.floor(Date.now() / 1000) + 3600 }) },
  ]) {
    for (const url of ["/", "/api/v1/context"]) {
      const response = await app.inject({ url, headers });
      assert.equal(response.statusCode, 401);
      assert.equal(response.json().error.code, "AUTHENTICATION_REQUIRED");
    }
  }
  const authorized = await app.inject({ url: "/api/v1/context", headers: { "x-kdp-context": token(), "x-user-id": "attacker" } });
  assert.equal(authorized.statusCode, 200);
  assert.equal(authorized.json().data.userId, "employee-1");
  for (const path of ["/health/live", "/health/ready"]) assert.equal((await app.inject(path)).statusCode, 200);
});

test("local development rejects non-loopback and production fails closed without secrets", async (t) => {
  const app = await buildApp({ logger: false });
  t.after(() => app.close());
  assert.equal((await app.inject({ url: "/api/v1/context", remoteAddress: "10.1.2.3" })).statusCode, 403);
  await assert.rejects(buildApp({ logger: false, environment: "production", toolId: "tool-1" }), /Production requires/);
});

test("parser errors never reflect private input and unknown routes use JSON error contract", async (t) => {
  const app = await buildApp({ logger: false });
  t.after(() => app.close());
  const malformed = await app.inject({ method: "POST", url: "/api/v1/normalize", headers: { "content-type": "application/json" }, payload: '{"private-input-never-reflect-this"' });
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.body.includes("private-input-never-reflect-this"), false);
  const missing = await app.inject("/api/v1/missing");
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.json().error.code, "RESOURCE_NOT_FOUND");
});
