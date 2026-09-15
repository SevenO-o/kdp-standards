import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,type Server} from 'node:http';
import {localGateway} from '../scripts/local-gateway.js';
import {toolHttp} from '../shared/tool-http.js';
import {readDownload} from '../web/lib/http.js';
const listen=async(server:Server)=>{await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${(server.address() as {port:number}).port}`;};
const close=(server:Server)=>new Promise<void>(resolve=>server.close(()=>resolve()));
test('local gateway preserves binary metrics, drops cookies and rejects oversized results',async()=>{
  const upstream=createServer((req,res)=>{
    assert.equal(req.headers.cookie,undefined);assert.equal(req.headers.authorization,undefined);assert.equal(req.headers['x-kdp-context'],undefined);
    if(req.url==='/api/oversized'){res.writeHead(200,{'content-type':'application/json'});res.end(Buffer.alloc(toolHttp.jsonMaxBytes+1));return;}
    res.writeHead(200,{'content-type':'image/png','content-disposition':'attachment; filename="out.png"','x-source-bytes':'246','x-output-bytes':'123','x-tool-width':'64','set-cookie':'private=value','x-kdp-context':'private','x-unknown':'hidden'});res.end(Buffer.alloc(123));
  });
  const origin=await listen(upstream);const handler=localGateway({origin});const gateway=createServer((req,res)=>{void handler(req,res);});
  try{
    const url=await listen(gateway);
    const response=await fetch(url+'/api/file',{headers:{cookie:'private=source',authorization:'private','x-kdp-context':'forged'}});
    assert.equal(response.headers.get('x-output-bytes'),'123');assert.equal(response.headers.get('x-tool-width'),'64');
    for(const name of ['set-cookie','x-kdp-context','x-unknown'])assert.equal(response.headers.get(name),null);
    const file=await readDownload(response,{expectedTypes:['image/png']});assert.equal(file.outputBytes,123);assert.equal(file.sourceBytes,246);assert.equal(file.savingsRatio,0.5);
    const oversized=await fetch(url+'/api/oversized');assert.equal(oversized.status,502);assert.equal((await oversized.json()).error.code,'TOOL_RESPONSE_TOO_LARGE');
  }finally{await close(gateway);await close(upstream);}
});
