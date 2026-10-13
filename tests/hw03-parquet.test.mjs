import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
import {readParquet,parquetCell,validateParquetMetadata} from '../src/homework/hw03/parquet.mjs';import {parseData,validateBackup} from '../src/homework/hw03/model.mjs';import {fetchDataFile} from '../src/homework/hw03/io.mjs';
const python=process.env.PANDAS_PYTHON??'python3',available=spawnSync(python,['-c','import pyarrow,pandas'],{encoding:'utf8'}),directory=mkdtempSync(join(tmpdir(),'hw03-parquet-'));
const generated=available.status===0?spawnSync(python,['-c',String.raw`
import sys,json,pyarrow as pa,pyarrow.parquet as pq,pandas as pd
from datetime import datetime,date,timezone
from decimal import Decimal
from pathlib import Path
out=Path(sys.argv[1])
t=pa.table({'id':['001','002','003'],'amount':[12.5,None,-3.0],'active':[True,False,None],'large':pa.array([9223372036854775807,-9223372036854775808,None],type=pa.int64()),'small':pa.array([1,2,None],type=pa.int64()),'day':pa.array([date(2024,2,29),None,date(2025,1,1)],type=pa.date32()),'naive':pa.array([datetime(2024,2,29,8,30),None,datetime(1969,12,31,23,59,59,999999)],type=pa.timestamp('us')),'utc':pa.array([datetime(2024,2,29,8,30,tzinfo=timezone.utc),None,datetime(2025,1,1,tzinfo=timezone.utc)],type=pa.timestamp('us','UTC')),'__proto__':['safe','ok','v']})
for codec in ['NONE','snappy','gzip','brotli','zstd','lz4']:pq.write_table(t,out/(codec+'.parquet'),compression=codec,row_group_size=2)
pq.write_table(pa.table({'list':[[1,2],[]]}),out/'nested.parquet')
pq.write_table(pa.table({'binary':[b'hello']}),out/'binary.parquet')
pq.write_table(pa.table({'x':pa.array([],type=pa.int64())}),out/'empty.parquet')
pq.write_table(pa.table({'x':range(100001)}),out/'large.parquet')
pq.write_table(pa.table({'decimal':pa.array([Decimal('1.25'),Decimal('-0.03')],type=pa.decimal128(10,2))}),out/'decimal.parquet')
df=pd.read_parquet(out/'snappy.parquet',dtype_backend='pyarrow');expected=[]
for row in df.to_dict(orient='records'):
 for key,value in list(row.items()):
  if value is None or value is pd.NA or value is pd.NaT:row[key]=None
  elif key=='large':row[key]=str(value)
  elif key=='day':row[key]=value.isoformat()
  elif key in ['naive','utc']:row[key]=pd.Timestamp(value).floor('ms').isoformat(timespec='milliseconds').replace('+00:00','Z')
 expected.append(row)
print(json.dumps(expected))
`,directory],{encoding:'utf8'}):null;
const read=name=>{const b=readFileSync(join(directory,name+'.parquet'));return readParquet(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
test('Parquet scalar conversion preserves int64, dates, missing and rejects nested values',()=>{assert.equal(parquetCell(9223372036854775807n,{}),'9223372036854775807');assert.equal(parquetCell(-9223372036854775808n,{}),'-9223372036854775808');assert.equal(parquetCell(1n,{}),1);assert.equal(parquetCell(NaN,{}),null);assert.throws(()=>parquetCell([1],{}),/parquetNested/);assert.throws(()=>parquetCell(new Uint8Array([1]),{}),/parquetNested/);});
test('unsafe numeric strings remain exact on import and JSON backup restore',()=>{const raw='[{"id":"9223372036854775807","x":1},{"id":"2","x":2}]',data=parseData(raw,'json');assert.equal(data.rows[0].id,'9223372036854775807');assert.equal(data.rows[1].id,'2');assert.deepEqual(parseData('[{"__proto__":"safe","x":1},{"x":2}]','json').rows[1],Object.fromEntries([['__proto__',null],['x',2]]));assert.equal(parseData('[{"x":"1e999"}]','json').rows[0].x,'1e999');const restored=validateBackup({version:1,active:'p',datasets:[{id:'p',name:'p',format:'json',raw}],operations:[],cursor:0});assert.equal(restored.datasets[0].rows[0].id,'9223372036854775807');});
test('metadata checks reject expansion and dimension limits before decoding',()=>{const schema=[{name:'schema',num_children:1},{name:'x',type:'INT64',repetition_type:'OPTIONAL'}],base={schema,num_rows:1,row_groups:[{columns:[{meta_data:{total_uncompressed_size:129*1048576}}]}]};assert.throws(()=>validateParquetMetadata(base),/parquetExpandedLimit/);assert.throws(()=>validateParquetMetadata({...base,num_rows:100001}),/tooManyRows/);});
test('corrupt and oversized Parquet give bounded errors',async()=>{await assert.rejects(readParquet(new Uint8Array([1,2,3]).buffer),/invalidParquet/);await assert.rejects(readParquet(new ArrayBuffer(10*1048576+1)),/fileTooLarge/);});
test('PyArrow/pandas differential: six codecs, row groups, safe integers and time zones',{skip:available.status!==0?'pandas/pyarrow unavailable':false},async()=>{assert.equal(generated.status,0,generated.stderr);const expected=JSON.parse(generated.stdout);for(const codec of ['NONE','snappy','gzip','brotli','zstd','lz4']){const result=await read(codec);assert.deepEqual(result.rows,expected,codec);assert.deepEqual(JSON.parse(result.raw),expected);const restored=validateBackup({version:1,active:'p',datasets:[{id:'p',name:codec,...result}],operations:[],cursor:0});assert.deepEqual(restored.datasets[0].rows,expected);}});
test('real Parquet nested, binary, empty, over-limit and decimal files',{skip:available.status!==0?'pyarrow unavailable':false},async()=>{assert.equal(generated.status,0,generated.stderr);assert.deepEqual((await read('nested')).rows,[{list:[1,2]},{list:[]}]);for(const file of ['binary'])await assert.rejects(read(file),/parquetNested/);await assert.rejects(read('empty'),/emptyFile/);await assert.rejects(read('large'),/tooManyRows/);assert.deepEqual((await read('decimal')).rows,[{decimal:1.25},{decimal:-.03}]);});
test('URL fetch supports Parquet without text decoding',async()=>{const bytes=new Uint8Array([80,65,82,49,255]),file=await fetchDataFile('https://example.com/data','parquet',async()=>new Response(bytes));assert.equal(file.name,'data.parquet');assert.deepEqual(new Uint8Array(file.buffer),bytes);});
process.on('exit',()=>rmSync(directory,{recursive:true,force:true}));
