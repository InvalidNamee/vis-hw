import {reduceGroup,aggregationMethods} from './grouping.mjs';import {compileCondition} from './selection.mjs';
const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='';
const compare=(a,b)=>{if(['number','boolean'].includes(typeof a)&&['number','boolean'].includes(typeof b))return Number(a)-Number(b);const x=[...String(a)],y=[...String(b)];for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i].codePointAt(0)-y[i].codePointAt(0);return x.length-y.length;};
function partition(rows,columns,p){const keys=p.keys??[];if(!Array.isArray(keys)||new Set(keys).size!==keys.length||keys.some(c=>!columns.includes(c)))fail('missingColumn');const groups=new Map();rows.forEach((row,i)=>{const values=keys.map(k=>missing(row[k])?null:row[k]);if(values.includes(null)&&p.missing!=='include')return;const key=JSON.stringify(values);if(!groups.has(key))groups.set(key,{keys:values,indices:[]});groups.get(key).indices.push(i);});if(!keys.length&&!rows.length)groups.set('[]',{keys:[],indices:[]});return {groups:[...groups.values()],keys};}
export function groupToolsOperation(rows,columns,op){
 const p=op.params;
 const {groups,keys}=partition(rows,columns,p);
 if(op.type==='groupFilter'){
  if(!columns.includes(p.column))fail('missingColumn');if(!aggregationMethods.includes(p.method??'mean')||!['drop','missing'].includes(p.mode??'drop'))fail('invalidOperation');const ddof=Number(p.ddof??1);if(!Number.isInteger(ddof)||ddof<0)fail('invalidNumber');
  const test=compileCondition({column:'value',operator:p.operator??'gte',value:p.value??0},['value']),kept=new Set(),summary=[];
  for(const group of groups){const value=reduceGroup(group.indices.map(i=>rows[i][p.column]),p.method??'mean',ddof),pass=test({value});if(pass)group.indices.forEach(i=>kept.add(i));summary.push({keys:group.keys,value,pass,count:group.indices.length});}
  const output=p.mode==='missing'?rows.map((row,i)=>kept.has(i)?{...row}:Object.fromEntries(columns.map(c=>[c,null]))):rows.filter((_,i)=>kept.has(i)).map(row=>({...row}));
  return {columns,rows:output,analysis:{kind:'groupFilter',groups:groups.length,passed:summary.filter(s=>s.pass).length,kept:kept.size,total:rows.length,summary:summary.slice(0,100),column:p.column,method:p.method??'mean',operator:p.operator??'gte',value:p.value??0}};
 }
 if(op.type!=='groupRank')fail('invalidOperation');
 const fields=p.columns,method=p.method??'average',placement=p.placement??'keep',ascending=p.direction!=='descending',percent=p.percent==='include';
 if(!Array.isArray(fields)||!fields.length||new Set(fields).size!==fields.length||fields.some(c=>!columns.includes(c)))fail('missingColumn');if(!['average','min','max','dense','first'].includes(method)||!['keep','top','bottom'].includes(placement))fail('invalidOperation');
 const names=fields.map(c=>String(p.prefix??'')+c+(percent?'_rank_pct':'_rank'));if(new Set([...columns,...names]).size!==columns.length+names.length)fail('duplicateColumns');if(columns.length+names.length>200||rows.length*(columns.length+names.length)>2000000)fail('tooManyRows');
 const output=rows.map(row=>Object.fromEntries([...columns.map(c=>[c,row[c]]),...names.map(c=>[c,null])])),strength=new Map();
 for(const group of groups)for(let s=0;s<fields.length;s++){
  const column=fields[s],values=group.indices.map(i=>({i,value:rows[i][column]})).filter(row=>placement!=='keep'||!missing(row.value));
  const valid=values.map(v=>v.value).filter(v=>!missing(v)),types=new Set(valid.map(v=>typeof v==='boolean'?'number':typeof v));if(types.size>1||[...types].some(t=>!['number','string'].includes(t))||valid.some(v=>typeof v==='number'&&!Number.isFinite(v)))fail('invalidNumber');
  values.sort((a,b)=>{if(missing(a.value)||missing(b.value)){if(missing(a.value)&&missing(b.value))return a.i-b.i;return (missing(a.value)?-1:1)*(placement==='top'?1:-1);}return compare(a.value,b.value)*(ascending?1:-1)||a.i-b.i;});
  const ties=[];for(let i=0;i<values.length;){let end=i+1;while(end<values.length&&(missing(values[i].value)&&missing(values[end].value)||!missing(values[i].value)&&!missing(values[end].value)&&compare(values[i].value,values[end].value)===0))end++;ties.push([i,end]);i=end;}
  const denominator=method==='dense'?ties.length:values.length;ties.forEach(([start,end],dense)=>{for(let i=start;i<end;i++){const raw=method==='average'?(start+1+end)/2:method==='min'?start+1:method==='max'?end:method==='dense'?dense+1:i+1,value=percent?raw/denominator:raw;output[values[i].i][names[s]]=value;if(values[i].i<40)strength.set(values[i].i+':'+s,denominator?raw/denominator:0);}});
 }
 return {columns:[...columns,...names],rows:output,analysis:{kind:'groupRank',keys,names,percent,groups:groups.length,total:rows.length,samples:output.slice(0,40).map((row,i)=>({position:i,keys:keys.map(k=>row[k]),values:names.map((name,j)=>({name,value:row[name],strength:strength.get(i+':'+j)??0}))}))}};
}
