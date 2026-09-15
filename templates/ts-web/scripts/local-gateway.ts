import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { forwardToolHttp, toolHttp, toolSecurityHeaders, ToolHttpError } from '../shared/tool-http.js';

export function localGateway(options: { origin: string; prefix?: string; context?: () => string }) {
  return async (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
    const raw = req.url ?? '/'; const prefix = options.prefix ?? '';
    if (prefix ? !raw.startsWith(prefix) : !/^\/api(?:\/|\?|$)/.test(raw)) { next?.(); return; }
    const controller = new AbortController();
    const disconnect = () => { if (!res.writableFinished) controller.abort(); };
    res.once('close', disconnect);
    try {
      const relative = prefix ? '/' + raw.slice(prefix.length) : raw;
      const [encodedPath] = relative.split('?'); const path = decodeURIComponent(encodedPath);
      if (/[\\%?#\x00-\x1f\x7f]/.test(path) || path.includes('//') || path.split('/').some(p => p === '.' || p === '..') || /^\/health(?:\/|$)/.test(path)) throw new ToolHttpError('NOT_FOUND', '资源不存在', 404);
      const target = new URL(path, options.origin); if (raw.includes('?')) target.search = raw.slice(raw.indexOf('?'));
      const headers = new Headers();
      for (const [name,value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name,value);
      const parts: Buffer[] = []; let size = 0;
      // Consume through events so an over-limit body can get an HTTP response before disconnect.
      const body = await new Promise<Uint8Array>((resolve,reject) => {
        req.on('data',(part: Buffer) => { size += part.length; if(size > toolHttp.maxBytes) { parts.length=0; reject(new ToolHttpError('TOOL_UPLOAD_TOO_LARGE','上传内容超出平台大小限制',413)); } else parts.push(part); });
        req.once('end',()=>resolve(Buffer.concat(parts))); req.once('error',reject);
      });
      const result = await forwardToolHttp(target,{method:req.method ?? 'GET',headers,body:['GET','HEAD'].includes(req.method ?? 'GET')?undefined:body,context:options.context?.(),signal:controller.signal});
      res.writeHead(result.status,result.headers); res.end(result.body);
    } catch(error) {
      if(res.destroyed) return;
      const known=error instanceof ToolHttpError;
      res.writeHead(known?error.httpStatus:503,{...toolSecurityHeaders,'content-type':'application/json','cache-control':'no-store'});
      res.end(JSON.stringify({error:{code:known?error.code:'TOOL_UNAVAILABLE',message:known?error.message:'工具暂时不可用',requestId:randomUUID()}}));
    } finally {res.removeListener('close',disconnect);}
  };
}
