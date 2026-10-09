import test from 'node:test';
import assert from 'node:assert/strict';
import { preserveBranch, forkHistory } from '../src/homework/hw03/history.mjs';
import { defaultDatasets, replay, validateBackup } from '../src/homework/hw03/model.mjs';
test('continuing from a historical step keeps the original chain and committed cursor',()=>{
  const operations=[{type:'dedup',params:{}},{type:'dropMissing',params:{column:'cost'}}];
  const fork=forkHistory([],operations,2,1,'original','branch-1');
  assert.equal(fork.cursor,1);assert.equal(fork.operations.length,1);assert.equal(fork.branches[0].cursor,2);assert.equal(fork.branches[0].operations.length,2);
  fork.operations[0].type='changed';assert.equal(operations[0].type,'dedup');assert.equal(fork.branches[0].operations[0].type,'dedup');
  assert.throws(()=>forkHistory([],operations,2,3,'bad','bad'),/invalidOperation/);
});
test('saved branches survive backup validation and reproduce their result',()=>{
  const data=defaultDatasets(),ops=[{type:'dedup',params:{}},{type:'dropMissing',params:{column:'cost'}}];
  data[0].branches=preserveBranch([],ops,2,'cleaned','b1');
  const state={version:1,active:data[0].id,datasets:data,operations:[],cursor:0};
  const restored=validateBackup(JSON.parse(JSON.stringify(state)));
  const branch=restored.datasets[0].branches[0];
  assert.equal(replay(restored.datasets[0],branch.operations,branch.cursor,restored.datasets).rows.length,617);
});
test('excluding a multi-condition selection is the complement, including null records',()=>{
  const data=defaultDatasets(),filters=[{column:'region',operator:'eq',value:'East'},{column:'cost',operator:'missing'}];
  const keep=replay(data[0],[{type:'filter',params:{filters,mode:'or'}}],1,data);
  const exclude=replay(data[0],[{type:'filter',params:{filters,mode:'or',exclude:true}}],1,data);
  assert.equal(keep.rows.length+exclude.rows.length,data[0].rows.length);
  assert.equal(exclude.rows.some(r=>r.region==='East'||r.cost===null),false);
});
