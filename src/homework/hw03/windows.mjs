// A deterministic order-statistic treap keeps rolling statistics O(n log window).
const fail=k=>{throw new Error(k);};
const missing=v=>v==null||v==='';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const clean=v=>Number.isFinite(v)?v:null;
const timestamp=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}/.test(v))return NaN;const day=v.slice(0,10),base=Date.parse(day+'T00:00:00Z');return Number.isFinite(base)&&new Date(base).toISOString().slice(0,10)===day?Date.parse(v):NaN;};
function tree(){
 let root=null,seed=37;
 const size=n=>n?.size??0;
 const update=n=>{if(!n)return n;const parts=[n.left,{size:n.count,mean:n.key,m2:0,sum:n.key*n.count},n.right].filter(Boolean);let count=0,mean=0,m2=0,sum=0;for(const p of parts){const total=count+p.size,delta=p.mean-mean;m2+=p.m2+delta*delta*count*p.size/total;mean+=delta*p.size/total;count=total;sum+=p.sum;}Object.assign(n,{size:count,mean,m2:Math.max(0,m2),sum});return n;};
 const merge=(a,b)=>!a?b:!b?a:a.priority<b.priority?(a.right=merge(a.right,b),update(a)):(b.left=merge(a,b.left),update(b));
 function add(n,key){if(!n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return {key,count:1,size:1,mean:key,m2:0,sum:key,priority:seed,left:null,right:null};}if(key===n.key)n.count++;else if(key<n.key){n.left=add(n.left,key);if(n.left.priority<n.priority){const p=n.left;n.left=p.right;p.right=update(n);n=p;}}else{n.right=add(n.right,key);if(n.right.priority<n.priority){const p=n.right;n.right=p.left;p.left=update(n);n=p;}}return update(n);}
 function remove(n,key){if(!n)fail('invalidOperation');if(key===n.key){if(n.count>1)n.count--;else return merge(n.left,n.right);}else if(key<n.key)n.left=remove(n.left,key);else n.right=remove(n.right,key);return update(n);}
 const kth=(n,k)=>{const left=size(n.left);return k<left?kth(n.left,k):k<left+n.count?n.key:kth(n.right,k-left-n.count);};
 return {add:v=>{root=add(root,v);},remove:v=>{root=remove(root,v);},get size(){return size(root);},value(method,ddof,q){if(method==='count')return size(root);if(method==='sum')return clean(root?.sum??0);if(!root)return null;if(method==='mean')return clean(root.mean);if(method==='var'||method==='std'){const v=root.size>ddof?root.m2/(root.size-ddof):null;return v==null?null:clean(method==='std'?Math.sqrt(v):v);}if(method==='min')return kth(root,0);if(method==='max')return kth(root,root.size-1);const position=(root.size-1)*(method==='median'?.5:q),a=Math.floor(position),b=Math.ceil(position);return clean(kth(root,a)+(kth(root,b)-kth(root,a))*(position-a));}};
}
function pairStatistics(){
 let n=0,mx=0,my=0,c=0,vx=0,vy=0;
 return {get size(){return n;},add(x,y){const old=mx,oy=my;n++;mx+=(x-mx)/n;my+=(y-my)/n;c+=(x-old)*(y-my);vx+=(x-old)*(x-mx);vy+=(y-oy)*(y-my);},remove(x,y){if(n<=1){n=0;mx=my=c=vx=vy=0;return;}const old=mx,oy=my;n--;mx-=(x-mx)/n;my-=(y-my)/n;c-=(x-old)*(y-my);vx=Math.max(0,vx-(x-old)*(x-mx));vy=Math.max(0,vy-(y-oy)*(y-my));},value(method,ddof){if(!n)return null;if(method==='cov')return clean(c/(n-ddof));if(n<=ddof)return null;return vx>0&&vy>0?clean(c/Math.sqrt(vx*vy)):null;}};
}
const bound=(a,value,inclusive)=>{let lo=0,hi=a.length;while(lo<hi){const mid=(lo+hi)>>>1;if(a[mid]<value||inclusive&&a[mid]===value)lo=mid+1;else hi=mid;}return lo;};
export const windowMethods=['rolling','expanding','shift','diff','pct_change','cumsum','cumprod','cummin','cummax'];
export const windowAggregates=['sum','mean','median','count','min','max','std','var','quantile','cov','corr'];
export function windowOperation(rows,columns,op){
 const p=op.params,selected=p.columns,groups=p.groups??[],method=p.method??'rolling',agg=p.aggregate??'mean';
 for(const keys of [selected,groups])if(!Array.isArray(keys)||new Set(keys).size!==keys.length||keys.some(c=>!columns.includes(c)))fail('missingColumn');
 if(!selected.length||!windowMethods.includes(method)||!windowAggregates.includes(agg))fail('invalidOperation');
 const pair=['cov','corr'].includes(agg)&&['rolling','expanding'].includes(method);if(pair&&!columns.includes(p.other))fail('missingColumn');
 const specs=selected.map(column=>({column,name:`${p.prefix??''}${column}_${method}${['rolling','expanding'].includes(method)?'_'+agg:''}`}));
 const names=[...columns,...specs.map(s=>s.name)];if(new Set(names).size!==names.length)fail('duplicateColumns');if(names.length>200||rows.length*names.length>2000000)fail('tooManyRows');
 const periods=Number(p.periods??1),window=Number(p.window??5),ddof=Number(p.ddof??1),q=Number(p.q??.5),time=p.unit!=null&&p.unit!=='records',center=p.center==='include',closed=p.closed??'right';
 const minimum=p.minPeriods==null||p.minPeriods===''?(method==='rolling'&&!time?window:1):Number(p.minPeriods);
 if(!Number.isInteger(periods)||!Number.isInteger(ddof)||ddof<0||!Number.isInteger(minimum)||minimum<0||!Number.isFinite(q)||q<0||q>1)fail('invalidNumber');
 if(method==='rolling'&&(!Number.isFinite(window)||window<0||!time&&!Number.isInteger(window)||!time&&minimum>window))fail('invalidNumber');
 if(!['right','left','both','neither'].includes(closed))fail('invalidOperation');
 const units={days:86400000,hours:3600000,minutes:60000};if(time&&method==='rolling'&&(!units[p.unit]||!Number.isFinite(window*units[p.unit])||!columns.includes(p.timeColumn)))fail('invalidDate');
 if(p.order==='sorted'&&!columns.includes(p.orderColumn))fail('missingColumn');
 const grouped=new Map(),output=rows.map(r=>({...r,...Object.fromEntries(specs.map(s=>[s.name,null]))}));
 rows.forEach((r,i)=>{const values=groups.map(c=>missing(r[c])?null:r[c]);if(p.missing!=='include'&&values.includes(null))return;const key=JSON.stringify(values);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(i);});
 for(const indices of grouped.values()){
  if(p.order==='sorted')indices.sort((a,b)=>{const rawX=rows[a][p.orderColumn],rawY=rows[b][p.orderColumn],x=Number.isFinite(timestamp(rawX))?timestamp(rawX):rawX,y=Number.isFinite(timestamp(rawY))?timestamp(rawY):rawY;if(missing(x))return missing(y)?0:1;if(missing(y))return -1;return x<y?-1:x>y?1:0;});
  let times;if(time&&method==='rolling'){times=indices.map(i=>timestamp(rows[i][p.timeColumn]));if(times.some((v,i)=>!Number.isFinite(v)||i>0&&v<times[i-1]))fail('windowTimeOrder');}
  const bounds=indices.map((_,i)=>{
   if(method==='expanding')return [0,i+1];
   if(time&&method==='rolling'){const span=window*units[p.unit],start=times[i]-(center?span/2:span),end=times[i]+(center?span/2:0),left=bound(times,start,!['left','both'].includes(closed)),right=Math.min(center?times.length:i+1,bound(times,end,['right','both'].includes(closed)));return [Math.min(left,right,['right','both'].includes(closed)?i:right),right];}
   const offset=center||window===0?Math.floor((window-1)/2):0;let end=i+1+offset,start=end-window;if(['left','both'].includes(closed))start--;if(['left','neither'].includes(closed))end--;const a=Math.max(0,Math.min(indices.length,start)),b=Math.max(0,Math.min(indices.length,end));return [Math.min(a,b),b];
  });
  for(const spec of specs){
   const values=indices.map(i=>missing(rows[i][spec.column])?null:rows[i][spec.column]);if(method!=='shift'&&values.some(v=>v!=null&&!finite(v)))fail('invalidNumber');
   const others=pair?indices.map(i=>missing(rows[i][p.other])?null:rows[i][p.other]):null;if(others?.some(v=>v!=null&&!finite(v)))fail('invalidNumber');
   const numericValues=values.some(finite);
   let cumulative=method==='cumprod'?1:method==='cumsum'?0:null,poisoned=false;
   const stats=pair?pairStatistics():tree();let left=0,right=0;
   indices.forEach((original,i)=>{
    const current=values[i];let value=null;
    if(['rolling','expanding'].includes(method)){
     const [start,end]=bounds[i];while(right<end){if(finite(values[right])&&(!pair||finite(others[right])))stats.add(values[right],pair?others[right]:undefined);right++;}while(left<start){if(left<right&&finite(values[left])&&(!pair||finite(others[left])))stats.remove(values[left],pair?others[left]:undefined);left++;}
     // Bounds are monotonic for fixed and time windows. Handle an empty window.
     if(end>=start&&(agg==='count'?end-start:stats.size)>=minimum)value=stats.value(agg,ddof,q);
    }else if(['shift','diff','pct_change'].includes(method)){
     const j=i-periods,other=j>=0&&j<values.length?values[j]:null;
     if(method==='shift'){value=other;if((j<0||j>=values.length)&&p.fillValue!=null&&p.fillValue!==''){value=numericValues?Number(p.fillValue):p.fillValue;if(numericValues&&!Number.isFinite(value))fail('invalidNumber');}}
     else if(current!=null&&other!=null)value=clean(method==='diff'?current-other:current/other-1);
    }else if(current==null){if(p.skipMissing==='exclude')poisoned=true;}
    else if(!poisoned){cumulative=method==='cumsum'?cumulative+current:method==='cumprod'?cumulative*current:method==='cummin'?cumulative==null?current:Math.min(cumulative,current):cumulative==null?current:Math.max(cumulative,current);value=clean(cumulative);}
    output[original][spec.name]=value;
   });
  }
 }
 // Keep each displayed series in its calculation order; sample only for rendering.
 const chartGroups=[...grouped.entries()].slice(0,6).map(([key,indices])=>({key:JSON.parse(key),count:indices.length,points:indices.filter((_,i)=>i===0||i===indices.length-1||i%Math.max(1,Math.ceil(indices.length/500))===0).map(index=>({position:index,label:p.orderColumn?rows[index][p.orderColumn]:p.timeColumn?rows[index][p.timeColumn]:index,values:specs.map(s=>({source:rows[index][s.column]??null,result:output[index][s.name]}))}))}));
 return {rows:output,columns:names,analysis:{kind:'windows',method,aggregate:agg,specs,groups:chartGroups,totalGroups:grouped.size,sourceRows:rows.length,unit:p.unit??'records',separateResult:pair,other:pair?p.other:null}};
}
