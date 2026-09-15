import test from 'node:test';
import assert from 'node:assert/strict';
import {byteMetric,readDownload,readJson} from '../web/lib/http.js';

test('missing or malformed byte metrics remain unknown; a real zero is retained',()=>{
  for(const v of [null,'',' ','abc','NaN','Infinity','-1','1.5','9007199254740992'])assert.equal(byteMetric(v),null);
  assert.equal(byteMetric('0'),0);assert.equal(byteMetric('1024'),1024);
});
test('single-file size comes from received bytes even with missing or incorrect headers',async()=>{
  for(const headers of [{},{'x-output-bytes':'0','x-source-bytes':'300'}] as Record<string,string>[]){
    const result=await readDownload(new Response(new Uint8Array(123),{headers:{...headers,'content-type':'image/png','content-disposition':"attachment; filename*=UTF-8''%E5%9B%BE.png"}}),{expectedTypes:['image/png'],sourceBytes:246});
    assert.equal(result.outputBytes,123);assert.equal(result.sourceBytes,246);assert.equal(result.savingsRatio,0.5);assert.equal(result.filename,'图.png');
  }
  const unknown=await readDownload(new Response('abc',{headers:{'content-type':'application/octet-stream'}}),{expectedTypes:['application/octet-stream']});
  assert.equal(unknown.sourceBytes,null);assert.equal(unknown.savingsRatio,null);
});
test('HTTP and type failures never become successful downloads or JSON results',async()=>{
  await assert.rejects(readDownload(new Response(JSON.stringify({error:{code:'BAD_FILE',message:'文件无效'}}),{status:422,headers:{'content-type':'application/json'}}),{expectedTypes:['image/png']}),{code:'BAD_FILE',status:422});
  await assert.rejects(readDownload(new Response('{"data":{}}',{headers:{'content-type':'application/json'}}),{expectedTypes:['image/png']}),{code:'INVALID_FILE_RESPONSE'});
  await assert.rejects(readJson(new Response('<html>error</html>',{headers:{'content-type':'text/html'}})),{code:'INVALID_RESPONSE'});
});

test('interrupted downloads do not become successful partial blobs',async()=>{
  const response=new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array([1,2,3]));controller.error(new Error('connection lost'));}}),{headers:{'content-type':'image/png'}});
  await assert.rejects(readDownload(response,{expectedTypes:['image/png']}),{code:'FILE_TRANSFER_INTERRUPTED'});
});
