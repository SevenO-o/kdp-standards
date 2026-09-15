import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/** Shared by the platform and template; file limits apply to each direction. Zero disables only the file byte cap. */
export const toolHttp = Object.freeze({ version: '2', jsonMaxBytes: 8 * 1024 * 1024, fileMaxBytes: 256 * 1024 * 1024, timeoutMs: 15_000, fileTimeoutMs: 300_000, maxConcurrentFiles: 4 });
export type ToolHttpPolicy = { version: string; jsonMaxBytes: number; fileMaxBytes: number; timeoutMs: number; fileTimeoutMs: number; maxConcurrentFiles: number };
export function toolHttpPolicy(env: Record<string, string | undefined>): ToolHttpPolicy {
  const integer = (key: string, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
    const value = env[key]; if (value === undefined) return fallback;
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`Invalid ${key}`);
    return Number(value);
  };
  return { ...toolHttp, fileMaxBytes: integer('KDP_TOOL_FILE_MAX_BYTES', toolHttp.fileMaxBytes, 0), fileTimeoutMs: integer('KDP_TOOL_FILE_TIMEOUT_MS', toolHttp.fileTimeoutMs, 1, 2_147_483_647), maxConcurrentFiles: integer('KDP_TOOL_FILE_CONCURRENCY', toolHttp.maxConcurrentFiles, 1, 1024) };
}
export const toolSecurityHeaders = Object.freeze({
  'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
});
export class ToolHttpError extends Error {
  code: string; httpStatus: number;
  constructor(code: string, message: string, httpStatus: number) { super(message); this.code = code; this.httpStatus = httpStatus; }
}
const jsonType = (type: string) => /^(?:application|text)\/(?:[\w.-]+\+)?json(?:;|$)/i.test(type);
export function isFileMediaType(type: string) {
  return /^(?:image|audio|video|font)\//i.test(type) || /^multipart\/form-data(?:;|$)/i.test(type) || /^application\/(?:octet-stream|pdf|zip|gzip|x-gzip|x-tar|x-7z-compressed|x-rar-compressed|vnd\.rar|vnd\.openxmlformats-officedocument\.[\w.-]+|vnd\.ms-[\w.-]+)(?:;|$)/i.test(type);
}
export function responseHeaders(source: Headers, status: number): Record<string, string> {
  const result: Record<string, string> = { ...toolSecurityHeaders, 'cache-control': 'no-store' };
  for (const name of ['content-type', 'content-encoding', 'etag']) { const value = source.get(name); if (value) result[name] = value; }
  const disposition = source.get('content-disposition');
  if (status >= 200 && status < 300 && disposition && disposition.length <= 1024 && /^attachment(?:;|$)/i.test(disposition) && !/[^\x20-\x7e]/.test(disposition)) result['content-disposition'] = disposition;
  let bytes = 0, count = 0;
  for (const [name, value] of source) {
    if (!/^x-tool-[a-z0-9-]{1,64}$/.test(name) && !['x-source-bytes', 'x-output-bytes'].includes(name)) continue;
    if (value.length > 1024 || /[^\x20-\x7e]/.test(value) || ++count > 16 || (bytes += name.length + value.length) > 8192) throw new ToolHttpError('TOOL_HEADERS_INVALID', '工具返回的业务响应头超限或无效', 502);
    result[name] = value;
  }
  return result;
}
type Input = { method: string; headers: Headers; body?: Uint8Array | AsyncIterable<Uint8Array>; context?: string; signal?: AbortSignal };
const uploadError = () => new ToolHttpError('TOOL_UPLOAD_TOO_LARGE', '上传内容超出平台大小限制', 413);
const responseError = () => new ToolHttpError('TOOL_RESPONSE_TOO_LARGE', '工具响应超出平台大小限制', 502);

/** One instance per gateway process; reservations live until the transfer ends or is cancelled. */
export function createToolHttpGateway(policy: ToolHttpPolicy = toolHttp) {
  let activeFiles = 0;
  async function forward(target: URL, input: Input): Promise<{ status: number; headers: Record<string, string>; body: Uint8Array | Readable }> {
    if (!['http:', 'https:'].includes(target.protocol)) throw new ToolHttpError('TOOL_UNAVAILABLE', '工具地址无效', 503);
    const fileUpload = isFileMediaType(input.headers.get('content-type') ?? '') && input.body !== undefined;
    let reserved = false, finished = false, failure: Error | undefined;
    let outgoing: ReturnType<typeof httpRequest> | undefined, upstream: Readable | undefined, upload: Readable | undefined, output: Readable | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const release = () => { if (finished) return; finished = true; if (timer) clearTimeout(timer); input.signal?.removeEventListener('abort', abort); if (reserved) activeFiles--; upload?.destroy(); outgoing?.destroy(); };
    const fail = (error: Error) => { failure ??= error; outgoing?.destroy(error); upstream?.destroy(error); upload?.destroy(error); output?.destroy(error); release(); };
    const abort = () => fail(new ToolHttpError('TOOL_UNAVAILABLE', '工具传输已取消', 503));
    const deadline = (ms: number) => { if (timer) clearTimeout(timer); timer = setTimeout(() => fail(new ToolHttpError('TOOL_TIMEOUT', '工具传输超时', 504)), ms); timer.unref(); };
    const reserve = () => {
      if (reserved) return;
      if (activeFiles >= policy.maxConcurrentFiles) throw new ToolHttpError('TOOL_TRANSFER_BUSY', '文件传输繁忙，请稍后重试', 429);
      activeFiles++; reserved = true;
    };
    async function* limited(source: AsyncIterable<Uint8Array>, limit: number, error: () => ToolHttpError) {
      let size = 0;
      for await (const chunk of source) { if (failure) throw failure; size += chunk.byteLength; if (limit !== 0 && size > limit) throw error(); yield chunk; }
      if (failure) throw failure;
    }
    const iterable = (body: Uint8Array | AsyncIterable<Uint8Array>) => body instanceof Uint8Array ? (async function* () { yield body; })() : body;
    try {
      if (input.signal?.aborted) throw new ToolHttpError('TOOL_UNAVAILABLE', '工具传输已取消', 503);
      input.signal?.addEventListener('abort', abort, { once: true });
      if (fileUpload) reserve();
      deadline(fileUpload ? policy.fileTimeoutMs : policy.timeoutMs);
      const headers: Record<string, string> = { 'accept-encoding': 'identity' };
      for (const name of ['content-type', 'accept', 'if-none-match']) { const value = input.headers.get(name); if (value) headers[name] = value; }
      if (input.context) headers['x-kdp-context'] = input.context;
      const requestLimit = fileUpload ? policy.fileMaxBytes : policy.jsonMaxBytes;
      const declared = input.headers.get('content-length');
      if (input.body !== undefined && declared !== null && /^\d+$/.test(declared) && requestLimit && Number(declared) > requestLimit) throw uploadError();
      let body = input.body;
      if (body !== undefined && !fileUpload) {
        const chunks: Uint8Array[] = [];
        // Ordinary API bodies stay bounded and fail before reaching the tool.
        upload = Readable.from(limited(iterable(body), requestLimit, uploadError), { objectMode: false, highWaterMark: 64 * 1024 });
        for await (const chunk of upload) chunks.push(chunk);
        body = Buffer.concat(chunks);
      }
      if (failure) throw failure;
      const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
        outgoing = (target.protocol === 'https:' ? httpsRequest : httpRequest)(target, { method: input.method, headers }, resolve);
        outgoing.on('error', reject);
        if (body === undefined) outgoing.end();
        else {
          upload = Readable.from(limited(iterable(body), requestLimit, uploadError), { objectMode: false, highWaterMark: 64 * 1024 });
          void pipeline(upload, outgoing).catch(error => fail(error instanceof ToolHttpError ? error : new ToolHttpError('TOOL_UNAVAILABLE', '工具上传中断', 503)));
        }
      });
      upstream = response;
      // The listener also handles an upstream failure while the downstream is paused.
      response.on('error', error => { if (!finished) fail(error instanceof ToolHttpError ? error : new ToolHttpError('TOOL_UNAVAILABLE', '工具响应中断', 503)); });
      const source = new Headers();
      for (const [name, value] of Object.entries(response.headers)) if (value !== undefined) for (const item of Array.isArray(value) ? value : [value]) source.append(name, item);
      const status = response.statusCode ?? 502, selected = responseHeaders(source, status);
      const fileResponse = status >= 200 && status < 300 && !jsonType(source.get('content-type') ?? '') && (isFileMediaType(source.get('content-type') ?? '') || Boolean(selected['content-disposition']));
      if (fileResponse) { reserve(); if (!fileUpload) deadline(policy.fileTimeoutMs); }
      const limit = fileResponse ? policy.fileMaxBytes : policy.jsonMaxBytes;
      const length = source.get('content-length');
      if (input.method !== 'HEAD' && length !== null && /^\d+$/.test(length) && limit && Number(length) > limit) throw responseError();
      if (fileResponse && input.method !== 'HEAD') {
        // Preserve the wire encoding and byte length. A late failure destroys the
        // downstream stream rather than returning a truncated successful file.
        if (length !== null && /^\d+$/.test(length)) selected['content-length'] = length;
        output = Readable.from(limited(response, limit, responseError), { objectMode: false, highWaterMark: 64 * 1024 });
        output.once('end', release);
        output.once('close', () => { if (!finished) { outgoing?.destroy(); response.destroy(); upload?.destroy(); release(); } });
        output.on('error', error => fail(error));
        return { status, headers: selected, body: output };
      }
      const chunks: Uint8Array[] = [];
      for await (const chunk of limited(response, limit, responseError)) chunks.push(chunk);
      release();
      return { status, headers: selected, body: Buffer.concat(chunks) };
    } catch (error) {
      const known = failure ?? (error instanceof ToolHttpError ? error : new ToolHttpError('TOOL_UNAVAILABLE', '工具暂时不可用', 503));
      fail(known); throw known;
    }
  }
  return { policy, forward };
}
export const forwardToolHttp = createToolHttpGateway().forward;
