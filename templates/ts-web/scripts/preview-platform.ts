import { createServer } from 'node:http';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { localGateway } from './local-gateway.js';

export async function startPlatformPreview(port=5174) {
  process.env.KDP_ENV='production'; process.env.NODE_ENV='production';
  const {buildApp}=await import(pathToFileURL(resolve('dist/server/app.js')).href);
  const manifest=JSON.parse(await readFile('kdp.json','utf8'));
  const secret=randomBytes(32).toString('hex'),toolId='local-tool';
  const app=await buildApp({environment:'production',toolId,contextSecret:secret,toolName:manifest.name,description:manifest.description,staticDir:resolve('dist/web'),logger:false});
  await app.listen({host:'127.0.0.1',port:0});
  const address=app.server.address();
  const gateway=localGateway({origin:`http://127.0.0.1:${address.port}`,prefix:'/tools/local-tool/',context:()=>{
    const payload=Buffer.from(JSON.stringify({userId:'local-preview',toolId,requestId:randomUUID(),expiresAt:Math.floor(Date.now()/1000)+30})).toString('base64url');
    return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
  }});
  const server=createServer((req,res)=>{
    if(req.url==='/'||req.url==='/tools/local-tool'){res.writeHead(302,{location:'/tools/local-tool/'});res.end();return;}
    void gateway(req,res,()=>{res.writeHead(404);res.end();});
  });
  try {await new Promise<void>((done,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',done);});}
  catch(error){await app.close();throw error;}
  return {url:`http://127.0.0.1:${(server.address() as {port:number}).port}/tools/local-tool/`,close:async()=>{await new Promise<void>(done=>server.close(()=>done()));await app.close();}};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const preview=await startPlatformPreview();
  console.log(`平台方式预览：${preview.url}\n已启用生产前端、路径前缀、签名身份和相同网关逻辑；未模拟目标 CPU、容器限额和外网。`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void preview.close().then(()=>process.exit(0));});
}
