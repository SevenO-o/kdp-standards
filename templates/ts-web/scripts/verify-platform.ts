import assert from 'node:assert/strict';
import { startPlatformPreview } from './preview-platform.js';

const preview=await startPlatformPreview(0);
try {
  const page=await fetch(preview.url);assert.equal(page.status,200);
  assert.match(page.headers.get('content-security-policy')??'',/frame-ancestors 'none'/);
  const html=await page.text();const assets=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(m=>m[1]);assert(assets.length>=2);
  for(const asset of assets){const r=await fetch(new URL(asset,preview.url));assert.equal(r.status,200);assert((await r.arrayBuffer()).byteLength>0);}
  const context=await (await fetch(new URL('./api/v1/context',preview.url))).json();assert.equal(context.data.userId,'local-preview');
  const input={text:'  hello   world  ',options:{trimLines:true,collapseSpaces:true,removeEmptyLines:true}};
  const result=await fetch(new URL('./api/v1/normalize',preview.url),{method:'POST',headers:{'content-type':'application/json','x-kdp-context':'forged'},body:JSON.stringify(input)});
  assert.equal(result.status,200);assert.equal((await result.json()).data.text,'hello world');
  const invalid=await fetch(new URL('./api/v1/normalize',preview.url),{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  assert.equal(invalid.status,400);assert.equal(typeof (await invalid.json()).error.code,'string');
  assert.equal((await fetch(new URL('./health/ready',preview.url))).status,404);
  console.log(JSON.stringify({localGateway:'passed',productionAssets:'passed',signedContext:'passed',business:'passed',targetRuntime:'notRun'}));
}finally{await preview.close();}
