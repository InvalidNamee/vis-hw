import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';
const rows=[{g:'A',t:3,x:4,y:null},{g:'B',t:1,x:2,y:1},{g:'A',t:1,x:1,y:2},{g:'A',t:2,x:null,y:3},{g:'B',t:2,x:0,y:2},{g:null,t:1,x:8,y:4},{g:'A',t:3,x:6,y:5},{g:'B',t:3,x:null,y:null},{g:'B',t:4,x:8,y:2}],columns=['g','t','x','y'];
const run=p=>applyOperation(rows,columns,{type:'ewm',params:{columns:['x'],...p}});
test('group alignment, source immutability, chart sampling and validation',()=>{const before=JSON.stringify(rows),r=run({groups:['g'],order:'sorted',orderColumn:'t',decay:'alpha',value:.5,adjust:'exclude'});assert.deepEqual(r.rows.map(row=>row.x_ewm_mean),[3,2,1,1,1,null,4.5,1,17/3]);assert.equal(JSON.stringify(rows),before);assert.equal(r.analysis.groups.length,2);assert.throws(()=>run({decay:'alpha',value:1.1}),/invalidDecay/);assert.throws(()=>run({method:'sum',adjust:'exclude'}),/ewmSumAdjust/);assert.throws(()=>run({method:'corr',other:'missing'}),/missingColumn/);assert.equal(run({method:'corr',other:'y'}).analysis.separateResult,true);});
test('backup replay retains EWM parameters',()=>{const op={type:'ewm',params:{columns:['x'],groups:['g'],method:'std',decay:'halflife',value:2,ignoreMissing:'include'}};assert.equal(validateBackup({version:1,datasets:[{id:'d',name:'ewm',raw:JSON.stringify(rows),format:'json'}],active:'d',operations:[op],cursor:1}).cursor,1);});
const configs=[];
for(const method of ['mean','sum','var','std','cov','corr'])for(const adjust of ['include','exclude'])for(const ignoreMissing of ['include','exclude'])for(const bias of ['include','exclude'])for(const minPeriods of [0,2,4])for(const groups of [[],['g']])for(const order of ['appearance','sorted']){if(method==='sum'&&adjust==='exclude')continue;configs.push({method,adjust,ignoreMissing,bias,minPeriods,groups,order,orderColumn:'t',other:'y',decay:'alpha',value:.3});}
for(const decay of ['alpha','span','com','halflife'])for(const value of decay==='alpha'?[.001,.5,1]:decay==='span'?[1,2,10]:decay==='com'?[0,1,9]:[.1,1,10])for(const method of ['mean','var','std'])configs.push({decay,value,method});
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pandas'],{encoding:'utf8'}),ref=available.status===0?spawnSync(python,['-c',String.raw`
import json,sys,pandas as pd
x=json.load(sys.stdin);df=pd.DataFrame(x['rows']);out=[]
for p in x['configs']:
 result=pd.Series(float('nan'),index=df.index)
 groups=[g for _,g in df.groupby('g',dropna=True)] if p.get('groups') else [df]
 for g in groups:
  if p.get('order')=='sorted':g=g.sort_values('t',kind='stable')
  kw={p['decay']:p['value'],'adjust':p.get('adjust','include')=='include','ignore_na':p.get('ignoreMissing')=='include','min_periods':p.get('minPeriods',0)}
  e=g.x.ewm(**kw);m=p['method'];opts={}
  if m in ['var','std','cov']:opts['bias']=p.get('bias')=='include'
  r=getattr(e,m)(g.y,**opts) if m in ['cov','corr'] else getattr(e,m)(**opts)
  result.loc[g.index]=r
 out.append(json.loads(result.to_json(orient='values')))
print(json.dumps(out))
`],{input:JSON.stringify({rows,configs}),encoding:'utf8',maxBuffer:20*1024*1024}):null;
test(`pandas differential: ${configs.length} exponentially weighted configurations`,{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(ref.status,0,ref.stderr);const expected=JSON.parse(ref.stdout);configs.forEach((p,i)=>{const r=run(p),name=r.columns.at(-1);r.rows.forEach((row,j)=>{const v=row[name],e=expected[i][j];if(e===null)assert.equal(v,null,JSON.stringify(p)+': '+j);else assert.ok(typeof v==='number'&&Math.abs(v-e)<1e-8*Math.max(1,Math.abs(e)),JSON.stringify(p)+`: row ${j}: ${v} != ${e}`);});});});

test('sorted EWM rejects invalid calendar labels even in a one-row group',()=>{assert.throws(()=>applyOperation([{g:'A',t:'2025-02-29',x:1,y:2}],columns,{type:'ewm',params:{columns:['x'],groups:['g'],order:'sorted',orderColumn:'t'}}),/invalidDate/);});
