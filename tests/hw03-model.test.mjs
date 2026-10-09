import test from 'node:test';
import assert from 'node:assert/strict';
import { parseData, applyOperation, replay, defaultDatasets, aggregate, toCSV, validateBackup, matches } from '../src/homework/hw03/model.mjs';
const rows = [{key:'A', x:10, y:2}, {key:'A', x:null, y:0}, {key:'B', x:30, y:3}, {key:'B', x:30, y:3}];
const cols = ['key','x','y'];
const run = (type,params) => applyOperation(rows,cols,{type,params});
test('CSV handles BOM, quoted multiline, escaped quotes and leading-zero IDs',()=>{
  const d=parseData('\uFEFFid,note,value\r\n001,"one\ntwo",12\r\n002,"say ""hello""",\r\n','csv');
  assert.deepEqual(d.rows,[{id:'001',note:'one\ntwo',value:12},{id:'002',note:'say "hello"',value:null}]);
  assert.throws(()=>parseData('a,a\n1,2','csv'),/duplicateColumns/);
  assert.throws(()=>parseData('a,b\n1','csv'),/rowWidth/);
  assert.throws(()=>parseData('a\n"bad','csv'),/csvInvalid/);
  assert.deepEqual(parseData('a;b\n1;2','semicolon').rows,[{a:1,b:2}]);
});
test('JSON union schema and malformed/nested values',()=>{
  assert.deepEqual(parseData('[{"a":1},{"b":2}]','json').rows,[{a:1,b:null},{a:null,b:2}]);
  assert.throws(()=>parseData('[{"a":{}}]','json'),/nestedJson/);
  assert.throws(()=>parseData('[]','json'),/jsonInvalid/);
});
test('cleaning retains source, missing values and exact duplicates have explicit semantics',()=>{
  assert.deepEqual(run('fill',{column:'x',method:'mean'}).rows.map(r=>r.x),[10,70/3,30,30]);
  assert.equal(rows[1].x,null);
  assert.equal(run('dropMissing',{column:'x'}).rows.length,3);
  assert.equal(run('dedup',{}).rows.length,3);
  assert.throws(()=>run('fill',{column:'x',method:'constant',value:'oops'}),/invalidNumber/);
});
test('group, pivot and sample standard deviation use expected hand-calculated results',()=>{
  assert.deepEqual(run('group',{group:'key',value:'x',method:'mean'}).rows,[{key:'A',x_mean:10},{key:'B',x_mean:30}]);
  const pivot=run('pivot',{group:'key',pivot:'y',value:'x',method:'sum'});
  assert.deepEqual(pivot.rows,[{key:'A','value:2':10,'value:0':0,'value:3':null},{key:'B','value:2':null,'value:0':null,'value:3':60}]);
  assert.equal(aggregate([1,2,3],'std'),1);assert.equal(aggregate([null],'mean'),null);assert.equal(aggregate([null],'sum'),0);
});
test('filters treat null separately and sorting always places null last',()=>{
  assert.equal(matches(rows[1],{column:'x',operator:'lte',value:10}),false);
  assert.equal(run('filter',{filters:[{column:'key',operator:'eq',value:'A'},{column:'x',operator:'missing'}],mode:'and'}).rows.length,1);
  assert.deepEqual(run('sort',{column:'x',desc:true}).rows.map(r=>r.x),[30,30,10,null]);
});
test('calculated columns propagate null, protect names and division by zero',()=>{
  assert.deepEqual(run('calculate',{left:'x',right:'y',name:'ratio',operator:'/'}).rows.map(r=>r.ratio),[5,null,10,10]);
  assert.throws(()=>run('calculate',{left:'x',right:'y',name:'x',operator:'+'}),/duplicateColumns/);
});
test('left and inner joins expand duplicate keys and keep unmatched rows',()=>{
  const data=[{id:'r',columns:['id','name'],rows:[{id:'A',name:'one'},{id:'A',name:'two'}]}];
  const left=applyOperation(rows,cols,{type:'join',params:{dataset:'r',leftKey:'key',rightKey:'id',how:'left'}},data);
  assert.equal(left.rows.length,6);assert.equal(left.rows.at(-1).name,null);
  assert.equal(applyOperation(rows,cols,{type:'join',params:{dataset:'r',leftKey:'key',rightKey:'id',how:'inner'}},data).rows.length,4);
});
test('timeline cursor, deterministic defaults, CSV round trip and backup validation',()=>{
  const data=defaultDatasets();assert.equal(data[0].rows.length,643);assert.equal(data[0].raw,defaultDatasets()[0].raw);
  const ops=[{type:'dedup',params:{}},{type:'dropMissing',params:{column:'cost'}}];
  assert.equal(replay(data[0],ops,1,data).rows.length,640);
  assert.equal(replay(data[0],ops,2,data).profile.find(p=>p.column==='cost').missing,0);
  assert.deepEqual(parseData(toCSV(rows,cols),'csv').rows,rows);
  const backup={version:1,datasets:data.map(({rows,columns,...d})=>d),active:data[0].id,operations:ops,cursor:1};
  assert.equal(validateBackup(backup).datasets[0].rows.length,643);
  assert.throws(()=>validateBackup({...backup,cursor:99}),/backupInvalid/);
});
test('monthly aggregation validates dates, skips missing dates and groups calendar months',()=>{
  const data=parseData('[{"date":"2025-01-01","value":1},{"date":"2025-01-31","value":2},{"date":"2025-02-01","value":5},{"date":null,"value":99}]','json');
  assert.deepEqual(applyOperation(data.rows,data.columns,{type:'group',params:{group:'date',value:'value',method:'sum',month:true}}).rows,[{date:'2025-01',value_sum:3},{date:'2025-02',value_sum:5}]);
  assert.throws(()=>run('group',{group:'key',value:'x',method:'sum',month:true}),/invalidDate/);
});
