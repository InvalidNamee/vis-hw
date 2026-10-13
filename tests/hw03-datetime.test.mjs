import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';import {dateParser,dateParts} from '../src/homework/hw03/datetime.mjs';
const data=[{g:'B',t:'2024-03-01T00:00:00Z',s:'2024-02-29T12:00:00Z',x:4},{g:'A',t:'2024-02-27T12:30:00Z',s:'2024-02-27T12:00:00Z',x:2},{g:'A',t:'2024-03-01T00:00:00Z',s:null,x:8},{g:'A',t:'2024-02-27T12:30:00Z',s:'2024-02-26T00:00:00Z',x:null},{g:'B',t:'2024-03-03T23:00:00Z',s:'2024-03-03T23:30:00Z',x:6},{g:null,t:'2024-02-29T23:30:00Z',s:'2024-02-29T22:00:00Z',x:5},{g:'A',t:null,s:'2024-01-01',x:10}],columns=['g','t','s','x'];const run=(type,params,rows=data)=>applyOperation(rows,columns,{type,params:{column:'t',...params}});
test('strict custom date formats, source/target zones and DST ambiguity',()=>{const p=dateParser({format:'%d/%m/%Y %H:%M',sourceZone:'Asia/Shanghai'});assert.equal(new Date(p('29/02/2024 08:30')).toISOString(),'2024-02-29T00:30:00.000Z');assert.throws(()=>p('29/02/2025 08:30'),/invalidDate/);assert.throws(()=>dateParser({sourceZone:'invalid-zone'}),/invalidTimezone/);assert.throws(()=>dateParser({sourceZone:'America/New_York'})('2024-11-03T01:30:00'),/ambiguousTime/);assert.equal(new Date(dateParser({sourceZone:'America/New_York',ambiguous:'earliest'})('2024-11-03T01:30:00')).toISOString(),'2024-11-03T05:30:00.000Z');assert.equal(new Date(dateParser({sourceZone:'America/New_York',ambiguous:'latest'})('2024-11-03T01:30:00')).toISOString(),'2024-11-03T06:30:00.000Z');assert.throws(()=>dateParser({sourceZone:'America/New_York'})('2024-03-10T02:30:00'),/nonexistentTime/);assert.equal(dateParser({sourceZone:'America/New_York',errors:'coerce'})('2024-03-10T02:30:00'),null);assert.equal(new Date(dateParser({sourceZone:'+08:00'})('2024-01-01')).toISOString(),'2023-12-31T16:00:00.000Z');});
test('date parts, milliseconds, signed differences and source immutability',()=>{const before=JSON.stringify(data),r=run('dateparts',{parts:['year','month','day','weekday','daysinmonth','is_leap_year'],zone:'Asia/Shanghai'});assert.equal(r.rows[5].date_month,3);assert.equal(r.rows[0].date_weekday,4);assert.equal(r.rows[1].date_daysinmonth,29);assert.equal(r.rows[1].date_is_leap_year,true);assert.equal(JSON.stringify(data),before);const diff=run('datediff',{other:'s',unit:'hours'});assert.equal(diff.rows[0].date_difference,12);assert.equal(diff.rows[4].date_difference,-.5);const parsed=run('dateparse',{},[{g:'A',t:'2024-01-01T00:00:00.123456+08:00',s:null,x:1}]);assert.equal(parsed.rows[0].parsed_date,'2023-12-31T16:00:00.123Z');});
test('calendar gaps, output capacity, invalid aggregation and backup replay',()=>{const op={type:'resample',params:{column:'t',columns:['x'],methods:['sum','mean'],frequency:'day',groups:['g'],gaps:'include'}};const r=run(op.type,op.params);assert.equal(r.rows.find(row=>row.g==='A'&&row.period.startsWith('2024-02-28')).x_sum,0);assert.equal(r.rows.find(row=>row.g==='A'&&row.period.startsWith('2024-02-28')).x_mean,null);assert.equal(r.analysis.excludedDates,1);assert.equal(r.analysis.excludedKeys,1);assert.throws(()=>run('resample',{columns:['x'],methods:['invalid']}),/missingColumn/);assert.throws(()=>run('resample',{columns:['x'],methods:['mean'],frequency:'minute'},[{g:'A',t:'2024-01-01',s:null,x:1},{g:'A',t:'2025-01-01',s:null,x:1}]),/tooManyRows/);const b=validateBackup({version:1,datasets:[{id:'d',name:'dates',raw:JSON.stringify(data),format:'json'}],active:'d',operations:[op],cursor:1});assert.equal(b.cursor,1);});
const configs=[];for(const frequency of ['hour','day','week','month','quarter','year'])for(const zone of ['UTC','Asia/Shanghai','America/New_York'])for(const closed of ['left','right'])for(const label of ['left','right'])for(const gaps of ['include','exclude'])configs.push({frequency,zone,closed,label,gaps,columns:['x'],methods:['sum','mean','count','size','std','var','min','max','first','last','prod','nunique'],groups:['g'],missing:'include'});
for(const every of [7,25])for(const origin of ['epoch','start_day','start'])configs.push({frequency:'hour',every,origin,columns:['x'],methods:['sum','mean'],groups:['g']});
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pandas'],{encoding:'utf8'}),ref=available.status===0?spawnSync(python,['-c',String.raw`
import json,sys,pandas as pd
x=json.load(sys.stdin);df=pd.DataFrame(x['rows']);df.t=pd.to_datetime(df.t,format='ISO8601',utc=True);out=[]
for p in x['configs']:
 d=df.copy();d.t=d.t.dt.tz_convert(p.get('zone','UTC'));d=d.dropna(subset=['t']);cols=['g','period']+[c+'_'+m for c in p['columns'] for m in p['methods']];records=[]
 freq={'hour':str(p.get('every',1))+'h','day':'D','week':'W-MON','month':'MS','quarter':'QS','year':'YS'}[p['frequency']]
 for g,group in d.groupby('g',dropna=p.get('missing')!='include'):
  rs=group.set_index('t').resample(freq,closed=p.get('closed','left'),label=p.get('label','left'),origin=p.get('origin','start_day'))
  r=rs[p['columns']].agg(p['methods']);r.columns=[c+'_'+m for c,m in r.columns]
  if p.get('gaps')=='exclude':r=r[rs.size()>0]
  for t,row in r.iterrows():records.append([None if pd.isna(g) else g,t.tz_convert('UTC').isoformat().replace('+00:00','.000Z')]+[None if pd.isna(row[c]) else row[c] for c in cols[2:]])
 out.append(records)
print(json.dumps(out))
`],{input:JSON.stringify({rows:data,configs}),encoding:'utf8',maxBuffer:30*1024*1024}):null;
test(`pandas differential: ${configs.length} grouped resampling configurations`,{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(ref.status,0,ref.stderr);const expected=JSON.parse(ref.stdout);configs.forEach((p,i)=>{const r=run('resample',p),actual=r.rows.map(row=>r.columns.map(c=>row[c]));assert.equal(actual.length,expected[i].length,JSON.stringify(p));actual.forEach((values,j)=>values.forEach((v,k)=>{const e=expected[i][j][k];if(typeof e==='number')assert.ok(typeof v==='number'&&Math.abs(v-e)<1e-9*Math.max(1,Math.abs(e)),JSON.stringify(p)+`: row ${j}, col ${k}: ${v} != ${e}`);else assert.equal(v,e,JSON.stringify(p));}));});});
const dateRef=available.status===0?spawnSync(python,['-c',String.raw`
import pandas as pd,json,sys
x=json.load(sys.stdin);s=pd.to_datetime(pd.Series([r['t'] for r in x['rows']]),format='ISO8601',utc=True);out=[]
for zone in x['zones']:
 d=s.dt.tz_convert(zone);iso=d.dt.isocalendar();a=[]
 for p in x['parts']:
  v=iso['week' if p=='week' else 'year'] if p in ['week','weekyear'] else getattr(d.dt,p)
  a.append(json.loads(v.to_json(orient='values')))
 out.append(list(map(list,zip(*a))))
print(json.dumps(out))
`],{input:JSON.stringify({rows:data,zones:['UTC','Asia/Shanghai','America/New_York'],parts:dateParts}),encoding:'utf8',maxBuffer:10*1024*1024}):null;
test('pandas date parts in three calendar zones',{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(dateRef.status,0,dateRef.stderr);const expected=JSON.parse(dateRef.stdout);['UTC','Asia/Shanghai','America/New_York'].forEach((zone,i)=>{const r=run('dateparts',{parts:dateParts,zone});assert.deepEqual(r.rows.map(row=>dateParts.map(p=>row['date_'+p])),expected[i]);});});
const transitions=['2024-03-09T12:00:00Z','2024-03-10T05:00:00Z','2024-03-10T06:30:00Z','2024-03-10T07:30:00Z','2024-03-11T04:00:00Z','2024-11-02T12:00:00Z','2024-11-03T05:30:00Z','2024-11-03T06:30:00Z','2024-11-04T05:00:00Z'].map((t,i)=>({g:i<5?'spring':'fall',t,s:null,x:i})),transitionConfigs=[];
for(const frequency of ['hour','day','week','month'])for(const zone of ['America/New_York','Asia/Kathmandu'])for(const origin of ['epoch','start_day','start'])transitionConfigs.push({frequency,zone,origin,every:7,columns:['x'],methods:['sum','mean'],groups:['g']});
const transitionRef=available.status===0?spawnSync(python,['-c',String.raw`
import json,sys,pandas as pd
x=json.load(sys.stdin);df=pd.DataFrame(x['rows']);df.t=pd.to_datetime(df.t,utc=True);out=[]
for p in x['configs']:
 d=df.copy();d.t=d.t.dt.tz_convert(p['zone']);records=[];freq={'hour':'7h','day':'D','week':'W-MON','month':'MS'}[p['frequency']]
 for g,group in d.groupby('g'):
  r=group.set_index('t').resample(freq,closed='left',label='left',origin=p['origin']).x.agg(['sum','mean'])
  for t,row in r.iterrows():records.append([g,t.tz_convert('UTC').isoformat().replace('+00:00','.000Z'),row['sum'],None if pd.isna(row['mean']) else row['mean']])
 out.append(records)
print(json.dumps(out))
`],{input:JSON.stringify({rows:transitions,configs:transitionConfigs}),encoding:'utf8',maxBuffer:20*1024*1024}):null;
test(`pandas DST resampling: ${transitionConfigs.length} spring/fall and non-hour offset calendars`,{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(transitionRef.status,0,transitionRef.stderr);const expected=JSON.parse(transitionRef.stdout);transitionConfigs.forEach((p,i)=>{const r=run('resample',p,transitions);assert.deepEqual(r.rows.map(row=>r.columns.map(c=>row[c])),expected[i],JSON.stringify(p));});});
const parsingCases=[{format:'%d/%m/%Y %H:%M',values:['29/02/2024 08:30','31/02/2024 00:00',null]},{format:'%Y%m%d%H%M%S',values:['20240101235959','20250229000000',null]},{format:'%Y-%m-%d %H:%M:%S.%f%z',values:['2024-01-01 00:00:00.123456+0800','2024-01-01 23:00:00.000001-0500',null]}];
const parsingRef=available.status===0?spawnSync(python,['-c',String.raw`
import pandas as pd,json,sys
x=json.load(sys.stdin);out=[]
for c in x:
 s=pd.to_datetime(pd.Series(c['values']),format=c['format'],errors='coerce',utc='%z' in c['format'])
 if '%z' not in c['format']:s=s.dt.tz_localize('Asia/Shanghai').dt.tz_convert('UTC')
 out.append([None if pd.isna(t) else int(t.value//1000000) for t in s])
print(json.dumps(out))
`],{input:JSON.stringify(parsingCases),encoding:'utf8'}):null;
test('pandas custom formats, coercion and explicit offsets at millisecond precision',{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(parsingRef.status,0,parsingRef.stderr);const expected=JSON.parse(parsingRef.stdout);parsingCases.forEach((c,i)=>assert.deepEqual(c.values.map(dateParser({format:c.format,errors:'coerce',sourceZone:'Asia/Shanghai'})),expected[i]));});
