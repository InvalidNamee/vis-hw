import {reduceGroup,aggregationMethods} from './grouping.mjs';
const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='';
const utc=c=>{const d=new Date(0);d.setUTCFullYear(c.year,c.month-1,c.day);d.setUTCHours(c.hour??0,c.minute??0,c.second??0,c.ms??0);return +d;};
const fromUTC=t=>{const d=new Date(t);return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds(),ms:d.getUTCMilliseconds()};};
const equal=(a,b)=>['year','month','day','hour','minute','second','ms'].every(k=>(a[k]??0)===(b[k]??0));
const formatters=new Map();
function offsetZone(zone){if(zone==='UTC'||zone==='Z')return 0;const m=/^([+-])(\d{2}):?(\d{2})$/.exec(zone);if(!m)return null;const minutes=Number(m[2])*60+Number(m[3]);if(Number(m[2])>23||Number(m[3])>59)fail('invalidTimezone');return minutes*60000*(m[1]==='-'?-1:1);}
export function civilParts(t,zone='UTC'){
 const offset=offsetZone(zone);if(offset!==null)return fromUTC(t+offset);
 let f=formatters.get(zone);if(!f){try{f=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',fractionalSecondDigits:3,hourCycle:'h23'});}catch{fail('invalidTimezone');}formatters.set(zone,f);}
 const p=Object.fromEntries(f.formatToParts(new Date(t)).map(p=>[p.type,p.value]));return {year:Number(p.year),month:Number(p.month),day:Number(p.day),hour:Number(p.hour),minute:Number(p.minute),second:Number(p.second),ms:Number(p.fractionalSecond)};
}
function localize(c,zone,ambiguous='raise'){
 const base=utc(c),fixed=offsetZone(zone);if(fixed!==null)return base-fixed;
 const offsets=new Set([-36,-12,0,12,36].map(h=>{const t=base+h*3600000;return utc(civilParts(t,zone))-t;}));
 const candidates=[...offsets].map(offset=>base-offset).filter(t=>equal(civilParts(t,zone),c)).sort((a,b)=>a-b);
 if(!candidates.length)fail('nonexistentTime');if(candidates.length>1&&ambiguous==='raise')fail('ambiguousTime');return ambiguous==='latest'?candidates.at(-1):candidates[0];
}
function formattedInput(value,format){
 if(!format)return value;const tokens={Y:'(?<year>\\d{4})',m:'(?<month>\\d{1,2})',d:'(?<day>\\d{1,2})',H:'(?<hour>\\d{1,2})',M:'(?<minute>\\d{1,2})',S:'(?<second>\\d{1,2})',f:'(?<fraction>\\d{1,6})',z:'(?<zone>Z|[+-]\\d{2}:?\\d{2})','%':'%'};let pattern='';
 for(let i=0;i<format.length;i++){if(format[i]==='%'){const key=format[++i];if(!tokens[key])fail('invalidDateFormat');pattern+=tokens[key];}else pattern+=format[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
 let match;try{match=new RegExp('^'+pattern+'$').exec(value);}catch{fail('invalidDateFormat');}if(!match)fail('invalidDate');const p=match.groups??{};if(!p.year||!p.month||!p.day)fail('invalidDateFormat');
 return `${p.year}-${p.month.padStart(2,'0')}-${p.day.padStart(2,'0')}T${(p.hour??'0').padStart(2,'0')}:${(p.minute??'0').padStart(2,'0')}:${(p.second??'0').padStart(2,'0')}.${(p.fraction??'0').padEnd(3,'0').slice(0,3)}${p.zone??''}`;
}
export function dateParser(params={}){
 const zone=String(params.sourceZone??'UTC'),ambiguous=params.ambiguous??'raise',format=String(params.format??'');if(!['raise','earliest','latest'].includes(ambiguous)||!['raise','coerce'].includes(params.errors??'raise'))fail('invalidOperation');civilParts(0,zone);const cache=new Map();
 return value=>{if(missing(value))return null;if(cache.has(value))return cache.get(value);let result;
 try{if(typeof value!=='string')fail('invalidDate');const s=formattedInput(value,format),m=/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(s);if(!m)fail('invalidDate');
 const c={year:+m[1],month:+m[2],day:+m[3],hour:+(m[4]??0),minute:+(m[5]??0),second:+(m[6]??0),ms:Number((m[7]??'').padEnd(3,'0').slice(0,3))};if(c.year<1||!equal(fromUTC(utc(c)),c))fail('invalidDate');result=localize(c,m[8]??zone,ambiguous);
 }catch(e){if(params.errors==='coerce'&&['invalidDate','ambiguousTime','nonexistentTime'].includes(e.message))result=null;else throw e;}
 if(cache.size<20000)cache.set(value,result);return result;};
}
export const dateParts=['year','quarter','month','day','hour','minute','second','weekday','dayofyear','week','weekyear','daysinmonth','is_month_start','is_month_end','is_quarter_start','is_quarter_end','is_year_start','is_year_end','is_leap_year'];
function extracted(t,zone){const c=civilParts(t,zone),day=utc({...c,hour:0,minute:0,second:0,ms:0}),d=new Date(day),weekday=(d.getUTCDay()+6)%7,leap=c.year%4===0&&(c.year%100!==0||c.year%400===0),days=new Date(utc({year:c.year,month:c.month+1,day:0})).getUTCDate(),thursday=day+(3-weekday)*86400000,weekyear=new Date(thursday).getUTCFullYear(),week=Math.floor((thursday-utc({year:weekyear,month:1,day:1}))/604800000)+1;
 return {...c,quarter:Math.floor((c.month-1)/3)+1,weekday,dayofyear:Math.round((day-utc({year:c.year,month:1,day:1}))/86400000)+1,week,weekyear,daysinmonth:days,is_month_start:c.day===1,is_month_end:c.day===days,is_quarter_start:c.day===1&&(c.month-1)%3===0,is_quarter_end:c.day===days&&c.month%3===0,is_year_start:c.month===1&&c.day===1,is_year_end:c.month===12&&c.day===31,is_leap_year:leap};}
function calendarBoundary(t,freq,zone){let c=civilParts(t,zone);c={...c,hour:0,minute:0,second:0,ms:0};if(freq==='week'){const weekday=(new Date(utc(c)).getUTCDay()+6)%7;c=fromUTC(utc(c)-weekday*86400000);}if(['month','quarter','year'].includes(freq))c.day=1;if(freq==='quarter')c.month=Math.floor((c.month-1)/3)*3+1;if(freq==='year')c.month=1;return localize(c,zone,'earliest');}
function shiftBoundary(t,freq,zone,n=1){const c=civilParts(t,zone),d=new Date(utc(c));if(freq==='day'||freq==='week')d.setUTCDate(d.getUTCDate()+n*(freq==='week'?7:1));else d.setUTCMonth(d.getUTCMonth()+n*(freq==='quarter'?3:freq==='year'?12:1));return localize(fromUTC(+d),zone,'earliest');}
export function datetimeOperation(rows,columns,op){
 const p=op.params,c=p.column;if(!columns.includes(c))fail('missingColumn');const parse=dateParser(p),zone=String(p.zone??'UTC');civilParts(0,zone);const timestamps=rows.map(row=>parse(row[c]));
 if(op.type==='resample')return resample(rows,columns,p,timestamps,zone);
 let names,values;
 if(op.type==='dateparts'){const parts=p.parts??['year','month','day'];if(!Array.isArray(parts)||!parts.length||new Set(parts).size!==parts.length||parts.some(v=>!dateParts.includes(v)))fail('invalidOperation');names=parts.map(v=>String(p.prefix??'date_')+v);values=timestamps.map(t=>{if(t===null)return parts.map(k=>k.startsWith('is_')?false:null);const values=extracted(t,zone);return parts.map(k=>values[k]);});}
 else if(op.type==='datediff'){if(!columns.includes(p.other))fail('missingColumn');const unit=p.unit??'days',units={days:86400000,hours:3600000,minutes:60000,seconds:1000};if(!units[unit])fail('invalidOperation');names=[String(p.name??'date_difference')];values=rows.map((row,i)=>{const t=parse(row[p.other]);return [t===null||timestamps[i]===null?null:(timestamps[i]-t)/units[unit]];});}
 else if(op.type==='dateparse'){names=[String(p.name??'parsed_date')];values=timestamps.map(t=>[t===null?null:new Date(t).toISOString()]);}
 else fail('invalidOperation');
 if(names.some(n=>!n.trim()||columns.includes(n))||new Set(names).size!==names.length)fail('duplicateColumns');if(columns.length+names.length>200||rows.length*(columns.length+names.length)>2000000)fail('tooManyRows');
 return {columns:[...columns,...names],rows:rows.map((row,i)=>Object.fromEntries([...columns.map(k=>[k,row[k]]),...names.map((k,j)=>[k,values[i][j]])])),analysis:{kind:'datetime',method:op.type,column:c,names,zone,missing:timestamps.filter(t=>t===null).length,total:rows.length,samples:rows.slice(0,20).map((row,i)=>({before:[{name:c,value:row[c]},...(op.type==='datediff'?[{name:p.other,value:row[p.other]}]:[])],after:names.map((name,j)=>({name,value:values[i][j]}))}))}};
}
const finiteAggregate=(values,method,ddof)=>{const v=reduceGroup(values,method,ddof);return typeof v==='number'&&!Number.isFinite(v)?null:v;};
function resample(rows,columns,p,times,zone){
 const keys=p.groups??[],metrics=p.columns??[],methods=p.methods??['mean'],freq=p.frequency??'day',validFreq=['minute','hour','day','week','month','quarter','year'];
 if(!Array.isArray(keys)||!Array.isArray(metrics)||!Array.isArray(methods)||!metrics.length||!methods.length||[...keys,...metrics].some(c=>!columns.includes(c))||new Set(keys).size!==keys.length||new Set(metrics).size!==metrics.length||new Set(methods).size!==methods.length||methods.some(m=>!aggregationMethods.includes(m)))fail('missingColumn');
 if(!validFreq.includes(freq)||!['left','right'].includes(p.closed??'left')||!['left','right'].includes(p.label??'left'))fail('invalidOperation');
 const count=Number(p.every??1),step=(freq==='minute'?60000:3600000)*count,fixed=['minute','hour'].includes(freq);if(fixed&&(!Number.isInteger(count)||count<1||count>1000000))fail('invalidNumber');
 const name=String(p.name??'period'),metricNames=metrics.flatMap(c=>methods.map(m=>c+'_'+m)),names=[...keys,name,...metricNames];if(names.some(c=>!c.trim())||new Set(names).size!==names.length)fail('duplicateColumns');if(names.length>200)fail('tooManyRows');
 const ddof=Number(p.ddof??1);if(!Number.isInteger(ddof)||ddof<0)fail('invalidNumber');const groups=new Map();let excludedDates=0,excludedKeys=0;
 rows.forEach((row,i)=>{const t=times[i];if(t===null){excludedDates++;return;}const values=keys.map(k=>missing(row[k])?null:row[k]);if(values.includes(null)&&p.missing!=='include'){excludedKeys++;return;}const id=JSON.stringify(values);if(!groups.has(id))groups.set(id,{values,buckets:new Map(),records:[]});groups.get(id).records.push({row,t});});
 const origin=p.origin??'start_day';if(!['start_day','epoch','start'].includes(origin)||!['sorted','appearance'].includes(p.order??'sorted'))fail('invalidOperation');
 const groupList=[...groups.values()];if((p.order??'sorted')==='sorted')groupList.sort((a,b)=>{for(let i=0;i<a.values.length;i++){const x=a.values[i],y=b.values[i];if(x===y)continue;if(x===null)return 1;if(y===null)return -1;return x<y?-1:1;}return 0;});
 for(const group of groupList){let earliest=Infinity;for(const record of group.records)earliest=Math.min(earliest,record.t);const anchor=civilParts(earliest,zone),base=origin==='epoch'?localize({year:1970,month:1,day:1},zone,'earliest'):origin==='start'?earliest:calendarBoundary(earliest,'day',zone);group.records.sort((a,b)=>a.t-b.t);for(const {row,t} of group.records){let low=fixed?base+Math.floor((t-base)/step)*step:calendarBoundary(t,freq,zone);if(freq==='day'&&origin==='start'){const c=civilParts(t,zone);low=localize({...c,hour:anchor.hour,minute:anchor.minute,second:anchor.second,ms:anchor.ms},zone,'earliest');if(t<low)low=shiftBoundary(low,freq,zone,-1);}if((p.closed??'left')==='right'&&(t===low||freq==='week'&&(new Date(utc(civilParts(t,zone))).getUTCDay()===1)))low=fixed?low-step:shiftBoundary(low,freq,zone,-1);if(!group.buckets.has(low))group.buckets.set(low,[]);group.buckets.get(low).push(row);}}

 const output=[],summaries=[],chart=[];for(const group of groupList){const periods=[...group.buckets.keys()].sort((a,b)=>a-b),grid=[];if(p.gaps==='exclude')grid.push(...periods);else if(periods.length){const last=(p.closed==='right'&&['month','quarter','year'].includes(freq))?Math.max(periods.at(-1),calendarBoundary(group.records.at(-1).t,freq,zone)):periods.at(-1);let first=periods[0];if(p.closed==='right'&&['month','quarter','year'].includes(freq)){const t=group.records[0].t,base=calendarBoundary(t,freq,zone);if(base===calendarBoundary(t,'day',zone))first=Math.min(first,shiftBoundary(base,freq,zone,-1));}for(let t=first;t<=last;t=fixed?t+step:shiftBoundary(t,freq,zone)){grid.push(t);if(output.length+grid.length>100000||(output.length+grid.length)*names.length>2000000)fail('tooManyRows');}}
  const points=[];let pointIndex=0;const stride=Math.max(1,Math.ceil((grid.length-1)/299));
  for(const t of grid){if(output.length>=100000||(output.length+1)*names.length>2000000)fail('tooManyRows');const records=group.buckets.get(t)??[],label=p.label==='right'?(fixed?t+step:shiftBoundary(t,freq,zone)):t;output.push(Object.fromEntries([...keys.map((k,i)=>[k,group.values[i]]),[name,new Date(label).toISOString()],...metrics.flatMap(c=>methods.map(m=>[c+'_'+m,finiteAggregate(records.map(row=>row[c]),m,ddof)]))]));if(chart.length<6&&(pointIndex%stride===0||pointIndex===grid.length-1))points.push({time:label,values:Object.fromEntries(metricNames.slice(0,6).map(n=>[n,output.at(-1)[n]]))});pointIndex++;}
  if(chart.length<6)chart.push({keys:group.values,points});summaries.push({keys:group.values,periods:grid.length,observed:periods.length});}
 return {columns:names,rows:output,analysis:{kind:'resample',column:p.column,periodColumn:name,names:metricNames,zone,frequency:freq,groups:summaries.length,summary:summaries.slice(0,100),excludedDates,excludedKeys,total:rows.length,output:output.length,chart,keys}};
}
