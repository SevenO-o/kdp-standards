import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createToolHttpGateway, toolHttpPolicy, toolSecurityHeaders, ToolHttpError, type ToolHttpPolicy } from '../shared/tool-http.js';

export function localGateway(options: { origin: string; prefix?: string; context?: () => string; policy?: ToolHttpPolicy }) {
  const gateway = createToolHttpGateway(options.policy ?? toolHttpPolicy(process.env));
  return async (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
    const raw = req.url ?? '/', prefix = options.prefix ?? '';
    if (prefix ? !raw.startsWith(prefix) : !/^\/api(?:\/|\?|$)/.test(raw)) { next?.(); return; }
    req.setTimeout(gateway.policy.fileTimeoutMs);
    const controller = new AbortController();
    const disconnect = () => { if (!res.writableFinished) controller.abort(); };
    res.once('close', disconnect); req.once('aborted', disconnect);
    try {
      const relative = prefix ? '/' + raw.slice(prefix.length) : raw;
      const [encodedPath] = relative.split('?'), path = decodeURIComponent(encodedPath);
      if (/[\\%?#\x00-\x1f\x7f]/.test(path) || path.includes('//') || path.split('/').some(p => p === '.' || p === '..') || /^\/health(?:\/|$)/.test(path)) throw new ToolHttpError('NOT_FOUND', '资源不存在', 404);
      const target = new URL(path, options.origin); if (raw.includes('?')) target.search = raw.slice(raw.indexOf('?'));
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value);
      const result = await gateway.forward(target, { method: req.method ?? 'GET', headers, body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : req.iterator({ destroyOnReturn: false }), context: options.context?.(), signal: controller.signal });
      res.writeHead(result.status, result.headers);
      if (result.body instanceof Readable) await pipeline(result.body, res);
      else res.end(result.body);
    } catch (error) {
      if (res.destroyed) return;
      if (res.headersSent) { res.destroy(); return; }
      const known = error instanceof ToolHttpError;
      res.writeHead(known ? error.httpStatus : 503, { ...toolSecurityHeaders, 'content-type': 'application/json', 'cache-control': 'no-store', ...(!req.complete ? { connection: 'close' } : {}) });
      if (!req.complete) req.resume();
      res.end(JSON.stringify({ error: { code: known ? error.code : 'TOOL_UNAVAILABLE', message: known ? error.message : '工具暂时不可用', requestId: randomUUID() } }));
    } finally { res.removeListener('close', disconnect); req.removeListener('aborted', disconnect); }
  };
}
