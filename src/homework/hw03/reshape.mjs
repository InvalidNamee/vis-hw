import {reduceGroup,aggregationMethods} from './grouping.mjs';
const fail=k=>{throw new Error(k);};
const missing=v=>v==null||v==='';
const tuple=(row,keys)=>keys.map(k=>missing(row[k])?null:row[k]);
const token=JSON.stringify;
function fields(list,columns,empty=false){if(!Array.isArray(list)||!empty&&!list.length||new Set(list).size!==list.length||list.some(c=>!columns.includes(c)))fail('missingColumn');return list;}
const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]===b[i])continue;if(a[i]==null)return 1;if(b[i]==null)return -1;return a[i]<b[i]?-1:1;}return 0;};
function guard(rows,cols){if(rows>100000||cols>200||rows*cols>2000000)fail('tooManyRows');}
function axisTuples(rows,keys,drop,sort,groupAppearance=false){
 const tuples=[...new Map(rows.map(row=>{const values=tuple(row,keys);return [token(values),values];})).values()];
 let output=tuples;
 if(!drop&&keys.length>1){const levels=keys.map((_,i)=>[...new Map(tuples.map(t=>[token(t[i]),t[i]])).values()]);output=[[]];for(const level of levels){if(output.length*level.length>100000)fail('tooManyRows');output=output.flatMap(prefix=>level.map(v=>[...prefix,v]));}}
 if(sort)output.sort(cmp);else if(keys.length>1&&groupAppearance){const levels=keys.map((_,i)=>new Map([...new Set(tuples.map(t=>token(t[i])))].map((v,j)=>[v,j])));output.sort((a,b)=>{for(let i=0;i<keys.length;i++){const difference=levels[i].get(token(a[i]))-levels[i].get(token(b[i]));if(difference)return difference;}return 0;});}return output;
}
export const reshapeTypes=['melt','transpose','pivotMulti','crosstab'];
export function reshapeOperation(rows,columns,op){
 const p=op.params;
 if(op.type==='melt'){
  const ids=fields(p.ids??[],columns,true),metrics=fields(p.columns??columns.filter(c=>!ids.includes(c)),columns,true),selected=metrics.filter(c=>!ids.includes(c));
  const variable=p.variable??'variable',value=p.valueName??'value',position=p.positionName??'';
  if([variable,value].some(v=>typeof v!=='string'||!v.trim())||typeof position!=='string'||columns.includes(value))fail('duplicateColumns');
  const names=[...ids,variable,value,...(position?[position]:[])];if(new Set(names).size!==names.length)fail('duplicateColumns');guard(rows.length*selected.length,names.length);
  return {columns:names,rows:selected.flatMap(c=>rows.map((r,i)=>Object.fromEntries([...ids.map(k=>[k,r[k]??null]),[variable,c],[value,r[c]??null],...(position?[[position,i]]:[])]))),analysis:{kind:'reshape',tool:'melt',sourceRows:rows.length,sourceColumns:columns.length,ids,metrics:selected,variable,value}};
 }
 if(op.type==='transpose'){
  if(!['position','field'].includes(p.mode??'position'))fail('invalidOperation');
  const selected=fields(p.columns??columns,columns),header=p.mode==='field'?p.column:null;if(p.mode==='field'&&!columns.includes(header))fail('missingColumn');
  const metrics=selected.filter(c=>c!==header),field=p.name??'field';if(typeof field!=='string'||!field.trim())fail('duplicateColumns');
  const labels=rows.map((r,i)=>header?(missing(r[header])?fail('invalidTransposeLabels'):String(r[header])):String(i));const names=[field,...labels];if(new Set(names).size!==names.length)fail('invalidTransposeLabels');guard(metrics.length,names.length);
  return {columns:names,rows:metrics.map(c=>Object.fromEntries([[field,c],...rows.map((r,i)=>[labels[i],r[c]??null])])),analysis:{kind:'reshape',tool:'transpose',sourceRows:rows.length,sourceColumns:columns.length}};
 }
 const index=fields(p.index,columns),across=fields(p.across,columns);if(op.type==='pivotMulti'&&index.some(c=>across.includes(c)))fail('invalidOperation');
 const frequency=op.type==='crosstab'&&(p.mode??'frequency')==='frequency';
 const metrics=frequency?[null]:fields(op.type==='crosstab'?[p.column]:p.columns,columns),methods=frequency?['size']:op.type==='crosstab'?[p.method??'sum']:p.methods;
 if(!Array.isArray(methods)||!methods.length||new Set(methods).size!==methods.length||methods.some(m=>!aggregationMethods.includes(m)))fail('invalidOperation');
 const drop=p.missing!=='include',sort=p.order!=='appearance',margin=p.margins==='include',marginName=p.marginsName??'All',normalize=op.type==='crosstab'?p.normalize??'raw':'raw';
 if(!['raw','all','rows','columns'].includes(normalize)||typeof marginName!=='string'||!marginName.trim())fail('invalidOperation');
 const ddof=Number(p.ddof??1);if(!Number.isInteger(ddof)||ddof<0)fail('invalidNumber');
 const fill=frequency?0:p.fillValue==null||p.fillValue===''?null:Number(p.fillValue);if(fill!=null&&!Number.isFinite(fill))fail('invalidNumber');
 const valid=rows.filter(r=>!drop||[...index,...across].every(k=>!missing(r[k])));
 let rowKeys=axisTuples(valid,index,drop,sort,true),colKeys=axisTuples(valid,across,drop,sort);
 const cellMap=new Map(),rowMap=new Map(),colMap=new Map();
 const append=(map,key,row)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(row);};
 for(const r of valid){const a=tuple(r,index),b=tuple(r,across);append(cellMap,token([a,b]),r);append(rowMap,token(a),r);append(colMap,token(b),r);}
 const orderedMetrics=sort||margin?[...metrics].sort((a,b)=>String(a)<String(b)?-1:1):metrics;
 const specs=methods.flatMap(method=>method==='size'?[{method,metric:null}]:orderedMetrics.map(metric=>({method,metric})));
 guard(rowKeys.length+(margin?1:0),index.length+specs.length*(colKeys.length+(margin?1:0)));
 const aggregate=(records,spec)=>records?.length?reduceGroup(spec.metric==null?records.map(()=>1):records.map(r=>r[spec.metric]),spec.method,ddof):null;
 // dropna removes empty aggregate columns and rows; absent frequency cells are zero.
 const enabled=specs.map(spec=>colKeys.filter(c=>!drop||frequency||rowKeys.some(r=>aggregate(cellMap.get(token([r,c])),spec)!=null)));
 if(drop&&!frequency)rowKeys=rowKeys.filter(r=>specs.some((spec,s)=>enabled[s].some(c=>aggregate(cellMap.get(token([r,c])),spec)!=null)));
 const marginRow=[marginName,...index.slice(1).map(()=>'')],marginCol=[marginName,...across.slice(1).map(()=>'')];
 if(margin&&(rowKeys.some(k=>k.includes(marginName))||colKeys.some(k=>k.includes(marginName))))fail('marginConflict');
 const marginRecords=drop?valid.filter(r=>metrics.every(m=>m==null||!missing(r[m]))):valid;
 const marginRowMap=new Map(),marginColMap=new Map();for(const r of marginRecords){if(tuple(r,index).every(v=>v!=null))append(marginRowMap,token(tuple(r,index)),r);if(tuple(r,across).every(v=>v!=null))append(marginColMap,token(tuple(r,across)),r);}
 const outputRows=margin?[...rowKeys,marginRow]:rowKeys;
 const blocks=specs.map((spec,s)=>{
  let keys=margin?[...enabled[s],marginCol]:enabled[s];
  let matrix=outputRows.map((r,i)=>keys.map((c,j)=>{
   let value;
   if(margin&&i===rowKeys.length&&j===keys.length-1)value=aggregate(marginRecords,spec);
   else if(margin&&i===rowKeys.length)value=aggregate(marginColMap.get(token(c)),spec);
   else if(margin&&j===keys.length-1)return aggregate(marginRowMap.get(token(r)),spec);
   else value=aggregate(cellMap.get(token([r,c])),spec);
   return value==null?fill:value;
  }));
  if(normalize!=='raw'){
   const body=matrix.slice(0,rowKeys.length).map(r=>r.slice(0,enabled[s].length)),total=body.flat().reduce((n,v)=>n+(typeof v==='number'?v:0),0),rowTotals=body.map(r=>r.reduce((n,v)=>n+(typeof v==='number'?v:0),0)),colTotals=enabled[s].map((_,j)=>body.reduce((n,r)=>n+(typeof r[j]==='number'?r[j]:0),0));
   const totalRow=margin?matrix.at(-1).slice(0,enabled[s].length):[],totalCol=margin?matrix.slice(0,rowKeys.length).map(r=>r.at(-1)):[];
   const sum=values=>values.reduce((n,v)=>n+(typeof v==='number'?v:0),0);
   matrix=matrix.map((r,i)=>r.map((v,j)=>{
    const isTotalRow=margin&&i===rowKeys.length,isTotalCol=margin&&j===enabled[s].length;
    let divisor=normalize==='all'?total:normalize==='rows'?rowTotals[i]:colTotals[j];
    if(isTotalRow)divisor=sum(totalRow);if(isTotalCol)divisor=sum(totalCol);
    if(isTotalRow&&isTotalCol)return 1;
    return divisor&&typeof v==='number'?v/divisor:0;
   }));
   if(margin&&normalize==='rows'){keys=keys.slice(0,-1);matrix=matrix.map(r=>r.slice(0,-1));}
   if(margin&&normalize==='columns')matrix=matrix.slice(0,-1);
  }
  return {...spec,keys,matrix,names:keys.map(key=>token([spec.method,spec.metric,...key]))};
 });
 const actualRowKeys=margin&&normalize==='columns'?rowKeys:outputRows,names=[...index,...blocks.flatMap(b=>b.names)];if(new Set(names).size!==names.length)fail('duplicateColumns');guard(actualRowKeys.length,names.length);
 const output=actualRowKeys.map((key,i)=>Object.fromEntries([...index.map((k,j)=>[k,key[j]]),...blocks.flatMap(b=>b.names.map((name,j)=>[name,b.matrix[i][j]]))]));
 return {rows:output,columns:names,analysis:{kind:'pivotMulti',tool:op.type,index,across,normalize,margins:margin,rows:actualRowKeys,blocks:blocks.map(b=>({...b,matrix:b.matrix.slice(0,100)})),columnLabels:Object.fromEntries(blocks.flatMap(b=>b.names.map((name,i)=>[name,[b.metric??'count',b.method,...b.keys[i].map(v=>v==null?'∅':String(v))].join(' / ')]))),sourceRows:rows.length,validRows:valid.length}};
}
