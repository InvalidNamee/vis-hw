import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {applyOperation,validateBackup} from '../src/homework/hw03/model.mjs';
const rows=['AB-12-x','a-9','  one two  three  ','中文-😀','-12','+7','',null,'AB12 AB34','aaaa','a,,b,',' ab ','aaa','a a a a a'].map((s,i)=>({s,t:i%3?String(i):null})),columns=['s','t'];
const run=p=>applyOperation(rows,columns,{type:'strings',params:{column:'s',...p}});
test('split mapping retains source and pads missing parts',()=>{const before=JSON.stringify(rows),r=run({method:'split',pattern:'-'});assert.deepEqual(r.rows[0],{s:'AB-12-x',t:null,text_0:'AB',text_1:'12',text_2:'x'});assert.equal(r.rows[7].text_0,null);assert.equal(r.analysis.samples.length,14);assert.equal(JSON.stringify(rows),before);});
test('validation: capture groups, invalid patterns, collisions, widths, right regex split',()=>{assert.throws(()=>run({method:'extract',pattern:'abc'}),/regexGroups/);assert.throws(()=>run({method:'extract',pattern:'('}),/invalidRegex/);assert.throws(()=>run({method:'pad',name:'s'}),/duplicateColumns/);assert.throws(()=>run({method:'pad',fillChar:'ab'}),/invalidOperation/);assert.throws(()=>run({method:'rsplit',splitMode:'regex',pattern:'-'}),/invalidOperation/);assert.throws(()=>run({method:'regexReplace',pattern:'(a)',replacement:'\\2'}),/invalidRegex/);assert.throws(()=>run({method:'pad',width:10001}),/invalidNumber/);});
test('backup replays strings and preserves analysis',()=>{const op={type:'strings',params:{column:'s',method:'extract',pattern:'(?P<code>[A-Z]+)(\\d+)'}};const r=validateBackup({version:1,datasets:[{id:'d',name:'text',raw:JSON.stringify(rows),format:'json'}],active:'d',operations:[op],cursor:1});assert.equal(r.operations[0].params.pattern,op.params.pattern);assert.equal(run(op.params).rows[8].text_code,'AB');});
test('split expansion limits and special field names',()=>{assert.throws(()=>run({method:'split',pattern:'',splitMode:'literal'}),/invalidRegex/);const r=run({method:'cat',columns:['s','t'],name:'__proto__',missing:'include',naRep:'NA',separator:'|'});assert.equal(r.rows[0].__proto__,'AB-12-x|NA');assert.throws(()=>applyOperation([{s:Array(202).fill('x').join(',')}],['s'],{type:'strings',params:{column:'s',method:'split',pattern:','}}),/tooManyRows/);});
const configs=[];
for(const method of ['split','rsplit'])for(const splitMode of ['literal','whitespace',...(method==='split'?['regex']:[])])for(const n of [-1,0,1,2,4])for(const pattern of splitMode==='whitespace'?['']:splitMode==='literal'?['-',',','aa']:['[-,]','([-,])','\\s+','(?=a)'])configs.push({method,splitMode,n,pattern});
for(const pattern of ['([A-Z]+)(\\d+)','(?P<letters>[a-z]+)-(?P<digits>\\d+)','(a)?(b)','([😀中])'])for(const ignoreCase of ['exclude','include'])configs.push({method:'extract',pattern,ignoreCase});
for(const method of ['containsRegex','matchRegex','fullmatchRegex','countRegex'])for(const pattern of ['a+','[A-Z]+','.*','a|aaaa',''])for(const ignoreCase of ['exclude','include'])configs.push({method,pattern,ignoreCase});
for(const [pattern,replacement] of [['([A-Z]+)(\\d+)','\\2: \\1'],['(?P<letter>a)','\\g<letter>!'],['a','$$'],['(?=a)','X']])for(const n of [-1,0,1,2])configs.push({method:'regexReplace',pattern,replacement,n});
for(const method of ['pad','zfill'])for(const width of [0,2,3,4,5,6,9,10])for(const side of method==='pad'?['left','right','both']:['left'])configs.push({method,width,side,fillChar:'😀'});
for(const missing of ['exclude','include'])for(const separator of ['',' | '])configs.push({method:'cat',columns:['s','t'],separator,missing,naRep:'NA'});
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pandas'],{encoding:'utf8'}),reference=available.status===0?spawnSync(python,['-c',String.raw`
import pandas as pd,json,sys,re
x=json.load(sys.stdin);df=pd.DataFrame(x['rows']);df=df.replace('',None);out=[]
for p in x['configs']:
 s=df.s;m=p['method'];kw={};case=re.I if p.get('ignoreCase')=='include' else 0
 if m in ['split','rsplit']:
  pat=None if p['splitMode']=='whitespace' else p['pattern']
  if m=='split':r=s.str.split(pat,n=p['n'],expand=True,regex=p['splitMode']=='regex' if pat is not None else None)
  else:r=s.str.rsplit(pat,n=p['n'],expand=True)
 elif m=='extract':r=s.str.extract(p['pattern'],flags=case)
 elif m=='regexReplace':r=s.str.replace(p['pattern'],p['replacement'],n=p['n'],regex=True)
 elif m=='cat':r=s.str.cat(df.t,sep=p['separator'],na_rep=p['naRep'] if p['missing']=='include' else None)
 elif m=='pad':r=s.str.pad(p['width'],side=p['side'],fillchar=p['fillChar'])
 elif m=='zfill':r=s.str.zfill(p['width'])
 else:
  method={'containsRegex':'contains','matchRegex':'match','fullmatchRegex':'fullmatch','countRegex':'count'}[m]
  r=getattr(s.str,method)(p['pattern'],flags=case)
 if isinstance(r,pd.Series):r=r.to_frame()
 out.append(json.loads(r.to_json(orient='values',force_ascii=False)))
print(json.dumps(out,ensure_ascii=False))
`],{input:JSON.stringify({rows,configs}),encoding:'utf8',maxBuffer:10*1024*1024}):null;
test(`pandas differential: ${configs.length} string configurations`,{skip:available.status!==0?'pandas unavailable':false},()=>{assert.equal(reference.status,0,reference.stderr);const expected=JSON.parse(reference.stdout);configs.forEach((p,i)=>{const r=run(p),names=r.columns.slice(columns.length),actual=r.rows.map(row=>names.map(k=>row[k]));assert.deepEqual(actual,expected[i],JSON.stringify(p));});});

test('text guards apply before building oversized outputs; mixed non-text values stay missing',()=>{assert.throws(()=>applyOperation(Array.from({length:2200},()=>({s:'a'})),['s'],{type:'strings',params:{column:'s',method:'pad',width:10000}}),/stringOutputLimit/);const r=applyOperation([{s:123},{s:false},{s:'hi'}],['s'],{type:'strings',params:{column:'s',method:'zfill',width:4}});assert.deepEqual(r.rows.map(r=>r.text_result),[null,null,'00hi']);assert.throws(()=>applyOperation([{s:'a '.repeat(10000)}],['s'],{type:'strings',params:{column:'s',method:'split',splitMode:'whitespace'}}),/tooManyRows/);});
