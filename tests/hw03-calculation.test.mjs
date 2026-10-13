import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';import {binaryValue} from '../src/homework/hw03/calculation.mjs';
const rows=[-10,-3,-2.675,-2.5,-1.5,-.3,-.1,0,.1,.3,1,1.5,2.5,2.675,3,10,null].map((x,i)=>({x,y:i%4?i-4:null,s:i%2?'yes':'no'})),columns=['x','y','s'];
const col=column=>({kind:'column',column}),num=value=>({kind:'number',value}),bin=(method,left,right)=>({kind:'binary',method,left,right}),choose=(method,condition,yes,no)=>({kind:'choose',method,condition,yes,no});
const run=params=>applyOperation(rows,columns,{type:'numeric',params:{columns:['x'],...params}});const formula=tree=>applyOperation(rows,columns,{type:'formula',params:{name:'answer',tree}});
test('nested formulas, where/mask branches and immutable source',()=>{const before=JSON.stringify(rows),tree=bin('div',bin('sub',col('x'),col('y')),num(2));const r=formula(tree);assert.equal(r.rows[1].answer,0);assert.equal(r.rows[0].answer,null);assert.equal(JSON.stringify(rows),before);const condition=bin('gt',col('x'),num(0));const w=formula(choose('where',condition,col('x'),num(-99))),m=formula(choose('mask',condition,col('x'),num(-99)));assert.equal(w.rows[0].answer,-99);assert.equal(m.rows[0].answer,-10);assert.equal(w.analysis.branch.kept,8);assert.equal(w.analysis.branch.replaced,9);});
test('formula validation, capacity and append/overwrite',()=>{assert.throws(()=>formula({kind:'code',value:'process.exit()'}),/invalidFormula/);assert.throws(()=>formula(col('absent')),/missingColumn/);assert.throws(()=>formula(num('')),/invalidNumber/);assert.throws(()=>formula(choose('where',num(1),num(1),num(0))),/invalidFormula/);assert.throws(()=>formula(bin('add',col('s'),num(1))),/invalidNumber/);assert.throws(()=>run({method:'round',decimals:16}),/invalidNumber/);assert.throws(()=>applyOperation(rows,columns,{type:'formula',params:{name:'x',tree:num(2)}}),/duplicateColumns/);const r=run({method:'mul',constant:2,output:'overwrite'});assert.deepEqual(r.columns,columns);assert.equal(r.rows[0].x,-20);let node=num(1);for(let i=0;i<10;i++)node={kind:'unary',method:'abs',value:node};assert.throws(()=>formula(node),/invalidFormula/);});
test('missing conditions, typed branches and nullable logical operations',()=>{const r=formula(choose('where',{kind:'missing'},{kind:'text',value:'yes'},{kind:'text',value:'no'}));assert.equal(r.rows[0].answer,'no');assert.equal(r.analysis.branch.unknown,rows.length);assert.equal(binaryValue('and',false,null),false);assert.equal(binaryValue('or',true,null),true);assert.equal(binaryValue('and',true,null),null);assert.equal(binaryValue('pow',null,0),1);assert.equal(binaryValue('pow',1,null),1);});
test('formula backup replay and special names',()=>{const op={type:'formula',params:{name:'__proto__',tree:choose('mask',bin('lt',col('x'),num(0)),col('x'),num(0))}};const b=validateBackup({version:1,datasets:[{id:'d',name:'n',raw:JSON.stringify(rows),format:'json'}],active:'d',operations:[op],cursor:1});assert.equal(b.cursor,1);assert.equal(applyOperation(rows,columns,op).rows[0].__proto__,0);});
const configs=[];
for(const method of ['add','sub','mul','div','floordiv','mod','pow','minimum','maximum'])for(const constant of [-3,-.1,0,.1,2,3])for(const direction of ['normal','reverse'])configs.push({method,constant,direction});
for(const method of ['abs','negative','sqrt','log','log10','exp','floor','ceil'])configs.push({method});for(const decimals of [-3,-2,-1,0,1,2,3,8,15])configs.push({method:'round',decimals});
for(const lower of ['',-2,0,5])for(const upper of ['',-1,2,10])configs.push({method:'clip',lower,upper});
const trees=[];for(const method of ['where','mask'])for(const compare of ['gt','gte','lt','lte','eq','ne'])trees.push(choose(method,bin(compare,col('x'),num(0)),col('y'),bin('mul',col('x'),num(2))));
for(const method of ['add','sub','mul','div','floordiv','mod','pow','minimum','maximum','fillna'])trees.push(bin(method,col('x'),col('y')));
trees.push(bin('div',bin('sub',col('x'),col('y')),num(2)),{kind:'round',value:bin('mul',col('x'),num(1.5)),decimals:2},{kind:'clip',value:col('x'),lower:col('y'),upper:num(4)});
for(const lower of [col('y'),num(5)])for(const upper of [col('y'),num(1)])trees.push({kind:'clip',value:col('x'),lower,upper});
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pandas'],{encoding:'utf8'}),ref=available.status===0?spawnSync(python,['-c',String.raw`
import pandas as pd,numpy as np,json,sys
x=json.load(sys.stdin);df=pd.DataFrame(x['rows']);out=[]
def calc(n):
 k=n['kind']
 if k=='column':return df[n['column']]
 if k=='number':return float(n['value'])
 if k=='round':return calc(n['value']).round(n['decimals'])
 if k=='clip':return calc(n['value']).clip(calc(n['lower']),calc(n['upper']))
 if k=='choose':return getattr(calc(n['yes']),n['method'])(calc(n['condition']),calc(n['no']))
 a=calc(n['left']);b=calc(n['right']);m=n['method']
 if m in ['minimum','maximum']:return pd.Series(getattr(np,m)(a,b))
 if m=='fillna':return a.fillna(b)
 return getattr(a,{'gte':'ge','lte':'le'}.get(m,m))(b)
for p in x['configs']:
 s=df.x;m=p['method']
 with np.errstate(all='ignore'):
  if m=='round':r=s.round(p['decimals'])
  elif m=='clip':r=s.clip(None if p['lower']=='' else p['lower'],None if p['upper']=='' else p['upper'])
  elif m in ['abs','negative','sqrt','log','log10','exp','floor','ceil']:r=pd.Series(getattr(np,m)(s))
  elif m in ['minimum','maximum']:r=pd.Series(getattr(np,m)(s,p['constant']))
  else:r=getattr(s,('r' if p['direction']=='reverse' else '')+m)(p['constant'])
 out.append(json.loads(r.to_json(orient='values')))
for n in x['trees']:
 with np.errstate(all='ignore'):r=calc(n)
 out.append(json.loads(r.to_json(orient='values')))
print(json.dumps(out))
`],{input:JSON.stringify({rows,configs,trees}),encoding:'utf8',maxBuffer:10*1024*1024}):null;
test(`pandas differential: ${configs.length+trees.length} arithmetic, round, clip and conditional expressions`,{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(ref.status,0,ref.stderr);const expected=JSON.parse(ref.stdout);[...configs,...trees].forEach((p,i)=>{const r=i<configs.length?run(p):formula(p),name=r.analysis.names[0],actual=r.rows.map(row=>row[name]);actual.forEach((v,j)=>{const e=expected[i][j];if(e===null)assert.equal(v,null,JSON.stringify(p));else assert.ok(typeof v==='number'&&Math.abs(v-e)<=1e-9*Math.max(1,Math.abs(e)),JSON.stringify(p)+`: row ${j}: ${v} != ${e}`);});});});

test('wide overwrite operations validate each independent tree and protect text capacity',()=>{const columns=Array.from({length:200},(_,i)=>'c'+i),row=Object.fromEntries(columns.map(c=>[c,2]));const r=applyOperation([row],columns,{type:'numeric',params:{columns,method:'mul',constant:3,output:'overwrite'}});assert.equal(r.columns.length,200);assert.ok(Object.values(r.rows[0]).every(v=>v===6));assert.throws(()=>applyOperation(Array.from({length:2200},()=>({x:1})),['x'],{type:'formula',params:{name:'s',tree:{kind:'text',value:'a'.repeat(10000)}}}),/stringOutputLimit/);});
