import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {applyOperation} from '../src/homework/hw03/model.mjs';
const rows=[{label:'A',x:1,y:8,constant:2},{label:'A',x:2,y:null,constant:2},{label:'B',x:2,y:3,constant:2},{label:null,x:null,y:2,constant:2},{label:'C',x:10,y:1,constant:2}];
const columns=['label','x','y','constant'];
const python=process.env.PANDAS_PYTHON??'python3';
const reference=spawnSync(python,['-c',`
import pandas as pd,json,sys
p=pd.DataFrame(json.load(sys.stdin)); out={}
def records(df):return json.loads(df.to_json(orient='records',double_precision=15))
for method in ['pearson','spearman']:
 out[method]=records(p[['x','y','constant']].corr(method=method).rename_axis('field').reset_index())
out['covariance']=records(p[['x','y','constant']].cov().rename_axis('field').reset_index())
out['covariance0']=records(p[['x','y','constant']].cov(ddof=0).rename_axis('field').reset_index())
out['covariance_complete0']=records(p[['x','y']].dropna().cov(ddof=0).rename_axis('field').reset_index())
for mode in ['linear','lower','higher','midpoint','nearest']:
 out['q_'+mode]=records(p[['x','y']].quantile(.25,interpolation=mode).rename('value').rename_axis('field').reset_index())
out['categorical']=records(p[['label']].describe().T.reset_index().rename(columns={'index':'field'}))
out['describe']=records(p[['x','y']].describe().T.reset_index().rename(columns={'index':'field','25%':'q1','50%':'median','75%':'q3'}))
for include in [False,True]:
 v=p[['label','x']].value_counts(dropna=not include,sort=False)
 out['frequency_'+str(include)]=records(v.rename('count').reset_index())
s=p.x;q1=s.quantile(.25);q3=s.quantile(.75);lower=q1-1.5*(q3-q1);upper=q3+1.5*(q3-q1)
out['clip']=records(p.assign(x=s.clip(lower,upper)))
out['remove']=records(p[~((s<lower)|(s>upper))])
print(json.dumps(out))
`],{input:JSON.stringify(rows),encoding:'utf8'});
const skip=reference.status!==0?`Set PANDAS_PYTHON to enable pandas comparison: ${reference.stderr?.slice(-150)}`:false;
function approximately(actual,expected){
  if(typeof expected==='number'){assert.equal(typeof actual,'number');assert.ok(Math.abs(actual-expected)<1e-10*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);}
  else if(Array.isArray(expected)){assert.equal(actual.length,expected.length);expected.forEach((v,i)=>approximately(actual[i],v));}
  else if(expected&&typeof expected==='object'){for(const [k,v]of Object.entries(expected))approximately(actual[k],v);}
  else assert.equal(actual,expected);
}
const run=(type,params)=>applyOperation(rows,columns,{type,params});
test('pandas differential: pairwise Pearson/Spearman/covariance with missing values and constants',{skip},()=>{
  const expected=JSON.parse(reference.stdout);for(const method of ['pearson','spearman','covariance'])approximately(run('correlation',{columns:['x','y','constant'],method}).rows,expected[method]);
});
test('pandas differential: all five quantile interpolation methods and describe',{skip},()=>{
  const expected=JSON.parse(reference.stdout);for(const interpolation of ['linear','lower','higher','midpoint','nearest'])approximately(run('quantiles',{columns:['x','y'],q:.25,interpolation}).rows,expected['q_'+interpolation]);
  approximately(run('describe',{columns:['x','y']}).rows,expected.describe);
  approximately(run('describe',{columns:['label']}).rows,expected.categorical);
});
test('pandas differential: joint value_counts including missing keys and IQR clipping/removal',{skip},()=>{
  const expected=JSON.parse(reference.stdout),sorted=records=>records.slice().sort((a,b)=>JSON.stringify([a.label,a.x]).localeCompare(JSON.stringify([b.label,b.x])));
  for(const include of [false,true])approximately(sorted(run('frequencies',{columns:['label','x'],missing:include?'include':'exclude'}).rows),sorted(expected['frequency_'+(include?'True':'False')]));
  approximately(run('iqr',{column:'x',mode:'clip'}).rows,expected.clip);approximately(run('iqr',{column:'x',mode:'remove'}).rows,expected.remove);
});

test('pandas differential: covariance ddof applies only to complete selected data',{skip},()=>{
  const expected=JSON.parse(reference.stdout);
  approximately(run('correlation',{columns:['x','y','constant'],method:'covariance',ddof:0}).rows,expected.covariance0);
  approximately(applyOperation(rows.filter(r=>r.x!=null&&r.y!=null),columns,{type:'correlation',params:{columns:['x','y'],method:'covariance',ddof:0}}).rows,expected.covariance_complete0);
});
