import {moments,quantile} from './statistics.mjs';
const missing=v=>v==null||v==='';
const fail=key=>{throw new Error(key);};
const categoryRankCache=new WeakMap();
export const aggregationMethods=['sum','mean','median','count','size','nunique','min','max','std','var','first','last','prod','any','all'];
export function reduceGroup(values,method,ddof=1,metadata){
  const valid=values.filter(v=>!missing(v));
  if(metadata?.dtype==='category'){if(['min','max'].includes(method)){if(!metadata.ordered)fail('categoryOrderRequired');let ranks=categoryRankCache.get(metadata);if(!ranks){ranks=new Map(metadata.categories.map((v,i)=>[JSON.stringify(v),i]));categoryRankCache.set(metadata,ranks);}return valid.reduce((best,v)=>best==null?v:(method==='min'?ranks.get(JSON.stringify(v))<ranks.get(JSON.stringify(best)):ranks.get(JSON.stringify(v))>ranks.get(JSON.stringify(best)))?v:best,null);}if(['sum','mean','median','prod','std','var'].includes(method))fail('categoryNumeric');}
  if(method==='size')return values.length;
  if(method==='count')return valid.length;
  if(method==='nunique')return new Set(valid.map(v=>JSON.stringify(v))).size;
  if(method==='first')return valid[0]??null;
  if(method==='last')return valid.at(-1)??null;
  if(method==='any')return valid.some(Boolean);
  if(method==='all')return valid.every(Boolean);
  if(method==='min'||method==='max')return valid.reduce((best,v)=>best==null?v:(method==='min'?v<best:v>best)?v:best,null);
  if(valid.some(v=>typeof v!=='number'||!Number.isFinite(v)))fail('invalidNumber');
  if(method==='sum')return valid.reduce((a,b)=>a+b,0);
  if(method==='prod')return valid.reduce((a,b)=>a*b,1);
  if(!valid.length)return null;
  if(method==='median')return quantile([...valid].sort((a,b)=>a-b),.5);
  return moments(valid,ddof)[method];
}
export function groupingOperation(rows,columns,op,types={}){
  const p=op.params;if(p.specs!==undefined&&(!Array.isArray(p.specs)||!p.specs.length||p.specs.some(s=>!s||typeof s!=='object')))fail('invalidOperation');
  const keys=p.keys??[],metrics=p.specs?[...new Set(p.specs.map(s=>s?.column))]:p.columns,methods=p.specs?[...new Set(p.specs.map(s=>s?.method))]:p.methods,mode=p.mode??'summarize',drop=p.missing!=='include',sort=p.order!=='appearance',ddof=Number(p.ddof??1);
  for(const fields of [keys,metrics])if(!Array.isArray(fields)||new Set(fields).size!==fields.length||fields.some(c=>!columns.includes(c)))fail('missingColumn');
  if(!metrics.length||!Array.isArray(methods)||!methods.length||new Set(methods).size!==methods.length||methods.some(m=>!aggregationMethods.includes(m)))fail('invalidOperation');
  if(!['summarize','transform'].includes(mode)||!Number.isInteger(ddof)||ddof<0)fail('invalidNumber');
  const specs=p.specs??metrics.flatMap(column=>methods.map(method=>({column,method,name:`${p.prefix??''}${column}_${method}`})));
  if(!Array.isArray(specs)||!specs.length||specs.some(s=>!s||!columns.includes(s.column)||!aggregationMethods.includes(s.method)||typeof s.name!=='string'||!s.name.trim()))fail('invalidOperation');
  const names=specs.map(s=>s.name),base=mode==='transform'?columns:keys;
  if(new Set([...base,...names]).size!==base.length+names.length)fail('duplicateColumns');
  if(base.length+names.length>200||mode==='transform'&&rows.length*(base.length+names.length)>2000000)fail('tooManyRows');
  const groups=new Map();
  rows.forEach((row,index)=>{const values=keys.map(k=>missing(row[k])?null:row[k]);if(drop&&values.includes(null))return;const token=JSON.stringify(values);if(!groups.has(token))groups.set(token,{values,indices:[]});groups.get(token).indices.push(index);});
  if(!keys.length&&!rows.length)groups.set('[]',{values:[],indices:[]});
  let list=[...groups.values()];
  const categorical=keys.some(k=>types[k]?.dtype==='category'),observed=p.observed!=='exclude';
  const domains=keys.map(k=>{const actual=[...new Map(rows.map(row=>{const value=missing(row[k])?null:row[k];return [JSON.stringify(value),value];}).filter(([,value])=>!drop||value!==null)).values()],meta=types[k];if(meta?.dtype==='category'){if(!sort){const used=new Set(actual.map(v=>JSON.stringify(v)));return [...actual,...meta.categories.filter(v=>!used.has(JSON.stringify(v)))];}return [...meta.categories,...(!drop&&actual.includes(null)?[null]:[])];}return sort?[...actual].sort((a,b)=>a==null?b==null?0:1:b==null?-1:a<b?-1:a>b?1:0):actual;});
  if(categorical&&!observed&&mode==='summarize'){let combinations=[[]];for(const domain of domains){if(combinations.length*domain.length>100000||combinations.length*domain.length*(base.length+names.length)>2000000)fail('tooManyRows');combinations=combinations.flatMap(prefix=>domain.map(v=>[...prefix,v]));}list=combinations.map(values=>groups.get(JSON.stringify(values))??{values,indices:[],unobserved:true});}

  const categoryRanks=keys.map((k,i)=>types[k]?.dtype==='category'?new Map(domains[i].map((v,j)=>[JSON.stringify(v),j])):null);
  if(sort)list.sort((a,b)=>{for(let i=0;i<keys.length;i++){const x=a.values[i],y=b.values[i];if(x===y)continue;if(x==null)return 1;if(y==null)return -1;if(types[keys[i]]?.dtype==='category'){const rank=categoryRanks[i];return rank.get(JSON.stringify(x))-rank.get(JSON.stringify(y));}return x<y?-1:1;}return 0;});
  if(list.length*(base.length+names.length)>2000000)fail('tooManyRows');
  const summaries=list.map(g=>({...Object.fromEntries(keys.map((k,i)=>[k,g.values[i]])),...Object.fromEntries(specs.map(s=>[s.name,g.unobserved&&keys.length>1&&!['sum','count','size','nunique'].includes(s.method)?null:reduceGroup(g.indices.map(i=>rows[i][s.column]),s.method,ddof,types[s.column])]))}));
  let output=summaries;
  if(mode==='transform'){
    output=rows.map(r=>({...r,...Object.fromEntries(names.map(n=>[n,null]))}));
    list.forEach((g,i)=>g.indices.forEach(index=>{for(const name of names)output[index][name]=summaries[i][name];}));
  }
  const outputTypes=Object.fromEntries([...Object.entries(types).filter(([c])=>(mode==='transform'?columns:keys).includes(c)),...specs.filter(s=>types[s.column]?.dtype==='category'&&['first','last','min','max'].includes(s.method)).map(s=>[s.name,types[s.column]])]);
  return {rows:output,types:outputTypes,columns:[...base,...names],analysis:{kind:'groupMulti',keys,metrics:specs,mode,groups:list.length,excluded:rows.length-list.reduce((n,g)=>n+g.indices.length,0),summary:summaries.slice(0,12)}};
}
