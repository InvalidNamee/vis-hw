import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../dist/',import.meta.url);
const chapters=['','trends/','industries/','work/','lab/','transition/','sources/'];
const dataset=JSON.parse(readFileSync(new URL('../public/data/hw02/dataset.json',import.meta.url),'utf8'));

test('all fourteen HW02 routes have localized navigation and resolvable internal links',()=>{
 for(const prefix of ['','en/'])for(const chapter of chapters){
  const path=`${prefix}hw02/${chapter}`,html=readFileSync(new URL(`${path}index.html`,root),'utf8');
  assert.ok(html.includes('<hw02-shell'));assert.match(html,/data-kind=/);
  assert.ok(html.includes(`href="/${path}" aria-current="page"`),path);
  for(const lang of ['','en/'])assert.ok(html.includes(`href="/${lang}hw02/${chapter}" lang=`),path);
  for(const [,href]of html.matchAll(/href="(\/[^"?#]*)"/g)){
   if(href.endsWith('/'))assert.ok(existsSync(new URL(`.${href}index.html`,root)),href);
  }
  if(prefix){
   const visible=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g,'').replace(/<[^>]+>/g,'').replaceAll('中文','');
   assert.doesNotMatch(visible,/\p{Script=Han}/u,path);
  }
 }
});
test('all numeric records and industry cases have source provenance',()=>{
 const ids=new Set(dataset.sources.map(s=>s.id));
 assert.equal(ids.size,dataset.sources.length);assert.equal(new Set(dataset.records.map(r=>r.id)).size,12);
 for(const r of dataset.records){assert.ok(ids.has(r.source));assert.ok(Number.isFinite(r.value));assert.ok(r.unit);assert.ok(r.scope.zh&&r.scope.en);assert.ok(r.period);}
 for(const c of dataset.cases){assert.ok(ids.has(c.source));assert.ok(c.limit.zh&&c.limit.en);assert.ok(c.capabilities.length);}
 assert.equal(dataset.records.find(r=>r.id==='energy-2030').kind,'projection');
 assert.equal(dataset.records.find(r=>r.id==='energy-2024').kind,'estimate');
});
test('downloads are published and laboratory assumptions are present in both languages',()=>{
 for(const name of ['indicators.csv','dataset.json'])assert.ok(existsSync(new URL(`data/hw02/${name}`,root)));
 for(const prefix of ['','en/']){
  const html=readFileSync(new URL(`${prefix}hw02/lab/index.html`,root),'utf8');
  assert.match(html,/T = n/);assert.match(html,/data-result="saved"/);
  for(const key of ['tasks','adoption','speed','review'])assert.ok(html.includes(`data-control="${key}"`));
 }
});
