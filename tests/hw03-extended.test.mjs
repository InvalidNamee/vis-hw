import test from 'node:test';
import assert from 'node:assert/strict';
import {applyOperation, replay, validateBackup, parseData} from '../src/homework/hw03/model.mjs';
const rows=[{id:'a',x:3,text:' A '},{id:'b',x:null,text:null},{id:'c',x:1,text:'B'},{id:'d',x:3,text:'ABC'}];
const columns=['id','x','text'];
const run=(type,params)=>applyOperation(rows,columns,{type,params});
test('column projection, deletion and rename are immutable and protect schema',()=>{
  assert.deepEqual(run('columns',{columns:['text','id'],mode:'keep'}),{columns:['text','id'],rows:rows.map(r=>({text:r.text,id:r.id}))});
  assert.deepEqual(run('columns',{columns:['text'],mode:'first'}).columns,['text','id','x']);
  assert.deepEqual(run('columns',{columns:['text'],mode:'drop'}).columns,['id','x']);
  assert.deepEqual(run('rename',{column:'text',name:'label'}).columns,['id','x','label']);
  assert.throws(()=>run('rename',{column:'text',name:'x'}),/duplicateColumns/);
  assert.throws(()=>run('columns',{columns,mode:'drop'}),/missingColumn/);
  assert.equal(rows[0].text,' A ');
});
test('conversion distinguishes errors from intentional coercion and validates calendar dates',()=>{
  assert.throws(()=>run('convert',{column:'text',target:'number',errors:'raise'}),/invalidNumber/);
  assert.deepEqual(run('convert',{column:'text',target:'number',errors:'coerce'}).rows.map(r=>r.text),[null,null,null,null]);
  const data=parseData('[{"v":"2025-02-29"},{"v":"2024-02-29"}]','json');
  assert.deepEqual(applyOperation(data.rows,data.columns,{type:'convert',params:{column:'v',target:'date',errors:'coerce'}}).rows.map(r=>r.v),[null,'2024-02-29']);
});
test('text operations preserve nulls; literal replacement and Unicode count are explicit',()=>{
  assert.deepEqual(run('text',{column:'text',method:'strip'}).rows.map(r=>r.text),['A',null,'B','ABC']);
  assert.deepEqual(run('text',{column:'text',method:'slice',start:0,end:1}).rows.map(r=>r.text),[' ',null,'B','A']);
  assert.deepEqual(run('text',{column:'text',method:'replace',find:'A',replacement:'$&'}).rows.map(r=>r.text),[' $& ',null,'B','$&BC']);
  assert.deepEqual(run('text',{column:'text',method:'length',name:'n'}).rows.map(r=>r.n),[3,null,1,3]);
  assert.deepEqual(run('replace',{column:'x',find:'3',replacement:'9',target:'number'}).rows.map(r=>r.x),[9,null,1,9]);
});
test('rank handles ties, order and missing values',()=>{
  for(const [method,expected] of [['average',[2.5,null,1,2.5]],['dense',[2,null,1,2]],['first',[2,null,1,3]],['min',[2,null,1,2]],['max',[3,null,1,3]]])assert.deepEqual(run('rank',{column:'x',name:'r',method}).rows.map(r=>r.r),expected);
  assert.deepEqual(run('rank',{column:'x',name:'r',method:'average',desc:true}).rows.map(r=>r.r),[1.5,null,3,1.5]);
});
test('sample is deterministic, without replacement and validates count',()=>{
  assert.deepEqual(run('sample',{count:3,seed:42}),run('sample',{count:3,seed:42}));
  assert.equal(new Set(run('sample',{count:3,seed:42}).rows.map(r=>r.id)).size,3);
  assert.throws(()=>run('sample',{count:9,seed:42}),/invalidNumber/);
});
test('extended operations survive replay and backup validation',()=>{
  const dataset={id:'a',name:'a.json',format:'json',raw:JSON.stringify(rows),rows,columns};
  const operations=[{type:'text',params:{column:'text',method:'strip'}},{type:'rename',params:{column:'text',name:'label'}},{type:'columns',params:{columns:['label','x'],mode:'keep'}}];
  assert.deepEqual(replay(dataset,operations,3,[dataset]).columns,['label','x']);
  const restored=validateBackup({version:1,active:'a',datasets:[dataset],operations,cursor:3});
  assert.equal(restored.operations.length,3);
});

test('numeric coercion rejects hexadecimal and text slicing counts Unicode code points',()=>{
  const data=[{v:'0x10'},{v:'1e2'},{v:'  '}];
  assert.deepEqual(applyOperation(data,['v'],{type:'convert',params:{column:'v',target:'number',errors:'coerce'}}).rows,[{v:null},{v:100},{v:null}]);
  assert.deepEqual(applyOperation([{v:'😀AB'}],['v'],{type:'text',params:{column:'v',method:'slice',start:0,end:2}}).rows,[{v:'😀A'}]);
});
