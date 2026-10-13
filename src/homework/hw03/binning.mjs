const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='',numeric=v=>typeof v==='number'&&Number.isFinite(v);
const pandasQuantile=(a,q)=>{const pos=(a.length-1)*(q*100/100),lo=Math.floor(pos),hi=Math.min(a.length-1,lo+1),f=pos-lo,d=a[hi]-a[lo];return f>=.5?a[hi]-d*(1-f):a[lo]+d*f;};
const list=value=>Array.isArray(value)?value:typeof value==='string'?value.split(/[\s,，]+/u).filter(Boolean).map(Number):[];
export function binningOperation(rows,columns,op){
 const p=op.params,c=p.column;if(!columns.includes(c))fail('missingColumn');const name=String(p.name??'bin');if(!name.trim()||columns.includes(name))fail('duplicateColumns');
 if(columns.length+1>200||rows.length*(columns.length+1)>2000000)fail('tooManyRows');
 if(!['right','left'].includes(p.closed??'right'))fail('invalidBins');const method=p.method??'cut';if(!['cut','qcut'].includes(method))fail('invalidOperation');const values=rows.map(r=>r[c]).filter(v=>!missing(v));if(values.some(v=>!numeric(v)))fail('invalidNumber');
 const n=Number(p.count??4),explicit=p.mode==='edges';let edges;if(!['count','edges'].includes(p.mode??'count'))fail('invalidOperation');
 if(explicit){edges=list(p.edges);if(edges.length<2||edges.length>201||edges.some(v=>!numeric(v))||edges.some((v,i)=>i&&v<edges[i-1]))fail('invalidBins');}
 else if(!Number.isInteger(n)||n<1||n>200)fail('invalidBins');
 if(method==='qcut'){
  const q=explicit?edges:Array.from({length:n+1},(_,i)=>i===n?1:i*(1/n));if(q.some(v=>v<0||v>1))fail('invalidBins');if(!values.length)fail('noValues');const sorted=[...values].sort((a,b)=>a-b);edges=q.map(v=>pandasQuantile(sorted,v));
 }else if(!explicit){
  if(!values.length)fail('noValues');let lo=Infinity,hi=-Infinity;for(const v of values){lo=Math.min(lo,v);hi=Math.max(hi,v);}const same=lo===hi;
  if(same){lo-=lo!==0?Math.abs(lo)*.001:.001;hi+=hi!==0?Math.abs(hi)*.001:.001;}const step=(hi-lo)/n;edges=Array.from({length:n+1},(_,i)=>i===n?hi:lo+step*i);
  if(!same){if(p.closed==='left')edges[n]+=(hi-lo)*.001;else edges[0]-=(hi-lo)*.001;}
 }
 if(edges.some(v=>!Number.isFinite(v)))fail('invalidBins');if(!['raise','drop'].includes(p.duplicates??'raise'))fail('invalidOperation');
 if(edges.length!==2&&new Set(edges).size!==edges.length){if(p.duplicates!=='drop')fail('duplicateBins');edges=[...new Set(edges)];}
 const count=Math.max(0,edges.length-1),right=method==='qcut'||p.closed!=='left',includeLowest=method==='qcut'||p.includeLowest==='include';
 const output=p.output??'codes';if(!['codes','intervals','labels'].includes(output))fail('invalidOperation');
 const labels=Array.isArray(p.labels)?p.labels:typeof p.labels==='string'?p.labels.split(/\r?\n/):[];if(output==='labels'&&(labels.length!==count||labels.some(v=>typeof v!=='string'||!v)||new Set(labels).size!==labels.length))fail('invalidBins');
 const intervals=Array.from({length:count},(_,i)=>`${right?(i===0&&includeLowest?'[':'('):'['}${edges[i]}, ${edges[i+1]}${right?']':')'}`),counts=Array(count).fill(0);let nulls=0,outside=0;
 const result=rows.map(row=>{const v=row[c];let code=null;if(missing(v))nulls++;else{let lo=0,hi=edges.length;while(lo<hi){const mid=(lo+hi)>>>1;if(right?edges[mid]<v:edges[mid]<=v)lo=mid+1;else hi=mid;}code=lo-1;if(includeLowest&&v===edges[0])code=0;if(code<0||code>=count){code=null;outside++;}else counts[code]++;}return Object.fromEntries([...columns.map(k=>[k,row[k]]),[name,code===null?null:output==='codes'?code:output==='labels'?labels[code]:intervals[code]]]);});
 return {columns:[...columns,name],rows:result,analysis:{kind:'binning',method,column:c,name,edges,counts,labels:output==='labels'?labels:intervals,missing:nulls,outside,total:rows.length}};
}
