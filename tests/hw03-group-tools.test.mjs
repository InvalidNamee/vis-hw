import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';
const rows=[{g:'B',x:4,y:2,s:'z'},{g:'A',x:2,y:1,s:'a'},{g:'B',x:4,y:0,s:'b'},{g:'A',x:null,y:8,s:null},{g:'A',x:1,y:1,s:'a'},{g:null,x:9,y:1,s:'z'},{g:'B',x:null,y:null,s:'b'}],columns=['g','x','y','s'];const run=(type,params)=>applyOperation(rows,columns,{type,params});
const specs=[{column:'x',method:'sum',name:'total'},{column:'x',method:'mean',name:'average'},{column:'y',method:'std',name:'spread'},{column:'s',method:'first',name:'first_text'}];
test('named aggregations independently select methods/names and transform original rows',()=>{const before=JSON.stringify(rows),a=run('groupMulti',{keys:['g'],specs});assert.deepEqual(a.columns,['g','total','average','spread','first_text']);assert.deepEqual(a.rows.map(r=>r.total),[3,8]);const b=run('groupMulti',{keys:['g'],specs,mode:'transform'});assert.deepEqual(b.rows.map(r=>r.total),[8,3,8,3,3,null,8]);assert.equal(JSON.stringify(rows),before);assert.throws(()=>run('groupMulti',{keys:['g'],specs:[{column:'x',method:'sum',name:'g'}]}),/duplicateColumns/);assert.throws(()=>run('groupMulti',{specs:[{column:'x',method:'invalid',name:'n'}]}),/invalidOperation/);});
test('group filters retain row order or null rejected rows',()=>{const p={keys:['g'],column:'x',method:'sum',operator:'gt',value:4},a=run('groupFilter',p);assert.deepEqual(a.rows.map(r=>r.g),['B','B','B']);const b=run('groupFilter',{...p,mode:'missing'});assert.equal(b.rows.length,rows.length);assert.deepEqual(b.rows[1],{g:null,x:null,y:null,s:null});assert.equal(b.analysis.passed,1);assert.equal(b.analysis.kept,3);});
test('group ranking heatmap, text rank, missing position and percentile denominator',()=>{const a=run('groupRank',{keys:['g'],columns:['x'],method:'dense',percent:'include'});assert.deepEqual(a.rows.map(r=>r.x_rank_pct),[1,1,1,null,.5,null,null]);const b=run('groupRank',{keys:['g'],columns:['s'],method:'first',placement:'top'});assert.deepEqual(b.rows.map(r=>r.s_rank),[3,2,1,1,3,null,2]);assert.equal(b.analysis.samples.length,rows.length);assert.throws(()=>run('groupRank',{keys:['g'],columns:['x'],method:'invalid'}),/invalidOperation/);});
test('group tools replay in backup',()=>{const ops=[{type:'groupMulti',params:{keys:['g'],specs,mode:'transform'}},{type:'groupRank',params:{keys:['g'],columns:['total'],percent:'include'}},{type:'groupFilter',params:{keys:['g'],column:'x',method:'mean',operator:'gte',value:2}}];assert.equal(validateBackup({version:1,datasets:[{id:'d',name:'groups',raw:JSON.stringify(rows),format:'json'}],active:'d',operations:ops,cursor:3}).cursor,3);});
const configs=[];for(const type of ['groupMulti','groupFilter','groupRank']){
 if(type==='groupMulti'){for(const missing of ['exclude','include'])for(const order of ['sorted','appearance'])for(const mode of ['summarize','transform'])for(const ddof of [0,1,2])configs.push({type,params:{keys:['g'],specs,missing,order,mode,ddof}});}
 if(type==='groupFilter'){for(const missing of ['exclude','include'])for(const mode of ['drop','missing'])for(const method of ['sum','mean','median','count','size','nunique','std','var'])for(const operator of ['gt','gte','lt','lte','eq','ne'])configs.push({type,params:{keys:['g'],column:'x',method,operator,value:2,missing,mode}});}
 if(type==='groupRank'){for(const missing of ['exclude','include'])for(const method of ['average','min','max','dense','first'])for(const placement of ['keep','top','bottom'])for(const percent of ['exclude','include'])for(const direction of ['ascending','descending'])configs.push({type,params:{keys:['g'],columns:['x','y','s'],method,placement,percent,direction,missing}});}
}
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pandas'],{encoding:'utf8'}),ref=available.status===0?spawnSync(python,['-c',String.raw`
import json,sys,pandas as pd
x=json.load(sys.stdin);df=pd.DataFrame(x['rows']);out=[]
for c in x['configs']:
 p=c['params'];g=df.groupby(p['keys'],dropna=p['missing']!='include',sort=p.get('order')!='appearance');kind=c['type']
 if kind=='groupMulti':
  if p['mode']=='summarize':
   r=g.agg(**{s['name']:pd.NamedAgg(column=s['column'],aggfunc=s['method']) for s in p['specs']}).reset_index()
   if p['ddof']!=1:
    for s in p['specs']:
     if s['method'] in ['std','var']:r[s['name']]=getattr(g[s['column']],s['method'])(ddof=p['ddof']).to_numpy()
  else:
   r=df.copy()
   for s in p['specs']:r[s['name']]=g[s['column']].transform(s['method'],**({'ddof':p['ddof']} if s['method'] in ['std','var'] else {}))
 elif kind=='groupFilter':
  def check(group):
   m=p['method'];v=len(group) if m=='size' else getattr(group[p['column']],m)();t=p['value'];op=p['operator']
   return bool({'gt':v>t,'gte':v>=t,'lt':v<t,'lte':v<=t,'eq':v==t,'ne':v!=t}[op])
  r=g.filter(check,dropna=p['mode']=='drop')
 else:
  r=df.copy();ranks=g[p['columns']].rank(method=p['method'],ascending=p['direction']=='ascending',na_option=p['placement'],pct=p['percent']=='include')
  for col in p['columns']:r[col+('_rank_pct' if p['percent']=='include' else '_rank')]=ranks[col]
 out.append({'columns':list(r.columns),'rows':json.loads(r.to_json(orient='values'))})
print(json.dumps(out))
`],{input:JSON.stringify({rows,configs}),encoding:'utf8',maxBuffer:20*1024*1024}):null;
test(`pandas differential: ${configs.length} named aggregations, group filters and ranks`,{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(ref.status,0,ref.stderr);const expected=JSON.parse(ref.stdout);configs.forEach((c,i)=>{const r=run(c.type,c.params),e=expected[i];assert.deepEqual(r.columns,e.columns,JSON.stringify(c));assert.equal(r.rows.length,e.rows.length,JSON.stringify(c));r.rows.forEach((row,j)=>r.columns.forEach((col,k)=>{const a=row[col],b=e.rows[j][k];if(typeof b==='number')assert.ok(typeof a==='number'&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),JSON.stringify(c)+`: ${j}/${col}: ${a} != ${b}`);else assert.equal(a,b,JSON.stringify(c)+`: ${j}/${col}`);}));});});

test('named special columns remain own properties and wide transforms fail before allocating',()=>{const result=run('groupMulti',{keys:['g'],specs:[{column:'x',method:'sum',name:'__proto__'}],mode:'transform'});assert.equal(result.rows[0].__proto__,8);assert.equal(Object.getPrototypeOf(result.rows[0]),Object.prototype);const columns=Array.from({length:100},(_,i)=>'c'+i),row=Object.fromEntries(columns.map(c=>[c,1]));assert.throws(()=>applyOperation(Array(10001).fill(row),columns,{type:'groupMulti',params:{keys:[],mode:'transform',specs:Array.from({length:100},(_,i)=>({column:'c'+i,method:'sum',name:'s'+i}))}}),/tooManyRows/);});
