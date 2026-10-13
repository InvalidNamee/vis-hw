import {parquetMetadataAsync,parquetSchema,parquetRead} from 'hyparquet';
import {compressors as baseCompressors} from 'hyparquet-compressors';
// PyArrow emits a one-byte zero token for empty LZ4 blocks. The decoder expects an offset even for this valid empty block.
const compressors={...baseCompressors,LZ4_RAW:(input,length)=>length===0&&input.length===1&&input[0]===0?new Uint8Array(0):baseCompressors.LZ4_RAW(input,length)};
import {parseData} from './model.mjs';
const fail=k=>{throw new Error(k);};
const timestamp=(value,divisor)=>{const q=value/divisor,r=value%divisor;return new Date(Number(q-(r<0n?1n:0n)));};
const parsers={timestampFromMicroseconds:value=>timestamp(value,1000n),timestampFromNanoseconds:value=>timestamp(value,1000000n)};
export function validateParquetMetadata(metadata){
 const tree=parquetSchema(metadata),fields=tree.children??[],columns=fields.map(f=>f.element.name),count=Number(metadata.num_rows);
 if(!Number.isSafeInteger(count)||count<0)fail('invalidParquet');if(!count||!columns.length)fail('emptyFile');
 if(count>100000||columns.length>200||count*columns.length>2000000)fail('tooManyRows');
 if(new Set(columns).size!==columns.length||columns.some(c=>!c))fail('duplicateColumns');
 const supported=(field,depth=0)=>{
  if(depth>8)return false;const e=field.element;
  if(e.logical_type?.type==='LIST'||e.converted_type==='LIST')return !!listElement(field)&&supported(listElement(field),depth+1);
  if(field.children?.length||e.repetition_type==='REPEATED')return false;
  return !(['BYTE_ARRAY','FIXED_LEN_BYTE_ARRAY'].includes(e.type)&&!['UTF8','DECIMAL','JSON','ENUM'].includes(e.converted_type)&&!['STRING','DECIMAL','JSON','ENUM','UUID'].includes(e.logical_type?.type));
 };
 if(fields.some(f=>!supported(f)))fail('parquetNested');
 let expanded=0;for(const group of metadata.row_groups??[])for(const column of group.columns??[]){const size=Number(column.meta_data?.total_uncompressed_size);if(!Number.isSafeInteger(size)||size<0)fail('invalidParquet');expanded+=size;if(expanded>128*1048576)fail('parquetExpandedLimit');}
 return {columns,fields,count};
}
function listElement(field){
 if(!field?.children?.length)return null;
 const repeated=field.children[0];
 return repeated.children?.length===1&&repeated.element.repetition_type==='REPEATED'?repeated.children[0]:{...repeated,element:{...repeated.element,repetition_type:'OPTIONAL'}};
}
export function parquetCell(value,field,depth=0,budget={count:0}){
 if(depth>8)fail('listDepth');
 if(Array.isArray(value)){const child=listElement(field);if(!child)fail('parquetNested');budget.count+=value.length;if(budget.count>2000000)fail('tooManyRows');return value.map(v=>parquetCell(v,child,depth+1,budget));}
 if(value==null)return null;
 if(typeof value==='bigint')return value>=BigInt(Number.MIN_SAFE_INTEGER)&&value<=BigInt(Number.MAX_SAFE_INTEGER)?Number(value):String(value);
 if(value instanceof Date){if(!Number.isFinite(+value))fail('invalidParquet');const iso=value.toISOString(),element=field.element;if(element.converted_type==='DATE'||element.logical_type?.type==='DATE')return iso.slice(0,10);return element.logical_type?.isAdjustedToUTC===false?iso.replace(/Z$/,''):iso;}
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(typeof value==='string'||typeof value==='boolean')return value;
 fail('parquetNested');
}
export async function readParquet(buffer){
 if(buffer.byteLength>10*1048576)fail('fileTooLarge');
 try{const metadata=await parquetMetadataAsync(buffer,{geoparquet:false}),{columns,fields,count}=validateParquetMetadata(metadata);let rows;const budget={count:0};
 await parquetRead({file:buffer,metadata,columns,compressors,parsers,onComplete:data=>{rows=data.map(values=>Object.fromEntries(columns.map((column,i)=>[column,parquetCell(values[i],fields[i],0,budget)])));}});
 if(!rows||rows.length!==count)fail('invalidParquet');const raw=JSON.stringify(rows);if(raw.length>20*1048576)fail('workspaceLimit');return {format:'json',raw,...parseData(raw,'json')};
 }catch(error){if(['fileTooLarge','emptyFile','tooManyRows','duplicateColumns','parquetNested','listDepth','parquetExpandedLimit','workspaceLimit'].includes(error.message))throw error;fail('invalidParquet');}
}
