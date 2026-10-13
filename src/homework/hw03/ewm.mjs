import {dateParser} from './datetime.mjs';
const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='',finite=v=>typeof v==='number'&&Number.isFinite(v),clean=v=>Number.isFinite(v)?v:null;
export function ewmSeries(xs,ys,p,alpha,decays=null){
 const adjust=p.adjust!=='exclude',ignore=p.ignoreMissing==='include',method=p.method??'mean',minimum=Math.max(1,Number(p.minPeriods??0)),bias=p.bias==='include',decay=1-alpha,newWeight=adjust?1:alpha,out=[];
 let meanX=null,meanY=null,cov=0,varX=0,varY=0,oldWeight=1,sumWeight=1,sumWeight2=1,count=0,total=null;
 for(let i=0;i<xs.length;i++){
  const x=xs[i],y=ys?ys[i]:x,valid=finite(x)&&(!['cov','corr'].includes(method)||finite(y));if(valid)count++;
  if(method==='sum'){
   if(total===null){if(valid)total=x;}else if(valid||!ignore){total*=decay;if(valid)total+=x;}out.push(count>=minimum&&total!==null?clean(total):null);continue;
  }
  if(meanX===null){if(valid){meanX=x;meanY=y;}}
  else if(valid||!ignore){
   const stepDecay=decays?.[i]??decay;oldWeight*=stepDecay;sumWeight*=stepDecay;sumWeight2*=stepDecay*stepDecay;
   if(valid){const oldX=meanX,oldY=meanY,denom=oldWeight+newWeight;
    if(meanX!==x)meanX=(oldWeight*meanX+newWeight*x)/denom;if(meanY!==y)meanY=(oldWeight*meanY+newWeight*y)/denom;
    cov=(oldWeight*(cov+(oldX-meanX)*(oldY-meanY))+newWeight*(x-meanX)*(y-meanY))/denom;
    varX=(oldWeight*(varX+(oldX-meanX)**2)+newWeight*(x-meanX)**2)/denom;
    varY=(oldWeight*(varY+(oldY-meanY)**2)+newWeight*(y-meanY)**2)/denom;
    sumWeight+=newWeight;sumWeight2+=newWeight*newWeight;oldWeight+=newWeight;
    if(!adjust){sumWeight/=oldWeight;sumWeight2/=oldWeight*oldWeight;oldWeight=1;}
   }
  }
  let value=null;if(count>=minimum&&meanX!==null){if(method==='mean')value=meanX;else if(method==='corr')value=varX>0&&varY>0?cov/Math.sqrt(varX*varY):null;else{const numerator=sumWeight*sumWeight,denominator=numerator-sumWeight2,variance=method==='cov'?cov:varX;value=bias?variance:denominator>0?variance*numerator/denominator:null;if(method==='std'&&value!==null)value=Math.sqrt(Math.max(0,value));}}
  out.push(value===null?null:clean(value));
 }
 return out;
}
export function ewmOperation(rows,columns,op){
 const p=op.params,fields=p.columns,keys=p.groups??[],method=p.method??'mean',decayMethod=p.decay??'span',v=Number(p.value??5);if(!Array.isArray(fields)||!fields.length||new Set(fields).size!==fields.length||!Array.isArray(keys)||new Set(keys).size!==keys.length||[...fields,...keys].some(c=>!columns.includes(c)))fail('missingColumn');
 if(!['mean','sum','std','var','cov','corr'].includes(method)||!['alpha','span','com','halflife','time'].includes(decayMethod)||!['appearance','sorted'].includes(p.order??'appearance'))fail('invalidOperation');
 if(!Number.isFinite(v)||decayMethod==='alpha'&&(v<=0||v>1)||decayMethod==='span'&&v<1||decayMethod==='com'&&v<0||['halflife','time'].includes(decayMethod)&&v<=0)fail('invalidDecay');
 if(decayMethod==='time'&&(method!=='mean'||p.adjust==='exclude'))fail('ewmTimeMean');if(decayMethod==='time'&&!columns.includes(p.timeColumn))fail('missingColumn');
 const alpha=decayMethod==='time'?.5:decayMethod==='alpha'?v:decayMethod==='span'?2/(v+1):decayMethod==='com'?1/(v+1):-Math.expm1(Math.log(.5)/v),minimum=Number(p.minPeriods??0);if(!Number.isInteger(minimum)||minimum<0)fail('invalidNumber');
 if(method==='sum'&&p.adjust==='exclude')fail('ewmSumAdjust');if(['cov','corr'].includes(method)&&!columns.includes(p.other)||p.order==='sorted'&&!columns.includes(p.orderColumn))fail('missingColumn');
 for(const row of rows)for(const c of [...fields,...(['cov','corr'].includes(method)?[p.other]:[])])if(!missing(row[c])&&!finite(row[c]))fail('invalidNumber');
 const specs=fields.map(column=>({column,name:String(p.prefix??'')+column+'_ewm_'+method+(['cov','corr'].includes(method)?'_'+p.other:'')})),names=specs.map(s=>s.name);if(names.some(n=>!n.trim()||columns.includes(n))||new Set(names).size!==names.length)fail('duplicateColumns');if(columns.length+names.length>200||rows.length*(columns.length+names.length)>2000000)fail('tooManyRows');
 const grouped=new Map();rows.forEach((r,i)=>{const vals=keys.map(k=>missing(r[k])?null:r[k]);if(vals.includes(null)&&p.missing!=='include')return;const key=JSON.stringify(vals);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(i);});
 const parseTime=dateParser(),duration=decayMethod==='time'?v*({milliseconds:1,seconds:1000,minutes:60000,hours:3600000,days:86400000}[p.timeUnit??'days']??fail('invalidOperation')):null;
 const times=decayMethod==='time'?rows.map(row=>{const t=parseTime(row[p.timeColumn]);if(t===null)fail('invalidDate');return t;}):null;
 const sortable=v=>{if(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v)){return parseTime(v);}return v;};
 if(p.order==='sorted')for(const indices of grouped.values()){indices.forEach(i=>sortable(rows[i][p.orderColumn]));indices.sort((a,b)=>{const x=sortable(rows[a][p.orderColumn]),y=sortable(rows[b][p.orderColumn]);if(missing(x)||missing(y))return missing(x)?missing(y)?a-b:1:-1;return x<y?-1:x>y?1:a-b;});}
 const output=rows.map(row=>Object.fromEntries([...columns.map(c=>[c,row[c]]),...names.map(c=>[c,null])]));
 for(const indices of grouped.values())for(const spec of specs){const xs=indices.map(i=>rows[i][spec.column]),ys=['cov','corr'].includes(method)?indices.map(i=>rows[i][p.other]):null,decays=times?indices.map((index,i)=>{const delta=i?times[index]-times[indices[i-1]]:0;if(delta<0)fail('windowTimeOrder');return Math.exp(Math.log(.5)*delta/duration);}):null,values=ewmSeries(xs,ys,p,alpha,decays);indices.forEach((index,i)=>output[index][spec.name]=values[i]);}
 const chartGroups=[...grouped.entries()].slice(0,6).map(([key,indices])=>({key:JSON.parse(key),count:indices.length,points:indices.filter((_,i)=>i===0||i===indices.length-1||i%Math.max(1,Math.ceil(indices.length/500))===0).map(index=>({position:index,label:times?rows[index][p.timeColumn]:p.orderColumn?rows[index][p.orderColumn]:index,values:specs.map(s=>({source:rows[index][s.column]??null,result:output[index][s.name]}))}))}));
 return {rows:output,columns:[...columns,...names],analysis:{kind:'windows',method:'ewm',aggregate:method,alpha,timeDecay:decayMethod==='time'?{value:v,unit:p.timeUnit??'days'}:null,specs,groups:chartGroups,totalGroups:grouped.size,sourceRows:rows.length,separateResult:['var','cov','corr'].includes(method)}};
}
