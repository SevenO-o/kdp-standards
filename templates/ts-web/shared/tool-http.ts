/** Shared by the platform and the template. Update template copies with sync-template-http.ts. */
export const toolHttp = Object.freeze({ version: '1', maxBytes: 8 * 1024 * 1024, timeoutMs: 15_000, binaryTimeoutMs: 45_000 });
export const toolSecurityHeaders = Object.freeze({
  'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
});
export class ToolHttpError extends Error {
  code: string; httpStatus: number;
  constructor(code: string, message: string, httpStatus: number) { super(message); this.code=code; this.httpStatus=httpStatus; }
}
export function responseHeaders(source: Headers, status: number): Record<string, string> {
  const result: Record<string, string> = { ...toolSecurityHeaders, 'cache-control': 'no-store' };
  for (const name of ['content-type', 'etag']) { const value = source.get(name); if (value) result[name] = value; }
  const disposition = source.get('content-disposition');
  if (status >= 200 && status < 300 && disposition && disposition.length <= 1024 && /^attachment(?:;|$)/i.test(disposition) && !/[^\x20-\x7e]/.test(disposition)) result['content-disposition'] = disposition;
  // Business metadata only. Platform identity, cookies and security policy are never forwarded.
  let bytes = 0, count = 0;
  for (const [name, value] of source) {
    if (!/^x-tool-[a-z0-9-]{1,64}$/.test(name) && !['x-source-bytes', 'x-output-bytes'].includes(name)) continue;
    if (value.length > 1024 || /[^\x20-\x7e]/.test(value) || ++count > 16 || (bytes += name.length + value.length) > 8192) throw new ToolHttpError('TOOL_HEADERS_INVALID', '工具返回的业务响应头超限或无效', 502);
    result[name] = value;
  }
  return result;
}
export async function forwardToolHttp(target: URL, input: { method: string; headers: Headers; body?: Uint8Array; context?: string; signal?: AbortSignal }) {
  const headers = new Headers();
  for (const name of ['content-type', 'accept', 'if-none-match']) { const value = input.headers.get(name); if (value) headers.set(name, value); }
  if (input.context) headers.set('x-kdp-context', input.context);
  if (input.body && input.body.byteLength > toolHttp.maxBytes) throw new ToolHttpError('TOOL_UPLOAD_TOO_LARGE', '上传内容超出平台大小限制', 413);
  const binary = /^(multipart\/form-data|application\/octet-stream)(?:;|$)/i.test(headers.get('content-type') ?? '');
  const timeout = AbortSignal.timeout(binary ? toolHttp.binaryTimeoutMs : toolHttp.timeoutMs);
  const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
  let upstream: Response;
  try { upstream = await fetch(target, { method: input.method, headers, body: input.body ? new Uint8Array(input.body) : undefined, redirect: 'manual', signal }); }
  catch { throw new ToolHttpError('TOOL_UNAVAILABLE', '工具暂时不可用', 503); }
  let selected: Record<string, string>;
  try { selected = responseHeaders(upstream.headers, upstream.status); }
  catch (error) { await upstream.body?.cancel(); throw error; }
  const length = upstream.headers.get('content-length');
  if (length !== null && /^\d+$/.test(length) && Number(length) > toolHttp.maxBytes) {
    await upstream.body?.cancel(); throw new ToolHttpError('TOOL_RESPONSE_TOO_LARGE', '工具响应超出平台大小限制', 502);
  }
  const chunks: Uint8Array[] = []; let received = 0;
  const reader = upstream.body?.getReader();
  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        received += chunk.value.byteLength;
        if (received > toolHttp.maxBytes) { await reader.cancel(); throw new ToolHttpError('TOOL_RESPONSE_TOO_LARGE', '工具响应超出平台大小限制', 502); }
        chunks.push(chunk.value);
      }
    } catch (error) { if (error instanceof ToolHttpError) throw error; throw new ToolHttpError('TOOL_UNAVAILABLE', '工具响应中断', 503); }
    finally { reader.releaseLock(); }
  }
  const body = new Uint8Array(received); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return { status: upstream.status, headers: selected, body };
}
