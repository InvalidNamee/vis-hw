const fail=()=>{throw new Error('invalidIndexValue');};
export function decodeIndexCell(cell,index,level,cache){
 const value=String(cell?.value??''),type=cell?.type??'auto';if(type==='missing'||value==='')return null;
 if(type==='text')return value;
 if(type==='number'){if(!value.trim()||!Number.isFinite(Number(value)))fail();return Number(value);}
 if(type==='boolean'){if(value.trim()==='true')return true;if(value.trim()==='false')return false;fail();}
 if(type!=='auto')fail();
 let known=cache?.get(level);if(!known){known={strings:new Set(),number:false,boolean:false};for(const tuple of index.values){const v=tuple[level];if(typeof v==='string')known.strings.add(v);if(typeof v==='number')known.number=true;if(typeof v==='boolean')known.boolean=true;}cache?.set(level,known);}if(known.strings.has(value))return value;
 if(known.number&&/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim())&&Number.isFinite(Number(value)))return Number(value);
 if(known.boolean&&['true','false'].includes(value.trim()))return value.trim()==='true';
 return value;
}
export const indexCells=tuple=>tuple.map(value=>({type:value==null?'missing':typeof value==='boolean'?'boolean':typeof value==='number'?'number':'text',value:value==null?'':String(value)}));
export function ensureIndexQuery(index,query){
 const signature=JSON.stringify(index.names),empty=index.names.map(()=>null),validTuple=tuple=>Array.isArray(tuple)&&tuple.length===index.names.length&&tuple.every(cell=>cell&&['auto','text','number','boolean','missing'].includes(cell.type)&&typeof cell.value==='string');if(query?.signature!==signature||!Array.isArray(query.rows)||query.rows.length>100000||!query.rows.every(validTuple)||!validTuple(query.start)||!validTuple(query.end)||!Number.isInteger(query.depth)||query.depth<1||query.depth>index.names.length)return {signature,rows:[indexCells(index.values[0]??empty)],start:indexCells(index.values[0]??empty),end:indexCells(index.values.at(-1)??empty),openStart:false,openEnd:false,depth:index.names.length,page:0};
 return query;
}
export function indexQueryParams(query,index,mode){
 const cache=new Map(),decode=tuple=>tuple.map((cell,i)=>decodeIndexCell(cell,index,i,cache));
 if(mode==='slice')return {start:query.openStart?null:decode(query.start.slice(0,query.depth)),end:query.openEnd?null:decode(query.end.slice(0,query.depth))};
 return {labels:query.rows.map(decode)};
}
