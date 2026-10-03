import test from 'node:test';
import {csvFor} from '../scripts/hw02-data.mjs';
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
 assert.equal(ids.size,dataset.sources.length);assert.equal(new Set(dataset.records.map(r=>r.id)).size,dataset.records.length);
 for(const r of dataset.records){assert.ok(ids.has(r.source));assert.ok(Number.isFinite(r.value));assert.ok(r.unit);assert.ok(r.scope.zh&&r.scope.en);assert.ok(r.period);}
 for(const c of dataset.cases){assert.ok(ids.has(c.source));assert.ok(c.limit.zh&&c.limit.en);assert.ok(c.capabilities.length);}
 assert.equal(dataset.records.find(r=>r.id==='energy-2030').kind,'projection');
 assert.equal(dataset.records.find(r=>r.id==='energy-2025').kind,'estimate');
});
test('downloads are published and laboratory assumptions are present in both languages',()=>{
 for(const name of ['indicators.csv','dataset.json'])assert.ok(existsSync(new URL(`data/hw02/${name}`,root)));
 for(const prefix of ['','en/']){
  const html=readFileSync(new URL(`${prefix}hw02/lab/index.html`,root),'utf8');
  assert.match(html,/T = n/);assert.match(html,/data-result="saved"/);
  for(const key of ['tasks','adoption','speed','review'])assert.ok(html.includes(`data-control="${key}"`));
 }
});

test('published CSV is generated from the same records and source metadata as JSON',()=>{
 const published=JSON.parse(readFileSync(new URL('data/hw02/dataset.json',root),'utf8'));
 assert.deepEqual(published,dataset);
 assert.equal(readFileSync(new URL('data/hw02/indicators.csv',root),'utf8'),csvFor(published));
 for(const r of dataset.records){
  assert.ok(r.precision&&r.denominator.zh&&r.denominator.en&&r.limitation.zh&&r.limitation.en,r.id);
  const source=dataset.sources.find(s=>s.id===r.source);
  assert.ok(source.publishedAt&&source.verifiedAt,r.id);
  if(r.confidenceInterval){assert.ok(r.confidenceInterval[0]<=r.value&&r.value<=r.confidenceInterval[1],r.id);assert.ok(r.confidenceLevel>0&&r.confidenceLevel<1);}
 }
 assert.equal(dataset.records.find(r=>r.id==='dev-tasks').confidenceInterval,undefined);
 assert.equal(dataset.records.find(r=>r.id==='dev-tasks').standardError,10.3);
});

test('both story languages publish six chapters, eighteen stable steps and unique scene instances',()=>{
 for(const prefix of ['','en/']){
  const html=readFileSync(new URL(`${prefix}hw02/index.html`,root),'utf8');
  const chapters=[...html.matchAll(/<story-chapter id="([^"]+)"/g)].map(m=>m[1]);
  const steps=[...html.matchAll(/data-story-step="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(chapters.length,6);assert.equal(steps.length,18);
  assert.equal(new Set([...chapters,...steps]).size,24);
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'duplicate IDs break anchors and aria associations');
  const instances=[...html.matchAll(/data-instance="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(instances.length,36);assert.equal(new Set(instances).size,36);
  for(const chapter of chapters)assert.ok(html.includes(`href="#${chapter}"`));
  for(const [,anchor] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(anchor),anchor);
  assert.equal((html.match(/class="site-footer"/g)||[]).length,1);
  assert.ok(!html.includes('class="hw-pagination"'));
 }
});

test('the story publishes readable evidence and teaching results before JavaScript runs',()=>{
 for(const prefix of ['','en/']){
  const html=readFileSync(new URL(`${prefix}hw02/index.html`,root),'utf8');
  for(const id of ['support','time','quality','adoption-2023','adoption-2024','adoption-2025','eu-small','eu-medium','eu-large','energy-2025','energy-2030','exposure-global','dev-time','dev-tasks']){
   const record=dataset.records.find(r=>r.id===id),source=dataset.sources.find(s=>s.id===record.source);
   assert.ok(html.includes(source.url.replaceAll('&','&amp;')),id+' source');
   assert.ok(html.includes(record.scope[prefix?'en':'zh']),id+' sample');
   assert.ok(html.includes(record.limitation[prefix?'en':'zh']),id+' limitation');
  }
  assert.ok(html.includes('18.3'));assert.ok(html.includes('29.1%'));assert.ok(html.includes('-7.3%'));
  assert.match(html,/story-fallback/);assert.match(html,/story-data/);
 }
});
