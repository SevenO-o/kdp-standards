import type { paths } from "../../contracts/api";

export type NormalizeRequest = paths["/api/v1/normalize"]["post"]["requestBody"]["content"]["application/json"];
export type NormalizeResult = paths["/api/v1/normalize"]["post"]["responses"][200]["content"]["application/json"]["data"];
export type ToolContext = paths["/api/v1/context"]["get"]["responses"][200]["content"]["application/json"]["data"];

import { requestJson as request } from './http';
export { ApiError } from './http';
export function getContext() { return request<ToolContext>("context"); }
export function normalize(input: NormalizeRequest) {
  return request<NormalizeResult>("normalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
}
