import test from 'node:test';
import assert from 'node:assert/strict';
import {applyOperation, matches, replay, validateBackup} from '../src/homework/hw03/model.mjs';
const rows=[{id:'a',g:'A',x:null,y:10},{id:'b',g:'B',x:2,y:null},{id:'c',g:'A',x:3,y:30},{id:'d',g:'A',x:null,y:null},{id:'e',g:'B',x:2,y:40},{id:'f',g:null,x:null,y:60}];
const columns=['id','g','x','y'];
const run=(type,params)=>applyOperation(rows,columns,{type,params});
test('nested conditions preserve AND/OR/NOT structure with set and numeric conditions',()=>{
  const tree={mode:'and',children:[{column:'g',operator:'isin',values:['A','B']},{mode:'or',children:[{column:'x',operator:'gt',value:2},{column:'y',operator:'range',value:35,upper:45}]}]};
  assert.deepEqual(run('filterTree',{tree}).rows.map(r=>r.id),['c','e']);
  assert.deepEqual(run('filterTree',{tree:{...tree,negate:true}}).rows.map(r=>r.id),['a','b','d','f']);
  assert.equal(matches(rows[0],{column:'x',operator:'ne',value:2}),true);
  assert.throws(()=>run('filterTree',{tree:{mode:'and',children:[]}}),/invalidCondition/);
  assert.throws(()=>run('filterTree',{tree:{column:'x',operator:'gt',value:'oops'}}),/invalidNumber/);
});
test('date range includes the whole upper calendar day and rejects reversed ranges',()=>{
  const values=[{d:'2025-01-01T12:00:00Z'},{d:'2025-01-02T23:30:00Z'},{d:'2025-01-03'}];
  assert.equal(applyOperation(values,['d'],{type:'filterTree',params:{tree:{column:'d',operator:'dateRange',value:'2025-01-01',upper:'2025-01-02'}}}).rows.length,2);
  assert.throws(()=>applyOperation(values,['d'],{type:'filterTree',params:{tree:{column:'d',operator:'dateRange',value:'2025-02-01',upper:'2025-01-01'}}}),/invalidDate/);
});
test('multi-key sorting is stable, independently directed and places nulls as configured',()=>{
  assert.deepEqual(run('sort',{keys:[{column:'g',desc:false},{column:'y',desc:true}]}).rows.map(r=>r.id),['c','a','d','e','b','f']);
  assert.equal(run('sort',{keys:[{column:'x',desc:true}],missing:'first'}).rows[0].id,'a');
  assert.throws(()=>run('sort',{keys:[{column:'x'},{column:'x'}]}),/invalidOperation/);
});
test('top N supports every boundary-tie rule and multiple metrics',()=>{
  assert.deepEqual(run('topN',{columns:['x'],count:2,direction:'descending',keep:'first'}).rows.map(r=>r.id),['c','b']);
  assert.deepEqual(run('topN',{columns:['x'],count:2,direction:'descending',keep:'last'}).rows.map(r=>r.id),['c','e']);
  assert.deepEqual(run('topN',{columns:['x'],count:2,direction:'descending',keep:'all'}).rows.map(r=>r.id),['c','b','e']);
  assert.deepEqual(run('topN',{columns:['x','y'],count:2,direction:'descending',keep:'first'}).rows.map(r=>r.id),['c','e']);
  assert.equal(run('topN',{columns:['x'],count:0,direction:'ascending',keep:'all'}).rows.length,0);
});
test('position slicing supports negative bounds, reverse, duplicate positions and labels',()=>{
  assert.deepEqual(run('rowSelect',{mode:'slice',start:1,end:-1,step:2}).rows.map(r=>r.id),['b','d']);
  assert.deepEqual(run('rowSelect',{mode:'slice',step:-1}).rows.map(r=>r.id),['f','e','d','c','b','a']);
  assert.deepEqual(run('rowSelect',{mode:'positions',positions:'-1, 0, 0'}).rows.map(r=>r.id),['f','a','a']);
  assert.deepEqual(run('rowSelect',{mode:'labels',column:'g',values:['B','A']}).rows.map(r=>r.id),['b','e','a','c','d']);
  assert.throws(()=>run('rowSelect',{mode:'positions',positions:'6'}),/invalidPositions/);
  assert.throws(()=>run('rowSelect',{mode:'labels',column:'g',values:['C']}),/missingRowLabel/);
});
test('subset dedup marks or removes according to first, last or all duplicates',()=>{
  assert.deepEqual(run('dedup',{columns:['g','x'],keep:'first'}).rows.map(r=>r.id),['a','b','c','f']);
  assert.deepEqual(run('dedup',{columns:['g','x'],keep:'last'}).rows.map(r=>r.id),['c','d','e','f']);
  assert.deepEqual(run('dedup',{columns:['g','x'],keep:'none'}).rows.map(r=>r.id),['c','f']);
  assert.deepEqual(run('dedup',{columns:['g','x'],keep:'none',mode:'mark',name:'dup'}).rows.map(r=>r.dup),[true,true,false,true,true,false]);
  assert.equal(rows[0].dup,undefined);
});
test('missing rules support any/all/threshold/ratio and column removal',()=>{
  assert.deepEqual(run('dropMissing',{columns:['x','y'],how:'any'}).rows.map(r=>r.id),['c','e']);
  assert.deepEqual(run('dropMissing',{columns:['x','y'],how:'all'}).rows.map(r=>r.id),['a','b','c','e','f']);
  assert.deepEqual(run('dropMissing',{columns:['x','y'],how:'threshold',threshold:1}).rows.map(r=>r.id),['a','b','c','e','f']);
  assert.equal(run('dropMissing',{columns:['x','y'],how:'ratio',ratio:.5}).rows.length,5);
  assert.deepEqual(run('dropMissing',{columns:['x','y'],axis:'columns',how:'any'}).columns,['id','g']);
});
test('fill methods use group-local donors, preserve input, and limit runs',()=>{
  assert.deepEqual(run('fill',{columns:['x'],groups:['g'],method:'mean'}).rows.map(r=>r.x),[3,2,3,3,2,null]);
  assert.deepEqual(run('fill',{columns:['x'],groups:['g'],method:'ffill'}).rows.map(r=>r.x),[null,2,3,3,2,null]);
  assert.deepEqual(run('fill',{columns:['x'],groups:['g'],method:'bfill'}).rows.map(r=>r.x),[3,2,3,null,2,null]);
  assert.equal(rows[0].x,null);
  const gaps=[{x:1},{x:null},{x:null},{x:null},{x:5},{x:null}];
  assert.deepEqual(applyOperation(gaps,['x'],{type:'fill',params:{column:'x',method:'ffill',limit:2}}).rows.map(r=>r.x),[1,1,1,null,5,5]);
});
test('linear interpolation respects leading/trailing gaps, direction, limit and group positions',()=>{
  const input=[{x:null},{x:1},{x:null},{x:null},{x:4},{x:null}];
  const interpolate=(direction,limit)=>applyOperation(input,['x'],{type:'fill',params:{column:'x',method:'interpolate',direction,limit}}).rows.map(r=>r.x);
  assert.deepEqual(interpolate('forward'),[null,1,2,3,4,4]);
  assert.deepEqual(interpolate('backward',1),[1,1,null,3,4,null]);
  assert.deepEqual(interpolate('both',1),[1,1,2,3,4,4]);
  assert.deepEqual(run('fill',{columns:['x'],groups:['g'],method:'interpolate',direction:'both'}).rows.map(r=>r.x),[3,2,3,3,2,null]);
});
test('pipeline backup reproduces complex conditions, sort, group filling and flags',()=>{
  const data={id:'a',name:'a.json',format:'json',raw:JSON.stringify(rows),rows,columns};
  const operations=[{type:'fill',params:{columns:['x'],groups:['g'],method:'mean'}},{type:'sort',params:{keys:[{column:'g'},{column:'x',desc:true}]}},{type:'dedup',params:{columns:['g','x'],mode:'mark',name:'dup',keep:'first'}}];
  const restored=validateBackup({version:1,active:'a',datasets:[data],operations,cursor:3});
  assert.deepEqual(replay(data,operations,3,[data]),replay(restored.datasets[0],operations,3,restored.datasets));
});
