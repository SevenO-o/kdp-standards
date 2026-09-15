import { toolHttp } from '../../shared/tool-http.js';

/** Common client handling for JSON and single-file responses through the KDP gateway. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}
async function rejectResponse(response: Response): Promise<never> {
  const body=await response.json().catch(()=>null);
  throw new ApiError(typeof body?.error?.message==='string'?body.error.message:'服务暂时不可用，请稍后重试',response.status,typeof body?.error?.code==='string'?body.error.code:'REQUEST_FAILED');
}
export async function readJson<T>(response: Response): Promise<T> {
  if(!response.ok) return rejectResponse(response);
  if(!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??'')) throw new ApiError('服务返回了无法读取的结果',502,'INVALID_RESPONSE');
  const body=await response.json().catch(()=>null);
  if(!body||typeof body!=='object'||!('data' in body)) throw new ApiError('服务返回了无法读取的结果',502,'INVALID_RESPONSE');
  return body.data as T;
}
export function byteMetric(value: string|null): number|null {
  if(value===null||!/^\d+$/.test(value.trim()))return null;
  const parsed=Number(value);return Number.isSafeInteger(parsed)&&parsed>=0?parsed:null;
}
function filename(disposition: string|null): string {
  const encoded=disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let name=disposition?.match(/filename="([^"]*)"/i)?.[1]??disposition?.match(/filename=([^;]+)/i)?.[1]??'download';
  if(encoded){try{name=decodeURIComponent(encoded);}catch{/* Keep plain filename. */}}
  return name.replace(/[\\/:\x00-\x1f\x7f]/g,'_').replace(/^\.+/,'').trim().slice(0,180)||'download';
}
export async function readDownload(response: Response, options: {expectedTypes:readonly string[];sourceBytes?:number}) {
  if(!response.ok)return rejectResponse(response);
  const type=(response.headers.get('content-type')??'').split(';')[0].trim().toLowerCase();
  if(!options.expectedTypes.map(t=>t.toLowerCase()).includes(type))throw new ApiError('返回的文件类型不符合预期',502,'INVALID_FILE_RESPONSE');
  const blob=await response.blob();
  const sourceBytes=options.sourceBytes!==undefined?(Number.isSafeInteger(options.sourceBytes)&&options.sourceBytes>=0?options.sourceBytes:null):byteMetric(response.headers.get('x-source-bytes'));
  // Actual downloaded file bytes are authoritative; never turn a missing header into 0 B.
  const outputBytes=blob.size;
  return {blob,filename:filename(response.headers.get('content-disposition')),sourceBytes,outputBytes,savingsRatio:sourceBytes!==null&&sourceBytes>0?1-outputBytes/sourceBytes:null};
}
export async function toolRequest(path: string, init: RequestInit={}, timeoutMs: number=toolHttp.timeoutMs) {
  if(!path||path.startsWith('/')||path.includes('..')||/^[a-z]+:/i.test(path))throw new Error('Use a relative API path');
  const timeout=AbortSignal.timeout(timeoutMs);
  const signal=init.signal?AbortSignal.any([init.signal,timeout]):timeout;
  return fetch(new URL(`./api/v1/${path}`,window.location.href),{...init,credentials:'same-origin',signal});
}
export async function requestJson<T>(path:string,init?:RequestInit):Promise<T>{return readJson<T>(await toolRequest(path,init));}
export async function requestDownload(path:string,init:RequestInit,options:{expectedTypes:readonly string[];sourceBytes?:number}){return readDownload(await toolRequest(path,init,toolHttp.binaryTimeoutMs),options);}
