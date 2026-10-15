import test from 'node:test';
import assert from 'node:assert/strict';
import {numericDistribution} from '../src/homework/hw03/numeric-distribution.mjs';

test('two integer ages retain their full counts as separate equal-category bars',()=>{
 const ages=[...Array(31).fill(17),...Array(49).fill(18)];
 const result=numericDistribution(ages);
 assert.equal(result.discrete,true);
 assert.deepEqual(result.bars.map(b=>[b.value,b.count]),[[17,31],[18,49]]);
 const filtered=numericDistribution(ages.filter(age=>age===18),ages);
 assert.deepEqual(filtered.bars.map(b=>[b.value,b.count]),[[17,0],[18,49]]);
});
test('continuous bins never collapse at the maximum endpoint and conserve all rows',()=>{
 for(const values of [[0,.1,.5,1],Array.from({length:80},(_,i)=>i+1),[.5,.5,.5],[-1,-.5,0,1]]){
  const result=numericDistribution(values);
  assert.equal(result.discrete,false);
  assert.ok(result.bars.every(b=>b.upper>b.lower));
  assert.equal(result.bars.reduce((n,b)=>n+b.count,0),values.length);
  const maximum=Math.max(...values);assert.ok(result.bars.some(b=>b.count>0&&b.lower<=maximum&&b.upper>=maximum));
 }
});
test('singleton integers and empty values do not require fractional integer bins',()=>{
 assert.deepEqual(numericDistribution([18,18]).bars.map(b=>[b.value,b.count]),[[18,2]]);
 assert.deepEqual(numericDistribution([null,NaN,Infinity]).bars,[]);
});
