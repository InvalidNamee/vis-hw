import {dateParser} from './datetime.mjs';
import {typeOfColumn} from './statistics.mjs';
export const cleaningTypes=['dedup','dropMissing','fill'];
const missing=value=>value==null||value==='';
const numeric=value=>typeof value==='number'&&Number.isFinite(value);
const fail=key=>{throw new Error(key);};
function keysFor(columns,p,defaultAll=false){
  const keys=p.columns??(p.column?[p.column]:defaultAll?columns:[]);
  if(!Array.isArray(keys)||!keys.length||new Set(keys).size!==keys.length||keys.some(key=>!columns.includes(key)))fail('missingColumn');return keys;
}
const token=(row,keys)=>JSON.stringify(keys.map(key=>missing(row[key])?null:row[key]));
function limitValue(value){if(value===''||value==null)return Infinity;const n=Number(value);if(!Number.isInteger(n)||n<1)fail('invalidNumber');return n;}
function statistic(values,method){
  const valid=values.filter(value=>!missing(value));if(!valid.length)return null;
  if(method==='mode'){
    const counts=new Map();for(const value of valid){const key=JSON.stringify(value);if(!counts.has(key))counts.set(key,{value,count:0});counts.get(key).count++;}
    return [...counts.values()].sort((a,b)=>b.count-a.count||(typeof a.value==='number'&&typeof b.value==='number'?a.value-b.value:String(a.value)<String(b.value)?-1:1))[0].value;
  }
  if(valid.some(value=>!numeric(value)))fail('invalidNumber');
  if(method==='mean')return valid.reduce((sum,value)=>sum+value,0)/valid.length;
  const sorted=[...valid].sort((a,b)=>a-b);return (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;
}
function fillValues(values,p,type,coordinates=null){
  const method=p.method,limit=limitValue(p.limit),output=[...values];
  if(['mean','median','mode','constant'].includes(method)){
    let value=method==='constant'?p.value:statistic(values,method);
    if(method==='constant'&&type==='number'){if(value==null||String(value).trim()===''||!Number.isFinite(Number(value)))fail('invalidNumber');value=Number(value);}
    if(method==='constant'&&type==='boolean'){if(value===true||value==='true')value=true;else if(value===false||value==='false')value=false;else fail('invalidNumber');}
    if(missing(value)){if(method==='constant')fail('noValues');return output;}
    let filled=0;return output.map(v=>missing(v)&&filled<limit?(filled++,value):v);
  }
  if(method==='ffill'||method==='bfill'){
    let donor=null,run=0;
    for(let count=0;count<values.length;count++){const i=method==='ffill'?count:values.length-1-count;if(!missing(values[i])){donor=values[i];run=0;}else{run++;if(!missing(donor)&&run<=limit)output[i]=donor;}}
    return output;
  }
  if(method==='interpolate'||method==='timeInterpolate'){
    if(values.some(value=>!missing(value)&&!numeric(value)))fail('invalidNumber');
    const direction=p.direction??'forward';if(!['forward','backward','both'].includes(direction))fail('invalidOperation');
    const area=p.area??'all';if(!['all','inside','outside'].includes(area))fail('invalidOperation');
    const anchors=coordinates?values.flatMap((v,i)=>missing(v)?[]:[{x:coordinates[i],value:v}]).sort((a,b)=>a.x-b.x):null;
    const atTime=x=>{let lo=0,hi=anchors.length;while(lo<hi){const mid=(lo+hi)>>>1;if(anchors[mid].x<=x)lo=mid+1;else hi=mid;}if(!lo)return anchors[0].value;if(lo===anchors.length)return anchors.at(-1).value;const a=anchors[lo-1],b=anchors[lo];return a.value+(b.value-a.value)*(x-a.x)/(b.x-a.x);};
    let left=-1;
    for(let start=0;start<values.length;){if(!missing(values[start])){left=start;start++;continue;}let right=start;while(right<values.length&&missing(values[right]))right++;
      for(let i=start;i<right;i++){
        const fromLeft=left>=0&&direction!=='backward'&&i-left<=limit,fromRight=right<values.length&&direction!=='forward'&&right-i<=limit;
        const inside=left>=0&&right<values.length;if(area==='inside'&&!inside||area==='outside'&&inside)continue;
        if(fromLeft||fromRight){const value=coordinates?atTime(coordinates[i]):left<0?values[right]:right===values.length?values[left]:values[left]+(values[right]-values[left])*(i-left)/(right-left);output[i]=Number.isFinite(value)?value:null;}
      }
      start=right;
    }
    return output;
  }
  fail('invalidOperation');
}
export function cleaningOperation(rows,columns,op){
  const p=op.params,keys=keysFor(columns,p,op.type==='dedup'||op.type==='dropMissing');
  if(op.type==='dedup'){
    const keep=p.keep??'first',mode=p.mode??'remove';if(!['first','last','none'].includes(keep)||!['remove','mark'].includes(mode))fail('invalidOperation');
    if(mode==='mark'&&(typeof p.name!=='string'||!p.name.trim()||columns.includes(p.name)))fail('duplicateColumns');
    const groups=new Map();rows.forEach((row,index)=>{const key=token(row,keys);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(index);});
    const duplicate=new Set();for(const indices of groups.values())for(const index of indices)if(keep==='none'?indices.length>1:keep==='first'?index!==indices[0]:index!==indices.at(-1))duplicate.add(index);
    return {columns:mode==='mark'?[...columns,p.name]:columns,rows:mode==='mark'?rows.map((row,index)=>({...row,[p.name]:duplicate.has(index)})):rows.filter((_,index)=>!duplicate.has(index))};
  }
  if(op.type==='dropMissing'){
    const how=p.how??'any',axis=p.axis??'rows';if(!['any','all','threshold','ratio'].includes(how)||!['rows','columns'].includes(axis))fail('invalidOperation');
    const threshold=Number(p.threshold),ratio=Number(p.ratio);
    if(how==='threshold'&&(!Number.isInteger(threshold)||threshold<0)||how==='ratio'&&(!Number.isFinite(ratio)||ratio<0||ratio>1))fail('invalidNumber');
    const retain=values=>{const valid=values.filter(value=>!missing(value)).length;return how==='any'?valid===values.length:how==='all'?valid>0:how==='threshold'?valid>=threshold:!values.length||(values.length-valid)/values.length<=ratio;};
    if(axis==='rows')return {columns,rows:rows.filter(row=>retain(keys.map(key=>row[key])))};
    const names=columns.filter(column=>!keys.includes(column)||retain(rows.map(row=>row[column])));return {columns:names,rows:rows.map(row=>Object.fromEntries(names.map(column=>[column,row[column]])))};
  }
  if(op.type==='fill'){
    const by=p.groups??[];if(!Array.isArray(by)||by.some(column=>!columns.includes(column))||new Set(by).size!==by.length)fail('missingColumn');
    if(!['mean','median','mode','constant','ffill','bfill','interpolate','timeInterpolate'].includes(p.method))fail('invalidOperation');limitValue(p.limit);
    const groups=new Map();rows.forEach((row,index)=>{const key=token(row,by);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(index);});
    let coordinates=null;if(p.method==='timeInterpolate'){if(!columns.includes(p.timeColumn))fail('missingColumn');const parse=dateParser();coordinates=rows.map(row=>{const t=parse(row[p.timeColumn]);if(t===null)fail('invalidDate');return t;});}
    const output=rows.map(row=>({...row}));
    for(const column of keys){const type=typeOfColumn(rows,column);for(const indices of groups.values()){const filled=fillValues(indices.map(index=>rows[index][column]),p,type,coordinates?indices.map(i=>coordinates[i]):null);indices.forEach((index,i)=>output[index][column]=filled[i]);}}
    const interpolating=['interpolate','timeInterpolate'].includes(p.method);if(!interpolating)return {columns,rows:output};
    const specs=keys.map(column=>({column,name:column})),chartGroups=[...groups.entries()].slice(0,6).map(([key,indices])=>({key:JSON.parse(key),count:indices.length,points:indices.filter((_,i)=>i===0||i===indices.length-1||i%Math.max(1,Math.ceil(indices.length/500))===0).map(i=>({position:i,label:coordinates?rows[i][p.timeColumn]:i,values:keys.map(c=>({source:rows[i][c]??null,result:output[i][c]}))}))}));
    return {columns,rows:output,analysis:{kind:'windows',method:'interpolate',specs,groups:chartGroups,totalGroups:groups.size,sourceRows:rows.length}};
  }
  fail('invalidOperation');
}
