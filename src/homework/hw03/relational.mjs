const fail=k=>{throw new Error(k);};
const missing=v=>v==null||v==='';
const normalized=v=>missing(v)?null:typeof v==='boolean'?Number(v):v;
const values=(r,keys)=>keys.map(k=>normalized(r[k]));
const token=(r,keys)=>JSON.stringify(values(r,keys));
const compare=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]===b[i])continue;if(a[i]==null)return 1;if(b[i]==null)return -1;return a[i]<b[i]?-1:1;}return 0;};
function index(rows,keys){const m=new Map();rows.forEach((r,i)=>{const t=token(r,keys);if(!m.has(t))m.set(t,[]);m.get(t).push(i);});return m;}
export function mergeOperation(rows,columns,op,datasets){
 const p=op.params,right=datasets.find(d=>d.id===p.dataset);if(!right)fail('missingDataset');
 const how=p.how??'left',pairs=p.pairs??[],validation=p.validate??'many_to_many';
 if(!['left','inner','right','outer','cross'].includes(how)||!['one_to_one','one_to_many','many_to_one','many_to_many'].includes(validation))fail('invalidOperation');
 if(!Array.isArray(pairs)||how!=='cross'&&(!pairs.length||pairs.some(k=>!columns.includes(k.left)||!right.columns.includes(k.right))))fail('missingColumn');
 const lk=how==='cross'?[]:pairs.map(k=>k.left),rk=how==='cross'?[]:pairs.map(k=>k.right);
 if(new Set(lk).size!==lk.length||new Set(rk).size!==rk.length)fail('invalidOperation');
 const li=index(rows,lk),ri=index(right.rows,rk),leftUnique=[...li.values()].every(x=>x.length===1),rightUnique=[...ri.values()].every(x=>x.length===1);
 if((['one_to_one','one_to_many'].includes(validation)&&!leftUnique)||(['one_to_one','many_to_one'].includes(validation)&&!rightUnique))fail('mergeValidation');
 const common=new Set(pairs.filter(k=>how!=='cross'&&k.left===k.right).map(k=>k.left));
 const overlaps=columns.filter(c=>right.columns.includes(c)&&!common.has(c));
 const suffixes=p.suffixes??['_x','_y'];if(!Array.isArray(suffixes)||suffixes.length!==2||suffixes.some(s=>typeof s!=='string'))fail('invalidOperation');
 const lm=columns.map(c=>[c,overlaps.includes(c)?c+suffixes[0]:c]),rm=right.columns.filter(c=>!common.has(c)).map(c=>[c,overlaps.includes(c)?c+suffixes[1]:c]);
 const indicator=p.indicator??'',names=[...lm,...rm].map(x=>x[1]);
 if(typeof indicator!=='string'||indicator&&(columns.includes(indicator)||right.columns.includes(indicator)))fail('duplicateColumns');if(indicator)names.push(indicator);
 if(new Set(names).size!==names.length)fail('duplicateColumns');if(names.length>200)fail('tooManyRows');
 const matches=[],usedRight=new Set(),matchedLeft=new Set(),matchedRight=new Set();
 const push=(l,r)=>{if((matches.length+1)>100000||(matches.length+1)*names.length>2000000)fail('tooManyRows');matches.push({l,r});if(l!=null&&r!=null){matchedLeft.add(l);matchedRight.add(r);}};
 if(how==='right')right.rows.forEach((r,j)=>{const matched=li.get(token(r,rk))??[];if(!matched.length)push(null,j);else for(const i of matched)push(i,j);});
 else rows.forEach((r,i)=>{const matched=ri.get(token(r,lk))??[];if(!matched.length&&['left','outer'].includes(how))push(i,null);for(const j of matched){push(i,j);usedRight.add(j);}});
 if(how==='outer')right.rows.forEach((_,j)=>{if(!usedRight.has(j))push(null,j);});
 // pandas 2.2.3 inner_join uses an inverse input-group permutation when
 // output length happens to equal left length, including duplicate expansion.
 if(how==='inner'&&p.sort!==true&&matches.length===rows.length&&rows.length){
  const entries=[...li.entries()];if(lk.length===1)entries.sort((a,b)=>(JSON.parse(a[0])[0]==null?1:0)-(JSON.parse(b[0])[0]==null?1:0));
  const sorter=entries.flatMap(([,indices])=>indices),grouped=entries.flatMap(([t,indices])=>indices.flatMap(l=>(ri.get(t)??[]).map(r=>({l,r}))));
  const reverse=Array(rows.length);sorter.forEach((original,position)=>reverse[original]=position);
  const reordered=reverse.map(position=>grouped[position]);reordered.forEach((pair,i)=>matches[i]=pair);
 }
 if(how==='outer'||p.sort===true)matches.sort((a,b)=>compare(a.l!=null?values(rows[a.l],lk):values(right.rows[a.r],rk),b.l!=null?values(rows[b.l],lk):values(right.rows[b.r],rk)));
 const output=matches.map(({l,r})=>{const left=l==null?null:rows[l],other=r==null?null:right.rows[r],entries=lm.map(([c,name])=>[name,left?.[c]??(common.has(c)?other?.[c]??null:null)]);for(const [c,name]of rm)entries.push([name,other?.[c]??null]);if(indicator)entries.push([indicator,l==null?'right_only':r==null?'left_only':'both']);return Object.fromEntries(entries);});
 const counts={both:0,left_only:0,right_only:0};matches.forEach(m=>counts[m.l==null?'right_only':m.r==null?'left_only':'both']++);
 const keyGroups=new Map();for(const [t,ids]of li)keyGroups.set(t,{keys:JSON.parse(t),left:ids.length,right:ri.get(t)?.length??0});for(const [t,ids]of ri)if(!keyGroups.has(t))keyGroups.set(t,{keys:JSON.parse(t),left:0,right:ids.length});
 return {rows:output,columns:names,analysis:{kind:'merge',how,leftRows:rows.length,rightRows:right.rows.length,leftMatched:matchedLeft.size,rightMatched:matchedRight.size,leftUnique,rightUnique,counts,keyGroups:[...keyGroups.values()].sort((a,b)=>(a.left&&a.right?1:0)-(b.left&&b.right?1:0)).slice(0,30),pairs}};
}
export function concatOperation(rows,columns,op,datasets){
 const p=op.params,ids=p.datasets;if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)fail('missingDataset');
 const sources=ids.map(id=>datasets.find(d=>d.id===id));if(sources.some(d=>!d))fail('missingDataset');sources.unshift({name:p.currentName??'current',rows,columns});
 const axis=p.axis??'rows',join=p.join??'outer';if(!['rows','columns'].includes(axis)||!['outer','inner'].includes(join))fail('invalidOperation');
 let names,output;
 if(axis==='rows'){
  names=join==='outer'?[...new Set(sources.flatMap(d=>d.columns))]:columns.filter(c=>sources.every(d=>d.columns.includes(c)));
  const sourceColumn=p.sourceColumn??'';if(typeof sourceColumn!=='string'||sourceColumn&&names.includes(sourceColumn))fail('duplicateColumns');
  if(sourceColumn)names.push(sourceColumn);if(sources.reduce((n,d)=>n+d.rows.length,0)>100000||names.length>200||names.length*sources.reduce((n,d)=>n+d.rows.length,0)>2000000)fail('tooManyRows');
  output=sources.flatMap(d=>d.rows.map(row=>Object.fromEntries(names.map(c=>[c,c===sourceColumn?d.name:row[c]??null]))));
 }else{
  const prefix=p.prefix??'overlap';if(!['all','overlap'].includes(prefix))fail('invalidOperation');
  const counts=new Map();for(const d of sources)for(const c of d.columns)counts.set(c,(counts.get(c)??0)+1);
  const maps=sources.map((d,i)=>d.columns.map(c=>[c,prefix==='all'||counts.get(c)>1?`${i}_${c}`:c]));names=maps.flat().map(x=>x[1]);if(new Set(names).size!==names.length)fail('duplicateColumns');
  const n=Math[join==='outer'?'max':'min'](...sources.map(d=>d.rows.length));if(n>100000||names.length>200||n*names.length>2000000)fail('tooManyRows');
  output=Array.from({length:n},(_,i)=>Object.fromEntries(sources.flatMap((d,j)=>maps[j].map(([c,name])=>[name,d.rows[i]?.[c]??null]))));
 }
 return {rows:output,columns:names,analysis:{kind:'concat',axis,join,sources:sources.map(d=>({name:d.name,rows:d.rows.length,columns:d.columns.length})),outputRows:output.length,outputColumns:names.length}};
}
