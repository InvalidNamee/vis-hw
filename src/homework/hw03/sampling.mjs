import {roundEven} from './calculation.mjs';
const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='';
class Weights{
 constructor(weights){this.n=weights.length;this.tree=Array(this.n+1).fill(0);weights.forEach((w,i)=>this.add(i,w));}
 add(i,w){for(i++;i<=this.n;i+=i&-i)this.tree[i]+=w;}
 sum(){let s=0;for(let i=this.n;i;i-=i&-i)s+=this.tree[i];return s;}
 pick(value){let i=0,bit=1;while(bit*2<=this.n)bit*=2;for(;bit;bit>>=1){const next=i+bit;if(next<=this.n&&this.tree[next]<=value){value-=this.tree[next];i=next;}}return Math.min(i,this.n-1);}
}
export function samplingOperation(rows,columns,op){
 const p=op.params,groups=p.groups??[];if(!Array.isArray(groups)||new Set(groups).size!==groups.length||groups.some(c=>!columns.includes(c)))fail('missingColumn');
 const weighted=p.weighted==='include',replace=p.replace==='include',fraction=p.mode==='fraction';if(!['count','fraction'].includes(p.mode??'count')||!['appearance','sorted'].includes(p.groupOrder??'sorted')||!['draw','original'].includes(p.order??'draw'))fail('invalidOperation');
 if(weighted&&!columns.includes(p.weight))fail('missingColumn');if(weighted&&rows.some(row=>!missing(row[p.weight])&&(typeof row[p.weight]!=='number'||!Number.isFinite(row[p.weight])||row[p.weight]<0)))fail('invalidWeights');let seed=Number(p.seed??42);if(!Number.isInteger(seed))fail('invalidNumber');seed>>>=0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const amount=Number(fraction?p.fraction??.1:p.count??10);if(!Number.isFinite(amount)||amount<0||!fraction&&!Number.isInteger(amount)||fraction&&amount>1&&!replace)fail('invalidSample');
 const partitions=new Map();if(!groups.length)partitions.set('[]',{keys:[],indices:[]});let excluded=0;
 rows.forEach((row,i)=>{const keys=groups.map(c=>missing(row[c])?null:row[c]);if(keys.includes(null)&&p.missing!=='include'){excluded++;return;}const id=JSON.stringify(keys);if(!partitions.has(id))partitions.set(id,{keys,indices:[]});partitions.get(id).indices.push(i);});
 const entries=[...partitions.values()];if((p.groupOrder??'sorted')==='sorted')entries.sort((a,b)=>{for(let i=0;i<a.keys.length;i++){const x=a.keys[i],y=b.keys[i];if(x===y)continue;if(x===null)return 1;if(y===null)return -1;if(typeof x==='number'&&typeof y==='number')return x-y;return String(x)<String(y)?-1:1;}return 0;});
 let capacity=0;for(const g of entries){g.n=fraction?roundEven(g.indices.length*amount,0):amount;if(!replace&&g.n>g.indices.length||replace&&g.n>0&&!g.indices.length)fail('invalidSample');capacity+=g.n;if(capacity>100000||capacity*columns.length>2000000)fail('tooManyRows');}
 const indices=[],summary=[];
 for(const g of entries){let selected=[];if(weighted){const raw=g.indices.map(i=>{const v=rows[i][p.weight];if(missing(v))return 0;if(typeof v!=='number'||!Number.isFinite(v)||v<0)fail('invalidWeights');return v;}),max=Math.max(0,...raw);if(!max)fail('invalidWeights');const weights=raw.map(v=>v===0?0:Math.max(Number.MIN_VALUE,v/max));if(!replace&&weights.filter(v=>v>0).length<g.n)fail('invalidWeights');let tree=new Weights(weights);for(let i=0;i<g.n;i++){const u=random();if(tree.sum()<=0)tree=new Weights(weights);let index=tree.pick(u*tree.sum());if(weights[index]<=0){tree=new Weights(weights);index=tree.pick(u*tree.sum());}if(weights[index]<=0)fail('invalidWeights');selected.push(g.indices[index]);if(!replace){tree.add(index,-weights[index]);weights[index]=0;}}}
 else if(replace){selected=Array.from({length:g.n},()=>g.indices[Math.floor(random()*g.indices.length)]);}
 else{const shuffled=[...g.indices];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}selected=shuffled.slice(0,g.n);}
 indices.push(...selected);summary.push({keys:g.keys,before:g.indices.length,after:selected.length,unique:new Set(selected).size});}
 if(p.order==='original')indices.sort((a,b)=>a-b);
 return {columns,rows:indices.map(i=>({...rows[i]})),analysis:{kind:'sampling',total:rows.length,output:indices.length,unique:new Set(indices).size,excluded,groups:summary.length,summary:summary.slice(0,100),replace,weighted}};
}
