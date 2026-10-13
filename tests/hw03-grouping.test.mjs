import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {applyOperation,replay} from '../src/homework/hw03/model.mjs';
const rows=[{g:'B',h:1,x:4,y:2},{g:'A',h:1,x:2,y:3},{g:'B',h:1,x:null,y:5},{g:'A',h:2,x:-2,y:null},{g:null,h:1,x:9,y:4},{g:'A',h:1,x:6,y:1}];
const columns=['g','h','x','y'];
const defaults={keys:['g','h'],columns:['x','y'],methods:['sum','mean','count'],mode:'summarize',missing:'exclude',order:'sorted'};
const run=(params={},data=rows)=>applyOperation(data,columns,{type:'groupMulti',params:{...defaults,...params}});
test('multi-key multi-metric aggregation is sorted, named, immutable and chart metadata is bounded',()=>{
 const before=JSON.stringify(rows),r=run();assert.deepEqual(r.columns,['g','h','x_sum','x_mean','x_count','y_sum','y_mean','y_count']);assert.deepEqual(r.rows.map(r=>[r.g,r.h,r.x_sum,r.x_count]),[['A',1,8,2],['A',2,-2,1],['B',1,4,1]]);assert.equal(r.analysis.excluded,1);assert.equal(r.analysis.groups,3);assert.equal(JSON.stringify(rows),before);
 const large=run({},Array.from({length:20},(_,h)=>({g:'A',h,x:h,y:2})));assert.equal(large.rows.length,20);assert.equal(large.analysis.summary.length,12);
});
test('group transform preserves rows and assigns missing for excluded keys',()=>{
 const r=run({mode:'transform',columns:['x'],methods:['mean'],prefix:'group_'});assert.deepEqual(r.rows.map(r=>r.group_x_mean),[4,4,4,-2,null,4]);assert.deepEqual(r.rows.map(r=>r.g),rows.map(r=>r.g));
 assert.deepEqual(run({mode:'transform',missing:'include',columns:['x'],methods:['mean']}).rows.map(r=>r.x_mean),[4,4,4,-2,9,4]);
});
test('empty table, whole table, missing-only values and text aggregation',()=>{
 assert.equal(run({},[]).rows.length,0);assert.deepEqual(run({keys:[],columns:['x'],methods:['sum','prod','mean','count','size']},[]).rows,[{x_sum:0,x_prod:1,x_mean:null,x_count:0,x_size:0}]);
 const r=run({keys:[],columns:['g'],methods:['min','max','first','last','nunique','count','size']});assert.deepEqual(r.rows,[{g_min:'A',g_max:'B',g_first:'B',g_last:'A',g_nunique:2,g_count:5,g_size:6}]);assert.throws(()=>run({columns:['g'],methods:['mean']}),/invalidNumber/);
});
test('group validation and deterministic replay',()=>{
 for(const params of [{keys:['bad']},{columns:[]},{methods:['bad']},{methods:['sum','sum']},{ddof:-1}])assert.throws(()=>run(params));
 assert.throws(()=>applyOperation(rows,[...columns,'x_sum'],{type:'groupMulti',params:{...defaults,mode:'transform'}}),/duplicateColumns/);
 const dataset={id:'test',name:'test.json',raw:JSON.stringify(rows),format:'json',rows,columns};const ops=[{type:'groupMulti',params:defaults}];assert.deepEqual(replay(dataset,ops,1,[dataset]).rows,run().rows);
});
const py=spawnSync(process.env.PANDAS_PYTHON??'python3',['-c',`
import pandas as pd,json,sys
p=pd.DataFrame(json.load(sys.stdin));out={}
methods=['sum','mean','median','count','size','nunique','min','max','std','var','first','last','prod','any','all']
for drop in [True,False]:
 for sort in [True,False]:
  g=p.groupby(['g','h'],dropna=drop,sort=sort)
  a=g[['x','y']].agg(methods);a.columns=['_'.join(c) for c in a.columns]
  out[str(drop)+str(sort)]=json.loads(a.reset_index().to_json(orient='records',double_precision=15))
  t=p.copy()
  for c in ['x','y']:
   for m in methods:t[c+'_'+m]=g[c].transform(m)
  out['t'+str(drop)+str(sort)]=json.loads(t.to_json(orient='records',double_precision=15))
print(json.dumps(out))
`],{input:JSON.stringify(rows),encoding:'utf8'});
const skip=py.status!==0?`pandas unavailable: ${py.stderr?.slice(-180)}`:false;
function approx(a,b){if(typeof b==='number'){assert.equal(typeof a,'number');assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);}else if(Array.isArray(b)){assert.equal(a.length,b.length);b.forEach((v,i)=>approx(a[i],v));}else if(b&&typeof b==='object'){for(const k of Object.keys(b))approx(a[k],b[k]);}else assert.equal(a,b);}
test('pandas differential: all 15 aggregations across sorting, missing keys and transform',{skip},()=>{
 const expected=JSON.parse(py.stdout),methods=['sum','mean','median','count','size','nunique','min','max','std','var','first','last','prod','any','all'];
 for(const drop of [true,false])for(const sort of [true,false]){const params={methods,missing:drop?'exclude':'include',order:sort?'sorted':'appearance'},key=String(drop?'True':'False')+String(sort?'True':'False');approx(run(params).rows,expected[key]);approx(run({...params,mode:'transform'}).rows,expected['t'+key]);}
});
