import {test} from "node:test";
import assert from "node:assert/strict";
import {readTheme,saveTheme,THEME_STORAGE_KEY} from "../web/lib/theme-state";
import {validateFileSelection} from "../web/lib/file-selection";

test("theme preference survives reinitialization and invalid values use light",()=>{
  const data=new Map<string,string>();const storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value)}};
  assert.equal(readTheme(storage),"light");assert.equal(saveTheme("dark",storage),true);assert.equal(readTheme(storage),"dark");
  data.set(THEME_STORAGE_KEY,"unexpected");assert.equal(readTheme(storage),"light");
});
test("unavailable preference storage does not break the UI",()=>{
  const blocked={getItem(){throw new Error("denied")},setItem(){throw new Error("quota")}};
  assert.equal(readTheme(blocked),"light");assert.equal(saveTheme("dark",blocked),false);assert.equal(saveTheme("dark"),false);
});
test("file selection rejects invalid batches without changing caller's files",()=>{
  const limits={maxBytes:100,maxFiles:2,extensions:[".csv"]};const valid=[{name:"列表.CSV",size:100}];
  assert.equal(validateFileSelection(valid,limits),null);assert.equal(validateFileSelection([],limits),null);
  assert.match(validateFileSelection([...valid,{name:"image.png",size:5}],limits)!,/格式不支持/);
  assert.match(validateFileSelection([{name:"empty.csv",size:0}],limits)!,/为空/);
  assert.match(validateFileSelection([{name:"large.csv",size:101}],limits)!,/超过大小限制/);
  assert.match(validateFileSelection([...valid,...valid,...valid],limits)!,/最多选择 2/);
  assert.deepEqual(valid,[{name:"列表.CSV",size:100}]);
});
test("file limits must be explicitly valid",()=>{
  assert.throws(()=>validateFileSelection([],{maxBytes:0,extensions:[".csv"]}));
  assert.throws(()=>validateFileSelection([],{maxBytes:100,extensions:[]}));
  assert.throws(()=>validateFileSelection([],{maxBytes:100,extensions:["csv"]}));
  assert.throws(()=>validateFileSelection([],{maxBytes:100,maxFiles:-1,extensions:[".csv"]}));
});
