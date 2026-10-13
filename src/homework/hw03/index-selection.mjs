import {booleanNumericLevels} from './index-labels.mjs';
const fail=key=>{throw new Error(key);},missing=v=>v==null||v==='';
function label(tuple,levels,partial=false){if(!Array.isArray(tuple)||!tuple.length||tuple.length>levels||!partial&&tuple.length!==levels||tuple.some(v=>!missing(v)&&!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v)))fail('invalidIndexLabels');return tuple.map(v=>missing(v)?null:v);}
function compareValue(a,b){if(missing(a)||missing(b))return missing(a)===missing(b)?0:missing(a)?-1:1;if(typeof a!==typeof b)fail('indexSliceOrder');if(typeof a==='boolean')a=+a;if(typeof b==='boolean')b=+b;if(typeof a!==typeof b)fail('indexSliceOrder');if(typeof a==='number')return a-b;const aa=Array.from(a),bb=Array.from(b);for(let i=0;i<Math.min(aa.length,bb.length);i++){const n=aa[i].codePointAt(0)-bb[i].codePointAt(0);if(n)return n;}return aa.length-bb.length;}
function compare(a,b,length=b.length){for(let i=0;i<length;i++){const n=compareValue(a[i],b[i]);if(n)return n;}return 0;}
function ordered(values,length,allowMissing=false){let ascending=true,descending=true;try{if(!allowMissing&&values.some(v=>v.slice(0,length).some(missing)))return {ascending:false,descending:false};for(let i=1;i<values.length;i++){const n=compare(values[i-1],values[i],length);if(n>0)ascending=false;if(n<0)descending=false;}}catch{return {ascending:false,descending:false};}return {ascending,descending};}
function bound(values,target,side,direction){let lo=0,hi=values.length;while(lo<hi){const mid=Math.floor((lo+hi)/2),n=direction*compare(values[mid],target);if(n<0||n===0&&side==='right')lo=mid+1;else hi=mid;}return lo;}
function slices(values,p,levels,token){
 const step=Number(p.step??1);if(!Number.isSafeInteger(step)||step===0)fail('invalidPositions');const start=p.start==null?null:label(p.start,levels,true),end=p.end==null?null:label(p.end,levels,true);if(!values.length)return [];
 const depth=Math.max(start?.length??0,end?.length??0),order=ordered(values,levels===1?1:depth,levels>1),direction=order.ascending?1:-1;
 if(levels>1&&depth&&!order.ascending)fail('indexSliceOrder');
 const locate=(target,side)=>{if(target===null)return side==='left'?0:values.length;
  if(levels>1)return bound(values,target,side,1);
  const matches=[];values.forEach((tuple,i)=>{if(token(tuple)===token(target))matches.push(i);});if(matches.length){if(matches.at(-1)-matches[0]+1!==matches.length)fail('indexSliceAmbiguous');return side==='left'?matches[0]:matches.at(-1)+1;}
  if(!order.ascending&&!order.descending)fail('indexSliceOrder');return bound(values,target,side,direction);
 };
 const first=start===null?(step>0?0:values.length-1):locate(start,step>0?'left':'right')-(step<0?1:0),last=end===null?(step>0?values.length-1:0):locate(end,step>0?'right':'left')-(step>0?1:0),positions=[];
 for(let i=first;step>0?i<=last:i>=last;i+=step)if(i>=0&&i<values.length)positions.push(i);return positions;
}
export function indexSelection(state,op){
 const {rows,columns,index}=state,p=op.params??{},levels=index.names.length,reindex=op.type==='reindex';let names=p.columns===undefined?[...columns]:p.columns;
 if(!Array.isArray(names)||new Set(names).size!==names.length||names.some(c=>typeof c!=='string'||!c.trim()||!reindex&&!columns.includes(c)))fail('missingColumn');
 const mixed=index.booleanNumeric??booleanNumericLevels(index.values,levels),token=tuple=>JSON.stringify(tuple.map((v,i)=>missing(v)?null:typeof v==='boolean'&&mixed[i]?+v:v));
 const source=new Map();index.values.forEach((tuple,i)=>{const id=token(tuple);if(!source.has(id))source.set(id,[]);source.get(id).push(i);});
 let targets,positions=[],kinds=[],requests;
 if(!reindex&&p.mode==='slice'){positions=slices(index.values,p,levels,token);targets=positions.map(i=>[...index.values[i]]);kinds=positions.map(()=> 'exact');requests=targets.length;}
 else{
  if(!reindex&&!['labels',undefined].includes(p.mode)||!Array.isArray(p.labels))fail('invalidIndexLabels');if(p.labels.length>100000||p.labels.length*levels>2000000||reindex&&p.labels.length*names.length>2000000||names.length>200)fail('tooManyRows');targets=p.labels.map(t=>label(t,levels));requests=targets.length;
  const method=reindex?p.method??'exact':'exact';if(!['exact','ffill','bfill','nearest'].includes(method))fail('invalidOperation');
  const same=targets.length===index.values.length&&targets.every((tuple,i)=>token(tuple)===token(index.values[i]));if(reindex&&source.size!==rows.length&&!same)fail('duplicateIndexReindex');
  const numericTargets=targets.some(t=>typeof t[0]==='number')&&targets.every(t=>t[0]===null||typeof t[0]==='number');
  let direction=1;if(method!=='exact'&&!same){const order=ordered(index.values,1);if(levels!==1||!order.ascending&&!order.descending||method==='nearest'&&index.values.some(v=>typeof v[0]!=='number'))fail('indexFillOrder');direction=order.ascending?1:-1;}
  const hasTolerance=p.tolerance!==undefined&&p.tolerance!==null&&p.tolerance!=='';const tolerance=hasTolerance?Number(p.tolerance):Infinity;if(hasTolerance&&!same&&(method==='exact'||!Number.isFinite(tolerance)||tolerance<0||levels!==1||index.values.some(v=>typeof v[0]!=='number')))fail('invalidIndexTolerance');
  if(reindex&&same){positions=targets.map((_,i)=>i);kinds=targets.map(()=> 'exact');}
  else for(const tuple of targets){const match=source.get(token(tuple));if(match){const added=reindex?1:match.length;if(positions.length+added>100000||(positions.length+added)*names.length>2000000||(positions.length+added)*levels>2000000)fail('tooManyRows');for(const sourcePosition of match){positions.push(sourcePosition);kinds.push('exact');if(reindex)break;}}
   else if(!reindex)fail('missingIndexLabel');
   else{let position=-1;if(method!=='exact'&&index.values.length){const absent=tuple[0]===null;if(absent&&(!numericTargets||index.values.some(t=>typeof t[0]!=='number')))fail('indexFillOrder');const i=absent?(direction===1?rows.length:0):bound(index.values,tuple,'left',direction);if(method==='ffill')position=i-1;else if(method==='bfill')position=i;else{if(!absent&&typeof tuple[0]!=='number')fail('indexFillOrder');const candidates=[i-1,i].filter(j=>j>=0&&j<rows.length);candidates.sort((a,b)=>Math.abs(index.values[a][0]-tuple[0])-Math.abs(index.values[b][0]-tuple[0])||index.values[b][0]-index.values[a][0]);position=candidates[0]??-1;}
    if(position<0||position>=rows.length||hasTolerance&&(absent||Math.abs(index.values[position][0]-tuple[0])>tolerance))position=-1;}
    positions.push(position);kinds.push(position<0?'new':'filled');}
   if(positions.length>100000||positions.length*names.length>2000000||positions.length*levels>2000000)fail('tooManyRows');
  }
  if(!reindex)targets=positions.map(i=>[...index.values[i]]);
 }
 if(positions.length>100000||positions.length*names.length>2000000||positions.length*levels>2000000||names.length>200)fail('tooManyRows');
 const fill=p.fillValue??null;if(fill!==null&&!['string','number','boolean'].includes(typeof fill)||typeof fill==='number'&&!Number.isFinite(fill))fail('invalidIndexValue');
 const output=positions.map(i=>Object.fromEntries(names.map(c=>[c,i<0||!columns.includes(c)?fill:rows[i][c]]))),matched=new Set(positions.filter(i=>i>=0)),counts={exact:kinds.filter(k=>k==='exact').length,filled:kinds.filter(k=>k==='filled').length,new:kinds.filter(k=>k==='new').length};
 const sampleIndices=positions.length<=50?positions.map((_,i)=>i):Array.from({length:50},(_,i)=>Math.round(i*(positions.length-1)/49));
 return {positions,rows:output,columns:[...names],index:{...index,names:[...index.names],values:targets,booleanNumeric:reindex?booleanNumericLevels(targets,levels):index.booleanNumeric??mixed},query:{operation:op.type,method:reindex?p.method??'exact':p.mode??'labels',requests,sourceRows:rows.length,outputRows:output.length,counts,omitted:rows.length-matched.size,mapping:sampleIndices.map(i=>({target:targets[i],source:positions[i],output:i,kind:kinds[i]}))}};
}
