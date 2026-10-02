import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate,normalize } from '../src/homework/hw02/model.mjs';

test('no AI and no extra review preserves the baseline exactly',()=>{
 const r=calculate({tasks:20,adoption:0,speed:8,review:0});
 assert.deepEqual(r.assisted,r.baseline);assert.equal(r.saved,0);
});
test('only production accelerates: 100% participation at 3× yields 35 minutes per task',()=>{
 const r=calculate({tasks:1,adoption:100,speed:3,review:0});
 assert.deepEqual(r.baseline,[10,30,10,5]);assert.deepEqual(r.assisted,[10,10,10,5]);
 assert.equal(r.aiTotal,35);assert.equal(r.baseTotal,55);
});
test('review can outweigh acceleration and produce negative savings',()=>{
 const r=calculate({tasks:10,adoption:100,speed:2,review:20});
 assert.equal(r.aiTotal,600);assert.equal(r.baseTotal,550);assert.ok(r.saved<0);
});
test('doubling workload doubles effort but preserves percentage savings',()=>{
 const a=calculate({tasks:10}),b=calculate({tasks:20});
 assert.equal(b.aiTotal,a.aiTotal*2);assert.equal(b.baseTotal,a.baseTotal*2);assert.equal(b.saved,a.saved);
});
test('URL values cannot cause NaN, divide-by-zero, or negative effort',()=>{
 const p=normalize({tasks:'-100',adoption:'not-a-number',speed:'0',review:'Infinity'});
 assert.equal(p.tasks,1);assert.equal(p.adoption,60);assert.equal(p.speed,1);assert.equal(p.review,4);
 const r=calculate(p);assert.ok(Number.isFinite(r.aiTotal));assert.ok(r.aiTotal>0);
});
test('savings are monotonic in participation when review is fixed',()=>{
 for(const speed of [1,2,3,8]){
  let previous=Infinity;
  for(let a=0;a<=100;a+=5){const r=calculate({adoption:a,speed});assert.ok(r.aiTotal<=previous);previous=r.aiTotal;}
 }
});
