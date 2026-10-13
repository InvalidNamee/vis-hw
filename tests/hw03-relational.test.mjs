import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';
const left=[{k:'B',h:1,x:1},{k:'A',h:1,x:2},{k:'B',h:1,x:3},{k:null,h:2,x:4},{k:'A',h:2,x:5},{k:'D',h:1,x:6}];
const right=[{k:'B',h:1,x:10,z:100},{k:'C',h:1,x:20,z:200},{k:'B',h:1,x:30,z:300},{k:null,h:2,x:40,z:400},{k:'A',h:2,x:50,z:500}];
const columns=['k','h','x'],dataset={id:'right',name:'right.json',rows:right,columns:['k','h','x','z'],format:'json',raw:JSON.stringify(right)};
const params={dataset:'right',pairs:[{left:'k',right:'k'},{left:'h',right:'h'}],how:'outer',indicator:'_merge'};
const merge=(p={},rows=left,cols=columns,ds=dataset)=>applyOperation(rows,cols,{type:'merge',params:{...params,...p}},[ds]);
test('multikey outer merge handles duplicate expansion, missing keys, coalescing and diagnostics',()=>{const before=JSON.stringify([left,right]),r=merge();assert.deepEqual(r.columns,['k','h','x_x','x_y','z','_merge']);assert.equal(r.rows.length,9);assert.equal(r.analysis.leftMatched,4);assert.equal(r.analysis.rightMatched,4);assert.deepEqual(r.analysis.counts,{both:6,left_only:2,right_only:1});assert.deepEqual(r.rows.find(r=>r._merge==='right_only'),{k:'C',h:1,x_x:null,x_y:20,z:200,_merge:'right_only'});assert.equal(JSON.stringify([left,right]),before);});
test('merge validates keys, suffixes, indicator and prevents oversized Cartesian expansion',()=>{
 for(const validate of ['one_to_one','one_to_many','many_to_one'])assert.throws(()=>merge({validate}),/mergeValidation/);
 assert.throws(()=>merge({suffixes:['','']}),/duplicateColumns/);assert.throws(()=>merge({indicator:'x'}),/duplicateColumns/);assert.throws(()=>merge({pairs:[{left:'bad',right:'k'}]}),/missingColumn/);
 const many=Array.from({length:400},()=>({k:'A',h:1,x:1}));assert.throws(()=>merge({},many,columns,{...dataset,rows:many}),/tooManyRows/);
 assert.equal(merge({how:'cross',pairs:[]}).rows.length,left.length*right.length);
 const unusual={id:'u',columns:['k','__proto__'],rows:[JSON.parse('{"k":"B","__proto__":"kept"}')]};const special=merge({dataset:'u',pairs:[{left:'k',right:'k'}]},left,columns,unusual);assert.equal(special.rows.find(r=>r.k==='B').__proto__,'kept');
});
test('different key names are retained and same-name keys coalesce on right joins',()=>{
 const ds={...dataset,rows:[{r:'Z',x:9}],columns:['r','x']};const r=merge({how:'outer',pairs:[{left:'k',right:'r'}]},left,columns,ds);assert.ok(r.columns.includes('r'));assert.deepEqual(r.rows.find(r=>r._merge==='right_only'),{k:null,h:null,x_x:null,r:'Z',x_y:9,_merge:'right_only'});
 assert.ok(merge({how:'right'}).rows.every(r=>r.k!==undefined));
});
const concat=(p={})=>applyOperation(left,columns,{type:'concat',params:{datasets:['right'],currentName:'left.json',...p}},[dataset]);
test('concat rows union/intersection and columns position alignment with prefixes',()=>{
 const r=concat({sourceColumn:'source'});assert.equal(r.rows.length,11);assert.deepEqual(r.columns,['k','h','x','z','source']);assert.equal(r.rows[0].z,null);assert.equal(r.rows.at(-1).source,'right.json');
 assert.deepEqual(concat({join:'inner'}).columns,columns);
 const h=concat({axis:'columns',prefix:'all'});assert.equal(h.rows.length,6);assert.deepEqual(h.columns,['0_k','0_h','0_x','1_k','1_h','1_x','1_z']);assert.equal(h.rows.at(-1)['1_x'],null);assert.equal(concat({axis:'columns',join:'inner'}).rows.length,5);
 assert.throws(()=>concat({sourceColumn:'x'}),/duplicateColumns/);
});
test('merge and concat survive backup validation and replay',()=>{
 const source={id:'left',name:'left.json',raw:JSON.stringify(left),format:'json'};for(const operation of [{type:'merge',params},{type:'concat',params:{datasets:['right'],axis:'rows'}}]){const state=validateBackup({version:1,datasets:[source,dataset],active:'left',cursor:1,operations:[operation]});assert.equal(state.operations[0].type,operation.type);}
});
const py=spawnSync(process.env.PANDAS_PYTHON??'python3',['-c',`
import pandas as pd,json,sys
v=json.load(sys.stdin);l=pd.DataFrame(v[0]);r=pd.DataFrame(v[1]);out={}
def records(d):return json.loads(d.to_json(orient='records'))
for how in ['left','inner','right','outer']:
 for sort in [False,True]:out[how+str(sort)]=records(l.merge(r,on=['k','h'],how=how,sort=sort,indicator=True))
out['cross']=records(l.merge(r,how='cross',indicator=True))
for how in ['left','inner','right','outer']:
 rr=r.rename(columns={'k':'r','h':'s'});out['different'+how]=records(l.merge(rr,left_on=['k','h'],right_on=['r','s'],how=how,indicator=True))
for join in ['outer','inner']:
 out['rows'+join]=records(pd.concat([l,r],join=join,ignore_index=True))
 out['columns'+join]=records(pd.concat([l.add_prefix('0_'),r.add_prefix('1_')],axis=1,join=join))
print(json.dumps(out))
`],{input:JSON.stringify([left,right]),encoding:'utf8'});const skip=py.status!==0?`pandas unavailable: ${py.stderr?.slice(-200)}`:false;
test('pandas differential: four merge types, sorted order, multiple keys, different key names, cross and concat axes',{skip},()=>{
 const expected=JSON.parse(py.stdout);for(const how of ['left','inner','right','outer'])for(const sort of [false,true])assert.deepEqual(merge({how,sort}).rows,expected[how+(sort?'True':'False')],how+' '+sort);assert.deepEqual(merge({how:'cross',pairs:[]}).rows,expected.cross);
 const renamed={...dataset,columns:['r','s','x','z'],rows:right.map(({k,h,...rest})=>({r:k,s:h,...rest}))};for(const how of ['left','inner','right','outer'])assert.deepEqual(merge({how,pairs:[{left:'k',right:'r'},{left:'h',right:'s'}]},left,columns,renamed).rows,expected['different'+how]);
 for(const join of ['outer','inner']){assert.deepEqual(concat({join}).rows,expected['rows'+join]);assert.deepEqual(concat({axis:'columns',prefix:'all',join}).rows,expected['columns'+join]);}
});
test('pandas differential: deterministic merge boundary matrix with empty tables, duplicate and missing keys',{skip},()=>{
 let seed=123;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const cases=Array.from({length:60},(_,i)=>{const make=n=>Array.from({length:n},(_,j)=>({k:[null,'A','B','C'][random(4)],h:random(3),v:j}));return {left:make(i%9),right:make((i*3+2)%9),keys:i%2?['k']:['k','h']};});
 const reference=spawnSync(process.env.PANDAS_PYTHON??'python3',['-c',`import pandas as pd,json,sys
out=[]
for c in json.load(sys.stdin):
 l=pd.DataFrame(c['left'],columns=['k','h','v']);r=pd.DataFrame(c['right'],columns=['k','h','v']);a={}
 for how in ['left','inner','right','outer']:
  for sort in [False,True]:
   try:a[how+str(sort)]=json.loads(l.merge(r,on=c['keys'],how=how,sort=sort,indicator=True).to_json(orient='records'))
   except ValueError:a[how+str(sort)]=None
 out.append(a)
print(json.dumps(out))`],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(reference.status,0,reference.stderr);const expected=JSON.parse(reference.stdout);let compared=0;
 for(let i=0;i<cases.length;i++){const c=cases[i];for(const how of ['left','inner','right','outer'])for(const sort of [false,true]){const e=expected[i][how+(sort?'True':'False')];if(e==null)continue;const actual=applyOperation(c.left,['k','h','v'],{type:'merge',params:{dataset:'r',pairs:c.keys.map(k=>({left:k,right:k})),how,sort,indicator:'_merge'}},[{id:'r',rows:c.right,columns:['k','h','v']}]).rows;assert.deepEqual(actual,e,`case ${i}, ${how}, sort=${sort}`);compared++;}}
 assert.ok(compared>=300,`only ${compared} reference cases were comparable`);
});
