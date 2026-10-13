import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';
const rows=[{g:'A',t:'2025-01-03',x:4},{g:'B',t:'2025-01-01',x:2},{g:'A',t:'2025-01-01',x:1},{g:'A',t:'2025-01-02',x:null},{g:'B',t:'2025-01-02',x:0},{g:null,t:'2025-01-01',x:8},{g:'A',t:'2025-01-03',x:6}],columns=['g','t','x'];
const run=(params,data=rows)=>applyOperation(data,columns,{type:'windows',params:{columns:['x'],...params}});
test('window grouping, sorting and original-row alignment',()=>{const before=JSON.stringify(rows),r=run({groups:['g'],order:'sorted',orderColumn:'t',window:2,minPeriods:1,method:'rolling'});assert.deepEqual(r.rows.map(r=>r.x_rolling_mean),[4,2,1,1,1,null,5]);assert.equal(JSON.stringify(rows),before);assert.equal(r.analysis.groups.length,2);});
test('shift, lead, missing propagation and cumulative skip rules',()=>{assert.deepEqual(run({method:'shift',groups:['g'],periods:-1}).rows.map(r=>r.x_shift),[1,0,null,6,null,null,null]);assert.deepEqual(run({method:'cumsum',groups:['g']}).rows.map(r=>r.x_cumsum),[4,2,5,null,2,null,11]);assert.deepEqual(run({method:'cumsum',groups:['g'],skipMissing:'exclude'}).rows.map(r=>r.x_cumsum),[4,2,5,null,2,null,null]);assert.equal(run({method:'pct_change',periods:1}).rows[5].x_pct_change,null);});
test('time windows require valid monotonic dates and support duplicate timestamps',()=>{assert.throws(()=>run({method:'rolling',unit:'days',timeColumn:'t',window:2,groups:['g']}),/windowTimeOrder/);const r=run({method:'rolling',unit:'days',timeColumn:'t',window:2,groups:['g'],order:'sorted',orderColumn:'t'});assert.equal(r.rows[6].x_rolling_mean,5);});
test('window validation, metadata sampling, column collisions and backup replay',()=>{assert.throws(()=>run({method:'rolling',window:2,minPeriods:3}),/invalidNumber/);assert.throws(()=>run({method:'shift',periods:.5}),/invalidNumber/);assert.throws(()=>run({method:'rolling',q:2}),/invalidNumber/);const many=Array.from({length:10000},(_,i)=>({g:'A',t:'2025-01-01',x:i})),r=run({method:'expanding'},many);assert.ok(r.analysis.groups[0].points.length<=502);assert.equal(r.rows.at(-1).x_expanding_mean,4999.5);const op={type:'windows',params:{columns:['x'],method:'rolling',window:2}};assert.equal(validateBackup({version:1,datasets:[{id:'d',name:'d.json',format:'json',raw:JSON.stringify(rows)}],active:'d',operations:[op],cursor:1}).operations[0].type,'windows');});
const configs=[];for(const aggregate of ['sum','mean','median','count','min','max','std','var','quantile'])for(const window of [0,1,2,4])for(const minPeriods of ['',0,1])for(const center of ['exclude','include'])for(const closed of ['right','left','both','neither'])if(minPeriods===''||minPeriods<=window)configs.push({method:'rolling',aggregate,window,minPeriods,center,closed,q:.25,ddof:1});
for(const aggregate of ['sum','mean','median','count','min','max','std','var','quantile'])for(const window of [0,1,2])for(const center of ['exclude','include'])for(const closed of ['right','left','both','neither'])configs.push({method:'rolling',aggregate,window,unit:'days',timeColumn:'t',groups:['g'],missing:'include',order:'sorted',orderColumn:'t',center,closed,q:.75,ddof:0});
for(const method of ['shift','diff','pct_change'])for(const periods of [-2,-1,0,1,3,10])for(const groups of [[],['g']])configs.push({method,periods,groups,missing:'include'});
for(const method of ['cumsum','cumprod','cummin','cummax'])for(const skipMissing of ['include','exclude'])for(const groups of [[],['g']])configs.push({method,skipMissing,groups});
for(const aggregate of ['sum','mean','median','count','min','max','std','var','quantile'])for(const minPeriods of [0,1,3])configs.push({method:'expanding',aggregate,minPeriods,groups:['g'],q:.4,ddof:0});
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pandas'],{encoding:'utf8'}),reference=spawnSync(python,['-c',`import pandas as pd,json,sys
v=json.load(sys.stdin);df=pd.DataFrame(v['rows']);out=[]
for p in v['configs']:
 result=pd.Series(float('nan'),index=df.index)
 groups=df.groupby(p['groups'],dropna=p.get('missing')!='include',sort=False).indices.values() if p.get('groups') else [list(df.index)]
 for indices in groups:
  indices=list(indices)
  if p.get('order')=='sorted':indices=sorted(indices,key=lambda i:df.loc[i,p['orderColumn']])
  s=df.loc[indices,'x'].reset_index(drop=True);method=p['method']
  if method in ['rolling','expanding']:
   minimum=p.get('minPeriods');minimum=None if minimum=='' or minimum is None else minimum
   if method=='rolling':
    window=p['window']
    if p.get('unit')=='days':s.index=pd.DatetimeIndex(pd.to_datetime(df.loc[indices,p['timeColumn']])).rename(None);window=pd.Timedelta(days=window)
    r=s.rolling(window,min_periods=minimum,center=p.get('center')=='include',closed=p.get('closed','right'))
   else:r=s.expanding(min_periods=minimum if minimum is not None else 1)
   agg=p.get('aggregate','mean');kw={'ddof':p.get('ddof',1)} if agg in ['std','var'] else {'q':p.get('q',.5)} if agg=='quantile' else {};a=getattr(r,agg)(**kw)
  elif method in ['shift','diff','pct_change']:
   kw={'periods':p.get('periods',1)}
   if method=='pct_change':kw['fill_method']=None
   a=getattr(s,method)(**kw)
  else:a=getattr(s,method)(skipna=p.get('skipMissing')!='exclude')
  result.loc[indices]=a.to_numpy()
 out.append(json.loads(result.to_json(orient='values',double_precision=15)))
print(json.dumps(out))`],{input:JSON.stringify({rows,configs}),encoding:'utf8',maxBuffer:10*1024*1024});const skip=available.status!==0?`pandas unavailable: ${available.stderr?.slice(-200)}`:false;
test('pandas differential: fixed/time rolling, centered boundaries, count/min_periods, expanding, shifts and group cumulatives',{skip},()=>{assert.equal(reference.status,0,reference.stderr);const expected=JSON.parse(reference.stdout);configs.forEach((p,i)=>{const r=run(p),name=r.columns.at(-1),actual=r.rows.map(row=>row[name]);try{assert.equal(actual.length,expected[i].length);actual.forEach((value,j)=>{const e=expected[i][j];if(e==null)assert.equal(value,null);else{assert.equal(typeof value,'number');assert.ok(Math.abs(value-e)<1e-9*Math.max(1,Math.abs(e)),`${value} != ${e} at row ${j}`);}});}catch(e){throw new Error(`${JSON.stringify(p)}: ${e.message}`);}});});
test('large windows remain exact without rescanning every prior value',()=>{const data=Array.from({length:100000},(_,x)=>({g:'A',t:'2025-01-01',x}));const r=run({method:'rolling',aggregate:'mean',window:100000,minPeriods:1},data);assert.equal(r.rows.at(-1).x_rolling_mean,49999.5);const v=run({method:'rolling',aggregate:'median',window:128,minPeriods:128},data.slice(0,10000));assert.equal(v.rows.at(-1).x_rolling_median,9935.5);});
test('time windows reject calendar rollovers and sort zoned timestamps chronologically',()=>{assert.throws(()=>run({method:'rolling',unit:'days',timeColumn:'t'},[{g:'A',t:'2025-02-29',x:1}]),/windowTimeOrder/);const data=[{g:'A',t:'2025-01-01T01:00:00+02:00',x:2},{g:'A',t:'2024-12-31T23:30:00Z',x:4}],r=run({method:'rolling',unit:'hours',timeColumn:'t',order:'sorted',orderColumn:'t',window:1},data);assert.deepEqual(r.rows.map(r=>r.x_rolling_mean),[2,3]);});
