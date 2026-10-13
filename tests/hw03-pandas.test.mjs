import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {applyOperation} from '../src/homework/hw03/model.mjs';
const python=process.env.PANDAS_PYTHON??'python3';
const rows=[{id:'a',x:3,text:' A '},{id:'b',x:null,text:null},{id:'c',x:1,text:'B'},{id:'d',x:3,text:'ABC'}];
const script=`
import pandas as pd,json,sys
rows=json.load(sys.stdin)
df=pd.DataFrame(rows)
outputs={}
outputs['rename']=df.rename(columns={'text':'label'})
outputs['keep']=df[['text','id']]
outputs['drop']=df.drop(columns=['text'])
outputs['strip']=df.assign(text=df.text.str.strip())
outputs['replace']=df.assign(text=df.text.str.replace('A','$&',regex=False))
outputs['convert']=df.assign(text=pd.to_numeric(df.text,errors='coerce'))
outputs['values']=df.assign(x=df.x.replace(3,9))
for method in ['average','min','max','dense','first']:
 outputs[method]=df.assign(r=df.x.rank(method=method))
print(json.dumps({k:json.loads(v.to_json(orient='records')) for k,v in outputs.items()}))
`;
const reference=spawnSync(python,['-c',script],{input:JSON.stringify(rows),encoding:'utf8'});
test('pandas differential: schema, text, numeric coercion, replacement and all tie rules',{skip:reference.status!==0?`pandas unavailable: set PANDAS_PYTHON (${reference.stderr?.slice(-150)??reference.error?.message})`:false},()=>{
  const expected=JSON.parse(reference.stdout), run=(type,params)=>applyOperation(rows,['id','x','text'],{type,params}).rows;
  const cases={rename:['rename',{column:'text',name:'label'}],keep:['columns',{columns:['text','id'],mode:'keep'}],drop:['columns',{columns:['text'],mode:'drop'}],strip:['text',{column:'text',method:'strip'}],replace:['text',{column:'text',method:'replace',find:'A',replacement:'$&'}],convert:['convert',{column:'text',target:'number',errors:'coerce'}],values:['replace',{column:'x',find:'3',replacement:'9',target:'number'}]};
  for(const method of ['average','min','max','dense','first'])cases[method]=['rank',{column:'x',name:'r',method}];
  for(const [name,[type,params]] of Object.entries(cases))assert.deepEqual(run(type,params),expected[name],name);
});
