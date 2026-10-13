// Statistics are pure operations so previews, exports and replay share one calculation.
export const statisticalTypes = ['describe', 'quantiles', 'frequencies', 'correlation', 'iqr', 'selectTypes'];
const missing = value => value == null || value === '';
const numeric = value => typeof value === 'number' && Number.isFinite(value);
const fail = key => { throw new Error(key); };
export function typeOfColumn(rows, column) {
  const values=rows.map(row=>row[column]).filter(value=>!missing(value));
  if(!values.length)return 'empty';
  if(values.some(Array.isArray))return 'list';
  if(values.every(numeric))return 'number';
  if(values.every(value=>typeof value==='boolean'))return 'boolean';
  if(values.every(value=>/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(String(value))&&Number.isFinite(Date.parse(String(value)))))return 'date';
  return 'text';
}
function columnsFor(rows, columns, params, numericOnly=false) {
  const selected=params.columns;
  if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||selected.some(column=>!columns.includes(column)))fail('missingColumn');
  if(numericOnly&&selected.some(column=>!['number','empty'].includes(typeOfColumn(rows,column))))fail('invalidNumber');
  return selected;
}
export function quantile(sorted, q, interpolation='linear') {
  if(!Number.isFinite(q)||q<0||q>1||!['linear','lower','higher','midpoint','nearest'].includes(interpolation))fail('invalidNumber');
  if(!sorted.length)return null;
  const position=(sorted.length-1)*q,low=Math.floor(position),high=Math.ceil(position);
  if(interpolation==='lower')return sorted[low];
  if(interpolation==='higher')return sorted[high];
  if(interpolation==='midpoint')return (sorted[low]+sorted[high])/2;
  if(interpolation==='nearest'){
    const fraction=position-low;
    return sorted[fraction===.5?(low%2===0?low:high):Math.round(position)];
  }
  return sorted[low]+(sorted[high]-sorted[low])*(position-low);
}
export function moments(values, ddof=1) {
  // Welford avoids cancellation in variance for large values with small spread.
  let count=0,mean=0,m2=0;
  for(const value of values){if(!numeric(value))continue;count++;const delta=value-mean;mean+=delta/count;m2+=delta*(value-mean);}
  const variance=count>ddof?Math.max(0,m2/(count-ddof)):null;
  return {count,mean:count?mean:null,var:variance,std:variance===null?null:Math.sqrt(variance)};
}
export function distribution(values,factor=1.5) {
  if(!Number.isFinite(factor)||factor<0)fail('invalidNumber');
  const sorted=values.filter(numeric).sort((a,b)=>a-b),q1=quantile(sorted,.25),median=quantile(sorted,.5),q3=quantile(sorted,.75);
  if(q1===null)return {count:0,min:null,max:null,q1:null,median:null,q3:null,iqr:null,lower:null,upper:null,whiskerLow:null,whiskerHigh:null,outliers:0,points:[]};
  const iqr=q3-q1,lower=q1-factor*iqr,upper=q3+factor*iqr;
  const inside=sorted.filter(value=>value>=lower&&value<=upper),outliers=sorted.filter(value=>value<lower||value>upper);
  return {count:sorted.length,min:sorted[0],max:sorted.at(-1),q1,median,q3,iqr,lower,upper,whiskerLow:inside[0]??null,whiskerHigh:inside.at(-1)??null,outliers:outliers.length,points:outliers.slice(0,200)};
}
function availableName(base,used) {let name=base;while(used.includes(name))name+='_' ;return name;}
function frequencyGroups(rows, keys, dropna) {
  const groups=new Map();
  rows.forEach(row=>{
    const values=keys.map(key=>missing(row[key])?null:row[key]);if(dropna&&values.some(value=>value===null))return;
    const token=JSON.stringify(values);if(!groups.has(token))groups.set(token,{values,count:0});groups.get(token).count++;
  });
  return [...groups.values()];
}
function averageRanks(values) {
  const order=values.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value),ranks=[];
  for(let start=0;start<order.length;){let end=start+1;while(end<order.length&&order[end].value===order[start].value)end++;for(let i=start;i<end;i++)ranks[order[i].index]=(start+1+end)/2;start=end;}
  return ranks;
}
function pairStatistic(pairs, method, minPeriods, ddof) {
  const n=pairs.length;if(n<minPeriods||!n||(method!=='covariance'&&n<2))return null;
  let x=pairs.map(pair=>pair[0]),y=pairs.map(pair=>pair[1]);
  if(method==='spearman'){x=averageRanks(x);y=averageRanks(y);}
  let meanX=0,meanY=0,cross=0,xx=0,yy=0;
  for(let i=0;i<n;i++){const dx=x[i]-meanX,dy=y[i]-meanY;meanX+=dx/(i+1);meanY+=dy/(i+1);cross+=dx*(y[i]-meanY);xx+=dx*(x[i]-meanX);yy+=dy*(y[i]-meanY);}
  if(method==='covariance')return n>ddof?cross/(n-ddof):null;
  if(xx<=0||yy<=0)return null;return Math.max(-1,Math.min(1,cross/Math.sqrt(xx*yy)));
}
export function statisticalOperation(rows,columns,op) {
  const p=op.params;
  if(op.type==='selectTypes'){
    if(!['number','text','date','boolean','list','empty'].includes(p.target)||!['include','exclude'].includes(p.mode))fail('invalidOperation');
    const names=columns.filter(column=>(typeOfColumn(rows,column)===p.target)===(p.mode==='include'));
    if(!names.length)fail('noMatchingColumns');return {columns:names,rows:rows.map(row=>Object.fromEntries(names.map(column=>[column,row[column]])))};
  }
  if(op.type==='iqr'){
    if(!columns.includes(p.column))fail('missingColumn');
    if(!['number','empty'].includes(typeOfColumn(rows,p.column)))fail('invalidNumber');
    const factor=Number(p.factor??1.5),stats=distribution(rows.map(row=>row[p.column]),factor),mode=p.mode??'mark';
    if(!['mark','remove','clip'].includes(mode))fail('invalidOperation');
    if(mode==='mark'&&(typeof p.name!=='string'||!p.name.trim()||columns.includes(p.name)))fail('duplicateColumns');
    const outlier=value=>numeric(value)&&(value<stats.lower||value>stats.upper);
    const resultRows=mode==='remove'?rows.filter(row=>!outlier(row[p.column])):rows.map(row=>({...row,...(mode==='mark'?{[p.name]:missing(row[p.column])?null:outlier(row[p.column])}:{[p.column]:numeric(row[p.column])?Math.min(stats.upper,Math.max(stats.lower,row[p.column])):row[p.column]})}));
    return {columns:mode==='mark'?[...columns,p.name]:columns,rows:resultRows,analysis:{kind:'iqr',column:p.column,factor,mode,boxes:[{column:p.column,...stats}],affected:rows.filter(row=>outlier(row[p.column])).length}};
  }
  const selected=columnsFor(rows,columns,p,['describe','frequencies'].includes(op.type)?false:true);
  if(op.type==='describe'){
    const factor=Number(p.factor??1.5),ddof=Number(p.ddof??1);if(!Number.isInteger(ddof)||ddof<0)fail('invalidNumber');
    const boxes=[];
    const output=selected.map(column=>{
      const values=rows.map(row=>row[column]).filter(value=>!missing(value)),type=typeOfColumn(rows,column);
      const groups=frequencyGroups(rows,[column],true).sort((a,b)=>b.count-a.count),m=moments(type==='number'?values:[],ddof),d=distribution(type==='number'?values:[],factor);
      if(type==='number')boxes.push({column,...d});
      return {field:column,type,count:values.length,missing:rows.length-values.length,unique:groups.length,top:type==='number'?null:groups[0]?.values[0]??null,freq:type==='number'?null:groups[0]?.count??null,mean:m.mean,std:m.std,var:m.var,min:d.min,q1:d.q1,median:d.median,q3:d.q3,max:d.max,iqr:d.iqr};
    });
    return {rows:output,columns:['field','type','count','missing','unique','top','freq','mean','std','var','min','q1','median','q3','max','iqr'],analysis:{kind:'describe',boxes,factor,ddof}};
  }
  if(op.type==='quantiles'){
    const q=Number(p.q);if(p.q===''||p.q==null)fail('invalidNumber');
    const output=selected.map(column=>({field:column,quantile:q,value:quantile(rows.map(row=>row[column]).filter(numeric).sort((a,b)=>a-b),q,p.interpolation??'linear')}));
    return {rows:output,columns:['field','quantile','value'],analysis:{kind:'quantiles',q}};
  }
  if(op.type==='frequencies'){
    if(!['exclude','include'].includes(p.missing??'exclude')||!['ascending','descending'].includes(p.direction??'descending'))fail('invalidOperation');
    const groups=frequencyGroups(rows,selected,(p.missing??'exclude')==='exclude'),total=groups.reduce((sum,group)=>sum+group.count,0);
    groups.sort((a,b)=>(a.count-b.count)*(p.direction==='ascending'?1:-1));
    const countName=availableName('count',selected),proportionName=availableName('proportion',[...selected,countName]),cumulativeName=availableName('cumulative',[...selected,countName,proportionName]);let cumulative=0;
    const output=groups.map(group=>{const proportion=total?group.count/total:0;cumulative+=proportion;return {...Object.fromEntries(selected.map((column,i)=>[column,group.values[i]])),[countName]:group.count,[proportionName]:proportion,[cumulativeName]:cumulative};});
    return {rows:output,columns:[...selected,countName,proportionName,cumulativeName],analysis:{kind:'frequencies',keys:selected,countName,proportionName,cumulativeName,total}};
  }
  if(op.type==='correlation'){
    const method=p.method??'pearson',minPeriods=Number(p.minPeriods??2),ddof=Number(p.ddof??1);
    if(!['pearson','spearman','covariance'].includes(method)||!Number.isInteger(minPeriods)||minPeriods<1||!Number.isInteger(ddof)||ddof<0)fail('invalidNumber');
    const effectiveDdof=method==='covariance'&&rows.some(row=>selected.some(column=>!numeric(row[column])))?1:ddof;
    const matrix=selected.map(()=>Array(selected.length).fill(null)),counts=selected.map(()=>Array(selected.length).fill(0));
    for(let i=0;i<selected.length;i++)for(let j=i;j<selected.length;j++){
      const pairs=[];for(const row of rows)if(numeric(row[selected[i]])&&numeric(row[selected[j]]))pairs.push([row[selected[i]],row[selected[j]]]);
      const value=pairStatistic(pairs,method,minPeriods,effectiveDdof);matrix[i][j]=matrix[j][i]=value;counts[i][j]=counts[j][i]=pairs.length;
    }
    const labelName=availableName('field',selected),output=selected.map((column,i)=>Object.fromEntries([[labelName,column],...selected.map((key,j)=>[key,matrix[i][j]])]));
    return {rows:output,columns:[labelName,...selected],analysis:{kind:'correlation',fields:selected,labelName,method,minPeriods,ddof:effectiveDdof,requestedDdof:ddof,matrix,counts}};
  }
  fail('invalidOperation');
}
export function pairSample(rows,x,y,limit=1500) {
  const valid=rows.flatMap((row,index)=>numeric(row[x])&&numeric(row[y])?[{x:row[x],y:row[y],row:index}]:[]);
  // Evenly spaced sampling is deterministic; counts always use all valid pairs.
  const stride=Math.max(1,valid.length/limit),sample=[];
  for(let i=0;i<Math.min(limit,valid.length);i++){const index=Math.floor(i*stride);sample.push(valid[index]);}
  return {x,y,count:valid.length,points:sample};
}
