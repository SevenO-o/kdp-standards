import type { paths } from "../../contracts/api";

export type NormalizeRequest = paths["/api/v1/normalize"]["post"]["requestBody"]["content"]["application/json"];
export type NormalizeResult = paths["/api/v1/normalize"]["post"]["responses"][200]["content"]["application/json"]["data"];
export type ToolContext = paths["/api/v1/context"]["get"]["responses"][200]["content"]["application/json"]["data"];

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Works both at localhost / and at the platform's /tools/:toolId/ prefix.
  const response = await fetch(new URL(`./api/v1/${path}`, window.location.href), {
    ...init, credentials: "same-origin", signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.message ?? "服务暂时不可用，请稍后重试", response.status, body?.error?.code ?? "REQUEST_FAILED");
  if (!body || !("data" in body)) throw new ApiError("服务返回了无法读取的结果", 502, "INVALID_RESPONSE");
  return body.data as T;
}
export function getContext() { return request<ToolContext>("context"); }
export function normalize(input: NormalizeRequest) {
  return request<NormalizeResult>("normalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
}
