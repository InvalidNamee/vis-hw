import {pandasReference} from './helpers/pandas-reference.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {windowOperation} from '../src/homework/hw03/windows.mjs';import {weightedWindowOperation,windowWeights} from '../src/homework/hw03/weighted-window.mjs';
const xs=[1,null,4,3,7,2,null,9],ys=[2,3,null,1,5,4,8,7],rows=xs.map((x,i)=>({x,y:ys[i],t:new Date(Date.UTC(2025,0,1)+i*86400000).toISOString()})),columns=['x','y','t'];
test('weighted windows bound work and pair windows use jointly valid observations',()=>{assert.deepEqual(windowWeights(3,'triang'),[.5,1,.5]);assert.throws(()=>weightedWindowOperation(Array(1000).fill({x:1}),['x'],{params:{columns:['x'],window:100000}}),/weightedWorkLimit/);assert.throws(()=>weightedWindowOperation(rows,columns,{params:{columns:['x'],kind:'gaussian',std:0}}),/invalidNumber/);assert.equal(windowOperation(rows,columns,{params:{columns:['x'],other:'y',aggregate:'corr',window:4,minPeriods:2}}).rows[3].x_rolling_corr,-1);});
const python=process.env.PANDAS_PYTHON??'python3',ready=spawnSync(python,['-c','import pandas,scipy'],{encoding:'utf8',timeout:20000}),cases=[];
for(const method of ['rolling','expanding'])for(const aggregate of ['cov','corr'])for(const window of [2,4])for(const center of ['include','exclude'])for(const ddof of [0,1,2])for(const minPeriods of [0,2])cases.push({type:'windows',method,aggregate,window,center,ddof,minPeriods});
for(const kind of ['boxcar','triang','hann','hamming','bartlett','blackman','gaussian'])for(const method of ['sum','mean','var','std'])for(const window of [1,2,3,4,7])for(const center of ['include','exclude'])for(const minPeriods of [0,1])cases.push({type:'weightedWindow',kind,method,window,center,minPeriods,std:1.5});
test(`pandas/SciPy differential: ${cases.length} rolling/expanding cov/corr and seven weighted window shapes`,{skip:ready.status!==0?'pandas/scipy unavailable':false},()=>{const py=pandasReference(python,String.raw`import pandas as pd,json,sys
x=json.load(sys.stdin);a=pd.Series(x['xs'],dtype='float64');b=pd.Series(x['ys'],dtype='float64');out=[]
for c in x['cases']:
 if c['type']=='windows':
  w=a.expanding(min_periods=c['minPeriods']) if c['method']=='expanding' else a.rolling(c['window'],min_periods=c['minPeriods'],center=c['center']=='include')
  r=getattr(w,c['aggregate'])(b,ddof=c['ddof'])
 else:
  w=a.rolling(c['window'],win_type=c['kind'],min_periods=c['minPeriods'],center=c['center']=='include');r=getattr(w,c['method'])(**({'std':c['std']} if c['kind']=='gaussian' else {}))
 out.append(json.loads(r.to_json(orient='values',double_precision=15)))
print(json.dumps(out))`,{xs,ys,cases});assert.equal(py.status,0,py.stderr);JSON.parse(py.stdout).forEach((expected,i)=>{const c=cases[i],r=(c.type==='windows'?windowOperation:weightedWindowOperation)(rows,columns,{params:{...c,columns:['x'],other:'y'}}),name=r.analysis.specs[0].name;const actual=r.rows.map(r=>r[name]);actual.forEach((v,j)=>v==null||expected[j]==null?assert.equal(v,expected[j],JSON.stringify(c)):assert.ok((c.method==='std'?Math.abs(v*v-expected[j]*expected[j])<1e-9*Math.max(1,expected[j]*expected[j]):Math.abs(v-expected[j])<1e-9*Math.max(1,Math.abs(expected[j]))),JSON.stringify({c,v,expected:expected[j]})));});});
