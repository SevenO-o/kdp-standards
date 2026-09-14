import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import fastifyStatic from "@fastify/static";
import { contextResponse, errorSchema, normalizeBody, normalizeResponse, type NormalizeBody } from "./schema.js";
import { normalizeText } from "./normalize.js";
import { verifyPlatformContext, type PlatformIdentity } from "./platform.js";

declare module "fastify" {
  interface FastifyRequest { identity: PlatformIdentity | null }
}

export interface AppOptions {
  environment?: "development" | "production";
  toolId?: string;
  contextSecret?: string;
  toolName?: string;
  description?: string;
  staticDir?: string;
  logger?: boolean;
}

export async function buildApp(options: AppOptions = {}) {
  const environment = options.environment ?? "development";
  const toolId = options.toolId ?? "local-tool";
  if (environment === "production" && (!options.toolId || !options.contextSecret || options.contextSecret.length < 32)) {
    throw new Error("Production requires a tool ID and a context secret of at least 32 characters.");
  }
  const app = Fastify({
    logger: options.logger === false ? false : {
      level: "info",
      base: { toolId, version: "0.1.0" },
      redact: ["req.headers.authorization", "req.headers.cookie", "req.headers.x-kdp-context"],
    },
    genReqId: () => randomUUID(),
    bodyLimit: 512 * 1024,
    requestTimeout: 30_000,
    connectionTimeout: 10_000,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false, useDefaults: false } },
  });
  app.decorateRequest("identity", null);
  await app.register(swagger, { openapi: { openapi: "3.0.3", info: { title: "KDP Text Tool", version: "0.1.0" } } });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("cache-control", "no-store");
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "no-referrer");
    reply.header("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    const path = request.url.split("?")[0];
    if (path === "/health/live" || path === "/health/ready") return;
    if (environment === "development") {
      if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.ip)) {
        return reply.code(403).send({ error: { code: "LOCAL_ONLY", message: "本地开发仅允许本机访问", requestId: request.id } });
      }
      request.identity = { userId: "local-developer", toolId, requestId: request.id, expiresAt: Math.floor(Date.now() / 1000) + 60 };
      return;
    }
    request.identity = verifyPlatformContext(request.headers["x-kdp-context"], options.contextSecret!, toolId);
    if (!request.identity) return reply.code(401).send({ error: { code: "AUTHENTICATION_REQUIRED", message: "请从我的工具重新打开此页面", requestId: request.id } });
    request.log = request.log.child({ platformRequestId: request.identity.requestId });
  });

  app.get("/health/live", { schema: { hide: true } }, async () => ({ status: "ok" }));
  app.get("/health/ready", { schema: { hide: true } }, async () => ({ status: "ready" }));
  app.get("/api/v1/context", {
    schema: { operationId: "getContext", response: { 200: contextResponse, 401: errorSchema, 403: errorSchema } },
  }, async (request) => ({ data: {
    userId: request.identity!.userId,
    toolId,
    displayName: environment === "development" ? "本地开发" : request.identity!.userId,
    environment,
    toolName: options.toolName ?? "文本整理",
    description: options.description ?? "删除空行并整理文本空白字符",
    portalUrl: "/",
  } }));
  app.post<{ Body: NormalizeBody }>("/api/v1/normalize", {
    schema: {
      operationId: "normalizeText", body: normalizeBody,
      response: { 200: normalizeResponse, 400: errorSchema, 401: errorSchema, 403: errorSchema, 413: errorSchema, 500: errorSchema },
    },
  }, async (request, reply) => {
    if (!request.body.text.trim()) return reply.code(400).send({ error: { code: "EMPTY_TEXT", message: "请输入需要整理的文本", requestId: request.id } });
    return { data: normalizeText(request.body) };
  });

  app.setErrorHandler((error, request, reply) => {
    const details = error && typeof error === "object" ? error as { statusCode?: number; validation?: unknown } : {};
    const statusCode = details.statusCode && details.statusCode >= 400 && details.statusCode < 500 ? details.statusCode : 500;
    const code = details.validation ? "INVALID_REQUEST" : statusCode === 413 ? "PAYLOAD_TOO_LARGE" : statusCode < 500 ? "INVALID_REQUEST" : "INTERNAL_ERROR";
    const message = statusCode === 413 ? "输入内容超出允许大小" : details.validation ? "输入格式不正确，文本最多 100,000 字符" : statusCode < 500 ? "请求格式不正确" : "处理失败，请稍后重试";
    // Record a stable event without request bodies, raw parser errors, or private text.
    if (statusCode >= 500) request.log.error({ event: "request_failed", code }, "request_failed");
    reply.code(statusCode).send({ error: { code, message, requestId: request.id } });
  });
  if (options.staticDir) {
    await app.register(fastifyStatic, { root: options.staticDir, wildcard: false, index: ["index.html"] });
  }
  app.setNotFoundHandler((request, reply) => reply.code(404).send({ error: { code: "RESOURCE_NOT_FOUND", message: "页面或接口不存在", requestId: request.id } }));
  return app;
}
