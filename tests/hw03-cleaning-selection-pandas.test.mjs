import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {applyOperation} from '../src/homework/hw03/model.mjs';
const rows=[{id:'a',g:'A',x:null,y:10},{id:'b',g:'B',x:2,y:null},{id:'c',g:'A',x:3,y:30},{id:'d',g:'A',x:null,y:null},{id:'e',g:'B',x:2,y:40},{id:'f',g:null,x:null,y:60}];
const columns=['id','g','x','y'];
const python=process.env.PANDAS_PYTHON??'python3';
const reference=spawnSync(python,['-c',`
import pandas as pd,json,sys
p=pd.DataFrame(json.load(sys.stdin));out={}
def records(df):return json.loads(df.to_json(orient='records',double_precision=15))
out['sort']=records(p.sort_values(['g','y'],ascending=[True,False],kind='stable'))
out['sort_first']=records(p.sort_values('x',ascending=False,na_position='first',kind='stable'))
out['tree']=records(p[p.g.isin(['A','B'])&((p.x>2)|p.y.between(35,45))])
for keep in ['first','last',False]:
 out['dedup_'+str(keep)]=records(p.drop_duplicates(['g','x'],keep=keep))
 out['mark_'+str(keep)]=records(p.assign(dup=p.duplicated(['g','x'],keep=keep)))
for keep in ['first','last','all']:
 for n in [2,5,6,10]:out['top_'+keep+'_'+str(n)]=records(p.nlargest(n,'x',keep=keep))
for how in ['any','all']:out['drop_'+how]=records(p.dropna(subset=['x','y'],how=how))
out['threshold']=records(p.dropna(subset=['x','y'],thresh=1))
out['slice']=records(p.iloc[1:-1:2]);out['reverse']=records(p.iloc[::-1]);out['positions']=records(p.iloc[[-1,0,0]])
for method in ['mean','median']:
 out['group_'+method]=records(p.assign(x=p.groupby('g',dropna=False).x.transform(lambda s:s.fillna(getattr(s,method)()))))
for method in ['ffill','bfill']:
 out[method]=records(p.assign(x=getattr(p.x,method)(limit=1)))
 out['group_'+method]=records(p.assign(x=p.groupby('g',dropna=False).x.transform(lambda s:getattr(s,method)())))
for direction in ['forward','backward','both']:
 out['interpolate_'+direction]=records(p.assign(x=p.x.interpolate(limit_direction=direction,limit=1)))
grid=pd.DataFrame([{'id':'a','x':3,'y':2},{'id':'b','x':3,'y':2},{'id':'c','x':3,'y':None},{'id':'d','x':1,'y':1},{'id':'e','x':1,'y':1},{'id':'f','x':None,'y':2},{'id':'g','x':None,'y':None},{'id':'h','x':3,'y':3}])
out['top_grid']={}
for keys in [['x'],['x','y']]:
 for direction in ['ascending','descending']:
  for keep in ['first','last','all']:
   for n in range(1,11):out['top_grid'][json.dumps([keys,direction,keep,n],separators=(',',':'))]=getattr(grid,'nlargest' if direction=='descending' else 'nsmallest')(n,keys,keep=keep).id.tolist()
print(json.dumps(out))
`],{input:JSON.stringify(rows),encoding:'utf8'});
const skip=reference.status!==0?`pandas unavailable; set PANDAS_PYTHON (${reference.stderr?.slice(-150)})`:false;
const run=(type,params)=>applyOperation(rows,columns,{type,params}).rows;
function near(actual,expected){if(typeof expected==='number'){assert.equal(typeof actual,'number');assert.ok(Math.abs(actual-expected)<1e-10*Math.max(1,Math.abs(expected)));}else if(Array.isArray(expected)){assert.equal(actual.length,expected.length);expected.forEach((v,i)=>near(actual[i],v));}else if(expected&&typeof expected==='object'){for(const[k,v]of Object.entries(expected))near(actual[k],v);}else assert.equal(actual,expected);}
test('pandas differential: nested boolean selection, stable multikey sort, position slices',{skip},()=>{
 const e=JSON.parse(reference.stdout);near(run('sort',{keys:[{column:'g'},{column:'y',desc:true}]}),e.sort);near(run('sort',{column:'x',desc:true,missing:'first'}),e.sort_first);
 near(run('filterTree',{tree:{mode:'and',children:[{column:'g',operator:'isin',values:['A','B']},{mode:'or',children:[{column:'x',operator:'gt',value:2},{column:'y',operator:'range',value:35,upper:45}]}]}}),e.tree);
 near(run('rowSelect',{mode:'slice',start:1,end:-1,step:2}),e.slice);near(run('rowSelect',{mode:'slice',step:-1}),e.reverse);near(run('rowSelect',{mode:'positions',positions:[-1,0,0]}),e.positions);
});
test('pandas differential: subset dedup and duplicate flags for all retention rules',{skip},()=>{
 const e=JSON.parse(reference.stdout);for(const keep of ['first','last','none']){const key=keep==='none'?'False':keep;near(run('dedup',{columns:['g','x'],keep}),e['dedup_'+key]);near(run('dedup',{columns:['g','x'],keep,mode:'mark',name:'dup'}),e['mark_'+key]);}
});
test('pandas differential: Top N ties and missing values across small and large N',{skip},()=>{
 const e=JSON.parse(reference.stdout);for(const keep of ['first','last','all'])for(const count of [2,5,6,10])near(run('topN',{columns:['x'],direction:'descending',count,keep}),e['top_'+keep+'_'+count]);
});
test('pandas differential: missing rules and group-local filling',{skip},()=>{
 const e=JSON.parse(reference.stdout);for(const how of ['any','all'])near(run('dropMissing',{columns:['x','y'],how}),e['drop_'+how]);near(run('dropMissing',{columns:['x','y'],how:'threshold',threshold:1}),e.threshold);
 for(const method of ['mean','median','ffill','bfill'])near(run('fill',{columns:['x'],groups:['g'],method}),e['group_'+method]);
 for(const method of ['ffill','bfill'])near(run('fill',{column:'x',method,limit:1}),e[method]);
 for(const direction of ['forward','backward','both'])near(run('fill',{column:'x',method:'interpolate',direction,limit:1}),e['interpolate_'+direction]);
});

test('pandas differential: 120 Top N combinations cover multimetric boundary groups and NaN overflow',{skip},()=>{
 const fixture=[{id:'a',x:3,y:2},{id:'b',x:3,y:2},{id:'c',x:3,y:null},{id:'d',x:1,y:1},{id:'e',x:1,y:1},{id:'f',x:null,y:2},{id:'g',x:null,y:null},{id:'h',x:3,y:3}];
 for(const [key,expected]of Object.entries(JSON.parse(reference.stdout).top_grid)){const [columns,direction,keep,count]=JSON.parse(key);assert.deepEqual(applyOperation(fixture,['id','x','y'],{type:'topN',params:{columns,direction,keep,count}}).rows.map(r=>r.id),expected,key);}
});
